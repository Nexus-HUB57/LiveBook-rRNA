"""
Private Key Manager - Sistema de gerenciamento de chaves privadas
Gerencia importação, validação e armazenamento seguro de chaves privadas
"""

import json
import os
import hashlib
import base64
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import re

class PrivateKeyManager:
    """Gerenciador de chaves privadas com criptografia"""
    
    def __init__(self, database_path: str = "/home/ubuntu/private_keys_database.json"):
        self.database_path = database_path
        self.master_password = "FDR_ARBITRAGE_2025_SECURE_KEY"  # Em produção, usar input do usuário
        self.encryption_key = self._derive_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # Carregar ou criar database
        self.database = self._load_database()
        
        print("🔐 Private Key Manager inicializado")
        print(f"📁 Database: {database_path}")
        print(f"🔒 Criptografia: AES-256 ativada")
    
    def _derive_encryption_key(self) -> bytes:
        """Deriva chave de criptografia a partir da senha mestre"""
        try:
            password = self.master_password.encode()
            salt = b'fdr_arbitrage_salt_2025'  # Em produção, usar salt aleatório
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            
            key = base64.urlsafe_b64encode(kdf.derive(password))
            return key
            
        except Exception as e:
            print(f"❌ Erro ao derivar chave de criptografia: {e}")
            return None
    
    def _load_database(self) -> Dict:
        """Carrega database de chaves privadas"""
        try:
            if os.path.exists(self.database_path):
                with open(self.database_path, 'r') as f:
                    database = json.load(f)
                print(f"✅ Database carregado: {database['metadata']['total_keys']} chaves")
                return database
            else:
                print("📝 Criando novo database de chaves privadas")
                return self._create_empty_database()
                
        except Exception as e:
            print(f"❌ Erro ao carregar database: {e}")
            return self._create_empty_database()
    
    def _create_empty_database(self) -> Dict:
        """Cria database vazio"""
        return {
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "version": "1.0",
                "total_keys": 0,
                "encryption": "AES-256",
                "backup_enabled": True
            },
            "private_keys": {},
            "imported_files": {},
            "security": {
                "encryption_enabled": True,
                "backup_frequency": "daily",
                "last_backup": datetime.now().isoformat(),
                "access_log": [],
                "failed_attempts": 0,
                "locked_until": None
            },
            "statistics": {
                "total_wallets": 0,
                "active_wallets": 0,
                "custody_wallets": 0,
                "total_balance_btc": 0.0,
                "total_balance_usd": 0.0,
                "last_sync": datetime.now().isoformat()
            }
        }
    
    def _save_database(self) -> bool:
        """Salva database no arquivo"""
        try:
            self.database['metadata']['last_updated'] = datetime.now().isoformat()
            
            with open(self.database_path, 'w') as f:
                json.dump(self.database, f, indent=2)
            
            print("💾 Database salvo com sucesso")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao salvar database: {e}")
            return False
    
    def encrypt_private_key(self, private_key_wif: str) -> str:
        """Criptografa uma chave privada"""
        try:
            if not private_key_wif or private_key_wif == "ENCRYPTED_KEY_PLACEHOLDER":
                return private_key_wif
            
            encrypted_key = self.cipher_suite.encrypt(private_key_wif.encode())
            return base64.b64encode(encrypted_key).decode()
            
        except Exception as e:
            print(f"❌ Erro na criptografia: {e}")
            return None
    
    def decrypt_private_key(self, encrypted_key: str) -> str:
        """Descriptografa uma chave privada"""
        try:
            if not encrypted_key or encrypted_key == "ENCRYPTED_KEY_PLACEHOLDER":
                return None
            
            encrypted_data = base64.b64decode(encrypted_key.encode())
            decrypted_key = self.cipher_suite.decrypt(encrypted_data)
            return decrypted_key.decode()
            
        except Exception as e:
            print(f"❌ Erro na descriptografia: {e}")
            return None
    
    def add_private_key(self, address: str, private_key_wif: str, 
                       wallet_type: str = "p2pkh", notes: str = "") -> bool:
        """Adiciona uma nova chave privada ao database"""
        try:
            print(f"🔑 Adicionando chave privada para {address}")
            
            # Validar chave privada
            if not self.validate_private_key_format(private_key_wif):
                print("❌ Formato de chave privada inválido")
                return False
            
            # Criptografar chave privada
            encrypted_key = self.encrypt_private_key(private_key_wif)
            if not encrypted_key:
                print("❌ Falha na criptografia da chave")
                return False
            
            # Gerar ID único para a carteira
            wallet_id = self._generate_wallet_id(address)
            
            # Criar entrada da carteira
            wallet_entry = {
                "address": address,
                "private_key_wif": encrypted_key,
                "public_key": "ENCRYPTED_PUBKEY_PLACEHOLDER",  # Será derivado quando necessário
                "balance_btc": 0.0,
                "balance_satoshis": 0,
                "utxo_count": 0,
                "imported_from": "manual_import",
                "imported_at": datetime.now().isoformat(),
                "last_balance_check": None,
                "status": "active",
                "network": "mainnet",
                "wallet_type": wallet_type,
                "notes": notes
            }
            
            # Adicionar ao database
            self.database['private_keys'][wallet_id] = wallet_entry
            self.database['metadata']['total_keys'] += 1
            self.database['statistics']['total_wallets'] += 1
            self.database['statistics']['active_wallets'] += 1
            
            # Salvar database
            if self._save_database():
                print(f"✅ Chave privada adicionada: {wallet_id}")
                return True
            else:
                print("❌ Falha ao salvar database")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao adicionar chave privada: {e}")
            return False
    
    def import_from_file(self, file_path: str) -> Dict:
        """Importa chaves privadas de um arquivo"""
        try:
            print(f"📂 Importando chaves de: {file_path}")
            
            if not os.path.exists(file_path):
                print("❌ Arquivo não encontrado")
                return {"success": False, "error": "Arquivo não encontrado"}
            
            # Ler conteúdo do arquivo
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extrair chaves privadas do conteúdo
            extracted_keys = self._extract_private_keys_from_content(content)
            
            if not extracted_keys:
                print("❌ Nenhuma chave privada encontrada no arquivo")
                return {"success": False, "error": "Nenhuma chave privada encontrada"}
            
            # Importar cada chave encontrada
            imported_count = 0
            failed_count = 0
            
            for i, key_data in enumerate(extracted_keys):
                address = key_data.get('address', f"imported_wallet_{i+1}")
                private_key = key_data.get('private_key')
                
                if self.add_private_key(address, private_key, notes=f"Importado de {os.path.basename(file_path)}"):
                    imported_count += 1
                else:
                    failed_count += 1
            
            # Registrar arquivo importado
            file_name = os.path.basename(file_path)
            self.database['imported_files'][file_name] = {
                "file_path": file_path,
                "imported_at": datetime.now().isoformat(),
                "addresses_found": len(extracted_keys),
                "keys_extracted": imported_count,
                "status": "processed"
            }
            
            self._save_database()
            
            result = {
                "success": True,
                "imported_count": imported_count,
                "failed_count": failed_count,
                "total_found": len(extracted_keys),
                "file_name": file_name
            }
            
            print(f"✅ Importação concluída: {imported_count} chaves importadas")
            return result
            
        except Exception as e:
            print(f"❌ Erro na importação: {e}")
            return {"success": False, "error": str(e)}
    
    def _extract_private_keys_from_content(self, content: str) -> List[Dict]:
        """Extrai chaves privadas do conteúdo de um arquivo"""
        try:
            extracted_keys = []
            
            # Padrões para identificar chaves privadas WIF
            wif_patterns = [
                r'[5KL][1-9A-HJ-NP-Za-km-z]{50,51}',  # WIF não comprimido (5) e comprimido (K/L)
                r'[1-9A-HJ-NP-Za-km-z]{51,52}'        # Padrão geral WIF
            ]
            
            # Padrões para endereços Bitcoin
            address_patterns = [
                r'[13][a-km-zA-HJ-NP-Z1-9]{25,34}',   # P2PKH e P2SH
                r'bc1[a-z0-9]{39,59}'                 # Bech32
            ]
            
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines):
                line = line.strip()
                
                # Procurar chaves privadas WIF
                for pattern in wif_patterns:
                    matches = re.findall(pattern, line)
                    for match in matches:
                        if self.validate_private_key_format(match):
                            # Tentar encontrar endereço associado na mesma linha ou próximas
                            associated_address = self._find_associated_address(lines, line_num, address_patterns)
                            
                            key_data = {
                                "private_key": match,
                                "address": associated_address or f"extracted_wallet_{len(extracted_keys)+1}",
                                "line_number": line_num + 1,
                                "source_line": line[:100]  # Primeiros 100 chars para referência
                            }
                            
                            extracted_keys.append(key_data)
            
            print(f"🔍 Encontradas {len(extracted_keys)} chaves privadas no conteúdo")
            return extracted_keys
            
        except Exception as e:
            print(f"❌ Erro na extração: {e}")
            return []
    
    def _find_associated_address(self, lines: List[str], current_line: int, address_patterns: List[str]) -> Optional[str]:
        """Procura endereço Bitcoin associado próximo à chave privada"""
        try:
            # Procurar nas linhas próximas (±3 linhas)
            search_range = range(max(0, current_line - 3), min(len(lines), current_line + 4))
            
            for line_idx in search_range:
                line = lines[line_idx].strip()
                
                for pattern in address_patterns:
                    matches = re.findall(pattern, line)
                    if matches:
                        return matches[0]  # Retornar primeiro endereço encontrado
            
            return None
            
        except Exception as e:
            print(f"❌ Erro ao procurar endereço: {e}")
            return None
    
    def validate_private_key_format(self, private_key: str) -> bool:
        """Valida formato de chave privada WIF"""
        try:
            if not private_key or len(private_key) < 51:
                return False
            
            # Verificar se começa com caracteres válidos para WIF
            if not private_key[0] in ['5', 'K', 'L']:
                return False
            
            # Verificar comprimento
            if len(private_key) not in [51, 52]:
                return False
            
            # Verificar caracteres válidos (Base58)
            valid_chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
            for char in private_key:
                if char not in valid_chars:
                    return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erro na validação: {e}")
            return False
    
    def _generate_wallet_id(self, address: str) -> str:
        """Gera ID único para uma carteira"""
        try:
            # Usar hash do endereço + timestamp para garantir unicidade
            timestamp = str(int(datetime.now().timestamp()))
            combined = f"{address}_{timestamp}"
            hash_object = hashlib.md5(combined.encode())
            return f"wallet_{hash_object.hexdigest()[:8]}"
            
        except Exception as e:
            print(f"❌ Erro ao gerar ID: {e}")
            return f"wallet_{int(datetime.now().timestamp())}"
    
    def get_all_wallets(self) -> Dict:
        """Retorna todas as carteiras (sem chaves privadas descriptografadas)"""
        try:
            wallets = {}
            
            for wallet_id, wallet_data in self.database['private_keys'].items():
                # Criar cópia sem a chave privada descriptografada
                safe_wallet = wallet_data.copy()
                safe_wallet['private_key_wif'] = "ENCRYPTED"
                safe_wallet['has_private_key'] = wallet_data['private_key_wif'] != "ENCRYPTED_KEY_PLACEHOLDER"
                
                wallets[wallet_id] = safe_wallet
            
            return wallets
            
        except Exception as e:
            print(f"❌ Erro ao obter carteiras: {e}")
            return {}
    
    def get_private_key(self, wallet_id: str) -> Optional[str]:
        """Obtém chave privada descriptografada de uma carteira"""
        try:
            if wallet_id not in self.database['private_keys']:
                print(f"❌ Carteira não encontrada: {wallet_id}")
                return None
            
            wallet = self.database['private_keys'][wallet_id]
            encrypted_key = wallet['private_key_wif']
            
            if encrypted_key == "ENCRYPTED_KEY_PLACEHOLDER":
                print(f"❌ Chave privada não disponível para: {wallet_id}")
                return None
            
            # Registrar acesso
            self._log_access(wallet_id, "private_key_access")
            
            return self.decrypt_private_key(encrypted_key)
            
        except Exception as e:
            print(f"❌ Erro ao obter chave privada: {e}")
            return None
    
    def _log_access(self, wallet_id: str, action: str):
        """Registra acesso às chaves privadas"""
        try:
            access_entry = {
                "wallet_id": wallet_id,
                "action": action,
                "timestamp": datetime.now().isoformat(),
                "ip": "localhost"  # Em produção, obter IP real
            }
            
            self.database['security']['access_log'].append(access_entry)
            
            # Manter apenas últimos 100 registros
            if len(self.database['security']['access_log']) > 100:
                self.database['security']['access_log'] = self.database['security']['access_log'][-100:]
            
        except Exception as e:
            print(f"❌ Erro no log de acesso: {e}")
    
    def update_wallet_balance(self, wallet_id: str, balance_btc: float, utxo_count: int = 0) -> bool:
        """Atualiza saldo de uma carteira"""
        try:
            if wallet_id not in self.database['private_keys']:
                return False
            
            wallet = self.database['private_keys'][wallet_id]
            wallet['balance_btc'] = balance_btc
            wallet['balance_satoshis'] = int(balance_btc * 100000000)
            wallet['utxo_count'] = utxo_count
            wallet['last_balance_check'] = datetime.now().isoformat()
            
            # Atualizar estatísticas
            self._update_statistics()
            
            return self._save_database()
            
        except Exception as e:
            print(f"❌ Erro ao atualizar saldo: {e}")
            return False
    
    def _update_statistics(self):
        """Atualiza estatísticas do database"""
        try:
            total_balance = 0.0
            active_count = 0
            custody_count = 0
            
            for wallet_data in self.database['private_keys'].values():
                total_balance += wallet_data.get('balance_btc', 0.0)
                
                if wallet_data.get('status') == 'active':
                    active_count += 1
                elif wallet_data.get('status') == 'custody':
                    custody_count += 1
            
            self.database['statistics'].update({
                "total_wallets": len(self.database['private_keys']),
                "active_wallets": active_count,
                "custody_wallets": custody_count,
                "total_balance_btc": total_balance,
                "total_balance_usd": total_balance * 30000,  # Estimativa
                "last_sync": datetime.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Erro ao atualizar estatísticas: {e}")
    
    def get_statistics(self) -> Dict:
        """Retorna estatísticas do sistema"""
        return self.database.get('statistics', {})
    
    def backup_database(self, backup_path: str = None) -> bool:
        """Cria backup do database"""
        try:
            if not backup_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = f"/home/ubuntu/private_keys_backup_{timestamp}.json"
            
            with open(backup_path, 'w') as f:
                json.dump(self.database, f, indent=2)
            
            self.database['security']['last_backup'] = datetime.now().isoformat()
            self._save_database()
            
            print(f"💾 Backup criado: {backup_path}")
            return True
            
        except Exception as e:
            print(f"❌ Erro no backup: {e}")
            return False

def initialize_private_key_manager():
    """Inicializa o gerenciador de chaves privadas"""
    print("🔐 Inicializando Private Key Manager...")
    
    try:
        manager = PrivateKeyManager()
        print("✅ Private Key Manager inicializado com sucesso!")
        return manager
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do sistema
    manager = initialize_private_key_manager()
    
    if manager:
        print("\n🧪 Testando funcionalidades:")
        
        # Teste 1: Adicionar chave privada
        print("\n1. Testando adição de chave privada...")
        test_key = "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS"
        test_address = "1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T"
        
        if manager.add_private_key(test_address, test_key, notes="Chave de teste"):
            print("✅ Chave adicionada com sucesso")
        else:
            print("❌ Falha ao adicionar chave")
        
        # Teste 2: Listar carteiras
        print("\n2. Listando carteiras...")
        wallets = manager.get_all_wallets()
        print(f"📊 Total de carteiras: {len(wallets)}")
        
        # Teste 3: Estatísticas
        print("\n3. Estatísticas do sistema...")
        stats = manager.get_statistics()
        print(f"💰 Saldo total: {stats.get('total_balance_btc', 0)} BTC")
        print(f"🏦 Carteiras ativas: {stats.get('active_wallets', 0)}")
        
        # Teste 4: Backup
        print("\n4. Criando backup...")
        if manager.backup_database():
            print("✅ Backup criado com sucesso")
        else:
            print("❌ Falha no backup")
    else:
        print("❌ Falha na inicialização do Private Key Manager")

