import hashlib
import secrets

def hash_password(password: str) -> str:
    """
    Generates a secure SHA-256 hash combined with a unique random salt.
    Format returned: salt:hex_hash
    """
    salt = secrets.token_hex(16)
    h = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{h}"
    
def verify_password(password: str, hashed: str) -> bool:
    """
    Verifies a plain text password against the salted hash stored in database.
    """
    if not hashed or ":" not in hashed:
        return False
    salt, h = hashed.split(":", 1)
    return hashlib.sha256((password + salt).encode()).hexdigest() == h
