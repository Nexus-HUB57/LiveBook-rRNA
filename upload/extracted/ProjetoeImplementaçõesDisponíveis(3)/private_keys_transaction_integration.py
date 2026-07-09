"""
Private Keys Transaction Integration - Integração do sistema de chaves privadas com transações
Conecta o gerenciador de chaves privadas com o sistema de transações Bitcoin
"""

import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Adicionar diretório raiz ao path
sys.path.append('/home/ubuntu')

from private_key_manager import PrivateKeyManager
from bitcoin_transaction_builder import BitcoinTransactionBuilder
from bitcoin_utxo_manager import BitcoinUTXOManager
from bitcoin_key_manager import BitcoinKeyManager

class PrivateKeysTransactionIntegration:
    """Integração entre sistema de chaves privadas e transações Bitcoin"""
    
    def __init__(self):
        # Inicializar componentes
        self.key_manager = PrivateKeyManager()
        self.transaction_builder = BitcoinTransactionBuilder()
        self.utxo_manager = BitcoinUTXOManager()
        self.bitcoin_key_manager = BitcoinKeyManager()
        
        # Configurações
        self.custody_address = "13m3xop6RnioRX6qrnkavLekv7cvu5DuMK"
        self.fdr_address = "13m3xop6RnioRX6qrnkavLekv7cvu5DuMK"
        
        print("🔗 Private Keys Transaction Integration inicializado")
        print(f"🏦 Endereço de custódia: {self.custody_address}")
        print(f"💰 Endereço FDR: {self.fdr_address}")
    
    def create_transaction_from_wallet(self, wallet_id: str, to_address: str, 
                                     amount_btc: float, fee_rate: float = 1.0) -> Dict:
        """Cria transação usando chave privada de uma carteira específica"""
        try:
            print(f"🔄 Criando transação de {wallet_id} para {to_address}")
            print(f"💰 Valor: {amount_btc} BTC")
            
            # 1. Obter dados da carteira
            wallets = self.key_manager.get_all_wallets()
            if wallet_id not in wallets:
                return {
                    "success": False,
                    "error": f"Carteira não encontrada: {wallet_id}"
                }
            
            wallet = wallets[wallet_id]
            from_address = wallet['address']
            
            # 2. Obter chave privada
            private_key_wif = self.key_manager.get_private_key(wallet_id)
            if not private_key_wif:
                return {
                    "success": False,
                    "error": "Chave privada não disponível"
                }
            
            print(f"📍 De: {from_address}")
            print(f"📍 Para: {to_address}")
            
            # 3. Obter UTXOs
            utxos = self.utxo_manager.get_utxos(from_address)
            if not utxos:
                return {
                    "success": False,
                    "error": "Nenhum UTXO encontrado para a carteira"
                }
            
            print(f"📦 UTXOs encontrados: {len(utxos)}")
            
            # 4. Selecionar UTXOs adequados
            amount_satoshis = int(amount_btc * 100000000)
            selected_utxos, total_input = self._select_utxos(utxos, amount_satoshis, fee_rate)
            
            if not selected_utxos:
                return {
                    "success": False,
                    "error": "UTXOs insuficientes para a transação"
                }
            
            print(f"✅ UTXOs selecionados: {len(selected_utxos)}")
            print(f"💰 Total de entrada: {total_input / 100000000} BTC")
            
            # 5. Calcular taxa e change
            estimated_size = self._estimate_transaction_size(len(selected_utxos), 2)  # 2 outputs (destino + change)
            fee_satoshis = int(estimated_size * fee_rate)
            change_satoshis = total_input - amount_satoshis - fee_satoshis
            
            print(f"💸 Taxa estimada: {fee_satoshis} satoshis ({fee_satoshis / 100000000} BTC)")
            print(f"🔄 Change: {change_satoshis} satoshis ({change_satoshis / 100000000} BTC)")
            
            # 6. Criar transação
            transaction_data = {
                "inputs": selected_utxos,
                "outputs": [
                    {
                        "address": to_address,
                        "amount_satoshis": amount_satoshis
                    }
                ],
                "change_address": from_address,
                "change_amount": change_satoshis,
                "fee_satoshis": fee_satoshis,
                "private_key_wif": private_key_wif
            }
            
            # Se change é muito pequeno, adicionar à taxa
            if change_satoshis < 546:  # Dust limit
                transaction_data["outputs"][0]["amount_satoshis"] += change_satoshis
                transaction_data["change_amount"] = 0
                print("⚠️ Change muito pequeno, adicionado à taxa")
            else:
                transaction_data["outputs"].append({
                    "address": from_address,
                    "amount_satoshis": change_satoshis
                })
            
            # 7. Construir transação
            built_transaction = self.transaction_builder.build_transaction(transaction_data)
            
            if not built_transaction["success"]:
                return {
                    "success": False,
                    "error": f"Falha na construção da transação: {built_transaction.get('error')}"
                }
            
            # 8. Preparar resultado
            result = {
                "success": True,
                "transaction": {
                    "wallet_id": wallet_id,
                    "from_address": from_address,
                    "to_address": to_address,
                    "amount_btc": amount_btc,
                    "amount_satoshis": amount_satoshis,
                    "fee_btc": fee_satoshis / 100000000,
                    "fee_satoshis": fee_satoshis,
                    "change_btc": change_satoshis / 100000000,
                    "change_satoshis": change_satoshis,
                    "raw_hex": built_transaction["raw_hex"],
                    "tx_hash": built_transaction["tx_hash"],
                    "size_bytes": built_transaction["size_bytes"],
                    "utxos_used": len(selected_utxos),
                    "created_at": datetime.now().isoformat(),
                    "status": "ready_for_broadcast"
                }
            }
            
            print("✅ Transação criada com sucesso!")
            print(f"🔗 Hash: {result['transaction']['tx_hash']}")
            print(f"📦 Tamanho: {result['transaction']['size_bytes']} bytes")
            
            return result
            
        except Exception as e:
            print(f"❌ Erro na criação da transação: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _select_utxos(self, utxos: List[Dict], target_amount: int, 
                     fee_rate: float) -> Tuple[List[Dict], int]:
        """Seleciona UTXOs para uma transação"""
        try:
            # Ordenar UTXOs por valor (maiores primeiro)
            sorted_utxos = sorted(utxos, key=lambda x: x['value'], reverse=True)
            
            selected = []
            total = 0
            
            for utxo in sorted_utxos:
                selected.append(utxo)
                total += utxo['value']
                
                # Estimar taxa com UTXOs selecionados
                estimated_size = self._estimate_transaction_size(len(selected), 2)
                estimated_fee = int(estimated_size * fee_rate)
                
                # Verificar se temos o suficiente
                if total >= target_amount + estimated_fee + 546:  # +546 para dust limit do change
                    break
            
            # Verificar se conseguimos cobrir o valor + taxa
            final_size = self._estimate_transaction_size(len(selected), 2)
            final_fee = int(final_size * fee_rate)
            
            if total < target_amount + final_fee:
                return [], 0
            
            return selected, total
            
        except Exception as e:
            print(f"❌ Erro na seleção de UTXOs: {e}")
            return [], 0
    
    def _estimate_transaction_size(self, num_inputs: int, num_outputs: int) -> int:
        """Estima tamanho da transação em bytes"""
        try:
            # Fórmula aproximada para transações P2PKH
            # 10 bytes (versão + locktime) + inputs + outputs
            input_size = num_inputs * 148  # ~148 bytes por input P2PKH
            output_size = num_outputs * 34  # ~34 bytes por output P2PKH
            
            total_size = 10 + input_size + output_size
            return total_size
            
        except Exception as e:
            print(f"❌ Erro na estimativa de tamanho: {e}")
            return 250  # Valor padrão conservador
    
    def transfer_to_custody(self, wallet_id: str, amount_btc: float = None) -> Dict:
        """Transfere saldo de uma carteira para a carteira de custódia"""
        try:
            print(f"🏦 Transferindo de {wallet_id} para custódia")
            
            # Se amount não especificado, transferir todo o saldo
            if amount_btc is None:
                wallets = self.key_manager.get_all_wallets()
                if wallet_id not in wallets:
                    return {
                        "success": False,
                        "error": "Carteira não encontrada"
                    }
                
                wallet = wallets[wallet_id]
                amount_btc = wallet['balance_btc'] - 0.0001  # Reservar para taxa
                
                if amount_btc <= 0:
                    return {
                        "success": False,
                        "error": "Saldo insuficiente para transferência"
                    }
            
            # Criar transação para custódia
            return self.create_transaction_from_wallet(
                wallet_id, 
                self.custody_address, 
                amount_btc
            )
            
        except Exception as e:
            print(f"❌ Erro na transferência para custódia: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def consolidate_to_fdr(self, wallet_ids: List[str] = None) -> Dict:
        """Consolida saldos de múltiplas carteiras para o FDR"""
        try:
            print("🏦 Iniciando consolidação para FDR")
            
            # Se wallet_ids não especificado, usar todas as carteiras ativas
            if wallet_ids is None:
                wallets = self.key_manager.get_all_wallets()
                wallet_ids = [
                    wid for wid, wallet in wallets.items() 
                    if wallet['status'] == 'active' and wallet['balance_btc'] > 0.0001
                ]
            
            if not wallet_ids:
                return {
                    "success": False,
                    "error": "Nenhuma carteira com saldo encontrada"
                }
            
            print(f"📊 Consolidando {len(wallet_ids)} carteiras")
            
            # Criar transações para cada carteira
            consolidation_results = {
                "success": True,
                "transactions": [],
                "total_amount": 0.0,
                "total_fees": 0.0,
                "failed_wallets": []
            }
            
            for wallet_id in wallet_ids:
                print(f"\n🔄 Processando carteira: {wallet_id}")
                
                # Criar transação para FDR
                tx_result = self.create_transaction_from_wallet(
                    wallet_id,
                    self.fdr_address,
                    None  # Transferir todo o saldo disponível
                )
                
                if tx_result["success"]:
                    transaction = tx_result["transaction"]
                    consolidation_results["transactions"].append(transaction)
                    consolidation_results["total_amount"] += transaction["amount_btc"]
                    consolidation_results["total_fees"] += transaction["fee_btc"]
                    
                    print(f"✅ Transação criada: {transaction['amount_btc']} BTC")
                else:
                    consolidation_results["failed_wallets"].append({
                        "wallet_id": wallet_id,
                        "error": tx_result["error"]
                    })
                    print(f"❌ Falha: {tx_result['error']}")
            
            # Verificar se houve falhas
            if consolidation_results["failed_wallets"]:
                consolidation_results["success"] = len(consolidation_results["transactions"]) > 0
            
            print(f"\n📊 Consolidação concluída:")
            print(f"   ✅ Sucessos: {len(consolidation_results['transactions'])}")
            print(f"   ❌ Falhas: {len(consolidation_results['failed_wallets'])}")
            print(f"   💰 Total: {consolidation_results['total_amount']} BTC")
            print(f"   💸 Taxas: {consolidation_results['total_fees']} BTC")
            
            return consolidation_results
            
        except Exception as e:
            print(f"❌ Erro na consolidação: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def broadcast_transaction(self, raw_hex: str) -> Dict:
        """Transmite transação para a rede Bitcoin"""
        try:
            print("📡 Transmitindo transação para a rede...")
            
            # Usar o transaction builder para broadcast
            broadcast_result = self.transaction_builder.broadcast_transaction(raw_hex)
            
            if broadcast_result["success"]:
                print(f"✅ Transação transmitida: {broadcast_result['tx_hash']}")
            else:
                print(f"❌ Falha no broadcast: {broadcast_result['error']}")
            
            return broadcast_result
            
        except Exception as e:
            print(f"❌ Erro no broadcast: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_wallet_transaction_history(self, wallet_id: str) -> Dict:
        """Obtém histórico de transações de uma carteira"""
        try:
            wallets = self.key_manager.get_all_wallets()
            if wallet_id not in wallets:
                return {
                    "success": False,
                    "error": "Carteira não encontrada"
                }
            
            wallet = wallets[wallet_id]
            address = wallet['address']
            
            # Usar UTXO manager para obter histórico
            history = self.utxo_manager.get_address_history(address)
            
            return {
                "success": True,
                "wallet_id": wallet_id,
                "address": address,
                "history": history
            }
            
        except Exception as e:
            print(f"❌ Erro ao obter histórico: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def estimate_consolidation_cost(self, wallet_ids: List[str] = None) -> Dict:
        """Estima custo de consolidação das carteiras"""
        try:
            print("💰 Estimando custo de consolidação...")
            
            if wallet_ids is None:
                wallets = self.key_manager.get_all_wallets()
                wallet_ids = [
                    wid for wid, wallet in wallets.items() 
                    if wallet['status'] == 'active' and wallet['balance_btc'] > 0.0001
                ]
            
            total_fees = 0.0
            total_amount = 0.0
            estimations = []
            
            for wallet_id in wallet_ids:
                wallets = self.key_manager.get_all_wallets()
                if wallet_id not in wallets:
                    continue
                
                wallet = wallets[wallet_id]
                address = wallet['address']
                
                # Obter UTXOs
                utxos = self.utxo_manager.get_utxos(address)
                if not utxos:
                    continue
                
                # Estimar taxa
                estimated_size = self._estimate_transaction_size(len(utxos), 2)
                estimated_fee = estimated_size * 1.0  # 1 sat/byte
                estimated_fee_btc = estimated_fee / 100000000
                
                estimation = {
                    "wallet_id": wallet_id,
                    "address": address,
                    "balance_btc": wallet['balance_btc'],
                    "utxos_count": len(utxos),
                    "estimated_size_bytes": estimated_size,
                    "estimated_fee_satoshis": estimated_fee,
                    "estimated_fee_btc": estimated_fee_btc,
                    "net_amount_btc": wallet['balance_btc'] - estimated_fee_btc
                }
                
                estimations.append(estimation)
                total_fees += estimated_fee_btc
                total_amount += wallet['balance_btc']
            
            result = {
                "success": True,
                "total_wallets": len(estimations),
                "total_balance_btc": total_amount,
                "total_estimated_fees_btc": total_fees,
                "net_consolidation_btc": total_amount - total_fees,
                "estimations": estimations
            }
            
            print(f"📊 Estimativa de consolidação:")
            print(f"   🏦 Carteiras: {result['total_wallets']}")
            print(f"   💰 Saldo total: {result['total_balance_btc']} BTC")
            print(f"   💸 Taxas estimadas: {result['total_estimated_fees_btc']} BTC")
            print(f"   💎 Valor líquido: {result['net_consolidation_btc']} BTC")
            
            return result
            
        except Exception as e:
            print(f"❌ Erro na estimativa: {e}")
            return {
                "success": False,
                "error": str(e)
            }

def initialize_private_keys_transaction_integration():
    """Inicializa a integração de chaves privadas com transações"""
    print("🔗 Inicializando Private Keys Transaction Integration...")
    
    try:
        integration = PrivateKeysTransactionIntegration()
        print("✅ Private Keys Transaction Integration inicializado com sucesso!")
        return integration
        
    except Exception as e:
        print(f"❌ Erro na inicialização: {e}")
        return None

if __name__ == "__main__":
    # Teste da integração
    integration = initialize_private_keys_transaction_integration()
    
    if integration:
        print("\n🧪 Testando funcionalidades:")
        
        # Teste 1: Listar carteiras disponíveis
        print("\n1. Listando carteiras disponíveis...")
        wallets = integration.key_manager.get_all_wallets()
        print(f"📊 Total de carteiras: {len(wallets)}")
        
        for wallet_id, wallet in wallets.items():
            if wallet['status'] == 'active' and wallet['balance_btc'] > 0:
                print(f"   💰 {wallet_id}: {wallet['balance_btc']} BTC ({wallet['address']})")
        
        # Teste 2: Estimar custo de consolidação
        print("\n2. Estimando custo de consolidação...")
        estimation = integration.estimate_consolidation_cost()
        
        if estimation['success']:
            print(f"✅ Estimativa concluída:")
            print(f"   Total: {estimation['total_balance_btc']} BTC")
            print(f"   Taxas: {estimation['total_estimated_fees_btc']} BTC")
            print(f"   Líquido: {estimation['net_consolidation_btc']} BTC")
        else:
            print(f"❌ Falha na estimativa: {estimation['error']}")
    else:
        print("❌ Falha na inicialização da integração")

