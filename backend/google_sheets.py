import os
import time
import gspread
import pandas as pd
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

load_dotenv()

WORKSPACE = r"c:\Users\Miller\Documents\SOC-Work-WebAPP"

def get_gspread_client():
    """
    Authenticates using the Service Account credentials file specified in .env
    """
    credentials_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "backend/google_credentials.json")
    if not os.path.isabs(credentials_file):
        credentials_file = os.path.join(WORKSPACE, credentials_file)
        
    if not os.path.exists(credentials_file):
        return None
        
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    try:
        credentials = Credentials.from_service_account_file(credentials_file, scopes=scopes)
        gc = gspread.authorize(credentials)
        return gc
    except Exception as e:
        print(f"Failed to authenticate with Google Sheets: {e}")
        return None

def call_gspread_with_retry(func, *args, **kwargs):
    import time
    retries = 5
    delay = 3
    for attempt in range(retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            is_rate_limit = False
            if hasattr(e, 'code') and e.code == 429:
                is_rate_limit = True
            elif "429" in str(e):
                is_rate_limit = True
                
            if is_rate_limit:
                print(f"Google API 429 Rate Limit hit. Retrying in {delay} seconds... (Attempt {attempt+1}/{retries})")
                time.sleep(delay)
                delay *= 2
            else:
                raise e
    return func(*args, **kwargs)

def sync_ip_to_google_sheet(sheet_type, sheet_name, ip_address, updates):
    """
    Updates cells on Google Sheets for a specific IP Address in real-time.
    sheet_type: 'branch' or 'hq'
    sheet_name: name of the worksheet/tab
    ip_address: host IP address to locate
    updates: dict of {field_name: new_value}
    """
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    if not use_gs:
        return False, "Google Sheets sync is disabled"

    spreadsheet_id = os.getenv("BRANCH_SPREADSHEET_ID") if sheet_type == 'branch' else os.getenv("HQ_SPREADSHEET_ID")
    if not spreadsheet_id:
        return False, "Spreadsheet ID is not configured"

    client = get_gspread_client()
    if not client:
        return False, "Google credentials file not found or invalid"

    try:
        sh = call_gspread_with_retry(client.open_by_key, spreadsheet_id)
        worksheet = call_gspread_with_retry(sh.worksheet, sheet_name)
        
        all_values = call_gspread_with_retry(worksheet.get_all_values)
        if not all_values:
            return False, "Worksheet is empty"

        header_row_idx = None
        ip_col_idx = None
        
        # Scan first 15 rows for headers
        for idx, row in enumerate(all_values[:15]):
            row_vals = [str(x).lower().replace(' ', '').replace('_', '').replace('-', '') for x in row]
            if 'ipaddress' in row_vals or 'ip' in row_vals:
                header_row_idx = idx
                for c_idx, val in enumerate(row_vals):
                    if 'ipaddress' in val or 'ip' in val:
                        if 'old' not in val:  # avoid mapping legacy Old IP column
                            ip_col_idx = c_idx
                            break
                break

        if header_row_idx is None or ip_col_idx is None:
            return False, "Could not locate IP Address column in Google Sheet"

        # Get column names and index mapping
        headers = {}
        for c_idx, h_val in enumerate(all_values[header_row_idx]):
            clean_h = str(h_val).lower().replace(' ', '').replace('_', '').replace('-', '')
            if clean_h:
                headers[clean_h] = c_idx

        # Search for row containing target IP
        target_row_idx = None
        for r_idx, row in enumerate(all_values[header_row_idx + 1:], start=header_row_idx + 2):
            if ip_col_idx < len(row) and row[ip_col_idx].strip() == ip_address.strip():
                target_row_idx = r_idx
                break

        if not target_row_idx:
            return False, f"IP Address {ip_address} not found in Google Sheet"

        # Map database fields to sheet headers
        col_mappings = {
            'user_name': ['username', 'name', 'ឈ្មោះ'],
            'user_name_en': ['latin', 'en', 'username', 'name', 'user'],
            'user_name_kh': ['khmer', 'kh', 'ខ្មែរ'],
            'position': ['position', 'pos', 'ឋានៈ', 'តួនាទី'],
            'mac_address': ['macaddress', 'mac', 'physical'],
            'device_type': ['devicetype', 'device', 'type', 'ប្រភេទ'],
            'status': ['status', 'ស្ថានភាព'],
            'internet_permission': ['internetpermission', 'internet', 'permission', 'perm'],
            'old_ip': ['oldip'],
            'subnet_mask': ['subnetmask', 'mask'],
            'gateway': ['gateway', 'gw'],
            'group_system': ['groupsystem', 'group', 'system'],
            'verify_update': ['verifyupdate', 'verify', 'lastday'],
            'other': ['other', 'ផ្សេង']
        }

        # Accumulate cell updates
        cells_to_update = []
        for field, new_val in updates.items():
            target_col_idx = None
            possible_headers = col_mappings.get(field, [])
            
            for h_name, idx in headers.items():
                if h_name in possible_headers or any(p in h_name for p in possible_headers):
                    target_col_idx = idx
                    break
            
            if target_col_idx is not None:
                val_str = str(new_val) if new_val is not None else ""
                # gspread uses 1-based indexing for row and column
                cells_to_update.append(gspread.cell.Cell(target_row_idx, target_col_idx + 1, val_str))

        if cells_to_update:
            call_gspread_with_retry(worksheet.update_cells, cells_to_update)
            return True, "Synced successfully"
        
        return True, "No columns matched for updates"

    except Exception as e:
        return False, str(e)

def download_google_sheet_to_local_excel(sheet_type, local_file_name):
    """
    Downloads worksheets of a Google Spreadsheet and caches them locally as .xlsx
    """
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    if not use_gs:
        return False, "Google Sheets sync is disabled"

    if sheet_type == 'branch':
        spreadsheet_id = os.getenv("BRANCH_SPREADSHEET_ID")
    elif sheet_type == 'hq':
        spreadsheet_id = os.getenv("HQ_SPREADSHEET_ID")
    elif sheet_type == 'hospital':
        spreadsheet_id = os.getenv("HOSPITAL_SPREADSHEET_ID")
    else:
        spreadsheet_id = None
        
    if not spreadsheet_id:
        return False, "Spreadsheet ID is not configured in .env"

    client = get_gspread_client()
    if not client:
        return False, "Google credentials file not found or invalid"

    local_path = os.path.join(WORKSPACE, local_file_name)

    try:
        import tempfile
        sh = call_gspread_with_retry(client.open_by_key, spreadsheet_id)
        
        # Write to a temp file first to ensure atomic write
        temp_dir = os.path.dirname(local_path) or WORKSPACE
        fd, temp_path = tempfile.mkstemp(suffix=".xlsx", dir=temp_dir)
        os.close(fd) # Close file descriptor to allow pandas to open it
        
        try:
            with pd.ExcelWriter(temp_path, engine='openpyxl') as writer:
                worksheets = call_gspread_with_retry(sh.worksheets)
                for worksheet in worksheets:
                    time.sleep(0.5)  # Safe delay between sheets
                    data = call_gspread_with_retry(worksheet.get_all_values)
                    if not data:
                        continue
                    df = pd.DataFrame(data)
                    df.to_excel(writer, sheet_name=worksheet.title, index=False, header=False)
            
            # Atomic replacement
            if os.path.exists(local_path):
                os.remove(local_path)
            os.rename(temp_path, local_path)
        except Exception as write_err:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise write_err
            
        return True, f"Successfully downloaded '{sh.title}' to {local_file_name}"
    except Exception as e:
        return False, str(e)

def sync_hospital_vpn_to_google_sheet(sheet_name, vpn_type, vpn_no, vpn_name, updates):
    """
    Updates the Hospital S2S VPN details in Google Sheets worksheet.
    """
    use_gs = os.getenv("USE_GOOGLE_SHEETS", "false").lower() == "true"
    if not use_gs:
        return False, "Google Sheets sync is disabled"
        
    spreadsheet_id = os.getenv("HOSPITAL_SPREADSHEET_ID")
    if not spreadsheet_id:
        return False, "Hospital Spreadsheet ID is not configured in .env"
        
    client = get_gspread_client()
    if not client:
        return False, "Google credentials file not found or invalid"
        
    try:
        sh = call_gspread_with_retry(client.open_by_key, spreadsheet_id)
        worksheet = call_gspread_with_retry(sh.worksheet, sheet_name)
        
        all_values = call_gspread_with_retry(worksheet.get_all_values)
        if not all_values:
            return False, "Worksheet is empty"
            
        header_row_idx = None
        for idx, row in enumerate(all_values[:10]):
            row_vals = [str(x).lower().replace(' ', '') for x in row]
            if any('hospitalname' in val or 'ippublic' in val or 'status' in val or 'publicip' in val for val in row_vals):
                header_row_idx = idx
                break
                
        if header_row_idx is None:
            header_row_idx = 0
            
        # Headers map
        headers = {}
        for c_idx, h_val in enumerate(all_values[header_row_idx]):
            clean_h = str(h_val).lower().replace(' ', '').replace('_', '').replace('-', '')
            if clean_h:
                headers[clean_h] = c_idx
                
        # Find row
        target_row_idx = None
        for r_idx, row in enumerate(all_values[header_row_idx + 1:], start=header_row_idx + 2):
            row_no = row[0].strip() if len(row) > 0 else ""
            row_name = row[1].strip() if len(row) > 1 else ""
            
            match = False
            if vpn_no and row_no == str(vpn_no):
                match = True
            elif vpn_name and row_name.lower() == vpn_name.lower():
                match = True
                
            if match:
                target_row_idx = r_idx
                break
                
        if not target_row_idx:
            return False, "Row not found in Google Sheet"
            
        cells_to_update = []
        import sqlite3
        
        if vpn_type == 'S2S':
            subnet_cols = [idx for h_key, idx in headers.items() if 'subnet' in h_key]
            gw_cols = [idx for h_key, idx in headers.items() if 'gateway' in h_key]
            
            # Query full DB record to construct Other text correctly (combining reference_doc and other)
            conn_db = sqlite3.connect(os.path.join(WORKSPACE, "soc_network.db"))
            conn_db.row_factory = sqlite3.Row
            db_cursor = conn_db.cursor()
            db_cursor.execute("SELECT reference_doc, other FROM hospital_vpns WHERE no = ?", (vpn_no,))
            db_row = db_cursor.fetchone()
            conn_db.close()
            
            db_ref = db_row['reference_doc'] if db_row else ''
            db_other = db_row['other'] if db_row else ''
            
            final_other_val = ""
            if db_ref and db_other:
                final_other_val = f"{db_ref} | {db_other}"
            elif db_ref:
                final_other_val = db_ref
            else:
                final_other_val = db_other

            for field, new_val in updates.items():
                val_str = str(new_val) if new_val is not None else ""
                if field == 'subnet' and len(subnet_cols) > 0:
                    cells_to_update.append(gspread.cell.Cell(target_row_idx, subnet_cols[0] + 1, val_str))
                elif field == 'lan_subnet' and len(subnet_cols) > 1:
                    cells_to_update.append(gspread.cell.Cell(target_row_idx, subnet_cols[1] + 1, val_str))
                elif field == 'gateway' and len(gw_cols) > 0:
                    cells_to_update.append(gspread.cell.Cell(target_row_idx, gw_cols[0] + 1, val_str))
                elif field == 'lan_gateway' and len(gw_cols) > 1:
                    cells_to_update.append(gspread.cell.Cell(target_row_idx, gw_cols[1] + 1, val_str))
                elif field in ['other', 'reference_doc']:
                    target_col_idx = None
                    for h_name, idx in headers.items():
                        if 'other' in h_name:
                            target_col_idx = idx
                            break
                    if target_col_idx is not None:
                        cells_to_update.append(gspread.cell.Cell(target_row_idx, target_col_idx + 1, str(final_other_val)))
                else:
                    col_mappings = {
                        'name': ['hospitalname'],
                        'address': ['address'],
                        'isp': ['isp'],
                        'public_ip': ['publicip'],
                        'lan_ip': ['lanip'],
                        'ikey': ['ikey'],
                        'tunnel': ['tunnel'],
                        'status': ['status'],
                        'contact': ['contact'],
                        'year': ['year'],
                        'device': ['device']
                    }
                    if field in col_mappings:
                        possible_headers = col_mappings[field]
                        target_col_idx = None
                        for h_name, idx in headers.items():
                            if any(ph in h_name for ph in possible_headers):
                                target_col_idx = idx
                                break
                        if target_col_idx is not None:
                            cells_to_update.append(gspread.cell.Cell(target_row_idx, target_col_idx + 1, val_str))
                            
        elif vpn_type == 'Close':
            conn = sqlite3.connect(os.path.join(WORKSPACE, "soc_network.db"))
            conn.row_factory = sqlite3.Row
            db_cursor = conn.cursor()
            db_cursor.execute("SELECT reopen_requested, reference_doc, other FROM hospital_vpns WHERE no = ?", (vpn_no,))
            db_row = db_cursor.fetchone()
            conn.close()
            
            db_reopen = db_row['reopen_requested'] if db_row else 0
            db_ref = db_row['reference_doc'] if db_row else ''
            db_other = db_row['other'] if db_row else ''
            
            final_other_val = db_ref or db_other
            if db_reopen:
                if final_other_val and "បើកវិញ" not in final_other_val and "ស្នើសុំ" not in final_other_val:
                    final_other_val = f"បើកវិញបណ្តោះអាសន្ន {final_other_val}"
                elif not final_other_val:
                    final_other_val = "បើកវិញបណ្តោះអាសន្ន"
                    
            for field, new_val in updates.items():
                col_mappings = {
                    'name': ['hospitalname'],
                    'address': ['address'],
                    'year': ['year'],
                    'status': ['status'],
                    'other': ['other']
                }
                if field in col_mappings:
                    possible_headers = col_mappings[field]
                    target_col_idx = None
                    for h_name, idx in headers.items():
                        if any(ph in h_name for ph in possible_headers):
                            target_col_idx = idx
                            break
                    if target_col_idx is not None:
                        val_str = final_other_val if field == 'other' else str(new_val)
                        cells_to_update.append(gspread.cell.Cell(target_row_idx, target_col_idx + 1, val_str))
                        
            if 'other' not in updates and ('reopen_requested' in updates or 'reference_doc' in updates):
                other_col_idx = None
                for h_name, idx in headers.items():
                    if 'other' in h_name or 'ផ្សេង' in h_name:
                        other_col_idx = idx
                        break
                if other_col_idx is not None:
                    cells_to_update.append(gspread.cell.Cell(target_row_idx, other_col_idx + 1, final_other_val))
                    
        elif vpn_type == 'Bank':
            for field, new_val in updates.items():
                col_mappings = {
                    'name': ['name'],
                    'public_ip': ['ippublic'],
                    'lan_ip': ['ipaddresspro', 'pro'],
                    'ikey': ['presharekey', 'preshare'],
                    'device': ['device'],
                    'status': ['ikeversion', 'ike'],
                }
                if field in col_mappings:
                    possible_headers = col_mappings[field]
                    target_col_idx = None
                    for h_name, idx in headers.items():
                        if any(ph in h_name for ph in possible_headers):
                            target_col_idx = idx
                            break
                    if target_col_idx is not None:
                        cells_to_update.append(gspread.cell.Cell(target_row_idx, target_col_idx + 1, str(new_val) if new_val is not None else ""))
                        
        if cells_to_update:
            call_gspread_with_retry(worksheet.update_cells, cells_to_update)
            return True, "Synced successfully"
        return True, "No fields matched for updates"
        
    except Exception as e:
        return False, str(e)
