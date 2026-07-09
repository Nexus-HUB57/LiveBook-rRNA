"""
Bitcoin UTXO Manager - Sistema real de gerenciamento de UTXOs
Implementa funcionalidades reais para consulta e gerenciamento de UTXOs Bitcoin
"""

import requests
import json
import time
from datetime import datetime
from decimal import Decimal
import hashlib
import base58
from typing import List, Dict, Optional, Tuple

class BitcoinUTXOManager:
    """Gerenciador real de UTXOs Bitcoin"""
    
    def __init__(self):
        # APIs para consulta de UTXOs
        self.apis = {
            'blockstream': 'https://blockstream.info/api',
            'blockchain_info': 'https://blockchain.info',
            'blockcypher': 'https://api.blockcypher.com/v1/btc/main'
        }
        
        # Cache de UTXOs
        self.utxo_cache = {}
        self.cache_timeout = 300  # 5 minutos
        
        print("🔧 Bitcoin UTXO Manager inicializado")
        print(f"📡 APIs disponíveis: {list(self.apis.keys())}")
    
    def validate_bitcoin_address(self, address: str) -> bool:
        """Valida se um endereço Bitcoin é válido"""
        try:
            # Verificar formato básico
            if not address or len(address) < 26 or len(address) > 35:
                return False
            
            # Verificar prefixos válidos para mainnet
            valid_prefixes = ['1', '3', 'bc1']
            if not any(address.startswith(prefix) for prefix in valid_prefixes):
                return False
            
            # Para endereços Legacy (1...) e P2SH (3...)
            if address.startswith(('1', '3')):
                try:
                    decoded = base58.b58decode(address)
                    if len(decoded) != 25:
                        return False
                    
                    # Verificar checksum
                    payload = decoded[:-4]
                    checksum = decoded[-4:]
                    hash_result = hashlib.sha256(hashlib.sha256(payload).digest()).digest()
                    
                    return checksum == hash_result[:4]
                except:
                    return False
            
            # Para endereços Bech32 (bc1...)
            elif address.startswith('bc1'):
                # Validação básica para Bech32
                return len(address) >= 42 and all(c in 'qpzry9x8gf2tvdw0s3jn54khce6mua7l' for c in address[3:])
            
            return True
            
        except Exception as e:
            print(f"❌ Erro na validação do endereço: {e}")
            return False
    
    def get_utxos_blockstream(self, address: str) -> List[Dict]:
        """Obtém UTXOs via API Blockstream"""
        try:
            print(f"🔍 Consultando UTXOs via Blockstream: {address}")
            
            url = f"{self.apis['blockstream']}/address/{address}/utxo"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                utxos = response.json()
                
                # Converter para formato padrão
                formatted_utxos = []
                for utxo in utxos:
                    formatted_utxo = {
                        'txid': utxo['txid'],
                        'vout': utxo['vout'],
                        'value': utxo['value'],  # em satoshis
                        'value_btc': utxo['value'] / 100000000,  # em BTC
                        'confirmations': utxo.get('status', {}).get('block_height', 0),
                        'confirmed': utxo.get('status', {}).get('confirmed', False),
                        'script_type': 'unknown',
                        'address': address,
                        'source': 'blockstream'
                    }
                    formatted_utxos.append(formatted_utxo)
                
                print(f"✅ Encontrados {len(formatted_utxos)} UTXOs via Blockstream")
                return formatted_utxos
            else:
                print(f"❌ Erro Blockstream: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Erro na consulta Blockstream: {e}")
            return []
    
    def get_utxos_blockcypher(self, address: str) -> List[Dict]:
        """Obtém UTXOs via API BlockCypher"""
        try:
            print(f"🔍 Consultando UTXOs via BlockCypher: {address}")
            
            url = f"{self.apis['blockcypher']}/addrs/{address}"
            params = {'unspentOnly': 'true', 'includeScript': 'true'}
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                utxos = data.get('txrefs', [])
                
                # Converter para formato padrão
                formatted_utxos = []
                for utxo in utxos:
                    formatted_utxo = {
                        'txid': utxo['tx_hash'],
                        'vout': utxo['tx_output_n'],
                        'value': utxo['value'],  # em satoshis
                        'value_btc': utxo['value'] / 100000000,  # em BTC
                        'confirmations': utxo.get('confirmations', 0),
                        'confirmed': utxo.get('confirmations', 0) > 0,
                        'script_type': utxo.get('script_type', 'unknown'),
                        'address': address,
                        'source': 'blockcypher'
                    }
                    formatted_utxos.append(formatted_utxo)
                
                print(f"✅ Encontrados {len(formatted_utxos)} UTXOs via BlockCypher")
                return formatted_utxos
            else:
                print(f"❌ Erro BlockCypher: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Erro na consulta BlockCypher: {e}")
            return []
    
    def get_utxos_blockchain_info(self, address: str) -> List[Dict]:
        """Obtém UTXOs via API Blockchain.info"""
        try:
            print(f"🔍 Consultando UTXOs via Blockchain.info: {address}")
            
            url = f"{self.apis['blockchain_info']}/unspent"
            params = {'active': address, 'format': 'json'}
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                utxos = data.get('unspent_outputs', [])
                
                # Converter para formato padrão
                formatted_utxos = []
                for utxo in utxos:
                    formatted_utxo = {
                        'txid': utxo['tx_hash_big_endian'],
                        'vout': utxo['tx_output_n'],
                        'value': utxo['value'],  # em satoshis
                        'value_btc': utxo['value'] / 100000000,  # em BTC
                        'confirmations': utxo.get('confirmations', 0),
                        'confirmed': utxo.get('confirmations', 0) > 0,
                        'script_type': 'unknown',
                        'address': address,
                        'source': 'blockchain_info'
                    }
                    formatted_utxos.append(formatted_utxo)
                
                print(f"✅ Encontrados {len(formatted_utxos)} UTXOs via Blockchain.info")
                return formatted_utxos
            else:
                print(f"❌ Erro Blockchain.info: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Erro na consulta Blockchain.info: {e}")
            return []
    
    def get_utxos(self, address: str, use_cache: bool = True) -> List[Dict]:
        """Obtém UTXOs de um endereço usando múltiplas APIs"""
        try:
            # Validar endereço
            if not self.validate_bitcoin_address(address):
                print(f"❌ Endereço Bitcoin inválido: {address}")
                return []
            
            # Verificar cache
            cache_key = f"utxos_{address}"
            if use_cache and cache_key in self.utxo_cache:
                cache_data = self.utxo_cache[cache_key]
                if time.time() - cache_data['timestamp'] < self.cache_timeout:
                    print(f"📋 Usando UTXOs do cache para {address}")
                    return cache_data['utxos']
            
            print(f"🔍 Consultando UTXOs para endereço: {address}")
            
            all_utxos = []
            
            # Tentar múltiplas APIs
            apis_to_try = [
                ('blockstream', self.get_utxos_blockstream),
                ('blockcypher', self.get_utxos_blockcypher),
                ('blockchain_info', self.get_utxos_blockchain_info)
            ]
            
            for api_name, api_func in apis_to_try:
                try:
                    utxos = api_func(address)
                    if utxos:
                        all_utxos.extend(utxos)
                        break  # Usar primeira API que retornar dados
                except Exception as e:
                    print(f"⚠️ Falha na API {api_name}: {e}")
                    continue
            
            # Remover duplicatas baseado em txid + vout
            unique_utxos = {}
            for utxo in all_utxos:
                key = f"{utxo['txid']}:{utxo['vout']}"
                if key not in unique_utxos:
                    unique_utxos[key] = utxo
            
            final_utxos = list(unique_utxos.values())
            
            # Atualizar cache
            self.utxo_cache[cache_key] = {
                'utxos': final_utxos,
                'timestamp': time.time()
            }
            
            total_value = sum(utxo['value_btc'] for utxo in final_utxos)
            print(f"✅ Total de {len(final_utxos)} UTXOs encontrados")
            print(f"💰 Valor total: {total_value:.8f} BTC")
            
            return final_utxos
            
        except Exception as e:
            print(f"❌ Erro ao obter UTXOs: {e}")
            return []
    
    def select_utxos_for_amount(self, utxos: List[Dict], target_amount: float, fee_amount: float = 0.0001) -> Tuple[List[Dict], float]:
        """Seleciona UTXOs para cobrir um valor específico + taxa"""
        try:
            target_satoshis = int((target_amount + fee_amount) * 100000000)
            
            # Ordenar UTXOs por valor (maiores primeiro para minimizar número de inputs)
            sorted_utxos = sorted(utxos, key=lambda x: x['value'], reverse=True)
            
            selected_utxos = []
            total_selected = 0
            
            for utxo in sorted_utxos:
                # Só usar UTXOs confirmados
                if not utxo.get('confirmed', False):
                    continue
                
                selected_utxos.append(utxo)
                total_selected += utxo['value']
                
                if total_selected >= target_satoshis:
                    break
            
            total_selected_btc = total_selected / 100000000
            
            if total_selected >= target_satoshis:
                print(f"✅ UTXOs selecionados: {len(selected_utxos)}")
                print(f"💰 Valor selecionado: {total_selected_btc:.8f} BTC")
                print(f"🎯 Valor necessário: {target_amount + fee_amount:.8f} BTC")
                return selected_utxos, total_selected_btc
            else:
                print(f"❌ Saldo insuficiente")
                print(f"💰 Disponível: {total_selected_btc:.8f} BTC")
                print(f"🎯 Necessário: {target_amount + fee_amount:.8f} BTC")
                return [], 0.0
                
        except Exception as e:
            print(f"❌ Erro na seleção de UTXOs: {e}")
            return [], 0.0
    
    def get_address_balance(self, address: str) -> Dict:
        """Obtém saldo total de um endereço"""
        try:
            utxos = self.get_utxos(address)
            
            total_balance = 0
            confirmed_balance = 0
            unconfirmed_balance = 0
            utxo_count = len(utxos)
            
            for utxo in utxos:
                total_balance += utxo['value_btc']
                
                if utxo.get('confirmed', False):
                    confirmed_balance += utxo['value_btc']
                else:
                    unconfirmed_balance += utxo['value_btc']
            
            balance_info = {
                'address': address,
                'total_balance': total_balance,
                'confirmed_balance': confirmed_balance,
                'unconfirmed_balance': unconfirmed_balance,
                'utxo_count': utxo_count,
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"💰 Saldo para {address}:")
            print(f"   Total: {total_balance:.8f} BTC")
            print(f"   Confirmado: {confirmed_balance:.8f} BTC")
            print(f"   Não confirmado: {unconfirmed_balance:.8f} BTC")
            print(f"   UTXOs: {utxo_count}")
            
            return balance_info
            
        except Exception as e:
            print(f"❌ Erro ao obter saldo: {e}")
            return {
                'address': address,
                'total_balance': 0.0,
                'confirmed_balance': 0.0,
                'unconfirmed_balance': 0.0,
                'utxo_count': 0,
                'error': str(e)
            }
    
    def estimate_transaction_fee(self, input_count: int, output_count: int, fee_rate: float = 1.0) -> float:
        """Estima taxa de transação baseada no tamanho"""
        try:
            # Tamanho estimado da transação em bytes
            # Inputs: ~148 bytes cada
            # Outputs: ~34 bytes cada  
            # Overhead: ~10 bytes
            
            estimated_size = (input_count * 148) + (output_count * 34) + 10
            
            # Taxa em BTC
            fee_btc = (estimated_size * fee_rate) / 100000000
            
            print(f"📊 Estimativa de taxa:")
            print(f"   Inputs: {input_count}")
            print(f"   Outputs: {output_count}")
            print(f"   Tamanho estimado: {estimated_size} bytes")
            print(f"   Taxa por byte: {fee_rate} sat/byte")
            print(f"   Taxa total: {fee_btc:.8f} BTC")
            
            return fee_btc
            
        except Exception as e:
            print(f"❌ Erro na estimativa de taxa: {e}")
            return 0.0001  # Taxa padrão
    
    def clear_cache(self):
        """Limpa o cache de UTXOs"""
        self.utxo_cache.clear()
        print("🗑️ Cache de UTXOs limpo")
    
    def get_cache_stats(self) -> Dict:
        """Retorna estatísticas do cache"""
        return {
            'cached_addresses': len(self.utxo_cache),
            'cache_timeout': self.cache_timeout,
            'timestamp': datetime.now().isoformat()
        }

