from flask import Blueprint, request, jsonify, json
from utils.db import get_db_connection, init_db, DB_TYPE
from utils.slack_integration import save_slack_service_hook

config_bp = Blueprint('config_bp', __name__)

@config_bp.route('/get-all-api-keys', methods=['GET'])
def get_all_api_keys():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT key_name, key_value FROM api_keys'
    cursor.execute(query)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    api_keys = [{'key_name': row['key_name'], 'key_value': row['key_value']} for row in rows]

    return jsonify({"apiKeys": api_keys}), 200

@config_bp.route('/set-all-api-keys', methods=['POST'])
def set_all_api_keys():
    data = request.json
    api_keys = data.get('apiKeys')

    if not api_keys:
        return jsonify({"message": "API keys are required"}), 400

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
    for api_key in api_keys:
        cursor.execute(query, (api_key['key_name'], api_key['key_value']))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "API keys saved successfully!"}), 200


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

@config_bp.route('/set-llm-config', methods=['POST'])
def set_llm_config():
    data = request.json
    provider = data.get('provider')
    api_key = data.get('apiKey')
    model = data.get('model')
    temperature = data.get('temperature')
    azure_api_version = data.get('azureApiVersion')
    azure_endpoint = data.get('azureEndpoint')
    azure_api_key = data.get('azureApiKey')

    if not provider or not api_key:
        return jsonify({"message": "Provider and API key are required"}), 400

    llm_config = {
        'provider': provider,
        'api_key': api_key,
        'model': model,
        'temperature': temperature,
        'azure': {
            'api_version': azure_api_version,
            'endpoint': azure_endpoint,
            'api_key': azure_api_key
        } if provider == 'azure' else None
    }

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
    cursor.execute(query, ('llm', json.dumps(llm_config)))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "LLM configuration saved successfully!"}), 200

@config_bp.route('/get-llm-config', methods=['GET'])
def get_llm_config():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT key_value FROM api_keys WHERE key_name = %s' if DB_TYPE == 'mysql' else 'SELECT key_value FROM api_keys WHERE key_name = ?'
    cursor.execute(query, ('llm',))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row:
        return jsonify({"llmConfig": json.loads(row['key_value'])}), 200
    else:
        return jsonify({"message": "LLM configuration not found"}), 404

# Embedding configuration endpoints
@config_bp.route('/set-embedding-config', methods=['POST'])
def set_embedding_config():
    data = request.json
    provider = data.get('provider')
    api_key = data.get('apiKey')
    model = data.get('model')
    azure_api_version = data.get('azureApiVersion')
    azure_endpoint = data.get('azureEndpoint')
    azure_api_key = data.get('azureApiKey')

    if not provider or not api_key:
        return jsonify({"message": "Provider and API key are required"}), 400

    embedding_config = {
        'provider': provider,
        'api_key': api_key,
        'model': model,
        'azure': {
            'api_version': azure_api_version,
            'endpoint': azure_endpoint,
            'api_key': azure_api_key
        } if provider == 'azure' else None
    }

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
    cursor.execute(query, ('embedding', json.dumps(embedding_config)))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Embedding configuration saved successfully!"}), 200

@config_bp.route('/get-embedding-config', methods=['GET'])
def get_embedding_config():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT key_value FROM api_keys WHERE key_name = %s' if DB_TYPE == 'mysql' else 'SELECT key_value FROM api_keys WHERE key_name = ?'
    cursor.execute(query, ('embedding',))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row:
        return jsonify({"embeddingConfig": json.loads(row['key_value'])}), 200
    else:
        return jsonify({"message": "Embedding configuration not found"}), 404
