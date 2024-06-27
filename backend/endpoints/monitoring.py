from flask import Blueprint, request, jsonify
from utils.redis_connection import get_redis_connection
import json
import time

monitoring_bp = Blueprint('monitoring', __name__)
redis = get_redis_connection()

@monitoring_bp.route('/report-resource-usage', methods=['POST'])
def report_resource_usage():
    data = request.get_json()
    agent_id = data.get('agent_id')
    cpu_usage = data.get('cpu_usage')
    mem_usage = data.get('mem_usage')
    running_time = data.get('running_time')
    timestamp = data.get('timestamp')

    if not agent_id or cpu_usage is None or mem_usage is None or running_time is None or timestamp is None:
        return jsonify({"error": "Missing required fields"}), 400

    resource_data = {
        "cpu_usage": cpu_usage,
        "mem_usage": mem_usage,
        "running_time": running_time,
        "timestamp": timestamp
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