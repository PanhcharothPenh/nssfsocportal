import sys
import os

# All backend files are co-located in the api/ directory for Vercel deployment
# (They are copied from backend/ during build)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
