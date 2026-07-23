import os
import sqlite3
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request, Body
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

from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(title="NSSF SOC Network API", version="1.0.0")

app.add_middleware(GZipMiddleware, minimum_size=500)

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
                                web_portal_url = "https://nssfsocportal.vercel.app"
                                if os.getenv("VERCEL_URL"):
                                    web_portal_url = f"https://{os.getenv('VERCEL_URL')}"
                                
                                requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                                    'chat_id': chat_id,
                                    'text': msg,
                                    'parse_mode': 'HTML',
                                    'reply_markup': {
                                        'inline_keyboard': [
                                            [
                                                {
                                                    'text': '🌐 បើកវេបសាយ (Open Web Portal)',
                                                    'url': web_portal_url
                                                }
                                            ],
                                            [
                                                {
                                                    'text': '📱 បើកក្នុង Telegram (Open Mini App)',
                                                    'web_app': {
                                                        'url': web_portal_url
                                                    }
                                                }
                                            ]
                                        ]
                                    }
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
                    elif text:
                        from telegram import process_telegram_incoming_update
                        process_telegram_incoming_update(update)
            else:
                time.sleep(2)
        except Exception as e:
            print(f"Error in Telegram polling loop: {e}")
            time.sleep(5)

@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    try:
        payload = await request.json()
        if not payload:
            return {"status": "skipped"}
            
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not bot_token:
            return {"status": "skipped"}
            
        message = payload.get("message", {}) or payload.get("edited_message", {})
        text = (message.get("text") or "").strip()
        chat = message.get("chat", {})
        chat_id = chat.get("id")
        from_user = message.get("from", {})
        username = from_user.get("username", "") or chat.get("username", "")
        
        # 1. Check if this is a login start command with token
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
                        web_portal_url = "https://nssfsocportal.vercel.app"
                        if os.getenv("VERCEL_URL"):
                            web_portal_url = f"https://{os.getenv('VERCEL_URL')}"
                        
                        import requests
                        requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                            'chat_id': chat_id,
                            'text': msg,
                            'parse_mode': 'HTML',
                            'reply_markup': {
                                'inline_keyboard': [
                                    [
                                        {
                                            'text': '🌐 បើកវេបសាយ (Open Web Portal)',
                                            'url': web_portal_url
                                        }
                                    ],
                                    [
                                        {
                                            'text': '📱 បើកក្នុង Telegram (Open Mini App)',
                                            'web_app': {
                                                'url': web_portal_url
                                            }
                                        }
                                    ]
                                ]
                            }
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
                except Exception as e:
                    try:
                        conn.rollback()
                    except Exception:
                        pass
                    print("Error in Telegram webhook login:", e)
                finally:
                    conn.close()
            return {"status": "ok"}
            
        # 2. Check if this is a message from a user we can auto-link
        elif username and chat_id and not text.startswith("/"):
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT * FROM users WHERE LOWER(telegram_username) = LOWER(?) OR LOWER(username) = LOWER(?)", (username, username))
                user = cursor.fetchone()
                if user and not user['telegram_chat_id']:
                    cursor.execute("UPDATE users SET telegram_chat_id = ? WHERE id = ?", (str(chat_id), user['id']))
                    conn.commit()
                    
                    web_portal_url = "https://nssfsocportal.vercel.app"
                    if os.getenv("VERCEL_URL"):
                        web_portal_url = f"https://{os.getenv('VERCEL_URL')}"
                        
                    msg = (
                        f"✅ <b>Telegram Account Linked Automatically!</b>\n\n"
                        f"Hello <b>{user['full_name'] or user['username']}</b>,\n"
                        f"Your Telegram Chat ID (<code>{chat_id}</code>) has been automatically saved and linked to your portal account!"
                    )
                    import requests
                    requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={
                        'chat_id': chat_id,
                        'text': msg,
                        'parse_mode': 'HTML',
                        'reply_markup': {
                            'inline_keyboard': [
                                [
                                    {
                                        'text': '🌐 បើកវេបសាយ (Open Web Portal)',
                                        'url': web_portal_url
                                    }
                                ]
                            ]
                        }
                    }, timeout=5)
            except Exception as ex:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print("Error in Telegram auto-link:", ex)
            finally:
                conn.close()

        # 3. Otherwise, delegate to process_telegram_incoming_update in telegram.py
        from telegram import process_telegram_incoming_update
        process_telegram_incoming_update(payload)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.post("/api/telegram/setup_webhook")
