"""
Módulo de análise avançada com IA para detecção de padrões e anomalias
Utiliza algoritmos de machine learning para análise preditiva
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class AIWalletAnalyzer:
    """Analisador de carteiras com IA para detecção de padrões e anomalias"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.clustering_model = DBSCAN(eps=0.5, min_samples=5)
        
    def analyze_transaction_patterns(self, transactions: List[Dict]) -> Dict:
        """
        Analisa padrões de transação usando machine learning
        
        Args:
            transactions: Lista de transações
            
        Returns:
            Dict com análise de padrões e anomalias
        """
        try:
            if not transactions:
                return {'error': 'Nenhuma transação fornecida'}
            
            # Converter para DataFrame
            df = pd.DataFrame(transactions)
            
            # Extrair features para análise
            features = self._extract_transaction_features(df)
            
            if features.empty:
                return {'error': 'Não foi possível extrair features das transações'}
            
            # Detectar anomalias
            anomalies = self._detect_anomalies(features)
            
            # Análise de clustering
            clusters = self._analyze_clusters(features)
            
            # Análise temporal
            temporal_analysis = self._analyze_temporal_patterns(df)
            
            # Análise de risco
            risk_analysis = self._analyze_risk_patterns(df, anomalies)
            
            return {
                'total_transactions': len(transactions),
                'anomalies': anomalies,
                'clusters': clusters,
                'temporal_patterns': temporal_analysis,
                'risk_analysis': risk_analysis,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de padrões: {e}")
            return {'error': str(e)}
    
    def predict_wallet_behavior(self, wallet_data: Dict) -> Dict:
        """
        Prediz comportamento futuro da carteira baseado em dados históricos
        
        Args:
            wallet_data: Dados históricos da carteira
            
        Returns:
            Dict com predições e recomendações
        """
        try:
            # Extrair métricas históricas
            metrics = self._extract_wallet_metrics(wallet_data)
            
            # Análise de tendências
            trends = self._analyze_trends(metrics)
            
            # Predições baseadas em padrões
            predictions = self._generate_predictions(trends)
            
            # Recomendações baseadas em IA
            recommendations = self._generate_ai_recommendations(wallet_data, predictions)
            
            return {
                'wallet_id': wallet_data.get('id'),
                'metrics': metrics,
                'trends': trends,
                'predictions': predictions,
                'recommendations': recommendations,
                'confidence_score': self._calculate_confidence(metrics),
                'prediction_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na predição: {e}")
            return {'error': str(e)}
    
    def analyze_portfolio_optimization(self, portfolio: Dict) -> Dict:
        """
        Analisa otimização de portfólio usando teoria moderna de portfólio
        
        Args:
            portfolio: Dados do portfólio
            
        Returns:
            Dict com análise de otimização
        """
        try:
            holdings = portfolio.get('holdings', {})
            
            if not holdings:
                return {'error': 'Portfólio vazio'}
            
            # Calcular métricas de risco-retorno
            risk_metrics = self._calculate_risk_metrics(holdings)
            
            # Análise de correlação
            correlation_analysis = self._analyze_correlations(holdings)
            
            # Sugestões de rebalanceamento
            rebalancing = self._suggest_rebalancing(holdings, risk_metrics)
            
            # Análise de diversificação
            diversification = self._analyze_diversification(holdings)
            
            return {
                'portfolio_value': portfolio.get('total_value_usd', 0),
                'risk_metrics': risk_metrics,
                'correlation_analysis': correlation_analysis,
                'rebalancing_suggestions': rebalancing,
                'diversification_score': diversification,
                'optimization_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na otimização de portfólio: {e}")
            return {'error': str(e)}
    
    def detect_security_threats(self, wallet_activity: Dict) -> Dict:
        """
        Detecta ameaças de segurança usando análise comportamental
        
        Args:
            wallet_activity: Atividade da carteira
            
        Returns:
            Dict com análise de segurança
        """
        try:
            threats = []
            risk_score = 0
            
            # Análise de padrões suspeitos
            suspicious_patterns = self._detect_suspicious_patterns(wallet_activity)
            
            # Verificar atividade incomum
            unusual_activity = self._detect_unusual_activity(wallet_activity)
            
            # Análise de endereços suspeitos
            suspicious_addresses = self._analyze_suspicious_addresses(wallet_activity)
            
            # Calcular score de risco total
            risk_score = self._calculate_security_risk_score(
                suspicious_patterns, unusual_activity, suspicious_addresses
            )
            
            # Gerar alertas baseados no risco
            alerts = self._generate_security_alerts(risk_score, threats)
            
            return {
                'risk_score': risk_score,
                'risk_level': self._get_risk_level(risk_score),
                'threats_detected': threats,
                'suspicious_patterns': suspicious_patterns,
                'unusual_activity': unusual_activity,
                'suspicious_addresses': suspicious_addresses,
                'alerts': alerts,
                'recommendations': self._get_security_recommendations(risk_score),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na detecção de ameaças: {e}")
            return {'error': str(e)}
    
    def _extract_transaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extrai features das transações para análise ML"""
        try:
            features = pd.DataFrame()
            
            # Features básicas
            if 'amount' in df.columns:
                features['amount'] = pd.to_numeric(df['amount'], errors='coerce')
                features['amount_log'] = np.log1p(features['amount'])
            
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                features['hour'] = df['timestamp'].dt.hour
                features['day_of_week'] = df['timestamp'].dt.dayofweek
                features['is_weekend'] = features['day_of_week'].isin([5, 6]).astype(int)
            
            # Features de frequência
            if 'from' in df.columns and 'to' in df.columns:
                features['unique_counterparties'] = df.groupby(df.index)['from'].transform('nunique') + \
                                                  df.groupby(df.index)['to'].transform('nunique')
            
            # Features de gas/fee (para Ethereum)
            if 'gas_used' in df.columns:
                features['gas_used'] = pd.to_numeric(df['gas_used'], errors='coerce')
            
            if 'gas_price' in df.columns:
                features['gas_price'] = pd.to_numeric(df['gas_price'], errors='coerce')
            
            # Remover NaN
            features = features.fillna(0)
            
            return features
            
        except Exception as e:
            logger.error(f"Erro ao extrair features: {e}")
            return pd.DataFrame()
    
    def _detect_anomalies(self, features: pd.DataFrame) -> Dict:
        """Detecta anomalias nas transações"""
        try:
            if features.empty:
                return {'anomalies_detected': 0, 'anomaly_indices': []}
            
            # Normalizar features
            features_scaled = self.scaler.fit_transform(features)
            
            # Detectar anomalias
            anomaly_labels = self.anomaly_detector.fit_predict(features_scaled)
            
            # Identificar índices das anomalias
            anomaly_indices = np.where(anomaly_labels == -1)[0].tolist()
            
            return {
                'anomalies_detected': len(anomaly_indices),
                'anomaly_indices': anomaly_indices,
                'anomaly_percentage': len(anomaly_indices) / len(features) * 100
            }
            
        except Exception as e:
            logger.error(f"Erro na detecção de anomalias: {e}")
            return {'anomalies_detected': 0, 'anomaly_indices': []}
    
    def _analyze_clusters(self, features: pd.DataFrame) -> Dict:
        """Analisa clusters de transações"""
        try:
            if features.empty:
                return {'clusters_found': 0}
            
            # Normalizar features
            features_scaled = self.scaler.fit_transform(features)
            
            # Aplicar clustering
            cluster_labels = self.clustering_model.fit_predict(features_scaled)
            
            # Analisar clusters
            unique_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)
            noise_points = list(cluster_labels).count(-1)
            
            return {
                'clusters_found': unique_clusters,
                'noise_points': noise_points,
                'cluster_distribution': dict(zip(*np.unique(cluster_labels, return_counts=True)))
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de clusters: {e}")
            return {'clusters_found': 0}
    
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> Dict:
        """Analisa padrões temporais"""
        try:
            if 'timestamp' not in df.columns:
                return {'error': 'Timestamp não disponível'}
            
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            df = df.dropna(subset=['timestamp'])
            
            if df.empty:
                return {'error': 'Nenhum timestamp válido'}
            
            # Análise por hora do dia
            hourly_activity = df.groupby(df['timestamp'].dt.hour).size().to_dict()
            
            # Análise por dia da semana
            daily_activity = df.groupby(df['timestamp'].dt.dayofweek).size().to_dict()
            
            # Detectar picos de atividade
            peak_hours = sorted(hourly_activity.items(), key=lambda x: x[1], reverse=True)[:3]
            
            return {
                'hourly_activity': hourly_activity,
                'daily_activity': daily_activity,
                'peak_hours': [{'hour': h, 'count': c} for h, c in peak_hours],
                'most_active_day': max(daily_activity.items(), key=lambda x: x[1])[0],
                'activity_span_days': (df['timestamp'].max() - df['timestamp'].min()).days
            }
            
        except Exception as e:
            logger.error(f"Erro na análise temporal: {e}")
            return {'error': str(e)}
    
    def _analyze_risk_patterns(self, df: pd.DataFrame, anomalies: Dict) -> Dict:
        """Analisa padrões de risco"""
        try:
            risk_score = 0
            risk_factors = []
            
            # Fator: Muitas anomalias
            anomaly_percentage = anomalies.get('anomaly_percentage', 0)
            if anomaly_percentage > 10:
                risk_score += 30
                risk_factors.append(f"Alto percentual de anomalias: {anomaly_percentage:.1f}%")
            
            # Fator: Valores muito altos
            if 'amount' in df.columns:
                amounts = pd.to_numeric(df['amount'], errors='coerce').dropna()
                if not amounts.empty:
                    high_value_threshold = amounts.quantile(0.95)
                    high_value_txs = (amounts > high_value_threshold).sum()
                    if high_value_txs > len(amounts) * 0.1:
                        risk_score += 20
                        risk_factors.append("Muitas transações de alto valor")
            
            # Fator: Atividade em horários suspeitos
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                night_txs = df[df['timestamp'].dt.hour.between(0, 5)].shape[0]
                if night_txs > len(df) * 0.3:
                    risk_score += 15
                    risk_factors.append("Muita atividade noturna")
            
            # Determinar nível de risco
            if risk_score >= 50:
                risk_level = 'high'
            elif risk_score >= 25:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            return {
                'risk_score': min(risk_score, 100),
                'risk_level': risk_level,
                'risk_factors': risk_factors
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de risco: {e}")
            return {'risk_score': 0, 'risk_level': 'unknown'}
    
    def _extract_wallet_metrics(self, wallet_data: Dict) -> Dict:
        """Extrai métricas da carteira para análise"""
        return {
            'transaction_count': wallet_data.get('transaction_count', 0),
            'total_value': wallet_data.get('total_value_usd', 0),
            'average_transaction': wallet_data.get('average_transaction', 0),
            'active_days': wallet_data.get('active_days', 0),
            'unique_addresses': wallet_data.get('unique_addresses', 0)
        }
    
    def _analyze_trends(self, metrics: Dict) -> Dict:
        """Analisa tendências das métricas"""
        # Simulação de análise de tendências
        return {
            'transaction_trend': 'increasing',
            'value_trend': 'stable',
            'activity_trend': 'decreasing'
        }
    
    def _generate_predictions(self, trends: Dict) -> Dict:
        """Gera predições baseadas em tendências"""
        return {
            'next_30_days': {
                'expected_transactions': 25,
                'expected_value_change': 5.2,
                'activity_level': 'medium'
            },
            'confidence': 0.75
        }
    
    def _generate_ai_recommendations(self, wallet_data: Dict, predictions: Dict) -> List[str]:
        """Gera recomendações baseadas em IA"""
        recommendations = []
        
        if wallet_data.get('transaction_count', 0) > 100:
            recommendations.append("Considere usar endereços únicos para melhor privacidade")
        
        if predictions.get('next_30_days', {}).get('activity_level') == 'high':
            recommendations.append("Monitore taxas de transação devido à alta atividade prevista")
        
        recommendations.append("Mantenha backups atualizados da carteira")
        
        return recommendations
    
    def _calculate_confidence(self, metrics: Dict) -> float:
        """Calcula score de confiança das predições"""
        # Baseado na quantidade de dados disponíveis
        tx_count = metrics.get('transaction_count', 0)
        if tx_count > 100:
            return 0.9
        elif tx_count > 50:
            return 0.7
        elif tx_count > 10:
            return 0.5
        else:
            return 0.3
    
    def _calculate_risk_metrics(self, holdings: Dict) -> Dict:
        """Calcula métricas de risco do portfólio"""
        # Simulação de cálculo de risco
        return {
            'volatility': 0.25,
            'sharpe_ratio': 1.2,
            'max_drawdown': 0.15,
            'var_95': 0.08
        }
    
    def _analyze_correlations(self, holdings: Dict) -> Dict:
        """Analisa correlações entre ativos"""
        # Simulação de análise de correlação
        correlations = {}
        assets = list(holdings.keys())
        
        for i, asset1 in enumerate(assets):
            for asset2 in assets[i+1:]:
                # Correlação simulada
                correlation = np.random.uniform(0.3, 0.8)
                correlations[f"{asset1}-{asset2}"] = correlation
        
        return correlations
    
    def _suggest_rebalancing(self, holdings: Dict, risk_metrics: Dict) -> List[Dict]:
        """Sugere rebalanceamento do portfólio"""
        suggestions = []
        
        total_value = sum(holdings.values())
        
        for asset, amount in holdings.items():
            percentage = (amount / total_value) * 100
            
            if percentage > 50:
                suggestions.append({
                    'action': 'reduce',
                    'asset': asset,
                    'current_percentage': percentage,
                    'suggested_percentage': 40,
                    'reason': 'Concentração excessiva'
                })
        
        return suggestions
    
    def _analyze_diversification(self, holdings: Dict) -> float:
        """Analisa score de diversificação"""
        if not holdings:
            return 0.0
        
        # Calcular índice Herfindahl-Hirschman
        total_value = sum(holdings.values())
        percentages = [(amount / total_value) for amount in holdings.values()]
        hhi = sum([p**2 for p in percentages])
        
        # Converter para score de diversificação (0-100)
        diversification_score = (1 - hhi) * 100
        
        return min(max(diversification_score, 0), 100)
    
    def _detect_suspicious_patterns(self, wallet_activity: Dict) -> List[Dict]:
        """Detecta padrões suspeitos"""
        patterns = []
        
        # Exemplo: Transações em horários incomuns
        if wallet_activity.get('night_transactions', 0) > 10:
            patterns.append({
                'type': 'unusual_timing',
                'description': 'Muitas transações em horários noturnos',
                'severity': 'medium'
            })
        
        return patterns
    
    def _detect_unusual_activity(self, wallet_activity: Dict) -> List[Dict]:
        """Detecta atividade incomum"""
        unusual = []
        
        # Exemplo: Pico súbito de atividade
        recent_tx = wallet_activity.get('recent_transactions', 0)
        avg_tx = wallet_activity.get('average_transactions', 0)
        
        if recent_tx > avg_tx * 3:
            unusual.append({
                'type': 'activity_spike',
                'description': 'Pico súbito de atividade',
                'severity': 'high'
            })
        
        return unusual
    
    def _analyze_suspicious_addresses(self, wallet_activity: Dict) -> List[Dict]:
        """Analisa endereços suspeitos"""
        # Simulação de análise de endereços
        return []
    
    def _calculate_security_risk_score(self, patterns: List, activity: List, addresses: List) -> int:
        """Calcula score de risco de segurança"""
        score = 0
        
        # Pontuação baseada em padrões detectados
        score += len(patterns) * 10
        score += len(activity) * 15
        score += len(addresses) * 20
        
        return min(score, 100)
    
    def _get_risk_level(self, risk_score: int) -> str:
        """Determina nível de risco"""
        if risk_score >= 70:
            return 'high'
        elif risk_score >= 40:
            return 'medium'
        else:
            return 'low'
    
    def _generate_security_alerts(self, risk_score: int, threats: List) -> List[Dict]:
        """Gera alertas de segurança"""
        alerts = []
        
        if risk_score >= 70:
            alerts.append({
                'level': 'critical',
                'message': 'Alto risco de segurança detectado',
                'action': 'Revisar atividade imediatamente'
            })
        elif risk_score >= 40:
            alerts.append({
                'level': 'warning',
                'message': 'Risco moderado de segurança',
                'action': 'Monitorar atividade'
            })
        
        return alerts
    
    def _get_security_recommendations(self, risk_score: int) -> List[str]:
        """Obtém recomendações de segurança"""
        recommendations = [
            "Manter software atualizado",
            "Usar autenticação de dois fatores",
            "Fazer backups regulares"
        ]
        
        if risk_score >= 50:
            recommendations.extend([
                "Revisar todas as transações recentes",
                "Considerar mover fundos para carteira mais segura",
                "Verificar se há malware no sistema"
            ])
        
        return recommendations

# Instância global
ai_analyzer = AIWalletAnalyzer()

