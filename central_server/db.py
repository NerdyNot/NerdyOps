import sqlite3

# Initialize the SQLite database and create the 'agents' table if it doesn't exist
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
    conn.commit()  # Save changes
    conn.close()  # Close the connection

# Establish and return a connection to the SQLite database
def get_db_connection():
    conn = sqlite3.connect('central_server.db')  # Connect to the SQLite database
    conn.row_factory = sqlite3.Row  # Enable name-based column access
    return conn  # Return the database connection
