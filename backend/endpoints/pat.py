from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
from utils.db import get_db_connection


pat_bp = Blueprint('pat', __name__)

@pat_bp.route('/generate_pat', methods=['POST'])
def generate_pat():
    data = request.get_json()
    user_id = data.get('user_id')
    expiry_days = data.get('expiry_days')

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the user already has 3 PATs
    cursor.execute('SELECT COUNT(*) FROM pats WHERE user_id = ?', (user_id,))
    pat_count = cursor.fetchone()[0]
    if pat_count >= 3:
        return jsonify({"error": "You can only have up to 3 PATs"}), 400

    token = str(uuid.uuid4())
    expiry_date = (datetime.utcnow() + timedelta(days=expiry_days)).isoformat() if expiry_days else None

    cursor.execute('''
        INSERT INTO pats (pat_id, token, expiry_date, user_id)
        VALUES (?, ?, ?, ?)
    ''', (str(uuid.uuid4()), token, expiry_date, user_id))
    conn.commit()
    conn.close()

    return jsonify({
        "pat_id": cursor.lastrowid,
        "token": token,
        "expiry_date": expiry_date
    })

@pat_bp.route('/delete_pat', methods=['POST'])
def delete_pat():
    data = request.get_json()
    pat_id = data.get('pat_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM pats WHERE pat_id = ?', (pat_id,))
    pat = cursor.fetchone()
    if not pat:
        return jsonify({"error": "PAT not found"}), 404

    cursor.execute('DELETE FROM pats WHERE pat_id = ?', (pat_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "PAT deleted successfully"})

@pat_bp.route('/verify_pat', methods=['POST'])
def verify_pat():
    data = request.get_json()
    token = data.get('token')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM pats WHERE token = ?', (token,))
    pat = cursor.fetchone()
    if not pat:
        return jsonify({"error": "Invalid token"}), 401

    if pat['expiry_date'] and datetime.fromisoformat(pat['expiry_date']) < datetime.utcnow():
        return jsonify({"error": "Token has expired"}), 401

    return jsonify({"message": "Token is valid", "user_id": pat['user_id']})
