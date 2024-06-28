from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from utils.db import get_db_connection, DB_TYPE
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

    # Save user information in the database
    conn = get_db_connection()
    cursor = conn.cursor()
    query = '''
        INSERT INTO users (user_id, username, email, password, role)
        VALUES (%s, %s, %s, %s, %s)
    ''' if DB_TYPE == 'mysql' else '''
        INSERT INTO users (user_id, username, email, password, role)
        VALUES (?, ?, ?, ?, ?)
    '''
    cursor.execute(query, (user_id, username, email, hashed_password, role))
    conn.commit()
    cursor.close()
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

    # Retrieve user information from the database
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT * FROM users WHERE username = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM users WHERE username = ?'
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Generate token
    token = generate_token(user['user_id'])

    return jsonify({
        "status": "Login successful",
        "user_id": user['user_id'],
        "username": user['username'],
        "email": user['email'],   # Include email in the response
        "role": user['role'],
        "token": token
    })

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
    query = 'SELECT username, email, role FROM users WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT username, email, role FROM users WHERE user_id = ?'
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    cursor.close()
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

    # Retrieve user information from the database
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT * FROM users WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT * FROM users WHERE user_id = ?'
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user['password'], current_password):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid user ID or current password"}), 401

    # Hash the new password
    hashed_new_password = generate_password_hash(new_password, method='pbkdf2:sha256')

    # Update user's password in the database
    query = 'UPDATE users SET password = %s WHERE user_id = %s' if DB_TYPE == 'mysql' else 'UPDATE users SET password = ? WHERE user_id = ?'
    cursor.execute(query, (hashed_new_password, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "Password updated successfully"})

# Endpoint to get all users (Admin only)
@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    token = request.headers.get('Authorization').split(" ")[1]
    user_id = verify_token(token)

    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    # Retrieve user information to check role
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT role FROM users WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT role FROM users WHERE user_id = ?'
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()

    if not user or user['role'] != 'admin':
        cursor.close()
        conn.close()
        return jsonify({"error": "Unauthorized access"}), 403

    # Retrieve all users
    query = 'SELECT user_id, username, email, role FROM users'
    cursor.execute(query)
    users = cursor.fetchall()
    cursor.close()
    conn.close()

    user_list = [dict(user) for user in users]
    return jsonify(user_list)

# Endpoint to update user role (Admin only)
@auth_bp.route('/update-role', methods=['POST'])
def update_user_role():
    data = request.get_json()
    token = request.headers.get('Authorization').split(" ")[1]
    admin_id = verify_token(token)

    if not admin_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    user_id = data.get('user_id')
    new_role = data.get('new_role')

    if not user_id or not new_role:
        return jsonify({"error": "User ID and new role are required"}), 400

    # Retrieve admin information to check role
    conn = get_db_connection()
    cursor = conn.cursor()
    query = 'SELECT role FROM users WHERE user_id = %s' if DB_TYPE == 'mysql' else 'SELECT role FROM users WHERE user_id = ?'
    cursor.execute(query, (admin_id,))
    admin = cursor.fetchone()

    if not admin or admin['role'] != 'admin':
        cursor.close()
        conn.close()
        return jsonify({"error": "Unauthorized access"}), 403

    # Update user role in the database
    query = 'UPDATE users SET role = %s WHERE user_id = %s' if DB_TYPE == 'mysql' else 'UPDATE users SET role = ? WHERE user_id = ?'
    cursor.execute(query, (new_role, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "User role updated successfully"})
