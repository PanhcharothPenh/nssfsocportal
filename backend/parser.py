import os
import sqlite3

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(WORKSPACE, "soc_network.db")

from database import get_db_connection

def create_tables(conn):
    cursor = conn.cursor()
    
    # 1. Branches Subnets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no INTEGER,
        name_kh TEXT,
        name_en TEXT,
        subnet TEXT,
        mask TEXT,
        gateway TEXT,
        no_computer INTEGER,
        sheet_name TEXT
    )
    """)
    
    # 2. Branch IPs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branch_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER,
        no INTEGER,
        ip TEXT UNIQUE,
        user_name TEXT,
        position TEXT,
        mac_address TEXT,
        device_type TEXT,
        status TEXT,
        internet_permission TEXT,
        other TEXT,
        FOREIGN KEY(branch_id) REFERENCES branches(id)
    )
    """)
    
    # 3. HQ Departments Subnets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hq_departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no INTEGER,
        name_en TEXT,
        vlan_id TEXT,
        subnet TEXT,
        mask TEXT,
        gateway TEXT,
        gw_device TEXT,
        no_computer INTEGER,
        sheet_name TEXT
    )
    """)
    
    # 4. HQ IPs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hq_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dept_id INTEGER,
        no INTEGER,
        ip TEXT UNIQUE,
        user_name_kh TEXT,
        user_name_en TEXT,
        position TEXT,
        old_ip TEXT,
        subnet_mask TEXT,
        gateway TEXT,
        status TEXT,
        internet_permission TEXT,
        group_system TEXT,
        verify_update TEXT,
        other TEXT,
        FOREIGN KEY(dept_id) REFERENCES hq_departments(id)
    )
    """)
    
    # 5. Switches
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS switches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no INTEGER,
        name TEXT,
        ip_management TEXT,
        model TEXT,
        permission TEXT,
        other TEXT
    )
    """)
    
    # 6. Public IP Mappings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS public_ip_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no INTEGER,
        name TEXT,
        old_ip TEXT,
        new_ip_6 TEXT,
        new_ip_7 TEXT,
        dns_name TEXT,
        status TEXT,
        note TEXT,
        firewall_allowed TEXT,
        public_dns_changed TEXT,
        note_other TEXT
    )
    """)
    
    # 7. Public IP External
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS public_ip_external (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isp TEXT,
        no INTEGER,
        ip_private TEXT,
        old_ip_public TEXT,
        vlan TEXT,
        ip_address TEXT,
        dns_name TEXT,
        port TEXT,
        status TEXT,
        note TEXT
    )
    """)
    
    # 8. VPN Remote Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vpn_remote_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no TEXT,
        name TEXT,
        position TEXT,
        username TEXT,
        password TEXT,
        department TEXT,
        company TEXT,
        status TEXT,
        purpose TEXT,
        vpn_type TEXT,
        other TEXT
    )
    """)
    
    # 9. Hospital/Bank VPNs
    cursor.execute("DROP TABLE IF EXISTS hospital_vpns")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospital_vpns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no INTEGER,
        name TEXT,
        address TEXT,
        isp TEXT,
        public_ip TEXT,
        subnet TEXT,
        gateway TEXT,
        lan_ip TEXT,
        lan_subnet TEXT,
        lan_gateway TEXT,
        ikey TEXT,
        tunnel TEXT,
        status TEXT,
        contact TEXT,
        year TEXT,
        device TEXT,
        other TEXT,
        reopen_requested INTEGER DEFAULT 0,
        reference_doc TEXT,
        vpn_type TEXT -- 'S2S', 'Close', 'Bank'
    )
    """)
    
    # 10. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        permissions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 11. Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)
    
    # 12. Login Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login_sessions (
        token TEXT PRIMARY KEY,
        status TEXT DEFAULT 'pending',
        username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    
    # Insert default settings templates if not exist
    cursor.execute("SELECT COUNT(*) FROM settings WHERE key = 'telegram_leave_template'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO settings (key, value) VALUES ('telegram_leave_template', 
        'សូមគោរព: {recipients}\n\nតាងនាមខ្ញុំបាទ/នាងខ្ញុំ៖ {name} ({position})\n\nកម្មវត្ថុ: {subject}\n\nមូលហេតុ: {reason}\n\n{closing}\n\nសូមអរគុណ។')
        """)
    cursor.execute("SELECT COUNT(*) FROM settings WHERE key = 'telegram_alert_template'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO settings (key, value) VALUES ('telegram_alert_template', 
        '🔔 <b>[NSSF SOC ALERT]</b>\n\n<b>Type:</b> {alert_type}\n<b>Host:</b> {host}\n<b>IP:</b> {ip}\n<b>Status:</b> {status}\n<b>Time:</b> {time}')
        """)
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        import sys
        sys.path.append(WORKSPACE)
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from auth_utils import hash_password
        admin_pass = hash_password("admin")
        import json
        admin_perms = json.dumps({
            "dashboard": "readwrite",
            "ipam": "readwrite",
            "vpn_remote": "readwrite",
            "hospital_vpn": "readwrite",
            "bank_vpn": "readwrite",
            "public_ip": "readwrite",
            "switches": "readwrite",
            "storage": "readwrite",
            "leave": "readwrite",
            "user_management": "readwrite"
        })
        cursor.execute("""
        INSERT INTO users (username, password_hash, role, full_name, permissions)
        VALUES ('admin', ?, 'admin', 'System Administrator', ?)
        """, (admin_pass, admin_perms))
        
    # Helper to add columns only if they do not exist
    def add_column_if_not_exists(table_name, column_name, column_type):
        is_postgres = (conn.__class__.__name__ == 'PostgresConnectionWrapper')
        if is_postgres:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = %s AND column_name = %s
                );
            """, (table_name, column_name))
            exists = cursor.fetchone()[0]
        else:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [row[1] for row in cursor.fetchall()]
            exists = column_name in columns
            
        if not exists:
            try:
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                conn.commit()
                print(f"Added column {column_name} to table {table_name}.")
            except Exception as e:
                print(f"Failed to add column {column_name} to {table_name}: {e}")
                try:
                    conn.rollback()
                except Exception:
                    pass

    # Migration: add permissions column to users if not exists
    add_column_if_not_exists("users", "permissions", "TEXT")

    # Migration: add profile columns to users if they do not exist
    for col in ["email", "phone", "department", "language", "timezone", "date_format", "theme", "client_ip", "last_login", "telegram_chat_id", "telegram_username"]:
        add_column_if_not_exists("users", col, "TEXT")

    # Ensure admin has permissions seeded if not set
    cursor.execute("SELECT id, permissions FROM users WHERE username = 'admin'")
    admin_row = cursor.fetchone()
    if admin_row and not admin_row[1]:
        import json
        admin_perms = json.dumps({
            "dashboard": "readwrite",
            "ipam": "readwrite",
            "vpn_remote": "readwrite",
            "hospital_vpn": "readwrite",
            "bank_vpn": "readwrite",
            "public_ip": "readwrite",
            "switches": "readwrite",
            "storage": "readwrite",
            "leave": "readwrite",
            "user_management": "readwrite"
        })
        cursor.execute("UPDATE users SET permissions = ? WHERE username = 'admin'", (admin_perms,))

    conn.commit()

