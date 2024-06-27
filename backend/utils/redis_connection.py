from redis import Redis
import utils.config as config

# Get a Redis connection using settings from the configuration file
def get_redis_connection():
    return Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, db=config.REDIS_DB)
