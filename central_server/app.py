from flask import Flask, request, jsonify
from redis_connection import get_redis_connection
from langchain_integration import convert_natural_language_to_script, interpret_result
import json
import uuid
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
redis = get_redis_connection()

@app.route('/submit-task', methods=['POST'])
def submit_task():
    data = request.get_json()
    input_text = data.get('command')
    target_agent_id = data.get('agent_id')
    
    if not input_text or not target_agent_id:
        return jsonify({"error": "Command and Agent ID are required"}), 400
    
    # 에이전트의 환경 정보를 Redis에서 가져옵니다.
    agent_info_key = f"agent_info:{target_agent_id}"
    agent_info = redis.hgetall(agent_info_key)
    os_type = agent_info.get(b'os_type', b'').decode()

    if os_type not in ['linux', 'windows']:
        return jsonify({"error": "Unsupported OS type for the target agent"}), 400
    
    try:
        # Langchain Custom Tool을 사용하여 명령을 OS에 맞는 스크립트로 변환
        script_code = convert_natural_language_to_script(input_text, os_type)
        logging.info(f"Converted Script: {script_code}")
    except Exception as e:
        logging.error(f"Error in converting command: {e}")
        return jsonify({"error": str(e)}), 500
    
    task_id = str(uuid.uuid4())
    task_data = json.dumps({"task_id": task_id, "input": input_text, "command": script_code, "script_code": script_code})
    
    redis.lpush(f'task_queue:{target_agent_id}', task_data)
    redis.lpush(f'agent_tasks:{target_agent_id}', task_data)
    
    return jsonify({"task_id": task_id, "status": "Task submitted"})


@app.route('/register-agent', methods=['POST'])
def register_agent():
    data = request.get_json()
    agent_id = data.get('agent_id')
    os_type = data.get('os_type')
    
    if not agent_id or os_type not in ['linux', 'windows']:
        return jsonify({"error": "Invalid agent ID or OS type"}), 400
    
    agent_info_key = f"agent_info:{agent_id}"
    redis.hset(agent_info_key, mapping={"os_type": os_type})
    
    redis.hset('agents', agent_id, 'active')
    return jsonify({"status": "Agent registered", "agent_id": agent_id, "os_type": os_type})

@app.route('/agent-status', methods=['POST'])
def agent_status():
    data = request.get_json()
    agent_id = data.get('agent_id')
    status = data.get('status')
    
    if not agent_id or not status:
        return jsonify({"error": "No agent_id or status provided"}), 400
    
    redis.hset('agents', agent_id, status)
    return jsonify({"status": "Status updated", "agent_id": agent_id})

@app.route('/get-agents', methods=['GET'])
def get_agents():
    agents = redis.hgetall('agents')
    agent_info = {k.decode(): v.decode() for k, v in agents.items()}
    return jsonify(agent_info)

@app.route('/get-task', methods=['GET'])
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
        command = task_data["command"]
        script_code = task_data["script_code"]
        return jsonify({"task_id": task_id, "input": input_text, "command": command, "script_code": script_code})
    else:
        return jsonify({"error": "No task found for this agent"}), 404

@app.route('/report-result', methods=['POST'])
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

@app.route('/get-agent-tasks', methods=['GET'])
def get_agent_tasks():
    agent_id = request.args.get('agent_id')
    
    if not agent_id:
        return jsonify({"error": "Agent ID is required"}), 400

    task_queue_key = f'agent_tasks:{agent_id}'
    tasks = redis.lrange(task_queue_key, 0, -1)
    
    task_list = [json.loads(task.decode()) for task in tasks]
    return jsonify(task_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)