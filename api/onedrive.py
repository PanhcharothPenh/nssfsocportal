import os
import requests
from dotenv import load_dotenv

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(WORKSPACE, ".env"))

def get_onedrive_access_token():
    """
    Acquires an access token from Microsoft Identity Platform using Client Credentials flow.
    """
    client_id = os.getenv("MICROSOFT_CLIENT_ID")
    client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    tenant_id = os.getenv("MICROSOFT_TENANT_ID", "consumers")
    
    if not client_id or not client_secret:
        return None, "Microsoft Client ID or Client Secret not configured"
        
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    payload = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'scope': 'https://graph.microsoft.com/.default'
    }
    
    try:
        res = requests.post(url, data=payload)
        if res.status_code != 200:
            return None, f"Token request failed: {res.text}"
            
        token_data = res.json()
        return token_data.get('access_token'), None
    except Exception as e:
        return None, str(e)

def upload_file_to_onedrive(file_bytes, filename, mime_type):
    """
    Uploads a file to the user's OneDrive in the 'NSSF_SOC_Files' folder.
    """
    token, err = get_onedrive_access_token()
    if err:
        return None, err
        
    user_id = os.getenv("ONEDRIVE_USER_ID")
    if not user_id:
        return None, "ONEDRIVE_USER_ID is not configured in .env"
        
    # URL to upload file content directly
    url = f"https://graph.microsoft.com/v1.0/users/{user_id}/drive/root:/NSSF_SOC_Files/{filename}:/content"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': mime_type
    }
    
    try:
        res = requests.put(url, headers=headers, data=file_bytes)
        if res.status_code not in [200, 201]:
            return None, f"OneDrive upload failed: {res.text}"
            
        item_data = res.json()
        return {
            'id': item_data.get('id'),
            'name': item_data.get('name'),
            'webUrl': item_data.get('webUrl'),
            'size': item_data.get('size'),
            'createdDateTime': item_data.get('createdDateTime'),
            'file': item_data.get('file', {})
        }, None
    except Exception as e:
        return None, str(e)

def list_files_in_onedrive():
    """
    Lists files inside the 'NSSF_SOC_Files' folder in OneDrive.
    """
    token, err = get_onedrive_access_token()
    if err:
        return None, err
        
    user_id = os.getenv("ONEDRIVE_USER_ID")
    if not user_id:
        return None, "ONEDRIVE_USER_ID is not configured in .env"
        
    url = f"https://graph.microsoft.com/v1.0/users/{user_id}/drive/root:/NSSF_SOC_Files:/children"
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        res = requests.get(url, headers=headers)
        # If the folder doesn't exist yet, return an empty list (will be created on first upload)
        if res.status_code == 404:
            return [], None
            
        if res.status_code != 200:
            return None, f"OneDrive list failed: {res.text}"
            
        items = res.json().get('value', [])
        files = []
        for item in items:
            if 'file' in item:  # Only include files, skip subfolders if any
                files.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'size': item.get('size'),
                    'createdTime': item.get('createdDateTime'),
                    'mimeType': item.get('file', {}).get('mimeType', 'application/octet-stream'),
                    'webViewLink': item.get('webUrl'),
                })
        return files, None
    except Exception as e:
        return None, str(e)

def delete_file_from_onedrive(file_id):
    """
    Deletes a file from OneDrive by its item ID.
    """
    token, err = get_onedrive_access_token()
    if err:
        return False, err
        
    user_id = os.getenv("ONEDRIVE_USER_ID")
    if not user_id:
        return False, "ONEDRIVE_USER_ID is not configured in .env"
        
    url = f"https://graph.microsoft.com/v1.0/users/{user_id}/drive/items/{file_id}"
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        res = requests.delete(url, headers=headers)
        if res.status_code not in [200, 204]:
            return False, f"OneDrive delete failed: {res.text}"
        return True, None
    except Exception as e:
        return False, str(e)