def setup_telegram_webhook():
    import requests
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=400, detail="TELEGRAM_BOT_TOKEN not configured")
    webhook_url = "https://nssfsocportal.vercel.app/api/telegram/webhook"
    res = requests.post(f"https://api.telegram.org/bot{bot_token}/setWebhook", json={"url": webhook_url})
    return res.json()

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
    vpn_type: Optional[str] = None

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
        
        cursor.execute("""
            SELECT branch_id, COUNT(*) FROM branch_ips 
            WHERE (user_name IS NOT NULL AND user_name != '' AND user_name != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
            GROUP BY branch_id
        """)
        branch_counts = {row[0]: row[1] for row in cursor.fetchall()}
        for b in branches:
            b['used_ips'] = branch_counts.get(b['id'], 0)
            b['total_ips'] = 254
            
        cursor.execute("SELECT id, name_en, vlan_id, subnet, gateway FROM hq_departments")
        depts = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("""
            SELECT dept_id, COUNT(*) FROM hq_ips 
            WHERE (user_name_kh IS NOT NULL AND user_name_kh != '' AND user_name_kh != 'None')
               OR (user_name_en IS NOT NULL AND user_name_en != '' AND user_name_en != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
            GROUP BY dept_id
        """)
        dept_counts = {row[0]: row[1] for row in cursor.fetchall()}
        for d in depts:
            d['used_ips'] = dept_counts.get(d['id'], 0)
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
        
        # Calculate used IPs in batch with 1 GROUP BY query
        cursor.execute("""
            SELECT branch_id, COUNT(*) FROM branch_ips 
            WHERE (user_name IS NOT NULL AND user_name != '' AND user_name != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
            GROUP BY branch_id
        """)
        branch_counts = {row[0]: row[1] for row in cursor.fetchall()}
        for b in branches:
            b['used_ips'] = branch_counts.get(b['id'], 0)
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
def update_branch_ip(id: int, ip_data: BranchIPUpdate, request: Request, ip: str = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if branch exists
        cursor.execute("SELECT id, name_kh, name_en FROM branches WHERE id = ?", (id,))
        branch_row = cursor.fetchone()
        if not branch_row:
            conn.close()
            raise HTTPException(status_code=404, detail="Branch not found")
            
        # Check if entry already exists in SQLite
        cursor.execute("SELECT id FROM branch_ips WHERE ip = ?", (ip,))
        row = cursor.fetchone()
        
        is_cleared = (ip_data.status in ['Available', 'AVAILABLE']) and not (ip_data.user_name and str(ip_data.user_name).strip())
        if is_cleared:
            cursor.execute("DELETE FROM branch_ips WHERE ip = ?", (ip,))
        elif row:
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
        
        # Trigger Telegram Audit Notification
        from telegram import notify_data_change
        editor = request.headers.get("x-editor-username")
        client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
        branch_name = f"{branch_row['name_kh']} ({branch_row['name_en']})"
        notify_data_change(
            action_title="ធ្វើបច្ចុប្បន្នភាព IP តាមសាខា (Branch IP Update)",
            details={
                "សាខា (Branch)": branch_name,
                "IP Address": ip,
                "ឈ្មោះអ្នកប្រើប្រាស់ (User Name)": ip_data.user_name,
                "តួនាទី (Position)": ip_data.position,
                "MAC Address": ip_data.mac_address,
                "ប្រភេទឧបករណ៍ (Device)": ip_data.device_type,
                "ស្ថានភាព (Status)": ip_data.status
            },
            editor_username=editor,
            client_ip=client_ip
        )
        
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
        
        # Calculate used IPs in batch with 1 GROUP BY query
        cursor.execute("""
            SELECT dept_id, COUNT(*) FROM hq_ips 
            WHERE (user_name_kh IS NOT NULL AND user_name_kh != '' AND user_name_kh != 'None')
               OR (user_name_en IS NOT NULL AND user_name_en != '' AND user_name_en != 'None')
               OR (position IS NOT NULL AND position != '' AND position != 'None')
            GROUP BY dept_id
        """)
        dept_counts = {row[0]: row[1] for row in cursor.fetchall()}
        for d in depts:
            d['used_ips'] = dept_counts.get(d['id'], 0)
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
def update_hq_ip(id: int, ip_data: HQIPUpdate, request: Request, ip: str = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if dept exists
        cursor.execute("SELECT id, name_en, vlan_id FROM hq_departments WHERE id = ?", (id,))
        dept_row = cursor.fetchone()
        if not dept_row:
            conn.close()
            raise HTTPException(status_code=404, detail="Department not found")
            
        # Check if entry already exists in SQLite
        cursor.execute("SELECT id FROM hq_ips WHERE ip = ?", (ip,))
        row = cursor.fetchone()
        
        is_cleared = (ip_data.status in ['Available', 'AVAILABLE']) and not (ip_data.user_name_en and str(ip_data.user_name_en).strip()) and not (ip_data.user_name_kh and str(ip_data.user_name_kh).strip())
        if is_cleared:
            cursor.execute("DELETE FROM hq_ips WHERE ip = ?", (ip,))
        elif row:
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        
        # Trigger Telegram Audit Notification
        from telegram import notify_data_change
        editor = request.headers.get("x-editor-username")
        client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
        dept_name = f"{dept_row['name_en']} (VLAN {dept_row['vlan_id']})"
        notify_data_change(
            action_title="ធ្វើបច្ចុប្បន្នភាព IP តាមនាយកដ្ឋាន HQ (HQ IP Update)",
            details={
                "នាយកដ្ឋាន (Department)": dept_name,
                "IP Address": ip,
                "ឈ្មោះបុគ្គលិក (User Name)": ip_data.user_name_kh or ip_data.user_name_en,
                "តួនាទី (Position)": ip_data.position,
                "ស្ថានភាព (Status)": ip_data.status
            },
            editor_username=editor,
            client_ip=client_ip
        )
        
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
def update_vpn_user(id: int, v_data: VPNUserUpdate, request: Request):
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
        
        # Trigger Telegram Audit Notification
        from telegram import notify_data_change
        editor = request.headers.get("x-editor-username")
        client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
        notify_data_change(
            action_title="ធ្វើបច្ចុប្បន្នភាព Remote VPN User (VPN User Update)",
            details={
                "ឈ្មោះ (Name)": v_data.name,
                "Username": v_data.username,
                "នាយកដ្ឋាន (Dept)": v_data.department,
                "ប្រភេទ (VPN Type)": v_data.vpn_type,
                "ស្ថានភាព (Status)": v_data.status
            },
            editor_username=editor,
            client_ip=client_ip
        )
        
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
def update_hospital_vpn(id: int, v_data: HospitalVPNUpdate, request: Request):
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
            1 if (v_data.status and str(v_data.status).strip().lower() in ['reopen', 'ស្នើសុំបើក']) else 0,
            v_data.reference_doc,
            id
        ))
        
        conn.commit()
        conn.close()
        
        # Trigger Telegram Audit Notification
        from telegram import notify_data_change
        editor = request.headers.get("x-editor-username")
        client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
        notify_data_change(
            action_title="ធ្វើបច្ចុប្បន្នភាព Hospital/Bank VPN (Hospital VPN Update)",
            details={
                "ឈ្មោះមន្ទីរពេទ្យ/ធនាគារ": v_data.name,
                "LAN IP": v_data.lan_ip,
                "Public IP": v_data.public_ip,
                "ISP": v_data.isp,
                "ប្រភេទ (VPN Type)": getattr(v_data, 'vpn_type', None) or "S2S",
                "ស្ថានភាព (Status)": v_data.status
            },
            editor_username=editor,
            client_ip=client_ip
        )
        
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

class PublicIpMappingPayload(BaseModel):
    no: Optional[int] = None
    name: str
    old_ip: Optional[str] = None
    new_ip_6: Optional[str] = None
    new_ip_7: Optional[str] = None
    dns_name: Optional[str] = None
    status: Optional[str] = "using"
    firewall_allowed: Optional[str] = None
    public_dns_changed: Optional[str] = None
    note: Optional[str] = None
    note_other: Optional[str] = None

@app.post("/api/public_ips/mappings")
def add_public_ip_mapping(payload: PublicIpMappingPayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO public_ip_mappings (no, name, old_ip, new_ip_6, new_ip_7, dns_name, status, firewall_allowed, public_dns_changed, note, note_other)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            payload.no, payload.name, payload.old_ip, payload.new_ip_6, payload.new_ip_7,
            payload.dns_name, payload.status, payload.firewall_allowed, payload.public_dns_changed,
            payload.note, payload.note_other
        ))
        new_id = cursor.fetchone()["id"]
        conn.commit()
        conn.close()
        return {"status": "success", "id": new_id}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/public_ips/mappings/{mapping_id}")
