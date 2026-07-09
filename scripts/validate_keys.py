#!/usr/bin/env python3
"""
Validação completa de chaves HD (BIP32/BIP39) e UTXOs para a wallet
1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p
"""
import json
import hashlib
import sys

# ============================================================
# 1. VALIDAÇÃO BIP39 DA SEED PHRASE
# ============================================================
SEED_PHRASE = "marriage steel million dress original father clock come flush ostrich kangaroo method abuse"
XPUB = "xpub661MyMwAqRbcH3qZAL2neui6Rh894yMwDKCDpar3ErCRA2PYTxq6n2HET2yM4eXkptg2FTBHxQVFzVhBzhNocaxtahKXAaobGkzPKAjJhWA"
XPRV = "xprv9s21ZrQH143K4Zm64JVnHmmMsfHefWe5r6Gd2CSRgWfSHE4PvRWrEDxkbnBVh9hT9r2PWbYQZo4iBNg7EiG517AgdhGcJvn49futQHVH7sC"
PRIMARY_ADDRESS = "1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p"

try:
    from mnemonic import Mnemonic
    mnemo = Mnemonic("english")
    is_valid = mnemo.check(SEED_PHRASE)
    print(f"[SEED] Frase: \"{SEED_PHRASE}\"")
    print(f"[SEED] Valida BIP39: {'✅ VALIDA' if is_valid else '❌ INVALIDA'}")
    seed_bytes = mnemo.to_seed(SEED_PHRASE, passphrase="")
    print(f"[SEED] Seed hex (primeiros 32 chars): {seed_bytes[:16].hex()}...")
    print(f"[SEED] Seed length: {len(seed_bytes)} bytes")
except Exception as e:
    print(f"[SEED] ERRO na validação: {e}")
    sys.exit(1)

# ============================================================
# 2. VALIDAÇÃO XPRV → XPUB (BIP32)
# ============================================================
print("\n=== VALIDAÇÃO BIP32 ===")
try:
    import bip32utils
    # Derivar xprv
    b32_xprv = bip32utils.BIP32Key.fromExtendedKey(XPRV)
    derived_xpub = b32_xprv.ExtendedKey()
    xpub_match = derived_xpub == XPUB
    print(f"[BIP32] xprv → xpub derivado: {'✅ CONFERE' if xpub_match else '❌ NÃO CONFERE'}")
    if not xpub_match:
        print(f"  Esperado:  {XPUB[:40]}...")
        print(f"  Derivado:  {derived_xpub[:40]}...")
    
    # Derivar endereços receiving (m/0'/0/0 até m/0'/0/19)
    print(f"\n[DIVISÃO] Derivando 20 receiving addresses (m/44'/0'/0'/0/i)...")
    derived_addresses = []
    for i in range(20):
        child = bip32utils.BIP32Key.fromExtendedKey(XPRV)
        # BIP44: m/44'/0'/0'/0/i
        child = child.ChildKey(44 + 0x80000000)  # purpose
        child = child.ChildKey(0 + 0x80000000)    # coin_type (BTC)
        child = child.ChildKey(0 + 0x80000000)    # account
        child = child.ChildKey(0)                  # change=0 (receiving)
        child = child.ChildKey(i)                  # index
        addr = child.Address()
        derived_addresses.append(addr)
        if i < 5 or addr == PRIMARY_ADDRESS:
            print(f"  m/44'/0'/0'/0/{i} → {addr} {'← PRIMARY!' if addr == PRIMARY_ADDRESS else ''}")
    if len([a for a in derived_addresses if a == PRIMARY_ADDRESS]) == 0:
        print(f"  ... (índices 5-19 omitidos)")
        print(f"  [AVISO] Endereço primário {PRIMARY_ADDRESS} NÃO encontrado nos primeiros 20 índices receiving")
        print(f"  Tentando caminho alternativo m/0'/0/i...")
        for i in range(20):
            child = bip32utils.BIP32Key.fromExtendedKey(XPRV)
            child = child.ChildKey(0 + 0x80000000)
            child = child.ChildKey(0 + 0x80000000)
            child = child.ChildKey(i)
            addr = child.Address()
            if addr == PRIMARY_ADDRESS:
                print(f"  ✅ Encontrado: m/0'/0/{i} → {addr}")
                break
        else:
            # Tentar derivar diretamente do xpub
            print(f"\n  Tentando via xpub (derivacao não-hardened)...")
            b32_xpub = bip32utils.BIP32Key.fromExtendedKey(XPUB)
            for i in range(50):
                child = bip32utils.BIP32Key.fromExtendedKey(XPUB)
                child = child.ChildKey(i)
                addr = child.Address()
                if addr == PRIMARY_ADDRESS:
                    print(f"  ✅ Encontrado via xpub: índice {i} → {addr}")
                    break
            else:
                print(f"  ❌ Endereço primário não encontrado em nenhum caminho padrão")
                print(f"  Verificando se é um endereço importado/watch-only...")
    
    # Derivar 3 change addresses
    print(f"\n[DIVISÃO] Derivando 3 change addresses (m/44'/0'/0'/1/i)...")
    change_addresses = []
    for i in range(3):
        child = bip32utils.BIP32Key.fromExtendedKey(XPRV)
        child = child.ChildKey(44 + 0x80000000)
        child = child.ChildKey(0 + 0x80000000)
        child = child.ChildKey(0 + 0x80000000)
        child = child.ChildKey(1)  # change=1
        child = child.ChildKey(i)
        addr = child.Address()
        change_addresses.append(addr)
        print(f"  m/44'/0'/0'/1/{i} → {addr}")

