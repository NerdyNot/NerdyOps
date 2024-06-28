# endpoints/tasks.py
from flask import Blueprint, request, jsonify
from utils.redis_connection import get_redis_connection
from utils.langchain_integration import convert_natural_language_to_script, interpret_result
from utils.db import get_db_connection
import json
import uuid
import logging
from datetime import datetime
import threading
from time import sleep

logging.basicConfig(level=logging.INFO)

tasks_bp = Blueprint('tasks', __name__)

redis = get_redis_connection()

# Initialize a lock for synchronization
sync_lock = threading.Lock()

def sync_redis_and_db():
    with sync_lock:  # Acquire lock
        conn = get_db_connection()
        cursor = conn.cursor()

        # Sync from Redis to DB
        task_keys = redis.keys('result:*')
        for key in task_keys:
            task_id = key.decode().split(':')[1]
            task_data = redis.get(f'task:{task_id}')
            if task_data:
                task = json.loads(task_data)
                if task['status'] == 'completed':
                    result_data = redis.hgetall(f'result:{task_id}')
                    task.update({k.decode(): v.decode() for k, v in result_data.items()})
                    cursor.execute('''
                        INSERT OR REPLACE INTO completed_tasks (task_id, agent_id, input, script_code, status, submitted_at, approved_at, completed_at, output, error, interpretation)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        task['task_id'], task['agent_id'], task['input'], task['script_code'], task['status'],
                        task.get('submitted_at'), task.get('approved_at'), task.get('completed_at'),
                        task.get('output'), task.get('error'), task.get('interpretation')
                    ))

        # Sync from DB to Redis
        cursor.execute('SELECT * FROM completed_tasks')
        rows = cursor.fetchall()
        for row in rows:
            task_id = row['task_id']
            task_data = {
                "task_id": row['task_id'],
                "agent_id": row['agent_id'],
                "input": row['input'],
                "script_code": row['script_code'],
                "status": row['status'],
                "submitted_at": row['submitted_at'],
                "approved_at": row['approved_at'],
                "completed_at": row['completed_at']
            }
            redis.set(f'task:{task_id}', json.dumps(task_data))
            redis.hset(f'result:{task_id}', "output", row['output'])
            redis.hset(f'result:{task_id}', "error", row['error'])
            redis.hset(f'result:{task_id}', "interpretation", row['interpretation'])

        conn.commit()
        conn.close()

def sync_redis_to_db_background():
    while True:
        sync_redis_and_db()
        sleep(60)  # Perform sync every 1 minute

def start_sync_thread():
    sync_thread = threading.Thread(target=sync_redis_to_db_background)
    sync_thread.daemon = True
    sync_thread.start()



@tasks_bp.route('/submit-task', methods=['POST'])
def submit_task():
    data = request.get_json()
    input_text = data.get('command')
    target_agent_id = data.get('agent_id')
    
    if not input_text or not target_agent_id:
        return jsonify({"error": "Command and Agent ID are required"}), 400
    
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
        script_code = convert_natural_language_to_script(input_text, os_type)
        logging.info(f"Converted Script: {script_code}")
    except Exception as e:
        logging.error(f"Error in converting command: {e}")
        return jsonify({"error": str(e)}), 500
    
    task_id = str(uuid.uuid4())
    task_data = {
        "task_id": task_id,
        "input": input_text,
        "script_code": script_code,
        "agent_id": target_agent_id,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        "submitted_at": datetime.now().isoformat()
    }
    
    redis.set(f'task:{task_id}', json.dumps(task_data))
    redis.lpush('pending_tasks', task_id)
    
    return jsonify({"task_id": task_id, "status": "Task created and pending review"})


@tasks_bp.route('/get-pending-tasks', methods=['GET'])
def get_pending_tasks():
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    pending_task_ids = redis.lrange('pending_tasks', 0, -1)
    pending_tasks = []
    
    for task_id in pending_task_ids:
        task_data = redis.get(f'task:{task_id.decode()}')
        if task_data:
            task = json.loads(task_data)
            if task['agent_id'] == agent_id:
                pending_tasks.append(task)
    
    return jsonify(pending_tasks)


@tasks_bp.route('/get-all-pending-tasks', methods=['GET'])
def get_all_pending_tasks():
    pending_task_ids = redis.lrange('pending_tasks', 0, -1)
    pending_tasks = []
    
    for task_id in pending_task_ids:
        task_data = redis.get(f'task:{task_id.decode()}')
        if task_data:
            task = json.loads(task_data)
            pending_tasks.append(task)
    
    return jsonify(pending_tasks)


@tasks_bp.route('/approve-task', methods=['POST'])
def approve_task():
    data = request.get_json()
    task_id = data.get('task_id')
    
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    task_data = redis.get(f'task:{task_id}')
    if not task_data:
        return jsonify({"error": "Task not found"}), 404
    
    task_data = json.loads(task_data)
    if task_data.get('status') != 'pending':
        return jsonify({"error": "Task is not in pending status"}), 400
    
    task_data['status'] = 'approved'
    task_data['approved_at'] = datetime.now().isoformat()
    redis.set(f'task:{task_id}', json.dumps(task_data))
    target_agent_id = task_data['agent_id']
    redis.lpush(f'task_queue:{target_agent_id}', json.dumps(task_data))
    redis.lrem('pending_tasks', 0, task_id)
    
    return jsonify({"status": "Task approved", "task_id": task_id})


@tasks_bp.route('/reject-task', methods=['POST'])
def reject_task():
    data = request.get_json()
    task_id = data.get('task_id')
    
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
    
    task_data = redis.get(f'task:{task_id}')
    if not task_data:
        return jsonify({"error": "Task not found"}), 404
    
    task_data = json.loads(task_data)
    if task_data.get('status') != 'pending':
        return jsonify({"error": "Task is not in pending status"}), 400
    
    task_data['status'] = 'rejected'
    task_data['rejected_at'] = datetime.now().isoformat()
    redis.set(f'task:{task_id}', json.dumps(task_data))
    redis.lrem('pending_tasks', 0, task_id)
    
    return jsonify({"status": "Task rejected", "task_id": task_id})


@tasks_bp.route('/get-task', methods=['GET'])
def get_task():
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    task_queue_key = f'task_queue:{agent_id}'
    task = redis.rpop(task_queue_key)

    if task:
        task_data = json.loads(task.decode())
        task_id = task_data["task_id"]
        input_text = task_data["input"]
        script_code = task_data["script_code"]
        timestamp = task_data.get("timestamp", "N/A")
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


@tasks_bp.route('/report-result', methods=['POST'])
def report_result():
    data = request.get_json()
    task_id = data.get('task_id')
    input_text = data.get('input')
    command = data.get('command')
    output = data.get('output')
    error = data.get('error')
    
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400

    result_key = f"result:{task_id}"

    output_str = output if output is not None else ""
    error_str = error if error is not None else ""

    try:
        interpretation = interpret_result(input_text, output_str, error_str)

        if interpretation is None:
            interpretation = ""

        redis.hset(result_key, "input", input_text)
        redis.hset(result_key, "command", command)
        redis.hset(result_key, "output", output_str)
        redis.hset(result_key, "error", error_str)
        redis.hset(result_key, "interpretation", interpretation)
        
        task_data = redis.get(f'task:{task_id}')
        if task_data:
            task = json.loads(task_data)
            task['status'] = 'completed'
            task['completed_at'] = datetime.now().isoformat()
            redis.set(f'task:{task_id}', json.dumps(task))

            agent_tasks_key = f'agent_tasks:{task["agent_id"]}'
            redis.lpush(agent_tasks_key, json.dumps(task))

        return jsonify({"status": "Result reported", "task_id": task_id, "interpretation": interpretation})
    except Exception as e:
        logging.error(f"Error in report-result: {e}")
        return jsonify({"error": str(e)}), 500


@tasks_bp.route('/task-status/<task_id>', methods=['GET'])
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

@tasks_bp.route('/get-agent-tasks', methods=['GET'])
def get_agent_tasks():
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    task_queue_key = f'agent_tasks:{agent_id}'
    tasks = redis.lrange(task_queue_key, 0, -1)
    
    task_list = []
    for task in tasks:
        task_data = json.loads(task.decode())
        task_id = task_data["task_id"]
        input_text = task_data["input"]
        script_code = task_data["script_code"]
        submitted_at = task_data.get("submitted_at", "N/A")
        approved_at = task_data.get("approved_at", None)
        rejected_at = task_data.get("rejected_at", None)
        status = task_data.get("status", "pending")

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
            "script_code": script_code,
            "submitted_at": submitted_at,
            "approved_at": approved_at,
            "rejected_at": rejected_at,
            "status": status,
            "output": output,
            "error": error,
            "interpretation": interpretation
        })
    
    return jsonify(task_list)


@tasks_bp.route('/get-all-completed-tasks', methods=['GET'])
def get_all_completed_tasks():
    completed_tasks = []

    # First try to get data from Redis
    task_keys = redis.keys('result:*')
    for key in task_keys:
        task_id = key.decode().split(':')[1]
        task_data = redis.get(f'task:{task_id}')
        if task_data:
            task = json.loads(task_data)
            if task['status'] == 'completed':
                result_data = redis.hgetall(f'result:{task_id}')
                task.update({k.decode(): v.decode() for k, v in result_data.items()})
                completed_tasks.append(task)
    
    # If Redis doesn't have data, fetch from DB
    if not completed_tasks:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM completed_tasks')
        rows = cursor.fetchall()
        for row in rows:
            task = {
                "task_id": row['task_id'],
                "agent_id": row['agent_id'],
                "input": row['input'],
                "script_code": row['script_code'],
                "status": row['status'],
                "submitted_at": row['submitted_at'],
                "approved_at": row['approved_at'],
                "completed_at": row['completed_at'],
                "output": row['output'],
                "error": row['error'],
                "interpretation": row['interpretation']
            }
            completed_tasks.append(task)
        conn.close()

    completed_tasks.sort(key=lambda x: x.get('approved_at', ''), reverse=True)

    return jsonify(completed_tasks)


# Endpoint to summary the tasks
@tasks_bp.route('/get-tasks-summary', methods=['GET'])
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

