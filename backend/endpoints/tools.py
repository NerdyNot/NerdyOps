import os
from flask import Blueprint, request, jsonify
from utils.langchain_translator import translate_text
import logging

tools_bp = Blueprint('tools', __name__)
logging.basicConfig(level=logging.INFO)

@tools_bp.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text')
    target_language = data.get('targetLanguage')
    purpose = data.get('purpose')
    
    # Validate input
    if not text or not target_language or not purpose:
        return jsonify({"error": "Text, target language, and purpose are required"}), 400
    
    try:
        translated_text = translate_text(text, target_language, purpose)
        return jsonify({"translated_text": translated_text})
    except Exception as e:
        logging.error(f"Error during translation: {e}")
        return jsonify({"error": str(e)}), 500
