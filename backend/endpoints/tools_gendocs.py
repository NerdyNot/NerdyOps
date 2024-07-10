import os
import uuid
import json
import logging
from flask import Blueprint, request, jsonify, send_file
from flask_sock import Sock
from utils.langchain_gendocs import generate_markdown_guide

logging.basicConfig(level=logging.INFO)

gendocs_bp = Blueprint('gendocs', __name__)
sock = Sock()

@sock.route('/ws/generate-docs')
def generate_docs_socket(ws):
    logging.info("WebSocket connection opened.")
    data = ws.receive()

    data = json.loads(data)
    query = data.get('query')

    if not query:
        ws.send(json.dumps({"error": "Query is required"}))
        return

    try:
        markdown_guide = generate_markdown_guide(query)
        ws.send(json.dumps({"type": "markdown", "content": markdown_guide}))
    except Exception as e:
        logging.error(f"Error during document generation: {e}")
        ws.send(json.dumps({"error": str(e)}))
    finally:
        logging.info("WebSocket connection closed.")

@gendocs_bp.route('/generate-docs', methods=['POST'])
def generate_docs():
    data = request.json
    query = data.get('query')

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        markdown_guide = generate_markdown_guide(query)
        unique_filename = f"{uuid.uuid4()}.md"
        file_path = os.path.join('generated_docs', unique_filename)

        if not os.path.exists('generated_docs'):
            os.makedirs('generated_docs')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown_guide)

        return jsonify({"message": "Document generated successfully", "file": unique_filename}), 200

    except Exception as e:
        logging.error(f"Error during document generation: {e}")
        return jsonify({"error": str(e)}), 500

@gendocs_bp.route('/download/<filename>', methods=['GET'])
def download(filename):
    try:
        return send_file(os.path.join('generated_docs', filename), as_attachment=True)
    except Exception as e:
        logging.error(f"Error during file download: {e}")
        return jsonify({"error": str(e)}), 500
