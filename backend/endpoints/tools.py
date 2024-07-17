import os
import uuid
import json
import logging
from flask import Blueprint, request, jsonify, send_file
from app import sock
from werkzeug.utils import secure_filename
from utils.langchain_translator import translate_text_stream_chunked
from utils.parser_file_text import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    extract_text_from_md,
    convert_pdf_to_word,
    convert_word_to_pdf,
    create_translated_word,
    Document
)
from utils.langchain_coder import generate_code_stream_chunked, generate_code_explanation_stream_chunked

UPLOAD_FOLDER = 'uploads'
TRANSLATED_FOLDER = 'translated'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if not os.path.exists(TRANSLATED_FOLDER):
    os.makedirs(TRANSLATED_FOLDER)

tools_bp = Blueprint('tools', __name__)
logging.basicConfig(level=logging.INFO)

@sock.route('/ws/translate')
def translate_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    text = data.get('text')
    target_language = data.get('targetLanguage')
    purpose = data.get('purpose')
    
    if not text or not target_language or not purpose:
        ws.send(json.dumps({"error": "Text, target language, and purpose are required"}))
        return
    
    try:
        for chunk in translate_text_stream_chunked(text, target_language, purpose):
            ws.send(json.dumps({"translated_text": chunk}))
    except Exception as e:
        logging.error(f"Error during translation: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")


@sock.route('/ws/generate-and-explain')
def generate_and_explain_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    description = data.get('description')
    language = data.get('language')

    if not description or not language:
        ws.send(json.dumps({"error": "Description and language are required"}))
        return

    try:
        code = ""
        # Generate code
        for chunk in generate_code_stream_chunked(description, language):
            code += chunk
            ws.send(json.dumps({"type": "code", "content": chunk}))
        
        # Generate explanation
        for chunk in generate_code_explanation_stream_chunked(description, code):
            ws.send(json.dumps({"type": "explanation", "content": chunk}))
    except Exception as e:
        logging.error(f"Error during code generation and explanation: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")

@tools_bp.route('/translate-upload', methods=['POST'])
def translate_upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        try:
            if filename.endswith('.pdf'):
                word_file_path = convert_pdf_to_word(file_path)
                text = extract_text_from_docx(word_file_path)
            elif filename.endswith('.docx'):
                text = extract_text_from_docx(file_path)
            elif filename.endswith('.txt'):
                text = extract_text_from_txt(file_path)
            elif filename.endswith('.md'):
                text = extract_text_from_md(file_path)
            else:
                return jsonify({"error": "Unsupported file type"}), 400

            target_language = request.form.get('targetLanguage')
            purpose = request.form.get('purpose')
            
            if not target_language or not purpose:
                return jsonify({"error": "Target language and purpose are required"}), 400

            translated_chunks = []
            for chunk in translate_text_stream_chunked(text, target_language, purpose):
                translated_chunks.append(chunk)
            
            translated_text = ''.join(translated_chunks)
            translated_paragraphs = translated_text.split('\n')

            if filename.endswith('.pdf'):
                translated_word_path = f"{os.path.splitext(word_file_path)[0]}_translated.docx"
                translated_pdf_path = f"translated_{unique_filename}"
                translated_pdf_full_path = os.path.join(TRANSLATED_FOLDER, translated_pdf_path)
                create_translated_word(word_file_path, translated_paragraphs, translated_word_path)
                convert_word_to_pdf(translated_word_path, translated_pdf_full_path)
                translated_filename = translated_pdf_path
            elif filename.endswith('.docx'):
                doc = Document(file_path)
                for i, para in enumerate(doc.paragraphs):
                    if i < len(translated_paragraphs):
                        para.text = translated_paragraphs[i]
                translated_filename = f"translated_{unique_filename}"
                translated_path = os.path.join(TRANSLATED_FOLDER, translated_filename)
                doc.save(translated_path)
            else:
                translated_filename = f"translated_{unique_filename}"
                translated_path = os.path.join(TRANSLATED_FOLDER, translated_filename)
                with open(translated_path, 'w', encoding='utf-8') as f:
                    f.write(translated_text)

            return jsonify({"message": "File translated successfully", "translated_file": translated_filename}), 200

        except Exception as e:
            logging.error(f"Error during file translation: {e}")
            return jsonify({"error": str(e)}), 500

@tools_bp.route('/translate-download/<filename>', methods=['GET'])
def translate_download(filename):
    try:
        return send_file(os.path.join(TRANSLATED_FOLDER, filename), as_attachment=True)
    except Exception as e:
        logging.error(f"Error during file download: {e}")
        return jsonify({"error": str(e)}), 500
