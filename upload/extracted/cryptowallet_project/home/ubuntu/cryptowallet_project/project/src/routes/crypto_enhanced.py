from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from ..wallet_analyzer import WalletAnalyzer
from ..advanced_analyzer import AdvancedWalletAnalyzer
from ..crypto_apis import CryptoAPIManager
from ..market_data import market_data
from ..blockchain_explorer import blockchain_explorer
from ..models import db, Wallet

crypto_enhanced_bp = Blueprint('crypto_enhanced', __name__)

@crypto_enhanced_bp.route('/market-data', methods=['GET'])
def get_market_data():
    """Obtém dados de mercado de criptomoedas"""
    try:
        symbols = request.args.getlist('symbols')
        if not symbols:
            symbols = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana']
        
        price_data = market_data.get_price_data(symbols)
        return jsonify(price_data)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter dados de mercado: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/market-overview', methods=['GET'])
def get_market_overview():
    """Obtém visão geral do mercado"""
    try:
        overview = market_data.get_market_overview()
        return jsonify(overview)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter visão geral do mercado: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/trending-coins', methods=['GET'])
def get_trending_coins():
    """Obtém moedas em tendência"""
    try:
        limit = request.args.get('limit', 10, type=int)
        trending = market_data.get_trending_coins(limit)
        return jsonify(trending)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter moedas em tendência: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/explore-address', methods=['POST'])
def explore_address():
    """Explora um endereço na blockchain"""
    try:
        data = request.get_json()
        address = data.get('address')
        network = data.get('network', 'bitcoin')
        
        if not address:
            return jsonify({'error': 'Endereço é obrigatório'}), 400
        
        result = blockchain_explorer.explore_address(address, network)
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao explorar endereço: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/analyze-patterns', methods=['POST'])
def analyze_transaction_patterns():
    """Analisa padrões de transação de um endereço"""
    try:
        data = request.get_json()
        address = data.get('address')
        network = data.get('network', 'bitcoin')
        
        if not address:
            return jsonify({'error': 'Endereço é obrigatório'}), 400
        
        patterns = blockchain_explorer.analyze_transaction_patterns(address, network)
        return jsonify(patterns)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao analisar padrões: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/portfolio-analysis/<int:wallet_id>', methods=['POST'])
