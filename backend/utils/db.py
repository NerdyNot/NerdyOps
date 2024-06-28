import os
import sqlite3
import pymysql
from werkzeug.security import generate_password_hash
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database configuration from environment variables
DB_TYPE = os.getenv('DB_TYPE', 'sqlite')
DB_NAME = os.getenv('DB_NAME', 'central_server.db')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', 3306)
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

# Initialize the database and create the necessary tables if they don't exist
def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if DB_TYPE == 'sqlite':
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

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS config (
                    config_key TEXT PRIMARY KEY,
                    config_value TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_monitoring_settings (
                    agent_id TEXT PRIMARY KEY,
                    check_schedule BOOLEAN,
                    check_ping TEXT,
                    running_process TEXT,
                    listen_port TEXT,
                    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
                )
            ''')
        elif DB_TYPE == 'mysql':
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agents (
                    agent_id VARCHAR(255) PRIMARY KEY,
                    os_type VARCHAR(255),
                    status VARCHAR(255),
                    computer_name VARCHAR(255),
                    private_ip VARCHAR(255),
                    shell_version VARCHAR(255),
                    last_update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255) UNIQUE,
                    email VARCHAR(255) UNIQUE,
                    password VARCHAR(255),
                    role VARCHAR(255)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_pats (
                    pat_id VARCHAR(255) PRIMARY KEY,
                    token VARCHAR(255) UNIQUE,
                    expiry_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_id VARCHAR(255),
                    FOREIGN KEY (user_id) REFERENCES users (username)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    key_name VARCHAR(255) PRIMARY KEY,
                    key_value VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS completed_tasks (
                    task_id VARCHAR(255) PRIMARY KEY,
                    agent_id VARCHAR(255),
                    input TEXT,
                    script_code TEXT,
                    status VARCHAR(255),
                    submitted_at TIMESTAMP,
                    approved_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    output TEXT,
                    error TEXT,
                    interpretation TEXT
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS config (
                    config_key VARCHAR(255) PRIMARY KEY,
                    config_value TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_monitoring_settings (
                    agent_id VARCHAR(255) PRIMARY KEY,
                    check_schedule BOOLEAN,
                    check_ping VARCHAR(255),
                    running_process VARCHAR(255),
                    listen_port VARCHAR(255),
                    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
                )
            ''')

        # Check if the admin user already exists
        query = 'SELECT * FROM users WHERE username = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM users WHERE username = ?'
        cursor.execute(query, ('admin',))
        admin_user = cursor.fetchone()
        
        if not admin_user:
            # Hash the default admin password
            hashed_password = generate_password_hash('admin', method='pbkdf2:sha256')
            query = '''
                INSERT INTO users (user_id, username, email, password, role)
                VALUES (%s, %s, %s, %s, %s)
            ''' if DB_TYPE == 'mysql' else '''
                INSERT INTO users (user_id, username, email, password, role)
                VALUES (?, ?, ?, ?, ?)
            '''
            cursor.execute(query, (str(uuid.uuid4()), 'admin', 'admin@admin.com', hashed_password, 'admin'))
            conn.commit()  # Save changes

    finally:
        conn.close()  # Close the connection

# Establish and return a connection to the database
def get_db_connection():
    if DB_TYPE == 'sqlite':
        conn = sqlite3.connect(DB_NAME)  # Connect to the SQLite database
        conn.row_factory = sqlite3.Row  # Enable name-based column access
    elif DB_TYPE == 'mysql':
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )
    else:
        raise ValueError(f"Unsupported DB_TYPE: {DB_TYPE}")
    return conn  # Return the database connection

def get_api_key(key_name):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = 'SELECT key_value FROM api_keys WHERE key_name = %s' if DB_TYPE == 'mysql' else 'SELECT key_value FROM api_keys WHERE key_name = ?'
        cursor.execute(query, (key_name,))
        row = cursor.fetchone()
    except Exception as e:
        init_db()  # Ensure the table exists
        cursor.execute(query, (key_name,))
        row = cursor.fetchone()
    finally:
        conn.close()

    if row:
        return row['key_value']
    else:
        return ""  # Return an empty string if the API key is not found
