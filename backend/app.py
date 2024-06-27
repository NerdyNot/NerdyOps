# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.redis_connection import get_redis_connection
from utils.db import init_db, get_db_connection
from utils.logo import print_logo
from endpoints.auth import auth_bp
from endpoints.tasks import tasks_bp
from endpoints.monitoring import monitoring_bp
from endpoints.pat import pat_bp
import json
import logging

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

redis = get_redis_connection()

db_initialized = False

app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(monitoring_bp)
app.register_blueprint(pat_bp)

@app.before_request
def initialize_database():
    global db_initialized
    if not db_initialized:
        init_db()
        db_initialized = True

@app.route('/health', methods=['GET'])
def ping():
    return jsonify({"status": "ok"}), 200

# Endpoint to register an agent
@app.route('/register-agent', methods=['POST'])
def register_agent():
    data = request.get_json()
    agent_id = data.get('agent_id')
    os_type = data.get('os_type')
    computer_name = data.get('computer_name')
    private_ip = data.get('private_ip')
    shell_version = data.get('shell_version')
    
    # Validate input
    if not agent_id or os_type not in ['linux', 'windows', 'darwin']:
        return jsonify({"error": "Invalid agent ID or OS type"}), 400
    
    # Save agent information in SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO agents (agent_id, os_type, status, computer_name, private_ip, shell_version, last_update_date)
        VALUES (?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (agent_id, os_type, computer_name, private_ip, shell_version))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "Agent registered", "agent_id": agent_id, "os_type": os_type})

# Endpoint to update the status of an agent
@app.route('/agent-status', methods=['POST'])
def agent_status():
    data = request.get_json()
    agent_id = data.get('agent_id')
    status = data.get('status')
    
    # Validate input
    if not agent_id or not status:
        return jsonify({"error": "No agent_id or status provided"}), 400
    
    # Update the agent's status in SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE agents
        SET status = ?, last_update_date = CURRENT_TIMESTAMP
        WHERE agent_id = ?
    ''', (status, agent_id))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "Status updated", "agent_id": agent_id})

# Endpoint to get the list of registered agents
@app.route('/get-agents', methods=['GET'])
def get_agents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM agents')
    agents = cursor.fetchall()
    conn.close()
    
    agent_list = [dict(agent) for agent in agents]
    return jsonify(agent_list)

# Main entry point for the application
if __name__ == '__main__':
    print_logo()
    init_db()
    app.run(host='0.0.0.0', port=5001)
