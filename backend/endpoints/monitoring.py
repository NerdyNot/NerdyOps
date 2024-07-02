from flask import Blueprint, request, jsonify
from utils.redis_connection import get_redis_connection
from utils.db import get_db_connection, DB_TYPE
from utils.langchain_integration import convert_natural_language_to_script, execute_script_and_get_result
import json
import logging

monitoring_bp = Blueprint('monitoring', __name__)
redis = get_redis_connection()

def add_notification_to_queue(message):
    redis_conn = get_redis_connection()
    redis_conn.lpush('slack_notifications', json.dumps({'message': message}))

def verify_pat(jwt_token: str) -> bool:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT token FROM user_pats WHERE token = %s" if DB_TYPE == 'mysql' else "SELECT token FROM user_pats WHERE token = ?"
        cursor.execute(query, (jwt_token,))
        row = cursor.fetchone()
    finally:
        conn.close()

    return bool(row)

@monitoring_bp.route('/report-resource-usage', methods=['POST'])
def report_resource_usage():
    data = request.get_json()
    agent_id = data.get('agent_id')
    cpu_usage = data.get('cpu_usage')
    mem_usage = data.get('mem_usage')
    running_time = data.get('running_time')
    timestamp = data.get('timestamp')
    imds = data.get('imds')

    if not agent_id or cpu_usage is None or mem_usage is None or running_time is None or timestamp is None:
        return jsonify({"error": "Missing required fields"}), 400

    resource_data = {
        "cpu_usage": cpu_usage,
        "mem_usage": mem_usage,
        "running_time": running_time,
        "timestamp": timestamp,
        "imds": imds  # Include IMDS data
    }

    redis.rpush(f'resource_usage:{agent_id}', json.dumps(resource_data))

    return jsonify({"status": "Resource usage reported successfully"})

@monitoring_bp.route('/get-resource-usage', methods=['GET'])
def get_resource_usage():
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    resource_data_list = redis.lrange(f'resource_usage:{agent_id}', 0, -1)
    
    if not resource_data_list:
        return jsonify({"error": "No data found for this agent"}), 404

    resource_data = [json.loads(data) for data in resource_data_list]
    return jsonify(resource_data)

@monitoring_bp.route('/add-slack-notification', methods=['POST'])
def add_slack_notification():
    data = request.get_json()
    message = data.get('message')
    notification_type = data.get('type')

    if not message or not notification_type:
        return jsonify({"message": "Message and type are required"}), 400

    # Add notification to Redis queue
    redis_conn = get_redis_connection()
    redis_conn.lpush('slack_notifications', json.dumps({'message': message, 'type': notification_type}))

    return jsonify({"message": "Notification added to queue"}), 200

@monitoring_bp.route('/set-monitoring-settings', methods=['POST'])
def set_monitoring_settings():
    data = request.get_json()
    agent_id = data.get('agent_id')
    check_schedule = data.get('check_schedule', False)
    check_ping = data.get('check_ping', "")
    running_process = data.get('running_process', "")
    listen_port = data.get('listen_port', "")

    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        INSERT INTO agent_monitoring_settings (agent_id, check_schedule, check_ping, running_process, listen_port)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE check_schedule = VALUES(check_schedule),
                                check_ping = VALUES(check_ping),
                                running_process = VALUES(running_process),
                                listen_port = VALUES(listen_port)
    ''' if DB_TYPE == 'mysql' else '''
        INSERT INTO agent_monitoring_settings (agent_id, check_schedule, check_ping, running_process, listen_port)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(agent_id)
        DO UPDATE SET check_schedule = excluded.check_schedule,
                      check_ping = excluded.check_ping,
                      running_process = excluded.running_process,
                      listen_port = excluded.listen_port
    '''
    cursor.execute(query, (agent_id, check_schedule, check_ping, running_process, listen_port))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Monitoring settings saved successfully"})

@monitoring_bp.route('/get-monitoring-settings', methods=['GET'])
def get_monitoring_settings():
    agent_id = request.args.get('agent_id')

    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT check_schedule, check_ping, running_process, listen_port FROM agent_monitoring_settings WHERE agent_id = %s' if DB_TYPE == 'mysql' else 'SELECT check_schedule, check_ping, running_process, listen_port FROM agent_monitoring_settings WHERE agent_id = ?'
    cursor.execute(query, (agent_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row:
        settings = {
            "check_schedule": row['check_schedule'],
            "check_ping": row['check_ping'],
            "running_process": row['running_process'],
            "listen_port": row['listen_port']
        }
        return jsonify(settings)
    else:
        return jsonify({"error": "Settings not found for this agent"}), 404

@monitoring_bp.route('/process-monitoring-message', methods=['POST'])
def process_monitoring_message():
    data = request.get_json()
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message is required"}), 400

    try:
        result = handle_monitoring_notification(message)
        return jsonify({"result": result})
    except Exception as e:
        logging.error(f"Error processing monitoring message: {e}")
        return jsonify({"error": str(e)}), 500


@monitoring_bp.route('/handle-monitoring-notification', methods=['POST'])
def handle_monitoring_notification():
    auth_header = request.headers.get('Authorization', None)
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    pat_token = auth_header.split(' ')[1]
    if not verify_pat(pat_token):
        return jsonify({"error": "Invalid PAT"}), 401

    data = request.get_json()
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Find agent_id based on the message
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT agent_id, os_type FROM agents WHERE INSTR(%s, computer_name) > 0 OR INSTR(%s, private_ip) > 0' if DB_TYPE == 'mysql' else 'SELECT agent_id, os_type FROM agents WHERE INSTR(?, computer_name) > 0 OR INSTR(?, private_ip) > 0'
    cursor.execute(query, (message, message))
    agent_info = cursor.fetchone()

    cursor.close()
    conn.close()

    if not agent_info:
        return jsonify({"error": "Agent not found based on the provided message"}), 404

    agent_id = agent_info['agent_id']
    os_type = agent_info['os_type']

    # Generate script based on the message
    try:
        script_code = convert_natural_language_to_script(message, os_type)
        logging.info(f"Generated Script: {script_code}")
    except Exception as e:
        logging.error(f"Error in converting message to script: {e}")
        return jsonify({"error": str(e)}), 500

    # Execute the script and get the result
    result = execute_script_and_get_result(agent_id, script_code)
    return jsonify({"agent_id": agent_id, "result": result})