"""
Bitcoin Real API Routes - Rotas para operações Bitcoin reais
Integra todos os sistemas Bitcoin reais ao dashboard
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Adicionar diretório raiz ao path
sys.path.append('/home/ubuntu')

from bitcoin_utxo_manager import initialize_bitcoin_utxo_manager
from bitcoin_key_manager import initialize_bitcoin_key_manager
from bitcoin_transaction_builder import initialize_bitcoin_transaction_builder
from bitcoin_real_transaction_tester import initialize_bitcoin_real_transaction_tester

# Criar blueprint
bitcoin_real_bp = Blueprint('bitcoin_real', __name__)

# Inicializar sistemas globais
print("🔧 Inicializando sistemas Bitcoin reais...")
utxo_manager = initialize_bitcoin_utxo_manager()
key_manager = initialize_bitcoin_key_manager()
transaction_builder = initialize_bitcoin_transaction_builder()
transaction_tester = initialize_bitcoin_real_transaction_tester()

@bitcoin_real_bp.route('/status', methods=['GET'])
def get_bitcoin_real_status():
    """Status dos sistemas Bitcoin reais"""
    try:
        status = {
            'systems': {
                'utxo_manager': utxo_manager is not None,
                'key_manager': key_manager is not None,
                'transaction_builder': transaction_builder is not None,
                'transaction_tester': transaction_tester is not None
            },
            'network': 'mainnet',
            'apis_available': ['blockstream', 'blockcypher', 'blockchain_info'],
            'status': 'operational',
            'timestamp': '2025-08-16T23:45:00.000000'
        }
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@bitcoin_real_bp.route('/address/<address>/balance', methods=['GET'])
def get_address_balance(address):
    """Obtém saldo real de um endereço Bitcoin"""
    try:
        if not utxo_manager:
            return jsonify({'error': 'UTXO Manager não inicializado'}), 500
        
        # Obter saldo real
        balance_info = utxo_manager.get_address_balance(address)
        
        return jsonify({
            'success': True,
            'address': address,
            'balance_info': balance_info
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/address/<address>/utxos', methods=['GET'])
def get_address_utxos(address):
    """Obtém UTXOs reais de um endereço"""
    try:
        if not utxo_manager:
            return jsonify({'error': 'UTXO Manager não inicializado'}), 500
        
        # Obter UTXOs
        utxos = utxo_manager.get_utxos(address)
        
        return jsonify({
            'success': True,
            'address': address,
            'utxo_count': len(utxos),
            'utxos': utxos
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/wallet/generate', methods=['POST'])
def generate_wallet():
    """Gera uma nova carteira Bitcoin"""
    try:
        if not key_manager:
            return jsonify({'error': 'Key Manager não inicializado'}), 500
        
        # Gerar chave privada
        private_key = key_manager.generate_private_key()
        
        if private_key:
            # Criar carteira
            wallet_info = key_manager.create_wallet_from_private_key(private_key)
            
            if wallet_info:
                # Remover chave privada da resposta por segurança
                safe_wallet_info = {
                    'address': wallet_info['addresses']['p2pkh'],
                    'public_key': wallet_info['public_key'],
                    'network': wallet_info['network'],
                    'created_at': wallet_info['created_at']
                }
                
                return jsonify({
                    'success': True,
                    'wallet': safe_wallet_info,
                    'private_key_generated': True
                })
            else:
                return jsonify({
                    'error': 'Falha na criação da carteira',
                    'success': False
                }), 500
        else:
            return jsonify({
                'error': 'Falha na geração da chave privada',
                'success': False
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/wallet/import', methods=['POST'])
def import_wallet():
    """Importa carteira a partir de chave privada"""
    try:
        if not key_manager:
            return jsonify({'error': 'Key Manager não inicializado'}), 500
        
        data = request.get_json()
        private_key_wif = data.get('private_key_wif')
        
        if not private_key_wif:
            return jsonify({
                'error': 'Chave privada WIF obrigatória',
                'success': False
            }), 400
        
        # Importar carteira
        wallet_info = key_manager.import_private_key(private_key_wif)
        
        if wallet_info:
            # Remover chave privada da resposta
            safe_wallet_info = {
                'address': wallet_info['addresses']['p2pkh'],
                'public_key': wallet_info['public_key'],
                'network': wallet_info['network'],
                'created_at': wallet_info['created_at']
            }
            
            return jsonify({
                'success': True,
                'wallet': safe_wallet_info,
                'imported': True
            })
        else:
            return jsonify({
                'error': 'Falha na importação da carteira',
                'success': False
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/transaction/create', methods=['POST'])
def create_transaction():
    """Cria uma transação Bitcoin real"""
    try:
        if not transaction_builder:
            return jsonify({'error': 'Transaction Builder não inicializado'}), 500
        
        data = request.get_json()
        
        # Parâmetros obrigatórios
        from_address = data.get('from_address')
        to_address = data.get('to_address')
        amount_btc = data.get('amount_btc')
        private_key_wif = data.get('private_key_wif')
        
        # Parâmetros opcionais
        fee_rate = data.get('fee_rate', 1.0)
        change_address = data.get('change_address')
        
        if not all([from_address, to_address, amount_btc, private_key_wif]):
            return jsonify({
                'error': 'Parâmetros obrigatórios: from_address, to_address, amount_btc, private_key_wif',
                'success': False
            }), 400
        
        # Criar transação
        transaction = transaction_builder.create_transaction(
            from_address, to_address, float(amount_btc), 
            private_key_wif, float(fee_rate), change_address
        )
        
        if transaction:
            # Remover dados sensíveis da resposta
            safe_transaction = {
                'hash': transaction.get('hash'),
                'version': transaction.get('version'),
                'inputs': len(transaction.get('inputs', [])),
                'outputs': len(transaction.get('outputs', [])),
                'locktime': transaction.get('locktime'),
                'raw_hex_length': len(transaction.get('raw_hex', '')),
                'created': True
            }
            
            return jsonify({
                'success': True,
                'transaction': safe_transaction,
                'ready_for_broadcast': True
            })
        else:
            return jsonify({
                'error': 'Falha na criação da transação',
                'success': False
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/transaction/validate', methods=['POST'])
def validate_transaction():
    """Valida uma transação Bitcoin"""
    try:
        if not transaction_builder:
            return jsonify({'error': 'Transaction Builder não inicializado'}), 500
        
        data = request.get_json()
        transaction = data.get('transaction')
        
        if not transaction:
            return jsonify({
                'error': 'Dados da transação obrigatórios',
                'success': False
            }), 400
        
        # Validar transação
        validation = transaction_builder.validate_transaction(transaction)
        
        return jsonify({
            'success': True,
            'validation': validation
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/transaction/broadcast', methods=['POST'])
def broadcast_transaction():
    """Transmite uma transação para a rede Bitcoin"""
    try:
        if not transaction_builder:
            return jsonify({'error': 'Transaction Builder não inicializado'}), 500
        
        data = request.get_json()
        raw_hex = data.get('raw_hex')
        
        if not raw_hex:
            return jsonify({
                'error': 'Raw hex da transação obrigatório',
                'success': False
            }), 400
        
        # Transmitir transação
        broadcast_result = transaction_builder.broadcast_transaction(raw_hex)
        
        return jsonify({
            'success': broadcast_result.get('success', False),
            'broadcast_result': broadcast_result
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/test/scan-funds', methods=['GET'])
def test_scan_funds():
    """Escaneia fundos disponíveis para testes"""
    try:
        if not transaction_tester:
            return jsonify({'error': 'Transaction Tester não inicializado'}), 500
        
        # Escanear fundos
        funds_scan = transaction_tester.scan_available_funds()
        
        return jsonify({
            'success': True,
            'funds_scan': funds_scan
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/test/simulate-transaction', methods=['POST'])
def test_simulate_transaction():
    """Simula uma transação de teste"""
    try:
        if not transaction_tester:
            return jsonify({'error': 'Transaction Tester não inicializado'}), 500
        
        # Executar simulação
        result = transaction_tester.simulate_real_transaction_flow()
        
        if result and result.get('success'):
            return jsonify({
                'success': True,
                'simulation_result': result
            })
        else:
            return jsonify({
                'error': 'Falha na simulação',
                'success': False
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/test/statistics', methods=['GET'])
def get_test_statistics():
    """Obtém estatísticas dos testes"""
    try:
        if not transaction_tester:
            return jsonify({'error': 'Transaction Tester não inicializado'}), 500
        
        # Obter estatísticas
        stats = transaction_tester.get_test_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/addresses/validate', methods=['POST'])
def validate_addresses():
    """Valida múltiplos endereços Bitcoin"""
    try:
        if not utxo_manager:
            return jsonify({'error': 'UTXO Manager não inicializado'}), 500
        
        data = request.get_json()
        addresses = data.get('addresses', [])
        
        if not addresses:
            return jsonify({
                'error': 'Lista de endereços obrigatória',
                'success': False
            }), 400
        
        validation_results = []
        
        for address in addresses:
            is_valid = utxo_manager.validate_bitcoin_address(address)
            validation_results.append({
                'address': address,
                'valid': is_valid
            })
        
        return jsonify({
            'success': True,
            'validation_results': validation_results,
            'total_addresses': len(addresses),
            'valid_addresses': sum(1 for r in validation_results if r['valid'])
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@bitcoin_real_bp.route('/fees/estimate', methods=['POST'])
def estimate_fees():
    """Estima taxas de transação"""
    try:
        if not utxo_manager:
            return jsonify({'error': 'UTXO Manager não inicializado'}), 500
        
        data = request.get_json()
        input_count = data.get('input_count', 1)
        output_count = data.get('output_count', 2)
        fee_rate = data.get('fee_rate', 1.0)
        
        # Estimar taxa
        estimated_fee = utxo_manager.estimate_transaction_fee(
            input_count, output_count, fee_rate
        )
        
        return jsonify({
            'success': True,
            'fee_estimation': {
                'input_count': input_count,
                'output_count': output_count,
                'fee_rate_sat_byte': fee_rate,
                'estimated_fee_btc': estimated_fee,
                'estimated_fee_satoshis': int(estimated_fee * 100000000)
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# Registrar todas as rotas
def register_bitcoin_real_routes(app):
    """Registra rotas Bitcoin reais no Flask app"""
    app.register_blueprint(bitcoin_real_bp, url_prefix='/api/bitcoin-real')
    print("✅ Rotas Bitcoin reais registradas em /api/bitcoin-real")

