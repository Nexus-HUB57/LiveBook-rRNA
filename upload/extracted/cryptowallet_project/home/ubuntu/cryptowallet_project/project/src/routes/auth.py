from flask import Blueprint, request, jsonify, session
from models import User, db
from functools import wraps

auth_bp = Blueprint("auth", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email, or password"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        # Criar sessão
        session['user_id'] = user.id
        session['username'] = user.username
        session.permanent = True
        return jsonify({"message": "Login successful", "user_id": user.id, "username": user.username}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Limpar sessão
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route("/profile", methods=["GET"])
@login_required
def profile():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    if user:
        return jsonify(user.to_dict()), 200
    return jsonify({"message": "User not found"}), 404

@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    data = request.get_json()
    user_id = session.get('user_id')
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    user = User.query.get(user_id)
    if not user or not user.check_password(old_password):
        return jsonify({"message": "Invalid user or old password"}), 401

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200

@auth_bp.route("/check-session", methods=["GET"])
def check_session():
    if 'user_id' in session:
        return jsonify({
            "authenticated": True, 
            "user_id": session['user_id'], 
            "username": session.get('username')
        }), 200
    else:
        return jsonify({"authenticated": False}), 200


