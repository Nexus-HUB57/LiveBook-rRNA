"""
Binance Custody API - Integração com API Binance para carteira de custódia
Implementa operações reais com a carteira de custódia 13m3xop6RnioRX6qrnkavLekv7cvu5DuMK
"""

import os
import sys
import json
import hashlib
import hmac
import time
import requests
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlencode

class BinanceCustodyAPI:
    """Cliente API para operações com carteira de custódia Binance"""
    
    def __init__(self, api_key, secret_key):
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = "https://api.binance.com"
        
        # Endereço da carteira de custódia
        self.custody_address = "13m3xop6RnioRX6qrnkavLekv7cvu5DuMK"
        
        # Configurar session para requests
        self.session = requests.Session()
        self.session.headers.update({
            'X-MBX-APIKEY': self.api_key,
            'Content-Type': 'application/json'
        })
        
        print(f"🏦 Binance Custody API inicializada")
        print(f"📍 Carteira de custódia: {self.custody_address}")
        print(f"🔑 API Key: {self.api_key[:10]}...")
    
    def _generate_signature(self, query_string):
        """Gera assinatura HMAC SHA256 para autenticação"""
        return hmac.new(
            self.secret_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _make_request(self, method, endpoint, params=None, signed=True):
        """Faz requisição para a API Binance"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if params is None:
                params = {}
            
            if signed:
                # Adicionar timestamp
                params['timestamp'] = int(time.time() * 1000)
                
                # Criar query string
                query_string = urlencode(params)
                
                # Gerar assinatura
                signature = self._generate_signature(query_string)
                params['signature'] = signature
            
            # Fazer requisição
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=params, timeout=30)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro na requisição para {endpoint}: {e}")
            return None
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
            return None
    
    def get_account_info(self):
        """Obtém informações da conta Binance"""
        try:
            print("📊 Obtendo informações da conta...")
            
            data = self._make_request('GET', '/api/v3/account')
            
            if data:
                account_info = {
                    'account_type': data.get('accountType', 'SPOT'),
                    'can_trade': data.get('canTrade', False),
                    'can_withdraw': data.get('canWithdraw', False),
                    'can_deposit': data.get('canDeposit', False),
                    'update_time': data.get('updateTime'),
                    'balances': []
                }
                
                # Processar saldos
                for balance in data.get('balances', []):
                    free_balance = float(balance['free'])
                    locked_balance = float(balance['locked'])
                    
                    if free_balance > 0 or locked_balance > 0:
                        account_info['balances'].append({
                            'asset': balance['asset'],
                            'free': free_balance,
                            'locked': locked_balance,
                            'total': free_balance + locked_balance
                        })
                
                print(f"✅ Conta obtida: {len(account_info['balances'])} ativos com saldo")
                return account_info
            else:
                return {'error': 'Falha ao obter informações da conta'}
                
        except Exception as e:
            print(f"❌ Erro ao obter informações da conta: {e}")
            return {'error': str(e)}
    
    def get_btc_balance(self):
        """Obtém saldo de Bitcoin na conta"""
        try:
            print("₿ Verificando saldo de Bitcoin...")
            
            account_info = self.get_account_info()
            
            if 'error' in account_info:
                return account_info
            
            # Procurar saldo de BTC
            btc_balance = None
            for balance in account_info['balances']:
                if balance['asset'] == 'BTC':
                    btc_balance = balance
                    break
            
            if btc_balance:
                result = {
                    'asset': 'BTC',
                    'available': btc_balance['free'],
                    'locked': btc_balance['locked'],
                    'total': btc_balance['total'],
                    'custody_address': self.custody_address,
                    'timestamp': datetime.now().isoformat()
                }
                
                print(f"✅ Saldo BTC: {btc_balance['total']} BTC")
                print(f"   📊 Disponível: {btc_balance['free']} BTC")
                print(f"   🔒 Bloqueado: {btc_balance['locked']} BTC")
                
                return result
            else:
                return {
                    'asset': 'BTC',
                    'available': 0.0,
                    'locked': 0.0,
                    'total': 0.0,
                    'custody_address': self.custody_address,
                    'message': 'Nenhum saldo de BTC encontrado'
                }
                
        except Exception as e:
            print(f"❌ Erro ao verificar saldo BTC: {e}")
            return {'error': str(e)}
    
    def get_deposit_address(self, coin='BTC', network='BTC'):
        """Obtém endereço de depósito para Bitcoin"""
        try:
            print(f"📍 Obtendo endereço de depósito {coin}...")
            
            params = {
                'coin': coin,
                'network': network
            }
            
            data = self._make_request('GET', '/sapi/v1/capital/deposit/address', params)
            
            if data:
                deposit_info = {
                    'coin': data.get('coin'),
                    'address': data.get('address'),
                    'network': data.get('network'),
                    'tag': data.get('tag', ''),
                    'url': data.get('url', ''),
                    'custody_match': data.get('address') == self.custody_address
                }
                
                print(f"✅ Endereço de depósito: {deposit_info['address']}")
                print(f"🔍 Corresponde à custódia: {'✅ Sim' if deposit_info['custody_match'] else '❌ Não'}")
                
                return deposit_info
            else:
                return {'error': 'Falha ao obter endereço de depósito'}
                
        except Exception as e:
            print(f"❌ Erro ao obter endereço de depósito: {e}")
            return {'error': str(e)}
    
    def get_deposit_history(self, coin='BTC', limit=100):
        """Obtém histórico de depósitos"""
        try:
            print(f"📈 Obtendo histórico de depósitos {coin}...")
            
            params = {
                'coin': coin,
                'limit': limit
            }
            
            data = self._make_request('GET', '/sapi/v1/capital/deposit/hisrec', params)
            
            if data and isinstance(data, list):
                deposits = []
                
                for deposit in data:
                    deposit_info = {
                        'amount': float(deposit.get('amount', 0)),
                        'coin': deposit.get('coin'),
                        'network': deposit.get('network'),
                        'status': deposit.get('status'),
                        'address': deposit.get('address'),
                        'tx_id': deposit.get('txId'),
                        'insert_time': deposit.get('insertTime'),
                        'confirm_times': deposit.get('confirmTimes'),
                        'unlock_confirm': deposit.get('unlockConfirm')
                    }
                    
                    deposits.append(deposit_info)
                
                print(f"✅ Histórico obtido: {len(deposits)} depósitos")
                
                return {
                    'deposits': deposits,
                    'total_count': len(deposits),
                    'coin': coin
                }
            else:
                return {'deposits': [], 'total_count': 0, 'coin': coin}
                
        except Exception as e:
            print(f"❌ Erro ao obter histórico de depósitos: {e}")
            return {'error': str(e)}
    
    def create_withdrawal(self, coin, address, amount, network='BTC', name=None):
        """Cria uma retirada de Bitcoin"""
        try:
            print(f"💸 Criando retirada: {amount} {coin} para {address}")
            
            params = {
                'coin': coin,
                'address': address,
                'amount': str(amount),
                'network': network
            }
            
            if name:
                params['name'] = name
            
            # ATENÇÃO: Esta é uma operação real que move fundos!
            # Em ambiente de produção, adicionar confirmações extras
            print("⚠️ ATENÇÃO: Esta operação irá mover fundos reais!")
            print(f"   Moeda: {coin}")
            print(f"   Endereço: {address}")
            print(f"   Valor: {amount}")
            print(f"   Rede: {network}")
            
            # Para segurança, vamos apenas simular a operação por enquanto
            # Em produção real, descomente a linha abaixo:
            # data = self._make_request('POST', '/sapi/v1/capital/withdraw/apply', params)
            
            # Simulação da resposta
            simulated_response = {
                'id': f"withdrawal_{int(time.time())}",
                'coin': coin,
                'address': address,
                'amount': amount,
                'network': network,
                'status': 'SIMULATED',  # Em produção seria 'PENDING'
                'timestamp': datetime.now().isoformat(),
                'message': 'Retirada simulada - ative em produção'
            }
            
            print(f"✅ Retirada criada (simulada): {simulated_response['id']}")
            
            return simulated_response
            
        except Exception as e:
            print(f"❌ Erro ao criar retirada: {e}")
            return {'error': str(e)}
    
    def get_withdrawal_history(self, coin='BTC', limit=100):
        """Obtém histórico de retiradas"""
        try:
            print(f"📉 Obtendo histórico de retiradas {coin}...")
            
            params = {
                'coin': coin,
                'limit': limit
            }
            
            data = self._make_request('GET', '/sapi/v1/capital/withdraw/history', params)
            
            if data and isinstance(data, list):
                withdrawals = []
                
                for withdrawal in data:
                    withdrawal_info = {
                        'id': withdrawal.get('id'),
                        'amount': float(withdrawal.get('amount', 0)),
                        'coin': withdrawal.get('coin'),
                        'network': withdrawal.get('network'),
                        'status': withdrawal.get('status'),
                        'address': withdrawal.get('address'),
                        'tx_id': withdrawal.get('txId'),
                        'apply_time': withdrawal.get('applyTime'),
                        'complete_time': withdrawal.get('completeTime'),
                        'transaction_fee': float(withdrawal.get('transactionFee', 0))
                    }
                    
                    withdrawals.append(withdrawal_info)
                
                print(f"✅ Histórico obtido: {len(withdrawals)} retiradas")
                
                return {
                    'withdrawals': withdrawals,
                    'total_count': len(withdrawals),
                    'coin': coin
                }
            else:
                return {'withdrawals': [], 'total_count': 0, 'coin': coin}
                
        except Exception as e:
            print(f"❌ Erro ao obter histórico de retiradas: {e}")
            return {'error': str(e)}
    
    def get_trading_fees(self):
        """Obtém informações sobre taxas de negociação"""
        try:
            print("💰 Obtendo informações de taxas...")
            
            data = self._make_request('GET', '/sapi/v1/asset/tradeFee')
            
            if data and isinstance(data, list):
                fees = []
                
                for fee_info in data:
                    if fee_info.get('symbol', '').startswith('BTC'):
                        fees.append({
                            'symbol': fee_info.get('symbol'),
                            'maker_commission': float(fee_info.get('makerCommission', 0)),
                            'taker_commission': float(fee_info.get('takerCommission', 0))
                        })
                
                print(f"✅ Taxas obtidas para {len(fees)} pares BTC")
                
                return {
                    'fees': fees,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {'fees': [], 'message': 'Nenhuma taxa encontrada'}
                
        except Exception as e:
            print(f"❌ Erro ao obter taxas: {e}")
            return {'error': str(e)}
    
    def get_system_status(self):
        """Verifica status do sistema Binance"""
        try:
            print("🔍 Verificando status do sistema...")
            
            data = self._make_request('GET', '/sapi/v1/system/status', signed=False)
            
            if data:
                status_info = {
                    'status': data.get('status', 0),
                    'message': data.get('msg', ''),
                    'operational': data.get('status', 0) == 0,
                    'timestamp': datetime.now().isoformat()
                }
                
                status_text = "✅ Operacional" if status_info['operational'] else "❌ Manutenção"
                print(f"Status: {status_text}")
                
                return status_info
            else:
                return {'status': -1, 'message': 'Falha ao verificar status', 'operational': False}
                
        except Exception as e:
            print(f"❌ Erro ao verificar status: {e}")
            return {'error': str(e)}
    
    def validate_custody_integration(self):
        """Valida integração com carteira de custódia"""
        try:
            print("🔍 Validando integração com carteira de custódia...")
            
            validation_results = {
                'custody_address': self.custody_address,
                'timestamp': datetime.now().isoformat(),
                'checks': {}
            }
            
            # Check 1: Status do sistema
            system_status = self.get_system_status()
            validation_results['checks']['system_operational'] = system_status.get('operational', False)
            
            # Check 2: Informações da conta
            account_info = self.get_account_info()
            validation_results['checks']['account_accessible'] = 'error' not in account_info
            
            if validation_results['checks']['account_accessible']:
                validation_results['checks']['can_trade'] = account_info.get('can_trade', False)
                validation_results['checks']['can_withdraw'] = account_info.get('can_withdraw', False)
                validation_results['checks']['can_deposit'] = account_info.get('can_deposit', False)
            
            # Check 3: Saldo BTC
            btc_balance = self.get_btc_balance()
            validation_results['checks']['btc_balance_accessible'] = 'error' not in btc_balance
            
            if validation_results['checks']['btc_balance_accessible']:
                validation_results['btc_balance'] = btc_balance
            
            # Check 4: Endereço de depósito
            deposit_address = self.get_deposit_address()
            validation_results['checks']['deposit_address_accessible'] = 'error' not in deposit_address
            
            if validation_results['checks']['deposit_address_accessible']:
                validation_results['checks']['custody_address_match'] = deposit_address.get('custody_match', False)
                validation_results['deposit_address'] = deposit_address
            
            # Calcular score de validação
            passed_checks = sum(1 for check in validation_results['checks'].values() if check is True)
            total_checks = len(validation_results['checks'])
            validation_results['validation_score'] = (passed_checks / total_checks) * 100 if total_checks > 0 else 0
            validation_results['fully_operational'] = validation_results['validation_score'] >= 80
            
            print(f"✅ Validação concluída:")
            print(f"   📊 Score: {validation_results['validation_score']:.1f}%")
            print(f"   🎯 Operacional: {'✅ Sim' if validation_results['fully_operational'] else '❌ Não'}")
            
            return validation_results
            
        except Exception as e:
            print(f"❌ Erro na validação: {e}")
            return {
                'custody_address': self.custody_address,
                'error': str(e),
                'fully_operational': False,
                'validation_score': 0
            }

def initialize_binance_custody_api(api_key, secret_key):
    """Inicializa a API Binance para carteira de custódia"""
    print("🏦 Inicializando Binance Custody API...")
    
    try:
        binance_api = BinanceCustodyAPI(api_key, secret_key)
        
        # Validar integração
        validation = binance_api.validate_custody_integration()
        
        if validation['fully_operational']:
            print("✅ Binance Custody API inicializada com sucesso!")
        else:
            print("⚠️ Binance Custody API inicializada com avisos")
        
        return binance_api, validation
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None, {'error': str(e)}

if __name__ == "__main__":
    # Credenciais fornecidas
    API_KEY = "nqHayGNX2Uej2jUl69pw7L9NF3KFbhZcj1Yqo3BQeCNXYReDdAj0QEZMLQIFulMK"
    SECRET_KEY = "fMwl5w6rXK899O0GN6anZnXhfLX0tAUvy4HgPgSscqtnTfqXWJ8RSulxqC85X3rN"
    
    # Teste da API
    binance_api, validation = initialize_binance_custody_api(API_KEY, SECRET_KEY)
    
    if binance_api:
        print("\n📊 Resultados da validação:")
        print(json.dumps(validation, indent=2, default=str))
        
        print("\n₿ Testando saldo BTC:")
        btc_balance = binance_api.get_btc_balance()
        print(json.dumps(btc_balance, indent=2, default=str))
        
        print("\n📈 Testando histórico de depósitos:")
        deposit_history = binance_api.get_deposit_history(limit=5)
        print(f"Depósitos encontrados: {deposit_history.get('total_count', 0)}")
    else:
        print("❌ Falha na inicialização da API")

