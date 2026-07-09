"""
Sistema de Segurança Mainnet - Proteção para operações reais Bitcoin
Implementa múltiplas camadas de segurança para operações na blockchain Bitcoin mainnet
"""

import os
import sys
import json
import hashlib
import hmac
import time
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import requests
import ipaddress

# Importar configurações mainnet
from mainnet_config import MainnetConfig, MainnetAPIManager

class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ThreatLevel(Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MainnetSecuritySystem:
    """Sistema principal de segurança para operações mainnet"""
    
    def __init__(self):
        self.config = MainnetConfig()
        self.api_manager = MainnetAPIManager()
        
        # Configurações de segurança
        self.security_rules = {
            'max_daily_volume': Decimal('1000.0'),  # BTC
            'max_hourly_volume': Decimal('100.0'),  # BTC
            'max_single_transaction': Decimal('50.0'),  # BTC
            'max_failed_attempts': 5,
            'lockout_duration_minutes': 30,
            'require_2fa_above': Decimal('1.0'),  # BTC
            'require_manual_approval_above': Decimal('10.0'),  # BTC
            'min_password_length': 12,
            'session_timeout_minutes': 30
        }
        
        # Monitoramento de atividades
        self.activity_log = []
        self.failed_attempts = {}
        self.blocked_ips = {}
        self.active_sessions = {}
        self.suspicious_activities = []
        
        # Lista de IPs confiáveis (whitelist)
        self.trusted_ips = [
            '127.0.0.1',
            '::1'
        ]
        
        # Padrões suspeitos
        self.suspicious_patterns = {
            'rapid_requests': {'threshold': 100, 'window_minutes': 5},
            'large_amounts': {'threshold': 50.0},  # BTC
            'unusual_hours': {'start': 2, 'end': 6},  # 2AM - 6AM
            'multiple_failures': {'threshold': 3, 'window_minutes': 10}
        }
        
        print("🔒 Sistema de Segurança Mainnet inicializado")
        print(f"🛡️ Regras de segurança carregadas: {len(self.security_rules)} regras")
    
    def validate_transaction_security(self, transaction_data):
        """Valida segurança de uma transação"""
        try:
            print(f"🔍 Validando segurança da transação...")
            
            validation_result = {
                'valid': False,
                'security_level': SecurityLevel.MEDIUM,
                'threat_level': ThreatLevel.NONE,
                'checks': {},
                'warnings': [],
                'required_approvals': [],
                'risk_score': 0
            }
            
            amount = Decimal(str(transaction_data.get('amount', 0)))
            from_address = transaction_data.get('from_address', '')
            to_address = transaction_data.get('to_address', '')
            user_ip = transaction_data.get('user_ip', '')
            
            # Check 1: Validação de endereços
            validation_result['checks']['valid_from_address'] = self.api_manager.validate_mainnet_address(from_address)
            validation_result['checks']['valid_to_address'] = self.api_manager.validate_mainnet_address(to_address)
            
            if not validation_result['checks']['valid_from_address']:
                validation_result['warnings'].append("Endereço de origem inválido")
                validation_result['risk_score'] += 50
            
            if not validation_result['checks']['valid_to_address']:
                validation_result['warnings'].append("Endereço de destino inválido")
                validation_result['risk_score'] += 50
            
            # Check 2: Limites de valor
            validation_result['checks']['within_single_limit'] = amount <= self.security_rules['max_single_transaction']
            validation_result['checks']['within_daily_limit'] = self._check_daily_volume_limit(amount)
            validation_result['checks']['within_hourly_limit'] = self._check_hourly_volume_limit(amount)
            
            if not validation_result['checks']['within_single_limit']:
                validation_result['warnings'].append(f"Valor excede limite por transação: {self.security_rules['max_single_transaction']} BTC")
                validation_result['risk_score'] += 30
            
            if not validation_result['checks']['within_daily_limit']:
                validation_result['warnings'].append("Limite diário de volume excedido")
                validation_result['risk_score'] += 40
            
            if not validation_result['checks']['within_hourly_limit']:
                validation_result['warnings'].append("Limite horário de volume excedido")
                validation_result['risk_score'] += 25
            
            # Check 3: IP e localização
            validation_result['checks']['trusted_ip'] = self._is_trusted_ip(user_ip)
            validation_result['checks']['blocked_ip'] = self._is_blocked_ip(user_ip)
            
            if validation_result['checks']['blocked_ip']:
                validation_result['warnings'].append("IP bloqueado por atividade suspeita")
                validation_result['risk_score'] += 100
            
            if not validation_result['checks']['trusted_ip']:
                validation_result['risk_score'] += 10
            
            # Check 4: Padrões suspeitos
            suspicious_checks = self._check_suspicious_patterns(transaction_data)
            validation_result['checks'].update(suspicious_checks)
            
            for pattern, detected in suspicious_checks.items():
                if detected:
                    validation_result['warnings'].append(f"Padrão suspeito detectado: {pattern}")
                    validation_result['risk_score'] += 20
            
            # Check 5: Verificar se endereços estão em listas de bloqueio
            validation_result['checks']['address_not_blacklisted'] = self._check_address_blacklist(from_address, to_address)
            
            if not validation_result['checks']['address_not_blacklisted']:
                validation_result['warnings'].append("Endereço em lista de bloqueio")
                validation_result['risk_score'] += 80
            
            # Determinar nível de segurança baseado no valor
            if amount >= Decimal('50.0'):
                validation_result['security_level'] = SecurityLevel.CRITICAL
            elif amount >= Decimal('10.0'):
                validation_result['security_level'] = SecurityLevel.HIGH
            elif amount >= Decimal('1.0'):
                validation_result['security_level'] = SecurityLevel.MEDIUM
            else:
                validation_result['security_level'] = SecurityLevel.LOW
            
            # Determinar nível de ameaça baseado no risk_score
            if validation_result['risk_score'] >= 100:
                validation_result['threat_level'] = ThreatLevel.CRITICAL
            elif validation_result['risk_score'] >= 70:
                validation_result['threat_level'] = ThreatLevel.HIGH
            elif validation_result['risk_score'] >= 40:
                validation_result['threat_level'] = ThreatLevel.MEDIUM
            elif validation_result['risk_score'] >= 20:
                validation_result['threat_level'] = ThreatLevel.LOW
            
            # Determinar aprovações necessárias
            if amount >= self.security_rules['require_manual_approval_above']:
                validation_result['required_approvals'].append('manual_approval')
            
            if amount >= self.security_rules['require_2fa_above']:
                validation_result['required_approvals'].append('2fa_verification')
            
            if validation_result['threat_level'] in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
                validation_result['required_approvals'].append('security_review')
            
            # Determinar se a transação é válida
            critical_checks = [
                'valid_from_address',
                'valid_to_address',
                'within_single_limit',
                'address_not_blacklisted'
            ]
            
            validation_result['valid'] = all(
                validation_result['checks'].get(check, False) for check in critical_checks
            ) and not validation_result['checks']['blocked_ip']
            
            # Log da validação
            self._log_security_event('transaction_validation', {
                'amount': float(amount),
                'from_address': from_address[:10] + '...',  # Parcial por privacidade
                'to_address': to_address[:10] + '...',
                'valid': validation_result['valid'],
                'risk_score': validation_result['risk_score'],
                'threat_level': validation_result['threat_level'].value
            })
            
            print(f"🔍 Validação concluída:")
            print(f"   ✅ Válida: {validation_result['valid']}")
            print(f"   🎯 Risk Score: {validation_result['risk_score']}")
            print(f"   ⚠️ Nível de Ameaça: {validation_result['threat_level'].value}")
            print(f"   🔒 Aprovações necessárias: {len(validation_result['required_approvals'])}")
            
            return validation_result
            
        except Exception as e:
            print(f"❌ Erro na validação de segurança: {e}")
            return {
                'valid': False,
                'error': str(e),
                'threat_level': ThreatLevel.HIGH
            }
    
    def generate_2fa_code(self, user_id):
        """Gera código 2FA para autenticação"""
        try:
            # Gerar código de 6 dígitos
            code = secrets.randbelow(900000) + 100000
            
            # Armazenar código com expiração
            expiry = datetime.now() + timedelta(minutes=5)
            
            self.active_sessions[f"2fa_{user_id}"] = {
                'code': str(code),
                'expiry': expiry.isoformat(),
                'attempts': 0,
                'max_attempts': 3
            }
            
            print(f"🔐 Código 2FA gerado para usuário: {user_id}")
            
            # Em produção real, o código seria enviado por SMS/email
            return {
                'success': True,
                'code': str(code),  # Apenas para demonstração
                'expiry': expiry.isoformat(),
                'message': 'Código 2FA gerado com sucesso'
            }
            
        except Exception as e:
            print(f"❌ Erro ao gerar código 2FA: {e}")
            return {'success': False, 'error': str(e)}
    
    def verify_2fa_code(self, user_id, provided_code):
        """Verifica código 2FA"""
        try:
            session_key = f"2fa_{user_id}"
            
            if session_key not in self.active_sessions:
                return {'valid': False, 'error': 'Código não encontrado ou expirado'}
            
            session = self.active_sessions[session_key]
            
            # Verificar expiração
            if datetime.now() > datetime.fromisoformat(session['expiry']):
                del self.active_sessions[session_key]
                return {'valid': False, 'error': 'Código expirado'}
            
            # Verificar tentativas
            if session['attempts'] >= session['max_attempts']:
                del self.active_sessions[session_key]
                return {'valid': False, 'error': 'Muitas tentativas falharam'}
            
            # Verificar código
            if provided_code == session['code']:
                del self.active_sessions[session_key]
                
                self._log_security_event('2fa_success', {
                    'user_id': user_id,
                    'timestamp': datetime.now().isoformat()
                })
                
                print(f"✅ Código 2FA verificado com sucesso: {user_id}")
                return {'valid': True, 'message': 'Código verificado com sucesso'}
            else:
                session['attempts'] += 1
                
                self._log_security_event('2fa_failure', {
                    'user_id': user_id,
                    'attempts': session['attempts'],
                    'timestamp': datetime.now().isoformat()
                })
                
                return {
                    'valid': False, 
                    'error': f'Código incorreto. Tentativas restantes: {session["max_attempts"] - session["attempts"]}'
                }
                
        except Exception as e:
            print(f"❌ Erro na verificação 2FA: {e}")
            return {'valid': False, 'error': str(e)}
    
    def monitor_suspicious_activity(self, activity_data):
        """Monitora atividades suspeitas"""
        try:
            activity_type = activity_data.get('type', 'unknown')
            user_ip = activity_data.get('user_ip', '')
            timestamp = datetime.now()
            
            # Adicionar ao log de atividades
            activity_record = {
                'timestamp': timestamp.isoformat(),
                'type': activity_type,
                'user_ip': user_ip,
                'data': activity_data
            }
            
            self.activity_log.append(activity_record)
            
            # Manter apenas últimas 1000 atividades
            if len(self.activity_log) > 1000:
                self.activity_log = self.activity_log[-1000:]
            
            # Verificar padrões suspeitos
            suspicious_detected = False
            
            # Verificar muitas tentativas do mesmo IP
            recent_activities = [
                a for a in self.activity_log 
                if a['user_ip'] == user_ip and 
                datetime.fromisoformat(a['timestamp']) > timestamp - timedelta(minutes=10)
            ]
            
            if len(recent_activities) > 20:
                self._flag_suspicious_activity('rapid_requests', activity_data)
                suspicious_detected = True
            
            # Verificar tentativas de login falhadas
            if activity_type == 'login_failed':
                if user_ip not in self.failed_attempts:
                    self.failed_attempts[user_ip] = []
                
                self.failed_attempts[user_ip].append(timestamp)
                
                # Remover tentativas antigas
                cutoff = timestamp - timedelta(minutes=30)
                self.failed_attempts[user_ip] = [
                    t for t in self.failed_attempts[user_ip] if t > cutoff
                ]
                
                if len(self.failed_attempts[user_ip]) >= self.security_rules['max_failed_attempts']:
                    self._block_ip(user_ip, 'multiple_failed_attempts')
                    suspicious_detected = True
            
            # Verificar horários incomuns
            if timestamp.hour >= self.suspicious_patterns['unusual_hours']['start'] and \
               timestamp.hour <= self.suspicious_patterns['unusual_hours']['end']:
                if activity_type in ['large_transaction', 'admin_action']:
                    self._flag_suspicious_activity('unusual_hours', activity_data)
                    suspicious_detected = True
            
            return {
                'monitored': True,
                'suspicious_detected': suspicious_detected,
                'timestamp': timestamp.isoformat()
            }
            
        except Exception as e:
            print(f"❌ Erro no monitoramento: {e}")
            return {'monitored': False, 'error': str(e)}
    
    def get_security_report(self):
        """Gera relatório de segurança"""
        try:
            now = datetime.now()
            last_24h = now - timedelta(hours=24)
            
            # Atividades das últimas 24h
            recent_activities = [
                a for a in self.activity_log 
                if datetime.fromisoformat(a['timestamp']) > last_24h
            ]
            
            # Estatísticas
            activity_types = {}
            for activity in recent_activities:
                activity_type = activity['type']
                activity_types[activity_type] = activity_types.get(activity_type, 0) + 1
            
            report = {
                'report_timestamp': now.isoformat(),
                'period': '24 hours',
                'summary': {
                    'total_activities': len(recent_activities),
                    'suspicious_activities': len(self.suspicious_activities),
                    'blocked_ips': len(self.blocked_ips),
                    'active_sessions': len(self.active_sessions)
                },
                'activity_breakdown': activity_types,
                'security_status': {
                    'threat_level': self._calculate_overall_threat_level(),
                    'system_health': 'operational',
                    'last_security_incident': self._get_last_incident_time()
                },
                'blocked_ips': list(self.blocked_ips.keys()),
                'recent_suspicious': self.suspicious_activities[-10:] if self.suspicious_activities else [],
                'security_rules': {
                    'max_daily_volume': float(self.security_rules['max_daily_volume']),
                    'max_single_transaction': float(self.security_rules['max_single_transaction']),
                    'require_2fa_above': float(self.security_rules['require_2fa_above'])
                }
            }
            
            return report
            
        except Exception as e:
            print(f"❌ Erro ao gerar relatório: {e}")
            return {'error': str(e)}
    
    def _check_daily_volume_limit(self, amount):
        """Verifica limite de volume diário"""
        # Simular verificação de volume diário
        # Em produção real, consultaria banco de dados
        return amount <= self.security_rules['max_daily_volume']
    
    def _check_hourly_volume_limit(self, amount):
        """Verifica limite de volume horário"""
        # Simular verificação de volume horário
        return amount <= self.security_rules['max_hourly_volume']
    
    def _is_trusted_ip(self, ip):
        """Verifica se IP está na lista de confiáveis"""
        return ip in self.trusted_ips
    
    def _is_blocked_ip(self, ip):
        """Verifica se IP está bloqueado"""
        if ip in self.blocked_ips:
            # Verificar se o bloqueio ainda é válido
            block_info = self.blocked_ips[ip]
            if datetime.now() < datetime.fromisoformat(block_info['expires_at']):
                return True
            else:
                # Remover bloqueio expirado
                del self.blocked_ips[ip]
        return False
    
    def _check_suspicious_patterns(self, transaction_data):
        """Verifica padrões suspeitos"""
        checks = {}
        
        amount = Decimal(str(transaction_data.get('amount', 0)))
        
        # Verificar valor suspeito
        checks['large_amount_pattern'] = amount >= Decimal(str(self.suspicious_patterns['large_amounts']['threshold']))
        
        # Verificar horário suspeito
        current_hour = datetime.now().hour
        checks['unusual_time_pattern'] = (
            current_hour >= self.suspicious_patterns['unusual_hours']['start'] and
            current_hour <= self.suspicious_patterns['unusual_hours']['end']
        )
        
        return checks
    
    def _check_address_blacklist(self, from_address, to_address):
        """Verifica se endereços estão em lista negra"""
        # Lista de endereços conhecidos como suspeitos (exemplo)
        blacklisted_addresses = [
            # Endereços de exemplo - em produção seria uma lista real
        ]
        
        return from_address not in blacklisted_addresses and to_address not in blacklisted_addresses
    
    def _block_ip(self, ip, reason):
        """Bloqueia um IP"""
        expires_at = datetime.now() + timedelta(minutes=self.security_rules['lockout_duration_minutes'])
        
        self.blocked_ips[ip] = {
            'reason': reason,
            'blocked_at': datetime.now().isoformat(),
            'expires_at': expires_at.isoformat()
        }
        
        self._log_security_event('ip_blocked', {
            'ip': ip,
            'reason': reason,
            'expires_at': expires_at.isoformat()
        })
        
        print(f"🚫 IP bloqueado: {ip} (Razão: {reason})")
    
    def _flag_suspicious_activity(self, pattern_type, activity_data):
        """Marca atividade como suspeita"""
        suspicious_record = {
            'timestamp': datetime.now().isoformat(),
            'pattern_type': pattern_type,
            'activity_data': activity_data,
            'severity': 'medium'
        }
        
        self.suspicious_activities.append(suspicious_record)
        
        # Manter apenas últimas 100 atividades suspeitas
        if len(self.suspicious_activities) > 100:
            self.suspicious_activities = self.suspicious_activities[-100:]
        
        print(f"⚠️ Atividade suspeita detectada: {pattern_type}")
    
    def _log_security_event(self, event_type, event_data):
        """Registra evento de segurança"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'data': event_data
        }
        
        # Em produção real, seria salvo em arquivo de log seguro
        print(f"📝 Log de segurança: {event_type}")
    
    def _calculate_overall_threat_level(self):
        """Calcula nível geral de ameaça"""
        if len(self.suspicious_activities) > 10:
            return ThreatLevel.HIGH.value
        elif len(self.suspicious_activities) > 5:
            return ThreatLevel.MEDIUM.value
        elif len(self.suspicious_activities) > 0:
            return ThreatLevel.LOW.value
        else:
            return ThreatLevel.NONE.value
    
    def _get_last_incident_time(self):
        """Retorna horário do último incidente"""
        if self.suspicious_activities:
            return self.suspicious_activities[-1]['timestamp']
        return None

def initialize_mainnet_security():
    """Inicializa o sistema de segurança mainnet"""
    print("🔒 Inicializando Sistema de Segurança Mainnet...")
    
    try:
        security_system = MainnetSecuritySystem()
        
        print("✅ Sistema de Segurança Mainnet inicializado!")
        return security_system
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste do sistema de segurança
    security = initialize_mainnet_security()
    
    if security:
        print("\n🔍 Teste de validação de transação:")
        
        test_transaction = {
            'amount': 5.0,
            'from_address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            'to_address': '13m3xop6RnioRX6qrnkavLekv7cvu5DuMK',
            'user_ip': '192.168.1.100'
        }
        
        validation = security.validate_transaction_security(test_transaction)
        print(f"Resultado: {'✅ Válida' if validation['valid'] else '❌ Inválida'}")
        
        print("\n🔐 Teste de geração 2FA:")
        twofa_result = security.generate_2fa_code('user123')
        if twofa_result['success']:
            print(f"Código gerado: {twofa_result['code']}")
            
            # Testar verificação
            verify_result = security.verify_2fa_code('user123', twofa_result['code'])
            print(f"Verificação: {'✅ Sucesso' if verify_result['valid'] else '❌ Falha'}")
        
        print("\n📊 Relatório de segurança:")
        report = security.get_security_report()
        print(f"Atividades nas últimas 24h: {report['summary']['total_activities']}")
        print(f"Nível de ameaça geral: {report['security_status']['threat_level']}")

