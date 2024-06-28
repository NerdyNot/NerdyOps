from flask import Blueprint, request, jsonify
from utils.db import get_db_connection, init_db, DB_TYPE
from utils.slack_integration import save_slack_service_hook

config_bp = Blueprint('config_bp', __name__)

@config_bp.route('/set-api-key', methods=['POST'])
def set_api_key():
    data = request.json
    api_key = data.get('apiKey')

    if not api_key:
        return jsonify({"message": "API key is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        INSERT INTO api_keys (key_name, key_value)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)
    ''' if DB_TYPE == 'mysql' else '''
        INSERT INTO api_keys (key_name, key_value)
        VALUES (?, ?)
        ON CONFLICT(key_name)
        DO UPDATE SET key_value = excluded.key_value
    '''
    cursor.execute(query, ('openai_api_key', api_key))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "API key saved successfully!"}), 200

@config_bp.route('/get-api-key', methods=['GET'])
def get_api_key():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT key_value FROM api_keys WHERE key_name = %s' if DB_TYPE == 'mysql' else 'SELECT key_value FROM api_keys WHERE key_name = ?'
    cursor.execute(query, ('openai_api_key',))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row:
        # Mask the API key
        masked_key = row['key_value'][:4] + '****' + row['key_value'][-4:]
        return jsonify({"apiKey": masked_key}), 200
    else:
        return jsonify({"message": "API key not found"}), 404

@config_bp.route('/set-slack-webhook', methods=['POST'])
def set_slack_webhook():
    data = request.json
    webhook_url = data.get('webhookUrl')

    if not webhook_url:
        return jsonify({"message": "Webhook URL is required"}), 400

    conn = get_db_connection()
    save_slack_service_hook(conn, webhook_url)
    conn.close()

    return jsonify({"message": "Slack webhook URL saved successfully!"}), 200

@config_bp.route('/get-slack-webhook', methods=['GET'])
def get_slack_webhook():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT key_value FROM api_keys WHERE key_name = %s' if DB_TYPE == 'mysql' else 'SELECT key_value FROM api_keys WHERE key_name = ?'
    cursor.execute(query, ('slack_webhook_url',))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row:
        return jsonify({"webhookUrl": row['key_value']}), 200
    else:
        return jsonify({"message": "Slack webhook URL not found"}), 404

@config_bp.route('/set-slack-notification-settings', methods=['POST'])
def set_slack_notification_settings():
    data = request.json
    settings = {
        'slack_notifications_enabled': 'true' if data.get('notificationsEnabled', False) else 'false',
        'slack_task_created': 'true' if data.get('taskCreated', False) else 'false',
        'slack_task_approved': 'true' if data.get('taskApproved', False) else 'false',
        'slack_task_rejected': 'true' if data.get('taskRejected', False) else 'false'
    }

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        INSERT INTO config (config_key, config_value)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
    ''' if DB_TYPE == 'mysql' else '''
        INSERT INTO config (config_key, config_value)
        VALUES (?, ?)
        ON CONFLICT(config_key)
        DO UPDATE SET config_value = excluded.config_value
    '''
    for key, value in settings.items():
        cursor.execute(query, (key, value))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Slack notification settings saved successfully!"}), 200

@config_bp.route('/get-slack-notification-settings', methods=['GET'])
def get_slack_notification_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT config_key, config_value FROM config WHERE config_key LIKE %s' if DB_TYPE == 'mysql' else 'SELECT config_key, config_value FROM config WHERE config_key LIKE ?'
    cursor.execute(query, ('slack_%',))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    settings = {row['config_key']: row['config_value'] == 'true' for row in rows}
    return jsonify(settings), 200

# Redis configuration endpoints
@config_bp.route('/set-redis-config', methods=['POST'])
def set_redis_config():
    data = request.json
    redis_host = data.get('redis_host')
    redis_port = data.get('redis_port')
    redis_password = data.get('redis_password')

    if not redis_host or not redis_port:
        return jsonify({"message": "Redis host and port are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
        INSERT INTO config (config_key, config_value)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
    ''' if DB_TYPE == 'mysql' else '''
        INSERT INTO config (config_key, config_value)
        VALUES (?, ?)
        ON CONFLICT(config_key)
        DO UPDATE SET config_value = excluded.config_value
    '''
    cursor.execute(query, ('redis_host', redis_host))
    cursor.execute(query, ('redis_port', str(redis_port)))

    if redis_password:
        cursor.execute(query, ('redis_password', redis_password))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Redis configuration saved successfully!"}), 200

@config_bp.route('/get-redis-config', methods=['GET'])
def get_redis_config():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT config_key, config_value FROM config WHERE config_key IN (%s, %s, %s)' if DB_TYPE == 'mysql' else 'SELECT config_key, config_value FROM config WHERE config_key IN (?, ?, ?)'
    cursor.execute(query, ('redis_host', 'redis_port', 'redis_password'))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    config = {row['config_key']: row['config_value'] for row in rows}
    return jsonify(config), 200
