import os
import sqlite3
from dotenv import load_dotenv

# Resolve workspace path and load environment variables immediately
WORKSPACE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(WORKSPACE, ".env"))

try:
    import psycopg2
except ImportError:
    psgres_available = False
else:
    psgres_available = True

DB_PATH = os.path.join(WORKSPACE, "soc_network.db")

class RowWrapper(dict):
    def __init__(self, row_dict, row_tuple):
        super().__init__(row_dict)
        self.row_tuple = row_tuple

    def __getitem__(self, key):
        if isinstance(key, int):
            return self.row_tuple[key]
        return super().__getitem__(key)

class PostgresCursorWrapper:
    def __init__(self, pg_cursor):
        self.pg_cursor = pg_cursor

    @property
    def lastrowid(self):
        try:
            self.pg_cursor.execute("SELECT lastval()")
            return self.pg_cursor.fetchone()[0]
        except Exception:
            return None

    def execute(self, sql, params=None):
        # Translate SQLite syntax to PostgreSQL
        if 'INTEGER PRIMARY KEY AUTOINCREMENT' in sql:
            sql = sql.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        
        # Translate INSERT OR REPLACE queries to standard Postgres syntax
        if 'INSERT OR REPLACE INTO settings' in sql:
            sql = sql.replace('INSERT OR REPLACE INTO settings', 'INSERT INTO settings')
            sql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
        elif 'INSERT OR REPLACE INTO login_sessions' in sql:
            sql = sql.replace('INSERT OR REPLACE INTO login_sessions', 'INSERT INTO login_sessions')
            if 'username' in sql:
                sql += " ON CONFLICT (token) DO UPDATE SET status = EXCLUDED.status, username = EXCLUDED.username"
            else:
                sql += " ON CONFLICT (token) DO UPDATE SET status = EXCLUDED.status"
        elif 'INSERT OR REPLACE INTO' in sql:
            sql = sql.replace('INSERT OR REPLACE INTO', 'INSERT INTO')
            if 'branch_ips' in sql:
                sql += " ON CONFLICT (id) DO NOTHING"
            elif 'hq_ips' in sql:
                sql += " ON CONFLICT (id) DO NOTHING"
            elif 'settings' in sql:
                sql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"

        # Translate ? placeholders to %s for psycopg2
        if '?' in sql:
            sql = sql.replace('?', '%s')

        if params is not None:
            self.pg_cursor.execute(sql, params)
        else:
            self.pg_cursor.execute(sql)

    def fetchone(self):
        try:
            row = self.pg_cursor.fetchone()
            if row is None:
                return None
            desc = [d[0] for d in self.pg_cursor.description]
            row_dict = {desc[i]: row[i] for i in range(len(desc))}
            return RowWrapper(row_dict, row)
        except Exception:
            return None

    def fetchall(self):
        try:
            rows = self.pg_cursor.fetchall()
            if not rows:
                return []
            desc = [d[0] for d in self.pg_cursor.description]
            result = []
            for r in rows:
                row_dict = {desc[i]: r[i] for i in range(len(desc))}
                result.append(RowWrapper(row_dict, r))
            return result
        except Exception:
            return []

    def close(self):
        self.pg_cursor.close()

class PostgresConnectionWrapper:
    def __init__(self, pg_conn):
        self.pg_conn = pg_conn

    def cursor(self):
        return PostgresCursorWrapper(self.pg_conn.cursor())

    def commit(self):
        self.pg_conn.commit()

    def rollback(self):
        self.pg_conn.rollback()

    def close(self):
        self.pg_conn.close()

def get_db_connection():
    # If SUPABASE_DB_URL or DATABASE_URL is set in environment, connect to PostgreSQL
    # Otherwise fallback to local SQLite database
    url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if url:
        if not psgres_available:
            raise RuntimeError("PostgreSQL URL is configured in the environment, but 'psycopg2' module is not installed!")
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if "?" in url:
            url = url.split("?")[0]
        pg_conn = psycopg2.connect(url)
        return PostgresConnectionWrapper(pg_conn)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
