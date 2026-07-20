import sys
import os
import traceback

# All backend files are co-located in the api/ directory for Vercel deployment
# (They are copied from backend/ during build)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import app
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI()
    tb = traceback.format_exc()
    
    # Catch-all endpoint to expose the traceback
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    def catch_all(path_name: str):
        return {
            "status": "error",
            "message": "Failed to import application on startup",
            "error": str(e),
            "traceback": tb
        }
