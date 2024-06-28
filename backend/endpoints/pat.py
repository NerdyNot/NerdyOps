from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import uuid
import logging
from utils.db import get_db_connection, DB_TYPE

SECRET_KEY = 'your_secret_key'  # This key should be kept secret in a real environment.

pat_bp = Blueprint('pat', __name__)

logging.basicConfig(level=logging.INFO)

@pat_bp.route('/generate_pat', methods=['POST'])
def generate_pat():
    data = request.get_json()
    username = data.get('user_id') 
    expiry_days = data.get('expiry_days')

    logging.info(f"Generating PAT for username: {username}, expiry_days: {expiry_days}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if user exists
    try:
        query = 'SELECT * FROM users WHERE username = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM users WHERE username = ?'
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        if not user:
            logging.error(f"User with username {username} does not exist")
            return jsonify({"error": "User not found"}), 404
        logging.info(f"User found: {user}")
    except Exception as e:
        logging.error(f"Error finding user: {e}")
        return jsonify({"error": "Error finding user"}), 500

    # Check if the user already has 3 PATs
    try:
        query = 'SELECT COUNT(*) AS count FROM user_pats WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT COUNT(*) AS count FROM user_pats WHERE user_id = ?'
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        pat_count = result['count'] if result else 0
        logging.info(f"PAT count for username {username}: {pat_count}")
    except Exception as e:
        logging.error(f"Error counting PATs: {e}")
        return jsonify({"error": "Error counting PATs"}), 500

    if pat_count >= 3:
        return jsonify({"error": "You can only have up to 3 PATs"}), 400

    expiry_date = datetime.utcnow() + timedelta(days=expiry_days) if expiry_days else None
    created_at = datetime.utcnow()
    payload = {
        'user_id': username,
        'exp': expiry_date
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    try:
        query = '''
            INSERT INTO user_pats (pat_id, token, expiry_date, created_at, user_id)
            VALUES (%s, %s, %s, %s, %s)
        ''' if DB_TYPE == 'mysql' else '''
            INSERT INTO user_pats (pat_id, token, expiry_date, created_at, user_id)
            VALUES (?, ?, ?, ?, ?)
        '''
        cursor.execute(query, (str(uuid.uuid4()), token, expiry_date.isoformat() if expiry_date else None, created_at.isoformat(), username))
        conn.commit()
    except Exception as e:
        logging.error(f"Error inserting PAT: {e}")
        return jsonify({"error": "Error inserting PAT"}), 500
    finally:
        conn.close()

    return jsonify({
        "pat_id": str(uuid.uuid4()),
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

    query = 'SELECT * FROM user_pats WHERE pat_id = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM user_pats WHERE pat_id = ?'
    cursor.execute(query, (pat_id,))
    pat = cursor.fetchone()
    if not pat:
        return jsonify({"error": "PAT not found"}), 404

    query = 'DELETE FROM user_pats WHERE pat_id = %s' if DB_TYPE == 'mysql' else 'DELETE FROM user_pats WHERE pat_id = ?'
    cursor.execute(query, (pat_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "PAT deleted successfully"})

@pat_bp.route('/verify_pat', methods=['POST'])
def verify_pat():
    data = request.get_json()
    token = data.get('token')

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify if the token exists in the database
    query = 'SELECT * FROM user_pats WHERE token = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM user_pats WHERE token = ?'
    cursor.execute(query, (token,))
    pat = cursor.fetchone()
    conn.close()

    if not pat:
        return jsonify({"error": "Invalid token"}), 401

    if pat['expiry_date'] and datetime.fromisoformat(pat['expiry_date']) < datetime.utcnow():
        return jsonify({"error": "Token has expired"}), 401

    return jsonify({"message": "PAT authentication was successfully completed.", "user_id": pat['user_id']})


@pat_bp.route('/get-pat', methods=['GET'])
def get_pat():
    username = request.args.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()

    query = 'SELECT * FROM user_pats WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM user_pats WHERE user_id = ?'
    cursor.execute(query, (username,))
    pats = cursor.fetchall()
    conn.close()

    return jsonify([dict(pat) for pat in pats])
