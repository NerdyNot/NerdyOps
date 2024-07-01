import schedule
import threading
import time
import logging
from utils.db import get_db_connection, DB_TYPE
from utils.redis_connection import get_redis_connection
from datetime import datetime, timedelta
from utils.slack_integration import process_redis_notifications
import json

redis = get_redis_connection()

logging.basicConfig(level=logging.INFO)

def check_agent_status():
    logging.info("Checking agent statuses...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT agent_id, last_update_date, status FROM agents')
    agents = cursor.fetchall()
    
    for agent in agents:
        last_update_date = datetime.fromisoformat(agent['last_update_date'])
        time_diff = datetime.utcnow() - last_update_date
        if time_diff > timedelta(minutes=1) and agent['status'] != 'down':
            query = 'UPDATE agents SET status = %s WHERE agent_id = %s' if DB_TYPE == 'mysql' else 'UPDATE agents SET status = ? WHERE agent_id = ?'
            cursor.execute(query, ('down', agent['agent_id']))
            logging.info(f"Agent {agent['agent_id']} marked as down")
    
    conn.commit()
    cursor.close()
    conn.close()

def sync_redis_and_db():
    logging.info("Syncing Redis and DB...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # Sync from Redis to DB
    task_keys = redis.keys('result:*')
    for key in task_keys:
        task_id = key.decode().split(':')[1]
        task_data = redis.get(f'task:{task_id}')
        if task_data:
            task = json.loads(task_data)
            if task['status'] == 'completed':
                result_data = redis.hgetall(f'result:{task_id}')
                task.update({k.decode(): v.decode() for k, v in result_data.items()})
                if DB_TYPE == 'mysql':
                    query = '''
                        INSERT INTO completed_tasks (task_id, agent_id, input, script_code, status, submitted_at, approved_at, completed_at, output, error, interpretation, submitted_by, approved_by, rejected_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                        agent_id=VALUES(agent_id),
                        input=VALUES(input),
                        script_code=VALUES(script_code),
                        status=VALUES(status),
                        submitted_at=VALUES(submitted_at),
                        approved_at=VALUES(approved_at),
                        completed_at=VALUES(completed_at),
                        output=VALUES(output),
                        error=VALUES(error),
                        interpretation=VALUES(interpretation),
                        submitted_by=VALUES(submitted_by),
                        approved_by=VALUES(approved_by),
                        rejected_by=VALUES(rejected_by)
                    '''
                else:  # sqlite
                    query = '''
                        INSERT OR REPLACE INTO completed_tasks (task_id, agent_id, input, script_code, status, submitted_at, approved_at, completed_at, output, error, interpretation, submitted_by, approved_by, rejected_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    '''
                cursor.execute(query, (
                    task['task_id'], task['agent_id'], task['input'], task['script_code'], task['status'],
                    task.get('submitted_at'), task.get('approved_at'), task.get('completed_at'),
                    task.get('output'), task.get('error'), task.get('interpretation'),
                    task.get('submitted_by'), task.get('approved_by'), task.get('rejected_by')
                ))

    # Sync from DB to Redis
    cursor.execute('SELECT * FROM completed_tasks')
    rows = cursor.fetchall()
    for row in rows:
        task_id = row['task_id']
        task_data = {
            "task_id": row['task_id'],
            "agent_id": row['agent_id'],
            "input": row['input'],
            "script_code": row['script_code'],
            "status": row['status'],
            "submitted_at": row['submitted_at'].isoformat() if row['submitted_at'] else None,
            "approved_at": row['approved_at'].isoformat() if row['approved_at'] else None,
            "completed_at": row['completed_at'].isoformat() if row['completed_at'] else None,
            "output": row['output'],
            "error": row['error'],
            "interpretation": row['interpretation'],
            "submitted_by": row['submitted_by'],
            "approved_by": row['approved_by'],
            "rejected_by": row['rejected_by']
        }
        redis.set(f'task:{task_id}', json.dumps(task_data))
        redis.hset(f'result:{task_id}', "output", row['output'])
        redis.hset(f'result:{task_id}', "error", row['error'])
        redis.hset(f'result:{task_id}', "interpretation", row['interpretation'])

    conn.commit()
    conn.close()

def sync_redis_to_db_background():
    while True:
        sync_redis_and_db()
        time.sleep(60)  # Perform sync every 1 minute

def schedule_agent_status_check():
    schedule.every(1).minute.do(check_agent_status)

    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()

def start_notification_thread():
    notification_thread = threading.Thread(target=process_redis_notifications)
    notification_thread.daemon = True
    notification_thread.start()

def start_sync_thread():
    sync_thread = threading.Thread(target=sync_redis_to_db_background)
    sync_thread.daemon = True
    sync_thread.start()

if __name__ == "__main__":
    schedule_agent_status_check()
    start_notification_thread()
    start_sync_thread()
    
    # Keep the main thread alive to allow daemon threads to run
    while True:
        time.sleep(1)
