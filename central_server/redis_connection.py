from redis import Redis
import config

def get_redis_connection():
    return Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, db=config.REDIS_DB)
