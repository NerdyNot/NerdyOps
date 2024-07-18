import logging
import json
from flask import Blueprint
from app import sock
from utils.langchain_ragchat import handle_chat_websocket

tools_ragchat_bp = Blueprint('tools_ragchat', __name__)
logging.basicConfig(level=logging.INFO)

def handle_non_rag_chat(ws, query):
    # 여기에 RAG 비활성화 시 사용할 별도 로직을 작성하세요.
    response = {
        "output": f"Non-RAG response to query: {query}"
    }
    ws.send(json.dumps(response))

@sock.route('/ws/chat')
def chat_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    query = data.get('message')
    is_rag_enabled = data.get('isRagEnabled', False)  # RAG 상태 확인

    if not query:
        ws.send(json.dumps({"error": "Query is required"}))
        return

    try:
        if is_rag_enabled:
            handle_chat_websocket(ws, query)
        else:
            handle_non_rag_chat(ws, query)
    except Exception as e:
        logging.error(f"Error during chat processing: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")
