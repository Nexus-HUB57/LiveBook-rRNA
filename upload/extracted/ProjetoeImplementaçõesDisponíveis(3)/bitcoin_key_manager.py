"""
Bitcoin Key Manager - Sistema de assinatura digital e gerenciamento de chaves
Implementa funcionalidades reais para geração, importação e uso de chaves privadas Bitcoin
"""

import hashlib
import hmac
import os
import json
import base58
import ecdsa
from ecdsa import SigningKey, SECP256k1
from ecdsa.util import sigencode_der
import bitcoin
from bitcoin import *
from bitcoinlib.keys import Key
from bitcoinlib.transactions import Transaction
from bitcoinlib.wallets import Wallet
import secrets
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class BitcoinKeyManager:
    """Gerenciador de chaves privadas e assinatura digital Bitcoin"""
    
    def __init__(self):
        self.keys_cache = {}
        self.network = 'bitcoin'  # mainnet
        
        print("🔐 Bitcoin Key Manager inicializado")
        print("🌐 Rede: Bitcoin Mainnet")
    
    def generate_private_key(self) -> str:
        """Gera uma nova chave privada Bitcoin"""
        try:
            # Gerar 32 bytes aleatórios seguros
            private_key_bytes = secrets.token_bytes(32)
            
            # Converter para formato WIF (Wallet Import Format)
            private_key_wif = bitcoin.encode_privkey(private_key_bytes, 'wif')
            
            print(f"🔑 Nova chave privada gerada")
            print(f"   Formato WIF: {private_key_wif[:10]}...{private_key_wif[-10:]}")
            
            return private_key_wif
            
        except Exception as e:
            print(f"❌ Erro ao gerar chave privada: {e}")
            return None
    
    def private_key_to_public_key(self, private_key_wif: str) -> str:
        """Converte chave privada para chave pública"""
        try:
            # Converter WIF para chave pública
            public_key = bitcoin.privkey_to_pubkey(private_key_wif)
            
            print(f"🔓 Chave pública derivada")
            print(f"   Formato: {public_key[:20]}...{public_key[-20:]}")
            
            return public_key
            
        except Exception as e:
            print(f"❌ Erro ao derivar chave pública: {e}")
            return None
    
    def public_key_to_address(self, public_key: str, address_type: str = 'p2pkh') -> str:
        """Converte chave pública para endereço Bitcoin"""
        try:
            if address_type == 'p2pkh':  # Legacy address (1...)
                address = bitcoin.pubkey_to_address(public_key)
            elif address_type == 'p2sh':  # P2SH address (3...)
                # Para P2SH, precisamos criar um script
                script = bitcoin.mk_pubkey_script(public_key)
                address = bitcoin.p2sh_scriptaddr(script)
            else:
                raise ValueError(f"Tipo de endereço não suportado: {address_type}")
            
            print(f"📍 Endereço gerado ({address_type}): {address}")
            
            return address
            
        except Exception as e:
            print(f"❌ Erro ao gerar endereço: {e}")
            return None
    
    def create_wallet_from_private_key(self, private_key_wif: str) -> Dict:
        """Cria carteira completa a partir de chave privada"""
        try:
            # Derivar chave pública
            public_key = self.private_key_to_public_key(private_key_wif)
            if not public_key:
                return None
            
            # Gerar endereços
            address_p2pkh = self.public_key_to_address(public_key, 'p2pkh')
            
            wallet_info = {
                'private_key_wif': private_key_wif,
                'public_key': public_key,
                'addresses': {
                    'p2pkh': address_p2pkh
                },
                'network': 'mainnet',
                'created_at': datetime.now().isoformat()
            }
            
            print(f"💼 Carteira criada:")
            print(f"   Endereço P2PKH: {address_p2pkh}")
            
            return wallet_info
            
        except Exception as e:
            print(f"❌ Erro ao criar carteira: {e}")
            return None
    
    def import_private_key(self, private_key_wif: str) -> Dict:
        """Importa uma chave privada existente"""
        try:
            # Validar formato WIF
            if not self.validate_private_key_wif(private_key_wif):
                raise ValueError("Chave privada WIF inválida")
            
            # Criar carteira
            wallet_info = self.create_wallet_from_private_key(private_key_wif)
            
            if wallet_info:
                # Adicionar ao cache
                address = wallet_info['addresses']['p2pkh']
                self.keys_cache[address] = wallet_info
                
                print(f"📥 Chave privada importada com sucesso")
                print(f"   Endereço: {address}")
                
                return wallet_info
            else:
                return None
                
        except Exception as e:
            print(f"❌ Erro ao importar chave privada: {e}")
            return None
    
    def validate_private_key_wif(self, private_key_wif: str) -> bool:
        """Valida formato WIF de chave privada"""
        try:
            # Tentar decodificar
            decoded = base58.b58decode(private_key_wif)
            
            # Verificar tamanho (33 ou 34 bytes)
            if len(decoded) not in [33, 34]:
                return False
            
            # Verificar prefixo (0x80 para mainnet)
            if decoded[0] != 0x80:
                return False
            
            # Verificar checksum
            payload = decoded[:-4]
            checksum = decoded[-4:]
            hash_result = hashlib.sha256(hashlib.sha256(payload).digest()).digest()
            
            return checksum == hash_result[:4]
            
        except Exception:
            return False
    
    def sign_transaction_input(self, transaction_hash: str, input_index: int, 
                             private_key_wif: str, prev_script: str, 
                             sighash_type: int = 1) -> str:
        """Assina um input de transação"""
        try:
            print(f"✍️ Assinando input {input_index} da transação")
            
            # Converter chave privada para formato interno
            private_key_bytes = bitcoin.decode_privkey(private_key_wif, 'wif')
            
            # Criar hash da transação para assinatura
            sig_hash = self.create_signature_hash(
                transaction_hash, input_index, prev_script, sighash_type
            )
            
            # Assinar usando ECDSA
            signing_key = SigningKey.from_string(
                private_key_bytes.to_bytes(32, 'big'), 
                curve=SECP256k1
            )
            
            signature = signing_key.sign_digest(
                bytes.fromhex(sig_hash), 
                sigencode=sigencode_der
            )
            
            # Adicionar sighash type
            signature_with_sighash = signature + bytes([sighash_type])
            
            # Converter para hex
            signature_hex = signature_with_sighash.hex()
            
            print(f"✅ Assinatura criada: {signature_hex[:20]}...{signature_hex[-20:]}")
            
            return signature_hex
            
        except Exception as e:
            print(f"❌ Erro ao assinar transação: {e}")
            return None
    
    def create_signature_hash(self, transaction_hex: str, input_index: int, 
                            prev_script: str, sighash_type: int) -> str:
        """Cria hash para assinatura de transação"""
        try:
            # Esta é uma implementação simplificada
            # Em produção, usar biblioteca Bitcoin completa
            
            # Combinar dados da transação
            data_to_hash = transaction_hex + str(input_index) + prev_script + str(sighash_type)
            
            # Duplo SHA256
            hash1 = hashlib.sha256(data_to_hash.encode()).digest()
            hash2 = hashlib.sha256(hash1).digest()
            
            return hash2.hex()
            
        except Exception as e:
            print(f"❌ Erro ao criar hash de assinatura: {e}")
            return None
    
    def create_script_sig(self, signature: str, public_key: str) -> str:
        """Cria script de assinatura para input"""
        try:
            # Formato: <signature> <public_key>
            sig_length = len(bytes.fromhex(signature))
            pubkey_length = len(bytes.fromhex(public_key))
            
            script_sig = (
                f"{sig_length:02x}{signature}"
                f"{pubkey_length:02x}{public_key}"
            )
            
            print(f"📝 Script de assinatura criado: {len(script_sig)} chars")
            
            return script_sig
            
        except Exception as e:
            print(f"❌ Erro ao criar script de assinatura: {e}")
            return None
    
    def verify_signature(self, signature: str, public_key: str, 
                        message_hash: str) -> bool:
        """Verifica uma assinatura ECDSA"""
        try:
            # Converter chave pública
            public_key_bytes = bytes.fromhex(public_key)
            
            # Remover sighash type da assinatura
            signature_bytes = bytes.fromhex(signature[:-2])
            
            # Criar chave de verificação
            verifying_key = ecdsa.VerifyingKey.from_string(
                public_key_bytes[1:], curve=SECP256k1
            )
            
            # Verificar assinatura
            is_valid = verifying_key.verify_digest(
                signature_bytes, 
                bytes.fromhex(message_hash)
            )
            
            print(f"🔍 Verificação de assinatura: {'✅ Válida' if is_valid else '❌ Inválida'}")
            
            return is_valid
            
        except Exception as e:
            print(f"❌ Erro na verificação de assinatura: {e}")
            return False
    
    def get_wallet_info(self, address: str) -> Dict:
        """Obtém informações de carteira do cache"""
        return self.keys_cache.get(address)
    
    def list_cached_wallets(self) -> List[str]:
        """Lista endereços de carteiras em cache"""
        return list(self.keys_cache.keys())
    
    def export_wallet(self, address: str, include_private_key: bool = False) -> Dict:
        """Exporta informações de carteira"""
        try:
            wallet_info = self.keys_cache.get(address)
            if not wallet_info:
                return None
            
            export_data = {
                'address': address,
                'public_key': wallet_info['public_key'],
                'network': wallet_info['network'],
                'created_at': wallet_info['created_at'],
                'exported_at': datetime.now().isoformat()
            }
            
            if include_private_key:
                export_data['private_key_wif'] = wallet_info['private_key_wif']
                print("⚠️ Exportação inclui chave privada - manter seguro!")
            
            return export_data
            
        except Exception as e:
            print(f"❌ Erro ao exportar carteira: {e}")
            return None
    
    def clear_cache(self):
        """Limpa cache de chaves (por segurança)"""
        self.keys_cache.clear()
        print("🗑️ Cache de chaves limpo")
    
    def generate_test_wallet(self) -> Dict:
        """Gera carteira de teste com chave conhecida"""
        try:
            # Usar chave privada de teste conhecida (NUNCA usar em produção)
            test_private_key = "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS"
            
            wallet_info = self.create_wallet_from_private_key(test_private_key)
            
            if wallet_info:
                print("🧪 Carteira de teste gerada")
                print("⚠️ APENAS PARA TESTES - NÃO USAR EM PRODUÇÃO")
                
                return wallet_info
            
            return None
            
        except Exception as e:
            print(f"❌ Erro ao gerar carteira de teste: {e}")
            return None

