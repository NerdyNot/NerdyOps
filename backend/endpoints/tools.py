import os
from flask import Blueprint, request, jsonify
from flask_sock import Sock
from utils.langchain_translator import translate_text_stream
import logging

tools_bp = Blueprint('tools', __name__)
sock = Sock()
logging.basicConfig(level=logging.INFO)

@sock.route('/ws/translate')
def translate_socket(ws):
    data = ws.receive()
    data = json.loads(data)
    text = data.get('text')
    target_language = data.get('target_language')
    purpose = data.get('purpose')
    
    # Validate input
    if not text or not target_language or not purpose:
        ws.send(json.dumps({"error": "Text, target language, and purpose are required"}))
        return
    
    try:
        for chunk in translate_text_stream(text, target_language, purpose):
            ws.send(json.dumps({"translated_text": chunk}))
    except Exception as e:
        logging.error(f"Error during translation: {e}")
        ws.send(json.dumps({"error": str(e)}))
