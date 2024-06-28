import requests
import json
import logging
import threading
from time import sleep
from utils.redis_connection import get_redis_connection
from utils.db import get_db_connection

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
        INSERT INTO config (config_key, config_value)
        VALUES (?, ?)
        ON CONFLICT(config_key)
        DO UPDATE SET config_value = excluded.config_value
    ''', ('slack_webhook_url', webhook_url))
    db_conn.commit()

def get_slack_service_hook(db_conn):
    cursor = db_conn.cursor()
    cursor.execute('SELECT config_value FROM config WHERE config_key = ?', ('slack_webhook_url',))
    row = cursor.fetchone()
    if row:
        return row['config_value']
    return None

def process_redis_notifications():
    redis_conn = get_redis_connection()
    while True:
        notification = redis_conn.rpop('slack_notifications')
        if notification:
            try:
                notification_data = json.loads(notification)
                db_conn = get_db_connection()
                webhook_url = get_slack_service_hook(db_conn)
                db_conn.close()
                if webhook_url:
                    send_slack_notification(webhook_url, notification_data['message'])
                    logging.info(f"Notification sent: {notification_data['message']}")
                else:
                    logging.error("Slack webhook URL not found.")
            except Exception as e:
                logging.error(f"Failed to process notification: {e}")
        sleep(10)  # Check for new notifications every 10 seconds

def start_notification_thread():
    notification_thread = threading.Thread(target=process_redis_notifications)
    notification_thread.daemon = True
    notification_thread.start()
