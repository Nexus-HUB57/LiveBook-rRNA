"""
Módulo avançado para análise de carteiras de criptomoedas
Suporta múltiplos formatos: Bitcoin Core, Electrum, Ethereum Keystore, etc.
"""
import os
import json
import struct
import hashlib
import base64
from typing import Dict, List, Optional, Any, Tuple
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2, scrypt
import binascii

class AdvancedWalletAnalyzer:
    """Classe avançada para análise de múltiplos formatos de carteira"""
    
    def __init__(self):
        self.supported_formats = {
            'bitcoin_core': ['.dat'],
            'electrum': ['.wallet'],
            'ethereum_keystore': ['.json'],
            'exodus': ['.json'],
            'multibit': ['.wallet', '.key'],
            'armory': ['.wallet'],
            'blockchain_info': ['.json']
        }
    
    def analyze_wallet_comprehensive(self, file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """
        Análise abrangente de carteira com detecção automática de formato
        """
        try:
            base_info = {
                'filename': os.path.basename(file_path),
                'filepath': file_path,
                'size_bytes': os.path.getsize(file_path),
                'size_formatted': self._format_file_size(os.path.getsize(file_path)),
                'format_detected': None,
                'wallet_type': None,
                'encrypted': False,
                'encryption_method': None,
                'keys_count': 0,
                'addresses_count': 0,
                'transactions_count': 0,
                'creation_date': None,
                'last_modified': os.path.getmtime(file_path),
                'integrity_check': 'unknown',
                'supported_operations': [],
                'security_level': 'unknown',
                'metadata': {},
                'error': None
            }
            
            # Detecta o formato da carteira
            format_info = self._detect_wallet_format(file_path)
            base_info.update(format_info)
            
            # Análise específica por formato
            if base_info['wallet_type'] == 'bitcoin_core':
                analysis = self._analyze_bitcoin_core(file_path, password)
            elif base_info['wallet_type'] == 'electrum':
                analysis = self._analyze_electrum_wallet(file_path, password)
            elif base_info['wallet_type'] == 'ethereum_keystore':
                analysis = self._analyze_ethereum_keystore(file_path, password)
            elif base_info['wallet_type'] == 'exodus':
                analysis = self._analyze_exodus_wallet(file_path, password)
            else:
                analysis = self._analyze_generic_wallet(file_path)
            
            base_info.update(analysis)
            
            # Avaliação de segurança
            base_info['security_level'] = self._evaluate_security_level(base_info)
            
            # Operações suportadas
            base_info['supported_operations'] = self._get_supported_operations(base_info)
            
            return base_info
            
        except Exception as e:
            return {
                'filename': os.path.basename(file_path),
                'error': f"Erro na análise: {str(e)}",
                'wallet_type': 'unknown',
                'encrypted': False,
                'keys_count': 0,
                'addresses_count': 0
            }
    
    def _detect_wallet_format(self, file_path: str) -> Dict[str, Any]:
        """Detecta o formato da carteira baseado em assinaturas e estrutura"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(64)
                f.seek(0)
                content = f.read(1024)  # Primeiros 1KB para análise
            
            file_ext = os.path.splitext(file_path)[1].lower()
            
            # Bitcoin Core wallet.dat (Berkeley DB)
            if header.startswith(b'\x00\x00\x00\x00\x62\x31\x05\x00'):
                return {
                    'format_detected': 'Berkeley DB',
                    'wallet_type': 'bitcoin_core',
                    'version_info': 'Bitcoin Core wallet.dat'
                }
            
            # Electrum wallet
            if file_ext == '.wallet':
                try:
                    f.seek(0)
                    test_content = f.read().decode('utf-8', errors='ignore')
                    if 'electrum' in test_content.lower() or 'seed_version' in test_content:
                        return {
                            'format_detected': 'Electrum JSON',
                            'wallet_type': 'electrum',
                            'version_info': 'Electrum wallet file'
                        }
                except:
                    pass
            
            # Ethereum Keystore
            if file_ext == '.json':
                try:
                    f.seek(0)
                    json_content = json.load(f)
                    if 'crypto' in json_content and 'kdf' in json_content.get('crypto', {}):
                        return {
                            'format_detected': 'Ethereum Keystore',
                            'wallet_type': 'ethereum_keystore',
                            'version_info': f"Keystore version {json_content.get('version', 'unknown')}"
                        }
                    elif 'mnemonic' in json_content or 'exodus' in str(json_content).lower():
                        return {
                            'format_detected': 'Exodus JSON',
                            'wallet_type': 'exodus',
                            'version_info': 'Exodus wallet backup'
                        }
                except:
                    pass
            
            # SQLite (alguns wallets modernos)
            if header.startswith(b'SQLite format 3'):
                return {
                    'format_detected': 'SQLite Database',
                    'wallet_type': 'sqlite_wallet',
                    'version_info': 'SQLite-based wallet'
                }
            
            return {
                'format_detected': 'Unknown',
                'wallet_type': 'unknown',
                'version_info': 'Formato não reconhecido'
            }
            
        except Exception as e:
            return {
                'format_detected': 'Error',
                'wallet_type': 'unknown',
                'version_info': f'Erro na detecção: {str(e)}'
            }
    
    def _analyze_bitcoin_core(self, file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Análise específica para Bitcoin Core wallet.dat"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Procura por padrões específicos
            keys_count = content.count(b'key')
            addresses_count = content.count(b'name')
            transactions_count = content.count(b'tx')
            
            # Verifica criptografia
            encrypted = b'mkey' in content or b'crypt' in content
            encryption_method = 'AES-256-CBC' if encrypted else None
            
            # Procura por versão
            version_info = self._extract_bitcoin_version(content)
            
            return {
                'encrypted': encrypted,
                'encryption_method': encryption_method,
                'keys_count': keys_count,
                'addresses_count': addresses_count,
                'transactions_count': transactions_count,
                'integrity_check': 'valid' if keys_count > 0 else 'suspicious',
                'metadata': {
                    'version': version_info,
                    'has_master_key': b'mkey' in content,
                    'has_default_key': b'defaultkey' in content,
                    'estimated_addresses': addresses_count
                }
            }
            
        except Exception as e:
            return {
                'encrypted': False,
                'keys_count': 0,
                'addresses_count': 0,
                'error': f'Erro na análise Bitcoin Core: {str(e)}'
            }
    
    def _analyze_electrum_wallet(self, file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Análise específica para carteiras Electrum"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                wallet_data = json.load(f)
            
            # Extrai informações básicas
            encrypted = 'seed' not in wallet_data and 'xprv' not in wallet_data
            seed_version = wallet_data.get('seed_version', 'unknown')
            
            # Conta chaves e endereços
            keystore = wallet_data.get('keystore', {})
            addresses = wallet_data.get('addresses', {})
            
            keys_count = len(keystore.get('keypairs', {})) if 'keypairs' in keystore else 0
            addresses_count = len(addresses)
            
            # Verifica tipo de carteira
            wallet_type_detail = 'standard'
            if 'x1/' in str(wallet_data):
                wallet_type_detail = 'multisig'
            elif 'seed_type' in wallet_data:
                wallet_type_detail = wallet_data['seed_type']
            
            return {
                'encrypted': encrypted,
                'encryption_method': 'Electrum native' if encrypted else None,
                'keys_count': keys_count,
                'addresses_count': addresses_count,
                'integrity_check': 'valid',
                'metadata': {
                    'seed_version': seed_version,
                    'wallet_type': wallet_type_detail,
                    'use_encryption': wallet_data.get('use_encryption', False),
                    'gap_limit': wallet_data.get('gap_limit', 20)
                }
            }
            
        except Exception as e:
            return {
                'encrypted': False,
                'keys_count': 0,
                'addresses_count': 0,
                'error': f'Erro na análise Electrum: {str(e)}'
            }
    
    def _analyze_ethereum_keystore(self, file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Análise específica para Ethereum Keystore"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                keystore_data = json.load(f)
            
            crypto_data = keystore_data.get('crypto', {})
            kdf = crypto_data.get('kdf', 'unknown')
            cipher = crypto_data.get('cipher', 'unknown')
            
            # Ethereum keystores são sempre criptografados
            encrypted = True
            encryption_method = f"{kdf.upper()} + {cipher}"
            
            # Extrai endereço
            address = keystore_data.get('address', '')
            if address and not address.startswith('0x'):
                address = '0x' + address
            
            return {
                'encrypted': encrypted,
                'encryption_method': encryption_method,
                'keys_count': 1,  # Keystore contém uma chave privada
                'addresses_count': 1,
                'integrity_check': 'valid',
                'metadata': {
                    'version': keystore_data.get('version', 3),
                    'kdf': kdf,
                    'cipher': cipher,
                    'address': address,
                    'id': keystore_data.get('id', '')
                }
            }
            
        except Exception as e:
            return {
                'encrypted': True,
                'keys_count': 0,
                'addresses_count': 0,
                'error': f'Erro na análise Ethereum: {str(e)}'
            }
    
    def _analyze_exodus_wallet(self, file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Análise específica para carteiras Exodus"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                exodus_data = json.load(f)
            
            # Exodus geralmente armazena mnemonic criptografado
            encrypted = 'mnemonic' not in exodus_data or isinstance(exodus_data.get('mnemonic'), dict)
            
            # Estima número de chaves baseado em moedas suportadas
            assets = exodus_data.get('assets', {})
            keys_count = len(assets) if assets else 1
            
            return {
                'encrypted': encrypted,
                'encryption_method': 'Exodus proprietary' if encrypted else None,
                'keys_count': keys_count,
                'addresses_count': keys_count,
                'integrity_check': 'valid',
                'metadata': {
                    'backup_type': 'exodus',
                    'assets_count': len(assets),
                    'has_mnemonic': 'mnemonic' in exodus_data
                }
            }
            
        except Exception as e:
            return {
                'encrypted': False,
                'keys_count': 0,
                'addresses_count': 0,
                'error': f'Erro na análise Exodus: {str(e)}'
            }
    
    def _analyze_generic_wallet(self, file_path: str) -> Dict[str, Any]:
        """Análise genérica para formatos desconhecidos"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Procura por padrões comuns
            keys_patterns = [b'key', b'priv', b'secret']
            addresses_patterns = [b'addr', b'address', b'1', b'3', b'bc1']
            crypto_patterns = [b'crypt', b'encrypt', b'aes', b'cipher']
            
            keys_count = sum(content.count(pattern) for pattern in keys_patterns)
            addresses_count = sum(content.count(pattern) for pattern in addresses_patterns)
            encrypted = any(pattern in content for pattern in crypto_patterns)
            
            return {
                'encrypted': encrypted,
                'encryption_method': 'Unknown' if encrypted else None,
                'keys_count': keys_count,
                'addresses_count': addresses_count,
                'integrity_check': 'unknown',
                'metadata': {
                    'analysis_type': 'pattern_matching',
                    'confidence': 'low'
                }
            }
            
        except Exception as e:
            return {
                'encrypted': False,
                'keys_count': 0,
                'addresses_count': 0,
                'error': f'Erro na análise genérica: {str(e)}'
            }
    
    def _extract_bitcoin_version(self, content: bytes) -> str:
        """Extrai informação de versão do Bitcoin Core"""
        try:
            # Procura por padrões de versão
            version_patterns = [b'version', b'CLIENT_VERSION']
            for pattern in version_patterns:
                pos = content.find(pattern)
                if pos != -1:
                    # Tenta extrair número de versão próximo
                    nearby = content[pos:pos+50]
                    return f"Bitcoin Core (version info found at offset {pos})"
            return "Bitcoin Core (version unknown)"
        except:
            return "Bitcoin Core"
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Formata tamanho do arquivo em unidades legíveis"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    def _evaluate_security_level(self, wallet_info: Dict[str, Any]) -> str:
        """Avalia o nível de segurança da carteira"""
        score = 0
        
        # Criptografia
        if wallet_info.get('encrypted'):
            score += 3
        
        # Tipo de criptografia
        encryption = wallet_info.get('encryption_method', '')
        if 'AES' in encryption:
            score += 2
        elif 'scrypt' in encryption.lower():
            score += 2
        elif 'pbkdf2' in encryption.lower():
            score += 1
        
        # Integridade
        if wallet_info.get('integrity_check') == 'valid':
            score += 2
        
        # Número de chaves (mais chaves = mais complexo = mais seguro)
        keys_count = wallet_info.get('keys_count', 0)
        if keys_count > 10:
            score += 2
        elif keys_count > 1:
            score += 1
        
        # Classificação
        if score >= 7:
            return 'high'
        elif score >= 4:
            return 'medium'
        elif score >= 2:
            return 'low'
        else:
            return 'very_low'
    
    def _get_supported_operations(self, wallet_info: Dict[str, Any]) -> List[str]:
        """Retorna lista de operações suportadas para o tipo de carteira"""
        operations = ['view_metadata', 'integrity_check']
        
        wallet_type = wallet_info.get('wallet_type')
        
        if wallet_type == 'bitcoin_core':
            operations.extend(['extract_addresses', 'transaction_history'])
        elif wallet_type == 'electrum':
            operations.extend(['extract_addresses', 'seed_recovery'])
        elif wallet_type == 'ethereum_keystore':
            operations.extend(['extract_address', 'key_derivation'])
        
        if wallet_info.get('encrypted'):
            operations.append('password_recovery')
        else:
            operations.append('key_extraction')
        
        return operations
    
    def generate_analysis_report(self, wallet_info: Dict[str, Any]) -> str:
        """Gera relatório detalhado da análise"""
        report = f"""
=== RELATÓRIO DE ANÁLISE DE CARTEIRA ===

Arquivo: {wallet_info.get('filename', 'N/A')}
Tamanho: {wallet_info.get('size_formatted', 'N/A')}
Tipo: {wallet_info.get('wallet_type', 'N/A')}
Formato: {wallet_info.get('format_detected', 'N/A')}

=== SEGURANÇA ===
Criptografada: {'Sim' if wallet_info.get('encrypted') else 'Não'}
Método de Criptografia: {wallet_info.get('encryption_method', 'N/A')}
Nível de Segurança: {wallet_info.get('security_level', 'N/A').upper()}

=== CONTEÚDO ===
Chaves Encontradas: {wallet_info.get('keys_count', 0)}
Endereços Encontrados: {wallet_info.get('addresses_count', 0)}
Transações: {wallet_info.get('transactions_count', 0)}
Integridade: {wallet_info.get('integrity_check', 'N/A')}

=== OPERAÇÕES SUPORTADAS ===
{chr(10).join('- ' + op for op in wallet_info.get('supported_operations', []))}

=== METADADOS ===
"""
        
        metadata = wallet_info.get('metadata', {})
        for key, value in metadata.items():
            report += f"{key}: {value}\n"
        
        if wallet_info.get('error'):
            report += f"\n=== ERROS ===\n{wallet_info['error']}"
        
        return report

