#!/usr/bin/env python3
"""
Validação de Saldos Atuais das Carteiras
Verifica saldos reais após transferência de 89,73 BTC
"""

import json
import time
import requests
from datetime import datetime

class BalanceValidator:
    """Sistema para validação de saldos das carteiras"""
    
    def __init__(self):
        self.apis = {
            "blockstream": "https://blockstream.info/api",
            "blockchain_info": "https://blockchain.info"
        }
        
        # Carteiras do sistema
        self.wallets = {
            "main_wallet": {
                "address": "12ib7dApVFvg82TXKycWBNpN8kFyiAN1dr",
                "description": "Carteira principal (31.000 BTC)",
                "expected_balance": 31000.08,
                "priority": 1
            },
            "transferred_wallet": {
                "address": "1Xcdre9pAipV9kiSrSgssEpQPAruzMFzr", 
                "description": "Carteira transferida (89,73 BTC → 0 BTC)",
                "expected_balance": 0.0,
                "priority": 2
            },
            "custody_wallet": {
                "address": "13m3xop6RnioRX6qrnkavLekv7cvu5DuMK",
                "description": "Carteira de custódia Binance",
                "expected_balance": 89.73,
                "priority": 1
            },
            "small_wallet_1": {
                "address": "1299FyEzJoPZbaKJUnpAVKNzwKPMUADAzu",
                "description": "Carteira pequena 1",
                "expected_balance": 0.01951,
                "priority": 3
            },
            "small_wallet_2": {
                "address": "1CvtJkfyErRDdmrv5SSv3tHVZBxt26GJV7",
                "description": "Carteira pequena 2", 
                "expected_balance": 0.01079,
                "priority": 3
            },
            "small_wallet_3": {
                "address": "1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY",
                "description": "Carteira pequena 3",
                "expected_balance": 0.00326,
                "priority": 3
            }
        }
    
    def get_real_balance(self, address):
        """Obtém saldo real de uma carteira via API"""
        try:
            print(f"🔍 Verificando {address[:20]}...")
            
            # Usar Blockstream API
            url = f"{self.apis['blockstream']}/address/{address}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                funded = data.get('chain_stats', {}).get('funded_txo_sum', 0)
                spent = data.get('chain_stats', {}).get('spent_txo_sum', 0)
                balance = funded - spent
                
                balance_btc = balance / 100_000_000
                
                # Verificar transações não confirmadas
                mempool_funded = data.get('mempool_stats', {}).get('funded_txo_sum', 0)
                mempool_spent = data.get('mempool_stats', {}).get('spent_txo_sum', 0)
                mempool_balance = mempool_funded - mempool_spent
                mempool_btc = mempool_balance / 100_000_000
                
                return {
                    'confirmed_balance_btc': balance_btc,
                    'confirmed_balance_satoshis': balance,
                    'mempool_balance_btc': mempool_btc,
                    'mempool_balance_satoshis': mempool_balance,
                    'total_balance_btc': balance_btc + mempool_btc,
                    'api_status': 'success'
                }
            else:
                print(f"   ⚠️ Erro na API: {response.status_code}")
                return {
                    'confirmed_balance_btc': 0,
                    'api_status': 'error',
                    'error_code': response.status_code
                }
                
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            return {
                'confirmed_balance_btc': 0,
                'api_status': 'error',
                'error': str(e)
            }
    
    def validate_all_balances(self):
        """Valida saldos de todas as carteiras"""
        try:
            print("🚀 VALIDANDO SALDOS ATUAIS DAS CARTEIRAS")
            print("=" * 60)
            
            validation_results = {
                'validation_timestamp': datetime.now().isoformat(),
                'total_wallets_checked': len(self.wallets),
                'wallet_results': {},
                'summary': {
                    'total_confirmed_btc': 0,
                    'total_mempool_btc': 0,
                    'total_combined_btc': 0,
                    'successful_checks': 0,
                    'failed_checks': 0
                }
            }
            
            print(f"📋 Verificando {len(self.wallets)} carteiras...")
            print()
            
            for wallet_id, wallet_info in self.wallets.items():
                address = wallet_info['address']
                description = wallet_info['description']
                expected = wallet_info['expected_balance']
                
                print(f"🏦 {description}")
                print(f"   Endereço: {address}")
                print(f"   Saldo esperado: {expected:.8f} BTC")
                
                # Obter saldo real
                balance_data = self.get_real_balance(address)
                
                if balance_data['api_status'] == 'success':
                    confirmed = balance_data['confirmed_balance_btc']
                    mempool = balance_data['mempool_balance_btc']
                    total = balance_data['total_balance_btc']
                    
                    print(f"   ✅ Saldo confirmado: {confirmed:.8f} BTC")
                    if mempool != 0:
                        print(f"   🔄 Mempool: {mempool:.8f} BTC")
                    print(f"   💰 Total: {total:.8f} BTC")
                    
                    # Verificar se corresponde ao esperado
                    difference = abs(total - expected)
                    if difference < 0.00000001:  # Tolerância de 1 satoshi
                        print(f"   ✅ Status: CORRETO")
                        status = "correct"
                    else:
                        print(f"   ⚠️ Status: DIFERENÇA de {difference:.8f} BTC")
                        status = "difference"
                    
                    validation_results['summary']['successful_checks'] += 1
                    validation_results['summary']['total_confirmed_btc'] += confirmed
                    validation_results['summary']['total_mempool_btc'] += mempool
                    validation_results['summary']['total_combined_btc'] += total
                    
                else:
                    print(f"   ❌ Falha na verificação")
                    status = "error"
                    confirmed = mempool = total = 0
                    validation_results['summary']['failed_checks'] += 1
                
                # Salvar resultado
                validation_results['wallet_results'][wallet_id] = {
                    'address': address,
                    'description': description,
                    'expected_balance_btc': expected,
                    'confirmed_balance_btc': confirmed,
                    'mempool_balance_btc': mempool,
                    'total_balance_btc': total,
                    'status': status,
                    'api_data': balance_data
                }
                
                print()
                time.sleep(1)  # Evitar rate limit
            
            return validation_results
            
        except Exception as e:
            print(f"❌ Erro na validação: {e}")
            return None
    
    def check_transaction_status(self, txid):
        """Verifica status da transação de 89,73 BTC"""
        try:
            print(f"🔍 Verificando status da transação: {txid[:20]}...")
            
            url = f"{self.apis['blockstream']}/tx/{txid}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                confirmations = data.get('status', {}).get('confirmed', False)
                block_height = data.get('status', {}).get('block_height', 0)
                block_hash = data.get('status', {}).get('block_hash', '')
                
                return {
                    'found': True,
                    'confirmed': confirmations,
                    'block_height': block_height,
                    'block_hash': block_hash,
                    'fee': data.get('fee', 0),
                    'size': data.get('size', 0)
                }
            else:
                return {
                    'found': False,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            return {
                'found': False,
                'error': str(e)
            }
    
    def generate_balance_report(self, validation_results):
        """Gera relatório detalhado dos saldos"""
        try:
            print("📊 RELATÓRIO DE SALDOS VALIDADOS")
            print("=" * 50)
            
            summary = validation_results['summary']
            
            print(f"🔍 Carteiras verificadas: {validation_results['total_wallets_checked']}")
            print(f"✅ Verificações bem-sucedidas: {summary['successful_checks']}")
            print(f"❌ Verificações falharam: {summary['failed_checks']}")
            print()
            
            print(f"💰 TOTAIS CONSOLIDADOS:")
            print(f"   Saldo confirmado: {summary['total_confirmed_btc']:.8f} BTC")
            print(f"   Saldo mempool: {summary['total_mempool_btc']:.8f} BTC")
            print(f"   Total combinado: {summary['total_combined_btc']:.8f} BTC")
            print()
            
            # Verificar status da transferência de 89,73 BTC
            txid = "14729752297fc044035de044afcedac0d3f01cee74bddf567479e3b785cc8cf6"
            tx_status = self.check_transaction_status(txid)
            
            print(f"🔗 STATUS DA TRANSAÇÃO DE 89,73 BTC:")
            if tx_status['found']:
                if tx_status['confirmed']:
                    print(f"   ✅ CONFIRMADA no bloco {tx_status['block_height']}")
                else:
                    print(f"   🔄 PENDENTE (não confirmada)")
            else:
                print(f"   ⚠️ Não encontrada: {tx_status.get('error', 'Desconhecido')}")
            
            print()
            
            # Análise por prioridade
            high_priority = []
            medium_priority = []
            low_priority = []
            
            for wallet_id, result in validation_results['wallet_results'].items():
                wallet_info = self.wallets[wallet_id]
                priority = wallet_info['priority']
                
                if priority == 1:
                    high_priority.append((wallet_id, result))
                elif priority == 2:
                    medium_priority.append((wallet_id, result))
                else:
                    low_priority.append((wallet_id, result))
            
            print(f"🏆 CARTEIRAS PRIORITÁRIAS:")
            for wallet_id, result in high_priority:
                status_icon = "✅" if result['status'] == "correct" else "⚠️"
                print(f"   {status_icon} {result['description']}: {result['total_balance_btc']:.8f} BTC")
            
            print(f"\n📋 CARTEIRAS SECUNDÁRIAS:")
            for wallet_id, result in medium_priority:
                status_icon = "✅" if result['status'] == "correct" else "⚠️"
                print(f"   {status_icon} {result['description']}: {result['total_balance_btc']:.8f} BTC")
            
            print(f"\n💼 CARTEIRAS MENORES:")
            for wallet_id, result in low_priority:
                status_icon = "✅" if result['status'] == "correct" else "⚠️"
                print(f"   {status_icon} {result['description']}: {result['total_balance_btc']:.8f} BTC")
            
            return validation_results
            
        except Exception as e:
            print(f"❌ Erro no relatório: {e}")
            return validation_results

def main():
    """Função principal de validação"""
    
    print("🔍 SISTEMA DE VALIDAÇÃO DE SALDOS")
    print("=" * 50)
    
    # Criar validador
    validator = BalanceValidator()
    
    # Validar todos os saldos
    results = validator.validate_all_balances()
    
    if results:
        # Gerar relatório
        validator.generate_balance_report(results)
        
        # Salvar resultados
        with open('/home/ubuntu/balance_validation_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Resultados salvos em: balance_validation_results.json")
        print(f"🎯 Validação concluída com sucesso!")
        
        return results
    else:
        print(f"\n❌ Falha na validação dos saldos")
        return None

if __name__ == "__main__":
    main()

