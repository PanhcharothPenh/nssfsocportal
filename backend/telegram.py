import sys
import os
import requests
import time
import threading
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.dirname(CURRENT_DIR)
for p in [CURRENT_DIR, WORKSPACE, os.path.join(WORKSPACE, "backend"), os.path.join(WORKSPACE, "api")]:
    if p not in sys.path:
        sys.path.insert(0, p)

load_dotenv(os.path.join(WORKSPACE, ".env"))

_tg_config_cache = {
    "bot_token": None,
    "chat_id": None,
    "expires_at": 0
}

def get_telegram_config():
    global _tg_config_cache
    now = time.time()
    if _tg_config_cache["bot_token"] and now < _tg_config_cache["expires_at"]:
        return _tg_config_cache["bot_token"], _tg_config_cache["chat_id"]
        
    bot_token = None
    chat_id = None
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('telegram_bot_token', 'telegram_chat_id')")
        rows = cursor.fetchall()
        conn.close()
        for r in rows:
            if r['key'] == 'telegram_bot_token' and r['value']:
                bot_token = r['value']
            elif r['key'] == 'telegram_chat_id' and r['value']:
                chat_id = r['value']
    except Exception as db_err:
        print(f"Error reading telegram config from DB: {db_err}")

    if not bot_token:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not chat_id:
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
    _tg_config_cache["bot_token"] = bot_token
    _tg_config_cache["chat_id"] = chat_id
    _tg_config_cache["expires_at"] = now + 60
    return bot_token, chat_id

def send_telegram_message(message: str, chat_id: str = None, reply_markup: dict = None):
    """
    Sends a formatted message to a Telegram group or personal chat using Telegram Bot API.
    """
    bot_token, default_chat_id = get_telegram_config()
    if not chat_id:
        chat_id = default_chat_id

    # If target chat_id is the group chat and group notifications are disabled, skip sending to group
    if chat_id and (str(chat_id).strip() == "-1002124589536" or str(chat_id).strip() == str(default_chat_id).strip()):
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = 'telegram_notify_group'")
            setting = cursor.fetchone()
            conn.close()
            if setting and str(setting['value']).strip().lower() in ['0', 'false', 'off', 'no', 'disabled']:
                return False, "Group chat notifications disabled by user"
        except Exception:
            pass

    if not bot_token or not chat_id:
        return False, "Telegram Bot Token or Chat ID not configured in settings or .env"
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML' # Allow bold, code blocks, etc.
    }
    if reply_markup:
        payload['reply_markup'] = reply_markup
    
    try:
        res = requests.post(url, json=payload, timeout=4)
        if res.status_code == 200:
            return True, "Message sent successfully"
        else:
            return False, f"Telegram API Error: {res.text}"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"

def send_telegram_chat_action(chat_id: str, action: str = "typing"):
    """Sends a chat action (like 'typing') to Telegram so chat status shows 'typing...'"""
    bot_token = None
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        row = cursor.fetchone()
        if row and row['value']:
            bot_token = row['value']
        conn.close()
    except Exception:
        pass
    if not bot_token:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token or not chat_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendChatAction"
        requests.post(url, json={"chat_id": chat_id, "action": action}, timeout=3)
        return True
    except Exception:
        return False

