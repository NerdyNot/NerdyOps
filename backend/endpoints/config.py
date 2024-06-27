from flask import Blueprint, request, jsonify
from utils.db import get_db_connection, init_db

config_bp = Blueprint('config_bp', __name__)

@config_bp.route('/set-api-key', methods=['POST'])
def set_api_key():
    data = request.json
    api_key = data.get('apiKey')

    if not api_key:
        return jsonify({"message": "API key is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO api_keys (key_name, key_value)
        VALUES (?, ?)
        ON CONFLICT(key_name)
        DO UPDATE SET key_value = excluded.key_value
    ''', ('openai_api_key', api_key))

    conn.commit()
    conn.close()

    return jsonify({"message": "API key saved successfully!"}), 200

@config_bp.route('/get-api-key', methods=['GET'])
def get_api_key():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT key_value FROM api_keys WHERE key_name = ?', ('openai_api_key',))
    row = cursor.fetchone()

    conn.close()

    if row:
        # Mask the API key
        masked_key = row['key_value'][:4] + '****' + row['key_value'][-4:]
        return jsonify({"apiKey": masked_key}), 200
    else:
        return jsonify({"message": "API key not found"}), 404