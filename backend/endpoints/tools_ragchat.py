import logging
import json
from flask import Blueprint
from app import sock
from utils.langchain_ragchat import handle_rag_chat, handle_non_rag_chat

tools_ragchat_bp = Blueprint('tools_ragchat', __name__)
logging.basicConfig(level=logging.INFO)

@sock.route('/ws/chat')
def chat_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    query = data.get('message')
    session_id = data.get('session_id')  # Check for session ID
    is_rag_enabled = data.get('isRagEnabled', False)  # Check RAG status

    if not query:
        ws.send(json.dumps({"error": "Query is required"}))
        return

    if not session_id:
        ws.send(json.dumps({"error": "Session ID is required"}))
        return

    try:
        if is_rag_enabled:
            handle_rag_chat(ws, query, session_id)
        else:
            handle_non_rag_chat(ws, query, session_id)
    except Exception as e:
        logging.error(f"Error during chat processing: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")