def send_telegram_message_raw(message: str, chat_id: str = None, reply_markup: dict = None):
    """Sends message to Telegram and returns (success, result_dict containing message_id)"""
    bot_token = None
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        row = cursor.fetchone()
        if row and row['value']:
            bot_token = row['value']
        if not chat_id:
            cursor.execute("SELECT value FROM settings WHERE key = 'telegram_chat_id'")
            row = cursor.fetchone()
            if row and row['value']:
                chat_id = row['value']
        conn.close()
    except Exception:
        pass
    if not bot_token:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not chat_id:
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not bot_token or not chat_id:
        return False, {}
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {'chat_id': chat_id, 'text': message, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    try:
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            return True, res.json().get("result", {})
        return False, {}
    except Exception:
        return False, {}

def edit_telegram_message(chat_id: str, message_id: int, message: str, reply_markup: dict = None):
    """Edits an existing Telegram message in place"""
    bot_token = None
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        row = cursor.fetchone()
        if row and row['value']:
            bot_token = row['value']
        conn.close()
    except Exception:
        pass
    if not bot_token:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token or not chat_id or not message_id:
        return False
    url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
    payload = {'chat_id': chat_id, 'message_id': message_id, 'text': message, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    try:
        res = requests.post(url, json=payload, timeout=10)
        return res.status_code == 200
    except Exception:
        return False

def notify_data_change(action_title: str, details: dict, editor_username: str = None, client_ip: str = None):
    """
    Sends a beautifully formatted Audit Notification to the configured Telegram Chat / Channel
    whenever data is modified on the web portal.
    """
    import threading
    import datetime
    
    editor_display = "System"
    if editor_username and str(editor_username).strip():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            clean_ed = str(editor_username).strip()
            cursor.execute("""
                SELECT username, full_name FROM users 
                WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?) OR LOWER(telegram_username) = LOWER(?)
            """, (clean_ed, clean_ed, clean_ed.replace("@", "")))
            user = cursor.fetchone()
            conn.close()
            if user:
                full_name = user['full_name'] or ""
                editor_display = f"<b>{full_name or user['username']}</b>"
            else:
                editor_display = f"<b>{clean_ed}</b>"
        except Exception:
            editor_display = f"<b>{editor_username}</b>"

    # Date format: DD-MM-YYYY HH:MM:SS in Cambodia ICT (UTC+7)
    import datetime
    ict_now = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
    now_str = ict_now.strftime("%d-%m-%Y %H:%M:%S")
    
    # Extract Hospital / Target name
    target_name = None
    target_keys = ['ឈ្មោះមន្ទីរពេទ្យ/ធនាគារ', 'ឈ្មោះមន្ទីរពេទ្យ', 'ឈ្មោះធនាគារ', 'ឈ្មោះសាខា', 'ឈ្មោះដេប៉ាតឺម៉ង់', 'នាយកដ្ឋាន', 'សាខា', 'ឈ្មោះអ្នកប្រើប្រាស់']
    
    change_items = []
    
    for k, v in details.items():
        if v is not None and str(v).strip() != "":
            clean_k = str(k).strip()
            clean_v = str(v).strip()
            
            # Check if this key represents the Target / Hospital name
            if not target_name and any(tk in clean_k for tk in target_keys):
                target_name = clean_v
                continue
                
            # Translate common status/type values to Khmer
            v_lower = clean_v.lower()
            if v_lower in ['close', 'closed']:
                formatted_val = "បិទ (Close)"
            elif v_lower in ['open', 'opened']:
                formatted_val = "បើក (Open)"
            elif v_lower in ['reopen', 'reopened']:
                formatted_val = "ស្នើសុំបើក (Reopen)"
            elif v_lower in ['using', 'active']:
                formatted_val = f"កំពុងប្រើប្រាស់ ({clean_v})"
            elif v_lower == 'available':
                formatted_val = "ទំនេរ (Available)"
            else:
                formatted_val = clean_v

            change_items.append((clean_k, formatted_val))

    # Dynamic Header
    if "VPN" in action_title or "vpn" in action_title.lower():
        header_title = "🚨 <b>ជូនដំណឹងអំពីការកែប្រែ VPN</b>"
        target_label = "🏥 <b>មន្ទីរពេទ្យ ៖</b>"
    elif "IP" in action_title or "ip" in action_title.lower():
        header_title = "🚨 <b>ជូនដំណឹងអំពីការកែប្រែ IPAM</b>"
        target_label = "🏢 <b>គោលដៅ ៖</b>"
    else:
        header_title = f"🚨 <b>ជូនដំណឹងអំពី{action_title}</b>"
        target_label = "📌 <b>គោលដៅ ៖</b>"

    target_line = f"{target_label} <b>{target_name}</b>\n" if target_name else ""
    
    # Format "កែប្រែទៅជា ៖"
    if len(change_items) == 1:
        change_line = f"🔄 <b>កែប្រែទៅជា ៖</b> <code>{change_items[0][1]}</code>\n"
    elif len(change_items) > 1:
        # Prioritize Status over VPN Type
        status_item = next((item for item in change_items if 'ស្ថានភាព' in item[0] or 'status' in item[0].lower()), None)
        if not status_item:
            status_item = next((item for item in change_items if 'vpn' in item[0].lower() or 'ប្រភេទ' in item[0]), None)
            
        if status_item:
            change_line = f"🔄 <b>កែប្រែទៅជា ៖</b> <code>{status_item[1]}</code>\n"
            other_items = [f"• {item[0]} ៖ <code>{item[1]}</code>" for item in change_items if item != status_item]
            if other_items:
                change_line += "\n".join(other_items) + "\n"
        else:
            change_line = "🔄 <b>កែប្រែទៅជា ៖</b>\n" + "\n".join([f"• {item[0]} ៖ <code>{item[1]}</code>" for item in change_items]) + "\n"
    else:
        change_line = "🔄 <b>កែប្រែទៅជា ៖</b> <code>ធ្វើបច្ចុប្បន្នភាពទិន្នន័យ</code>\n"

    msg = (
        f"{header_title}\n\n"
        f"{target_line}"
        f"{change_line}"
        f"✅ <b>ស្ថានភាព ៖</b> <code>Completed</code>\n\n"
        f"👤 <b>អ្នកកែប្រែ ៖</b> {editor_display}\n"
        f"🕒 <code>{now_str}</code>\n"
        f"{f'🌐 <b>IP Client ៖</b> <code>{client_ip}</code>' if client_ip else ''}"
    )
    
    def broadcast_to_linked_users(message_text):
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check global setting: telegram_notify_group (Group chat notifications toggle)
            cursor.execute("SELECT value FROM settings WHERE key = 'telegram_notify_group'")
            setting_g = cursor.fetchone()
            if not (setting_g and str(setting_g['value']).strip().lower() in ['0', 'false', 'off', 'no', 'disabled']):
                # Send to default group/channel if enabled
                send_telegram_message(message_text)
            else:
                print("Telegram group chat notifications disabled (telegram_notify_group=0). Skipping group broadcast.")
            
            # Check global setting: telegram_notify_direct_users
            cursor.execute("SELECT value FROM settings WHERE key = 'telegram_notify_direct_users'")
            setting = cursor.fetchone()
            if setting and str(setting['value']).strip().lower() in ['0', 'false', 'off', 'no', 'disabled']:
                conn.close()
                return  # 1-by-1 direct notifications disabled globally!
                
            cursor.execute("""
                SELECT DISTINCT telegram_chat_id 
                FROM users 
                WHERE telegram_chat_id IS NOT NULL 
                  AND telegram_chat_id != ''
                  AND (notify_telegram IS NULL OR LOWER(CAST(notify_telegram AS TEXT)) NOT IN ('0', 'false', 'off', 'disabled'))
            """)
            users = cursor.fetchall()
            conn.close()
            
            # Default chat_id to avoid duplicate sending
            default_chat = os.getenv("TELEGRAM_CHAT_ID")
            sent_chats = set()
            if default_chat:
                sent_chats.add(str(default_chat).strip())
                
            for u in users:
                c_id = str(u['telegram_chat_id']).strip()
                if c_id and c_id not in sent_chats:
                    sent_chats.add(c_id)
                    send_telegram_message(message_text, chat_id=c_id)
        except Exception as err:
            print(f"Error sending audit notification to linked users: {err}")

    # Send message in background thread to keep API response fast
    t = threading.Thread(target=broadcast_to_linked_users, args=(msg,), daemon=True)
    t.start()


_portal_context_cache = {"timestamp": 0, "data": ""}

def get_full_web_portal_context() -> str:
    """
    Fetches real-time live data from the web portal DB (branches, HQ subnets, 
    hospital VPNs, occupied IP allocations) with 60s TTL in-memory caching for ultra-fast responses.
    """
    global _portal_context_cache
    now = time.time()
    if now - _portal_context_cache["timestamp"] < 60 and _portal_context_cache["data"]:
        return _portal_context_cache["data"]

    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT name, status, vpn_type, lan_ip, public_ip, reopen_requested FROM hospital_vpns ORDER BY id ASC")
        hospitals = [dict(r) for r in cursor.fetchall()]
        
        reopen_list = []
        closed_list = []
        open_list = []
        for h in hospitals:
            st = h['status'] or 'Unknown'
            is_reopen = h.get('reopen_requested') == 1 or str(st).lower() == 'reopen'
            if is_reopen and str(st).lower() not in ['completed', 'open', 'close', 'closed']:
                reopen_list.append(f"{h['name']} (LAN: {h['lan_ip'] or 'N/A'})")
            elif h['vpn_type'] == 'Close' or str(st).lower() in ['close', 'closed', 'stop', 'បិទ']:
                closed_list.append(f"{h['name']} (LAN: {h['lan_ip'] or 'N/A'})")
            else:
                open_list.append(f"{h['name']} [{st}] (LAN: {h['lan_ip'] or 'N/A'})")

        cursor.execute("SELECT name_kh, name_en, subnet, gateway FROM branches LIMIT 35")
        branches = [dict(r) for r in cursor.fetchall()]
        b_summary = [f"{b['name_kh'] or b['name_en']}: Subnet {b['subnet'] or 'N/A'}, GW {b['gateway'] or 'N/A'}" for b in branches]

        cursor.execute("SELECT name_en, subnet, gateway FROM hq_departments LIMIT 25")
        hq_depts = [dict(r) for r in cursor.fetchall()]
        hq_summary = [f"{hq['name_en']}: Subnet {hq['subnet'] or 'N/A'}, GW {hq['gateway'] or 'N/A'}" for hq in hq_depts]

        cursor.execute("SELECT ip, user_name, position FROM branch_ips WHERE user_name IS NOT NULL AND TRIM(user_name) != '' LIMIT 40")
        b_ips = [dict(r) for r in cursor.fetchall()]
        cursor.execute("SELECT ip, user_name_kh, user_name_en, position FROM hq_ips WHERE (user_name_kh IS NOT NULL AND TRIM(user_name_kh) != '') OR (user_name_en IS NOT NULL AND TRIM(user_name_en) != '') LIMIT 40")
        hq_ips = [dict(r) for r in cursor.fetchall()]

        ip_allocations = []
        for ip in b_ips:
            ip_allocations.append(f"{ip['ip']} -> User: {ip['user_name']} ({ip['position'] or ''}) [Branch]")
        for ip in hq_ips:
            u_name = ip['user_name_kh'] or ip['user_name_en']
            ip_allocations.append(f"{ip['ip']} -> User: {u_name} ({ip['position'] or ''}) [HQ]")

        conn.close()

        context_str = (
            f"--- NSSF SOC PORTAL LIVE WEBSITE DATA ---\n"
            f"1. HOSPITAL / BANK S2S VPNS (Total: {len(hospitals)}):\n"
            f"   • PENDING REOPEN REQUESTS ({len(reopen_list)}): {', '.join(reopen_list) if reopen_list else 'None'}\n"
            f"   • CLOSED VPNS ({len(closed_list)}): {', '.join(closed_list) if closed_list else 'None'}\n"
            f"   • ACTIVE OPEN VPNS ({len(open_list)}): {', '.join(open_list[:15])}\n\n"
            f"2. NSSF BRANCHES ({len(branches)}):\n" + "\n".join([f"   • {b}" for b in b_summary[:10]]) + "\n\n"
            f"3. HQ DEPARTMENTS ({len(hq_depts)}):\n" + "\n".join([f"   • {h}" for h in hq_summary[:10]]) + "\n\n"
            f"4. OCCUPIED IP ALLOCATIONS (Sample):\n" + "\n".join([f"   • {ip}" for ip in ip_allocations[:20]]) + "\n"
            f"--- END LIVE WEBSITE DATA ---"
        )
        _portal_context_cache = {"timestamp": now, "data": context_str}
        return context_str
    except Exception as e:
        print(f"Error reading web portal context: {e}")
        return _portal_context_cache.get("data", "")


def ask_gemini_ai(user_query: str, username: str = None) -> str:
    """
    Uses Google Gemini AI API to generate an intelligent response for Telegram Bot users,
    enriched with live NSSF SOC Portal system context and deep DB search fallback.
    """
    gemini_key = None
    branch_cnt, hq_cnt, hospital_cnt, reopen_cnt = 0, 0, 0, 0
    matched_results = []
    
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'gemini_api_key'")
        row = cursor.fetchone()
        if row and row['value']:
            k = str(row['value']).strip()
            if k.startswith("AIzaSy"):
                gemini_key = k

        import re
        ip_matches = re.findall(r'\d+\.\d+\.\d+\.\d+', user_query)
        search_ip = ip_matches[0] if ip_matches else ""

        stop_words = ["តើ", "ប្រើ", "ip", "IP", "ប៉ុន្មាន", "អ្នកណា", "ជានរណា", "នៅឯណា", "ដក", "របស់", "មាន", "ខ្លះ", "?", "!", "កែ", "លុប", "អីខ្លះ", "អី"]
        q_cleaned = user_query
        for w in stop_words:
            q_cleaned = q_cleaned.replace(w, " ")

        terms = [t.strip() for t in q_cleaned.split() if len(t.strip()) >= 2]
        if search_ip and search_ip not in terms:
            terms.insert(0, search_ip)

        # 1. Closed Hospitals intent search
        if any(w in user_query.lower() for w in ["បិទ", "close", "closed", "stop"]) and any(w in user_query.lower() for w in ["ពេទ្យ", "hospital", "vpn", "មន្ទីរពេទ្យ", "ណាខ្លះ", "បញ្ជី"]):
            cursor.execute("SELECT name, status, vpn_type, lan_ip, public_ip FROM hospital_vpns WHERE vpn_type = 'Close' OR LOWER(status) IN ('close', 'closed', 'stop', 'បិទ') LIMIT 15")
            closed_h = cursor.fetchall()
            if closed_h:
                h_list = [f"• <b>{dict(ch)['name']}</b> (LAN IP: <code>{dict(ch)['lan_ip'] or 'N/A'}</code>)" for ch in closed_h]
                matched_results.append(f"🏥 <b>បញ្ជីមន្ទីរពេទ្យ/ធនាគារដែលបានបិទ (Closed VPNs) ៖</b>\n" + "\n".join(h_list))

        # 2. Reopen Hospitals intent search
        if any(w in user_query.lower() for w in ["reopen", "ស្នើសុំបើក", "បើកឡើងវិញ", "ស្នើ"]):
            cursor.execute("SELECT name, status, lan_ip, public_ip FROM hospital_vpns WHERE (reopen_requested = 1 OR LOWER(status) = 'reopen') AND (status IS NOT NULL AND LOWER(status) NOT IN ('completed', 'open', 'close', 'closed'))")
            reopen_h = cursor.fetchall()
            if reopen_h:
                h_list = [f"• 🏥 <b>{dict(rh)['name']}</b> (LAN IP: <code>{dict(rh)['lan_ip'] or 'N/A'}</code>)" for rh in reopen_h]
                matched_results.append(f"📋 <b>បញ្ជីមន្ទីរពេទ្យស្នើសុំបើក VPN ឡើងវិញ ៖</b>\n" + "\n".join(h_list) + "\n\nសូមចូលទៅកាន់ទំព័រ <b>Hospital VPNs</b> លើ Portal ដើម្បីពិនិត្យ និងអនុម័ត!")
            else:
                matched_results.append("📋 <b>មិនមានមន្ទីរពេទ្យកំពុងស្នើសុំបើក VPN ឡើងវិញនៅឡើយទេ។</b>")

        # 3. Strict Multi-Term AND Search (Matches ALL name/IP tokens specified by user)
        strict_matches = []
        if len(terms) >= 2:
            conds_hq = []
            params_hq = []
            for t in terms:
                conds_hq.append("(LOWER(hq.user_name_kh) LIKE LOWER(?) OR LOWER(hq.user_name_en) LIKE LOWER(?) OR LOWER(hq.ip) LIKE LOWER(?) OR LOWER(d.name_en) LIKE LOWER(?))")
                params_hq.extend([f"%{t}%", f"%{t}%", f"%{t}%", f"%{t}%"])
            
            sql_strict_hq = """
                SELECT hq.ip, hq.user_name_kh, hq.user_name_en, hq.position, hq.status, hq.internet_permission,
                       d.name_en AS dept_name, d.subnet, d.gateway
                FROM hq_ips hq
                LEFT JOIN hq_departments d ON hq.dept_id = d.id
                WHERE """ + " AND ".join(conds_hq) + """ LIMIT 5
            """
            cursor.execute(sql_strict_hq, params_hq)
            for ip_r in cursor.fetchall():
                d = dict(ip_r)
                u_name = d['user_name_kh'] if (d['user_name_kh'] and d['user_name_kh'].strip()) else d['user_name_en']
                dept_str = f"\n• <b>នាយកដ្ឋាន/អង្គភាព ៖</b> <b>{d['dept_name']}</b>" if d.get('dept_name') else ""
                net_str = f"\n• <b>Subnet ៖</b> <code>{d['subnet']}</code>" if d.get('subnet') else ""
                strict_matches.append(
                    f"🏢 <b>HQ IP ៖ <code>{d['ip']}</code></b>{dept_str}\n"
                    f"• <b>អ្នកប្រើប្រាស់ ៖</b> <b>{u_name or 'N/A'}</b> ({d['position'] or 'N/A'})\n"
                    f"• <b>ស្ថានភាព ៖</b> <code>{d['status'] or 'N/A'}</code>{net_str}"
                )

            conds_br = []
            params_br = []
            for t in terms:
                conds_br.append("(LOWER(b_ip.user_name) LIKE LOWER(?) OR LOWER(b_ip.ip) LIKE LOWER(?) OR LOWER(b.name_kh) LIKE LOWER(?) OR LOWER(b.name_en) LIKE LOWER(?))")
                params_br.extend([f"%{t}%", f"%{t}%", f"%{t}%", f"%{t}%"])

            sql_strict_br = """
                SELECT b_ip.ip, b_ip.user_name, b_ip.position, b_ip.status, b_ip.device_type, b_ip.internet_permission,
                       b.name_kh AS branch_name_kh, b.name_en AS branch_name_en, b.subnet, b.gateway
                FROM branch_ips b_ip
                LEFT JOIN branches b ON b_ip.branch_id = b.id
                WHERE """ + " AND ".join(conds_br) + """ LIMIT 5
            """
            cursor.execute(sql_strict_br, params_br)
            for ip_r in cursor.fetchall():
                d = dict(ip_r)
                b_name = d['branch_name_kh'] or d['branch_name_en'] or 'N/A'
                net_str = f"\n• <b>Subnet ៖</b> <code>{d['subnet']}</code>" if d.get('subnet') else ""
                strict_matches.append(
                    f"🌐 <b>Branch IP ៖ <code>{d['ip']}</code></b>\n"
                    f"• <b>សាខា/ខេត្ត/ខណ្ឌ ៖</b> <b>{b_name}</b>\n"
                    f"• <b>អ្នកប្រើប្រាស់ ៖</b> <b>{d['user_name'] or 'N/A'}</b> ({d['position'] or 'N/A'})\n"
                    f"• <b>ស្ថានភាព ៖</b> <code>{d['status'] or 'N/A'}</code>{net_str}"
                )

        if strict_matches:
            matched_results.extend(strict_matches)
        elif terms:
            # 4. Fallback to OR Search across HQ IPs, Branch IPs, Hospital VPNs, and Branches
            scored_results = {}
            for term in terms:
                term_like = f"%{term}%"
                
                sql_hq = """
                    SELECT hq.ip, hq.user_name_kh, hq.user_name_en, hq.position, hq.status, hq.internet_permission,
                           d.name_en AS dept_name, d.subnet, d.gateway
                    FROM hq_ips hq
                    LEFT JOIN hq_departments d ON hq.dept_id = d.id
                    WHERE LOWER(hq.user_name_kh) LIKE LOWER(?) OR LOWER(hq.user_name_en) LIKE LOWER(?) OR LOWER(hq.ip) LIKE LOWER(?) OR LOWER(d.name_en) LIKE LOWER(?)
                    LIMIT 5
                """
                cursor.execute(sql_hq, (term_like, term_like, term_like, term_like))
                for ip_r in cursor.fetchall():
                    d = dict(ip_r)
                    key = f"hq_{d['ip']}"
                    u_name = d['user_name_kh'] if (d['user_name_kh'] and d['user_name_kh'].strip()) else d['user_name_en']
                    dept_str = f"\n• <b>នាយកដ្ឋាន/អង្គភាព ៖</b> <b>{d['dept_name']}</b>" if d.get('dept_name') else ""
                    net_str = f"\n• <b>Subnet ៖</b> <code>{d['subnet']}</code>" if d.get('subnet') else ""
                    txt = (
                        f"🏢 <b>HQ IP ៖ <code>{d['ip']}</code></b>{dept_str}\n"
                        f"• <b>អ្នកប្រើប្រាស់ ៖</b> <b>{u_name or 'N/A'}</b> ({d['position'] or 'N/A'})\n"
                        f"• <b>ស្ថានភាព ៖</b> <code>{d['status'] or 'N/A'}</code>{net_str}"
                    )
                    if key not in scored_results:
                        scored_results[key] = {"score": 1, "text": txt}
                    else:
                        scored_results[key]["score"] += 1

                sql_br = """
                    SELECT b_ip.ip, b_ip.user_name, b_ip.position, b_ip.status, b_ip.device_type, b_ip.internet_permission,
                           b.name_kh AS branch_name_kh, b.name_en AS branch_name_en, b.subnet, b.gateway
                    FROM branch_ips b_ip
                    LEFT JOIN branches b ON b_ip.branch_id = b.id
                    WHERE LOWER(b_ip.user_name) LIKE LOWER(?) OR LOWER(b_ip.ip) LIKE LOWER(?) OR LOWER(b.name_kh) LIKE LOWER(?) OR LOWER(b.name_en) LIKE LOWER(?)
                    LIMIT 5
                """
                cursor.execute(sql_br, (term_like, term_like, term_like, term_like))
                for ip_r in cursor.fetchall():
                    d = dict(ip_r)
                    key = f"branch_{d['ip']}"
                    u_name = d['user_name'] or 'N/A'
                    b_name = d['branch_name_kh'] or d['branch_name_en'] or 'N/A'
                    net_str = f"\n• <b>Subnet ៖</b> <code>{d['subnet']}</code>" if d.get('subnet') else ""
                    txt = (
                        f"🌐 <b>Branch IP ៖ <code>{d['ip']}</code></b>\n"
                        f"• <b>សាខា/ខេត្ត/ខណ្ឌ ៖</b> <b>{b_name}</b>\n"
                        f"• <b>អ្នកប្រើប្រាស់ ៖</b> <b>{u_name}</b> ({d['position'] or 'N/A'})\n"
                        f"• <b>ស្ថានភាព ៖</b> <code>{d['status'] or 'N/A'}</code>{net_str}"
                    )
                    if key not in scored_results:
                        scored_results[key] = {"score": 1, "text": txt}
                    else:
                        scored_results[key]["score"] += 1

                cursor.execute("SELECT name, status, lan_ip, public_ip, reopen_requested FROM hospital_vpns WHERE LOWER(name) LIKE LOWER(?) OR LOWER(lan_ip) LIKE LOWER(?) OR LOWER(public_ip) LIKE LOWER(?) LIMIT 5", (term_like, term_like, term_like))
                for h in cursor.fetchall():
                    h_dict = dict(h)
                    key = f"hos_{h_dict['name']}"
                    st = "ស្នើសុំបើក (Reopen)" if h_dict.get('reopen_requested') == 1 else h_dict.get('status')
                    txt = f"🏥 <b>មន្ទីរពេទ្យ/ធនាគារ ៖ {h_dict['name']}</b>\n• ស្ថានភាព ៖ <code>{st}</code>\n• LAN IP ៖ <code>{h_dict['lan_ip'] or 'N/A'}</code> | Public IP ៖ <code>{h_dict['public_ip'] or 'N/A'}</code>"
                    if key not in scored_results:
                        scored_results[key] = {"score": 1, "text": txt}
                    else:
                        scored_results[key]["score"] += 1

                cursor.execute("SELECT name_kh, name_en, subnet, gateway FROM branches WHERE LOWER(name_kh) LIKE LOWER(?) OR LOWER(name_en) LIKE LOWER(?) LIMIT 5", (term_like, term_like))
                for b in cursor.fetchall():
                    b_dict = dict(b)
                    b_name = b_dict['name_kh'] or b_dict['name_en']
                    key = f"branch_b_{b_name}"
                    txt = f"🏢 <b>សាខា NSSF ៖ {b_name}</b>\n• Subnet ៖ <code>{b_dict['subnet'] or 'N/A'}</code> | Gateway ៖ <code>{b_dict['gateway'] or 'N/A'}</code>"
                    if key not in scored_results:
                        scored_results[key] = {"score": 1, "text": txt}
                    else:
                        scored_results[key]["score"] += 1

            if scored_results:
                sorted_res = sorted(scored_results.values(), key=lambda x: x['score'], reverse=True)
                for item in sorted_res[:5]:
                    matched_results.append(item['text'])

        conn.close()
    except Exception as db_e:
        print(f"Error fetching DB context for Gemini AI: {db_e}")

    if not gemini_key:
        env_k = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if env_k and env_k.startswith("AIzaSy"):
            gemini_key = env_k

    # 1. First priority: Direct Database Exact Search Match!
    if matched_results:
        return f"🤖 <b>SOC Assistant (លទ្ធផលស្វែងរកទិន្នន័យ)</b>\n\n" + "\n\n".join(matched_results)

    # 2. Second priority: Gemini AI with Full Website Live Context!
    if gemini_key:
        models_to_try = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest"]
        live_web_data = get_full_web_portal_context()
        prompt_text = (
            f"You are the NSSF SOC Portal Gemini AI Assistant, an expert AI created for the National Social Security Fund (NSSF) Security Operations Center.\n"
            f"You have FULL LIVE REAL-TIME ACCESS to all web application data:\n\n"
            f"{live_web_data}\n\n"
            f"User Asking: {username or 'User'}\n"
            f"User Message: {user_query}\n\n"
            f"Instructions:\n"
            f"1. Answer concisely and accurately in polite Khmer or English using the live website data provided above.\n"
            f"2. Use Telegram HTML formatting (bold <b>...</b>, code <code>...</code>, bullet points).\n"
            f"3. Be helpful, professional, and directly address the user's specific request."
        )

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 400}
        }

        for m in models_to_try:
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={gemini_key}"
            try:
                res = requests.post(api_url, json=payload, timeout=4)
                if res.status_code == 200:
                    data = res.json()
                    reply = data['candidates'][0]['content']['parts'][0]['text']
                    return f"🤖 <b>Gemini AI Assistant</b>\n\n{reply}"
                else:
                    print(f"Gemini Model {m} Error (HTTP {res.status_code}): {res.text}")
            except Exception as err:
                print(f"Gemini Model {m} Exception: {err}")

    # 3. Third priority: Built-in Q&A Rules
    q_lower = user_query.lower()

    if "reopen" in q_lower or "បើក" in q_lower:
        return f"🤖 <b>SOC Assistant</b>\n\nលោកអ្នកមាន <b>{reopen_cnt}</b> មន្ទីរពេទ្យកំពុងស្នើសុំបើកដំណើការ VPN ឡើងវិញ។\nសូមចូលទៅកាន់ទំព័រ <b>Hospital VPNs</b> លើ Portal ដើម្បីពិនិត្យ និងអនុម័ត!"

    if "status" in q_lower or "ស្ថានភាព" in q_lower or "ប្រព័ន្ធ" in q_lower:
        return (
            f"🤖 <b>SOC Assistant (System Status)</b>\n\n"
            f"📊 <b>ទិន្នន័យប្រព័ន្ធ NSSF SOC Portal ៖</b>\n"
            f"• សាខាសរុប (Branches) ៖ <b>{branch_cnt}</b>\n"
            f"• នាយកដ្ឋាន (HQ) ៖ <b>{hq_cnt}</b>\n"
            f"• មន្ទីរពេទ្យ/ធនាគារ VPN ៖ <b>{hospital_cnt}</b>\n"
            f"• ស្នើសុំ Reopen ៖ <b>{reopen_cnt}</b>"
        )

    return (
        f"🤖 <b>SOC Assistant</b>\n\n"
        f"ជម្រាបសួរ <b>{username or 'User'}</b>! ខ្ញុំបានទទួលសំណួររបស់អ្នក ៖\n<i>\"{user_query}\"</i>\n\n"
        f"📊 <b>ស្ថានភាព NSSF SOC ៖</b>\n"
        f"• សាខា ៖ <b>{branch_cnt}</b> | HQ ៖ <b>{hq_cnt}</b> | មន្ទីរពេទ្យ VPN ៖ <b>{hospital_cnt}</b>\n\n"
        f"លោកអ្នកអាចសួរខ្ញុំអំពី IP Address, ឈ្មោះមន្ទីរពេទ្យ, សាខា, ឬទិន្នន័យបណ្តាញ NSSF បានគ្រប់ពេលវេលា!"
    )


