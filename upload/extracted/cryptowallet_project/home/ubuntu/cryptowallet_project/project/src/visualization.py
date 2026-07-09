"""
Módulo de visualização de dados para análise de carteiras e mercado
Gera gráficos e dashboards interativos
"""

import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import base64
import io
import logging

logger = logging.getLogger(__name__)

# Configurar estilo dos gráficos
plt.style.use('dark_background')
sns.set_palette("husl")

class CryptoVisualization:
    """Classe para gerar visualizações de dados de criptomoedas"""
    
    def __init__(self):
        self.colors = {
            'primary': '#00D4FF',
            'secondary': '#FF6B6B',
            'success': '#4ECDC4',
            'warning': '#FFE66D',
            'danger': '#FF6B6B',
            'background': '#1A1A1A',
            'surface': '#2D2D2D'
        }
        
    def create_portfolio_pie_chart(self, holdings: Dict) -> str:
        """
        Cria gráfico de pizza do portfólio
        
        Args:
            holdings: Dict com ativos e valores
            
        Returns:
            String base64 da imagem
        """
        try:
            if not holdings:
                return self._create_empty_chart("Portfólio vazio")
            
            # Preparar dados
            labels = list(holdings.keys())
            values = list(holdings.values())
            
            # Criar gráfico com Plotly
            fig = go.Figure(data=[go.Pie(
                labels=labels,
                values=values,
                hole=0.4,
                textinfo='label+percent',
                textfont_size=12,
                marker=dict(
                    colors=px.colors.qualitative.Set3,
                    line=dict(color='#000000', width=2)
                )
            )])
            
            fig.update_layout(
                title={
                    'text': 'Distribuição do Portfólio',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                showlegend=True,
                legend=dict(
                    orientation="v",
                    yanchor="middle",
                    y=0.5,
                    xanchor="left",
                    x=1.01
                )
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico de pizza: {e}")
            return self._create_empty_chart("Erro ao gerar gráfico")
    
    def create_price_chart(self, price_data: Dict, symbol: str) -> str:
        """
        Cria gráfico de preços históricos
        
        Args:
            price_data: Dados de preço histórico
            symbol: Símbolo da criptomoeda
            
        Returns:
            String base64 da imagem
        """
        try:
            prices = price_data.get('prices', [])
            
            if not prices:
                return self._create_empty_chart("Dados de preço indisponíveis")
            
            # Converter dados para DataFrame
            df = pd.DataFrame(prices, columns=['timestamp', 'price'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            # Criar gráfico
            fig = go.Figure()
            
            fig.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df['price'],
                mode='lines',
                name=f'{symbol.upper()} Price',
                line=dict(color=self.colors['primary'], width=2),
                fill='tonexty',
                fillcolor=f"rgba(0, 212, 255, 0.1)"
            ))
            
            fig.update_layout(
                title={
                    'text': f'Histórico de Preços - {symbol.upper()}',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                xaxis_title='Data',
                yaxis_title='Preço (USD)',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                xaxis=dict(gridcolor='rgba(255,255,255,0.1)'),
                yaxis=dict(gridcolor='rgba(255,255,255,0.1)')
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico de preços: {e}")
            return self._create_empty_chart("Erro ao gerar gráfico")
    
    def create_transaction_heatmap(self, transactions: List[Dict]) -> str:
        """
        Cria heatmap de atividade de transações
        
        Args:
            transactions: Lista de transações
            
        Returns:
            String base64 da imagem
        """
        try:
            if not transactions:
                return self._create_empty_chart("Nenhuma transação encontrada")
            
            # Converter para DataFrame
            df = pd.DataFrame(transactions)
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            df = df.dropna(subset=['timestamp'])
            
            if df.empty:
                return self._create_empty_chart("Dados de timestamp inválidos")
            
            # Criar matriz de atividade (hora x dia da semana)
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            
            activity_matrix = df.groupby(['day_of_week', 'hour']).size().unstack(fill_value=0)
            
            # Nomes dos dias
            day_names = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
            
            # Criar heatmap
            fig = go.Figure(data=go.Heatmap(
                z=activity_matrix.values,
                x=list(range(24)),
                y=day_names,
                colorscale='Viridis',
                showscale=True,
                colorbar=dict(title="Transações")
            ))
            
            fig.update_layout(
                title={
                    'text': 'Padrão de Atividade de Transações',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                xaxis_title='Hora do Dia',
                yaxis_title='Dia da Semana',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white')
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar heatmap: {e}")
            return self._create_empty_chart("Erro ao gerar heatmap")
    
    def create_risk_gauge(self, risk_score: int) -> str:
        """
        Cria gauge de risco
        
        Args:
            risk_score: Score de risco (0-100)
            
        Returns:
            String base64 da imagem
        """
        try:
            # Determinar cor baseada no risco
            if risk_score >= 70:
                color = self.colors['danger']
                risk_text = 'Alto Risco'
            elif risk_score >= 40:
                color = self.colors['warning']
                risk_text = 'Risco Moderado'
            else:
                color = self.colors['success']
                risk_text = 'Baixo Risco'
            
            # Criar gauge
            fig = go.Figure(go.Indicator(
                mode = "gauge+number+delta",
                value = risk_score,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': f"Score de Risco<br><span style='font-size:0.8em;color:gray'>{risk_text}</span>"},
                delta = {'reference': 50},
                gauge = {
                    'axis': {'range': [None, 100]},
                    'bar': {'color': color},
                    'steps': [
                        {'range': [0, 40], 'color': "rgba(76, 205, 196, 0.3)"},
                        {'range': [40, 70], 'color': "rgba(255, 230, 109, 0.3)"},
                        {'range': [70, 100], 'color': "rgba(255, 107, 107, 0.3)"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ))
            
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white', size=16),
                height=400
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar gauge de risco: {e}")
            return self._create_empty_chart("Erro ao gerar gauge")
    
    def create_market_overview_chart(self, market_data: Dict) -> str:
        """
        Cria gráfico de visão geral do mercado
        
        Args:
            market_data: Dados de mercado
            
        Returns:
            String base64 da imagem
        """
        try:
            prices = market_data.get('prices', {})
            
            if not prices:
                return self._create_empty_chart("Dados de mercado indisponíveis")
            
            # Preparar dados
            symbols = []
            current_prices = []
            changes_24h = []
            
            for symbol, data in prices.items():
                symbols.append(symbol.upper())
                current_prices.append(data.get('usd', 0))
                changes_24h.append(data.get('usd_24h_change', 0))
            
            # Criar subplot
            fig = make_subplots(
                rows=2, cols=1,
                subplot_titles=('Preços Atuais (USD)', 'Variação 24h (%)'),
                vertical_spacing=0.1
            )
            
            # Gráfico de preços
            fig.add_trace(
                go.Bar(
                    x=symbols,
                    y=current_prices,
                    name='Preço USD',
                    marker_color=self.colors['primary']
                ),
                row=1, col=1
            )
            
            # Gráfico de variações (cores baseadas em positivo/negativo)
            colors = [self.colors['success'] if change >= 0 else self.colors['danger'] for change in changes_24h]
            
            fig.add_trace(
                go.Bar(
                    x=symbols,
                    y=changes_24h,
                    name='Variação 24h',
                    marker_color=colors
                ),
                row=2, col=1
            )
            
            fig.update_layout(
                title={
                    'text': 'Visão Geral do Mercado',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                showlegend=False,
                height=600
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico de mercado: {e}")
            return self._create_empty_chart("Erro ao gerar gráfico")
    
    def create_correlation_matrix(self, correlations: Dict) -> str:
        """
        Cria matriz de correlação
        
        Args:
            correlations: Dados de correlação
            
        Returns:
            String base64 da imagem
        """
        try:
            if not correlations:
                return self._create_empty_chart("Dados de correlação indisponíveis")
            
            # Extrair ativos únicos
            assets = set()
            for pair in correlations.keys():
                asset1, asset2 = pair.split('-')
                assets.add(asset1)
                assets.add(asset2)
            
            assets = sorted(list(assets))
            
            # Criar matriz
            matrix = np.eye(len(assets))
            
            for i, asset1 in enumerate(assets):
                for j, asset2 in enumerate(assets):
                    if i != j:
                        pair1 = f"{asset1}-{asset2}"
                        pair2 = f"{asset2}-{asset1}"
                        
                        if pair1 in correlations:
                            matrix[i][j] = correlations[pair1]
                        elif pair2 in correlations:
                            matrix[i][j] = correlations[pair2]
            
            # Criar heatmap
            fig = go.Figure(data=go.Heatmap(
                z=matrix,
                x=assets,
                y=assets,
                colorscale='RdBu',
                zmid=0,
                showscale=True,
                colorbar=dict(title="Correlação")
            ))
            
            fig.update_layout(
                title={
                    'text': 'Matriz de Correlação',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white')
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar matriz de correlação: {e}")
            return self._create_empty_chart("Erro ao gerar matriz")
    
    def create_anomaly_scatter(self, transactions: List[Dict], anomaly_indices: List[int]) -> str:
        """
        Cria scatter plot destacando anomalias
        
        Args:
            transactions: Lista de transações
            anomaly_indices: Índices das anomalias
            
        Returns:
            String base64 da imagem
        """
        try:
            if not transactions:
                return self._create_empty_chart("Nenhuma transação encontrada")
            
            df = pd.DataFrame(transactions)
            
            # Verificar se temos dados necessários
            if 'amount' not in df.columns or 'timestamp' not in df.columns:
                return self._create_empty_chart("Dados insuficientes para análise")
            
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            df = df.dropna(subset=['timestamp', 'amount'])
            
            if df.empty:
                return self._create_empty_chart("Dados inválidos")
            
            # Criar scatter plot
            fig = go.Figure()
            
            # Transações normais
            normal_indices = [i for i in range(len(df)) if i not in anomaly_indices]
            
            if normal_indices:
                fig.add_trace(go.Scatter(
                    x=df.iloc[normal_indices]['timestamp'],
                    y=df.iloc[normal_indices]['amount'],
                    mode='markers',
                    name='Transações Normais',
                    marker=dict(color=self.colors['primary'], size=8)
                ))
            
            # Anomalias
            if anomaly_indices:
                valid_anomaly_indices = [i for i in anomaly_indices if i < len(df)]
                if valid_anomaly_indices:
                    fig.add_trace(go.Scatter(
                        x=df.iloc[valid_anomaly_indices]['timestamp'],
                        y=df.iloc[valid_anomaly_indices]['amount'],
                        mode='markers',
                        name='Anomalias',
                        marker=dict(color=self.colors['danger'], size=12, symbol='x')
                    ))
            
            fig.update_layout(
                title={
                    'text': 'Detecção de Anomalias em Transações',
                    'x': 0.5,
                    'font': {'size': 20, 'color': 'white'}
                },
                xaxis_title='Data',
                yaxis_title='Valor da Transação',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                xaxis=dict(gridcolor='rgba(255,255,255,0.1)'),
                yaxis=dict(gridcolor='rgba(255,255,255,0.1)')
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar scatter de anomalias: {e}")
            return self._create_empty_chart("Erro ao gerar gráfico")
    
    def _fig_to_base64(self, fig) -> str:
        """Converte figura Plotly para base64"""
        try:
            img_bytes = fig.to_image(format="png", width=800, height=600)
            img_base64 = base64.b64encode(img_bytes).decode()
            return f"data:image/png;base64,{img_base64}"
        except Exception as e:
            logger.error(f"Erro ao converter figura: {e}")
            return self._create_empty_chart("Erro na conversão")
    
    def _create_empty_chart(self, message: str) -> str:
        """Cria gráfico vazio com mensagem"""
        try:
            fig = go.Figure()
            
            fig.add_annotation(
                text=message,
                xref="paper", yref="paper",
                x=0.5, y=0.5,
                xanchor='center', yanchor='middle',
                font=dict(size=16, color='white')
            )
            
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                xaxis=dict(visible=False),
                yaxis=dict(visible=False),
                height=400
            )
            
            return self._fig_to_base64(fig)
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico vazio: {e}")
            return ""

# Instância global
crypto_viz = CryptoVisualization()

