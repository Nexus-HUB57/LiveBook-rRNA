"""
Módulo para exploração de blockchain e análise de endereços
Integração com APIs de blockchain para obter informações detalhadas
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Union
import logging
import hashlib
import base58

logger = logging.getLogger(__name__)

class BlockchainExplorer:
    """Classe para explorar blockchains e analisar endereços"""
    
    def __init__(self):
        self.apis = {
            'bitcoin': {
                'blockstream': 'https://blockstream.info/api',
                'blockchain_info': 'https://blockchain.info',
                'blockcypher': 'https://api.blockcypher.com/v1/btc/main'
            },
            'ethereum': {
                'etherscan': 'https://api.etherscan.io/api',
                'alchemy': 'https://eth-mainnet.alchemyapi.io/v2',
                'infura': 'https://mainnet.infura.io/v3'
            }
        }
        self.cache = {}
        self.cache_duration = 300  # 5 minutos
        
    def explore_address(self, address: str, network: str = 'bitcoin') -> Dict:
        """
        Explora um endereço na blockchain especificada
        
        Args:
            address: Endereço a ser explorado
            network: Rede blockchain ('bitcoin' ou 'ethereum')
            
        Returns:
            Dict com informações detalhadas do endereço
        """
        cache_key = f"address_{network}_{address}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
        
        try:
            if network.lower() == 'bitcoin':
                result = self._explore_bitcoin_address(address)
            elif network.lower() == 'ethereum':
                result = self._explore_ethereum_address(address)
            else:
                raise ValueError(f"Rede não suportada: {network}")
            
            # Adicionar informações de validação
            result['is_valid'] = self._validate_address(address, network)
            result['address_type'] = self._get_address_type(address, network)
            result['network'] = network
            result['explored_at'] = datetime.now().isoformat()
            
            self.cache[cache_key] = {
                'data': result,
                'timestamp': time.time()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Erro ao explorar endereço {address}: {e}")
            return self._get_mock_address_data(address, network)
    
    def _explore_bitcoin_address(self, address: str) -> Dict:
        """Explora endereço Bitcoin usando APIs públicas"""
        try:
            # Usar Blockstream API (gratuita e confiável)
            url = f"{self.apis['bitcoin']['blockstream']}/address/{address}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Obter transações
            txs_url = f"{self.apis['bitcoin']['blockstream']}/address/{address}/txs"
            txs_response = requests.get(txs_url, timeout=10)
            transactions = txs_response.json() if txs_response.status_code == 200 else []
            
            return {
                'address': address,
                'balance': data.get('chain_stats', {}).get('funded_txo_sum', 0) - 
                         data.get('chain_stats', {}).get('spent_txo_sum', 0),
                'total_received': data.get('chain_stats', {}).get('funded_txo_sum', 0),
                'total_sent': data.get('chain_stats', {}).get('spent_txo_sum', 0),
                'transaction_count': data.get('chain_stats', {}).get('tx_count', 0),
                'unconfirmed_balance': data.get('mempool_stats', {}).get('funded_txo_sum', 0) - 
                                     data.get('mempool_stats', {}).get('spent_txo_sum', 0),
                'transactions': self._format_bitcoin_transactions(transactions[:10]),  # Últimas 10
                'first_seen': self._get_first_transaction_date(transactions),
                'last_activity': self._get_last_transaction_date(transactions)
            }
            
        except Exception as e:
            logger.error(f"Erro na API Bitcoin: {e}")
            raise
    
    def _explore_ethereum_address(self, address: str) -> Dict:
        """Explora endereço Ethereum usando APIs públicas"""
        try:
            # Usar API pública do Etherscan (limitada mas funcional)
            base_url = self.apis['ethereum']['etherscan']
            
            # Obter saldo
            balance_params = {
                'module': 'account',
                'action': 'balance',
                'address': address,
                'tag': 'latest'
            }
            
            balance_response = requests.get(base_url, params=balance_params, timeout=10)
            balance_data = balance_response.json()
            
            balance_wei = int(balance_data.get('result', '0'))
            balance_eth = balance_wei / 10**18
            
            # Obter transações (limitado sem API key)
            tx_params = {
                'module': 'account',
                'action': 'txlist',
                'address': address,
                'startblock': 0,
                'endblock': 99999999,
                'page': 1,
                'offset': 10,
                'sort': 'desc'
            }
            
            tx_response = requests.get(base_url, params=tx_params, timeout=10)
            tx_data = tx_response.json()
            transactions = tx_data.get('result', [])
            
            return {
                'address': address,
                'balance': balance_eth,
                'balance_wei': balance_wei,
                'transaction_count': len(transactions),
                'transactions': self._format_ethereum_transactions(transactions),
                'is_contract': self._is_ethereum_contract(address),
                'first_seen': self._get_first_ethereum_transaction(transactions),
                'last_activity': self._get_last_ethereum_transaction(transactions)
            }
            
        except Exception as e:
            logger.error(f"Erro na API Ethereum: {e}")
            raise
    
    def analyze_transaction_patterns(self, address: str, network: str) -> Dict:
        """
        Analisa padrões de transação de um endereço
        
        Args:
            address: Endereço a ser analisado
            network: Rede blockchain
            
        Returns:
            Dict com análise de padrões
        """
        try:
            address_data = self.explore_address(address, network)
            transactions = address_data.get('transactions', [])
            
            if not transactions:
                return {'error': 'Nenhuma transação encontrada'}
            
            # Análise de padrões
            analysis = {
                'total_transactions': len(transactions),
                'average_amount': 0,
                'largest_transaction': 0,
                'smallest_transaction': float('inf'),
                'transaction_frequency': {},
                'counterparties': set(),
                'time_patterns': {},
                'risk_score': 0
            }
            
            total_amount = 0
            
            for tx in transactions:
                amount = float(tx.get('amount', 0))
                total_amount += amount
                
                if amount > analysis['largest_transaction']:
                    analysis['largest_transaction'] = amount
                
                if amount < analysis['smallest_transaction']:
                    analysis['smallest_transaction'] = amount
                
                # Analisar contrapartes
                if 'from' in tx and tx['from'] != address:
                    analysis['counterparties'].add(tx['from'])
                if 'to' in tx and tx['to'] != address:
                    analysis['counterparties'].add(tx['to'])
            
            analysis['average_amount'] = total_amount / len(transactions) if transactions else 0
            analysis['counterparties'] = len(analysis['counterparties'])
            
            # Calcular score de risco básico
            analysis['risk_score'] = self._calculate_risk_score(analysis, address_data)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Erro ao analisar padrões: {e}")
            return {'error': str(e)}
    
    def get_address_labels(self, address: str, network: str) -> List[str]:
        """
        Obtém labels conhecidos para um endereço
        
        Args:
            address: Endereço a verificar
            network: Rede blockchain
            
        Returns:
            Lista de labels conhecidos
        """
        # Base de dados simulada de endereços conhecidos
        known_addresses = {
            'bitcoin': {
                '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': ['Genesis Block', 'Satoshi Nakamoto'],
                '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy': ['Binance Cold Wallet'],
                '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': ['BitFinex Cold Storage']
            },
            'ethereum': {
                '0x0000000000000000000000000000000000000000': ['Burn Address', 'Null Address'],
                '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae': ['Ethereum Foundation'],
                '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': ['Binance Hot Wallet']
            }
        }
        
        return known_addresses.get(network, {}).get(address, [])
    
    def _validate_address(self, address: str, network: str) -> bool:
        """Valida formato do endereço"""
        try:
            if network.lower() == 'bitcoin':
                return self._validate_bitcoin_address(address)
            elif network.lower() == 'ethereum':
                return self._validate_ethereum_address(address)
            return False
        except:
            return False
    
    def _validate_bitcoin_address(self, address: str) -> bool:
        """Valida endereço Bitcoin"""
        try:
            # Verificar comprimento e caracteres
            if not address or len(address) < 26 or len(address) > 35:
                return False
            
            # Verificar prefixos válidos
            if not (address.startswith('1') or address.startswith('3') or 
                   address.startswith('bc1') or address.startswith('tb1')):
                return False
            
            # Para endereços legacy (1 e 3), verificar Base58
            if address.startswith(('1', '3')):
                try:
                    decoded = base58.b58decode(address)
                    return len(decoded) == 25
                except:
                    return False
            
            return True
            
        except:
            return False
    
    def _validate_ethereum_address(self, address: str) -> bool:
        """Valida endereço Ethereum"""
        try:
            if not address.startswith('0x'):
                return False
            
            if len(address) != 42:
                return False
            
            # Verificar se contém apenas caracteres hexadecimais
            hex_part = address[2:]
            int(hex_part, 16)
            
            return True
            
        except:
            return False
    
    def _get_address_type(self, address: str, network: str) -> str:
        """Determina o tipo do endereço"""
        if network.lower() == 'bitcoin':
            if address.startswith('1'):
                return 'P2PKH (Legacy)'
            elif address.startswith('3'):
                return 'P2SH (Script)'
            elif address.startswith('bc1'):
                return 'Bech32 (SegWit)'
            elif address.startswith('tb1'):
                return 'Testnet Bech32'
        elif network.lower() == 'ethereum':
            if address.startswith('0x'):
                return 'Ethereum Address'
        
        return 'Unknown'
    
    def _format_bitcoin_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """Formata transações Bitcoin para exibição"""
        formatted = []
        
        for tx in transactions:
            formatted.append({
                'txid': tx.get('txid'),
                'amount': sum([vout.get('value', 0) for vout in tx.get('vout', [])]) / 100000000,  # Satoshi para BTC
                'confirmations': tx.get('status', {}).get('confirmed', False),
                'timestamp': tx.get('status', {}).get('block_time'),
                'block_height': tx.get('status', {}).get('block_height'),
                'fee': tx.get('fee', 0) / 100000000 if tx.get('fee') else 0
            })
        
        return formatted
    
    def _format_ethereum_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """Formata transações Ethereum para exibição"""
        formatted = []
        
        for tx in transactions:
            formatted.append({
                'hash': tx.get('hash'),
                'from': tx.get('from'),
                'to': tx.get('to'),
                'amount': int(tx.get('value', '0')) / 10**18,  # Wei para ETH
                'gas_used': tx.get('gasUsed'),
                'gas_price': int(tx.get('gasPrice', '0')) / 10**9,  # Wei para Gwei
                'timestamp': int(tx.get('timeStamp', 0)),
                'block_number': tx.get('blockNumber'),
                'confirmations': tx.get('confirmations', 0)
            })
        
        return formatted
    
    def _is_ethereum_contract(self, address: str) -> bool:
        """Verifica se endereço Ethereum é um contrato"""
        # Implementação simplificada - em produção usaria web3.py
        return False
    
    def _get_first_transaction_date(self, transactions: List[Dict]) -> Optional[str]:
        """Obtém data da primeira transação"""
        if not transactions:
            return None
        
        # Assumindo que transações estão ordenadas por data
        oldest_tx = min(transactions, key=lambda x: x.get('status', {}).get('block_time', 0))
        timestamp = oldest_tx.get('status', {}).get('block_time')
        
        if timestamp:
            return datetime.fromtimestamp(timestamp).isoformat()
        
        return None
    
    def _get_last_transaction_date(self, transactions: List[Dict]) -> Optional[str]:
        """Obtém data da última transação"""
        if not transactions:
            return None
        
        latest_tx = max(transactions, key=lambda x: x.get('status', {}).get('block_time', 0))
        timestamp = latest_tx.get('status', {}).get('block_time')
        
        if timestamp:
            return datetime.fromtimestamp(timestamp).isoformat()
        
        return None
    
    def _get_first_ethereum_transaction(self, transactions: List[Dict]) -> Optional[str]:
        """Obtém primeira transação Ethereum"""
        if not transactions:
            return None
        
        oldest_tx = min(transactions, key=lambda x: int(x.get('timeStamp', 0)))
        timestamp = int(oldest_tx.get('timeStamp', 0))
        
        if timestamp:
            return datetime.fromtimestamp(timestamp).isoformat()
        
        return None
    
    def _get_last_ethereum_transaction(self, transactions: List[Dict]) -> Optional[str]:
        """Obtém última transação Ethereum"""
        if not transactions:
            return None
        
        latest_tx = max(transactions, key=lambda x: int(x.get('timeStamp', 0)))
        timestamp = int(latest_tx.get('timeStamp', 0))
        
        if timestamp:
            return datetime.fromtimestamp(timestamp).isoformat()
        
        return None
    
    def _calculate_risk_score(self, analysis: Dict, address_data: Dict) -> int:
        """Calcula score de risco básico (0-100)"""
        score = 0
        
        # Fatores de risco
        tx_count = analysis.get('total_transactions', 0)
        if tx_count > 1000:
            score += 20  # Atividade muito alta
        elif tx_count > 100:
            score += 10
        
        # Número de contrapartes
        counterparties = analysis.get('counterparties', 0)
        if counterparties > 100:
            score += 15
        elif counterparties > 50:
            score += 10
        
        # Valor médio das transações
        avg_amount = analysis.get('average_amount', 0)
        if avg_amount > 100:  # Valores altos
            score += 15
        
        # Limitar score entre 0 e 100
        return min(max(score, 0), 100)
    
    def _is_cache_valid(self, key: str) -> bool:
        """Verifica se o cache ainda é válido"""
        if key not in self.cache:
            return False
        
        return (time.time() - self.cache[key]['timestamp']) < self.cache_duration
    
    def _get_mock_address_data(self, address: str, network: str) -> Dict:
        """Retorna dados simulados em caso de erro"""
        return {
            'address': address,
            'network': network,
            'balance': 0.5 if network == 'bitcoin' else 2.3,
            'transaction_count': 15,
            'total_received': 10.0,
            'total_sent': 9.5,
            'is_valid': True,
            'address_type': 'P2PKH (Legacy)' if network == 'bitcoin' else 'Ethereum Address',
            'transactions': [],
            'error': 'Dados simulados - API indisponível',
            'explored_at': datetime.now().isoformat()
        }

# Instância global
blockchain_explorer = BlockchainExplorer()

