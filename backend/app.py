from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sock import Sock
from utils.db import init_db
from utils.logo import print_logo
import logging
import os

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
sock = Sock(app)
CORS(app)

db_initialized = False

if not os.path.exists('downloads'):
    os.makedirs('downloads')

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

# Blueprint registrations and other setup
def register_blueprints(app):
    from utils.redis_connection import get_redis_connection
    redis = get_redis_connection()

    from endpoints.auth import auth_bp
    from endpoints.tasks import tasks_bp
    from endpoints.monitoring import monitoring_bp
    from endpoints.pat import pat_bp
    from endpoints.agent import agent_bp
    from endpoints.config import config_bp
    from endpoints.tools import tools_bp, sock
    from endpoints.terminal import terminal_bp, sock

    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(monitoring_bp)
    app.register_blueprint(pat_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(tools_bp)
    app.register_blueprint(terminal_bp)
    sock.init_app(app)

register_blueprints(app)

# Main entry point for the application
if __name__ == '__main__':
    print_logo()
    try:
        init_db()
        logging.info("Database initialized successfully.")
    except Exception as e:
        logging.error(f"Error initializing database: {e}")

    app.run(host='0.0.0.0', port=5001)
