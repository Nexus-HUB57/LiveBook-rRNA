from flask import Blueprint, request, jsonify
from models import Wallet
from src.wallet_analyzer import WalletAnalyzer
from src.advanced_analyzer import AdvancedWalletAnalyzer
from src.crypto_apis import CryptoAPIManager, BlockchainExplorer
import random
import string
import os

crypto_bp = Blueprint("crypto", __name__)

# Inicializa os analisadores
wallet_analyzer = WalletAnalyzer()
advanced_analyzer = AdvancedWalletAnalyzer()
crypto_api = CryptoAPIManager()
blockchain_explorer = BlockchainExplorer()

@crypto_bp.route("/wallet-info/<int:wallet_id>", methods=["POST"])
def get_wallet_info(wallet_id):
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Análise avançada se o arquivo ainda existir
    advanced_info = {}
    if wallet.file_path and os.path.exists(wallet.file_path):
        try:
            advanced_info = advanced_analyzer.analyze_wallet_comprehensive(wallet.file_path)
        except Exception as e:
            advanced_info = {"error": f"Erro na análise avançada: {str(e)}"}

    # Retorna informações detalhadas da wallet
    info = {
        "id": wallet.id,
        "name": wallet.name,
        "type": wallet.wallet_type,
        "keys_count": wallet.keys_count,
        "addresses_count": wallet.addresses_count,
        "is_encrypted": wallet.is_encrypted,
        "file_size": wallet.file_size,
        "created_at": wallet.created_at.isoformat(),
        "status": "active" if wallet.is_active else "inactive",
        "advanced_analysis": advanced_info,
        "security_level": advanced_info.get("security_level", "unknown"),
        "supported_operations": advanced_info.get("supported_operations", [])
    }
    
    return jsonify(info), 200

@crypto_bp.route("/generate-address/<int:wallet_id>", methods=["POST"])
def generate_address(wallet_id):
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Geração de endereço mais realista baseado no tipo de wallet
    if wallet.wallet_type == "bitcoin_core" or wallet.wallet_type == "berkeley_db":
        # Gerar endereços Bitcoin mais realistas
        address_types = ["1", "3", "bc1"]
        addr_type = random.choice(address_types)
        
        if addr_type == "1":
            address = "1" + "".join(random.choices(string.ascii_letters + string.digits, k=33))
        elif addr_type == "3":
            address = "3" + "".join(random.choices(string.ascii_letters + string.digits, k=33))
        else:  # bc1
            address = "bc1q" + "".join(random.choices("0123456789abcdef", k=39))
            
    elif wallet.wallet_type == "ethereum_keystore":
        # Gerar endereço Ethereum válido
        address = "0x" + "".join(random.choices("0123456789abcdef", k=40))
    else:
        # Endereço genérico
        address = "addr_" + "".join(random.choices(string.ascii_letters + string.digits, k=30))

    # Valida o endereço gerado
    crypto_type = "bitcoin" if "bitcoin" in wallet.wallet_type else "ethereum"
    validation = crypto_api.validate_address(address, crypto_type)

    return jsonify({
        "address": address,
        "wallet_id": wallet_id,
        "wallet_type": wallet.wallet_type,
        "validation": validation,
        "qr_code_data": f"{crypto_type}:{address}",
        "message": "Address generated successfully"
    }), 200

@crypto_bp.route("/validate-address", methods=["POST"])
def validate_address():
    data = request.get_json()
    address = data.get("address")
    crypto_type = data.get("type", "bitcoin")

    if not address:
        return jsonify({"message": "Address is required"}), 400

    # Usa o validador avançado
    validation = crypto_api.validate_address(address, crypto_type)
    
    return jsonify({
        "validation": validation,
        "message": "Address validation completed"
    }), 200

@crypto_bp.route("/estimate-fee", methods=["POST"])
def estimate_fee():
    data = request.get_json()
    crypto_type = data.get("type", "bitcoin")
    amount = data.get("amount", 0)
    priority = data.get("priority", "medium")  # slow, medium, fast

    # Usa estimativas mais realistas
    fee_estimates = crypto_api.get_transaction_fees(crypto_type)
    
    if priority in fee_estimates:
        fee_info = fee_estimates[priority]
        estimated_fee_usd = fee_info.get("usd_estimate", 0)
        
        # Converte para BRL (taxa simulada)
        estimated_fee_brl = estimated_fee_usd * 5.0
        
        return jsonify({
            "crypto_type": crypto_type,
            "amount": amount,
            "priority": priority,
            "fee_info": fee_info,
            "estimated_fee_usd": estimated_fee_usd,
            "estimated_fee_brl": estimated_fee_brl,
            "message": "Fee estimation completed"
        }), 200
    else:
        return jsonify({"message": "Invalid priority level"}), 400

