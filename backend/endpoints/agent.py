from flask import Blueprint, request, jsonify
from utils.db import get_db_connection
from utils.redis_connection import get_redis_connection
from datetime import datetime, timedelta
import logging

agent_bp = Blueprint('agent', __name__)
logging.basicConfig(level=logging.INFO)

redis = get_redis_connection()

@agent_bp.route('/register-agent', methods=['POST'])
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

@agent_bp.route('/agent-status', methods=['POST'])
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

@agent_bp.route('/get-agents', methods=['GET'])
def get_agents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM agents')
    agents = cursor.fetchall()
    conn.close()
    
    agent_list = [dict(agent) for agent in agents]
    return jsonify(agent_list)

def check_agent_status():
    logging.info("Checking agent statuses...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT agent_id, last_update_date, status FROM agents')
    agents = cursor.fetchall()
    
    for agent in agents:
        last_update_date = datetime.fromisoformat(agent['last_update_date'])
        time_diff = datetime.utcnow() - last_update_date
        if time_diff > timedelta(minutes=1) and agent['status'] != 'down':
            cursor.execute('''
                UPDATE agents
                SET status = 'down'
                WHERE agent_id = ?
            ''', (agent['agent_id'],))
            logging.info(f"Agent {agent['agent_id']} marked as down")
    
    conn.commit()
    conn.close()

# Endpoint to delete an agent
@app.route('/delete-agent', methods=['POST'])
def delete_agent():
    data = request.get_json()
    agent_id = data.get('agent_id')
    
    # Validate input
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400
    
    # Delete agent information from SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM agents WHERE agent_id = ?', (agent_id,))
    conn.commit()
    conn.close()
    
    # Delete agent tasks from Redis
    task_queue_key = f'task_queue:{agent_id}'
    agent_tasks_key = f'agent_tasks:{agent_id}'
    redis.delete(task_queue_key)
    redis.delete(agent_tasks_key)
    
    return jsonify({"status": "Agent deleted", "agent_id": agent_id})

def schedule_agent_status_check():
    import schedule
    import time
    from threading import Thread

    schedule.every(1).minute.do(check_agent_status)

    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    Thread(target=run_scheduler).start()