def initialize_bitcoin_key_manager():
    """Inicializa o gerenciador de chaves Bitcoin"""
    print("🔐 Inicializando Bitcoin Key Manager...")
    
    try:
        key_manager = BitcoinKeyManager()
        print("✅ Bitcoin Key Manager inicializado com sucesso!")
        return key_manager
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do sistema de chaves
    key_manager = initialize_bitcoin_key_manager()
    
    if key_manager:
        print("\n🧪 Testando funcionalidades de chaves:")
        
        # Gerar nova chave privada
        print("\n1. Gerando nova chave privada:")
        new_private_key = key_manager.generate_private_key()
        
        if new_private_key:
            # Criar carteira
            print("\n2. Criando carteira:")
            wallet = key_manager.create_wallet_from_private_key(new_private_key)
            
            if wallet:
                address = wallet['addresses']['p2pkh']
                
                # Importar chave
                print("\n3. Importando chave privada:")
                imported = key_manager.import_private_key(new_private_key)
                
                # Exportar carteira
                print("\n4. Exportando carteira (sem chave privada):")
                exported = key_manager.export_wallet(address, include_private_key=False)
                print(f"Exportada: {exported}")
                
                # Listar carteiras
                print("\n5. Carteiras em cache:")
                cached_wallets = key_manager.list_cached_wallets()
                print(f"Endereços: {cached_wallets}")
        
        # Gerar carteira de teste
        print("\n6. Gerando carteira de teste:")
        test_wallet = key_manager.generate_test_wallet()
        
        if test_wallet:
            print(f"Endereço de teste: {test_wallet['addresses']['p2pkh']}")
    else:
        print("❌ Falha na inicialização do Key Manager")

