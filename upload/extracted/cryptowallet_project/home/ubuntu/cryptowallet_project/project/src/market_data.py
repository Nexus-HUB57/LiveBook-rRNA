"""
Módulo para coleta e análise de dados de mercado de criptomoedas
Integração com APIs públicas para preços e informações em tempo real
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class CryptoMarketData:
    """Classe para gerenciar dados de mercado de criptomoedas"""
    
    def __init__(self):
        self.base_urls = {
            'coingecko': 'https://api.coingecko.com/api/v3',
            'coinapi': 'https://rest.coinapi.io/v1',
            'binance': 'https://api.binance.com/api/v3'
        }
        self.cache = {}
        self.cache_duration = 300  # 5 minutos
        
    def get_price_data(self, symbols: List[str] = None) -> Dict:
        """
        Obtém dados de preço para criptomoedas especificadas
        
        Args:
            symbols: Lista de símbolos de criptomoedas (ex: ['bitcoin', 'ethereum'])
            
        Returns:
            Dict com dados de preço e variação
        """
        if symbols is None:
            symbols = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana']
            
        cache_key = f"prices_{'-'.join(symbols)}"
        
        # Verificar cache
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
            
        try:
            # Usar CoinGecko API (gratuita)
            url = f"{self.base_urls['coingecko']}/simple/price"
            params = {
                'ids': ','.join(symbols),
                'vs_currencies': 'usd,brl',
                'include_24hr_change': 'true',
                'include_market_cap': 'true',
                'include_24hr_vol': 'true'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Formatar dados
            formatted_data = {
                'prices': {},
                'last_updated': datetime.now().isoformat(),
                'total_market_cap': 0,
                'total_volume_24h': 0,
                'bitcoin_dominance': 45.2  # Valor simulado
            }
            
            total_market_cap = 0
            total_volume = 0
            
            for symbol, price_data in data.items():
                formatted_data['prices'][symbol] = {
                    'usd': price_data.get('usd', 0),
                    'brl': price_data.get('brl', 0),
                    'usd_24h_change': price_data.get('usd_24h_change', 0),
                    'market_cap_usd': price_data.get('usd_market_cap', 0),
                    'volume_24h_usd': price_data.get('usd_24h_vol', 0)
                }
                
                total_market_cap += price_data.get('usd_market_cap', 0)
                total_volume += price_data.get('usd_24h_vol', 0)
            
            formatted_data['total_market_cap'] = total_market_cap
            formatted_data['total_volume_24h'] = total_volume
            
            # Salvar no cache
            self.cache[cache_key] = {
                'data': formatted_data,
                'timestamp': time.time()
            }
            
            return formatted_data
            
        except Exception as e:
            logger.error(f"Erro ao obter dados de preço: {e}")
            return self._get_mock_price_data()
    
    def get_market_overview(self) -> Dict:
        """
        Obtém visão geral do mercado de criptomoedas
        
        Returns:
            Dict com estatísticas gerais do mercado
        """
        cache_key = "market_overview"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
            
        try:
            url = f"{self.base_urls['coingecko']}/global"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()['data']
            
            overview = {
                'total_market_cap_usd': data.get('total_market_cap', {}).get('usd', 0),
                'total_volume_24h_usd': data.get('total_volume', {}).get('usd', 0),
                'bitcoin_dominance': data.get('market_cap_percentage', {}).get('btc', 0),
                'ethereum_dominance': data.get('market_cap_percentage', {}).get('eth', 0),
                'active_cryptocurrencies': data.get('active_cryptocurrencies', 0),
                'markets': data.get('markets', 0),
                'market_cap_change_24h': data.get('market_cap_change_percentage_24h_usd', 0)
            }
            
            self.cache[cache_key] = {
                'data': overview,
                'timestamp': time.time()
            }
            
            return overview
            
        except Exception as e:
            logger.error(f"Erro ao obter visão geral do mercado: {e}")
            return self._get_mock_market_overview()
    
    def get_trending_coins(self, limit: int = 10) -> List[Dict]:
        """
        Obtém lista de criptomoedas em tendência
        
        Args:
            limit: Número máximo de moedas a retornar
            
        Returns:
            Lista de dicionários com dados das moedas em tendência
        """
        cache_key = f"trending_{limit}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
            
        try:
            url = f"{self.base_urls['coingecko']}/search/trending"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            trending = []
            
            for coin_data in data.get('coins', [])[:limit]:
                coin = coin_data.get('item', {})
                trending.append({
                    'id': coin.get('id'),
                    'name': coin.get('name'),
                    'symbol': coin.get('symbol'),
                    'market_cap_rank': coin.get('market_cap_rank'),
                    'thumb': coin.get('thumb'),
                    'price_btc': coin.get('price_btc')
                })
            
            self.cache[cache_key] = {
                'data': trending,
                'timestamp': time.time()
            }
            
            return trending
            
        except Exception as e:
            logger.error(f"Erro ao obter moedas em tendência: {e}")
            return self._get_mock_trending()
    
    def get_historical_data(self, symbol: str, days: int = 30) -> Dict:
        """
        Obtém dados históricos de preço
        
        Args:
            symbol: Símbolo da criptomoeda
            days: Número de dias de histórico
            
        Returns:
            Dict com dados históricos
        """
        cache_key = f"historical_{symbol}_{days}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]['data']
            
        try:
            url = f"{self.base_urls['coingecko']}/coins/{symbol}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily' if days > 1 else 'hourly'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            historical = {
                'prices': data.get('prices', []),
                'market_caps': data.get('market_caps', []),
                'total_volumes': data.get('total_volumes', []),
                'symbol': symbol,
                'days': days
            }
            
            self.cache[cache_key] = {
                'data': historical,
                'timestamp': time.time()
            }
            
            return historical
            
        except Exception as e:
            logger.error(f"Erro ao obter dados históricos: {e}")
            return self._get_mock_historical_data(symbol, days)
    
    def analyze_portfolio_value(self, holdings: Dict[str, float]) -> Dict:
        """
        Analisa o valor de um portfólio baseado nas holdings
        
        Args:
            holdings: Dict com símbolo da moeda e quantidade
            
        Returns:
            Dict com análise do portfólio
        """
        try:
            symbols = list(holdings.keys())
            price_data = self.get_price_data(symbols)
            
            total_value_usd = 0
            total_value_brl = 0
            portfolio_breakdown = {}
            
            for symbol, amount in holdings.items():
                if symbol in price_data['prices']:
                    price_usd = price_data['prices'][symbol]['usd']
                    price_brl = price_data['prices'][symbol]['brl']
                    
                    value_usd = amount * price_usd
                    value_brl = amount * price_brl
                    
                    total_value_usd += value_usd
                    total_value_brl += value_brl
                    
                    portfolio_breakdown[symbol] = {
                        'amount': amount,
                        'price_usd': price_usd,
                        'price_brl': price_brl,
                        'value_usd': value_usd,
                        'value_brl': value_brl,
                        'change_24h': price_data['prices'][symbol]['usd_24h_change']
                    }
            
            # Calcular percentuais
            for symbol in portfolio_breakdown:
                portfolio_breakdown[symbol]['percentage'] = (
                    portfolio_breakdown[symbol]['value_usd'] / total_value_usd * 100
                    if total_value_usd > 0 else 0
                )
            
            return {
                'total_value_usd': total_value_usd,
                'total_value_brl': total_value_brl,
                'breakdown': portfolio_breakdown,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao analisar portfólio: {e}")
            return {
                'total_value_usd': 0,
                'total_value_brl': 0,
                'breakdown': {},
                'error': str(e)
            }
    
    def _is_cache_valid(self, key: str) -> bool:
        """Verifica se o cache ainda é válido"""
        if key not in self.cache:
            return False
        
        return (time.time() - self.cache[key]['timestamp']) < self.cache_duration
    
    def _get_mock_price_data(self) -> Dict:
        """Retorna dados simulados em caso de erro na API"""
        return {
            'prices': {
                'bitcoin': {
                    'usd': 43250.00,
                    'brl': 215000.00,
                    'usd_24h_change': 2.5,
                    'market_cap_usd': 850000000000,
                    'volume_24h_usd': 25000000000
                },
                'ethereum': {
                    'usd': 2650.00,
                    'brl': 13200.00,
                    'usd_24h_change': -1.2,
                    'market_cap_usd': 320000000000,
                    'volume_24h_usd': 15000000000
                }
            },
            'total_market_cap': 1700000000000,
            'total_volume_24h': 80000000000,
            'bitcoin_dominance': 50.2,
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_mock_market_overview(self) -> Dict:
        """Retorna visão geral simulada do mercado"""
        return {
            'total_market_cap_usd': 1700000000000,
            'total_volume_24h_usd': 80000000000,
            'bitcoin_dominance': 50.2,
            'ethereum_dominance': 18.8,
            'active_cryptocurrencies': 8500,
            'markets': 650,
            'market_cap_change_24h': 2.1
        }
    
    def _get_mock_trending(self) -> List[Dict]:
        """Retorna lista simulada de moedas em tendência"""
        return [
            {
                'id': 'bitcoin',
                'name': 'Bitcoin',
                'symbol': 'BTC',
                'market_cap_rank': 1,
                'thumb': '',
                'price_btc': 1.0
            },
            {
                'id': 'ethereum',
                'name': 'Ethereum',
                'symbol': 'ETH',
                'market_cap_rank': 2,
                'thumb': '',
                'price_btc': 0.061
            }
        ]
    
    def _get_mock_historical_data(self, symbol: str, days: int) -> Dict:
        """Retorna dados históricos simulados"""
        import random
        
        base_price = 43250 if symbol == 'bitcoin' else 2650
        prices = []
        
        for i in range(days):
            timestamp = int((datetime.now() - timedelta(days=days-i)).timestamp() * 1000)
            price = base_price * (1 + random.uniform(-0.05, 0.05))
            prices.append([timestamp, price])
        
        return {
            'prices': prices,
            'market_caps': [],
            'total_volumes': [],
            'symbol': symbol,
            'days': days
        }

# Instância global
market_data = CryptoMarketData()