def update_public_ip_mapping(mapping_id: int, payload: PublicIpMappingPayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE public_ip_mappings
            SET no=%s, name=%s, old_ip=%s, new_ip_6=%s, new_ip_7=%s, dns_name=%s,
                status=%s, firewall_allowed=%s, public_dns_changed=%s, note=%s, note_other=%s
            WHERE id=%s
        """, (
            payload.no, payload.name, payload.old_ip, payload.new_ip_6, payload.new_ip_7,
            payload.dns_name, payload.status, payload.firewall_allowed, payload.public_dns_changed,
            payload.note, payload.note_other, mapping_id
        ))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/public_ips/mappings/{mapping_id}")
def delete_public_ip_mapping(mapping_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM public_ip_mappings WHERE id=%s", (mapping_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
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
    
    has_creds = os.path.exists(cred_file) or bool(os.getenv("GOOGLE_CREDENTIALS_JSON"))
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

@app.get("/api/notifications")
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    notifications = []
    
    # 1. Hospital Reopen Requests
    try:
        cursor.execute("SELECT id, name, reopen_requested, reference_doc, vpn_type FROM hospital_vpns WHERE reopen_requested = 1")
        hospitals = cursor.fetchall()
        for h in hospitals:
            h_dict = dict(h)
            doc_info = f" ({h_dict['reference_doc']})" if h_dict.get('reference_doc') else ""
            notifications.append({
                "id": f"hosp_reopen_{h_dict['id']}",
                "type": "s2s",
                "title": f"មន្ទីរពេទ្យស្នើសុំបើក VPN ៖ {h_dict['name']}",
                "desc": f"ស្នើសុំបើកដំណើការ VPN {h_dict.get('vpn_type') or 'S2S'} ឡើងវិញ{doc_info}",
                "time": "រង់ចាំ (Pending)",
                "badgeColor": "#2563eb"
            })
    except Exception as e:
        print("Error fetching hospital notifications:", e)

    # 2. System Status / Google Sheets Sync Status
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    notifications.append({
        "id": "sys_gs_status",
        "type": "sync",
        "title": "Google Sheets Synchronization",
        "desc": "ប្រព័ន្ធ Google Sheets Sync ដំណើរការជាផ្លូវការ (Real-Time Push Enabled)" if use_gs else "Google Sheets Sync ត្រូវបានបិទ",
        "time": "បច្ចុប្បន្នភាព",
        "badgeColor": "#10b981"
    })
    
    # 3. Telegram Audit Status
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if bot_token:
        notifications.append({
            "id": "sys_telegram_status",
            "type": "audit",
            "title": "ប្រព័ន្ធ Telegram Audit Alerts",
            "desc": "ប្រព័ន្ធផ្ញើសាររាយការណ៍ស្វ័យប្រវត្តិតាម Telegram កំពុងដំណើរការជាផ្លូវការ",
            "time": "បច្ចុប្បន្នភាព",
            "badgeColor": "#f59e0b"
        })

    conn.close()
    return {"status": "success", "notifications": notifications}

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
import tempfile

if os.getenv("VERCEL") or not os.access(WORKSPACE, os.W_OK):
    STORED_FILES_DIR = os.path.join(tempfile.gettempdir(), "stored_files")
else:
    STORED_FILES_DIR = os.path.join(WORKSPACE, "backend", "stored_files")

try:
    os.makedirs(STORED_FILES_DIR, exist_ok=True)
except Exception:
    STORED_FILES_DIR = os.path.join(tempfile.gettempdir(), "stored_files")
    os.makedirs(STORED_FILES_DIR, exist_ok=True)

@app.get("/api/drive/files")
def get_drive_files():
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if folder_id:
        try:
            from google_drive import list_files_in_drive
            files, err = list_files_in_drive(folder_id)
            if not err and files is not None:
                return {"status": "success", "files": files, "folder_id": folder_id}
        except Exception as e:
            print("Google Drive API error, falling back to local storage:", e)

    import mimetypes
    import datetime
    files = []
    try:
        if os.path.exists(STORED_FILES_DIR):
            for filename in os.listdir(STORED_FILES_DIR):
                filepath = os.path.join(STORED_FILES_DIR, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    mime_type, _ = mimetypes.guess_type(filepath)
                    dt = datetime.datetime.fromtimestamp(stat.st_mtime)
                    iso_time = dt.isoformat()
                    
                    webViewLink = f"/api/drive/files/download/{filename}"
                    
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
    file_bytes = file.file.read()
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if folder_id:
        try:
            from google_drive import upload_file_to_drive
            import io
            file_stream = io.BytesIO(file_bytes)
            uploaded_file, err = upload_file_to_drive(file_stream, file.filename, file.content_type or "application/octet-stream", folder_id)
            if not err and uploaded_file:
                return {"status": "success", "file": uploaded_file, "storage_type": "Google Drive"}
            else:
                print("Google Drive Upload Note (falling back to server storage):", err)
        except Exception as e:
            print("Google Drive Upload Exception (falling back to server storage):", e)

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
            f.write(file_bytes)
            
        stat = os.stat(filepath)
        dt = datetime.datetime.fromtimestamp(stat.st_mtime)
        
        return {
            "status": "success",
            "storage_type": "Server Storage",
            "file": {
                "id": filename,
                "name": filename,
                "webViewLink": f"/api/drive/files/download/{filename}",
                "size": stat.st_size,
                "createdTime": dt.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/drive/files/{file_id}")
def delete_file(file_id: str):
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if folder_id and not file_id.startswith("/") and len(file_id) > 15:
        try:
            from google_drive import delete_file_from_drive
            success, err = delete_file_from_drive(file_id)
            if success:
                return {"status": "success"}
        except Exception as e:
            print("Google Drive delete exception, falling back to local storage:", e)

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

from fastapi.responses import StreamingResponse, FileResponse
import mimetypes

@app.get("/api/drive/files/download/{file_id}")
def download_drive_or_local_file(file_id: str):
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    # If file_id is a Google Drive file ID (alphanumeric string without extension)
    if folder_id and len(file_id) > 15 and not "." in file_id:
        try:
            from google_drive import get_drive_service
            import io
            from googleapiclient.http import MediaIoBaseDownload
            
            service = get_drive_service()
            if service:
                g_file = service.files().get(fileId=file_id, fields="id, name, mimeType", supportsAllDrives=True).execute()
                fname = g_file.get("name", "document")
                mtype = g_file.get("mimeType", "application/octet-stream")
                
                media_request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
                file_stream = io.BytesIO()
                downloader = MediaIoBaseDownload(file_stream, media_request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                file_stream.seek(0)
                
                headers = {
                    "Content-Disposition": f'inline; filename="{fname}"'
                }
                return StreamingResponse(file_stream, media_type=mtype, headers=headers)
        except Exception as e:
            print("Proxy stream error from Google Drive, falling back to local file:", e)

    try:
        safe_filename = os.path.basename(file_id)
        filepath = os.path.join(STORED_FILES_DIR, safe_filename)
        if os.path.exists(filepath):
            mime_type, _ = mimetypes.guess_type(filepath)
            return FileResponse(filepath, media_type=mime_type or "application/octet-stream", content_disposition_type="inline")
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TelegramSendMessagePayload(BaseModel):
    message: str
    username: Optional[str] = None

@app.post("/api/telegram/send")
def send_telegram(payload: TelegramSendMessagePayload):
    from telegram import send_telegram_message
    
    chat_id = None
    if payload.username:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT telegram_chat_id FROM users WHERE LOWER(username) = LOWER(?)", (payload.username.strip(),))
        row = cursor.fetchone()
        conn.close()
        if row and row['telegram_chat_id']:
            chat_id = str(row['telegram_chat_id']).strip()
            
    success, msg = send_telegram_message(payload.message, chat_id=chat_id)
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
    notify_telegram: Optional[str] = '1'
    position: Optional[str] = "មន្ត្រី"
    permissions: Optional[Dict[str, str]] = None

class UserUpdatePayload(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    telegram_username: Optional[str] = None
    notify_telegram: Optional[str] = None
    position: Optional[str] = None
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
    notify_telegram: Optional[str] = None

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
    cursor.execute("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", (payload.username.strip(),))
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
            "telegram_username": user['telegram_username'],
            "notify_telegram": user['notify_telegram'] if user['notify_telegram'] is not None else '1'
        }
    }

@app.get("/api/users")
def get_users():
    import json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id ASC")
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
                perms = {m: "readwrite" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "shift_schedule", "leave", "user_management"]}
            elif payload.role == 'staff':
                perms = {m: "readwrite" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "shift_schedule", "leave"]}
                perms["user_management"] = "none"
            else: # viewer
                perms = {m: "read" for m in ["dashboard", "ipam", "vpn_remote", "hospital_vpn", "bank_vpn", "public_ip", "switches", "storage", "shift_schedule", "leave"]}
                perms["user_management"] = "none"
                
        perms_str = json.dumps(perms)
        
        cursor.execute("""
        INSERT INTO users (username, password_hash, role, full_name, permissions, telegram_username, email, position)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.username.strip(), 
            hashed_pass, 
            payload.role, 
            payload.full_name, 
            perms_str, 
            payload.telegram_username.strip() if payload.telegram_username and payload.telegram_username.strip() else None,
            payload.email.strip() if payload.email and payload.email.strip() else None,
            payload.position.strip() if payload.position else "មន្ត្រី"
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
            
        if payload.position is not None:
            fields.append("position = ?")
            params.append(payload.position)
            
        if payload.permissions is not None:
            import json
            fields.append("permissions = ?")
            params.append(json.dumps(payload.permissions))
            
        if payload.telegram_username is not None:
            fields.append("telegram_username = ?")
            params.append(payload.telegram_username.strip() if payload.telegram_username.strip() else None)
            
        if payload.notify_telegram is not None:
            fields.append("notify_telegram = ?")
            params.append(str(payload.notify_telegram))
            
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

# ==========================================
# Shift Dashboard & Duty Notifications API
# ==========================================

FIRESTORE_REST_URL = "https://firestore.googleapis.com/v1/projects/shift-dashboard-efda2/databases/(default)/documents/shiftboard/schedule"

def fetch_shift_schedule_from_firestore():
    import requests
    try:
        res = requests.get(FIRESTORE_REST_URL, timeout=10)
        if res.status_code == 200:
            data = res.json()
            schedule = {}
            data_field = data.get("fields", {}).get("data", {}).get("mapValue", {}).get("fields", {})
            for date_str, date_obj in data_field.items():
                night_values = date_obj.get("mapValue", {}).get("fields", {}).get("night", {}).get("arrayValue", {}).get("values", [])
                names = [item.get("stringValue", "").strip() for item in night_values if item.get("stringValue")]
                schedule[date_str] = names
            return schedule
    except Exception as e:
        print("Error fetching Firestore shift schedule:", e)
    return {}

@app.get("/api/shift/today")
def get_today_shift():
    from datetime import datetime
    schedule = fetch_shift_schedule_from_firestore()
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_names = schedule.get(today_str, [])
    return {
        "date": today_str,
        "on_duty_names": today_names,
        "count": len(today_names)
    }

@app.get("/api/shift/schedule")
def get_full_shift_schedule():
    schedule = fetch_shift_schedule_from_firestore()
    return {"schedule": schedule}

@app.api_route("/api/shift/notify-today", methods=["GET", "POST"])
def notify_today_shift_staff():
    from datetime import datetime
    import requests
    
    schedule = fetch_shift_schedule_from_firestore()
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_names = schedule.get(today_str, [])
    
    if not today_names:
        return {"status": "no_shift_today", "message": f"No shift roster found for today ({today_str})"}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, telegram_username, telegram_chat_id, notify_telegram, position FROM users")
    all_users = cursor.fetchall()
    conn.close()

    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        row = cursor.fetchone()
        conn.close()
        if row and row['value']:
            bot_token = row['value']

    notified_users = []
    failed_users = []

    co_workers_str = ", ".join(today_names)

    for name_in_shift in today_names:
        clean_shift_name = name_in_shift.replace("លោក", "").replace("លោកស្រី", "").replace("អ្នកនាង", "").strip().lower()
        matched_user = None
        for u in all_users:
            u_fn = (u["full_name"] or "").strip().lower()
            u_un = (u["username"] or "").strip().lower()
            u_tg = (u["telegram_username"] or "").strip().lower()
            
            if clean_shift_name in u_fn or u_fn in clean_shift_name or clean_shift_name in u_un or clean_shift_name in u_tg:
                matched_user = u
                break
        
        if matched_user:
            notify_enabled = matched_user["notify_telegram"]
            if notify_enabled is None or str(notify_enabled) == "1" or notify_enabled is True:
                target_chat_id = matched_user["telegram_chat_id"] or matched_user["telegram_username"]
                if not target_chat_id and matched_user["username"]:
                    target_chat_id = f"@{matched_user['username']}"
                
                if target_chat_id and bot_token:
                    user_disp_name = matched_user["full_name"] or matched_user["username"]
                    alert_text = (
                        f"🔔 <b>[ការរំលឹកវេនប្រចាំការ NSSF SOC Portal]</b>\n\n"
                        f"👋 <b>ជម្រាបសួរ លោក/លោកស្រី {user_disp_name}!</b>\n\n"
                        f"📅 <b>ថ្ងៃនេះ ({today_str}) ដល់វេនលោក/លោកស្រីត្រូវប្រចាំការយប់ហើយ (Night Shift Standby Duty)!</b>\n"
                        f"⏰ <b>ម៉ោងប្រចាំការ ៖</b> ១៧:០០ - ០៨:០០ ព្រឹក\n"
                        f"👥 <b>ក្រុមការងារប្រចាំការរួមគ្នាយប់នេះ ៖</b> {co_workers_str}\n\n"
                        f"សូមរៀបចំខ្លួន និងចូលរួមប្រចាំការតាមកាលវិភាគកំណត់!\n"
                        f"សូមអរគុណ! 🙏"
                    )
                    try:
                        clean_target = str(target_chat_id).strip()
                        if not clean_target.startswith("@") and not clean_target.lstrip("-").isdigit():
                            clean_target = f"@{clean_target}"
                        res = requests.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={"chat_id": clean_target, "text": alert_text, "parse_mode": "HTML"},
                            timeout=5
                        )
                        if res.ok:
                            notified_users.append(user_disp_name)
                        else:
                            failed_users.append({"user": user_disp_name, "error": res.text})
                    except Exception as ex:
                        failed_users.append({"user": user_disp_name, "error": str(ex)})
                else:
                    failed_users.append({"user": matched_user["full_name"] or matched_user["username"], "error": "No telegram chat id or bot token"})
            else:
                failed_users.append({"user": matched_user["full_name"] or matched_user["username"], "error": "Notifications disabled for this user"})
        else:
            failed_users.append({"shift_name": name_in_shift, "error": "User not matched in DB"})

    return {
        "status": "success",
        "date": today_str,
        "shift_names": today_names,
        "notified_users": notified_users,
        "failed_users": failed_users
    }

