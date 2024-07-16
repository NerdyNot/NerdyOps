import os
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

# Get Redis configuration from the environment variable or the database
def get_redis_connection():
    redis_url = os.getenv('REDIS_URL')
    
    if redis_url:
        return Redis.from_url(redis_url), redis_url
    else:
        # Fall back to database configuration if environment variables are not set
        redis_config = get_redis_config_from_db()
        redis_host = redis_config.get('redis_host', 'localhost')
        redis_port = int(redis_config.get('redis_port', 6379))
        redis_password = redis_config.get('redis_password', None)
        redis_conn = Redis(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            db=0
        )
        redis_url = f'redis://:{redis_password}@{redis_host}:{redis_port}/0' if redis_password else f'redis://{redis_host}:{redis_port}/0'
        return redis_conn, redis_url