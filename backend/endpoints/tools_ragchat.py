import logging
import json
import asyncio
from flask import Blueprint
from app import sock
from utils.langchain_ragchat import handle_chat_websocket

tools_ragchat_bp = Blueprint('tools_ragchat', __name__)
logging.basicConfig(level=logging.INFO)

@sock.route('/ws/chat')
def chat_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    query = data.get('message')

    if not query:
        ws.send(json.dumps({"error": "Query is required"}))
        return

    try:
        handle_chat_websocket(ws, query)
    except Exception as e:
        logging.error(f"Error during chat processing: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")