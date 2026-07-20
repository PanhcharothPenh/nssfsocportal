import os
import requests
from dotenv import load_dotenv

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(WORKSPACE, ".env"))

def send_telegram_message(message: str):
    """
    Sends a formatted message to a Telegram group or channel using Telegram Bot API.
    """
    # 1. Try reading from Database settings first
    bot_token = None
    chat_id = None
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        row = cursor.fetchone()
        if row and row['value']:
            bot_token = row['value']
            
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_chat_id'")
        row = cursor.fetchone()
        if row and row['value']:
            chat_id = row['value']
        conn.close()
    except Exception as db_err:
        print(f"Error reading telegram config from DB: {db_err}")

    # 2. Fall back to environment variables
    if not bot_token:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not chat_id:
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        return False, "Telegram Bot Token or Chat ID not configured in settings or .env"
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML' # Allow bold, code blocks, etc.
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            return True, "Message sent successfully"
        else:
            return False, f"Telegram API Error: {res.text}"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"
