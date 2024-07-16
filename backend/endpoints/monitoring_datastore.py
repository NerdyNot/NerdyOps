from flask import Blueprint, request, jsonify
from utils.datastore_integration import query_influxdb, query_prometheus
from utils.db import get_datastore

monitoring_datastore_bp = Blueprint('monitoring_datastore', __name__)

@monitoring_datastore_bp.route('/get-query-result', methods=['POST'])
def get_query_result():
    data = request.get_json()
    query = data.get('query')
    datastore_name = data.get('datastore')

    if not query:
        return jsonify({"error": "Query is required"}), 400
    if not datastore_name:
        return jsonify({"error": "Datastore name is required"}), 400

    datastore = get_datastore(datastore_name)
    if not datastore:
        return jsonify({"error": "Invalid datastore"}), 400

    if datastore['type'] == 'influxdb':
        result = query_influxdb(query, datastore)
        if not result:
            return jsonify({"error": "No data found"}), 404
        data = [point for point in result.get_points()]
    elif datastore['type'] == 'prometheus':
        result = query_prometheus(query, datastore)
        if not result:
            return jsonify({"error": "No data found"}), 404
        data = result
    else:
        return jsonify({"error": "Unsupported datastore type"}), 400

    return jsonify(data)