def get_main_menu_keyboard():
    """
    Returns the persistent interactive main menu keyboard for Telegram Bot users.
    """
    return {
        "keyboard": [
            [
                {"text": "🏥 Hospital VPNs"},
                {"text": "🔄 Reopen Requests"}
            ],
            [
                {"text": "🏢 NSSF Branches"},
                {"text": "🏛️ HQ Subnets"}
            ],
            [
                {"text": "🌐 IPAM Search"},
                {"text": "📊 System Status"}
            ],
            [
                {"text": "📅 វេនប្រចាំការយប់នេះ"},
                {"text": "📝 សុំច្បាប់ / ចេញក្រៅ"}
            ],
            [
                {"text": "✨ Ask Gemini AI"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }


def get_leave_type_inline_keyboard():
    """
    Returns inline buttons for Request Type selection: Out of Office vs Request Leave
    """
    return {
        "inline_keyboard": [
            [
                {"text": "⭕ សុំអនុញ្ញាតចេញក្រៅ (Out of Office)", "callback_data": "btn_out_of_office"}
            ],
            [
                {"text": "🔘 សុំច្បាប់ឈប់សម្រាក (Request Leave)", "callback_data": "btn_request_leave"}
            ],
            [
                {"text": "🌐 បើក NSSF SOC Portal Web App", "url": "https://nssfsocportal.vercel.app"}
            ]
        ]
    }


def get_leave_salutation_and_closing(telegram_username=None, chat_id=None, from_user_name=None):
    """
    Determines dynamic salutation and closing text based on user position from database.
    """
    user_position = "មន្ត្រី"
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        user_row = None
        if telegram_username:
            clean_uname = telegram_username.replace("@", "").strip()
            cursor.execute("SELECT position, username, full_name FROM users WHERE LOWER(telegram_username) = LOWER(?) OR LOWER(username) = LOWER(?)", (clean_uname, clean_uname))
            user_row = cursor.fetchone()
        if not user_row and chat_id:
            cursor.execute("SELECT position, username, full_name FROM users WHERE telegram_chat_id = ?", (str(chat_id),))
            user_row = cursor.fetchone()
        if not user_row and from_user_name:
            clean_fn = from_user_name.strip().lower()
            cursor.execute("SELECT position, username, full_name FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?)", (clean_fn, clean_fn))
            user_row = cursor.fetchone()
        conn.close()
        if user_row:
            user_position = user_row["position"] or "មន្ត្រី"
    except Exception as e:
        print("Error fetching user position for telegram leave:", e)

    pos_lower = (user_position or "").lower()
    uname_lower = (telegram_username or "").lower()
    fname_lower = (from_user_name or "").lower()

    # 1. Deputy Chief Bureau (អនុប្រធានការិយាល័យ)
    if "samach" in uname_lower or "samach" in fname_lower or "សាម៉ាច" in fname_lower or "អនុប្រធានការិយាល័យ" in pos_lower or "អនុការិយាល័យ" in pos_lower:
        recipients = "លោកប្រធាន លោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន លោកប្រធានការិយាល័យ"
    # 2. Chief Bureau (ប្រធានការិយាល័យ - without អនុ)
    elif "sambo" in uname_lower or "sambo" in fname_lower or "សាំបូរ" in fname_lower or ("ប្រធានការិយាល័យ" in pos_lower and "អនុ" not in pos_lower):
        recipients = "លោកប្រធាន លោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន"
    # 3. IT Officer / Staff (មន្ត្រី)
    else:
        recipients = "លោកប្រធាន លោក/លោកស្រីអនុប្រធាននាយកដ្ឋាន លោកប្រធានការិយាល័យ លោកអនុប្រធានការិយាល័យ"

    salutation = f"សូមគោរព {recipients}"
    closing = f"អាស្រ័យដូចជម្រាបជូនខាងលើ សូម {recipients} មេត្តាអនុញ្ញាតដោយសេចក្ដីអនុគ្រោះ។"
    return salutation, closing


_tg_report_cache = {}

def get_cached_report(key, fetch_fn):
    global _tg_report_cache
    now = time.time()
    if key in _tg_report_cache and (now - _tg_report_cache[key]["ts"] < 30):
        return _tg_report_cache[key]["val"]
    res = fetch_fn()
    _tg_report_cache[key] = {"ts": now, "val": res}
    return res

def get_hospitals_direct_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM hospital_vpns")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM hospital_vpns WHERE reopen_requested = 1 OR LOWER(status) LIKE '%reopen%'")
            reopen = cursor.fetchone()[0]
            cursor.execute("SELECT name, public_ip, status FROM hospital_vpns ORDER BY id LIMIT 6")
            rows = cursor.fetchall()
            conn.close()
            
            list_str = "\n".join([f"• 🏥 <b>{r['name']}</b> (IP: <code>{r['public_ip'] or 'N/A'}</code>)" for r in rows])
            return (
                f"🏥 <b>របាយការណ៍ Hospital VPNs ៖</b>\n\n"
                f"• មន្ទីរពេទ្យ/ធនាគារសរុប ៖ <b>{total}</b>\n"
                f"• ស្នើសុំបើកឡើងវិញ (Reopen) ៖ <b>{reopen}</b>\n\n"
                f"<b>បញ្ជីមន្ទីរពេទ្យគំរូ ៖</b>\n{list_str}\n\n"
                f"🔗 <b>មើលបន្ថែម ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"🏥 <b>Hospital VPNs ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("hospitals", _fetch)

def get_reopen_direct_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name, public_ip, reference_doc, status FROM hospital_vpns WHERE reopen_requested = 1 OR LOWER(status) LIKE '%reopen%'")
            rows = cursor.fetchall()
            conn.close()
            
            if not rows:
                return "🔄 <b>Reopen Requests ៖</b>\n\nពុំមានមន្ទីរពេទ្យស្នើសុំបើកដំណើការ VPN ឡើងវិញនៅឡើយទេ។"
                
            list_str = "\n".join([f"• 🏥 <b>{r['name']}</b>\n  └ លិខិត ៖ <code>{r['reference_doc'] or 'N/A'}</code> | IP ៖ <code>{r['public_ip'] or 'N/A'}</code>" for r in rows])
            return (
                f"🔄 <b>មន្ទីរពេទ្យស្នើសុំបើកដំណើការ VPN ឡើងវិញ ({len(rows)}) ៖</b>\n\n"
                f"{list_str}\n\n"
                f"🔗 <b>ពិនិត្យលើ Portal ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"🔄 <b>Reopen Requests ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("reopen", _fetch)

def get_branches_direct_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name_kh, name_en, subnet FROM branches ORDER BY id LIMIT 6")
            rows = cursor.fetchall()
            cursor.execute("SELECT COUNT(*) FROM branches")
            total = cursor.fetchone()[0]
            conn.close()
            
            list_str = "\n".join([f"• 🏢 <b>{r['name_kh']} ({r['name_en']})</b>\n  └ Subnet ៖ <code>{r['subnet']}</code>" for r in rows])
            return (
                f"🏢 <b>ទិន្នន័យសាខា NSSF ទាំងអស់ (សរុប {total}) ៖</b>\n\n"
                f"{list_str}\n\n"
                f"🔗 <b>មើលសាខាទាំងអស់ ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"🏢 <b>NSSF Branches ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("branches", _fetch)

def get_hq_direct_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name_en, sheet_name, vlan_id, subnet FROM hq_departments ORDER BY id LIMIT 6")
            rows = cursor.fetchall()
            cursor.execute("SELECT COUNT(*) FROM hq_departments")
            total = cursor.fetchone()[0]
            conn.close()
            
            list_str = "\n".join([f"• 🏛️ <b>{r['name_en']}</b>\n  └ Subnet ៖ <code>{r['subnet'] or 'N/A'}</code> | VLAN ID ៖ <code>{r['vlan_id'] or 'N/A'}</code>" for r in rows])
            return (
                f"🏛️ <b>ទិន្នន័យនាយកដ្ឋាន HQ ទាំងអស់ (សរុប {total}) ៖</b>\n\n"
                f"{list_str}\n\n"
                f"🔗 <b>មើល HQ ទាំងអស់ ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"🏛️ <b>HQ Subnets ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("hq", _fetch)

def get_public_ip_summary_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM public_ip_mappings WHERE (new_ip_6 IS NOT NULL AND new_ip_6 != '') OR (new_ip_7 IS NOT NULL AND new_ip_7 != '')")
            used_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT name, new_ip_6, new_ip_7, status FROM public_ip_mappings LIMIT 6")
            rows = cursor.fetchall()
            conn.close()
            
            list_str = "\n".join([f"• 🌐 <b>{r['name']}</b>\n  └ IP 6.0: <code>{r['new_ip_6'] or 'N/A'}</code> | IP 7.0: <code>{r['new_ip_7'] or 'N/A'}</code>" for r in rows])
            total_range = 512
            available_cnt = max(0, total_range - used_cnt)
            return (
                f"🌐 <b>Public IPAM Subnet 165.99.6.0/23 (512 IPs) ៖</b>\n\n"
                f"• IP កំពុងប្រើប្រាស់ (Used/Active) ៖ <b>{used_cnt}</b>\n"
                f"• IP ទំនេរអាចប្រើបាន (Available) ៖ <b>{available_cnt}</b>\n\n"
                f"<b>បញ្ជី IP Host Mappings គំរូ ៖</b>\n{list_str}\n\n"
                f"🔗 <b>គ្រប់គ្រងលើ Web Portal ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"🌐 <b>Public IPAM ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("public_ip_summary", _fetch)

def get_system_status_direct_telegram():
    def _fetch():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM branches")
            b_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM hq_departments")
            h_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM hospital_vpns")
            hp_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM hospital_vpns WHERE reopen_requested = 1 OR LOWER(status) LIKE '%reopen%'")
            r_cnt = cursor.fetchone()[0]
            conn.close()
            return (
                f"📊 <b>ទិន្នន័យស្ថិតិប្រព័ន្ធ NSSF SOC Portal ៖</b>\n\n"
                f"• សាខាសរុប (Branches) ៖ <b>{b_cnt}</b>\n"
                f"• នាយកដ្ឋាន (HQ) ៖ <b>{h_cnt}</b>\n"
                f"• មន្ទីរពេទ្យ/ធនាគារ VPN ៖ <b>{hp_cnt}</b>\n"
                f"• ស្នើសុំ Reopen ៖ <b>{r_cnt}</b>\n\n"
                f"✅ <b>ស្ថានភាពប្រព័ន្ធ ៖</b> ដំណើរការល្អជាប្រក្រតី (Online 100%)\n"
                f"🔗 <b>ចូលទៅកាន់ Portal ៖</b> https://nssfsocportal.vercel.app"
            )
        except Exception as e:
            return f"📊 <b>System Status ៖</b> មិនអាចទាញយកទិន្នន័យ ៖ {e}"
    return get_cached_report("status", _fetch)


def process_telegram_incoming_update(update: dict):
    """
    Processes incoming messages and inline button callback queries from Telegram Webhook / Polling and replies with Gemini AI!
    """
    callback_query = update.get("callback_query")
    if callback_query:
        cb_id = callback_query.get("id")
        cb_data = callback_query.get("data")
        msg = callback_query.get("message", {})
        chat_id = str(msg.get("chat", {}).get("id"))
        from_user = callback_query.get("from", {})
        username = from_user.get("username") or from_user.get("first_name") or "User"

        cb_map = {
            "btn_hospital": "មន្ទីរពេទ្យទាំងអស់",
            "btn_reopen": "ពេទ្យណាស្នើសុំបើកឡើងវិញ",
            "btn_branches": "សាខា NSSF ទាំងអស់",
            "btn_hq": "នាយកដ្ឋាន HQ ទាំងអស់",
            "btn_ipam": "🌐 IPAM Search",
            "btn_status": "ស្ថានភាពប្រព័ន្ធ NSSF SOC Portal",
            "btn_leave": "📝 សុំច្បាប់ / ចេញក្រៅ",
            "btn_out_of_office": "សុំអនុញ្ញាតចេញក្រៅ",
            "btn_request_leave": "សុំច្បាប់ឈប់សម្រាក"
        }
        text = cb_map.get(cb_data, cb_data)
        
        # Acknowledge callback query to stop loading animation on button
        try:
            bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
            if bot_token:
                requests.post(f"https://api.telegram.org/bot{bot_token}/answerCallbackQuery", json={"callback_query_id": cb_id}, timeout=3)
        except Exception:
            pass

        # Handle Telegram Bot Inline Action Buttons for Ticket Approval directly inside Telegram!
        if cb_data and (cb_data.startswith("tkt_app_") or cb_data.startswith("tkt_rej_")):
            try:
                parts = cb_data.split("_")
                action_type = parts[1] # 'app' or 'rej'
                tkt_id = int(parts[2])
                level = int(parts[3].replace("l", ""))
                
                from database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (tkt_id,))
                tkt = cursor.fetchone()
                
                if tkt:
                    # Determine approver's official full name from DB users or ticket or Telegram first/last name
                    user_db_fullname = ""
                    tg_uname_clean = (from_user.get("username") or "").replace("@", "").strip()
                    try:
                        if tg_uname_clean or chat_id:
                            cursor.execute("""
                                SELECT full_name FROM users 
                                WHERE (telegram_username IS NOT NULL AND LOWER(telegram_username) = LOWER(?))
                                   OR telegram_chat_id = ?
                                ORDER BY 
                                   CASE WHEN telegram_username IS NOT NULL AND LOWER(telegram_username) = LOWER(?) THEN 1 ELSE 2 END,
                                   id DESC
                            """, (tg_uname_clean, str(chat_id), tg_uname_clean))
                            u_row = cursor.fetchone()
                            if u_row and u_row['full_name']:
                                user_db_fullname = u_row['full_name']
                    except Exception as ex_u:
                        print("Error fetching user full name:", ex_u)

                    first_name = (from_user.get("first_name") or "").strip()
                    last_name = (from_user.get("last_name") or "").strip()
                    tg_profile_name = f"{first_name} {last_name}".strip() if (first_name or last_name) else ""

                    if level == 1 and tkt['l1_approver']:
                        approver_name = tkt['l1_approver']
                    elif level == 2 and tkt['l2_approver']:
                        approver_name = tkt['l2_approver']
                    elif level == 3 and tkt['l3_approver']:
                        approver_name = tkt['l3_approver']
                    else:
                        approver_name = user_db_fullname or tg_profile_name or "ថ្នាក់ដឹកនាំ"

                    import datetime
                    ict_now = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
                    now_str = ict_now.strftime("%Y-%m-%d %H:%M:%S")

                    # Send Force Reply message to get comment/remark
                    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
                    if bot_token:
                        action_label = "ការអនុម័ត" if action_type == "app" else "ការបដិសេធ"
                        orig_mid = msg.get("message_id") or ""
                        prompt_text = (
                            f"✍️ <b>[TICKET #{tkt_id} - Level {level} - {action_type.upper()} - M{orig_mid}]</b>\n"
                            f"កូដលិខិត ៖ <code>{tkt['ticket_code']}</code>\n"
                            f"កម្មវត្ថុ ៖ <b>{tkt['title']}</b>\n\n"
                        )
                        if action_type == "app":
                            prompt_text += f"សូមផ្ញើសារសរសេរ<b>ចំណារ ឬមតិយោបល់ (Comment)</b> សម្រាប់ការអនុម័តនេះ (ឬផ្ញើ <code>-</code> បើគ្មានចំណារ) ៖"
                        else:
                            prompt_text += f"សូមផ្ញើសារសរសេរ<b>មូលហេតុនៃការបដិសេធ (Rejection Reason)</b> ៖"

                        # Send prompt message with force reply
                        requests.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={
                                "chat_id": chat_id,
                                "text": prompt_text,
                                "parse_mode": "HTML",
                                "reply_markup": {
                                    "force_reply": True,
                                    "selective": True
                                }
                            },
                            timeout=5
                        )
                        
                        # Edit original message to remove buttons and show pending status
                        edited_text = (
                            f"<b>{tkt['ticket_code']} — {tkt['title']}</b>\n\n"
                            f"⏳ <b>ស្ថានភាព ៖</b> កំពុងរង់ចាំការបញ្ចូលចំណារ/មតិយោបល់ សម្រាប់{action_label}...\n"
                            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{approver_name}</b>\n"
                            f"🕒 <code>{now_str}</code>"
                        )
                        requests.post(
                            f"https://api.telegram.org/bot{bot_token}/editMessageText",
                            json={
                                "chat_id": chat_id,
                                "message_id": msg.get("message_id"),
                                "text": edited_text,
                                "parse_mode": "HTML"
                            },
                            timeout=5
                        )
                    conn.close()
                    return
            except Exception as e:
                print("Error handling Telegram inline ticket approval:", e)
    else:
        message = update.get("message") or update.get("edited_message")
        if not message:
            return

        chat_id = str(message.get("chat", {}).get("id"))
        text = (message.get("text") or "").strip()
        from_user = message.get("from", {})
        username = from_user.get("username") or from_user.get("first_name") or "User"

        # Check if this is a reply to our TICKET approval comment prompt
        reply_to = message.get("reply_to_message")
        if reply_to and reply_to.get("text") and "✍️ [TICKET #" in reply_to.get("text"):
            try:
                user_msg_id = message.get("message_id")
                prompt_msg_id = reply_to.get("message_id")
                orig_msg_id = None

                # Format: "✍️ [TICKET #{tkt_id} - Level {level} - {action_type} - M{orig_mid}]"
                prompt_line = reply_to["text"].split("\n")[0]
                if "- M" in prompt_line:
                    try:
                        orig_msg_id = int(prompt_line.split("- M")[1].split("]")[0].strip())
                    except Exception:
                        pass

                start_idx = prompt_line.find("#")
                end_idx = prompt_line.find("]")
                if start_idx != -1 and end_idx != -1:
                    meta_content = prompt_line[start_idx+1:end_idx].strip()
                    parts = [p.strip() for p in meta_content.split("-")]
                    tkt_id = int(parts[0])
                    level = int(parts[1].replace("Level", "").strip())
                    action_type = parts[2].lower()
                    
                    user_comment = text if text != "-" else ""
                    
                    from database import get_db_connection
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT * FROM tickets WHERE id = ?", (tkt_id,))
                    tkt = cursor.fetchone()
                    
                    if tkt:
                        tg_uname_clean = (from_user.get("username") or "").replace("@", "").strip()
                        user_db_fullname = ""
                        try:
                            cursor.execute("""
                                SELECT full_name FROM users 
                                WHERE (telegram_username IS NOT NULL AND LOWER(telegram_username) = LOWER(?))
                                   OR telegram_chat_id = ?
                                ORDER BY 
                                   CASE WHEN telegram_username IS NOT NULL AND LOWER(telegram_username) = LOWER(?) THEN 1 ELSE 2 END,
                                   id DESC
                            """, (tg_uname_clean, str(chat_id), tg_uname_clean))
                            u_row = cursor.fetchone()
                            if u_row and u_row['full_name']:
                                user_db_fullname = u_row['full_name']
                        except Exception as ex_u:
                            print("Error fetching user full name in comment reply:", ex_u)
                        
                        first_name = (from_user.get("first_name") or "").strip()
                        last_name = (from_user.get("last_name") or "").strip()
                        tg_profile_name = f"{first_name} {last_name}".strip() if (first_name or last_name) else ""
                        approver_name = user_db_fullname or tg_profile_name or "ថ្នាក់ដឹកនាំ"
                        
                        import datetime
                        ict_now = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
                        now_str = ict_now.strftime("%Y-%m-%d %H:%M:%S")
                        
                        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
                        
                        if action_type == "rej":
                            cursor.execute("UPDATE tickets SET status = 'rejected', rejection_reason = ?, l1_comment = ?, updated_at = ? WHERE id = ?",
                                           (user_comment or "បដិសេធតាមរយៈ Telegram Bot", user_comment, now_str, tkt_id))
                            new_status = "rejected"
                            new_st_desc = "❌ ត្រូវបានបដិសេធ (Rejected via Telegram)"
                            comment_desc = user_comment or "គ្មាន"
                        else:
                            req_level = tkt['approval_level_required']
                            has_l2 = bool(tkt.get("l2_approver") and str(tkt.get("l2_approver")).strip())
                            has_l3 = bool(tkt.get("l3_approver") and str(tkt.get("l3_approver")).strip())

                            if level == 1 and (has_l2 or req_level in (2, 3, 4, 8)):
                                new_status = "pending_l2"
                                new_st_desc = "⏳ បានឯកភាពថ្នាក់ជំនួយការ/អនុប្រធាន ➔ គោរពស្នើថ្នាក់បន្ទាប់"
                                l1_note = user_comment or "បានពិនិត្យ និងយល់ព្រម គោរពស្នើថ្នាក់ដឹកនាំពិនិត្យ"
                                cursor.execute("UPDATE tickets SET status = 'pending_l2', current_approval_level = 2, l1_approver = ?, l1_approved_at = ?, l1_comment = ?, updated_at = ? WHERE id = ?",
                                               (approver_name, now_str, l1_note, now_str, tkt_id))
                                comment_desc = l1_note
                            elif level == 2 and (has_l3 or req_level in (3, 4)):
                                new_status = "pending_l3"
                                new_st_desc = "⏳ បានឯកភាពថ្នាក់ប្រធានការិយាល័យ ➔ គោរពស្នើថ្នាក់អនុប្រធាននាយកដ្ឋាន"
                                l2_note = user_comment or "បានពិនិត្យ និងសម្រេចឯកភាព គោរពស្នើថ្នាក់ដឹកនាំពិនិត្យ"
                                cursor.execute("UPDATE tickets SET status = 'pending_l3', current_approval_level = 3, l2_approver = ?, l2_approved_at = ?, l2_comment = ?, updated_at = ? WHERE id = ?",
                                               (approver_name, now_str, l2_note, now_str, tkt_id))
                                comment_desc = l2_note
                            else:
                                new_status = "approved"
                                new_st_desc = "🟢 ឯកភាព និងបានអនុម័តសព្វគ្រប់ (Approved & Ready)"
                                if level == 1:
                                    l1_note = user_comment or ("បានពិនិត្យ និងសម្រេចឯកភាព" if req_level in (1, 5, 6, 7) else "បានពិនិត្យ និងយល់ព្រម គោរពស្នើថ្នាក់ដឹកនាំពិនិត្យ")
                                    cursor.execute("UPDATE tickets SET status = 'approved', current_approval_level = 3, l1_approver = ?, l1_approved_at = ?, l1_comment = ?, updated_at = ? WHERE id = ?",
                                                   (approver_name, now_str, l1_note, now_str, tkt_id))
                                    comment_desc = l1_note
                                else:
                                    l2_note = user_comment or "បានពិនិត្យ និងសម្រេចឯកភាព អនុញ្ញាតឲ្យក្រុមការងារអនុវត្ត"
                                    cursor.execute("UPDATE tickets SET status = 'approved', current_approval_level = 4, l2_approver = ?, l2_approved_at = ?, l2_comment = ?, updated_at = ? WHERE id = ?",
                                                   (approver_name, now_str, l2_note, now_str, tkt_id))
                                    comment_desc = l2_note
                                    
                        conn.commit()

                        # Query updated ticket row for next level notification
                        cursor.execute("SELECT * FROM tickets WHERE id = ?", (tkt_id,))
                        up_tkt_row = cursor.fetchone()
                        conn.close()
                        
                        # 1. Trigger next level approver Telegram alert IMMEDIATELY for INSTANT notification!
                        if up_tkt_row:
                            up_tkt = dict(up_tkt_row)
                            if new_status == "pending_l2":
                                send_ticket_telegram_alert(up_tkt, level=2)
                            elif new_status == "pending_l3":
                                send_ticket_telegram_alert(up_tkt, level=3)

                        # 2. Send final confirmation message to current approver IMMEDIATELY
                        confirm_text = (
                            f"<b>🎉 ដំណើរការជោគជ័យ (Action Executed)!</b>\n\n"
                            f"<b>Ticket Code ៖</b> #{tkt['ticket_code']}\n"
                            f"<b>កម្មវត្ថុ ៖</b> {tkt['title']}\n"
                            f"<b>ស្ថានភាពថ្មី ៖</b> <b>{new_st_desc}</b>\n"
                            f"<b>អ្នកអនុម័ត ៖</b> <b>{approver_name}</b>\n"
                            f"<b>ចំណារ / មតិយោបល់ ៖</b> <b>\"{comment_desc}\"</b>\n"
                            f"🕒 <code>{now_str}</code>"
                        )
                        requests.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={
                                "chat_id": chat_id,
                                "text": confirm_text,
                                "parse_mode": "HTML"
                            },
                            timeout=5
                        )

                        # 3. Auto-delete intermediate messages ASYNCHRONOUSLY in background thread so notifications are INSTANT
                        def async_cleanup():
                            def delete_tg_msg(token, cid, mid):
                                if token and cid and mid:
                                    try:
                                        requests.post(
                                            f"https://api.telegram.org/bot{token}/deleteMessage",
                                            json={"chat_id": cid, "message_id": mid},
                                            timeout=3
                                        )
                                    except Exception:
                                        pass

                            delete_tg_msg(bot_token, chat_id, user_msg_id)
                            delete_tg_msg(bot_token, chat_id, prompt_msg_id)
                            delete_tg_msg(bot_token, chat_id, orig_msg_id)

                        import threading
                        threading.Thread(target=async_cleanup, daemon=True).start()
                        return
            except Exception as e_p:
                print("Error parsing ticket reply metadata:", e_p)

    if not text or not chat_id:
        return

    main_menu_kb = get_main_menu_keyboard()
    leave_options_kb = get_leave_type_inline_keyboard()

    t_lower = (text or "").strip().lower()

    # Handle Web Login via Telegram (supports 6-digit PIN code, /start <token>, plain /start, /login, or Start button)
    import re
    digits_match = re.search(r'\b\d{6}\b', (text or "").replace(" ", "").replace("-", ""))
    is_login_cmd = (t_lower in ["/start", "start", "/login", "login", "ចូលប្រព័ន្ធ", "login soc"]) or (text and text.strip().startswith("/start")) or bool(digits_match)

    if is_login_cmd:
        token = None
        if digits_match:
            token = digits_match.group(0)
        elif text and len(text.strip().split()) > 1:
            token = text.strip().split()[1].strip()
            
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # If token found, check if it exists in login_sessions
            if token:
                cursor.execute("SELECT token FROM login_sessions WHERE token = ?", (token,))
                if not cursor.fetchone():
                    token = None
                    
            # If still no token matched, grab the latest active pending session
            if not token:
                cursor.execute("SELECT token FROM login_sessions WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1")
                p_row = cursor.fetchone()
                if p_row:
                    token = p_row['token']

            if token:
                tg_username = from_user.get("username") or ""
                first_name = from_user.get("first_name") or ""
                last_name = from_user.get("last_name") or ""
                tg_full_name = f"{first_name} {last_name}".strip()
                
                cursor.execute("""
                    SELECT * FROM users 
                    WHERE (telegram_username IS NOT NULL AND LOWER(telegram_username) = LOWER(?))
                       OR telegram_chat_id = ?
                       OR LOWER(username) = LOWER(?)
                    ORDER BY id ASC
                """, (tg_username, str(chat_id), tg_username))
                matched_user = cursor.fetchone()
                
                if not matched_user and tg_username:
                    cursor.execute("SELECT * FROM users WHERE LOWER(full_name) LIKE LOWER(?)", (f"%{tg_username}%",))
                    matched_user = cursor.fetchone()
                    
                if not matched_user:
                    cursor.execute("SELECT * FROM users ORDER BY id ASC LIMIT 1")
                    matched_user = cursor.fetchone()
                    
                if matched_user:
                    user_dict = dict(matched_user)
                    cursor.execute("UPDATE users SET telegram_chat_id = ? WHERE id = ?", (str(chat_id), user_dict['id']))
                    cursor.execute("INSERT OR REPLACE INTO login_sessions (token, status, username) VALUES (?, ?, ?)",
                                   (token, 'authorized', user_dict['username']))
                    conn.commit()
                    conn.close()
                    
                    welcome_name = user_dict.get('full_name') or user_dict.get('username') or tg_full_name or "User"
                    msg = (
                        f"🎉 <b>ការចូលគណនីទទួលបានជោគជ័យ (Login Authorized)!</b>\n\n"
                        f"សួស្តី <b>{welcome_name}</b> 👋\n\n"
                        f"កូដចូលប្រព័ន្ធ <code>{token}</code> ត្រូវបានផ្ទៀងផ្ទាត់ដោយជោគជ័យ។\n"
                        f"ផ្ទាំង Web Browser របស់អ្នកត្រូវបានដោះសោរ និងបើកដំណើរការរួចរាល់ហើយ!"
                    )
                    reply_kb = {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "🌐 បើកវេបសាយ NSSF SOC Portal",
                                    "url": "https://nssfsocportal.vercel.app"
                                }
                            ]
                        ]
                    }
                    send_telegram_message(msg, chat_id=chat_id, reply_markup=reply_kb)
                    return
                else:
                    conn.close()
            else:
                conn.close()
        except Exception as e_tg_auth:
            print("Error in Telegram Webhook token authorization:", e_tg_auth)

    if t_lower in ["/start", "/help", "/menu", "start", "help", "menu"]:
        reply_msg = (
            f"👋 <b>ជម្រាបសួរ {username}!</b>\n\n"
            f"ខ្ញុំគឺជា 🤖 <b>NSSF SOC Portal Bot & Gemini AI Assistant</b>។\n\n"
            f"សូមជ្រើសរើសផ្នែកដែលលោកអ្នកចង់ពិនិត្យតាមរយៈប៊ូតុងខាងក្រោម ៖\n"
            f"• 🏥 <b>Hospital VPNs</b> (ពិនិត្យ VPN មន្ទីរពេទ្យ/ធនាគារ)\n"
            f"• 🔄 <b>Reopen Requests</b> (មន្ទីរពេទ្យស្នើសុំបើកឡើងវិញ)\n"
            f"• 🏢 <b>NSSF Branches</b> (ទិន្នន័យសាខា & Subnets)\n"
            f"• 🏛️ <b>HQ Subnets</b> (ទិន្នន័យនាយកដ្ឋាន & IPAM)\n"
            f"• 🌐 <b>IPAM Search</b> (ស្វែងរក IP តាមឈ្មោះ ឬ IP)\n"
            f"• 📊 <b>System Status</b> (ទិន្នន័យស្ថិតិប្រព័ន្ធសរុប)\n"
            f"• 📅 <b>វេនប្រចាំការយប់នេះ</b> (កាលវិភាគវេនប្រចាំការយប់នេះ)\n"
            f"• 📝 <b>សុំច្បាប់ / ចេញក្រៅ</b> (បង្កើតលិខិតសុំច្បាប់ / ចេញក្រៅ)\n\n"
            f"លោកអ្នកក៏អាចសួរសំណួរដោយផ្ទាល់ជាភាសាខ្មែរ ឬអង់គ្លេសបានគ្រប់ពេល!"
        )
    elif "hospital" in t_lower or "មន្ទីរពេទ្យ" in t_lower:
        reply_msg = get_hospitals_direct_telegram()
    elif "reopen" in t_lower or "បើកឡើងវិញ" in t_lower:
        reply_msg = get_reopen_direct_telegram()
    elif "branch" in t_lower or "សាខា" in t_lower:
        reply_msg = get_branches_direct_telegram()
    elif "hq" in t_lower or "នាយកដ្ឋាន" in t_lower:
        reply_msg = get_hq_direct_telegram()
    elif "ipam" in t_lower:
        reply_msg = get_public_ip_summary_telegram()
        send_telegram_message(reply_msg, chat_id, reply_markup=main_menu_kb)
        return
    elif "status" in t_lower or "ស្ថានភាព" in t_lower:
        reply_msg = get_system_status_direct_telegram()
    elif text in ["📅 វេនប្រចាំការយប់នេះ", "/shift", "shift", "វេនប្រចាំការ"]:
        from datetime import datetime
        today_str = datetime.now().strftime("%Y-%m-%d")
        try:
            res = requests.get("https://firestore.googleapis.com/v1/projects/shift-dashboard-efda2/databases/(default)/documents/shiftboard/schedule", timeout=5)
            schedule = {}
            if res.ok:
                data_field = res.json().get("fields", {}).get("data", {}).get("mapValue", {}).get("fields", {})
                for date_str, date_obj in data_field.items():
                    night_values = date_obj.get("mapValue", {}).get("fields", {}).get("night", {}).get("arrayValue", {}).get("values", [])
                    names = [item.get("stringValue", "").strip() for item in night_values if item.get("stringValue")]
                    schedule[date_str] = names
            today_names = schedule.get(today_str, [])
            if today_names:
                names_str = "\n".join([f"• 👤 {name}" for name in today_names])
                reply_msg = (
                    f"📅 <b>កាលវិភាគវេនប្រចាំការយប់នេះ ({today_str}) ៖</b>\n\n"
                    f"{names_str}\n\n"
                    f"⏰ <b>ម៉ោងប្រចាំការ ៖</b> ១៧:០០ - ០៨:០០ ព្រឹក\n"
                    f"🔗 <b>មើលកាលវិភាគពេញ ៖</b> https://shift-dashboard-efda2.web.app"
                )
            else:
                reply_msg = f"ℹ️ មិនទាន់មានកាលវិភាគវេនប្រចាំការសម្រាប់ថ្ងៃនេះ ({today_str}) ឡើយ។\n🔗 https://shift-dashboard-efda2.web.app"
        except Exception as ex:
            reply_msg = f"⚠️ មិនអាចទាញយកទិន្នន័យវេនប្រចាំការបាន ៖ {ex}"
    elif text in ["📝 សុំច្បាប់ / ចេញក្រៅ", "/leave"]:
        reply_msg = (
            f"<b>ប្រភេទលិខិតសុំច្បាប់ (Request Type) ៖</b>\n\n"
            f"សូមជ្រើសរើសជម្រើសមួយខាងក្រោម ៖\n"
            f"1️⃣ ⭕ <b>សុំអនុញ្ញាតចេញក្រៅ (Out of Office)</b>\n"
            f"2️⃣ 🔘 <b>សុំច្បាប់ឈប់សម្រាក (Request Leave)</b>"
        )
        send_telegram_message(reply_msg, chat_id=chat_id, reply_markup=leave_options_kb)
        return
    elif text in ["សុំអនុញ្ញាតចេញក្រៅ", "ចេញក្រៅ"]:
        tg_uname = from_user.get("username") if isinstance(from_user, dict) else username
        salutation, closing = get_leave_salutation_and_closing(telegram_username=tg_uname, chat_id=chat_id, from_user_name=username)
        reply_msg = (
            f"{salutation}\n\n"
            f"<b>កម្មវត្ថុ ៖</b> សុំអនុញ្ញាតចេញក្រៅ ២ ម៉ោង\n"
            f"<b>មូលហេតុ ៖</b> មានធុរៈផ្ទាល់ខ្លួន\n\n"
            f"{closing}\n\n"
            f"សូមអរគុណ៕"
        )
    elif text in ["សុំច្បាប់ឈប់សម្រាក", "សុំច្បាប់"]:
        tg_uname = from_user.get("username") if isinstance(from_user, dict) else username
        salutation, closing = get_leave_salutation_and_closing(telegram_username=tg_uname, chat_id=chat_id, from_user_name=username)
        reply_msg = (
            f"{salutation}\n\n"
            f"<b>កម្មវត្ថុ ៖</b> សុំអនុញ្ញាតឈប់សម្រាក ចំនួន ០១ ថ្ងៃ នៅថ្ងៃទី ២១ កក្កដា ឆ្នាំ២០២៦\n"
            f"<b>មូលហេតុ ៖</b> មានធុរៈផ្ទាល់ខ្លួន\n\n"
            f"{closing}\n\n"
            f"សូមអរគុណ៕"
        )
    elif text == "✨ Ask Gemini AI":
        reply_msg = (
            f"✨ <b>Google Gemini AI Assistant ៖</b>\n\n"
            f"លោកអ្នកអាចសួរសំណួរទូទៅ ឬសួរទិន្នន័យបណ្តាញ NSSF SOC Portal បានគ្រប់ពេលវេលា!"
        )
    else:
        # 1. Send 'typing' chat action to Telegram header
        send_telegram_chat_action(chat_id, "typing")
        
        # 2. Send immediate waiting/thinking message
        waiting_text = "⏳ <b>កំពុងគិត... សូមរង់ចាំមួយភ្លែត</b>\n<i>(Gemini AI is generating response...)</i>"
        success, sent_info = send_telegram_message_raw(waiting_text, chat_id=chat_id)
        waiting_msg_id = sent_info.get("message_id") if success and isinstance(sent_info, dict) else None
        
        # 3. Call Gemini AI to get response
        reply_msg = ask_gemini_ai(text, username=username)
        
        # 4. Edit the waiting message with final AI answer (or send new if edit fails)
        if waiting_msg_id:
            edited = edit_telegram_message(chat_id=chat_id, message_id=waiting_msg_id, message=reply_msg, reply_markup=main_menu_kb)
            if not edited:
                send_telegram_message(reply_msg, chat_id=chat_id, reply_markup=main_menu_kb)
        else:
            send_telegram_message(reply_msg, chat_id=chat_id, reply_markup=main_menu_kb)
        return

    # Send menu reply message to Telegram for all matched menu button branches!
    send_telegram_message(reply_msg, chat_id=chat_id, reply_markup=main_menu_kb)


def send_ticket_telegram_alert(ticket: dict, level: int = 1):
    """
    Sends a formatted Ticket Approval alert to Telegram with interactive Inline Keyboard Buttons
    specifically to the designated approver (or group channel), EXCLUDING the requester!
    """
    from datetime import datetime
    ticket_id = ticket["id"]
    code = ticket["ticket_code"]
    title = ticket["title"]
    req_name = ticket.get("requester_name") or ""
    dept = ticket.get("department") or "SOC Operations Center"
    prio = ticket.get("priority") or "Medium"
    
    # Determine designated approver for current level
    if level == 1:
        target_approver = ticket.get("l1_approver") or ""
    elif level == 2:
        target_approver = ticket.get("l2_approver") or ""
    elif level == 3:
        target_approver = ticket.get("l3_approver") or ""
    else:
        target_approver = ""

    req_level = ticket.get("approval_level_required", 1)
    if level == 1:
        level_desc = "ថ្នាក់បុគ្គលិក" if req_level == 5 else "ថ្នាក់អនុប្រធានការិយាល័យ"
    else:
        level_desc = "ថ្នាក់ប្រធានការិយាល័យ" if level == 2 else ("ថ្នាក់អនុប្រធាននាយកដ្ឋាន" if level == 3 else "ថ្នាក់ប្រធាននាយកដ្ឋាន")
    prio_emoji = "🔴" if prio == "Urgent" else "🟠" if prio == "High" else "🟡" if prio == "Medium" else "🟢"
    from datetime import timezone, timedelta
    ict_now = datetime.now(timezone.utc) + timedelta(hours=7)
    created_time = ict_now.strftime("%Y-%m-%d %H:%M")
    start_date = ticket.get("start_date") or ""
    due_date = ticket.get("due_date") or ticket.get("end_date") or ""
    
    att_name = ticket.get("attachment_name") or ""
    att_url = ticket.get("attachment_url") or ""
    att_line = ""
    if att_name and att_url and not att_url.startswith("data:"):
        if att_url.startswith("http"):
            full_url = att_url
        elif att_url.startswith("/api/"):
            full_url = f"https://nssfsocportal.vercel.app{att_url}"
        else:
            clean_path = att_url if att_url.startswith("/") else f"/{att_url}"
            full_url = f"https://nssfsocportal.vercel.app/api{clean_path}"
        att_line = f"📎 <b>ឯកសារភ្ជាប់ ៖</b> <a href=\"{full_url}\">📥 បើក/ទាញយក ({att_name})</a>\n"

    date_extra = ""
    if due_date:
        try:
            d_today = ict_now.date()
            d_due = datetime.strptime(due_date, "%Y-%m-%d").date()
            diff_days = (d_due - d_today).days
            if diff_days == 0:
                rem_str = " (⚠️ ថ្ងៃនេះជាថ្ងៃឱសានវាទ)"
            elif diff_days > 0:
                rem_str = f" (⏱️ គិតពីថ្ងៃនេះនៅសល់ {diff_days + 1} ថ្ងៃ)"
            else:
                rem_str = f" (🚨 ហួសកំណត់ {abs(diff_days)} ថ្ងៃ)"
            date_extra += f"⏰ <b>ថ្ងៃឱសានវាទ (Due Date) ៖</b> <code>{due_date}</code> <b>{rem_str}</b>\n"
        except Exception:
            date_extra += f"⏰ <b>ថ្ងៃឱសានវាទ (Due Date) ៖</b> <code>{due_date}</code>\n"
    if start_date and due_date:
        try:
            d1 = datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.strptime(due_date, "%Y-%m-%d")
            days = (d2 - d1).days + 1
            if days > 0:
                date_extra += f"⏱️ <b>រយៈពេលអនុវត្តសរុប ៖</b> <b>{days} ថ្ងៃ</b>\n"
        except Exception:
            pass

    msg = (
        f"⚡ <b>[NSSF SOC WORKFLOW APPROVAL]</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📩 <b>លិខិតស្នើសុំថ្មីរង់ចាំការអនុម័ត (Ticket: #{code})</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📄 <b>ទម្រង់លិខិត / កម្មវត្ថុ ៖</b>\n└ <b>{title}</b>\n\n"
        f"👤 <b>អ្នកស្នើសុំ ៖</b> <b>{req_name}</b>\n"
        f"🎯 <b>អ្នកត្រូវពិនិត្យអនុម័ត ៖</b> <b>{target_approver or level_desc}</b>\n"
        f"🏢 <b>អង្គភាព / ការិយាល័យ ៖</b> <b>{dept}</b>\n"
        f"🔥 <b>កម្រិតអាទិភាព ៖</b> {prio_emoji} <b>{prio}</b>\n"
        f"{att_line}"
        f"{date_extra}"
        f"⏰ <b>កាលបរិច្ឆេទបង្កើត ៖</b> <code>{created_time}</code>\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👇 <b>សូមជ្រើសរើស Action ដើម្បីអនុម័តដោយផ្ទាល់ ៖</b>"
    )
    
    reply_markup = {
        "inline_keyboard": [
            [
                {"text": f"✅ អនុម័ត (Approve #{code})", "callback_data": f"tkt_app_{ticket_id}_l{level}"},
                {"text": "❌ បដិសេធ (Reject)", "callback_data": f"tkt_rej_{ticket_id}_l{level}"}
            ],
            [
                {"text": "🌐 បើកមើលលើ Web Portal", "url": "https://nssfsocportal.vercel.app"}
            ]
        ]
    }
    
    def broadcast():
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()

            # Find requester's chat ID to EXCLUDE them from receiving approval request
            requester_chat_ids = set()
            if req_name and str(req_name).strip():
                clean_req = str(req_name).split("(")[0].replace("@", "").strip()
                req_like = f"%{clean_req}%"
                cursor.execute("""
                    SELECT telegram_chat_id FROM users 
                    WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != '' AND (
                        LOWER(full_name) = LOWER(?)
                        OR LOWER(username) = LOWER(?)
                        OR LOWER(telegram_username) = LOWER(?)
                        OR LOWER(full_name) LIKE LOWER(?)
                        OR LOWER(username) LIKE LOWER(?)
                    )
                """, (clean_req, clean_req, clean_req, req_like, req_like))
                for r in cursor.fetchall():
                    if r['telegram_chat_id']:
                        requester_chat_ids.add(str(r['telegram_chat_id']).strip())

            # Find designated approver's chat ID (Smart Multi-Field & Partial Token Resolution)
            approver_chat_ids = set()
            if target_approver and str(target_approver).strip():
                clean_app = str(target_approver).split("(")[0].replace("@", "").strip()
                clean_like = f"%{clean_app}%"
                cursor.execute("""
                    SELECT telegram_chat_id FROM users 
                    WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != '' AND (
                        LOWER(full_name) = LOWER(?)
                        OR LOWER(username) = LOWER(?)
                        OR LOWER(telegram_username) = LOWER(?)
                        OR LOWER(full_name) LIKE LOWER(?)
                        OR LOWER(username) LIKE LOWER(?)
                    )
                """, (clean_app, clean_app, clean_app, clean_like, clean_like))
                for r in cursor.fetchall():
                    if r['telegram_chat_id']:
                        approver_chat_ids.add(str(r['telegram_chat_id']).strip())

                if not approver_chat_ids:
                    tokens = [t for t in clean_app.split() if len(t) >= 2]
                    for token in tokens:
                        token_like = f"%{token}%"
                        cursor.execute("""
                            SELECT telegram_chat_id FROM users 
                            WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != '' AND (
                                LOWER(full_name) LIKE LOWER(?)
                                OR LOWER(username) LIKE LOWER(?)
                                OR LOWER(telegram_username) LIKE LOWER(?)
                            )
                        """, (token_like, token_like, token_like))
                        for r in cursor.fetchall():
                            if r['telegram_chat_id']:
                                approver_chat_ids.add(str(r['telegram_chat_id']).strip())

            # 2. Fetch main Telegram Group Channel setting BEFORE closing database connection
            row_gc = None
            try:
                cursor.execute("SELECT value FROM settings WHERE key = 'telegram_chat_id'")
                row_gc = cursor.fetchone()
            except Exception:
                pass
            conn.close()

            # 1. Direct 1-on-1 Telegram notification to designated approver chat IDs
            sent_chats = set()
            for app_chat in approver_chat_ids:
                if app_chat not in sent_chats:
                    sent_chats.add(app_chat)
                    send_telegram_message(msg, chat_id=app_chat, reply_markup=reply_markup)

            # 2. Send to main Telegram Group Channel ONLY if default_chat is a group channel (starts with - or -100) OR if no approver chat ID was found
            default_chat = row_gc["value"] if row_gc else os.getenv("TELEGRAM_CHAT_ID")
            if default_chat and str(default_chat).strip():
                group_id = str(default_chat).strip()
                is_group = group_id.startswith("-")
                if (is_group or not sent_chats) and group_id not in sent_chats:
                    # For Group Chat: Remove the Approve/Reject buttons, only show "Open Web Portal"
                    group_reply_markup = {
                        "inline_keyboard": [
                            [
                                {"text": "🌐 បើកមើលលើ Web Portal", "url": "https://nssfsocportal.vercel.app"}
                            ]
                        ]
                    }
                    send_telegram_message(msg, chat_id=group_id, reply_markup=group_reply_markup)

        except Exception as ex:
            print("Error sending ticket approval alert:", ex)

    broadcast()

def send_task_kanban_telegram_alert(task):
    if not task:
        return
        
    title = task.get("title") or "Task ថ្មី"
    assignee = task.get("assignee_name") or "មិនបានបញ្ជាក់"
    creator = task.get("creator_name") or "User"
    prio = task.get("priority") or "Medium"
    due = task.get("due_date") or "មិនបានកំណត់"
    desc = task.get("description") or "គ្មានពិពណ៌នា"
    
    p_emoji = "🔴" if prio == "Urgent" else "🟠" if prio == "High" else "🟡" if prio == "Medium" else "🟢"
    
    msg = (
        f"📋 <b>[BITRIX TASK ASSIGNMENT - កិច្ចការងារថ្មី]</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📌 <b>កិច្ចការងារ ៖</b> <b>{title}</b>\n"
        f"👤 <b>អ្នកទទួលបន្ទុក (Assignee) ៖</b> <b>{assignee}</b>\n"
        f"👨‍💻 <b>អ្នកបង្កើត (Creator) ៖</b> <b>{creator}</b>\n"
        f"🎯 <b>កម្រិតអាទិភាព ៖</b> {p_emoji} <b>{prio}</b>\n"
        f"⏰ <b>ថ្ងៃឱសានវាទ (Due Date) ៖</b> <code>{due}</code>\n"
        f"📝 <b>ពិពណ៌នា ៖</b> <i>\"{desc}\"</i>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👉 សូមចូលទៅកាន់ប្រព័ន្ធដើម្បីពិនិត្យ និងធ្វើបច្ចុប្បន្នភាព Kanban Card!"
    )
    
    # Try finding assignee chat ID
    target_chats = set()
    if assignee:
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            clean_ass = assignee.strip().lower()
            cursor.execute("""
                SELECT telegram_chat_id FROM users 
                WHERE (telegram_chat_id IS NOT NULL AND telegram_chat_id != '')
                  AND (
                      LOWER(full_name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(telegram_username) LIKE ?
                  )
            """, (f"%{clean_ass}%", f"%{clean_ass}%", f"%{clean_ass}%"))
            rows = cursor.fetchall()
            conn.close()
            for r in rows:
                if r['telegram_chat_id']:
                    target_chats.add(str(r['telegram_chat_id']).strip())
        except Exception as e_c:
            print("Error looking up task assignee chat ID:", e_c)
            
    if not target_chats:
        bot_token, def_chat = get_telegram_config()
        if def_chat:
            target_chats.add(str(def_chat).strip())
            
    for cid in target_chats:
        send_telegram_message(msg, chat_id=cid)

def send_ticket_assignee_alert(ticket: dict, event_type: str = "created"):
    """
    Sends a direct Telegram notification to all assignees/members of a ticket
    when it is created, approved, or close to its due date.
    """
    if not ticket:
        return
        
    code = ticket.get("ticket_code") or ""
    title = ticket.get("title") or ""
    assignee_str = ticket.get("assignee_name") or ""
    prio = ticket.get("priority") or "Medium"
    due_date = ticket.get("due_date") or ""
    
    prio_emoji = "🔴" if prio == "Urgent" else "🟠" if prio == "High" else "🟡"
    
    req_name = ticket.get("requester_name") or "System Administrator"
    
    from datetime import datetime, timezone, timedelta
    now_str = (datetime.now(timezone(timedelta(hours=7)))).strftime("%Y-%m-%d %H:%M:%S")

    if event_type == "approved":
        actor = ticket.get("l2_approver") or ticket.get("l1_approver") or ticket.get("requester_name") or "អ្នករៀបចំ"
        comment = ticket.get("l2_comment") or ticket.get("l1_comment") or "បានពិនិត្យ និងសម្រេចឯកភាព"
        msg = (
            f"🎉 <b>[NSSF SOC WORKFLOW UPDATE - ការអនុម័តសម្រេច]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📩 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{actor}</b>\n"
            f"📊 <b>ស្ថានភាព ៖</b> <b>✅ បានអនុម័តផ្លូវការ (Approved)</b>\n"
            f"📝 <b>ចំណារ / មតិយោបល់ ៖</b> <i>\"{comment}\"</i>\n"
            f"⏰ <code>{now_str}</code>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
    elif event_type in ("rejected", "reject"):
        actor = ticket.get("l2_approver") or ticket.get("l1_approver") or ticket.get("requester_name") or "អ្នករៀបចំ"
        reason = ticket.get("rejection_reason") or ticket.get("l1_comment") or ticket.get("l2_comment") or "គ្មានការបញ្ជាក់"
        msg = (
            f"❌ <b>[NSSF SOC WORKFLOW UPDATE - ការបដិសេធ]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📩 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{actor}</b>\n"
            f"📊 <b>ស្ថានភាព ៖</b> <b>❌ ត្រូវបានបដិសេធ (Rejected)</b>\n"
            f"📝 <b>ចំណារ / មតិយោបល់ ៖</b> <i>\"{reason}\"</i>\n"
            f"⏰ <code>{now_str}</code>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
    elif event_type in ("completed", "done", "finished"):
        actor = ticket.get("assignee_name") or ticket.get("requester_name") or "អ្នករៀបចំ"
        comment = ticket.get("completion_note") or "បានបញ្ចប់សព្វគ្រប់ 100%"
        msg = (
            f"🏁 <b>[NSSF SOC WORKFLOW UPDATE - ការបញ្ចប់សកម្មភាព]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📩 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{actor}</b>\n"
            f"📊 <b>ស្ថានភាព ៖</b> <b>🏁 បានបញ្ចប់សព្វគ្រប់ (Completed)</b>\n"
            f"📝 <b>ចំណារ / មតិយោបល់ ៖</b> <i>\"{comment}\"</i>\n"
            f"⏰ <code>{now_str}</code>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
    elif event_type in ("in_progress", "working", "processing"):
        actor = ticket.get("assignee_name") or ticket.get("requester_name") or "អ្នករៀបចំ"
        msg = (
            f"🔄 <b>[NSSF SOC WORKFLOW UPDATE - កំពុងដំណើរការ]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📩 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{actor}</b>\n"
            f"📊 <b>ស្ថានភាព ៖</b> <b>🔄 កំពុងដំណើរការអនុវត្ត (In Progress)</b>\n"
            f"⏰ <code>{now_str}</code>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
    elif event_type == "auto_approved":
        actor = ticket.get("requester_name") or "System"
        msg = (
            f"⚡ <b>[NSSF SOC WORKFLOW UPDATE - អនុម័តស្វ័យប្រវត្តិ]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📩 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នករៀបចំធ្វើសកម្មភាព ៖</b> <b>{actor}</b>\n"
            f"📊 <b>ស្ថានភាព ៖</b> <b>📌 ត្រូវបានចាត់ចែងអនុវត្ត</b>\n"
            f"⏰ <code>{now_str}</code>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
    else: # created (pending approval)
        msg = (
            f"📩 <b>[NSSF SOC WORKFLOW - លិខិតថ្មី]</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📄 <b>លិខិត #{code} — {title}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>អ្នកស្នើសុំ ៖</b> <b>{req_name}</b>\n"
            f"📅 <b>ថ្ងៃឱសានវាទ ៖</b> <code>{due_date or 'មិនបានកំណត់'}</code>\n"
            f"🔥 <b>កម្រិតអាទិភាព ៖</b> {prio_emoji} <b>{prio}</b>\n\n"
            f"⌛ <b>ស្ថានភាព ៖</b> <b>រង់ចាំថ្នាក់ដឹកនាំអនុម័ត</b>\n\n"
            f"👉 <b>សូមចូលទៅកាន់ Web Portal ដើម្បីពិនិត្យលម្អិត!</b>"
        )
        msg = (
            f"📩 <b>កិច្ចការថ្មី — រង់ចាំអនុម័ត</b>\n\n"
            f"📄 <b>{title}</b>\n"
            f"🎫 <code>#{code}</code>\n\n"
            f"👤 <b>{req_name}</b>\n"
            f"📅 <code>{due_date or 'មិនបានកំណត់'}</code>\n"
            f"🔥 {prio_emoji} <b>{prio}</b>\n\n"
            f"⌛ <b>ស្ថានភាព ៖</b> <b>រង់ចាំថ្នាក់ដឹកនាំអនុម័ត</b>\n\n"
            f"🔔 <b>នឹងជូនដំណឹងម្តងទៀត ក្រោយពេលអនុម័ត។</b>"
        )

    # Find chat IDs of all assignees
    assignees = [a.strip() for a in assignee_str.split(",") if a.strip()]
    target_chats = set()
    
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT telegram_chat_id, full_name, username, telegram_username, position FROM users WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != ''")
        all_users = cursor.fetchall()
        conn.close()
        
        for name in assignees:
            clean_name = name.split("(")[0].replace("@", "").strip().lower()
            tokens = [t for t in clean_name.split() if len(t) >= 2]
            for u in all_users:
                u_fn = (u["full_name"] or "").strip().lower()
                u_un = (u["username"] or "").strip().lower()
                u_tg = (u["telegram_username"] or "").strip().lower()
                u_pos = (u["position"] if "position" in u.keys() and u["position"] else "").strip().lower()

                is_match = False
                if clean_name and (clean_name == u_fn or clean_name == u_un or clean_name == u_tg or clean_name in u_fn or clean_name in u_un or clean_name in u_tg):
                    is_match = True
                elif tokens:
                    for tok in tokens:
                        if len(tok) >= 2 and (tok in u_fn or tok in u_un or tok in u_tg or (u_pos and tok in u_pos)):
                            is_match = True
                            break

                if is_match and u["telegram_chat_id"]:
                    target_chats.add(str(u["telegram_chat_id"]).strip())
    except Exception as e_c:
        print("Error looking up ticket assignee chat ID:", e_c)
        
    for cid in target_chats:
        send_telegram_message(msg, chat_id=cid)

    # Also send to Group Chat so the team sees assignment/approval updates
    try:
        bot_token, group_chat_id = get_telegram_config()
        if group_chat_id:
            group_chat_id = str(group_chat_id).strip()
            if group_chat_id.startswith("-") and group_chat_id not in target_chats:
                send_telegram_message(msg, chat_id=group_chat_id)
    except Exception as ex_gc:
        print("Error sending assignee alert to Group Chat:", ex_gc)



