import requests
import json
import logging
import threading
from time import sleep
from utils.redis_connection import get_redis_connection
from utils.db import get_db_connection, get_api_key

logging.basicConfig(level=logging.INFO)

def send_slack_notification(webhook_url, message):
    headers = {
        'Content-Type': 'application/json'
    }
    payload = {
        'text': message
    }
    response = requests.post(webhook_url, headers=headers, data=json.dumps(payload))

    if response.status_code != 200:
        raise ValueError(f'Request to Slack returned an error {response.status_code}, the response is:\n{response.text}')

def save_slack_service_hook(db_conn, webhook_url):
    cursor = db_conn.cursor()
    cursor.execute('''
        INSERT INTO api_keys (key_name, key_value)
        VALUES (?, ?)
        ON CONFLICT(key_name)
        DO UPDATE SET key_value = excluded.key_value
    ''', ('slack_webhook_url', webhook_url))
    db_conn.commit()

def get_slack_service_hook():
    return get_api_key('slack_webhook_url')

def get_notification_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT config_key, config_value FROM config WHERE config_key LIKE "slack_%"')
    rows = cursor.fetchall()
    conn.close()
    return {row['config_key']: row['config_value'] == 'true' for row in rows}

def process_redis_notifications():
    redis_conn = get_redis_connection()
    while True:
        notification = redis_conn.rpop('slack_notifications')
        if notification:
            try:
                notification_data = json.loads(notification)
                webhook_url = get_slack_service_hook()
                settings = get_notification_settings()
                notification_type = notification_data['type']

                if webhook_url and settings.get('slack_notifications_enabled', True):
                    if settings.get(notification_type, settings.get('slack_notifications_enabled', False)):
                        send_slack_notification(webhook_url, notification_data['message'])
                        logging.info(f"Notification sent: {notification_data['message']}")
                    else:
                        logging.info(f"Notification type {notification_type} is disabled. Removing from queue.")
                else:
                    logging.info("Slack notifications are disabled.")
            except Exception as e:
                logging.error(f"Failed to process notification: {e}")
        sleep(10)  # Check for new notifications every 10 seconds

def start_notification_thread():
    notification_thread = threading.Thread(target=process_redis_notifications)
    notification_thread.daemon = True
    notification_thread.start()