def clean_val(val):
    if pd.isna(val) or str(val).strip().lower() in ['nan', 'none', 'null', '']:
        return None
    return str(val).strip()

def to_khmer_number(num):
    khmer_digits = {'0':'០', '1':'១', '2':'២', '3':'៣', '4':'៤', '5':'៥', '6':'៦', '7':'៧', '8':'៨', '9':'៩'}
    return ''.join(khmer_digits[d] for d in str(num))

def parse_branches(conn):
    file_path = os.path.join(WORKSPACE, "IP Address Branch.xlsx")
    if not os.path.exists(file_path):
        print(f"Branch Excel not found: {file_path}")
        return
    
    print("Parsing Branch IP mappings...")
    xl = pd.ExcelFile(file_path)
    
    # Parse Main Subnet
    df_main = pd.read_excel(xl, sheet_name="Main Subnet", header=None)
    
    # Locate headers row (row with No/Branch/IP)
    header_idx = 0
    for idx, row in df_main.iterrows():
        row_vals = [str(x).lower() for x in row.values]
        if 'no' in row_vals and ('branch' in row_vals or 'branch_en' in row_vals or 'ip' in row_vals):
            header_idx = idx
            break
            
    df_main.columns = df_main.iloc[header_idx]
    df_main = df_main.iloc[header_idx+1:]
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM branches")
    cursor.execute("DELETE FROM branch_ips")
    
    # Map sheets to main subnet
    sheet_names = xl.sheet_names
    
    for _, row in df_main.iterrows():
        no = clean_val(row.get('No') or row.iloc[0])
        if not no or not str(no).isdigit():
            continue
            
        name_kh = clean_val(row.get('Branch') or row.iloc[1])
        name_en = clean_val(row.get('Branch_EN') or row.iloc[2])
        if not name_kh and not name_en:
            continue
            
        # Try to find corresponding sheet
        matching_sheet = None
        for s in sheet_names:
            # check if sheet ends with matching names
            if s.strip().endswith(str(name_kh or '')):
                matching_sheet = s
                break
            # try finding sheet that contains Latin name or number
            s_clean = s.replace(' ', '').lower()
            if name_en and name_en.replace(' ', '').lower() in s_clean:
                matching_sheet = s
                break
        
        # If no sheet match yet, try AEON matches
        if not matching_sheet and name_en and 'aeon' in name_en.lower():
            if '1' in name_en or '១' in name_en:
                matching_sheet = [s for s in sheet_names if 'អ៊ីអន_១' in s or 'aeon1' in s.lower()][0] if any('អ៊ីអន_១' in s for s in sheet_names) else None
            elif '2' in name_en or '២' in name_en:
                matching_sheet = [s for s in sheet_names if 'អ៊ីអន_២' in s or 'aeon2' in s.lower()][0] if any('អ៊ីអន_២' in s for s in sheet_names) else None
            elif '3' in name_en or '៣' in name_en:
                matching_sheet = [s for s in sheet_names if 'អ៊ីអន_៣' in s or 'aeon3' in s.lower()][0] if any('អ៊ីអន_៣' in s for s in sheet_names) else None
        
        # Still not found? search sheet names by Khmer index
        if not matching_sheet:
            num = int(no)
            prefix = f"{to_khmer_number(num)}."
            for s in sheet_names:
                if s.strip().startswith(prefix):
                    matching_sheet = s
                    break
                    
        # Try custom fallback for 41 (ខ្មែរ-សូវៀត)
        if not matching_sheet and name_kh and ('សូវៀត' in name_kh or 'soviet' in (name_en or '').lower()):
            for s in sheet_names:
                if 'សូវៀត' in s or 'soviet' in s.lower():
                    matching_sheet = s
                    break
        
        subnet = clean_val(row.get('IP') or row.iloc[3])
        mask = clean_val(row.get('Mask') or row.iloc[4])
        gateway = clean_val(row.get('Gateway') or row.iloc[5])
        no_comp = clean_val(row.get('No_Computer') or row.iloc[6]) if len(row) > 6 else None
        
        cursor.execute("""
        INSERT INTO branches (no, name_kh, name_en, subnet, mask, gateway, no_computer, sheet_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (int(no), name_kh, name_en, subnet, mask, gateway, int(no_comp) if no_comp and str(no_comp).isdigit() else None, matching_sheet))
        
        branch_db_id = cursor.lastrowid
        
        # Now parse the branch's individual sheet if it exists
        if matching_sheet:
            try:
                df_sheet = pd.read_excel(xl, sheet_name=matching_sheet, header=None)
                
                # find host header row
                host_header_idx = 0
                for s_idx, s_row in df_sheet.iterrows():
                    s_vals = [str(x).lower().replace(' ', '').replace('-', '') for x in s_row.values]
                    if 'ipaddress' in s_vals or 'username' in s_vals:
                        host_header_idx = s_idx
                        break
                
                df_hosts = df_sheet.iloc[host_header_idx+1:]
                headers = [str(h).strip() for h in df_sheet.iloc[host_header_idx].values]
                
                for _, host_row in df_hosts.iterrows():
                    h_no = None
                    h_ip = None
                    h_name = None
                    h_pos = None
                    h_mac = None
                    h_dev = None
                    h_status = None
                    h_perm = None
                    h_other = None
                    
                    for col_idx, col_name in enumerate(headers):
                        c_name_lower = col_name.lower().replace(' ', '').replace('-', '')
                        val = clean_val(host_row.iloc[col_idx])
                        if not val:
                            continue
                        
                        if c_name_lower in ['nº', 'no', 'លរ', 'ល.រ']:
                            h_no = val
                        elif 'ip' in c_name_lower or 'address' in c_name_lower or 'ipaddress' in c_name_lower:
                            if '.' in str(val):
                                h_ip = val
                        elif 'user' in c_name_lower or 'name' in c_name_lower or 'ឈ្មោះ' in c_name_lower:
                            h_name = val
                        elif 'pos' in c_name_lower or 'ឋានៈ' in c_name_lower or 'តួនាទី' in c_name_lower:
                            h_pos = val
                        elif 'mac' in c_name_lower or 'physical' in c_name_lower:
                            h_mac = val
                        elif 'device' in c_name_lower or 'type' in c_name_lower or 'ប្រភេទ' in c_name_lower:
                            h_dev = val
                        elif 'status' in c_name_lower or 'ស្ថានភាព' in c_name_lower:
                            h_status = val
                        elif 'perm' in c_name_lower or 'internet' in c_name_lower:
                            h_perm = val
                        elif 'other' in c_name_lower or 'ផ្សេង' in c_name_lower:
                            h_other = val
                    
                    if h_ip:
                        cursor.execute("""
                        INSERT OR REPLACE INTO branch_ips (branch_id, no, ip, user_name, position, mac_address, device_type, status, internet_permission, other)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (branch_db_id, int(h_no) if h_no and str(h_no).isdigit() else None, h_ip, h_name, h_pos, h_mac, h_dev, h_status, h_perm, h_other))
            except Exception as ex:
                print(f"  Error parsing sheet '{matching_sheet}': {ex}")
                
    conn.commit()
    print("Branch IP mappings parsed successfully.")

