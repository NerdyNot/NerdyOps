from flask import Flask, request, jsonify
from flask_cors import CORS
from redis_connection import get_redis_connection
from langchain_integration import convert_natural_language_to_script, interpret_result
from db import init_db, get_db_connection
from auth import auth_bp
from logo import print_logo
import json
import uuid
import logging
from datetime import datetime

# Setting up logging
logging.basicConfig(level=logging.INFO)

# Initialize the Flask application
app = Flask(__name__)
CORS(app)

# Get a connection to the Redis server
redis = get_redis_connection()

# Flag to ensure the database is initialized only once
db_initialized = False

# Register the auth blueprint
app.register_blueprint(auth_bp)

# Initialize the database before the first request
@app.before_request
def initialize_database():
    global db_initialized
    if not db_initialized:
        init_db()
        db_initialized = True

# Health check endpoint
@app.route('/health', methods=['GET'])
def ping():
    return jsonify({"status": "ok"}), 200

# Endpoint to submit a task to an agent
@app.route('/submit-task', methods=['POST'])
def submit_task():
    data = request.get_json()
    input_text = data.get('command')
    target_agent_id = data.get('agent_id')
    
    # Validate input
    if not input_text or not target_agent_id:
        return jsonify({"error": "Command and Agent ID are required"}), 400
    
    # Fetch the agent's OS type from SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT os_type FROM agents WHERE agent_id = ?', (target_agent_id,))
    agent_info = cursor.fetchone()
    conn.close()
    
    if not agent_info:
        return jsonify({"error": "Agent not found"}), 404
    
    os_type = agent_info['os_type']

    if os_type not in ['linux', 'windows', 'darwin']:
        return jsonify({"error": "Unsupported OS type for the target agent"}), 400
    
    try:
        # Convert natural language command to script using LangChain
        script_code = convert_natural_language_to_script(input_text, os_type)
        logging.info(f"Converted Script: {script_code}")
    except Exception as e:
        logging.error(f"Error in converting command: {e}")
        return jsonify({"error": str(e)}), 500
    
    # Create a unique task ID and store the task for user review
    task_id = str(uuid.uuid4())
    task_data = {
        "task_id": task_id,
        "input": input_text,
        "script_code": script_code,
        "agent_id": target_agent_id,
        "timestamp": datetime.now().isoformat(),  # Save the current timestamp
        "status": "pending",  # Task status set to pending for review
        "submitted_at": datetime.now().isoformat()  # Task submission time
    }
    
    # Save the task data in Redis
    redis.set(f'task:{task_id}', json.dumps(task_data))
    redis.lpush('pending_tasks', task_id)
    
    return jsonify({"task_id": task_id, "status": "Task created and pending review"})


# Endpoint to get pending tasks for review
@app.route('/get-pending-tasks', methods=['GET'])
def get_pending_tasks():
    pending_task_ids = redis.lrange('pending_tasks', 0, -1)
    pending_tasks = []
    
    for task_id in pending_task_ids:
        task_data = redis.get(f'task:{task_id.decode()}')
        if task_data:
            task = json.loads(task_data)
            pending_tasks.append(task)
    
    return jsonify(pending_tasks)

# Endpoint to approve a pending task
@app.route('/approve-task', methods=['POST'])
def approve_task():
    data = request.get_json()
    task_id = data.get('task_id')
    
    # Validate input
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    task_data = redis.get(f'task:{task_id}')
    if not task_data:
        return jsonify({"error": "Task not found"}), 404
    
    task_data = json.loads(task_data)
    if task_data.get('status') != 'pending':
        return jsonify({"error": "Task is not in pending status"}), 400
    
    # Update the task status to approved and push it to the agent's queue
    task_data['status'] = 'approved'
    task_data['approved_at'] = datetime.now().isoformat()  # Task approval time
    redis.set(f'task:{task_id}', json.dumps(task_data))
    target_agent_id = task_data['agent_id']
    redis.lpush(f'task_queue:{target_agent_id}', json.dumps(task_data))
    
    # Remove the task from the pending list
    redis.lrem('pending_tasks', 0, task_id)
    
    return jsonify({"status": "Task approved", "task_id": task_id})


# Endpoint to reject a pending task
@app.route('/reject-task', methods=['POST'])
def reject_task():
    data = request.get_json()
    task_id = data.get('task_id')
    
    # Validate input
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    task_data = redis.get(f'task:{task_id}')
    if not task_data:
        return jsonify({"error": "Task not found"}), 404
    
    task_data = json.loads(task_data)
    if task_data.get('status') != 'pending':
        return jsonify({"error": "Task is not in pending status"}), 400
    
    # Update the task status to rejected
    task_data['status'] = 'rejected'
    task_data['rejected_at'] = datetime.now().isoformat()  # Task rejection time
    redis.set(f'task:{task_id}', json.dumps(task_data))
    
    # Remove the task from the pending list
    redis.lrem('pending_tasks', 0, task_id)
    
    return jsonify({"status": "Task rejected", "task_id": task_id})


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

