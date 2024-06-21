import sqlite3

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
            update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect('central_server.db')
    conn.row_factory = sqlite3.Row
    return conn
