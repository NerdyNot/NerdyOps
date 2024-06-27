import sqlite3
from werkzeug.security import generate_password_hash
import uuid

# Initialize the SQLite database and create the necessary tables if they don't exist
def init_db():
    conn = sqlite3.connect('central_server.db')  # Connect to the SQLite database
    cursor = conn.cursor()  # Create a cursor to execute SQL commands

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
    ''')  # Create 'agents' table if it doesn't exist

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')  # Create 'users' table if it doesn't exist

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pats (
            pat_id TEXT PRIMARY KEY,
            token TEXT UNIQUE,
            expiry_date TIMESTAMP,
            user_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')  # Create 'pats' table if it doesn't exist

    # Check if the admin user already exists
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    admin_user = cursor.fetchone()

    if not admin_user:
        # Hash the default admin password
        hashed_password = generate_password_hash('admin', method='pbkdf2:sha256')
        cursor.execute('''
            INSERT INTO users (user_id, username, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'admin', 'admin@admin.com', hashed_password, 'admin'))
        conn.commit()  # Save changes

    conn.close()  # Close the connection

# Establish and return a connection to the SQLite database
def get_db_connection():
    conn = sqlite3.connect('central_server.db')  # Connect to the SQLite database
    conn.row_factory = sqlite3.Row  # Enable name-based column access
    return conn  # Return the database connection
