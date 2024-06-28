from flask import Blueprint, request, jsonify
from utils.db import get_db_connection, init_db
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
    cursor.execute('SELECT key_value FROM api_keys WHERE key_name = ?', ('slack_webhook_url',))
    row = cursor.fetchone()
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

    for key, value in settings.items():
        cursor.execute('''
            INSERT INTO config (config_key, config_value)
            VALUES (?, ?)
            ON CONFLICT(config_key)
            DO UPDATE SET config_value = excluded.config_value
        ''', (key, value))

    conn.commit()
    conn.close()

    return jsonify({"message": "Slack notification settings saved successfully!"}), 200

@config_bp.route('/get-slack-notification-settings', methods=['GET'])
def get_slack_notification_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT config_key, config_value FROM config WHERE config_key LIKE "slack_%"')
    rows = cursor.fetchall()
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

    cursor.execute('''
        INSERT INTO config (config_key, config_value)
        VALUES (?, ?)
        ON CONFLICT(config_key)
        DO UPDATE SET config_value = excluded.config_value
    ''', ('redis_host', redis_host))
    
    cursor.execute('''
        INSERT INTO config (config_key, config_value)
        VALUES (?, ?)
        ON CONFLICT(config_key)
        DO UPDATE SET config_value = excluded.config_value
    ''', ('redis_port', str(redis_port)))

    if redis_password:
        cursor.execute('''
            INSERT INTO config (config_key, config_value)
            VALUES (?, ?)
            ON CONFLICT(config_key)
            DO UPDATE SET config_value = excluded.config_value
        ''', ('redis_password', redis_password))

    conn.commit()
    conn.close()

    return jsonify({"message": "Redis configuration saved successfully!"}), 200

@config_bp.route('/get-redis-config', methods=['GET'])
def get_redis_config():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT config_key, config_value FROM config WHERE config_key IN ("redis_host", "redis_port", "redis_password")')
    rows = cursor.fetchall()
    conn.close()

    config = {row['config_key']: row['config_value'] for row in rows}
    return jsonify(config), 200