# Endpoint for agents to fetch tasks
@app.route('/get-task', methods=['GET'])
def get_task():
    agent_id = request.args.get('agent_id')
    
    # Validate input
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    # Fetch the next task for the agent from Redis queue
    task_queue_key = f'task_queue:{agent_id}'
    task = redis.rpop(task_queue_key)

    if task:
        task_data = json.loads(task.decode())
        task_id = task_data["task_id"]
        input_text = task_data["input"]
        script_code = task_data["script_code"]
        timestamp = task_data.get("timestamp", "N/A")  # 기본값 설정
        result_key = f"result:{task_id}"
        result = redis.hgetall(result_key)
        if result:
            output = result.get(b'output', b'').decode()
            error = result.get(b'error', b'').decode()
            interpretation = result.get(b'interpretation', b'').decode()
        else:
            output = ""
            error = ""
            interpretation = ""
        return jsonify({"task_id": task_id, "input": input_text, "script_code": script_code, "timestamp": timestamp, "output": output, "error": error, "interpretation": interpretation})
    else:
        return jsonify({"error": "No task found for this agent"}), 404


# Endpoint for agents to report task results
@app.route('/report-result', methods=['POST'])
def report_result():
    data = request.get_json()
    task_id = data.get('task_id')
    input_text = data.get('input')
    command = data.get('command')
    output = data.get('output')
    error = data.get('error')
    
    # Validate input
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400

    result_key = f"result:{task_id}"

    output_str = output if output is not None else ""
    error_str = error if error is not None else ""

    try:
        # Interpret the result using LangChain
        interpretation = interpret_result(input_text, output_str, error_str)

        if interpretation is None:
            interpretation = ""

        # Store the result in Redis
        safe_input_text = input_text if input_text is not None else ""
        safe_command = command if command is not None else ""
        safe_output_str = output_str if output_str is not None else ""
        safe_error_str = error_str if error_str is not None else ""
        safe_interpretation = interpretation if interpretation is not None else ""

        redis.hset(result_key, "input", safe_input_text)
        redis.hset(result_key, "command", safe_command)
        redis.hset(result_key, "output", safe_output_str)
        redis.hset(result_key, "error", safe_error_str)
        redis.hset(result_key, "interpretation", safe_interpretation)
        
        logging.info(f"Result reported for task ID {task_id}:\nInput: {safe_input_text}\nCommand: {safe_command}\nOutput: {safe_output_str}\nError: {safe_error_str}\nInterpretation: {safe_interpretation}")
        return jsonify({"status": "Result reported", "task_id": task_id, "interpretation": safe_interpretation})
    except Exception as e:
        logging.error(f"Error reporting result: {e}")
        return jsonify({"error": str(e)}), 500

# Endpoint to check the status of a task
@app.route('/task-status/<task_id>', methods=['GET'])
def task_status(task_id):
    result_key = f"result:{task_id}"
    result = redis.hgetall(result_key)
    if result:
        input_text = result.get(b'input', b'').decode()
        command = result.get(b'command', b'').decode()
        output = result.get(b'output', b'').decode()
        error = result.get(b'error', b'').decode()
        interpretation = result.get(b'interpretation', b'').decode()
        
        logging.info(f"Task ID: {task_id} Input: {input_text}")
        logging.info(f"Task ID: {task_id} Command: {command}")
        logging.info(f"Task ID: {task_id} Output: {output}")
        logging.info(f"Task ID: {task_id} Error: {error}")
        logging.info(f"Task ID: {task_id} Interpretation: {interpretation}")
        
        return jsonify({"task_id": task_id, "input": input_text, "command": command, "output": output, "error": error, "interpretation": interpretation})
    return jsonify({"error": "Task not found"}), 404

# Endpoint to get the list of tasks for a specific agent
@app.route('/get-agent-tasks', methods=['GET'])
def get_agent_tasks():
    agent_id = request.args.get('agent_id')
    
    # Validate input
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    task_queue_key = f'agent_tasks:{agent_id}'
    tasks = redis.lrange(task_queue_key, 0, -1)
    
    task_list = []
    for task in tasks:
        task_data = json.loads(task.decode())
        task_id = task_data["task_id"]
        input_text = task_data["input"]
        command = task_data["command"]
        script_code = task_data["script_code"]
        timestamp = task_data.get("timestamp", "N/A")  # 기본값 설정
        result_key = f"result:{task_id}"
        result = redis.hgetall(result_key)
        if result:
            output = result.get(b'output', b'').decode()
            error = result.get(b'error', b'').decode()
            interpretation = result.get(b'interpretation', b'').decode()
        else:
            output = ""
            error = ""
            interpretation = ""
        task_list.append({
            "task_id": task_id,
            "input": input_text,
            "command": command,
            "script_code": script_code,
            "timestamp": timestamp,
            "output": output,
            "error": error,
            "interpretation": interpretation
        })
    
    return jsonify(task_list)

# Endpoint to summary the tasks
@app.route('/get-tasks-summary', methods=['GET'])
def get_tasks_summary():
    success_count = 0
    failure_count = 0
    
    task_keys = redis.keys('result:*')
    for key in task_keys:
        result = redis.hgetall(key)
        if b'error' in result and result[b'error']:
            failure_count += 1
        else:
            success_count += 1
    
    return jsonify({"successCount": success_count, "failureCount": failure_count})

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

# Main entry point for the application
if __name__ == '__main__':
    print_logo()  # Print the logo at the start
    init_db()  # Initialize the database
    app.run(host='0.0.0.0', port=5001)  # Start the Flask app