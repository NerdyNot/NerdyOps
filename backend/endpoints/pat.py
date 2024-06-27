from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import uuid
from utils.db import get_db_connection

SECRET_KEY = 'your_secret_key'  # 이 키는 실제 환경에서는 비밀로 유지해야 합니다.

pat_bp = Blueprint('pat', __name__)



@pat_bp.route('/generate_pat', methods=['POST'])
def generate_pat():
    data = request.get_json()
    user_id = data.get('user_id')
    expiry_days = data.get('expiry_days')

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the user already has 3 PATs
    cursor.execute('SELECT COUNT(*) FROM user_pats WHERE user_id = ?', (user_id,))
    pat_count = cursor.fetchone()[0]
    if pat_count >= 3:
        return jsonify({"error": "You can only have up to 3 PATs"}), 400

    expiry_date = datetime.utcnow() + timedelta(days=expiry_days) if expiry_days else None
    created_at = datetime.utcnow()
    payload = {
        'user_id': user_id,
        'exp': expiry_date
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    cursor.execute('''
        INSERT INTO user_pats (pat_id, token, expiry_date, created_at, user_id)
        VALUES (?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), token, expiry_date.isoformat() if expiry_date else None, created_at.isoformat(), user_id))
    conn.commit()
    conn.close()

    return jsonify({
        "pat_id": cursor.lastrowid,
        "token": token,
        "expiry_date": expiry_date.isoformat() if expiry_date else None,
        "created_at": created_at.isoformat()
    })

@pat_bp.route('/delete_pat', methods=['POST'])
def delete_pat():
    data = request.get_json()
    pat_id = data.get('pat_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM user_pats WHERE pat_id = ?', (pat_id,))
    pat = cursor.fetchone()
    if not pat:
        return jsonify({"error": "PAT not found"}), 404

    cursor.execute('DELETE FROM user_pats WHERE pat_id = ?', (pat_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "PAT deleted successfully"})

@pat_bp.route('/verify_pat', methods=['POST'])
def verify_pat():
    data = request.get_json()
    token = data.get('token')

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({"message": "Token is valid", "user_id": payload['user_id']})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

@pat_bp.route('/get-pat', methods=['GET'])
def get_pat():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user_pats WHERE user_id = ?', (user_id,))
    pats = cursor.fetchall()
    conn.close()

    return jsonify([dict(pat) for pat in pats])