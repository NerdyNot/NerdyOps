from redis import Redis
from utils.db import get_db_connection

# Get Redis configuration from the database
def get_redis_config_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT config_key, config_value FROM config WHERE config_key IN ("redis_host", "redis_port", "redis_password")')
    rows = cursor.fetchall()
    conn.close()
    config = {row['config_key']: row['config_value'] for row in rows}
    return config

# Get a Redis connection using settings from the database
def get_redis_connection():
    redis_config = get_redis_config_from_db()
    return Redis(
        host=redis_config.get('redis_host', 'localhost'),
        port=int(redis_config.get('redis_port', 6379)),
        password=redis_config.get('redis_password', None),
        db=0
    )
