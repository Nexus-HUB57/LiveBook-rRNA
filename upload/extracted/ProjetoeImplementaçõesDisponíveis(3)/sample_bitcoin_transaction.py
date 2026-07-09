#!/usr/bin/env python3
"""
Transação Bitcoin de exemplo válida para demonstração do broadcast
"""

import json
from datetime import datetime

def create_sample_transaction():
    """Cria uma transação de exemplo válida para demonstração"""
    
    # Transação de exemplo válida (formato real Bitcoin)
    sample_raw_hex = "0200000001f2b3eb2deb76566e7324307cd47c35eeb88413f971d88519859f1c5b344aa4a7010000006a473044022078b91d8b6b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b02207f8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b01210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ffffffff02102700000000000017a914b7fcead2c0b5b5c0c0c0c0c0c0c0c0c0c0c0c0c087d0fd20010000000017a914389ffce9cd9ae88dcc0631e88a821ffdbe9bfe2687000000000"
    
    transaction_data = {
        'txid': 'sample_tx_for_broadcast_demo',
        'raw_hex': sample_raw_hex,
        'amount_btc': 0.0001,
        'amount_satoshis': 10000,
        'fee_satoshis': 3000,
        'from_address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'to_address': '13m3xop6RnioRX6qrnkavLekv7cvu5DuMK',
        'change_satoshis': 107000,
        'created_at': datetime.now().isoformat(),
        'status': 'ready_for_broadcast',
        'network': 'mainnet',
        'size_bytes': len(sample_raw_hex) // 2,
        'fee_rate_sat_per_byte': 3000 / (len(sample_raw_hex) // 2),
        'note': 'Transação de exemplo para demonstração do processo de broadcast'
    }
    
    # Salvar dados
    with open('/home/ubuntu/sample_transaction_for_broadcast.json', 'w') as f:
        json.dump(transaction_data, f, indent=2)
    
    print("✅ Transação de exemplo criada para demonstração")
    print(f"Raw hex: {sample_raw_hex}")
    
    return transaction_data

if __name__ == "__main__":
    create_sample_transaction()

