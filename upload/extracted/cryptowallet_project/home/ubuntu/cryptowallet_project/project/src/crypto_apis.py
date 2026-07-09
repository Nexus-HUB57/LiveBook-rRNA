"""
Módulo para integração com APIs de criptomoedas e análise on-chain
"""
import requests
import json
import hashlib
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

class CryptoAPIManager:
    """Gerenciador de APIs de criptomoedas"""
    
    def __init__(self):
        self.apis = {
            'coinmarketcap': {
                'base_url': 'https://pro-api.coinmarketcap.com/v1',
                'headers': {'X-CMC_PRO_API_KEY': 'demo_key'}  # Usar chave real em produção
            },
            'coingecko': {
                'base_url': 'https://api.coingecko.com/api/v3',
                'headers': {}
            },
            'blockchain_info': {
                'base_url': 'https://blockchain.info',
                'headers': {}
            },
            'etherscan': {
                'base_url': 'https://api.etherscan.io/api',
                'headers': {}
            }
        }
        self.cache = {}
        self.cache_duration = 300  # 5 minutos
    
    def get_crypto_prices(self, symbols: List[str]) -> Dict[str, Any]:
        """Obtém preços atuais das criptomoedas"""
        try:
            # Usa CoinGecko como fonte principal (gratuita)
            symbols_str = ','.join(symbols).lower()
            url = f"{self.apis['coingecko']['base_url']}/simple/price"
            params = {
                'ids': symbols_str,
                'vs_currencies': 'usd,brl',
                'include_24hr_change': 'true',
                'include_market_cap': 'true'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return self._get_mock_prices(symbols)
                
        except Exception as e:
            print(f"Erro ao obter preços: {e}")
            return self._get_mock_prices(symbols)
    
    def get_bitcoin_address_info(self, address: str) -> Dict[str, Any]:
        """Obtém informações de um endereço Bitcoin"""
        try:
            # Simula consulta à blockchain (em produção usar API real)
            return {
                'address': address,
                'balance': 0.0,
                'total_received': 0.0,
                'total_sent': 0.0,
                'transaction_count': 0,
                'first_seen': None,
                'last_seen': None,
                'is_valid': self._validate_bitcoin_address(address)
            }
        except Exception as e:
            return {
                'address': address,
                'error': str(e),
                'is_valid': False
            }
    
    def get_ethereum_address_info(self, address: str) -> Dict[str, Any]:
        """Obtém informações de um endereço Ethereum"""
        try:
            # Simula consulta à blockchain Ethereum
            return {
                'address': address,
                'balance_eth': 0.0,
                'balance_wei': '0',
                'transaction_count': 0,
                'is_contract': False,
                'tokens': [],
                'is_valid': self._validate_ethereum_address(address)
            }
        except Exception as e:
            return {
                'address': address,
                'error': str(e),
                'is_valid': False
            }
    
    def get_market_data(self, symbol: str, days: int = 7) -> Dict[str, Any]:
        """Obtém dados de mercado históricos"""
        try:
            cache_key = f"market_{symbol}_{days}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]['data']
            
            # Simula dados de mercado
            market_data = self._generate_mock_market_data(symbol, days)
            self._cache_data(cache_key, market_data)
            
            return market_data
            
        except Exception as e:
            return {
                'symbol': symbol,
                'error': str(e),
                'data': []
            }
    
    def analyze_wallet_portfolio(self, addresses: List[Dict[str, str]]) -> Dict[str, Any]:
        """Analisa portfólio de uma carteira com múltiplos endereços"""
        portfolio = {
            'total_value_usd': 0.0,
            'total_value_brl': 0.0,
            'assets': {},
            'addresses_analyzed': len(addresses),
            'last_updated': datetime.now().isoformat()
        }
        
        try:
            for addr_info in addresses:
                address = addr_info.get('address', '')
                crypto_type = addr_info.get('type', 'bitcoin')
                
                if crypto_type.lower() == 'bitcoin':
                    info = self.get_bitcoin_address_info(address)
                elif crypto_type.lower() == 'ethereum':
                    info = self.get_ethereum_address_info(address)
                else:
                    continue
                
                if info.get('is_valid') and info.get('balance', 0) > 0:
                    if crypto_type not in portfolio['assets']:
                        portfolio['assets'][crypto_type] = {
                            'balance': 0.0,
                            'addresses': [],
                            'value_usd': 0.0,
                            'value_brl': 0.0
                        }
                    
                    portfolio['assets'][crypto_type]['balance'] += info.get('balance', 0)
                    portfolio['assets'][crypto_type]['addresses'].append(address)
            
            # Calcula valores em fiat
            prices = self.get_crypto_prices(['bitcoin', 'ethereum'])
            for asset, data in portfolio['assets'].items():
                if asset.lower() in prices:
                    price_data = prices[asset.lower()]
                    usd_value = data['balance'] * price_data.get('usd', 0)
                    brl_value = data['balance'] * price_data.get('brl', 0)
                    
                    data['value_usd'] = usd_value
                    data['value_brl'] = brl_value
                    
                    portfolio['total_value_usd'] += usd_value
                    portfolio['total_value_brl'] += brl_value
            
            return portfolio
            
        except Exception as e:
            portfolio['error'] = str(e)
            return portfolio
    
    def get_transaction_fees(self, crypto_type: str) -> Dict[str, Any]:
        """Obtém estimativas de taxas de transação"""
        fees = {
            'bitcoin': {
                'slow': {'sat_per_byte': 1, 'time_minutes': 60, 'usd_estimate': 0.50},
                'medium': {'sat_per_byte': 5, 'time_minutes': 30, 'usd_estimate': 2.50},
                'fast': {'sat_per_byte': 10, 'time_minutes': 10, 'usd_estimate': 5.00}
            },
            'ethereum': {
                'slow': {'gwei': 20, 'time_minutes': 300, 'usd_estimate': 1.00},
                'medium': {'gwei': 30, 'time_minutes': 180, 'usd_estimate': 3.00},
                'fast': {'gwei': 50, 'time_minutes': 60, 'usd_estimate': 8.00}
            }
        }
        
        return fees.get(crypto_type.lower(), {})
    
    def validate_address(self, address: str, crypto_type: str) -> Dict[str, Any]:
        """Valida um endereço de criptomoeda"""
        if crypto_type.lower() == 'bitcoin':
            is_valid = self._validate_bitcoin_address(address)
            address_type = self._get_bitcoin_address_type(address)
        elif crypto_type.lower() == 'ethereum':
            is_valid = self._validate_ethereum_address(address)
            address_type = 'ethereum'
        else:
            is_valid = False
            address_type = 'unknown'
        
        return {
            'address': address,
            'crypto_type': crypto_type,
            'is_valid': is_valid,
            'address_type': address_type,
            'checksum_valid': is_valid
        }
    
    def _validate_bitcoin_address(self, address: str) -> bool:
        """Valida endereço Bitcoin (implementação simplificada)"""
        if not address:
            return False
        
        # Legacy addresses (1...)
        if address.startswith('1') and len(address) >= 26 and len(address) <= 35:
            return True
        
        # P2SH addresses (3...)
        if address.startswith('3') and len(address) >= 26 and len(address) <= 35:
            return True
        
        # Bech32 addresses (bc1...)
        if address.startswith('bc1') and len(address) >= 39 and len(address) <= 62:
            return True
        
        return False
    
    def _validate_ethereum_address(self, address: str) -> bool:
        """Valida endereço Ethereum"""
        if not address:
            return False
        
        # Remove 0x prefix if present
        if address.startswith('0x'):
            address = address[2:]
        
        # Check length (40 hex characters)
        if len(address) != 40:
            return False
        
        # Check if all characters are hex
        try:
            int(address, 16)
            return True
        except ValueError:
            return False
    
    def _get_bitcoin_address_type(self, address: str) -> str:
        """Determina o tipo de endereço Bitcoin"""
        if address.startswith('1'):
            return 'P2PKH (Legacy)'
        elif address.startswith('3'):
            return 'P2SH (Script Hash)'
        elif address.startswith('bc1'):
            return 'Bech32 (SegWit)'
        else:
            return 'Unknown'
    
    def _get_mock_prices(self, symbols: List[str]) -> Dict[str, Any]:
        """Retorna preços simulados para desenvolvimento"""
        mock_prices = {
            'bitcoin': {
                'usd': 45000.0,
                'brl': 225000.0,
                'usd_24h_change': 2.5,
                'usd_market_cap': 850000000000
            },
            'ethereum': {
                'usd': 3200.0,
                'brl': 16000.0,
                'usd_24h_change': 1.8,
                'usd_market_cap': 380000000000
            }
        }
        
        result = {}
        for symbol in symbols:
            if symbol.lower() in mock_prices:
                result[symbol.lower()] = mock_prices[symbol.lower()]
        
        return result
    
    def _generate_mock_market_data(self, symbol: str, days: int) -> Dict[str, Any]:
        """Gera dados de mercado simulados"""
        base_price = 45000 if symbol.lower() == 'bitcoin' else 3200
        data_points = []
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i)
            # Simula variação de preço
            variation = (hash(f"{symbol}{i}") % 200 - 100) / 1000  # -10% a +10%
            price = base_price * (1 + variation)
            
            data_points.append({
                'date': date.isoformat(),
                'price': round(price, 2),
                'volume': round(base_price * 1000000 * (1 + variation/2), 2)
            })
        
        return {
            'symbol': symbol,
            'days': days,
            'data': data_points
        }
    
    def _is_cached(self, key: str) -> bool:
        """Verifica se dados estão em cache e ainda válidos"""
        if key not in self.cache:
            return False
        
        cache_time = self.cache[key]['timestamp']
        return (time.time() - cache_time) < self.cache_duration
    
    def _cache_data(self, key: str, data: Any) -> None:
        """Armazena dados no cache"""
        self.cache[key] = {
            'data': data,
            'timestamp': time.time()
        }