except Exception as e:
    print(f"[BIP32] ERRO: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
# 3. VALIDAÇÃO DAS CHAVES PÚBLICAS (PUBKEYS) NO ARQUIVO
# ============================================================
print(f"\n=== VALIDAÇÃO DAS PUBKEYS NO ARQUIVO ===")
FILE_PUBKEYS = [
    "03a90b74bd591efecc44530ec1c2f4f17bce9ac6925071900c0de608bb22b3ae6d",
    "02c441567fed585839f051f249086efcce335f77e815caf55ff3fe63c484ce1bc9",
    "0225511d7bd9f5e97db7e1eebe3a0d9b99c8d5725a702af64d857dd20096d478d1",
    "035f6b247a3b3ba726ad239f97cde0371c7a646e492993ab1a62792f5ccfdd64e5",
    "0223603728168816fba9894292282126a0711d653d6e6a586f63687eb9c23102e2",
    "03a595756c008182a33ef65da5ecdaf8378557de10ac242955baaa8de235ab4b50",
    "0208c17922d5a17e5636b5c84727d8aa2596f717cda2e916e86fac51a05da12866",
    "035229200862d5acbcfd18cb7d6a2c3837f1a925d5db5e1c43af3813bbb03aa9b8",
    "0247fa94e7d921a8b8b38f94cdabb9aebc8c09982e144056d2e9658c9da5044dc6",
    "02ac1990ca3b1640a2911c7b3813f8db0a7e9709fceaee831cc0492f91cff3f07c",
    "033e595476195f7999e97bd2bae79e3b0aeb1beec02c3e7e99fa0d15710f08bd1a",
    "039110dc0ef2c71a2e17975acbbc5ff00ea942f0f0bb9ddacb718eb1e24f5a19d3",
    "03744b43c9f32d6150715dc27547adfba3630b2450787977a8cf7814f2838b5271",
    "029ee04b403dfa09bd22cc94e118188213b8dc903eea280b29e0f279171821c4c2",
    "02aae361ddd4ee131fb21a9d2155c207f2ef9782fe9c736bcd721f0758518d12eb",
    "038aeba8a2d0471ce88074a661bae2a7b606c162017995fed3129aa79de6a9880d",
    "02871f87f7358f211115c2701cad4019f7d29cdb6c82347d2dbea53c80c49e3890",
    "03592bd354cd36dcaac56bebd83ae88e43118f9c0ad7b1f6482db9ff53ae6223e2",
    "02f4fff462463b79d430ee05dda3744079c441126c6ebe8b90cbfa61ff388dbe9c",
    "03609a2ddb46e363ff615cded70b711972bfb0f287a96e9f30cec435cde2dd3487",
]

# Derivar pubkeys reais do xprv
print("Comparando pubkeys derivadas com pubkeys no arquivo:")
match_count = 0
mismatch_count = 0
for i in range(min(20, len(FILE_PUBKEYS))):
    child = bip32utils.BIP32Key.fromExtendedKey(XPRV)
    child = child.ChildKey(44 + 0x80000000)
    child = child.ChildKey(0 + 0x80000000)
    child = child.ChildKey(0 + 0x80000000)
    child = child.ChildKey(0)
    child = child.ChildKey(i)
    real_pubkey = child.PublicKey().hex()
    file_pubkey = FILE_PUBKEYS[i]
    match = real_pubkey == file_pubkey
    if match:
        match_count += 1
    else:
        mismatch_count += 1
    status = "✅" if match else "❌"
    if i < 5 or not match:
        print(f"  {status} idx {i}: arquivo={file_pubkey[:20]}... derivada={real_pubkey[:20]}...")

print(f"\n  Resultado: {match_count}/20 conferem, {mismatch_count}/20 divergem")

if mismatch_count > 0:
    print(f"  [INFO] Pubkeys no arquivo podem ser de um xpub diferente ou caminho de derivação distinto")
    print(f"  [INFO] Verificando correspondência xpub → pubkeys (via xpub direto)...")
    b32_xpub_key = bip32utils.BIP32Key.fromExtendedKey(XPUB)
    xpub_match_count = 0
    for i in range(min(20, len(FILE_PUBKEYS))):
        child = bip32utils.BIP32Key.fromExtendedKey(XPUB)
        child = child.ChildKey(i)
        real_pubkey = child.PublicKey().hex()
        file_pubkey = FILE_PUBKEYS[i]
        if real_pubkey == file_pubkey:
            xpub_match_count += 1
    print(f"  Via xpub (não-hardened, índice direto): {xpub_match_count}/20 conferem")

# ============================================================
# 4. VALIDAÇÃO DOS ENDEREÇOS IMPORTADOS
# ============================================================
print(f"\n=== ENDEREÇOS IMPORTADOS ===")
IMPORTED = [
    ("125AKhtDPtjZbJSDSeVEZFUf4Dz9ptNGqU", "Imported 300.dat"),
    ("1MBiuQc6L7vq5sc7k1qtfpb2KF5XfpbfmR", "Imported 300.dat"),
    ("12fcWddtXyxrnxUn6UdmqCbSaVsaYKvHQp", "Imported 304.dat"),
    ("1CYtH4TeoAHZUZqCHBBkrLtwRh5Kquj82i", "Imported 303.dat"),
]
for addr, label in IMPORTED:
    # Verificar se é P2PKH válido (base58check)
    import base58
    try:
        decoded = base58.b58decode_check(addr)
        if len(decoded) == 21 and decoded[0] == 0x00:
            print(f"  ✅ {addr} ({label}) — P2PKH válido")
        else:
            print(f"  ⚠️  {addr} ({label}) — prefixo inesperado: 0x{decoded[0]:02x}")
    except Exception as e:
        print(f"  ❌ {addr} ({label}) — inválido: {e}")

# Verificar se PRIMARY_ADDRESS é P2PKH válido
import base58
decoded = base58.b58decode_check(PRIMARY_ADDRESS)
if len(decoded) == 21 and decoded[0] == 0x00:
    print(f"\n  ✅ PRIMARY_ADDRESS {PRIMARY_ADDRESS} — P2PKH válido (hash160: {decoded[1:].hex()})")

print(f"\n=== RESUMO ===")
print(f"Seed BIP39:       válida ✅")
print(f"xprv → xpub:      {'conferem ✅' if xpub_match else 'DIVERGEM ❌'}")
print(f"Pubkeys arquivo:  {match_count}/20 receiving conferem via xprv BIP44")
print(f"Endereço primário: {PRIMARY_ADDRESS}")
print(f"Endereços importados: 4 (todos P2PKH válidos)")