"""
Private Key Validator - Sistema de validação e segurança de chaves privadas
Implementa validações avançadas, verificações de segurança e proteções
"""

import hashlib
import hmac
import base58
import re
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
from bitcoin_key_manager import BitcoinKeyManager

class PrivateKeyValidator:
    """Validador avançado de chaves privadas com verificações de segurança"""
    
    def __init__(self):
        self.bitcoin_key_manager = BitcoinKeyManager()
        
        # Configurações de segurança
        self.security_config = {
            "max_validation_attempts": 5,
            "lockout_duration_minutes": 30,
            "require_checksum_validation": True,
            "check_address_derivation": True,
            "verify_network_compatibility": True,
            "scan_for_balance": True,
            "check_blacklist": True
        }
        
        # Cache de validações
        self.validation_cache = {}
        self.failed_attempts = {}
        
        # Lista de endereços conhecidos perigosos (exemplo)
        self.blacklisted_addresses = {
            "1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF",  # Endereço conhecido de exchange hackeada
            "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",   # Endereço suspeito
        }
        
        print("🔒 Private Key Validator inicializado")
        print("🛡️ Verificações de segurança ativadas")
    
    def validate_private_key_comprehensive(self, private_key_wif: str, 
                                         address: str = None) -> Dict:
        """Validação abrangente de chave privada"""
        try:
            print(f"🔍 Iniciando validação abrangente da chave privada...")
            
            validation_result = {
                "valid": False,
                "checks": {},
                "warnings": [],
                "errors": [],
                "security_score": 0,
                "derived_address": None,
                "balance_info": None,
                "timestamp": datetime.now().isoformat()
            }
            
            # 1. Validação de formato básico
            print("1️⃣ Validando formato WIF...")
            format_check = self._validate_wif_format(private_key_wif)
            validation_result["checks"]["format"] = format_check
            
            if not format_check["valid"]:
                validation_result["errors"].extend(format_check["errors"])
                return validation_result
            
            # 2. Validação de checksum
            print("2️⃣ Validando checksum...")
            checksum_check = self._validate_wif_checksum(private_key_wif)
            validation_result["checks"]["checksum"] = checksum_check
            
            if not checksum_check["valid"]:
                validation_result["errors"].extend(checksum_check["errors"])
                return validation_result
            
            # 3. Derivação de endereço
            print("3️⃣ Derivando endereço...")
            derivation_check = self._derive_and_validate_address(private_key_wif, address)
            validation_result["checks"]["derivation"] = derivation_check
            validation_result["derived_address"] = derivation_check.get("derived_address")
            
            if not derivation_check["valid"]:
                validation_result["errors"].extend(derivation_check["errors"])
                return validation_result
            
            # 4. Verificação de rede
            print("4️⃣ Verificando compatibilidade de rede...")
            network_check = self._validate_network_compatibility(private_key_wif)
            validation_result["checks"]["network"] = network_check
            
            if not network_check["valid"]:
                validation_result["warnings"].extend(network_check["warnings"])
            
            # 5. Verificação de blacklist
            print("5️⃣ Verificando blacklist...")
            blacklist_check = self._check_blacklist(validation_result["derived_address"])
            validation_result["checks"]["blacklist"] = blacklist_check
            
            if not blacklist_check["valid"]:
                validation_result["errors"].extend(blacklist_check["errors"])
                return validation_result
            
            # 6. Verificação de saldo (opcional)
            if self.security_config["scan_for_balance"]:
                print("6️⃣ Verificando saldo...")
                balance_check = self._check_address_balance(validation_result["derived_address"])
                validation_result["checks"]["balance"] = balance_check
                validation_result["balance_info"] = balance_check.get("balance_info")
            
            # 7. Cálculo de score de segurança
            print("7️⃣ Calculando score de segurança...")
            security_score = self._calculate_security_score(validation_result["checks"])
            validation_result["security_score"] = security_score
            
            # 8. Verificações adicionais de segurança
            print("8️⃣ Verificações adicionais...")
            additional_checks = self._additional_security_checks(private_key_wif)
            validation_result["checks"]["additional"] = additional_checks
            validation_result["warnings"].extend(additional_checks.get("warnings", []))
            
            # Determinar se a validação foi bem-sucedida
            validation_result["valid"] = (
                len(validation_result["errors"]) == 0 and
                security_score >= 70  # Score mínimo de 70%
            )
            
            if validation_result["valid"]:
                print("✅ Validação abrangente concluída com sucesso")
            else:
                print("❌ Validação falhou - verificar erros")
            
            return validation_result
            
        except Exception as e:
            print(f"❌ Erro na validação abrangente: {e}")
            return {
                "valid": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _validate_wif_format(self, private_key_wif: str) -> Dict:
        """Valida formato WIF da chave privada"""
        try:
            result = {"valid": True, "errors": [], "details": {}}
            
            # Verificar se não está vazio
            if not private_key_wif:
                result["valid"] = False
                result["errors"].append("Chave privada vazia")
                return result
            
            # Verificar comprimento
            if len(private_key_wif) not in [51, 52]:
                result["valid"] = False
                result["errors"].append(f"Comprimento inválido: {len(private_key_wif)} (esperado: 51 ou 52)")
                return result
            
            # Verificar primeiro caractere (indicador de rede)
            first_char = private_key_wif[0]
            if first_char not in ['5', 'K', 'L', '9', 'c']:
                result["valid"] = False
                result["errors"].append(f"Primeiro caractere inválido: {first_char}")
                return result
            
            # Determinar tipo de chave
            if first_char == '5':
                result["details"]["type"] = "uncompressed_mainnet"
                result["details"]["network"] = "mainnet"
                result["details"]["compressed"] = False
            elif first_char in ['K', 'L']:
                result["details"]["type"] = "compressed_mainnet"
                result["details"]["network"] = "mainnet"
                result["details"]["compressed"] = True
            elif first_char == '9':
                result["details"]["type"] = "uncompressed_testnet"
                result["details"]["network"] = "testnet"
                result["details"]["compressed"] = False
            elif first_char == 'c':
                result["details"]["type"] = "compressed_testnet"
                result["details"]["network"] = "testnet"
                result["details"]["compressed"] = True
            
            # Verificar caracteres válidos (Base58)
            valid_chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
            for i, char in enumerate(private_key_wif):
                if char not in valid_chars:
                    result["valid"] = False
                    result["errors"].append(f"Caractere inválido na posição {i}: {char}")
                    return result
            
            print(f"✅ Formato WIF válido: {result['details']['type']}")
            return result
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Erro na validação de formato: {e}"]
            }
    
    def _validate_wif_checksum(self, private_key_wif: str) -> Dict:
        """Valida checksum da chave privada WIF"""
        try:
            result = {"valid": True, "errors": [], "checksum_verified": False}
            
            try:
                # Decodificar Base58
                decoded = base58.b58decode(private_key_wif)
                
                if len(decoded) < 4:
                    result["valid"] = False
                    result["errors"].append("Dados decodificados muito curtos")
                    return result
                
                # Separar payload e checksum
                payload = decoded[:-4]
                checksum = decoded[-4:]
                
                # Calcular checksum esperado
                hash1 = hashlib.sha256(payload).digest()
                hash2 = hashlib.sha256(hash1).digest()
                expected_checksum = hash2[:4]
                
                # Verificar checksum
                if checksum == expected_checksum:
                    result["checksum_verified"] = True
                    print("✅ Checksum WIF válido")
                else:
                    result["valid"] = False
                    result["errors"].append("Checksum WIF inválido")
                    print("❌ Checksum WIF inválido")
                
                return result
                
            except Exception as decode_error:
                result["valid"] = False
                result["errors"].append(f"Erro na decodificação Base58: {decode_error}")
                return result
                
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Erro na validação de checksum: {e}"]
            }
    
    def _derive_and_validate_address(self, private_key_wif: str, expected_address: str = None) -> Dict:
        """Deriva endereço da chave privada e valida"""
        try:
            result = {"valid": True, "errors": [], "derived_address": None, "matches_expected": None}
            
            # Usar BitcoinKeyManager para derivar endereço
            wallet_info = self.bitcoin_key_manager.create_wallet_from_private_key(private_key_wif)
            
            if not wallet_info:
                result["valid"] = False
                result["errors"].append("Falha na derivação do endereço")
                return result
            
            derived_address = wallet_info["addresses"]["p2pkh"]
            result["derived_address"] = derived_address
            
            print(f"📍 Endereço derivado: {derived_address}")
            
            # Se endereço esperado foi fornecido, comparar
            if expected_address:
                if derived_address == expected_address:
                    result["matches_expected"] = True
                    print("✅ Endereço derivado corresponde ao esperado")
                else:
                    result["matches_expected"] = False
                    result["errors"].append(f"Endereço derivado ({derived_address}) não corresponde ao esperado ({expected_address})")
                    result["valid"] = False
            
            return result
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Erro na derivação de endereço: {e}"]
            }
    
    def _validate_network_compatibility(self, private_key_wif: str) -> Dict:
        """Valida compatibilidade com a rede Bitcoin"""
        try:
            result = {"valid": True, "warnings": [], "network": None}
            
            first_char = private_key_wif[0]
            
            if first_char in ['5', 'K', 'L']:
                result["network"] = "mainnet"
                print("🌐 Rede: Bitcoin Mainnet")
            elif first_char in ['9', 'c']:
                result["network"] = "testnet"
                result["warnings"].append("Chave privada é para testnet, não mainnet")
                print("⚠️ Rede: Bitcoin Testnet")
            else:
                result["valid"] = False
                result["warnings"].append("Rede não identificada")
            
            return result
            
        except Exception as e:
            return {
                "valid": False,
                "warnings": [f"Erro na validação de rede: {e}"]
            }
    
    def _check_blacklist(self, address: str) -> Dict:
        """Verifica se endereço está em blacklist"""
        try:
            result = {"valid": True, "errors": [], "blacklisted": False}
            
            if not address:
                return result
            
            if address in self.blacklisted_addresses:
                result["valid"] = False
                result["blacklisted"] = True
                result["errors"].append(f"Endereço está na blacklist: {address}")
                print(f"🚫 Endereço blacklisted: {address}")
            else:
                print("✅ Endereço não está na blacklist")
            
            return result
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Erro na verificação de blacklist: {e}"]
            }
    
    def _check_address_balance(self, address: str) -> Dict:
        """Verifica saldo do endereço"""
        try:
            result = {"valid": True, "errors": [], "balance_info": None}
            
            if not address:
                return result
            
            # Usar API BlockCypher para verificar saldo
            try:
                url = f"https://api.blockcypher.com/v1/btc/main/addrs/{address}/balance"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    balance_info = {
                        "balance_satoshis": data.get("balance", 0),
                        "balance_btc": data.get("balance", 0) / 100000000,
                        "unconfirmed_balance": data.get("unconfirmed_balance", 0),
                        "total_received": data.get("total_received", 0),
                        "total_sent": data.get("total_sent", 0),
                        "n_tx": data.get("n_tx", 0)
                    }
                    
                    result["balance_info"] = balance_info
                    
                    if balance_info["balance_btc"] > 0:
                        print(f"💰 Saldo encontrado: {balance_info['balance_btc']} BTC")
                    else:
                        print("💰 Sem saldo confirmado")
                        
                else:
                    result["errors"].append(f"Erro na consulta de saldo: {response.status_code}")
                    
            except requests.RequestException as e:
                result["errors"].append(f"Erro na requisição de saldo: {e}")
            
            return result
            
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Erro na verificação de saldo: {e}"]
            }
    
    def _additional_security_checks(self, private_key_wif: str) -> Dict:
        """Verificações adicionais de segurança"""
        try:
            result = {"warnings": [], "checks": {}}
            
            # 1. Verificar se chave não é muito simples
            if self._is_weak_private_key(private_key_wif):
                result["warnings"].append("Chave privada pode ser fraca ou previsível")
            
            # 2. Verificar padrões suspeitos
            if self._has_suspicious_patterns(private_key_wif):
                result["warnings"].append("Chave privada contém padrões suspeitos")
            
            # 3. Verificar se não é uma chave conhecida de teste
            if self._is_known_test_key(private_key_wif):
                result["warnings"].append("Esta é uma chave privada de teste conhecida")
            
            result["checks"]["weak_key"] = not self._is_weak_private_key(private_key_wif)
            result["checks"]["no_suspicious_patterns"] = not self._has_suspicious_patterns(private_key_wif)
            result["checks"]["not_test_key"] = not self._is_known_test_key(private_key_wif)
            
            return result
            
        except Exception as e:
            return {
                "warnings": [f"Erro nas verificações adicionais: {e}"],
                "checks": {}
            }
    
    def _is_weak_private_key(self, private_key_wif: str) -> bool:
        """Verifica se chave privada é fraca"""
        try:
            # Verificar padrões repetitivos
            if len(set(private_key_wif)) < 10:  # Muito poucos caracteres únicos
                return True
            
            # Verificar sequências
            for i in range(len(private_key_wif) - 5):
                substring = private_key_wif[i:i+6]
                if substring == substring[0] * 6:  # 6 caracteres iguais seguidos
                    return True
            
            return False
            
        except Exception:
            return False
    
    def _has_suspicious_patterns(self, private_key_wif: str) -> bool:
        """Verifica padrões suspeitos na chave"""
        try:
            # Padrões suspeitos conhecidos
            suspicious_patterns = [
                r'123456',
                r'abcdef',
                r'000000',
                r'111111',
                r'aaaaaa',
                r'zzzzzz'
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, private_key_wif, re.IGNORECASE):
                    return True
            
            return False
            
        except Exception:
            return False
    
    def _is_known_test_key(self, private_key_wif: str) -> bool:
        """Verifica se é uma chave de teste conhecida"""
        try:
            known_test_keys = [
                "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS",
                "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ",
                "5J3mBbAH58CpQ3Y5RNJpUKPE62SQ5tfcvU2JpbnkeyhfsYB1Jcn"
            ]
            
            return private_key_wif in known_test_keys
            
        except Exception:
            return False
    
    def _calculate_security_score(self, checks: Dict) -> int:
        """Calcula score de segurança baseado nas verificações"""
        try:
            score = 0
            max_score = 100
            
            # Pontuação por verificação
            if checks.get("format", {}).get("valid", False):
                score += 20
            
            if checks.get("checksum", {}).get("valid", False):
                score += 20
            
            if checks.get("derivation", {}).get("valid", False):
                score += 20
            
            if checks.get("network", {}).get("valid", False):
                score += 10
            
            if checks.get("blacklist", {}).get("valid", False):
                score += 15
            
            # Verificações adicionais
            additional = checks.get("additional", {}).get("checks", {})
            if additional.get("weak_key", False):
                score += 5
            
            if additional.get("no_suspicious_patterns", False):
                score += 5
            
            if additional.get("not_test_key", False):
                score += 5
            
            return min(score, max_score)
            
        except Exception:
            return 0
    
    def validate_multiple_keys(self, keys_data: List[Dict]) -> Dict:
        """Valida múltiplas chaves privadas"""
        try:
            print(f"🔍 Validando {len(keys_data)} chaves privadas...")
            
            results = {
                "total_keys": len(keys_data),
                "valid_keys": 0,
                "invalid_keys": 0,
                "warnings_count": 0,
                "validations": [],
                "summary": {}
            }
            
            for i, key_data in enumerate(keys_data):
                print(f"\n📋 Validando chave {i+1}/{len(keys_data)}...")
                
                private_key = key_data.get("private_key")
                address = key_data.get("address")
                
                validation = self.validate_private_key_comprehensive(private_key, address)
                validation["key_index"] = i
                validation["key_id"] = key_data.get("id", f"key_{i}")
                
                results["validations"].append(validation)
                
                if validation["valid"]:
                    results["valid_keys"] += 1
                else:
                    results["invalid_keys"] += 1
                
                results["warnings_count"] += len(validation.get("warnings", []))
            
            # Criar resumo
            results["summary"] = {
                "success_rate": (results["valid_keys"] / results["total_keys"]) * 100,
                "average_security_score": sum(v.get("security_score", 0) for v in results["validations"]) / len(results["validations"]),
                "total_balance_found": sum(v.get("balance_info", {}).get("balance_btc", 0) for v in results["validations"]),
                "validation_completed_at": datetime.now().isoformat()
            }
            
            print(f"\n✅ Validação concluída:")
            print(f"   Válidas: {results['valid_keys']}/{results['total_keys']}")
            print(f"   Taxa de sucesso: {results['summary']['success_rate']:.1f}%")
            print(f"   Score médio: {results['summary']['average_security_score']:.1f}")
            
            return results
            
        except Exception as e:
            print(f"❌ Erro na validação múltipla: {e}")
            return {"error": str(e)}

def initialize_private_key_validator():
    """Inicializa o validador de chaves privadas"""
    print("🔒 Inicializando Private Key Validator...")
    
    try:
        validator = PrivateKeyValidator()
        print("✅ Private Key Validator inicializado com sucesso!")
        return validator
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do validador
    validator = initialize_private_key_validator()
    
    if validator:
        print("\n🧪 Testando validação abrangente:")
        
        # Teste com chave conhecida
        test_key = "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS"
        test_address = "1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T"
        
        result = validator.validate_private_key_comprehensive(test_key, test_address)
        
        print(f"\n📊 Resultado da validação:")
        print(f"   Válida: {'✅' if result['valid'] else '❌'}")
        print(f"   Score de segurança: {result['security_score']}/100")
        print(f"   Endereço derivado: {result['derived_address']}")
        print(f"   Erros: {len(result['errors'])}")
        print(f"   Avisos: {len(result['warnings'])}")
        
        if result.get("balance_info"):
            balance = result["balance_info"]["balance_btc"]
            print(f"   Saldo: {balance} BTC")
    else:
        print("❌ Falha na inicialização do validador")