def parse_hq(conn):
    file_path = os.path.join(WORKSPACE, "NSSF HQ Users IP Address 2024.xlsx")
    if not os.path.exists(file_path):
        print(f"HQ Users Excel not found: {file_path}")
        return
    
    print("Parsing HQ IP mappings...")
    xl = pd.ExcelFile(file_path)
    
    # Parse MAIN SUNET
    df_main = pd.read_excel(xl, sheet_name="MAIN SUNET", header=None)
    
    header_idx = 0
    for idx, row in df_main.iterrows():
        row_vals = [str(x).lower().replace(' ', '').replace('_', '') for x in row.values]
        if 'no' in row_vals and ('department' in row_vals or 'vlanid' in row_vals or 'gateway' in row_vals):
            header_idx = idx
            break
            
    df_main.columns = [str(x).strip() for x in df_main.iloc[header_idx].values]
    df_main = df_main.iloc[header_idx+1:]
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hq_departments")
    cursor.execute("DELETE FROM hq_ips")
    cursor.execute("DELETE FROM switches")
    
    sheet_names = xl.sheet_names
    
    last_dept_name = None
    row_count = 0
    
    for _, row in df_main.iterrows():
        # Check if the row contains values
        if len(row) < 8:
            continue
            
        no_val = clean_val(row.iloc[0])
        dept_name = clean_val(row.iloc[1])
        eng_code = clean_val(row.iloc[3])
        vlan_id = clean_val(row.iloc[4])
        ip_val = clean_val(row.iloc[5])
        mask_val = clean_val(row.iloc[6])
        gw_val = clean_val(row.iloc[7])
        no_comp = clean_val(row.iloc[8]) if len(row) > 8 else None
        
        # Check if it has a valid IP subnet (to skip blank/header rows)
        if not ip_val or '.' not in str(ip_val):
            # Check if it's the switches list row at the very end
            if dept_name and ('switch' in str(dept_name).lower() or 'switch' in str(eng_code).lower()):
                pass
            else:
                continue
                
        # Carry forward department name
        if dept_name:
            last_dept_name = dept_name
        else:
            dept_name = last_dept_name
            
        row_count += 1
        
        # Now find matching sheet using eng_code
        matching_sheet = None
        eng_clean = str(eng_code or '').replace(' ', '').replace('_', '').replace('-', '').lower()
        
        # Prioritize Custom mappings
        if 'admin' in eng_clean:
            matching_sheet = 'ADMIN_DPT'
        elif 'account' in eng_clean or 'acc' in eng_clean:
            matching_sheet = 'ACC_DPT'
        elif 'relation' in eng_clean or 'rel' in eng_clean:
            matching_sheet = 'REL_DPT'
        elif 'hotline' in eng_clean:
            matching_sheet = 'HOT_DPT'
        elif 'benefit' in eng_clean:
            if '02' in eng_clean or '2' in eng_clean:
                matching_sheet = 'BENEFIT_02'
            else:
                matching_sheet = 'BENEFIT_01'
        elif 'policy' in eng_clean:
            matching_sheet = 'POLICY_DPT'
        elif 'registration' in eng_clean or 'regstr' in eng_clean:
            if '02' in eng_clean or '2' in eng_clean:
                matching_sheet = 'REGSTRATION_DPT_02'
            else:
                matching_sheet = 'REGSTRATION_DPT_01'
        elif 'healthcare' in eng_clean or 'hc' in eng_clean or 'health' in eng_clean:
            if '02' in eng_clean or '2' in eng_clean:
                matching_sheet = 'HC02_DPT'
            else:
                matching_sheet = 'HC01_DPT'
        elif 'investment' in eng_clean:
            matching_sheet = 'INVESTMENT_DPT'
        elif 'inspection' in eng_clean:
            matching_sheet = 'INSPECTION_DPT'
        elif 'rehab' in eng_clean:
            matching_sheet = 'REHAB_DPT'
        elif 'audit' in eng_clean:
            matching_sheet = 'AUDIT_DPT'
        elif 'itdevelopment' in eng_clean or 'itdev' in eng_clean:
            if 'test' in eng_clean:
                matching_sheet = 'IT-DEV-TEST'
            else:
                matching_sheet = 'IT-DEV'
        elif 'itmaintenance' in eng_clean or 'itmain' in eng_clean:
            if 'repair' in eng_clean or 'test' in eng_clean:
                matching_sheet = 'IT-MAIN-TEST'
            else:
                matching_sheet = 'IT-MAIN'
        elif 'itsecurity' in eng_clean or 'itsec' in eng_clean:
            if 'test' in eng_clean:
                matching_sheet = 'IT-SEC-TEST'
            else:
                matching_sheet = 'IT-SEC'
        elif 'meeting' in eng_clean or 'hall' in eng_clean or 'room' in eng_clean:
            matching_sheet = 'Meeting-Room'
        elif 'library' in eng_clean or 'បណ្ណាល័យ' in (dept_name or '').lower():
            matching_sheet = 'Library'
            
        # Fallback to sheet names check
        if not matching_sheet and eng_clean:
            for s in sheet_names:
                s_clean = s.replace(' ', '').replace('_', '').replace('-', '').lower()
                if s_clean == eng_clean or s_clean in eng_clean or eng_clean in s_clean:
                    matching_sheet = s
                    break
                    
        # Fallback gateway device name
        gw_dev = 'Core SW'
        
        cursor.execute("""
        INSERT INTO hq_departments (no, name_en, vlan_id, subnet, mask, gateway, gw_device, no_computer, sheet_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (row_count, dept_name, vlan_id, ip_val, mask_val, gw_val, gw_dev, int(no_comp) if no_comp and str(no_comp).isdigit() else None, matching_sheet))
        
        dept_db_id = cursor.lastrowid
        
        if matching_sheet:
            try:
                df_sheet = pd.read_excel(xl, sheet_name=matching_sheet, header=None)
                
                host_header_idx = 0
                for s_idx, s_row in df_sheet.iterrows():
                    s_vals = [str(x).lower().replace(' ', '').replace('_', '').replace('-', '') for x in s_row.values]
                    if 'ipaddress' in s_vals or 'username' in s_vals or 'latin' in s_vals:
                        host_header_idx = s_idx
                        break
                        
                df_hosts = df_sheet.iloc[host_header_idx+1:]
                headers = [str(h).strip() for h in df_sheet.iloc[host_header_idx].values]
                sub_headers = []
                if host_header_idx + 1 < len(df_sheet):
                    next_row = df_sheet.iloc[host_header_idx+1].values
                    sub_headers = [str(x).strip().lower() for x in next_row]
                
                has_sub_header = any(x in ['latin', 'khmer'] for x in sub_headers)
                
                start_row = host_header_idx + 1
                if has_sub_header:
                    start_row = host_header_idx + 2
                    df_hosts = df_sheet.iloc[start_row:]
                
                for _, host_row in df_hosts.iterrows():
                    h_no = None
                    h_ip = None
                    h_name_latin = None
                    h_name_khmer = None
                    h_pos = None
                    h_old_ip = None
                    h_mask = None
                    h_gw = None
                    h_status = None
                    h_perm = None
                    h_group = None
                    h_verify = None
                    h_other = None
                    
                    for col_idx in range(len(headers)):
                        col_name = headers[col_idx]
                        h1 = str(col_name).lower().strip() if not pd.isna(col_name) else ""
                        h2 = ""
                        if has_sub_header and col_idx < len(sub_headers) and not pd.isna(sub_headers[col_idx]):
                            h2 = str(sub_headers[col_idx]).lower().strip()
                            
                        combined = f"{h1} {h2}"
                        c_clean = combined.replace('nan', '').replace(' ', '').replace('_', '').replace('-', '')
                        
                        val = clean_val(host_row.iloc[col_idx])
                        if not val:
                            continue
                            
                        if c_clean in ['nº', 'no', 'លរ', 'ល.រ']:
                            h_no = val
                        elif 'oldip' in c_clean:
                            h_old_ip = val
                        elif 'ipaddress' in c_clean or c_clean == 'ip':
                            if '.' in str(val):
                                h_ip = val
                        elif 'latin' in c_clean or 'en' in c_clean:
                            h_name_latin = val
                        elif 'khmer' in c_clean or 'kh' in c_clean or 'ខ្មែរ' in c_clean:
                            h_name_khmer = val
                        elif 'username' in c_clean or 'user' in c_clean or 'name' in c_clean:
                            if not h_name_latin:
                                h_name_latin = val
                            else:
                                h_name_khmer = val
                        elif 'pos' in c_clean or 'ឋានៈ' in c_clean or 'តួនាទី' in c_clean:
                            h_pos = val
                        elif 'subnetmask' in c_clean or c_clean == 'mask':
                            h_mask = val
                        elif 'gateway' in c_clean:
                            h_gw = val
                        elif 'status' in c_clean:
                            h_status = val
                        elif 'permission' in c_clean or 'internet' in c_clean:
                            h_perm = val
                        elif 'group' in c_clean or 'system' in c_clean:
                            h_group = val
                        elif 'verify' in c_clean or 'lastday' in c_clean:
                            h_verify = val
                        elif 'other' in c_clean or 'ផ្សេង' in c_clean:
                            h_other = val
                            
                    if h_ip:
                        if h_name_latin and not h_name_khmer:
                            is_khmer = any('\u1780' <= c <= '\u17ff' for c in h_name_latin)
                            if is_khmer:
                                h_name_khmer = h_name_latin
                                h_name_latin = None
                                
                        cursor.execute("""
                        INSERT OR REPLACE INTO hq_ips (dept_id, no, ip, user_name_kh, user_name_en, position, old_ip, subnet_mask, gateway, status, internet_permission, group_system, verify_update, other)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (dept_db_id, int(h_no) if h_no and str(h_no).isdigit() else None, h_ip, h_name_khmer, h_name_latin, h_pos, h_old_ip, h_mask, h_gw, h_status, h_perm, h_group, h_verify, h_other))
            except Exception as ex:
                print(f"  Error parsing HQ sheet '{matching_sheet}': {ex}")
                
    if 'IP-Switch-List' in sheet_names:
        try:
            df_switches = pd.read_excel(xl, sheet_name='IP-Switch-List', header=None)
            header_sw_idx = 0
            for idx, row in df_switches.iterrows():
                row_vals = [str(x).lower().replace(' ', '').replace('-', '') for x in row.values]
                if 'ipmanagement' in row_vals or 'switch' in row_vals or 'លរ' in row_vals:
                    header_sw_idx = idx
                    break
            df_sw_data = df_switches.iloc[header_sw_idx+1:]
            
            for _, sw_row in df_sw_data.iterrows():
                no_v = clean_val(sw_row.iloc[0])
                name_v = clean_val(sw_row.iloc[1])
                ip_v = clean_val(sw_row.iloc[2])
                model_v = clean_val(sw_row.iloc[3])
                perm_v = clean_val(sw_row.iloc[4]) if len(sw_row) > 4 else None
                oth_v = clean_val(sw_row.iloc[5]) if len(sw_row) > 5 else None
                
                if ip_v and name_v:
                    cursor.execute("""
                    INSERT INTO switches (no, name, ip_management, model, permission, other)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (int(no_v) if no_v and str(no_v).isdigit() else None, name_v, ip_v, model_v, perm_v, oth_v))
        except Exception as ex:
            print(f"  Error parsing Switch List: {ex}")
            
    conn.commit()
    print("HQ IP mappings and Switches parsed successfully.")

def parse_public_ip_mappings(conn):
    file_path = os.path.join(WORKSPACE, "NSSF IP PUBLIC HOST MAPPING UPDATE 2025-2028.xlsx")
    if not os.path.exists(file_path):
        print(f"Public IP mappings Excel not found: {file_path}")
        return
        
    print("Parsing Public IP host mappings...")
    xl = pd.ExcelFile(file_path)
    df = pd.read_excel(xl, sheet_name="Sheet1", header=None)
    
    header_idx = 0
    for idx, row in df.iterrows():
        row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '') for x in row.values]
        if 'oldipaddress' in row_vals or 'dnsname' in row_vals or 'newip' in row_vals:
            header_idx = idx
            break
            
    headers = [str(x).strip() for x in df.iloc[header_idx].values]
    df_data = df.iloc[header_idx+1:]
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM public_ip_mappings")
    
    for _, row in df_data.iterrows():
        no = None
        name = None
        old_ip = None
        new_ip_6 = None
        new_ip_7 = None
        dns_name = None
        status = None
        note = None
        fw_allow = None
        pub_dns = None
        note_other = None
        
        for col_idx, col_name in enumerate(headers):
            c_name = col_name.lower().replace(' ', '').replace('.', '').replace('#', '')
            val = clean_val(row.iloc[col_idx])
            if not val:
                continue
                
            if c_name == 'no' or col_idx == 1:
                if str(val).isdigit():
                    no = int(val)
                elif not name:
                    name = val
            elif 'name' in c_name:
                name = val
            elif 'oldip' in c_name:
                old_ip = val
            elif 'newip6' in c_name or ('newip' in c_name and '6' in c_name):
                new_ip_6 = val
            elif 'newip7' in c_name or ('newip' in c_name and '7' in c_name):
                new_ip_7 = val
            elif 'dnsname' in c_name:
                dns_name = val
            elif 'status' in c_name:
                status = val
            elif 'note' in c_name:
                if not note:
                    note = val
                else:
                    note_other = val
            elif 'firewall' in c_name or 'fw' in c_name:
                fw_allow = val
            elif 'publicdns' in c_name:
                pub_dns = val
                
        if name or old_ip or dns_name:
            cursor.execute("""
            INSERT INTO public_ip_mappings (no, name, old_ip, new_ip_6, new_ip_7, dns_name, status, note, firewall_allowed, public_dns_changed, note_other)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (no, name, old_ip, new_ip_6, new_ip_7, dns_name, status, note, fw_allow, pub_dns, note_other))
            
    conn.commit()
    print("Public IP mappings parsed successfully.")