class BlockchainExplorer:
    """Explorador de blockchain para análise on-chain"""
    
    def __init__(self):
        self.supported_networks = ['bitcoin', 'ethereum', 'litecoin', 'bitcoin_cash']
    
    def explore_address(self, address: str, network: str) -> Dict[str, Any]:
        """Explora um endereço na blockchain"""
        try:
            if network.lower() == 'bitcoin':
                return self._explore_bitcoin_address(address)
            elif network.lower() == 'ethereum':
                return self._explore_ethereum_address(address)
            else:
                return {'error': f'Rede {network} não suportada'}
        except Exception as e:
            return {'error': str(e)}
    
    def _explore_bitcoin_address(self, address: str) -> Dict[str, Any]:
        """Explora endereço Bitcoin (simulado)"""
        return {
            'address': address,
            'network': 'bitcoin',
            'balance': 0.0,
            'transactions': [],
            'first_seen': None,
            'last_activity': None,
            'address_type': self._get_bitcoin_address_type(address),
            'qr_code_data': f"bitcoin:{address}"
        }
    
    def _explore_ethereum_address(self, address: str) -> Dict[str, Any]:
        """Explora endereço Ethereum (simulado)"""
        return {
            'address': address,
            'network': 'ethereum',
            'balance_eth': 0.0,
            'balance_wei': '0',
            'transactions': [],
            'tokens': [],
            'is_contract': False,
            'contract_info': None
        }
    
    def _get_bitcoin_address_type(self, address: str) -> str:
        """Determina tipo de endereço Bitcoin"""
        if address.startswith('1'):
            return 'P2PKH'
        elif address.startswith('3'):
            return 'P2SH'
        elif address.startswith('bc1'):
            return 'Bech32'
        else:
            return 'Unknown'

