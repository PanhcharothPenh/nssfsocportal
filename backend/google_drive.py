import os
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(WORKSPACE, ".env"))

def get_drive_service():
    """
    Authenticates using User OAuth Credentials (if available) or Service Account credentials
    and returns a Google Drive v3 service client.
    """
    scopes = ["https://www.googleapis.com/auth/drive"]

    # 0. Check User OAuth 2.0 Refresh Token (for Personal Google Drive storage)
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
    
    if client_id and client_secret and refresh_token:
        try:
            from google.oauth2.credentials import Credentials as UserCredentials
            import google.auth.transport.requests
            creds = UserCredentials(
                None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=scopes
            )
            req = google.auth.transport.requests.Request()
            creds.refresh(req)
            return build('drive', 'v3', credentials=creds)
        except Exception as oauth_err:
            print("OAuth User Credentials refresh failed (falling back to Service Account):", oauth_err)

    # 1. Check GOOGLE_CREDENTIALS_JSON environment variable next
    creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if creds_json:
        try:
            import json
            info = json.loads(creds_json)
            credentials = Credentials.from_service_account_info(info, scopes=scopes)
            return build('drive', 'v3', credentials=credentials)
        except Exception as e:
            print("Failed to authenticate from GOOGLE_CREDENTIALS_JSON:", e)
            
    # 2. Check credentials file locations
    possible_paths = [
        os.getenv("GOOGLE_CREDENTIALS_FILE", ""),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "google_credentials.json"),
        os.path.join(WORKSPACE, "backend", "google_credentials.json"),
        os.path.join(WORKSPACE, "api", "google_credentials.json"),
        os.path.join(WORKSPACE, "google_credentials.json")
    ]
    
    credentials_file = None
    for p in possible_paths:
        if p and os.path.exists(p):
            credentials_file = p
            break
            
    if not credentials_file:
        print("Google Drive credentials file not found in any path")
        return None
        
    try:
        credentials = Credentials.from_service_account_file(credentials_file, scopes=scopes)
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"Failed to authenticate with Google Drive: {e}")
        return None

def upload_file_to_drive(file_stream, filename, mime_type, folder_id):
    """
    Uploads a file stream to Google Drive inside the specified folder.
    """
    service = get_drive_service()
    if not service:
        return None, "Authentication failed"
        
    try:
        file_metadata = {
            'name': filename
        }
        if folder_id:
            file_metadata['parents'] = [folder_id]
            
        media = MediaIoBaseUpload(file_stream, mimetype=mime_type, resumable=True)
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink, webContentLink',
            supportsAllDrives=True
        ).execute()
        
        # Set public read permission so all portal users can view & download without permission error
        try:
            service.permissions().create(
                fileId=file.get('id'),
                body={'type': 'anyone', 'role': 'reader'},
                supportsAllDrives=True
            ).execute()
        except Exception as perm_err:
            print("Failed to set public permission on uploaded file:", perm_err)

        return file, None
    except Exception as e:
        return None, str(e)

def list_files_in_drive(folder_id):
    """
    Lists files inside the specified Google Drive folder.
    """
    service = get_drive_service()
    if not service:
        return None, "Authentication failed"
        
    try:
        query = "'root' in parents"
        if folder_id:
            query = f"'{folder_id}' in parents"
            
        query += " and trashed = false"
        
        # Fetch file list
        results = service.files().list(
            q=query,
            pageSize=100,
            fields="files(id, name, mimeType, createdTime, size, webViewLink, webContentLink)",
            orderBy="createdTime desc",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute()
        return results.get('files', []), None
    except Exception as e:
        return None, str(e)

def delete_file_from_drive(file_id):
    """
    Deletes a file from Google Drive by its file ID.
    """
    service = get_drive_service()
    if not service:
        return False, "Authentication failed"
        
    try:
        service.files().delete(fileId=file_id, supportsAllDrives=True).execute()
        return True, None
    except Exception as e:
        return False, str(e)
