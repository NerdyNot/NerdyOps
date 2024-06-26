from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from db import get_db_connection
import uuid
import os

auth_bp = Blueprint('auth_bp', __name__)
secret_key = os.environ.get('SECRET_KEY', 'secret_key')

def generate_token(user_id):
    payload = {
        'id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload['id']
    except jwt.ExpiredSignatureError:
        return None  # valid token, but expired
    except jwt.InvalidTokenError:
        return None  # invalid token

# Endpoint to register a new user
@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not username or not email or not password or not role:
        return jsonify({"error": "Username, email, password, and role are required"}), 400

    # Hash the password
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    # Create a unique user ID
    user_id = str(uuid.uuid4())

    # Save user information in SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (user_id, username, email, password, role)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, email, hashed_password, role))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "User registered", "user_id": user_id})

# Endpoint to authenticate a user
@auth_bp.route('/login', methods=['POST'])
def authenticate_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Retrieve user information from SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Generate token
    token = generate_token(user['user_id'])

    return jsonify({"status": "Login successful", "user_id": user['user_id'], "role": user['role'], "token": token})

# Endpoint to verify token
@auth_bp.route('/verify-token', methods=['POST'])
def verify_user_token():
    token = request.get_json().get('token')

    if not token:
        return jsonify({"error": "Token is required"}), 400

    user_id = verify_token(token)

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    return jsonify({"status": "Token is valid", "user_id": user_id})

# Endpoint to get user information
@auth_bp.route('/user-info', methods=['GET'])
def get_user_info():
    token = request.headers.get('Authorization').split(" ")[1]
    user_id = verify_token(token)

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT username, email, role FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"name": user['username'], "email": user['email'], "role": user['role']})

# Endpoint to change password
@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    data = request.get_json()
    token = request.headers.get('Authorization').split(" ")[1]
    user_id = verify_token(token)

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user_id or not current_password or not new_password:
        return jsonify({"error": "Current password and new password are required"}), 400

    # Retrieve user information from SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user['password'], current_password):
        conn.close()
        return jsonify({"error": "Invalid user ID or current password"}), 401

    # Hash the new password
    hashed_new_password = generate_password_hash(new_password, method='pbkdf2:sha256')

    # Update user's password in the database
    cursor.execute('UPDATE users SET password = ? WHERE user_id = ?', (hashed_new_password, user_id))
    conn.commit()
    conn.close()

    return jsonify({"status": "Password updated successfully"})