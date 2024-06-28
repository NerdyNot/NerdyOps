import sqlite3
from werkzeug.security import generate_password_hash
import uuid

# Initialize the SQLite database and create the necessary tables if they don't exist
def init_db():
    conn = sqlite3.connect('central_server.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            agent_id TEXT PRIMARY KEY,
            os_type TEXT,
            status TEXT,
            computer_name TEXT,
            private_ip TEXT,
            shell_version TEXT,
            last_update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_pats (
            pat_id TEXT PRIMARY KEY,
            token TEXT UNIQUE,
            expiry_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            key_name TEXT PRIMARY KEY,
            key_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS completed_tasks (
            task_id TEXT PRIMARY KEY,
            agent_id TEXT,
            input TEXT,
            script_code TEXT,
            status TEXT,
            submitted_at TIMESTAMP,
            approved_at TIMESTAMP,
            completed_at TIMESTAMP,
            output TEXT,
            error TEXT,
            interpretation TEXT
        )
    ''')
    
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    admin_user = cursor.fetchone()
    
    if not admin_user:
        hashed_password = generate_password_hash('admin', method='pbkdf2:sha256')
        cursor.execute('''
            INSERT INTO users (user_id, username, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'admin', 'admin@admin.com', hashed_password, 'admin'))
        conn.commit()
    
    conn.close()

# Establish and return a connection to the SQLite database
def get_db_connection():
    conn = sqlite3.connect('central_server.db')  # Connect to the SQLite database
    conn.row_factory = sqlite3.Row  # Enable name-based column access
    return conn  # Return the database connection

def get_api_key(key_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT key_value FROM api_keys WHERE key_name = ?', (key_name,))
        row = cursor.fetchone()
    except sqlite3.OperationalError as e:
        init_db()  # Ensure the table exists
        cursor.execute('SELECT key_value FROM api_keys WHERE key_name = ?', (key_name,))
        row = cursor.fetchone()

    conn.close()

    if row:
        return row['key_value']
    else:
        return ""  # Return an empty string if the API key is not found