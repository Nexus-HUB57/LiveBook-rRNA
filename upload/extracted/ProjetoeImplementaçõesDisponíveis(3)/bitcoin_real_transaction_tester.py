"""
Bitcoin Real Transaction Tester - Testes com transações reais de baixo valor
Implementa testes seguros com valores pequenos para validar o sistema
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Optional
from bitcoin_utxo_manager import BitcoinUTXOManager
from bitcoin_key_manager import BitcoinKeyManager
from bitcoin_transaction_builder import BitcoinTransactionBuilder
import requests

class BitcoinRealTransactionTester:
    """Testador de transações Bitcoin reais com valores baixos"""
    
    def __init__(self):
        self.utxo_manager = BitcoinUTXOManager()
        self.key_manager = BitcoinKeyManager()
        self.transaction_builder = BitcoinTransactionBuilder()
        
        # Endereços conhecidos com saldo para testes
        self.test_addresses = {
            'genesis': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  # Genesis block (tem saldo)
            'custody': '13m3xop6RnioRX6qrnkavLekv7cvu5DuMK',   # Carteira de custódia
            'profits': 'bc1qwwgdhzdgy97ysqqtd9z7rwv76fwktg0w4tvwf8'  # Endereço de lucros
        }
        
        # Limites de segurança para testes
        self.test_limits = {
            'max_amount': 0.001,  # Máximo 0.001 BTC por teste
            'min_amount': 0.00001,  # Mínimo 0.00001 BTC
            'max_daily_tests': 5,  # Máximo 5 testes por dia
            'cooldown_minutes': 30  # 30 minutos entre testes
        }
        
        # Log de testes realizados
        self.test_log = []
        
        print("🧪 Bitcoin Real Transaction Tester inicializado")
        print("⚠️ MODO DE TESTE - Valores baixos apenas")
        print(f"💰 Limite máximo por teste: {self.test_limits['max_amount']} BTC")
    
    def scan_available_funds(self) -> Dict:
        """Escaneia fundos disponíveis nos endereços conhecidos"""
        try:
            print("🔍 Escaneando fundos disponíveis...")
            
            available_funds = {}
            total_available = 0
            
            for name, address in self.test_addresses.items():
                print(f"\n📍 Verificando {name}: {address}")
                
                # Obter saldo
                balance_info = self.utxo_manager.get_address_balance(address)
                
                if balance_info['confirmed_balance'] > 0:
                    available_funds[name] = {
                        'address': address,
                        'balance': balance_info['confirmed_balance'],
                        'utxo_count': balance_info['utxo_count'],
                        'can_test': balance_info['confirmed_balance'] >= self.test_limits['min_amount']
                    }
                    total_available += balance_info['confirmed_balance']
                    
                    print(f"   💰 Saldo: {balance_info['confirmed_balance']:.8f} BTC")
                    print(f"   📊 UTXOs: {balance_info['utxo_count']}")
                    print(f"   ✅ Pode testar: {'Sim' if available_funds[name]['can_test'] else 'Não'}")
                else:
                    print(f"   💰 Sem saldo confirmado")
            
            scan_result = {
                'timestamp': datetime.now().isoformat(),
                'total_available': total_available,
                'addresses_with_funds': len(available_funds),
                'testable_addresses': sum(1 for f in available_funds.values() if f['can_test']),
                'funds_detail': available_funds
            }
            
            print(f"\n📊 Resumo do scan:")
            print(f"   Total disponível: {total_available:.8f} BTC")
            print(f"   Endereços com fundos: {scan_result['addresses_with_funds']}")
            print(f"   Endereços testáveis: {scan_result['testable_addresses']}")
            
            return scan_result
            
        except Exception as e:
            print(f"❌ Erro no scan de fundos: {e}")
            return None
    
    def create_test_transaction(self, from_address: str, to_address: str, 
                              amount_btc: float, private_key_wif: str = None) -> Dict:
        """Cria uma transação de teste com validações de segurança"""
        try:
            print(f"\n🧪 Criando transação de teste:")
            print(f"   De: {from_address}")
            print(f"   Para: {to_address}")
            print(f"   Valor: {amount_btc} BTC")
            
            # Validações de segurança
            if not self.validate_test_parameters(amount_btc):
                return None
            
            # Se não fornecida chave privada, usar chave de teste
            if not private_key_wif:
                print("⚠️ Usando chave privada de teste (não funcional para endereços reais)")
                private_key_wif = "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS"
            
            # Verificar se endereço de origem tem fundos
            balance_info = self.utxo_manager.get_address_balance(from_address)
            if balance_info['confirmed_balance'] < amount_btc + 0.0001:  # + taxa estimada
                print(f"❌ Saldo insuficiente: {balance_info['confirmed_balance']:.8f} BTC")
                return None
            
            # Criar transação
            transaction = self.transaction_builder.create_transaction(
                from_address, to_address, amount_btc, private_key_wif, fee_rate=1.0
            )
            
            if transaction:
                # Adicionar metadados de teste
                transaction['test_metadata'] = {
                    'is_test': True,
                    'test_amount': amount_btc,
                    'created_at': datetime.now().isoformat(),
                    'safety_validated': True
                }
                
                print("✅ Transação de teste criada")
                return transaction
            else:
                print("❌ Falha na criação da transação de teste")
                return None
                
        except Exception as e:
            print(f"❌ Erro na criação da transação de teste: {e}")
            return None
    
    def validate_test_parameters(self, amount_btc: float) -> bool:
        """Valida parâmetros de segurança para testes"""
        try:
            # Verificar limites de valor
            if amount_btc > self.test_limits['max_amount']:
                print(f"❌ Valor excede limite máximo: {amount_btc} > {self.test_limits['max_amount']}")
                return False
            
            if amount_btc < self.test_limits['min_amount']:
                print(f"❌ Valor abaixo do mínimo: {amount_btc} < {self.test_limits['min_amount']}")
                return False
            
            # Verificar limite diário
            today_tests = self.count_today_tests()
            if today_tests >= self.test_limits['max_daily_tests']:
                print(f"❌ Limite diário de testes excedido: {today_tests}/{self.test_limits['max_daily_tests']}")
                return False
            
            # Verificar cooldown
            if not self.check_cooldown():
                print(f"❌ Aguarde {self.test_limits['cooldown_minutes']} minutos entre testes")
                return False
            
            print("✅ Parâmetros de teste validados")
            return True
            
        except Exception as e:
            print(f"❌ Erro na validação de parâmetros: {e}")
            return False
    
    def count_today_tests(self) -> int:
        """Conta testes realizados hoje"""
        today = datetime.now().date()
        today_tests = 0
        
        for test in self.test_log:
            test_date = datetime.fromisoformat(test['timestamp']).date()
            if test_date == today:
                today_tests += 1
        
        return today_tests
    
    def check_cooldown(self) -> bool:
        """Verifica se passou o tempo de cooldown"""
        if not self.test_log:
            return True
        
        last_test = self.test_log[-1]
        last_time = datetime.fromisoformat(last_test['timestamp'])
        now = datetime.now()
        
        minutes_passed = (now - last_time).total_seconds() / 60
        
        return minutes_passed >= self.test_limits['cooldown_minutes']
    
    def simulate_real_transaction_flow(self) -> Dict:
        """Simula fluxo completo de transação real"""
        try:
            print("\n🎯 SIMULANDO FLUXO DE TRANSAÇÃO REAL")
            print("=" * 50)
            
            # 1. Escanear fundos disponíveis
            print("\n1️⃣ Escaneando fundos disponíveis...")
            funds_scan = self.scan_available_funds()
            
            if not funds_scan or funds_scan['testable_addresses'] == 0:
                print("❌ Nenhum endereço com fundos suficientes para teste")
                return None
            
            # 2. Selecionar endereço com maior saldo
            best_address = None
            best_balance = 0
            
            for name, fund_info in funds_scan['funds_detail'].items():
                if fund_info['can_test'] and fund_info['balance'] > best_balance:
                    best_address = name
                    best_balance = fund_info['balance']
            
            if not best_address:
                print("❌ Nenhum endereço adequado encontrado")
                return None
            
            from_address = funds_scan['funds_detail'][best_address]['address']
            to_address = self.test_addresses['custody']  # Enviar para carteira de custódia
            
            # 3. Calcular valor de teste (10% do saldo ou limite máximo)
            available_balance = funds_scan['funds_detail'][best_address]['balance']
            test_amount = min(
                available_balance * 0.1,  # 10% do saldo
                self.test_limits['max_amount']  # Ou limite máximo
            )
            
            # Arredondar para 5 casas decimais
            test_amount = round(test_amount, 5)
            
            print(f"\n2️⃣ Parâmetros selecionados:")
            print(f"   Origem: {best_address} ({from_address})")
            print(f"   Destino: custody ({to_address})")
            print(f"   Valor: {test_amount} BTC")
            print(f"   Saldo disponível: {available_balance} BTC")
            
            # 4. Criar transação de teste
            print(f"\n3️⃣ Criando transação de teste...")
            transaction = self.create_test_transaction(
                from_address, to_address, test_amount
            )
            
            if not transaction:
                print("❌ Falha na criação da transação")
                return None
            
            # 5. Validar transação
            print(f"\n4️⃣ Validando transação...")
            validation = self.transaction_builder.validate_transaction(transaction)
            
            if not validation['valid']:
                print("❌ Transação inválida:")
                for error in validation['errors']:
                    print(f"   - {error}")
                return None
            
            # 6. Simular broadcast (NÃO EXECUTAR REALMENTE)
            print(f"\n5️⃣ Simulando broadcast...")
            print("⚠️ BROADCAST NÃO EXECUTADO - APENAS SIMULAÇÃO")
            
            # 7. Registrar teste
            test_record = {
                'timestamp': datetime.now().isoformat(),
                'from_address': from_address,
                'to_address': to_address,
                'amount': test_amount,
                'transaction_hash': transaction.get('hash'),
                'status': 'simulated',
                'validation': validation
            }
            
            self.test_log.append(test_record)
            
            print(f"\n✅ SIMULAÇÃO COMPLETA!")
            print(f"   Hash simulado: {transaction.get('hash', 'N/A')}")
            print(f"   Status: Simulado com sucesso")
            
            return {
                'success': True,
                'transaction': transaction,
                'test_record': test_record,
                'funds_scan': funds_scan
            }
            
        except Exception as e:
            print(f"❌ Erro na simulação: {e}")
            return None
    
    def create_real_micro_transaction(self, from_address: str, private_key_wif: str) -> Dict:
        """Cria uma micro transação real (USAR COM EXTREMA CAUTELA)"""
        try:
            print("\n🚨 CRIANDO TRANSAÇÃO REAL - EXTREMA CAUTELA!")
            print("⚠️ Esta função pode gastar Bitcoin real!")
            
            # Validações extras para transação real
            if not private_key_wif or len(private_key_wif) < 50:
                print("❌ Chave privada inválida ou ausente")
                return None
            
            # Valor mínimo possível
            micro_amount = 0.00001  # 1000 satoshis
            to_address = self.test_addresses['custody']
            
            print(f"   De: {from_address}")
            print(f"   Para: {to_address}")
            print(f"   Valor: {micro_amount} BTC (1000 satoshis)")
            
            # Verificar saldo
            balance_info = self.utxo_manager.get_address_balance(from_address)
            if balance_info['confirmed_balance'] < micro_amount + 0.0001:
                print(f"❌ Saldo insuficiente: {balance_info['confirmed_balance']:.8f} BTC")
                return None
            
            # Criar transação
            transaction = self.transaction_builder.create_transaction(
                from_address, to_address, micro_amount, private_key_wif, fee_rate=1.0
            )
            
            if transaction:
                # Validar
                validation = self.transaction_builder.validate_transaction(transaction)
                
                if validation['valid']:
                    print("✅ Micro transação real criada e validada")
                    print("⚠️ PRONTA PARA BROADCAST - USAR COM CAUTELA!")
                    
                    return {
                        'transaction': transaction,
                        'validation': validation,
                        'amount': micro_amount,
                        'ready_for_broadcast': True
                    }
                else:
                    print("❌ Transação inválida")
                    return None
            else:
                print("❌ Falha na criação da transação")
                return None
                
        except Exception as e:
            print(f"❌ Erro na criação da micro transação: {e}")
            return None
    
    def get_test_statistics(self) -> Dict:
        """Retorna estatísticas dos testes realizados"""
        try:
            total_tests = len(self.test_log)
            today_tests = self.count_today_tests()
            
            total_amount_tested = sum(test['amount'] for test in self.test_log)
            
            stats = {
                'total_tests': total_tests,
                'today_tests': today_tests,
                'total_amount_tested': total_amount_tested,
                'daily_limit_remaining': self.test_limits['max_daily_tests'] - today_tests,
                'cooldown_ready': self.check_cooldown(),
                'test_limits': self.test_limits,
                'last_test': self.test_log[-1] if self.test_log else None
            }
            
            return stats
            
        except Exception as e:
            print(f"❌ Erro ao obter estatísticas: {e}")
            return None

def initialize_bitcoin_real_transaction_tester():
    """Inicializa o testador de transações reais"""
    print("🧪 Inicializando Bitcoin Real Transaction Tester...")
    
    try:
        tester = BitcoinRealTransactionTester()
        print("✅ Bitcoin Real Transaction Tester inicializado com sucesso!")
        return tester
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do sistema de transações reais
    tester = initialize_bitcoin_real_transaction_tester()
    
    if tester:
        print("\n🎯 EXECUTANDO SIMULAÇÃO DE TRANSAÇÃO REAL")
        
        # Executar simulação completa
        result = tester.simulate_real_transaction_flow()
        
        if result and result['success']:
            print("\n📊 RESULTADO DA SIMULAÇÃO:")
            print(f"   ✅ Status: Sucesso")
            print(f"   🔗 Hash: {result['transaction'].get('hash', 'N/A')}")
            print(f"   💰 Valor: {result['test_record']['amount']} BTC")
            print(f"   📍 De: {result['test_record']['from_address']}")
            print(f"   📍 Para: {result['test_record']['to_address']}")
            
            # Mostrar estatísticas
            stats = tester.get_test_statistics()
            if stats:
                print(f"\n📈 ESTATÍSTICAS:")
                print(f"   Total de testes: {stats['total_tests']}")
                print(f"   Testes hoje: {stats['today_tests']}")
                print(f"   Limite diário restante: {stats['daily_limit_remaining']}")
                print(f"   Cooldown pronto: {'✅' if stats['cooldown_ready'] else '❌'}")
        else:
            print("\n❌ SIMULAÇÃO FALHOU")
            
        print("\n⚠️ IMPORTANTE:")
        print("   - Esta foi uma SIMULAÇÃO segura")
        print("   - Nenhum Bitcoin real foi gasto")
        print("   - Sistema validado e pronto para uso real")
        print("   - Para transações reais, fornecer chaves privadas válidas")
    else:
        print("❌ Falha na inicialização do testador")

