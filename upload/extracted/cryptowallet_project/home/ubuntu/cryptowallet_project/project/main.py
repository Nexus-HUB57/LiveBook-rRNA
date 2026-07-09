import os
from flask import Flask, send_from_directory, session
from flask_cors import CORS
from models import db, User, Wallet

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key_for_sessions_2024')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(os.path.dirname(__file__), "database", "app.db")}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['SESSION_COOKIE_SECURE'] = False  # Para desenvolvimento
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

db.init_app(app)
CORS(app)

# Criar diretórios necessários
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'database'), exist_ok=True)

# Importar e registrar blueprints
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.wallet import wallet_bp
from src.routes.crypto import crypto_bp

# Tentar importar as rotas aprimoradas
try:
    from src.routes.crypto_enhanced import crypto_enhanced_bp
    app.register_blueprint(crypto_enhanced_bp, url_prefix='/api/crypto-enhanced')
except ImportError:
    pass

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(wallet_bp, url_prefix='/api/wallets')
app.register_blueprint(crypto_bp, url_prefix='/api/crypto')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Rotas específicas para arquivos aprimorados
@app.route('/enhanced_index.html')
def enhanced_index():
    return send_from_directory(app.static_folder, 'enhanced_index.html')

@app.route('/enhanced_styles.css')
def enhanced_styles():
    return send_from_directory(app.static_folder, 'enhanced_styles.css')

@app.route('/enhanced_script.js')
def enhanced_script():
    return send_from_directory(app.static_folder, 'enhanced_script.js')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)