def parse_public_ip_external(conn):
    import glob
    files = glob.glob(os.path.join(WORKSPACE, "*IP PUBLIC*ពីខាងក្រៅ*.xlsx"))
    if not files:
        print("External Public IP Excel not found.")
        return
    file_path = files[0]
    
    print("Parsing External Public IP mappings...")
    xl = pd.ExcelFile(file_path)
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM public_ip_external")
    
    for sheet in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet, header=None)
        
        header_idx = 0
        for idx, row in df.iterrows():
            row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '') for x in row.values]
            if 'ipprivate' in row_vals or 'ippublic' in row_vals or 'dnsname' in row_vals:
                header_idx = idx
                break
                
        headers = [str(x).strip() for x in df.iloc[header_idx].values]
        df_data = df.iloc[header_idx+1:]
        
        for _, row in df_data.iterrows():
            isp = None
            no = None
            ip_private = None
            old_ip_public = None
            vlan = None
            ip_address = None
            dns_name = None
            port = None
            status = None
            note = None
            
            for col_idx, col_name in enumerate(headers):
                c_name = col_name.lower().replace(' ', '').replace('.', '').replace('#', '')
                val = clean_val(row.iloc[col_idx])
                if not val:
                    continue
                    
                if 'isp' in c_name:
                    isp = val
                elif c_name == 'no' or col_idx == 0:
                    no = int(val) if str(val).isdigit() else None
                elif 'private' in c_name:
                    ip_private = val
                elif 'oldippublic' in c_name:
                    old_ip_public = val
                elif 'vlan' in c_name:
                    vlan = val
                elif 'ipaddress' in c_name or c_name == 'ip':
                    ip_address = val
                elif 'dnsname' in c_name:
                    dns_name = val
                elif 'port' in c_name:
                    port = val
                elif 'status' in c_name:
                    status = val
                elif 'note' in c_name:
                    note = val
                    
            if ip_private or ip_address or dns_name:
                cursor.execute("""
                INSERT INTO public_ip_external (isp, no, ip_private, old_ip_public, vlan, ip_address, dns_name, port, status, note)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (isp, no, ip_private, old_ip_public, vlan, ip_address, dns_name, port, status, note))
                
    conn.commit()
    print("External Public IP mapped parsed successfully.")

def parse_vpn_remote_users(conn):
    import glob
    files = glob.glob(os.path.join(WORKSPACE, "*VPN Remote Access*.xlsx"))
    if not files:
        print("VPN Remote Access Excel not found.")
        return
    file_path = files[0]
    
    print("Parsing VPN Remote Access Users...")
    xl = pd.ExcelFile(file_path)
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vpn_remote_users")
    
    for sheet in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet, header=None)
        
        header_idx = 0
        for idx, row in df.iterrows():
            row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '').replace('លរ', '').replace('ល.រ', '') for x in row.values]
            if 'username' in row_vals or 'password' in row_vals or 'គោត្តនាម' in row_vals or 'hospitalname' in row_vals:
                header_idx = idx
                break
                
        headers = [str(x).strip() for x in df.iloc[header_idx].values]
        df_data = df.iloc[header_idx+1:]
        
        for _, row in df_data.iterrows():
            no = None
            name = None
            pos = None
            username = None
            password = None
            dept = None
            company = None
            status = None
            purpose = None
            vpn_type = None
            other = None
            
            hospital_name = None
            
            for col_idx, col_name in enumerate(headers):
                c_name = col_name.lower().replace(' ', '').replace('.', '').replace('#', '')
                val = clean_val(row.iloc[col_idx])
                if not val:
                    continue
                    
                if c_name in ['លរ', 'ល.រ', 'no']:
                    no = val
                elif 'hospitalname' in c_name:
                    hospital_name = val
                elif 'username' in c_name:
                    username = val
                elif 'គោត្តនាម' in c_name or 'name' in c_name:
                    name = val
                elif 'ឋានៈ' in c_name or 'position' in c_name:
                    pos = val
                elif 'password' in c_name:
                    password = val
                elif 'department' in c_name:
                    dept = val
                elif 'ប.ស.ស' in c_name or 'company' in c_name:
                    company = val
                elif 'ស្ថានភាព' in c_name or 'status' in c_name:
                    status = val
                elif 'គោលបំណង' in c_name or 'purpose' in c_name:
                    purpose = val
                elif 'vpn' in c_name:
                    vpn_type = val
                elif 'ផ្សេង' in c_name or 'other' in c_name:
                    other = val
            
            if hospital_name:
                name = f"{hospital_name} - {name or ''}"
                
            if username or name:
                cursor.execute("""
                INSERT INTO vpn_remote_users (no, name, position, username, password, department, company, status, purpose, vpn_type, other)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (no, name, pos, username, password, dept, company, status, purpose, vpn_type, other))
                
    conn.commit()
    print("VPN Remote Access Users parsed successfully.")

