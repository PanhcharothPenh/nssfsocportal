import os
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

WORKSPACE = r"c:\Users\Miller\Documents\SOC-Work-WebAPP"
load_dotenv(os.path.join(WORKSPACE, ".env"))

def get_drive_service():
    """
    Authenticates using the Service Account credentials file specified in .env
    and returns a Google Drive v3 service client.
    """
    credentials_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "backend/google_credentials.json")
    if not os.path.isabs(credentials_file):
        credentials_file = os.path.join(WORKSPACE, credentials_file)
        
    if not os.path.exists(credentials_file):
        print(f"Credentials file not found: {credentials_file}")
        return None
        
    scopes = [
        "https://www.googleapis.com/auth/drive"
    ]
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