# ==========================================
# TASK & TICKET MANAGEMENT API ROUTES
# ==========================================

@app.get("/api/tickets")
def list_tickets(status: str = None, priority: str = None, category: str = None, search: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM tickets WHERE 1=1"
    params = []
    
    if status and status != 'all':
        query += " AND status = ?"
        params.append(status)
    if priority and priority != 'all':
        query += " AND priority = ?"
        params.append(priority)
    if category and category != 'all':
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND (title LIKE ? OR ticket_code LIKE ? OR requester_name LIKE ? OR description LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
        
    query += " ORDER BY id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    tickets = [dict(r) for r in rows] if rows else []
    return {"status": "success", "tickets": tickets, "count": len(tickets)}

def generate_ticket_timeline(ticket):
    timeline = []
    created_at = ticket.get("created_at") or "2026-07-22 08:00:00"
    
    # 1. Draft / Initial Entry
    timeline.append({
        "status": "draft",
        "badge_text": "សេចក្តីព្រាង",
        "color": "#94a3b8",
        "actor": ticket.get("requester_name") or "លោក កោ ស៊ុនថន",
        "timestamp": created_at,
        "comment": "បានបង្កើតសេចក្តីព្រាងលិខិត/សំបុត្រស្នើសុំ"
    })
    
    # 2. Submitted
    timeline.append({
        "status": "submitted",
        "badge_text": "ដាក់ស្នើ",
        "color": "#3b82f6",
        "actor": ticket.get("requester_name") or "លោក កោ ស៊ុនថន",
        "timestamp": created_at,
        "comment": f"បានដាក់ស្នើលិខិតស្នើសុំចូលក្នុងប្រព័ន្ធ (អាទិភាព៖ {ticket.get('priority', 'Medium')})"
    })
    
    # 3. Level 1 Approval
    l1_approver = ticket.get("l1_approver") or "លោក កៅ សាម៉ាច (អនុប្រធានការិយាល័យ)"
    l1_time = ticket.get("l1_approved_at") or created_at
    l1_note = ticket.get("l1_comment") or "បានពិនិត្យ និងយល់ព្រម គោរពស្នើលោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន ពិនិត្យ"
    if ticket.get("status") in ("pending_l2", "approved", "in_progress", "completed"):
        timeline.append({
            "status": "l1_approved",
            "badge_text": "ឯកភាព",
            "color": "#10b981",
            "actor": l1_approver,
            "timestamp": l1_time,
            "comment": l1_note
        })
    elif ticket.get("status") == "pending_l1":
        timeline.append({
            "status": "pending",
            "badge_text": "កំពុងរង់ចាំ (Level 1)",
            "color": "#f59e0b",
            "actor": l1_approver,
            "timestamp": "កំពុងរង់ចាំ...",
            "comment": "កំពុងរង់ចាំការពិនិត្យ និងឯកភាពពីប្រធាន/អនុប្រធានការិយាល័យ"
        })

    # 4. Level 2 Approval (if required)
    if ticket.get("approval_level_required", 1) >= 2:
        l2_approver = ticket.get("l2_approver") or "លោក មាន ណារិមន្ត (ប្រធាននាយកដ្ឋាន)"
        l2_time = ticket.get("l2_approved_at") or l1_time
        l2_note = ticket.get("l2_comment") or "បានពិនិត្យ និងសម្រេចឯកភាព អនុញ្ញាតឲ្យក្រុមការងារអនុវត្ត"
        if ticket.get("status") in ("approved", "in_progress", "completed"):
            timeline.append({
                "status": "l2_approved",
                "badge_text": "ឯកភាព",
                "color": "#10b981",
                "actor": l2_approver,
                "timestamp": l2_time,
                "comment": l2_note
            })
        elif ticket.get("status") == "pending_l2":
            timeline.append({
                "status": "pending",
                "badge_text": "កំពុងរង់ចាំ (Level 2 Director)",
                "color": "#f59e0b",
                "actor": l2_approver,
                "timestamp": "កំពុងរង់ចាំ...",
                "comment": "កំពុងរង់ចាំការពិនិត្យ និងសម្រេចពីប្រធាននាយកដ្ឋាន"
            })

    # 5. In Progress / Execution
    if ticket.get("status") in ("in_progress", "completed"):
        timeline.append({
            "status": "in_progress",
            "badge_text": "កំពុងអនុវត្ត",
            "color": "#2563eb",
            "actor": ticket.get("assignee_name") or "SOC Duty Team",
            "timestamp": ticket.get("updated_at") or created_at,
            "comment": "កំពុងដំណើរការអនុវត្ត និងដោះស្រាយតាមសេចក្តីសម្រេច"
        })

    # 6. Completed
    if ticket.get("status") == "completed":
        timeline.append({
            "status": "completed",
            "badge_text": "ទទួល/បញ្ចប់",
            "color": "#10b981",
            "actor": ticket.get("assignee_name") or "លោកស្រី ធិ រដ្ឋា",
            "timestamp": ticket.get("completed_at") or ticket.get("updated_at") or created_at,
            "comment": "បានទទួល និងបញ្ចប់ការអនុវត្តសំបុត្រ/លិខិតនេះដោយជោគជ័យ"
        })

    # 7. Rejected
    if ticket.get("status") == "rejected":
        rej_note = (ticket.get('rejection_reason') or 'បដិសេធដោយថ្នាក់ដឹកនាំ').replace("មតិយោបល់ ៖", "").replace("មតិយោបល់៖", "").strip()
        timeline.append({
            "status": "rejected",
            "badge_text": "បដិសេធ",
            "color": "#ef4444",
            "actor": ticket.get("l2_approver") or ticket.get("l1_approver") or "ថ្នាក់ដឹកនាំ",
            "timestamp": ticket.get("updated_at") or created_at,
            "comment": rej_note
        })

    return timeline

@app.get("/api/tickets/{ticket_id}")
def get_ticket_detail(ticket_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    conn.close()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    t_dict = dict(ticket)
    return {
        "status": "success",
        "ticket": t_dict,
        "timeline": generate_ticket_timeline(t_dict)
    }

@app.post("/api/tickets")
async def create_ticket(request: Request):
    from datetime import datetime
    import random
    
    # Extract payload from Form or JSON
    ticket_data = {}
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        try:
            form = await request.form()
            ticket_data = dict(form)
            if "file" in form and hasattr(form["file"], "filename") and form["file"].filename:
                file_obj = form["file"]
                ticket_data["attachment_name"] = file_obj.filename
        except Exception as e:
            print("Form parse error:", e)
    else:
        try:
            ticket_data = await request.json()
        except Exception as e:
            print("JSON parse error:", e)
            
    title = ticket_data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Ticket title is required")
        
    category = ticket_data.get("category", "Incident")
    priority = ticket_data.get("priority", "Medium")
    description = ticket_data.get("description", "")
    requester_name = ticket_data.get("requester_name", "SOC Analyst")
    department = ticket_data.get("department", "SOC Operational Center")
    assignee_name = ticket_data.get("assignee_name", "SOC Duty Officer")
    approval_level_required = int(ticket_data.get("approval_level_required", 1))
    l1_approver = ticket_data.get("l1_approver") or ""
    l2_approver = ticket_data.get("l2_approver") or ""
    l3_approver = ticket_data.get("l3_approver") or ""
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    date_code = datetime.now().strftime("%Y%m%d")
    rand_suffix = random.randint(100, 999)
    ticket_code = f"TK-{date_code}-{rand_suffix}"
    
    status = "pending_l1" if approval_level_required >= 1 else "approved"
    current_level = 1 if approval_level_required >= 1 else 3
    
    attachment_name = ticket_data.get("attachment_name") or f"បង្កាន់ដៃទទួល_{ticket_code}.pdf"
    attachment_url = ticket_data.get("attachment_url") or ""

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO tickets (
        ticket_code, title, category, priority, description,
        requester_name, department, assignee_name, approval_level_required,
        current_approval_level, status, l1_approver, l2_approver, l3_approver,
        attachment_name, attachment_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_code, title, category, priority, description,
        requester_name, department, assignee_name, approval_level_required,
        current_level, status, l1_approver, l2_approver, l3_approver,
        attachment_name, attachment_url, now_str, now_str
    ))
    conn.commit()
    
    new_id = 1
    try:
        cursor.execute("SELECT MAX(id) FROM tickets")
        row = cursor.fetchone()
        if row and row[0]:
            new_id = row[0]
    except Exception as e:
        print("Error getting created ticket id:", e)
        
    conn.close()
    
    # Broadcast interactive Approval Buttons to Telegram asynchronously in background thread for INSTANT <100ms response!
    import threading
    new_ticket_obj = {
        "id": new_id,
        "ticket_code": ticket_code,
        "title": title,
        "category": category,
        "priority": priority,
        "description": description,
        "requester_name": requester_name,
        "department": department,
        "status": status,
        "approval_level_required": approval_level_required,
        "l1_approver": l1_approver,
        "l2_approver": l2_approver,
        "l3_approver": l3_approver
    }
    
    def async_tg_ticket():
        try:
            from telegram import send_ticket_telegram_alert
            send_ticket_telegram_alert(new_ticket_obj, level=1)
        except Exception as ex:
            print("Telegram Ticket Notify Exception:", ex)

    threading.Thread(target=async_tg_ticket, daemon=True).start()
        
    return {"status": "success", "id": new_id, "ticket_code": ticket_code}

@app.post("/api/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: int, payload: dict = Body(...)):
    from datetime import datetime
    
    action = payload.get("action", "approve") # "approve" or "reject"
    level = int(payload.get("level", 1))
    approver = payload.get("approver", "Leadership")
    comment = payload.get("comment", "")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    
    if not ticket:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    req_level = ticket["approval_level_required"]
    
    if action == "reject":
        new_status = "rejected"
        cursor.execute("""
        UPDATE tickets SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?
        """, (new_status, comment or "Rejected by leadership", now_str, ticket_id))
    else: # approve
        if level == 1:
            if req_level == 2:
                new_status = "pending_l2"
                next_level = 2
            else:
                new_status = "approved"
                next_level = 3
            l1_note = comment or "បានពិនិត្យ និងយល់ព្រម គោរពស្នើថ្នាក់ដឹកនាំពិនិត្យ"
            cursor.execute("""
            UPDATE tickets SET status = ?, current_approval_level = ?, l1_approver = ?, l1_approved_at = ?, l1_comment = ?, updated_at = ? WHERE id = ?
            """, (new_status, next_level, approver, now_str, l1_note, now_str, ticket_id))
        else: # level 2
            new_status = "approved"
            l2_note = comment or "បានពិនិត្យ និងសម្រេចឯកភាព អនុញ្ញាតឲ្យក្រុមការងារអនុវត្ត"
            cursor.execute("""
            UPDATE tickets SET status = ?, current_approval_level = 3, l2_approver = ?, l2_approved_at = ?, l2_comment = ?, updated_at = ? WHERE id = ?
            """, (new_status, approver, now_str, l2_note, now_str, ticket_id))
            
    conn.commit()
    conn.close()
    
    # Broadcast to Telegram asynchronously for INSTANT speed
    import threading
    def async_tg_approve():
        try:
            from telegram import send_telegram_alert
            if action == "reject":
                msg = f"<b>❌ TICKET REJECTED: {ticket['ticket_code']}</b>\n\n" \
                      f"<b>Title:</b> {ticket['title']}\n" \
                      f"<b>Rejected By:</b> {approver}\n" \
                      f"<b>Reason:</b> {comment or 'N/A'}"
            else:
                msg = f"<b>✅ TICKET APPROVED (Level {level}): {ticket['ticket_code']}</b>\n\n" \
                      f"<b>Title:</b> {ticket['title']}\n" \
                      f"<b>Approved By:</b> {approver}\n" \
                      f"<b>New Status:</b> {'⏳ Pending Level 2 Approval' if new_status == 'pending_l2' else '🟢 Approved & Ready for Execution'}"
            send_telegram_alert(msg)
        except Exception as ex:
            print("Telegram Ticket Approval Notify Exception:", ex)

    threading.Thread(target=async_tg_approve, daemon=True).start()
        
    return {"status": "success", "ticket_id": ticket_id, "new_status": new_status}

@app.post("/api/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, payload: dict = Body(...)):
    from datetime import datetime
    
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="New status required")
        
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    
    if not ticket:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if new_status == "completed":
        cursor.execute("""
        UPDATE tickets SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?
        """, (new_status, now_str, now_str, ticket_id))
    else:
        cursor.execute("""
        UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?
        """, (new_status, now_str, ticket_id))
        
    conn.commit()
    return {"status": "success", "ticket_id": ticket_id, "new_status": new_status}

@app.delete("/api/tickets/{ticket_id}")
def delete_ticket(ticket_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    if not ticket:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Ticket {ticket_id} deleted successfully"}

@app.get("/api/tickets/{ticket_id}/view")
@app.get("/api/tickets/{ticket_id}/attachment")
def view_ticket_attachment(ticket_id: int):
    from fastapi.responses import HTMLResponse, RedirectResponse
    from datetime import datetime

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    t = dict(row)
    if t.get("attachment_url") and t["attachment_url"].startswith("http"):
        return RedirectResponse(url=t["attachment_url"])
        
    timeline = generate_ticket_timeline(t)
    
    timeline_html = ""
    for item in timeline:
        is_rej = (item.get('status') == 'rejected' or item.get('badge_text') == 'បដិសេធ' or 'បដិសេធ' in str(item.get('badge_text', '')))
        icon_symbol = '✖' if is_rej else '✓'
        icon_bg = '#ef4444' if is_rej else '#10b981'
        badge_bg = '#fef2f2' if is_rej else '#f1f5f9'
        actor_color = '#dc2626' if is_rej else '#0f172a'

        raw_comment = item.get('comment', '')
        clean_comment = raw_comment.replace('មតិយោបល់ ៖', '').replace('មតិយោបល់៖', '').strip()

        timeline_html += f"""
        <div class="timeline-item">
            <div class="timeline-icon" style="background: {icon_bg};">{icon_symbol}</div>
            <div class="timeline-content" style="background: {badge_bg};">
                <div style="display: flex; justify-content: space-between;">
                    <span class="timeline-actor" style="color: {actor_color};">{item.get('badge_text')} (ដោយ {item.get('actor')})</span>
                    <span class="timeline-time">{item.get('timestamp')}</span>
                </div>
                <div class="timeline-comment"><strong>មតិយោបល់ ៖</strong> {clean_comment}</div>
            </div>
        </div>
        """

    # Parse creation timestamp to generate auto Khmer lunar & Gregorian dates
    created_dt = datetime.now()
    if t.get("created_at"):
        try:
            created_dt = datetime.strptime(str(t["created_at"]).split(".")[0], "%Y-%m-%d %H:%M:%S")
        except Exception:
            try:
                created_dt = datetime.strptime(str(t["created_at"]).split("T")[0], "%Y-%m-%d")
            except Exception:
                pass
                
    kh_digits = {'0':'០', '1':'១', '2':'២', '3':'៣', '4':'៤', '5':'៥', '6':'៦', '7':'៧', '8':'៨', '9':'៩'}
    def to_kh(val):
        return ''.join(kh_digits.get(c, c) for c in str(val))

    kh_days = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ']
    kh_months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
    
    day_name = kh_days[created_dt.weekday()]
    day_num = to_kh(created_dt.day)
    month_name = kh_months[created_dt.month - 1]
    year_num = to_kh(created_dt.year)
    
    khmer_lunar_date = f"ថ្ងៃ{day_name} ៩កើត ខែបុស្ស ឆ្នាំម្សាញ់ អដ្ឋស័ក ព.ស.២៥៧០"
    khmer_gregorian_date = f"រាជធានីភ្នំពេញ ថ្ងៃទី{day_num} ខែ{month_name} ឆ្នាំ{year_num}"
        
    html_content = f"""<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <title>លិខិតស្នើសុំផ្លូវការ - {t.get('ticket_code')}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&family=Inter:wght@400;600;700&display=swap');
        body {{
            font-family: 'Siemreap', sans-serif;
            background: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 40px 20px;
        }}
        .letter-page {{
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            padding: 45px 55px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.08);
            border-radius: 8px;
            position: relative;
        }}
        .header-container {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }}
        .header-left {{
            text-align: center;
            width: 240px;
        }}
        .header-left .title-nssf {{
            font-family: 'Moul', serif;
            font-size: 13.5px;
            color: #1e3a8a;
            font-weight: bold;
            line-height: 1.4;
            margin-top: 6px;
        }}
        .header-left .sub-nssf {{
            font-family: 'Siemreap', sans-serif;
            font-size: 11px;
            color: #334155;
            margin-top: 3px;
        }}
        .header-right {{
            text-align: center;
            width: 250px;
        }}
        .header-right .title-national {{
            font-family: 'Moul', serif;
            font-size: 14px;
            color: #0f172a;
            font-weight: bold;
            line-height: 1.6;
        }}
        .header-right .sub-national {{
            font-family: 'Moul', serif;
            font-size: 13px;
            color: #0f172a;
            font-weight: bold;
            line-height: 1.6;
        }}
        .header-right .divider-line {{
            margin-top: 6px;
            color: #1e3a8a;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
        }}
        .ticket-code-badge {{
            font-family: 'Inter', monospace;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid #bfdbfe;
            display: inline-block;
        }}
        .document-title {{
            text-align: center;
            font-family: 'Moul', serif;
            font-size: 18px;
            color: #1e3a8a;
            margin: 35px 0 25px 0;
            line-height: 1.5;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 25px;
            font-size: 13px;
        }}
        .info-item span {{
            font-weight: 700;
            color: #334155;
        }}
        .description-box {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 18px 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 13.5px;
            line-height: 1.7;
        }}
        .timeline-section {{
            margin-top: 35px;
            border-top: 2px dashed #cbd5e1;
            padding-top: 25px;
        }}
        .timeline-title {{
            font-family: 'Moul', serif;
            font-size: 14px;
            color: #1e3a8a;
            margin-bottom: 20px;
        }}
        .timeline-item {{
            display: flex;
            gap: 15px;
            margin-bottom: 16px;
            padding-left: 10px;
            position: relative;
        }}
        .timeline-icon {{
            width: 24px;
            height: 24px;
            background: #10b981;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
        }}
        .timeline-content {{
            background: #f1f5f9;
            padding: 12px 16px;
            border-radius: 8px;
            flex: 1;
            font-size: 12.5px;
        }}
        .timeline-actor {{
            font-weight: 700;
            color: #0f172a;
        }}
        .timeline-time {{
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
        }}
        .timeline-comment {{
            margin-top: 6px;
            color: #334155;
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }}
        .signature-section {{
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }}
        .stamp-block {{
            width: 45%;
            text-align: center;
        }}
        .signature-block {{
            width: 48%;
            text-align: center;
        }}
        .sig-lunar {{
            font-size: 12px;
            color: #334155;
            margin-bottom: 4px;
        }}
        .sig-gregorian {{
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 14px;
        }}
        .sig-role {{
            font-family: 'Moul', serif;
            font-size: 14px;
            color: #1e3a8a;
            font-weight: bold;
            margin-bottom: 65px;
        }}
        .sig-name {{
            font-family: 'Moul', serif;
            font-size: 14px;
            color: #0f172a;
            font-weight: bold;
        }}
        .stamp-badge {{
            display: inline-block;
            border: 2px solid #059669;
            background: #ecfdf5;
            color: #047857;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(16,185,129,0.15);
        }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .letter-page {{ box-shadow: none; padding: 0; max-width: 100%; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 20px;" class="no-print">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            🖨️ បោះពុម្ព / រក្សាទុកជា PDF (Print / Save as PDF)
        </button>
    </div>

    <div class="letter-page">
        <!-- Letterhead Header matching user screenshot -->
        <div class="header-container">
            <div class="header-left">
                <div>
                    <img src="/Nssf_Resize_Logo.png" alt="NSSF Logo" style="width: 75px; height: 75px; object-fit: contain; margin-bottom: 2px;" />
                </div>
                <div class="title-nssf">បេឡាជាតិសន្តិសុខសង្គម</div>
                <div class="sub-nssf">នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន</div>
            </div>

            <div class="header-right">
                <div class="title-national">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="sub-national">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div class="divider-line">━━━ • ━━━</div>
            </div>
        </div>

        <div style="text-align: right; margin-bottom: 10px;">
            <div class="ticket-code-badge">កូដលិខិត ៖ {t.get('ticket_code')}</div>
        </div>

        <!-- Title matching user screenshot -->
        <div class="document-title">
            {t.get('title') if t.get('title') and ('ស្នើសុំ' in t.get('title') or 'របាយការណ៍' in t.get('title')) else ('របាយការណ៍ ' + (t.get('title') or 'គណនី VPN Remote Access'))}
        </div>

        <div class="info-grid">
            <div class="info-item"><span>ប្រធានបទសំណើ ៖</span> {t.get('title')}</div>
            <div class="info-item"><span>ប្រភេទសំណើ ៖</span> {t.get('category')}</div>
            <div class="info-item"><span>អ្នកស្នើសុំ ៖</span> {t.get('requester_name')}</div>
            <div class="info-item"><span>អង្គភាព/ការិយាល័យ ៖</span> {t.get('department')}</div>
            <div class="info-item"><span>កាលបរិច្ឆេទ ៖</span> {t.get('created_at')}</div>
            <div class="info-item"><span>កម្រិតអាទិភាព ៖</span> {t.get('priority')}</div>
        </div>

        <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 8px; color: #1e3a8a;">ខ្លឹមសារ និងបរិយាយលម្អិតនៃសំណើ ៖</div>
        <div class="description-box">
            {t.get('description') or 'គ្មានការពិពណ៌នាបន្ថែម'}
        </div>

        <div class="timeline-section">
            <div class="timeline-title">កំណត់ត្រាការពិនិត្យ និងអនុម័តតាមលំដាប់ថ្នាក់រដ្ឋបាល (Approval History)</div>
            {timeline_html}
        </div>

        <!-- Signature Block matching user screenshot -->
        <div class="signature-section">
            <div class="stamp-block">
                <div class="stamp-badge">
                    ✓ ទទួល និងសម្រេចអនុម័តតាមឌីជីថល<br/>
                    <span style="font-size: 10.5px; font-weight: normal; color: #065f46;">(NSSF SOC Electronic Portal)</span>
                </div>
            </div>

            <div class="signature-block">
                <div class="sig-lunar">{khmer_lunar_date}</div>
                <div class="sig-gregorian">{khmer_gregorian_date}</div>
                <div class="sig-role">អ្នករៀបចំ</div>
                <div class="sig-name">{t.get('requester_name') or 'ពេញ បញ្ជរតន៍'}</div>
            </div>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html_content)

@app.get("/api/tickets/reports")
def get_tickets_reports(period: str = "monthly", year: int = 2026, month: int = 7):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    tickets = [dict(r) for r in rows] if rows else []
    
    total = len(tickets)
    pending_approval = sum(1 for t in tickets if t['status'] in ('pending_l1', 'pending_l2'))
    approved = sum(1 for t in tickets if t['status'] == 'approved')
    in_progress = sum(1 for t in tickets if t['status'] == 'in_progress')
    completed = sum(1 for t in tickets if t['status'] == 'completed')
    rejected = sum(1 for t in tickets if t['status'] == 'rejected')
    
    prio_counts = {
        "Urgent": sum(1 for t in tickets if t['priority'] == 'Urgent'),
        "High": sum(1 for t in tickets if t['priority'] == 'High'),
        "Medium": sum(1 for t in tickets if t['priority'] == 'Medium'),
        "Low": sum(1 for t in tickets if t['priority'] == 'Low')
    }
    
    cat_counts = {}
    for t in tickets:
        c = t.get('category') or 'Incident'
        cat_counts[c] = cat_counts.get(c, 0) + 1
        
    return {
        "status": "success",
        "period": period,
        "summary": {
            "total": total,
            "pending_approval": pending_approval,
            "approved": approved,
            "in_progress": in_progress,
            "completed": completed,
            "rejected": rejected,
            "completion_rate": round((completed / total * 100), 1) if total > 0 else 0.0
        },
        "by_priority": prio_counts,
        "by_category": cat_counts
    }

# Serve Vite Frontend static files in production container (Railway Deployment)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    # run fastapi locally
    uvicorn.run(app, host="127.0.0.1", port=8000)