def parse_hospital_vpns(conn):
    import glob
    files = glob.glob(os.path.join(WORKSPACE, "*PRIVATE-HOSPITAL-VPN*.xlsx"))
    if not files:
        print("Private Hospital VPN Excel not found.")
        return
    file_path = files[0]
    
    print("Parsing Hospital/Bank VPN configurations...")
    xl = pd.ExcelFile(file_path)
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hospital_vpns")
    cursor.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'hospital_vpns'")
    
    if 'Hospital-VPN-S2S' in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name='Hospital-VPN-S2S', header=None)
        
        header_idx = 0
        for idx, row in df.iterrows():
            row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '') for x in row.values]
            if 'hospitalname' in row_vals or 'publicip' in row_vals or 'ikey' in row_vals:
                header_idx = idx
                break
                
        headers = [str(x).strip() for x in df.iloc[header_idx].values]
        df_data = df.iloc[header_idx+1:]
        
        for _, row in df_data.iterrows():
            no = None
            name = None
            address = None
            isp = None
            pub_ip = None
            subnet = None
            gateway = None
            lan_ip = None
            lan_subnet = None
            lan_gateway = None
            ikey = None
            tunnel = None
            status = None
            contact = None
            year = None
            device = None
            other = None
            
            subnet_count = 0
            gw_count = 0
            
            for col_idx, col_name in enumerate(headers):
                c_name = col_name.lower().replace(' ', '').replace('.', '').replace('#', '')
                val = clean_val(row.iloc[col_idx])
                if not val:
                    continue
                    
                if col_idx == 0 or c_name == 'nº':
                    no = int(val) if str(val).isdigit() else None
                elif 'hospitalname' in c_name:
                    name = val
                elif 'address' in c_name:
                    address = val
                elif 'isp' in c_name:
                    isp = val
                elif 'publicip' in c_name:
                    pub_ip = val
                elif 'subnet' in c_name:
                    if subnet_count == 0:
                        subnet = val
                        subnet_count += 1
                    else:
                        lan_subnet = val
                elif 'gateway' in c_name:
                    if gw_count == 0:
                        gateway = val
                        gw_count += 1
                    else:
                        lan_gateway = val
                elif 'lanip' in c_name:
                    lan_ip = val
                elif 'ikey' in c_name or 'preshare' in c_name:
                    ikey = val
                elif 'tunnel' in c_name:
                    tunnel = val
                elif 'status' in c_name:
                    status = val
                elif 'contact' in c_name:
                    contact = val
                elif 'year' in c_name:
                    year = val
                elif 'device' in c_name:
                    device = val
                elif 'other' in c_name:
                    other = val
                    
            reopen_req = 0
            ref_doc = None
            if other:
                other_str = str(other).strip()
                if " | " in other_str:
                    parts = other_str.split(" | ", 1)
                    ref_doc = parts[0].strip()
                    other = parts[1].strip()
                elif any(w in other_str for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                    ref_doc = other_str
                    
                if ref_doc and any(w in str(ref_doc) for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                    reopen_req = 1

            if name or pub_ip:
                cursor.execute("""
                INSERT INTO hospital_vpns (no, name, address, isp, public_ip, subnet, gateway, lan_ip, lan_subnet, lan_gateway, ikey, tunnel, status, contact, year, device, other, reopen_requested, reference_doc, vpn_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'S2S')
                """, (no, name, address, isp, pub_ip, subnet, gateway, lan_ip, lan_subnet, lan_gateway, ikey, tunnel, status, contact, year, device, other, reopen_req, ref_doc))
                
    if 'VPN-HOS-Close' in xl.sheet_names:
        try:
            df = pd.read_excel(xl, sheet_name='VPN-HOS-Close', header=None)
            header_idx = 0
            for idx, row in df.iterrows():
                row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '') for x in row.values]
                if 'hospitalname' in row_vals or 'status' in row_vals:
                    header_idx = idx
                    break
            headers = [str(x).strip() for x in df.iloc[header_idx].values]
            df_data = df.iloc[header_idx+1:]
            for _, row in df_data.iterrows():
                no = clean_val(row.iloc[0])
                name = clean_val(row.iloc[1])
                addr = clean_val(row.iloc[2]) if len(row) > 2 else None
                year = clean_val(row.iloc[3]) if len(row) > 3 else None
                stat = clean_val(row.iloc[4]) if len(row) > 4 else None
                oth = clean_val(row.iloc[5]) if len(row) > 5 else None
                
                reopen_req = 0
                ref_doc = None
                if oth:
                    oth_str = str(oth).strip()
                    if " | " in oth_str:
                        parts = oth_str.split(" | ", 1)
                        ref_doc = parts[0].strip()
                        oth = parts[1].strip()
                    elif any(w in oth_str for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                        ref_doc = oth_str
                        
                    if ref_doc and any(w in str(ref_doc) for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                        reopen_req = 1
                elif stat and any(w in str(stat) for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                    reopen_req = 1
                    ref_doc = stat

                if name:
                    cursor.execute("""
                    INSERT INTO hospital_vpns (no, name, address, status, year, other, reopen_requested, reference_doc, vpn_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Close')
                    """, (int(no) if no and str(no).isdigit() else None, name, addr, stat, year, oth, reopen_req, ref_doc))
        except Exception as ex:
            print(f"  Error parsing Close Hospital VPNs: {ex}")
            
    if 'Bank-VPN' in xl.sheet_names:
        try:
            df = pd.read_excel(xl, sheet_name='Bank-VPN', header=None)
            header_idx = 0
            for idx, row in df.iterrows():
                row_vals = [str(x).lower().replace(' ', '').replace('.', '').replace('#', '') for x in row.values]
                if 'ippublic' in row_vals or 'preshare' in row_vals or 'ikeversion' in row_vals:
                    header_idx = idx
                    break
            headers = [str(x).strip() for x in df.iloc[header_idx].values]
            df_data = df.iloc[header_idx+1:]
            for _, row in df_data.iterrows():
                no = clean_val(row.iloc[0])
                name = clean_val(row.iloc[1])
                pub_ip = clean_val(row.iloc[2])
                lan_ip = clean_val(row.iloc[3])
                nssf_pro = clean_val(row.iloc[4]) if len(row) > 4 else None
                stg_sit = clean_val(row.iloc[5]) if len(row) > 5 else None
                uat = clean_val(row.iloc[6]) if len(row) > 6 else None
                ike_ver = clean_val(row.iloc[7]) if len(row) > 7 else None
                psk = clean_val(row.iloc[8]) if len(row) > 8 else None
                device = clean_val(row.iloc[10]) if len(row) > 10 else None
                date_val = clean_val(row.iloc[11]) if len(row) > 11 else None
                
                reopen_req = 0
                ref_doc = None
                if name or pub_ip:
                    other_info = f"NSSF-IP-PRO: {nssf_pro or ''} | STG/SIT: {stg_sit or ''} | UAT: {uat or ''} | Date: {date_val or ''}"
                    if any(w in other_info for w in ["បើកវិញ", "ស្នើសុំ", "reopen"]):
                        reopen_req = 1
                        ref_doc = other_info
                    
                    cursor.execute("""
                    INSERT INTO hospital_vpns (no, name, public_ip, lan_ip, ikey, device, status, other, reopen_requested, reference_doc, vpn_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bank')
                    """, (int(no) if no and str(no).isdigit() else None, name, pub_ip, lan_ip, psk, device, ike_ver, other_info, reopen_req, ref_doc))
        except Exception as ex:
            print(f"  Error parsing Bank VPNs: {ex}")
            
    conn.commit()
    print("Hospital/Bank VPN configurations parsed successfully.")

def main():
    conn = get_db_connection()
    try:
        create_tables(conn)
        parse_branches(conn)
        parse_hq(conn)
        parse_public_ip_mappings(conn)
        parse_public_ip_external(conn)
        parse_vpn_remote_users(conn)
        parse_hospital_vpns(conn)
        print("Data parsing and seeding completed successfully!")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
