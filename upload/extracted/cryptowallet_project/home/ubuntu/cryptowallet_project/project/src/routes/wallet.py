import os
import json
import base64
from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.utils import secure_filename
from src.wallet_analyzer import WalletAnalyzer
from models import Wallet, User, db
from src.routes.auth import login_required

wallet_bp = Blueprint("wallets", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads")
ALLOWED_EXTENSIONS = {"dat", "wallet", "json", "core", "backup", "txt"}

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@wallet_bp.route("/", methods=["GET"])
@login_required
def get_wallets():
    user_id = session.get('user_id')
    
    wallets = Wallet.query.filter_by(user_id=user_id).all()
    return jsonify([wallet.to_dict() for wallet in wallets]), 200

@wallet_bp.route("/<int:wallet_id>", methods=["GET"])
@login_required
def get_wallet(wallet_id):
    user_id = session.get('user_id')
    wallet = Wallet.query.filter_by(id=wallet_id, user_id=user_id).first()
    if wallet:
        return jsonify(wallet.to_dict()), 200
    return jsonify({"message": "Wallet not found"}), 404

@wallet_bp.route("/upload", methods=["POST"])
@login_required
def upload_wallet():
    user_id = session.get('user_id')
    wallet_name = request.form.get("name", "Imported Wallet")
    password = request.form.get("password") # Senha para wallets criptografadas

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        analyzer = WalletAnalyzer()
        analysis_result = analyzer.analyze_file(file_path)

        # Criar nova entrada de wallet no banco de dados
        new_wallet = Wallet(
            user_id=user_id,
            name=wallet_name,
            wallet_type=analysis_result.get("type", "unknown"),
            original_filename=filename,
            file_size=analysis_result.get("size", 0),
            keys_count=analysis_result.get("keys_found", 0),
            addresses_count=analysis_result.get("addresses_found", 0),
            is_encrypted=analysis_result.get("encrypted", False)
        )
        
        # Armazenar o conteúdo do arquivo de forma criptografada
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        # Se a wallet for criptografada e uma senha for fornecida, tente descriptografar
        # Caso contrário, armazene o conteúdo bruto ou um placeholder
        if new_wallet.is_encrypted and password:
            try:
                # Aqui você pode tentar descriptografar e armazenar o conteúdo descriptografado
                # Por simplicidade, vamos apenas armazenar o conteúdo bruto criptografado
                new_wallet.encrypt_data(file_content, password)
            except ValueError as e:
                # Se a senha estiver incorreta, ainda assim armazene a wallet, mas marque como erro
                new_wallet.encrypted_data = base64.b64encode(file_content).decode("utf-8") # Armazena raw criptografado
                new_wallet.is_encrypted = True # Mantém como criptografada
                new_wallet.name = f"{wallet_name} (Erro de Senha)"
                db.session.add(new_wallet)
                db.session.commit()
                os.remove(file_path) # Remover arquivo temporário
                return jsonify({"message": f"Wallet importada, mas erro de senha: {str(e)}", "wallet": new_wallet.to_dict()}), 200
        else:
            new_wallet.encrypted_data = base64.b64encode(file_content).decode("utf-8") # Armazena raw

        db.session.add(new_wallet)
        db.session.commit()

        os.remove(file_path) # Remover arquivo temporário após processamento

        return jsonify({"message": "Wallet uploaded successfully", "wallet": new_wallet.to_dict()}), 201
    
    return jsonify({"message": "File type not allowed"}), 400

@wallet_bp.route("/import", methods=["POST"])
@login_required
def import_wallet():
    # Alias para upload_wallet para compatibilidade
    return upload_wallet()

@wallet_bp.route("/<int:wallet_id>", methods=["PUT"])
@login_required
def update_wallet(wallet_id):
    user_id = session.get('user_id')
    wallet = Wallet.query.filter_by(id=wallet_id, user_id=user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    data = request.get_json()
    if "name" in data:
        wallet.name = data["name"]
    if "is_active" in data:
        wallet.is_active = data["is_active"]

    db.session.commit()
    return jsonify(wallet.to_dict()), 200

@wallet_bp.route("/<int:wallet_id>", methods=["DELETE"])
@login_required
def delete_wallet(wallet_id):
    user_id = session.get('user_id')
    wallet = Wallet.query.filter_by(id=wallet_id, user_id=user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    db.session.delete(wallet)
    db.session.commit()
    return jsonify({"message": "Wallet deleted successfully"}), 200

@wallet_bp.route("/<int:wallet_id>/decrypt", methods=["POST"])
@login_required
def decrypt_wallet_data(wallet_id):
    user_id = session.get('user_id')
    wallet = Wallet.query.filter_by(id=wallet_id, user_id=user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    data = request.get_json()
    password = data.get("password")

    if not password:
        return jsonify({"message": "Password is required for decryption"}), 400

    try:
        decrypted_content = wallet.decrypt_data(password)
        # Dependendo do tipo de wallet, você pode querer analisar o conteúdo descriptografado aqui
        # Por exemplo, se for um JSON, parsear e retornar os dados relevantes
        return jsonify({"message": "Data decrypted successfully", "content_preview": decrypted_content.decode("utf-8")[:200] + "..."}), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 401
    except Exception as e:
        return jsonify({"message": f"An unexpected error occurred: {str(e)}"}), 500

@wallet_bp.route("/<int:wallet_id>/export", methods=["GET"])
@login_required
def export_wallet(wallet_id):
    user_id = session.get('user_id')
    wallet = Wallet.query.filter_by(id=wallet_id, user_id=user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Para exportar, você precisaria descriptografar e retornar o arquivo original
    # Isso exigiria a senha se a wallet estiver criptografada
    # Por simplicidade, vamos apenas retornar um placeholder ou um erro se criptografado
    if wallet.is_encrypted:
        return jsonify({"message": "Wallet is encrypted. Decryption password is required for export."}), 400
    
    # Simplesmente retorna o conteúdo armazenado (não descriptografado se for o caso)
    try:
        file_content = base64.b64decode(wallet.encrypted_data)
        response = current_app.make_response(file_content)
        response.headers["Content-Disposition"] = f"attachment; filename={wallet.original_filename}"
        response.headers["Content-Type"] = "application/octet-stream"
        return response
    except Exception as e:
        return jsonify({"message": f"Error exporting wallet: {str(e)}"}), 500