def initialize_bitcoin_utxo_manager():
    """Inicializa o gerenciador de UTXOs Bitcoin"""
    print("🔧 Inicializando Bitcoin UTXO Manager...")
    
    try:
        utxo_manager = BitcoinUTXOManager()
        print("✅ Bitcoin UTXO Manager inicializado com sucesso!")
        return utxo_manager
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do sistema UTXO
    utxo_manager = initialize_bitcoin_utxo_manager()
    
    if utxo_manager:
        # Testar com endereços conhecidos
        test_addresses = [
            "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",  # Genesis block
            "13m3xop6RnioRX6qrnkavLekv7cvu5DuMK",  # Carteira de custódia
            "bc1qwwgdhzdgy97ysqqtd9z7rwv76fwktg0w4tvwf8"   # Endereço de lucros
        ]
        
        for address in test_addresses:
            print(f"\n🔍 Testando endereço: {address}")
            
            # Validar endereço
            is_valid = utxo_manager.validate_bitcoin_address(address)
            print(f"Válido: {'✅' if is_valid else '❌'}")
            
            if is_valid:
                # Obter saldo
                balance = utxo_manager.get_address_balance(address)
                
                # Obter UTXOs
                utxos = utxo_manager.get_utxos(address)
                
                if utxos:
                    # Testar seleção de UTXOs
                    selected, total = utxo_manager.select_utxos_for_amount(utxos, 0.001)
                    print(f"Seleção para 0.001 BTC: {len(selected)} UTXOs, {total:.8f} BTC")
    else:
        print("❌ Falha na inicialização do UTXO Manager")