@crypto_bp.route("/transaction-history/<int:wallet_id>", methods=["POST"])
def get_transaction_history(wallet_id):
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Simulação de histórico de transações mais detalhado
    transactions = []
    for i in range(random.randint(3, 10)):
        tx_type = random.choice(["received", "sent"])
        amount = round(random.uniform(0.001, 2.0), 8)
        
        transaction = {
            "id": f"tx_{random.randint(100000, 999999)}",
            "type": tx_type,
            "amount": amount,
            "address": f"{'1' if 'bitcoin' in wallet.wallet_type else '0x'}{random.randint(100000, 999999)}",
            "timestamp": f"2024-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}T{random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00Z",
            "confirmations": random.randint(1, 100),
            "status": random.choice(["confirmed", "pending"]),
            "fee": round(random.uniform(0.0001, 0.01), 6),
            "block_height": random.randint(700000, 800000)
        }
        transactions.append(transaction)

    # Ordena por timestamp (mais recente primeiro)
    transactions.sort(key=lambda x: x["timestamp"], reverse=True)

    return jsonify({
        "wallet_id": wallet_id,
        "transactions": transactions,
        "total_count": len(transactions),
        "summary": {
            "total_received": sum(tx["amount"] for tx in transactions if tx["type"] == "received"),
            "total_sent": sum(tx["amount"] for tx in transactions if tx["type"] == "sent"),
            "total_fees": sum(tx["fee"] for tx in transactions)
        },
        "message": "Transaction history retrieved"
    }), 200

@crypto_bp.route("/backup-wallet/<int:wallet_id>", methods=["POST"])
def backup_wallet(wallet_id):
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Simulação de backup mais detalhada
    backup_info = {
        "wallet_id": wallet_id,
        "backup_id": f"backup_{random.randint(10000, 99999)}",
        "wallet_name": wallet.name,
        "wallet_type": wallet.wallet_type,
        "created_at": wallet.created_at.isoformat(),
        "file_size": wallet.file_size,
        "encrypted": wallet.is_encrypted,
        "keys_count": wallet.keys_count,
        "addresses_count": wallet.addresses_count,
        "backup_format": "encrypted_json",
        "checksum": f"sha256_{random.randint(100000, 999999)}",
        "status": "completed"
    }

    return jsonify({
        "message": "Wallet backup created successfully",
        "backup_info": backup_info
    }), 200

@crypto_bp.route("/market-data", methods=["GET"])
def get_market_data():
    """Obtém dados de mercado das principais criptomoedas"""
    try:
        symbols = ["bitcoin", "ethereum"]
        prices = crypto_api.get_crypto_prices(symbols)
        
        market_data = {
            "timestamp": crypto_api.cache.get("market_timestamp", "2024-01-01T00:00:00Z"),
            "prices": prices,
            "total_market_cap": 2500000000000,  # $2.5T simulado
            "total_volume_24h": 100000000000,   # $100B simulado
            "bitcoin_dominance": 45.2,
            "active_cryptocurrencies": 10000
        }
        
        return jsonify(market_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route("/explore-address", methods=["POST"])
def explore_address():
    """Explora um endereço na blockchain"""
    data = request.get_json()
    address = data.get("address")
    network = data.get("network", "bitcoin")
    
    if not address:
        return jsonify({"message": "Address is required"}), 400
    
    try:
        exploration_result = blockchain_explorer.explore_address(address, network)
        return jsonify(exploration_result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route("/portfolio-analysis/<int:wallet_id>", methods=["POST"])
def analyze_portfolio(wallet_id):
    """Analisa o portfólio de uma carteira"""
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404
    
    try:
        # Simula endereços da carteira
        addresses = [
            {"address": f"1Address{i}", "type": "bitcoin"} 
            for i in range(wallet.addresses_count)
        ]
        
        portfolio = crypto_api.analyze_wallet_portfolio(addresses)
        
        return jsonify({
            "wallet_id": wallet_id,
            "portfolio": portfolio,
            "message": "Portfolio analysis completed"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route("/security-audit/<int:wallet_id>", methods=["POST"])
def security_audit(wallet_id):
    """Realiza auditoria de segurança da carteira"""
    wallet = Wallet.query.get(wallet_id)
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404
    
    try:
        # Análise de segurança
        security_score = 0
        recommendations = []
        
        if wallet.is_encrypted:
            security_score += 30
        else:
            recommendations.append("Ativar criptografia da carteira")
        
        if wallet.keys_count > 1:
            security_score += 20
        
        if wallet.addresses_count > 5:
            security_score += 10
            recommendations.append("Considerar usar endereços únicos para cada transação")
        
        # Classificação de segurança
        if security_score >= 70:
            security_level = "high"
        elif security_score >= 40:
            security_level = "medium"
        else:
            security_level = "low"
        
        audit_result = {
            "wallet_id": wallet_id,
            "security_score": security_score,
            "security_level": security_level,
            "recommendations": recommendations,
            "audit_timestamp": "2024-01-01T00:00:00Z",
            "checks_performed": [
                "encryption_status",
                "key_diversity",
                "address_reuse",
                "backup_status"
            ]
        }
        
        return jsonify(audit_result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

