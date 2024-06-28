# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.db import init_db
from utils.logo import print_logo
from utils.slack_integration import start_notification_thread
import logging

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

db_initialized = False

@app.before_request
def initialize_database():
    global db_initialized
    if not db_initialized:
        try:
            init_db()
            db_initialized = True
            logging.info("Database initialized successfully.")
        except Exception as e:
            logging.error(f"Error initializing database: {e}")

@app.route('/health', methods=['GET'])
def ping():
    return jsonify({"status": "ok"}), 200

# Main entry point for the application
if __name__ == '__main__':
    print_logo()
    try:
        init_db()
        logging.info("Database initialized successfully.")
    except Exception as e:
        logging.error(f"Error initializing database: {e}")

    from utils.redis_connection import get_redis_connection
    redis = get_redis_connection()

    from endpoints.auth import auth_bp
    from endpoints.tasks import tasks_bp, start_sync_thread
    from endpoints.monitoring import monitoring_bp
    from endpoints.pat import pat_bp
    from endpoints.agent import agent_bp, schedule_agent_status_check
    from endpoints.config import config_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(monitoring_bp)
    app.register_blueprint(pat_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(config_bp)
    
    schedule_agent_status_check()
    start_sync_thread()
    start_notification_thread()
    app.run(host='0.0.0.0', port=5001)
