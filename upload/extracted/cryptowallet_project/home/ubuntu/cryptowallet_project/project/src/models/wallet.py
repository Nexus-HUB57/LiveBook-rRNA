from datetime import datetime
import json
import base64
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import PBKDF2
import hashlib
from main import db

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    wallet_type = db.Column(db.String(50), nullable=False)  # bitcoin_core, ethereum_keystore, genesis_wallet
    encrypted_data = db.Column(db.Text, nullable=False)
    salt = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Metadados adicionais
    file_size = db.Column(db.Integer)
    original_filename = db.Column(db.String(255))
    keys_count = db.Column(db.Integer, default=0)
    addresses_count = db.Column(db.Integer, default=0)
    is_encrypted = db.Column(db.Boolean, default=False)
    
    def __init__(self, **kwargs):
        super(Wallet, self).__init__(**kwargs)
        if not self.salt:
            self.salt = base64.b64encode(get_random_bytes(32)).decode('utf-8')
    
    def encrypt_data(self, data, password):
        """Criptografa os dados da wallet usando AES-256"""
        salt_bytes = base64.b64decode(self.salt)
        key = PBKDF2(password, salt_bytes, 32, count=100000, hmac_hash_module=hashlib.sha256)
        
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(data.encode('utf-8') if isinstance(data, str) else data)
        
        encrypted_data = {
            'nonce': base64.b64encode(cipher.nonce).decode('utf-8'),
            'tag': base64.b64encode(tag).decode('utf-8'),
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8')
        }
        
        self.encrypted_data = json.dumps(encrypted_data)
    
    def decrypt_data(self, password):
        """Descriptografa os dados da wallet"""
        try:
            salt_bytes = base64.b64decode(self.salt)
            key = PBKDF2(password, salt_bytes, 32, count=100000, hmac_hash_module=hashlib.sha256)
            
            encrypted_data = json.loads(self.encrypted_data)
            nonce = base64.b64decode(encrypted_data['nonce'])
            tag = base64.b64decode(encrypted_data['tag'])
            ciphertext = base64.b64decode(encrypted_data['ciphertext'])
            
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
            data = cipher.decrypt_and_verify(ciphertext, tag)
            
            return data
        except Exception as e:
            raise ValueError(f"Erro ao descriptografar: {str(e)}")
    
    def to_dict(self, include_sensitive=False):
        result = {
            'id': self.id,
            'name': self.name,
            'wallet_type': self.wallet_type,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'file_size': self.file_size,
            'original_filename': self.original_filename,
            'keys_count': self.keys_count,
            'addresses_count': self.addresses_count,
            'is_encrypted': self.is_encrypted
        }
        
        if include_sensitive:
            result['encrypted_data'] = self.encrypted_data
            result['salt'] = self.salt
        
        return result

