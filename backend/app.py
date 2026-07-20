import os
import sqlite3
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(WORKSPACE, ".env"))
DB_PATH = os.path.join(WORKSPACE, "soc_network.db")

# Import database connection - must be before any function that uses it
from database import get_db_connection

# Import our syncer module
from syncer import (
    sync_branch_ip_to_excel,
    sync_hq_ip_to_excel,
    sync_vpn_user_to_excel,
    sync_hospital_vpn_to_excel
)

app = FastAPI(title="NSSF SOC Network API", version="1.0.0")

# CORS middleware for React UI connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def auto_sync_loop():
    # Initial sleep to let server boot up and avoid rate limit hit during restarts
    time.sleep(60)
    while True:
        use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
        if use_gs:
            print("Starting scheduled background pull from Google Sheets...")
            try:
                from google_sheets import download_google_sheet_to_local_excel
                from parser import parse_branches, parse_hq, parse_hospital_vpns
                
                b_success, b_msg = download_google_sheet_to_local_excel('branch', "IP Address Branch.xlsx")
                h_success, h_msg = download_google_sheet_to_local_excel('hq', "NSSF HQ Users IP Address 2024.xlsx")
                hos_success, hos_msg = download_google_sheet_to_local_excel('hospital', "PRIVATE-HOSPITAL-VPN-2025.xlsx")
                
                if b_success and h_success and hos_success:
                    conn = sqlite3.connect(DB_PATH)
                    conn.row_factory = sqlite3.Row
                    parse_branches(conn)
                    parse_hq(conn)
                    parse_hospital_vpns(conn)
                    conn.close()
                    print("Scheduled background pull sync completed successfully!")
                else:
                    print(f"Scheduled background pull sync failed/skipped: Branch={b_msg}, HQ={h_msg}, Hospital={hos_msg}")
            except Exception as e:
                print(f"Error in scheduled background pull sync: {e}")
        # Sync every 5 minutes (300 seconds)
        time.sleep(300)

def telegram_polling_loop():
    import requests
    
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        print("Telegram Bot Token not set, background bot polling disabled.")
        return
        
    offset = 0
    print("Telegram bot polling thread started...")
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{bot_token}/getUpdates?offset={offset}&timeout=30"
            res = requests.get(url, timeout=35)
            if res.status_code == 200:
                updates = res.json().get("result", [])
                for update in updates:
                    update_id = update.get("update_id")
                    offset = update_id + 1
                    
                    message = update.get("message", {})
                    text = message.get("text", "")
                    chat = message.get("chat", {})
                    chat_id = chat.get("id")
                    username = chat.get("username", "")
                    
                    if text and text.startswith("/start "):
                        token = text.split(" ")[1].strip()
                        if token:
                            # Let's verify and authorize the token!
                            conn = get_db_connection()
                            cursor = conn.cursor()
                            
                            # Find matched user by telegram_username (case-insensitive) or username
                            cursor.execute("SELECT * FROM users WHERE LOWER(telegram_username) = LOWER(?) OR LOWER(username) = LOWER(?)", (username, username))
                            user = cursor.fetchone()
                            
                            if user:
                                # Update user's telegram_chat_id in users table to link it automatically if not linked!
                                cursor.execute("UPDATE users SET telegram_chat_id = ? WHERE id = ?", (str(chat_id), user['id']))
                                
                                # Update login session status to authorized
                                cursor.execute("INSERT OR REPLACE INTO login_sessions (token, status, username) VALUES (?, ?, ?)", (token, 'authorized', user['username']))
                                conn.commit()
                                
                                # Send confirmation message to user on Telegram
                                msg = (
                                    f"✅ <b>Authentication Successful!</b>\n\n"
                                    f"Hello <b>{user['full_name'] or user['username']}</b>,\n"
                                    f"You have successfully authenticated via Telegram. Your browser tab has been unlocked!"
                                )
                                requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                                    'chat_id': chat_id,
                                    'text': msg,
                                    'parse_mode': 'HTML'
                                })
                            else:
                                # Reject
                                cursor.execute("INSERT OR REPLACE INTO login_sessions (token, status) VALUES (?, ?)", (token, 'rejected'))
                                conn.commit()
                                
                                # Send error message
                                msg = (
                                    f"❌ <b>Authentication Failed</b>\n\n"
                                    f"Your Telegram username (<code>@{username}</code>) is not linked to any user in the NSSF SOC Portal.\n"
                                    f"Please contact your Administrator or link your Telegram username inside your Profile Settings first."
                                )
                                requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                                    'chat_id': chat_id,
                                    'text': msg,
                                    'parse_mode': 'HTML'
                                })
                                
                            conn.close()
            else:
                time.sleep(2)
        except Exception as e:
            print(f"Error in Telegram polling loop: {e}")
            time.sleep(5)

@app.on_event("startup")
def startup_event():
    import threading
    try:
        from parser import create_tables
        conn = get_db_connection()
        create_tables(conn)
        conn.close()
        print("Database tables initialized successfully on startup.")
    except Exception as e:
        print(f"Error initializing tables on startup: {e}")
        
    if not os.getenv("VERCEL"):
        thread1 = threading.Thread(target=auto_sync_loop, daemon=True)
        thread1.start()
        
        thread2 = threading.Thread(target=telegram_polling_loop, daemon=True)
        thread2.start()
    else:
        print("Running on Vercel: background threads disabled.")

# (get_db_connection already imported at top)

# Request models
class BranchCreate(BaseModel):
    name_kh: str
    name_en: str
    subnet: str
    mask: str
    gateway: str
    no_computer: Optional[int] = 0
    user_name: Optional[str] = ""
    position: Optional[str] = ""

class HQDeptCreate(BaseModel):
    name_en: str
    vlan_id: str
    subnet: str
    mask: str
    gateway: str
    gw_device: Optional[str] = ''
    no_computer: Optional[int] = 0
    user_name_kh: Optional[str] = ""
    user_name_en: Optional[str] = ""
    position: Optional[str] = ""

class BranchIPUpdate(BaseModel):
    user_name: Optional[str] = None
    position: Optional[str] = None
    mac_address: Optional[str] = None
    device_type: Optional[str] = None
    status: Optional[str] = None
    internet_permission: Optional[str] = None
    other: Optional[str] = None

class HQIPUpdate(BaseModel):
    user_name_kh: Optional[str] = None
    user_name_en: Optional[str] = None
    position: Optional[str] = None
    old_ip: Optional[str] = None
    subnet_mask: Optional[str] = None
    gateway: Optional[str] = None
    status: Optional[str] = None
    internet_permission: Optional[str] = None
    group_system: Optional[str] = None
    verify_update: Optional[str] = None
    other: Optional[str] = None

class VPNUserUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    department: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    purpose: Optional[str] = None
    vpn_type: Optional[str] = None
    other: Optional[str] = None

class HospitalVPNUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    isp: Optional[str] = None
    public_ip: Optional[str] = None
    subnet: Optional[str] = None
    gateway: Optional[str] = None
    lan_ip: Optional[str] = None
    lan_subnet: Optional[str] = None
    lan_gateway: Optional[str] = None
    ikey: Optional[str] = None
    tunnel: Optional[str] = None
    status: Optional[str] = None
    contact: Optional[str] = None
    year: Optional[str] = None
    device: Optional[str] = None
    other: Optional[str] = None
    reopen_requested: Optional[int] = 0
    reference_doc: Optional[str] = None

# API Routes

@app.get("/api/dashboard")
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Core counts
        cursor.execute("SELECT COUNT(*) FROM branches")
        total_branches = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM hq_departments")
        total_hq_depts = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM vpn_remote_users")
        total_vpn_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM hospital_vpns")
        total_s2s_vpns = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM switches")
        total_switches = cursor.fetchone()[0]
        
        # IP Allocations overview
        cursor.execute("""
            SELECT COUNT(*) FROM branch_ips 
            WHERE (user_name IS NOT NULL AND user_name != '' AND user_name != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
        """)
        allocated_branch_ips = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM hq_ips 
            WHERE (user_name_kh IS NOT NULL AND user_name_kh != '' AND user_name_kh != 'None')
               OR (user_name_en IS NOT NULL AND user_name_en != '' AND user_name_en != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
        """)
        allocated_hq_ips = cursor.fetchone()[0]
        
        # Subnet list with utilization
        cursor.execute("SELECT id, name_kh, name_en, subnet, gateway FROM branches")
        branches = [dict(r) for r in cursor.fetchall()]
        for b in branches:
            cursor.execute("""
                SELECT COUNT(*) FROM branch_ips 
                WHERE branch_id = ? 
                  AND ((user_name IS NOT NULL AND user_name != '' AND user_name != 'None')
                       OR (position IS NOT NULL AND position != '' AND position != 'None'))
            """, (b['id'],))
            b['used_ips'] = cursor.fetchone()[0]
            b['total_ips'] = 254
            
        cursor.execute("SELECT id, name_en, vlan_id, subnet, gateway FROM hq_departments")
        depts = [dict(r) for r in cursor.fetchall()]
        for d in depts:
            cursor.execute("""
                SELECT COUNT(*) FROM hq_ips 
                WHERE dept_id = ? 
                  AND ((user_name_kh IS NOT NULL AND user_name_kh != '' AND user_name_kh != 'None')
                       OR (user_name_en IS NOT NULL AND user_name_en != '' AND user_name_en != 'None')
                       OR (position IS NOT NULL AND position != '' AND position != 'None'))
            """, (d['id'],))
            d['used_ips'] = cursor.fetchone()[0]
            d['total_ips'] = 254

        # Active VPN users count (approx based on Status)
        cursor.execute("SELECT COUNT(*) FROM vpn_remote_users WHERE status LIKE '%active%' OR status LIKE '%using%'")
        active_vpn_users = cursor.fetchone()[0]
        
        # Active Hospital/Bank VPNs count (UP status)
        cursor.execute("SELECT COUNT(*) FROM hospital_vpns WHERE status LIKE '%UP%' or status LIKE '%using%'")
        active_s2s_tunnels = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "counts": {
                "branches": total_branches,
                "hq_departments": total_hq_depts,
                "vpn_users": total_vpn_users,
                "s2s_vpns": total_s2s_vpns,
                "switches": total_switches
            },
            "allocations": {
                "branch_allocated": allocated_branch_ips,
                "hq_allocated": allocated_hq_ips,
                "active_vpn_users": active_vpn_users,
                "active_s2s_tunnels": active_s2s_tunnels
            },
            "branch_list": branches[:8], # limit dashboard preview
            "hq_list": depts[:8]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
def global_search(q: str = Query(..., min_length=1)):
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
    
    q_wild = f"%{q}%"
    
    try:
        # Search branch IPs
        cursor.execute("""
        SELECT b.id as branch_id, b.name_kh, b.name_en, bi.ip, bi.user_name, bi.position, bi.mac_address, bi.device_type, bi.status
        FROM branch_ips bi
        JOIN branches b ON bi.branch_id = b.id
        WHERE bi.ip LIKE ? OR bi.user_name LIKE ? OR bi.mac_address LIKE ? OR bi.position LIKE ?
        LIMIT 20
        """, (q_wild, q_wild, q_wild, q_wild))
        for r in cursor.fetchall():
            results.append({
                "type": "branch_ip",
                "title": f"IP {r['ip']} - {r['user_name'] or 'Unknown'}",
                "subtitle": f"Branch: {r['name_kh']} ({r['name_en']}) | Pos: {r['position'] or ''}",
                "ip": r['ip'],
                "mac": r['mac_address'],
                "status": r['status'],
                "link_id": r['branch_id']
            })
            
        # Search HQ IPs
        cursor.execute("""
        SELECT d.id as dept_id, d.name_en as dept_name, d.vlan_id, hi.ip, hi.user_name_kh, hi.user_name_en, hi.position, hi.status
        FROM hq_ips hi
        JOIN hq_departments d ON hi.dept_id = d.id
        WHERE hi.ip LIKE ? OR hi.user_name_kh LIKE ? OR hi.user_name_en LIKE ? OR hi.position LIKE ?
        LIMIT 20
        """, (q_wild, q_wild, q_wild, q_wild))
        for r in cursor.fetchall():
            name = r['user_name_en'] or r['user_name_kh'] or 'Unknown'
            results.append({
                "type": "hq_ip",
                "title": f"IP {r['ip']} - {name}",
                "subtitle": f"HQ Dept: {r['dept_name']} (VLAN {r['vlan_id']}) | Pos: {r['position'] or ''}",
                "ip": r['ip'],
                "status": r['status'],
                "link_id": r['dept_id']
            })
            
        # Search VPN Remote Users
        cursor.execute("""
        SELECT id, name, username, department, company, status, vpn_type
        FROM vpn_remote_users
        WHERE name LIKE ? OR username LIKE ? OR department LIKE ? OR company LIKE ?
        LIMIT 20
        """, (q_wild, q_wild, q_wild, q_wild))
        for r in cursor.fetchall():
            results.append({
                "type": "vpn",
                "title": f"VPN: {r['username'] or 'No Username'} ({r['name']})",
                "subtitle": f"Dept/Co: {r['department'] or ''} / {r['company'] or ''} | Type: {r['vpn_type'] or ''}",
                "status": r['status'],
                "link_id": r['id']
            })
            
        # Search Hospital/Bank VPNs
        cursor.execute("""
        SELECT id, name, public_ip, lan_ip, vpn_type, status
        FROM hospital_vpns
        WHERE name LIKE ? OR public_ip LIKE ? OR lan_ip LIKE ?
        LIMIT 20
        """, (q_wild, q_wild, q_wild))
        for r in cursor.fetchall():
            results.append({
                "type": "s2s_vpn",
                "title": f"S2S VPN: {r['name']} ({r['vpn_type']})",
                "subtitle": f"Public: {r['public_ip'] or ''} | LAN: {r['lan_ip'] or ''}",
                "status": r['status'],
                "link_id": r['id']
            })
            
        # Search Switches
        cursor.execute("""
        SELECT id, name, ip_management, model, permission FROM switches
        WHERE name LIKE ? OR ip_management LIKE ? OR model LIKE ?
        LIMIT 10
        """, (q_wild, q_wild, q_wild))
        for r in cursor.fetchall():
            results.append({
                "type": "switch",
                "title": f"Switch: {r['name']}",
                "subtitle": f"IP: {r['ip_management']} | Model: {r['model'] or ''}",
                "status": r['permission'],
                "link_id": r['id']
            })
            
        conn.close()
        return results
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/branches")
def get_branches():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM branches ORDER BY no ASC")
        branches = [dict(row) for row in cursor.fetchall()]
        
        # Calculate used IPs
        for b in branches:
            cursor.execute("""
                SELECT COUNT(*) FROM branch_ips 
                WHERE branch_id = ? 
                  AND ((user_name IS NOT NULL AND user_name != '' AND user_name != 'None')
                       OR (position IS NOT NULL AND position != '' AND position != 'None'))
            """, (b['id'],))
            b['used_ips'] = cursor.fetchone()[0]
            b['total_ips'] = 254
            
        conn.close()
        return branches
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/branches")
def create_branch(b_data: BranchCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if subnet base prefix already exists in database
        parts = b_data.subnet.strip().split('.')
        if len(parts) < 3:
            conn.close()
            raise HTTPException(status_code=400, detail="Format Subnet មិនត្រឹមត្រូវឡើយ (ត្រូវមានទម្រង់ x.y.z.0)")
        base_prefix = f"{parts[0]}.{parts[1]}.{parts[2]}"
        
        cursor.execute("SELECT id, name_kh, subnet FROM branches")
        existing = cursor.fetchall()
        for row in existing:
            ex_subnet = row['subnet'].strip()
            ex_parts = ex_subnet.split('.')
            if len(ex_parts) >= 3:
                ex_prefix = f"{ex_parts[0]}.{ex_parts[1]}.{ex_parts[2]}"
                if ex_prefix == base_prefix:
                    conn.close()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Subnet prefix '{base_prefix}.x' ត្រូវបានប្រើប្រាស់រួចហើយដោយសាខា '{row['name_kh']}' ({ex_subnet})"
                    )
            
        # Get next 'no'
        cursor.execute("SELECT MAX(no) FROM branches")
        max_no = cursor.fetchone()[0] or 0
        next_no = max_no + 1
        
        cursor.execute("""
        INSERT INTO branches (no, name_kh, name_en, subnet, mask, gateway, no_computer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            next_no, 
            b_data.name_kh.strip(), 
            b_data.name_en.strip(), 
            b_data.subnet.strip(), 
            b_data.mask.strip(), 
            b_data.gateway.strip(), 
            b_data.no_computer
        ))
        
        branch_id = cursor.lastrowid
        
        # Generate 254 IP addresses
        parts = b_data.subnet.strip().split('.')
        if len(parts) >= 3:
            base_ip = f"{parts[0]}.{parts[1]}.{parts[2]}"
            for i in range(1, 255):
                ip_str = f"{base_ip}.{i}"
                if i == 2 and (b_data.user_name or b_data.position):
                    cursor.execute("""
                    INSERT INTO branch_ips (branch_id, no, ip, status, user_name, position)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (branch_id, i, ip_str, 'Using', b_data.user_name.strip() if b_data.user_name else None, b_data.position.strip() if b_data.position else None))
                else:
                    cursor.execute("""
                    INSERT INTO branch_ips (branch_id, no, ip, status)
                    VALUES (?, ?, ?, ?)
                    """, (branch_id, i, ip_str, 'Available'))
                
        conn.commit()
        conn.close()
        return {"status": "success", "branch_id": branch_id}
    except HTTPException as he:
        conn.close()
        raise he
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hq")
def create_hq_dept(h_data: HQDeptCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if subnet base prefix already exists in database
        parts = h_data.subnet.strip().split('.')
        if len(parts) < 3:
            conn.close()
            raise HTTPException(status_code=400, detail="Format Subnet មិនត្រឹមត្រូវឡើយ (ត្រូវមានទម្រង់ x.y.z.0)")
        base_prefix = f"{parts[0]}.{parts[1]}.{parts[2]}"
        
        cursor.execute("SELECT id, name_en, subnet FROM hq_departments")
        existing = cursor.fetchall()
        for row in existing:
            ex_subnet = row['subnet'].strip()
            ex_parts = ex_subnet.split('.')
            if len(ex_parts) >= 3:
                ex_prefix = f"{ex_parts[0]}.{ex_parts[1]}.{ex_parts[2]}"
                if ex_prefix == base_prefix:
                    conn.close()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Subnet prefix '{base_prefix}.x' ត្រូវបានប្រើប្រាស់រួចហើយដោយនាយកដ្ឋាន '{row['name_en']}' ({ex_subnet})"
                    )
            
        # Get next 'no'
        cursor.execute("SELECT MAX(no) FROM hq_departments")
        max_no = cursor.fetchone()[0] or 0
        next_no = max_no + 1
        
        cursor.execute("""
        INSERT INTO hq_departments (no, name_en, vlan_id, subnet, mask, gateway, gw_device, no_computer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            next_no,
            h_data.name_en.strip(),
            h_data.vlan_id.strip(),
            h_data.subnet.strip(),
            h_data.mask.strip(),
            h_data.gateway.strip(),
            h_data.gw_device.strip(),
            h_data.no_computer
        ))
        
        dept_id = cursor.lastrowid
        
        # Generate 254 IP addresses
        parts = h_data.subnet.strip().split('.')
        if len(parts) >= 3:
            base_ip = f"{parts[0]}.{parts[1]}.{parts[2]}"
            for i in range(1, 255):
                ip_str = f"{base_ip}.{i}"
                if i == 2 and (h_data.user_name_kh or h_data.user_name_en or h_data.position):
                    cursor.execute("""
                    INSERT INTO hq_ips (dept_id, no, ip, status, user_name_kh, user_name_en, position)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        dept_id, 
                        i, 
                        ip_str, 
                        'USING', 
                        h_data.user_name_kh.strip() if h_data.user_name_kh else None, 
                        h_data.user_name_en.strip() if h_data.user_name_en else None, 
                        h_data.position.strip() if h_data.position else None
                    ))
                else:
                    cursor.execute("""
                    INSERT INTO hq_ips (dept_id, no, ip, status)
                    VALUES (?, ?, ?, ?)
                    """, (dept_id, i, ip_str, 'Available'))
                
        conn.commit()
        conn.close()
        return {"status": "success", "dept_id": dept_id}
    except HTTPException as he:
        conn.close()
        raise he
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/branches/{id}")
def get_branch_details(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM branches WHERE id = ?", (id,))
        branch = cursor.fetchone()
        if not branch:
            conn.close()
            raise HTTPException(status_code=404, detail="Branch not found")
            
        branch_dict = dict(branch)
        
        # Fetch allocated IPs
        cursor.execute("SELECT * FROM branch_ips WHERE branch_id = ?", (id,))
        allocated_ips_by_no = {}
        for row in cursor.fetchall():
            row_dict = dict(row)
            no_idx = row_dict.get('no')
            if no_idx:
                allocated_ips_by_no[int(no_idx)] = row_dict
            else:
                ip_str = row_dict.get('ip')
                if ip_str and '.' in ip_str:
                    try:
                        last_octet = int(ip_str.split('.')[-1])
                        allocated_ips_by_no[last_octet] = row_dict
                    except:
                        pass
        
        # Construct full 254 IPs range
        subnet_ip = branch_dict['subnet'] # e.g. "192.168.141.0"
        if not subnet_ip or '.' not in subnet_ip:
            conn.close()
            return {"branch": branch_dict, "ips": list(allocated_ips_by_no.values())}
            
        parts = subnet_ip.split('.')
        ip_prefix = f"{parts[0]}.{parts[1]}.{parts[2]}."
        
        full_ips_list = []
        
        # Gateways are typically .1, start host allocation from .1 to .254
        # Add .1 first as gateway
        if 1 in allocated_ips_by_no:
            full_ips_list.append(allocated_ips_by_no[1])
        else:
            full_ips_list.append({
                "branch_id": id,
                "no": 1,
                "ip": f"{ip_prefix}1",
                "user_name": "Default Gateway",
                "position": "Network Router",
                "mac_address": "",
                "device_type": "Gateway",
                "status": "Using",
                "internet_permission": "Disabled",
                "other": ""
            })
            
        for i in range(2, 255):
            if i in allocated_ips_by_no:
                full_ips_list.append(allocated_ips_by_no[i])
            else:
                full_ips_list.append({
                    "branch_id": id,
                    "no": i,
                    "ip": f"{ip_prefix}{i}",
                    "user_name": None,
                    "position": None,
                    "mac_address": None,
                    "device_type": None,
                    "status": "Available",
                    "internet_permission": None,
                    "other": None
                })
                
        conn.close()
        return {
            "branch": branch_dict,
            "ips": full_ips_list
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/branches/{id}/ips")
def update_branch_ip(id: int, ip_data: BranchIPUpdate, ip: str = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if branch exists
        cursor.execute("SELECT id FROM branches WHERE id = ?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Branch not found")
            
        # Check if entry already exists in SQLite
        cursor.execute("SELECT id FROM branch_ips WHERE ip = ?", (ip,))
        row = cursor.fetchone()
        
        if row:
            # Update existing
            cursor.execute("""
            UPDATE branch_ips
            SET user_name = ?, position = ?, mac_address = ?, device_type = ?, status = ?, internet_permission = ?, other = ?
            WHERE ip = ?
            """, (
                ip_data.user_name,
                ip_data.position,
                ip_data.mac_address,
                ip_data.device_type,
                ip_data.status,
                ip_data.internet_permission,
                ip_data.other,
                ip
            ))
        else:
            # Insert new record
            cursor.execute("""
            INSERT INTO branch_ips (branch_id, ip, user_name, position, mac_address, device_type, status, internet_permission, other)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                id,
                ip,
                ip_data.user_name,
                ip_data.position,
                ip_data.mac_address,
                ip_data.device_type,
                ip_data.status,
                ip_data.internet_permission,
                ip_data.other
            ))
            
        conn.commit()
        conn.close()
        
        # Now sync with the Excel file using the helper
        updates = ip_data.dict(exclude_unset=True)
        success, msg = sync_branch_ip_to_excel(id, ip, updates)
        
        return {
            "status": "success",
            "db_update": "success",
            "excel_sync": "success" if success else f"failed ({msg})"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hq")
def get_hq_depts():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM hq_departments ORDER BY no ASC")
        depts = [dict(row) for row in cursor.fetchall()]
        
        # Calculate used IPs
        for d in depts:
            cursor.execute("""
                SELECT COUNT(*) FROM hq_ips 
                WHERE dept_id = ? 
                  AND ((user_name_kh IS NOT NULL AND user_name_kh != '' AND user_name_kh != 'None')
                       OR (user_name_en IS NOT NULL AND user_name_en != '' AND user_name_en != 'None')
                       OR (position IS NOT NULL AND position != '' AND position != 'None'))
            """, (d['id'],))
            d['used_ips'] = cursor.fetchone()[0]
            d['total_ips'] = 254
            
        conn.close()
        return depts
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hq/{id}")
def get_hq_dept_details(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM hq_departments WHERE id = ?", (id,))
        dept = cursor.fetchone()
        if not dept:
            conn.close()
            raise HTTPException(status_code=404, detail="Department not found")
            
        dept_dict = dict(dept)
        
        # Fetch allocated IPs
        cursor.execute("SELECT * FROM hq_ips WHERE dept_id = ?", (id,))
        allocated_ips_by_no = {}
        for row in cursor.fetchall():
            row_dict = dict(row)
            no_idx = row_dict.get('no')
            if no_idx:
                allocated_ips_by_no[int(no_idx)] = row_dict
            else:
                ip_str = row_dict.get('ip')
                if ip_str and '.' in ip_str:
                    try:
                        last_octet = int(ip_str.split('.')[-1])
                        allocated_ips_by_no[last_octet] = row_dict
                    except:
                        pass
        
        # Construct full 254 IPs range
        subnet_ip = dept_dict['subnet'] # e.g. "172.19.2.0"
        if not subnet_ip or '.' not in subnet_ip:
            conn.close()
            return {"department": dept_dict, "ips": list(allocated_ips_by_no.values())}
            
        parts = subnet_ip.split('.')
        ip_prefix = f"{parts[0]}.{parts[1]}.{parts[2]}."
        
        full_ips_list = []
        
        # Gateway check
        if 1 in allocated_ips_by_no:
            full_ips_list.append(allocated_ips_by_no[1])
        else:
            full_ips_list.append({
                "dept_id": id,
                "no": 1,
                "ip": f"{ip_prefix}1",
                "user_name_kh": "ច្រកទ្វារលំនាំដើម",
                "user_name_en": "Default Gateway",
                "position": "Gateway Router",
                "old_ip": "",
                "subnet_mask": "255.255.255.0",
                "gateway": "",
                "status": "Using",
                "internet_permission": "Disabled",
                "group_system": "",
                "verify_update": "",
                "other": ""
            })
            
        for i in range(2, 255):
            if i in allocated_ips_by_no:
                full_ips_list.append(allocated_ips_by_no[i])
            else:
                full_ips_list.append({
                    "dept_id": id,
                    "no": i,
                    "ip": f"{ip_prefix}{i}",
                    "user_name_kh": None,
                    "user_name_en": None,
                    "position": None,
                    "old_ip": None,
                    "subnet_mask": None,
                    "gateway": None,
                    "status": "Available",
                    "internet_permission": None,
                    "group_system": None,
                    "verify_update": None,
                    "other": None
                })
                
        conn.close()
        return {
            "department": dept_dict,
            "ips": full_ips_list
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hq/{id}/ips")
def update_hq_ip(id: int, ip_data: HQIPUpdate, ip: str = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if dept exists
        cursor.execute("SELECT id FROM hq_departments WHERE id = ?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Department not found")
            
        # Check if entry already exists in SQLite
        cursor.execute("SELECT id FROM hq_ips WHERE ip = ?", (ip,))
        row = cursor.fetchone()
        
        if row:
            # Update existing
            cursor.execute("""
            UPDATE hq_ips
            SET user_name_kh = ?, user_name_en = ?, position = ?, old_ip = ?, subnet_mask = ?, gateway = ?, status = ?, internet_permission = ?, group_system = ?, verify_update = ?, other = ?
            WHERE ip = ?
            """, (
                ip_data.user_name_kh,
                ip_data.user_name_en,
                ip_data.position,
                ip_data.old_ip,
                ip_data.subnet_mask,
                ip_data.gateway,
                ip_data.status,
                ip_data.internet_permission,
                ip_data.group_system,
                ip_data.verify_update,
                ip_data.other,
                ip
            ))
        else:
            # Insert new
            cursor.execute("""
            INSERT INTO hq_ips (dept_id, ip, user_name_kh, user_name_en, position, old_ip, subnet_mask, gateway, status, internet_permission, group_system, verify_update, other)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                id,
                ip,
                ip_data.user_name_kh,
                ip_data.user_name_en,
                ip_data.position,
                ip_data.old_ip,
                ip_data.subnet_mask,
                ip_data.gateway,
                ip_data.status,
                ip_data.internet_permission,
                ip_data.group_system,
                ip_data.verify_update,
                ip_data.other
            ))
            
        conn.commit()
        conn.close()
        
        # Now sync with the Excel file using the helper
        updates = ip_data.dict(exclude_unset=True)
        success, msg = sync_hq_ip_to_excel(id, ip, updates)
        
        return {
            "status": "success",
            "db_update": "success",
            "excel_sync": "success" if success else f"failed ({msg})"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/switches")
def get_switches():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM switches ORDER BY no ASC")
        switches = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return switches
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vpn")
def get_vpn_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM vpn_remote_users ORDER BY id ASC")
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return users
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vpn")
def create_vpn_user(v_data: VPNUserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Get next no for the department
        cursor.execute("SELECT MAX(no) FROM vpn_remote_users WHERE department = ?", (v_data.department or '',))
        row = cursor.fetchone()
        next_no = 1.0
        if row and row[0]:
            try:
                next_no = float(row[0]) + 1.0
            except:
                pass
                
        cursor.execute("""
        INSERT INTO vpn_remote_users (no, name, position, username, password, department, company, status, purpose, vpn_type, other)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            next_no,
            v_data.name,
            v_data.position,
            v_data.username,
            v_data.password,
            v_data.department,
            v_data.company,
            v_data.status,
            v_data.purpose,
            v_data.vpn_type,
            v_data.other
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "id": new_id,
            "db_update": "success",
            "excel_sync": "skipped (new user)"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vpn/{id}")
def update_vpn_user(id: int, v_data: VPNUserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM vpn_remote_users WHERE id = ?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="VPN user not found")
            
        # Update SQLite
        cursor.execute("""
        UPDATE vpn_remote_users
        SET name = ?, position = ?, username = ?, password = ?, department = ?, company = ?, status = ?, purpose = ?, vpn_type = ?, other = ?
        WHERE id = ?
        """, (
            v_data.name,
            v_data.position,
            v_data.username,
            v_data.password,
            v_data.department,
            v_data.company,
            v_data.status,
            v_data.purpose,
            v_data.vpn_type,
            v_data.other,
            id
        ))
        
        conn.commit()
        conn.close()
        
        # Sync to Excel
        updates = v_data.dict(exclude_unset=True)
        success, msg = sync_vpn_user_to_excel(id, updates)
        
        return {
            "status": "success",
            "db_update": "success",
            "excel_sync": "success" if success else f"failed ({msg})"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hospital_vpns")
def get_hospital_vpns(type: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if type:
            cursor.execute("SELECT * FROM hospital_vpns WHERE vpn_type = ? ORDER BY id ASC", (type,))
        else:
            cursor.execute("SELECT * FROM hospital_vpns ORDER BY id ASC")
        vpns = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return vpns
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hospital_vpns/{id}")
def update_hospital_vpn(id: int, v_data: HospitalVPNUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM hospital_vpns WHERE id = ?", (id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="VPN config not found")
            
        cursor.execute("""
        UPDATE hospital_vpns
        SET name = ?, address = ?, isp = ?, public_ip = ?, subnet = ?, gateway = ?, lan_ip = ?, lan_subnet = ?, lan_gateway = ?, ikey = ?, tunnel = ?, status = ?, contact = ?, year = ?, device = ?, other = ?, reopen_requested = ?, reference_doc = ?
        WHERE id = ?
        """, (
            v_data.name,
            v_data.address,
            v_data.isp,
            v_data.public_ip,
            v_data.subnet,
            v_data.gateway,
            v_data.lan_ip,
            v_data.lan_subnet,
            v_data.lan_gateway,
            v_data.ikey,
            v_data.tunnel,
            v_data.status,
            v_data.contact,
            v_data.year,
            v_data.device,
            v_data.other,
            v_data.reopen_requested,
            v_data.reference_doc,
            id
        ))
        
        conn.commit()
        conn.close()
        
        # Sync to Excel
        updates = v_data.dict(exclude_unset=True)
        success, msg = sync_hospital_vpn_to_excel(id, updates)
        
        return {
            "status": "success",
            "db_update": "success",
            "excel_sync": "success" if success else f"failed ({msg})"
        }
    except HTTPException:
        raise
    except Exception as e:
        try:
            conn.close()
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/public_ips")
def get_public_ips():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM public_ip_mappings ORDER BY id ASC")
        mappings = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM public_ip_external ORDER BY id ASC")
        external = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return {
            "mappings": mappings,
            "external": external
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

class GoogleSheetWebhookPayload(BaseModel):
    sheet_type: str  # 'branch' or 'hq'
    sheet_name: str
    ip: str
    updates: Dict[str, Any]

@app.get("/api/sync/status")
def get_sync_status():
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    cred_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "backend/google_credentials.json")
    if not os.path.isabs(cred_file):
        cred_file = os.path.join(WORKSPACE, cred_file)
    
    has_creds = os.path.exists(cred_file)
    branch_sheet_id = os.getenv("BRANCH_SPREADSHEET_ID")
    hq_sheet_id = os.getenv("HQ_SPREADSHEET_ID")
    
    return {
        "use_google_sheets": use_gs,
        "has_credentials_file": has_creds,
        "branch_configured": bool(branch_sheet_id),
        "hq_configured": bool(hq_sheet_id)
    }

@app.post("/api/sync/pull")
def pull_from_google_sheets():
    from google_sheets import download_google_sheet_to_local_excel
    from parser import parse_branches, parse_hq
    
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    if not use_gs:
        raise HTTPException(status_code=400, detail="Google Sheets Sync is not enabled in settings")
        
    try:
        # 1. Download Branch Excel
        b_success, b_msg = download_google_sheet_to_local_excel('branch', "IP Address Branch.xlsx")
        if not b_success:
            raise Exception(f"Failed to download Branch sheet: {b_msg}")
            
        # 2. Download HQ Excel
        h_success, h_msg = download_google_sheet_to_local_excel('hq', "NSSF HQ Users IP Address 2024.xlsx")
        if not h_success:
            raise Exception(f"Failed to download HQ sheet: {h_msg}")
            
        # 3. Re-parse Excel files into SQLite database
        conn = get_db_connection()
        parse_branches(conn)
        parse_hq(conn)
        
        return {
            "status": "success",
            "message": "Successfully pulled all worksheets from Google Sheets and synchronized the database."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhooks/google-sheets")
def google_sheets_webhook(payload: GoogleSheetWebhookPayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        b_id = None
        d_id = None
        # Find target record and update DB
        if payload.sheet_type == 'branch':
            # Get branch ID from sheet name
            cursor.execute("SELECT id FROM branches WHERE sheet_name = ?", (payload.sheet_name,))
            branch = cursor.fetchone()
            if not branch:
                conn.close()
                raise HTTPException(status_code=404, detail=f"Branch sheet '{payload.sheet_name}' not found")
            b_id = branch['id']
            
            # Build SQL Update
            sql_fields = []
            params = []
            valid_fields = ['user_name', 'position', 'mac_address', 'device_type', 'status', 'internet_permission', 'other']
            for k, v in payload.updates.items():
                if k in valid_fields:
                    sql_fields.append(f"{k} = ?")
                    params.append(v)
                    
            if sql_fields:
                params.append(b_id)
                params.append(payload.ip)
                cursor.execute(f"""
                    UPDATE branch_ips
                    SET {', '.join(sql_fields)}
                    WHERE branch_id = ? AND ip = ?
                """, tuple(params))
                
        elif payload.sheet_type == 'hq':
            # Get dept ID from sheet name
            cursor.execute("SELECT id FROM hq_departments WHERE sheet_name = ?", (payload.sheet_name,))
            dept = cursor.fetchone()
            if not dept:
                conn.close()
                raise HTTPException(status_code=404, detail=f"HQ department sheet '{payload.sheet_name}' not found")
            d_id = dept['id']
            
            # Build SQL Update
            sql_fields = []
            params = []
            valid_fields = ['user_name_kh', 'user_name_en', 'position', 'old_ip', 'subnet_mask', 'gateway', 'status', 'internet_permission', 'group_system', 'verify_update', 'other']
            for k, v in payload.updates.items():
                if k in valid_fields:
                    sql_fields.append(f"{k} = ?")
                    params.append(v)
                    
            if sql_fields:
                params.append(d_id)
                params.append(payload.ip)
                cursor.execute(f"""
                    UPDATE hq_ips
                    SET {', '.join(sql_fields)}
                    WHERE dept_id = ? AND ip = ?
                """, tuple(params))
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="Invalid sheet_type. Must be 'branch' or 'hq'.")
            
        conn.commit()
        conn.close()
        
        # Sync updates back to local Excel cache so they remain identical
        try:
            if payload.sheet_type == 'branch' and b_id:
                from syncer import sync_branch_ip_to_excel
                sync_branch_ip_to_excel(b_id, payload.ip, payload.updates)
            elif payload.sheet_type == 'hq' and d_id:
                from syncer import sync_hq_ip_to_excel
                sync_hq_ip_to_excel(d_id, payload.ip, payload.updates)
        except Exception as cache_err:
            print(f"Failed to sync webhook update to local Excel cache: {cache_err}")
            
        return {"status": "success", "message": "Successfully synchronized Google Sheet edit to local database and cache."}
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))

# Local Document Storage Endpoints (Bypassing cloud quota limitations)
STORED_FILES_DIR = os.path.join(WORKSPACE, "backend", "stored_files")
os.makedirs(STORED_FILES_DIR, exist_ok=True)

@app.get("/api/drive/files")
def get_drive_files():
    import mimetypes
    import datetime
    files = []
    try:
        for filename in os.listdir(STORED_FILES_DIR):
            filepath = os.path.join(STORED_FILES_DIR, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                mime_type, _ = mimetypes.guess_type(filepath)
                dt = datetime.datetime.fromtimestamp(stat.st_mtime)
                iso_time = dt.isoformat()
                
                # Make safe webViewLink pointing back to local server download endpoint
                webViewLink = f"http://127.0.0.1:8000/api/drive/files/download/{filename}"
                
                files.append({
                    "id": filename,
                    "name": filename,
                    "mimeType": mime_type or "application/octet-stream",
                    "size": stat.st_size,
                    "createdTime": iso_time,
                    "webViewLink": webViewLink
                })
        # Sort files by createdTime descending
        files.sort(key=lambda x: x["createdTime"], reverse=True)
        return {"status": "success", "files": files, "folder_id": "Local Storage (ម៉ាស៊ីន Server ផ្ទាល់)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drive/upload")
def upload_file(file: UploadFile = File(...)):
    try:
        import datetime
        filename = file.filename
        base, ext = os.path.splitext(filename)
        counter = 1
        filepath = os.path.join(STORED_FILES_DIR, filename)
        while os.path.exists(filepath):
            filename = f"{base}_{counter}{ext}"
            filepath = os.path.join(STORED_FILES_DIR, filename)
            counter += 1
            
        with open(filepath, "wb") as f:
            f.write(file.file.read())
            
        stat = os.stat(filepath)
        dt = datetime.datetime.fromtimestamp(stat.st_mtime)
        
        return {
            "status": "success",
            "file": {
                "id": filename,
                "name": filename,
                "webViewLink": f"http://127.0.0.1:8000/api/drive/files/download/{filename}",
                "size": stat.st_size,
                "createdTime": dt.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/drive/files/{file_id}")
def delete_file(file_id: str):
    try:
        safe_filename = os.path.basename(file_id)
        filepath = os.path.join(STORED_FILES_DIR, safe_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return {"status": "success"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse
@app.get("/api/drive/files/download/{filename}")
def download_local_file(filename: str):
    try:
        safe_filename = os.path.basename(filename)
        filepath = os.path.join(STORED_FILES_DIR, safe_filename)
        if os.path.exists(filepath):
            return FileResponse(filepath, content_disposition_type="inline")
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TelegramSendMessagePayload(BaseModel):
    message: str

@app.post("/api/telegram/send")
def send_telegram(payload: TelegramSendMessagePayload):
    from telegram import send_telegram_message
    success, msg = send_telegram_message(payload.message)
    if not success:
        raise HTTPException(status_code=500, detail=msg)
    return {"status": "success", "message": msg}

class SettingsUpdatePayload(BaseModel):
    settings: Dict[str, str]

@app.get("/api/settings")
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings")
    settings = {row['key']: row['value'] for row in cursor.fetchall()}
    conn.close()
    return {"status": "success", "settings": settings}

@app.put("/api/settings")
def update_settings(payload: SettingsUpdatePayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for key, val in payload.settings.items():
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, val))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Settings updated successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

# User Management request payloads
class UserLoginPayload(BaseModel):
    username: str
    password: str

class UserCreatePayload(BaseModel):
    username: str
    password: str
    role: str
    full_name: Optional[str] = ""
    email: Optional[str] = None
    telegram_username: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None

class UserUpdatePayload(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    telegram_username: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None

class UserProfileUpdatePayload(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    theme: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None

class TelegramLoginPayload(BaseModel):
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None

@app.post("/api/auth/telegram_session/create")
def telegram_session_create(request: Request):
    import uuid
    token = str(uuid.uuid4())
    
    # Setup webhook dynamically in Vercel/Production environments
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if bot_token:
        host = request.url.netloc
        if "localhost" not in host and "127.0.0.1" not in host:
            proto = "https"
            webhook_url = f"{proto}://{host}/api/telegram/webhook"
            try:
                import requests
                requests.post(f"https://api.telegram.org/bot{bot_token}/setWebhook", json={
                    "url": webhook_url
                }, timeout=5)
            except Exception as e:
                print(f"Failed to set Telegram webhook: {e}")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO login_sessions (token, status) VALUES (?, ?)", (token, 'pending'))
    conn.commit()
    conn.close()
    return {"status": "success", "token": token}

@app.post("/api/telegram/webhook")
def telegram_webhook(payload: dict):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return {"status": "skipped"}
        
    message = payload.get("message", {})
    text = message.get("text", "")
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    from_user = message.get("from", {})
    username = from_user.get("username", "")
    
    if text and text.startswith("/start "):
        token = text.split(" ")[1].strip()
        if token:
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                # Find matched user by telegram_username (case-insensitive) or username
                cursor.execute("SELECT * FROM users WHERE LOWER(telegram_username) = LOWER(?) OR LOWER(username) = LOWER(?)", (username, username))
                user = cursor.fetchone()
                
                if user:
                    # Update user's telegram_chat_id in users table to link it automatically if not linked!
                    cursor.execute("UPDATE users SET telegram_chat_id = ? WHERE id = ?", (str(chat_id), user['id']))
                    
                    # Update login session status to authorized
                    cursor.execute("INSERT OR REPLACE INTO login_sessions (token, status, username) VALUES (?, ?, ?)", (token, 'authorized', user['username']))
                    conn.commit()
                    
                    # Send confirmation message to user on Telegram
                    msg = (
                        f"✅ <b>Authentication Successful!</b>\n\n"
                        f"Hello <b>{user['full_name'] or user['username']}</b>,\n"
                        f"You have successfully authenticated via Telegram. Your browser tab has been unlocked!"
                    )
                    import requests
                    requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                        'chat_id': chat_id,
                        'text': msg,
                        'parse_mode': 'HTML'
                    }, timeout=5)
                else:
                    # Reject
                    cursor.execute("INSERT OR REPLACE INTO login_sessions (token, status) VALUES (?, ?)", (token, 'rejected'))
                    conn.commit()
                    
                    # Send error message
                    msg = (
                        f"❌ <b>Authentication Failed</b>\n\n"
                        f"Your Telegram username (<code>@{username}</code>) is not linked to any user in the NSSF SOC Portal.\n"
                        f"Please contact your Administrator or link your Telegram username inside your Profile Settings first."
                    )
                    import requests
                    requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                        'chat_id': chat_id,
                        'text': msg,
                        'parse_mode': 'HTML'
                    }, timeout=5)
                    
                conn.close()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                conn.close()
                print(f"Error in Telegram Webhook: {e}")
    return {"status": "ok"}

@app.get("/api/auth/telegram_session/status/{token}")
def telegram_session_status(token: str, request: Request):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM login_sessions WHERE token = ?", (token,))
    session = cursor.fetchone()
    
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session['status'] == 'authorized':
        # Fetch the matching authorized user
        username = session['username']
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        import json
        import datetime
        client_ip = request.client.host if request.client else '127.0.0.1'
        last_login = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        cursor.execute("UPDATE users SET client_ip = ?, last_login = ? WHERE id = ?", (client_ip, last_login, user['id']))
        # Delete session since it's already used to log in!
        cursor.execute("DELETE FROM login_sessions WHERE token = ?", (token,))
        conn.commit()
        
        perms = {}
        if user['permissions']:
            try:
                perms = json.loads(user['permissions'])
            except Exception:
                pass
                
        user_data = {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name'],
            "permissions": perms,
            "email": user['email'],
            "phone": user['phone'],
            "department": user['department'],
            "language": user['language'] or 'English',
            "timezone": user['timezone'] or '(GMT+07:00) Bangkok',
            "date_format": user['date_format'] or 'dd/mm/yyyy',
            "theme": user['theme'] or 'Light',
            "client_ip": client_ip,
            "last_login": last_login,
            "telegram_chat_id": user['telegram_chat_id'],
            "telegram_username": user['telegram_username']
        }
        conn.close()
        return {"status": "authorized", "user": user_data}
        
    elif session['status'] == 'rejected':
        cursor.execute("DELETE FROM login_sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return {"status": "rejected"}
        
    conn.close()
    return {"status": "pending"}

@app.post("/api/auth/telegram_session/cancel/{token}")
def telegram_session_cancel(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM login_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Session cancelled"}

@app.post("/api/auth/telegram_login")
def telegram_login(payload: TelegramLoginPayload, request: Request):
    conn = get_db_connection()
    cursor = conn.cursor()
    import json
    import datetime
    
    user = None
    if payload.telegram_chat_id:
        cursor.execute("SELECT * FROM users WHERE telegram_chat_id = ?", (payload.telegram_chat_id.strip(),))
        user = cursor.fetchone()
    elif payload.telegram_username:
        cursor.execute("SELECT * FROM users WHERE LOWER(telegram_username) = LOWER(?) OR LOWER(username) = LOWER(?)", (payload.telegram_username.strip(), payload.telegram_username.strip()))
        user = cursor.fetchone()
        
    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="No linked Telegram account found. Please register or link in profile.")
        
    client_ip = request.client.host if request.client else '127.0.0.1'
    last_login = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    cursor.execute("UPDATE users SET client_ip = ?, last_login = ? WHERE id = ?", (client_ip, last_login, user['id']))
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user['id'],))
    user = cursor.fetchone()
    conn.close()
    
    perms = {}
    if user['permissions']:
        try:
            perms = json.loads(user['permissions'])
        except Exception:
            pass

    return {
        "status": "success",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name'],
            "permissions": perms,
            "email": user['email'],
            "phone": user['phone'],
            "department": user['department'],
            "language": user['language'] or 'English',
            "timezone": user['timezone'] or '(GMT+07:00) Bangkok',
            "date_format": user['date_format'] or 'dd/mm/yyyy',
            "theme": user['theme'] or 'Light',
            "client_ip": user['client_ip'],
            "last_login": user['last_login'],
            "telegram_chat_id": user['telegram_chat_id'],
            "telegram_username": user['telegram_username']
        }
    }

@app.post("/api/users/telegram_notify/{user_id}")
def send_user_telegram_notification(user_id: int):
    import requests
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not user['telegram_chat_id']:
        raise HTTPException(status_code=400, detail="Telegram Chat ID is not linked to your profile.")
        
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="Telegram Bot Token not configured in backend configuration.")
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    message = (
        f"🔔 <b>NSSF SOC System Alert</b>\n\n"
        f"Hello <b>{user['full_name'] or user['username']}</b>,\n"
        f"Your Telegram account is now successfully linked to the <b>NSSF Security Operations Center Portal</b>.\n"
        f"You will receive critical system logs and outage alerts directly here!"
    )
    
    payload = {
        'chat_id': user['telegram_chat_id'],
        'text': message,
        'parse_mode': 'HTML'
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            return {"status": "success", "message": "Test message sent to Telegram successfully"}
        else:
            raise HTTPException(status_code=400, detail=f"Telegram bot API error: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
def auth_login(payload: UserLoginPayload, request: Request):
    from auth_utils import verify_password
    import json
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (payload.username.strip(),))
    user = cursor.fetchone()
    
    if not user or not verify_password(payload.password, user['password_hash']):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    client_ip = request.client.host if request.client else '127.0.0.1'
    last_login = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    cursor.execute("UPDATE users SET client_ip = ?, last_login = ? WHERE id = ?", (client_ip, last_login, user['id']))
    conn.commit()
    
    # Reload user info to get the updated values
    cursor.execute("SELECT * FROM users WHERE id = ?", (user['id'],))
    user = cursor.fetchone()
    conn.close()
    
    perms = {}
    if user['permissions']:
        try:
            perms = json.loads(user['permissions'])
        except Exception:
            pass

    return {
        "status": "success",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name'],
            "permissions": perms,
            "email": user['email'],
            "phone": user['phone'],
            "department": user['department'],
            "language": user['language'] or 'English',
            "timezone": user['timezone'] or '(GMT+07:00) Bangkok',
            "date_format": user['date_format'] or 'dd/mm/yyyy',
            "theme": user['theme'] or 'Light',
            "client_ip": user['client_ip'],
            "last_login": user['last_login'],
            "telegram_chat_id": user['telegram_chat_id'],
            "telegram_username": user['telegram_username']
        }
    }

@app.get("/api/users")
def get_users():
    import json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, full_name, permissions, created_at, telegram_username, telegram_chat_id FROM users")
    users = []
    for row in cursor.fetchall():
        d = dict(row)
        if d.get('permissions'):
            try:
                d['permissions'] = json.loads(d['permissions'])
            except Exception:
                d['permissions'] = {}
        else:
            d['permissions'] = {}
        users.append(d)
    conn.close()
    return users

@app.post("/api/users")
def create_user(payload: UserCreatePayload):
    from auth_utils import hash_password
    import json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (payload.username.strip(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
            
        hashed_pass = hash_password(payload.password)
        
        # Calculate permissions based on input or role preset
        perms = payload.permissions
        if not perms:
            if payload.role == 'admin':
                perms = {m: "readwrite" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "leave", "user_management"]}
            elif payload.role == 'staff':
                perms = {m: "readwrite" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "leave"]}
                perms["user_management"] = "none"
            else: # viewer
                perms = {m: "read" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "leave"]}
                perms["user_management"] = "none"
                
        perms_str = json.dumps(perms)
        
        cursor.execute("""
        INSERT INTO users (username, password_hash, role, full_name, permissions, telegram_username, email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.username.strip(), 
            hashed_pass, 
            payload.role, 
            payload.full_name, 
            perms_str, 
            payload.telegram_username.strip() if payload.telegram_username and payload.telegram_username.strip() else None,
            payload.email.strip() if payload.email and payload.email.strip() else None
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"status": "success", "id": new_id}
    except Exception as e:
        conn.close()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}")
def update_user(user_id: int, payload: UserUpdatePayload):
    from auth_utils import hash_password
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        fields = []
        params = []
        
        if payload.username is not None:
            # Check if new username is unique
            cursor.execute("SELECT id FROM users WHERE username = ? AND id != ?", (payload.username.strip(), user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")
            fields.append("username = ?")
            params.append(payload.username.strip())
            
        if payload.password is not None and payload.password != "":
            hashed_pass = hash_password(payload.password)
            fields.append("password_hash = ?")
            params.append(hashed_pass)
            
        if payload.role is not None:
            fields.append("role = ?")
            params.append(payload.role)
            
        if payload.full_name is not None:
            fields.append("full_name = ?")
            params.append(payload.full_name)
            
        if payload.permissions is not None:
            import json
            fields.append("permissions = ?")
            params.append(json.dumps(payload.permissions))
            
        if payload.telegram_username is not None:
            fields.append("telegram_username = ?")
            params.append(payload.telegram_username.strip() if payload.telegram_username.strip() else None)
            
        if payload.email is not None:
            fields.append("email = ?")
            params.append(payload.email.strip() if payload.email.strip() else None)
            
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        params.append(user_id)
        sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(sql, tuple(params))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        conn.close()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/profile/{user_id}")
def update_user_profile(user_id: int, payload: UserProfileUpdatePayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        fields = []
        params = []
        
        for key, val in payload.dict(exclude_unset=True).items():
            fields.append(f"{key} = ?")
            params.append(val)
            
        if fields:
            params.append(user_id)
            sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
            cursor.execute(sql, tuple(params))
            conn.commit()
            
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        updated_user = cursor.fetchone()
        conn.close()
        
        return {
            "status": "success",
            "user": {
                "id": updated_user['id'],
                "username": updated_user['username'],
                "role": updated_user['role'],
                "full_name": updated_user['full_name'],
                "email": updated_user['email'],
                "phone": updated_user['phone'],
                "department": updated_user['department'],
                "language": updated_user['language'] or 'English',
                "timezone": updated_user['timezone'] or '(GMT+07:00) Bangkok',
                "date_format": updated_user['date_format'] or 'dd/mm/yyyy',
                "theme": updated_user['theme'] or 'Light',
                "client_ip": updated_user['client_ip'],
                "last_login": updated_user['last_login'],
                "telegram_chat_id": updated_user['telegram_chat_id'],
                "telegram_username": updated_user['telegram_username']
            }
        }
    except Exception as e:
        conn.close()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Prevent deleting the admin account
        cursor.execute("SELECT username, role FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user['username'] == 'admin':
            raise HTTPException(status_code=400, detail="Cannot delete default admin account")
            
        if user['role'] == 'admin':
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            if cursor.fetchone()[0] <= 1:
                raise HTTPException(status_code=400, detail="Cannot delete the last admin account")
                
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        conn.close()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # run fastapi locally
    uvicorn.run(app, host="127.0.0.1", port=8000)