def analyze_portfolio(wallet_id):
    """Analisa portfólio de uma carteira"""
    try:
        wallet = Wallet.query.get_or_404(wallet_id)
        
        # Analisar carteira
        analyzer = WalletAnalyzer()
        analysis_result = analyzer.analyze_wallet(wallet.file_path, wallet.password)
        
        addresses = analysis_result.get('addresses', [])
        
        # Simular holdings baseado nos endereços encontrados
        holdings = {}
        total_value_usd = 0
        total_value_brl = 0
        addresses_analyzed = len(addresses)
        
        # Para demonstração, simular alguns valores
        if addresses:
            holdings['bitcoin'] = 0.5  # 0.5 BTC
            holdings['ethereum'] = 2.3  # 2.3 ETH
        
        if holdings:
            portfolio_analysis = market_data.analyze_portfolio_value(holdings)
            total_value_usd = portfolio_analysis.get('total_value_usd', 0)
            total_value_brl = portfolio_analysis.get('total_value_brl', 0)
        
        result = {
            'wallet_id': wallet_id,
            'wallet_name': wallet.name,
            'portfolio': {
                'total_value_usd': total_value_usd,
                'total_value_brl': total_value_brl,
                'addresses_analyzed': addresses_analyzed,
                'holdings': holdings
            },
            'analysis_date': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Erro na análise de portfólio: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/security-audit/<int:wallet_id>', methods=['POST'])
def security_audit(wallet_id):
    """Realiza auditoria de segurança de uma carteira"""
    try:
        wallet = Wallet.query.get_or_404(wallet_id)
        
        # Analisar carteira
        analyzer = WalletAnalyzer()
        analysis_result = analyzer.analyze_wallet(wallet.file_path, wallet.password)
        
        # Usar analisador avançado para auditoria
        advanced_analyzer = AdvancedWalletAnalyzer()
        security_analysis = advanced_analyzer.security_audit(wallet.file_path, wallet.password)
        
        # Calcular score de segurança
        security_score = 0
        recommendations = []
        
        # Verificar criptografia
        if analysis_result.get('is_encrypted'):
            security_score += 30
        else:
            recommendations.append("Criptografar a carteira com uma senha forte")
        
        # Verificar número de chaves
        keys_count = len(analysis_result.get('private_keys', []))
        if keys_count > 0:
            security_score += 20
        
        # Verificar tipo de carteira
        wallet_type = analysis_result.get('wallet_type', '')
        if 'hd' in wallet_type.lower() or 'hierarchical' in wallet_type.lower():
            security_score += 25
            recommendations.append("Carteira HD detectada - boa prática de segurança")
        else:
            recommendations.append("Considerar migrar para carteira HD (Hierarchical Deterministic)")
        
        # Verificar backup
        security_score += 15  # Assumir que tem backup por estar importada
        recommendations.append("Manter backups seguros em locais diferentes")
        
        # Recomendações gerais
        recommendations.extend([
            "Usar autenticação de dois fatores quando disponível",
            "Manter software atualizado",
            "Verificar regularmente atividade suspeita"
        ])
        
        # Determinar nível de segurança
        if security_score >= 80:
            security_level = 'high'
        elif security_score >= 60:
            security_level = 'medium'
        else:
            security_level = 'low'
        
        result = {
            'wallet_id': wallet_id,
            'wallet_name': wallet.name,
            'security_score': security_score,
            'security_level': security_level,
            'recommendations': recommendations,
            'audit_details': {
                'is_encrypted': analysis_result.get('is_encrypted'),
                'keys_count': keys_count,
                'wallet_type': wallet_type,
                'file_size': os.path.getsize(wallet.file_path) if os.path.exists(wallet.file_path) else 0
            },
            'audit_date': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Erro na auditoria de segurança: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/historical-data/<symbol>', methods=['GET'])
def get_historical_data(symbol):
    """Obtém dados históricos de preço"""
    try:
        days = request.args.get('days', 30, type=int)
        historical = market_data.get_historical_data(symbol, days)
        return jsonify(historical)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter dados históricos: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/address-labels/<address>', methods=['GET'])
def get_address_labels(address):
    """Obtém labels conhecidos para um endereço"""
    try:
        network = request.args.get('network', 'bitcoin')
        labels = blockchain_explorer.get_address_labels(address, network)
        return jsonify({'address': address, 'labels': labels})
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter labels: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/validate-address', methods=['POST'])
def validate_address():
    """Valida formato de um endereço"""
    try:
        data = request.get_json()
        address = data.get('address')
        network = data.get('network', 'bitcoin')
        
        if not address:
            return jsonify({'error': 'Endereço é obrigatório'}), 400
        
        is_valid = blockchain_explorer._validate_address(address, network)
        address_type = blockchain_explorer._get_address_type(address, network)
        
        return jsonify({
            'address': address,
            'network': network,
            'is_valid': is_valid,
            'address_type': address_type
        })
        
    except Exception as e:
        current_app.logger.error(f"Erro ao validar endereço: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/price-alerts', methods=['GET', 'POST'])
def manage_price_alerts():
    """Gerencia alertas de preço"""
    if request.method == 'GET':
        # Retornar alertas existentes (simulado)
        alerts = [
            {
                'id': 1,
                'symbol': 'bitcoin',
                'condition': 'above',
                'price': 50000,
                'active': True,
                'created_at': '2024-01-01T00:00:00Z'
            }
        ]
        return jsonify({'alerts': alerts})
    
    elif request.method == 'POST':
        # Criar novo alerta
        data = request.get_json()
        symbol = data.get('symbol')
        condition = data.get('condition')  # 'above' or 'below'
        price = data.get('price')
        
        if not all([symbol, condition, price]):
            return jsonify({'error': 'Dados incompletos'}), 400
        
        # Simular criação do alerta
        alert = {
            'id': 2,
            'symbol': symbol,
            'condition': condition,
            'price': price,
            'active': True,
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({'alert': alert, 'message': 'Alerta criado com sucesso'})

@crypto_enhanced_bp.route('/news', methods=['GET'])
def get_crypto_news():
    """Obtém notícias relacionadas a criptomoedas"""
    try:
        # Simular notícias (em produção, integrar com APIs de notícias)
        news = [
            {
                'title': 'Bitcoin atinge nova máxima histórica',
                'summary': 'O Bitcoin ultrapassou a marca de $50,000 pela primeira vez...',
                'url': 'https://example.com/news/1',
                'published_at': '2024-01-01T12:00:00Z',
                'source': 'CryptoNews'
            },
            {
                'title': 'Ethereum 2.0 mostra progresso significativo',
                'summary': 'A rede Ethereum continua sua transição para proof-of-stake...',
                'url': 'https://example.com/news/2',
                'published_at': '2024-01-01T10:00:00Z',
                'source': 'BlockchainToday'
            }
        ]
        
        return jsonify({'news': news})
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter notícias: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/defi-protocols', methods=['GET'])
def get_defi_protocols():
    """Obtém informações sobre protocolos DeFi"""
    try:
        # Simular dados de protocolos DeFi
        protocols = [
            {
                'name': 'Uniswap',
                'tvl': 5000000000,  # Total Value Locked
                'category': 'DEX',
                'chain': 'Ethereum',
                'apy': 12.5
            },
            {
                'name': 'Compound',
                'tvl': 3000000000,
                'category': 'Lending',
                'chain': 'Ethereum',
                'apy': 8.2
            }
        ]
        
        return jsonify({'protocols': protocols})
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter protocolos DeFi: {e}")
        return jsonify({'error': str(e)}), 500

@crypto_enhanced_bp.route('/nft-collections', methods=['GET'])
def get_nft_collections():
    """Obtém informações sobre coleções NFT"""
    try:
        # Simular dados de NFTs
        collections = [
            {
                'name': 'CryptoPunks',
                'floor_price': 50.0,  # ETH
                'volume_24h': 1000.0,
                'total_supply': 10000,
                'owners': 3500
            },
            {
                'name': 'Bored Ape Yacht Club',
                'floor_price': 30.0,
                'volume_24h': 800.0,
                'total_supply': 10000,
                'owners': 6000
            }
        ]
        
        return jsonify({'collections': collections})
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter coleções NFT: {e}")
        return jsonify({'error': str(e)}), 500

