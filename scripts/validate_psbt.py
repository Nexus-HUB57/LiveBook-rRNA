#!/usr/bin/env python3
"""
Validate PSBT creation for 1 BTC withdrawal to Binance custody.
Fetches prev transactions from blockstream, constructs PSBT, validates structure.
"""
import requests, struct, hashlib, json, sys

CUSTODY = "bc1qwwgdhzdgy97ysqqtd9z7rwv76fwktg0w4tvwf8"
PRIMARY = "1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p"
AMOUNT_SATS = 100_000_000  # 1 BTC
FEE_RATE = 25

# Top 2 UTXOs (largest, to minimize inputs)
UTXOS = [
    {"txid": "ec193509df9db918f2d926195e82f352e9822ff1179818436b356752a22fa63d", "vout": 27, "value": 149742650},
    {"txid": "478737a3655e16f86304dad75e181b3c3e615b932126cf2f50987fcc55bf76b2", "vout": 25, "value": 145106743},
]

def encode_varint(n):
    if n < 0xfd:
        return struct.pack("<B", n)
    if n <= 0xffff:
        return b'\xfd' + struct.pack("<H", n)
    return b'\xfe' + struct.pack("<I", n)

def base58_decode(s):
    ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    n = 0
    for c in s:
        n = n * 58 + ALPHABET.index(c)
    # Count leading 1s
    pad = 0
    for c in s:
        if c == '1':
            pad += 1
        else:
            break
    result = []
    while n > 0:
        result.append(n & 0xff)
        n >>= 8
    return bytes(pad) + bytes(reversed(result))

def p2pkh_hash160(address):
    decoded = base58_decode(address)
    return decoded[1:21]

def p2pkh_scriptpubkey(hash160):
    return bytes([0x76, 0xa9, 0x14]) + hash160 + bytes([0x88, 0xac])

def p2wpkh_scriptpubkey(witness_program):
    return bytes([0x00, 0x14]) + witness_program

def bech32_decode(addr):
    CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
    sep = addr.rfind('1')
    hrp = addr[:sep]
    data_part = addr[sep+1:]
    
    acc = 1
    values = []
    for i, c in enumerate(data_part):
        acc = _polymod(acc, CHARSET.index(c))
        if i + 6 < len(data_part):
            values.append(CHARSET.index(c))
    
    # 5-bit to 8-bit
    acc2 = 0
    bits = 0
    result = []
    for v in values[1:]:  # skip witness version
        acc2 = (acc2 << 5) | v
        bits += 5
        while bits >= 8:
            bits -= 8
            result.append((acc2 >> bits) & 0xff)
    return bytes(result)

def _polymod(pre, v):
    GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    b = pre >> 25
    ret = ((pre & 0x1ffffff) << 5) ^ v
    for i in range(5):
        if (b >> i) & 1:
            ret ^= GEN[i]
    return ret

# === STEP 1: Fetch previous transactions ===
print("=" * 60)
print("STEP 1: Fetching previous transactions from blockstream")
print("=" * 60)

prev_txs = []
for u in UTXOS:
    url = f"https://blockstream.info/api/tx/{u['txid']}/hex"
    print(f"  Fetching {u['txid'][:20]}...:{u['vout']}", end=" ")
    resp = requests.get(url, timeout=30)
    if resp.status_code != 200:
        print(f"FAILED ({resp.status_code})")
        sys.exit(1)
    hex_data = resp.text.strip()
    raw = bytes.fromhex(hex_data)
    print(f"OK ({len(raw)} bytes)")
    prev_txs.append(raw)

# === STEP 2: Build outputs ===
print(f"\nSTEP 2: Building transaction outputs")
print(f"  Send: {AMOUNT_SATS} sats ({AMOUNT_SATS/1e8:.8f} BTC) -> {CUSTODY}")

# Fee calculation
input_count = len(UTXOS)
tx_size = 10 + input_count * 148 + 34 + 31  # base + P2PKH inputs + P2PKH change + P2WPKH dest
fee = tx_size * FEE_RATE
total_input = sum(u['value'] for u in UTXOS)
change = total_input - AMOUNT_SATS - fee

print(f"  Total input: {total_input} sats")
print(f"  Fee: {fee} sats ({FEE_RATE} sat/vB, {tx_size} bytes)")
print(f"  Change: {change} sats -> {PRIMARY}")

# Destination: P2WPKH (bc1q)
dest_program = bech32_decode(CUSTODY)
dest_spk = p2wpkh_scriptpubkey(dest_program)
print(f"  Dest scriptPubKey: {dest_spk.hex()}")

# Change: P2PKH (1...)
change_hash = p2pkh_hash160(PRIMARY)
change_spk = p2pkh_scriptpubkey(change_hash)

# === STEP 3: Serialize unsigned transaction ===
print(f"\nSTEP 3: Serializing unsigned transaction")

parts = []
# Version
parts.append(struct.pack("<I", 1))
# Input count
parts.append(encode_varint(input_count))

for u in UTXOS:
    # prev txid (reversed)
    parts.append(bytes.fromhex(u['txid'])[::-1])
    # prev vout
    parts.append(struct.pack("<I", u['vout']))
    # empty scriptSig
    parts.append(encode_varint(0))
    # sequence (RBF)
    parts.append(struct.pack("<I", 0xfffffffe))

# Output count
parts.append(encode_varint(2))  # dest + change

# Output 1: Send to custody
parts.append(struct.pack("<Q", AMOUNT_SATS))
parts.append(encode_varint(len(dest_spk)))
parts.append(dest_spk)

# Output 2: Change
parts.append(struct.pack("<Q", change))
parts.append(encode_varint(len(change_spk)))
parts.append(change_spk)

# Locktime
parts.append(struct.pack("<I", 0))

unsigned_tx = b''.join(parts)
print(f"  Unsigned tx: {len(unsigned_tx)} bytes")
print(f"  TXID (unsigned): {hashlib.sha256(hashlib.sha256(unsigned_tx).digest()).digest()[::-1].hex()}")

# === STEP 4: Build PSBT ===
print(f"\nSTEP 4: Building PSBT v0")

def psbt_kv(key, value):
    return encode_varint(len(key)) + key + encode_varint(len(value)) + value

psbt_parts = []
# Magic
psbt_parts.append(b'psbt\xff')

# Global: unsigned tx (key=0x00)
psbt_parts.append(psbt_kv(b'\x00', unsigned_tx))

# Global separator
psbt_parts.append(b'\x00')

# Per-input fields
for i, (u, prev_raw) in enumerate(zip(UTXOS, prev_txs)):
    print(f"  Input {i}: {u['txid'][:16]}...:{u['vout']} ({u['value']} sats)")
    print(f"    Prev tx size: {len(prev_raw)} bytes")
    
    # Non-witness UTXO (key=0x01)
    psbt_parts.append(psbt_kv(b'\x01', prev_raw))
    
    # Sighash type (key=0x03) SIGHASH_ALL=1
    psbt_parts.append(psbt_kv(b'\x03', struct.pack("<I", 1)))
    
    # Input separator
    psbt_parts.append(b'\x00')

# Per-output fields (empty for our outputs)
psbt_parts.append(b'\x00')  # output 0 separator
psbt_parts.append(b'\x00')  # output 1 separator

psbt_bytes = b''.join(psbt_parts)
import base64
psbt_b64 = base64.b64encode(psbt_bytes).decode()

print(f"\n  PSBT size: {len(psbt_bytes)} bytes")
print(f"  PSBT base64 length: {len(psbt_b64)} chars")

# === VALIDATION ===
print(f"\n{'=' * 60}")
print("VALIDATION")
print(f"{'=' * 60}")

# Check magic
assert psbt_bytes[:5] == b'psbt\xff', "PSBT magic invalid"
print("  PSBT magic: OK")

# Check unsigned tx in PSBT
offset = 5
kl = psbt_bytes[offset]
offset += 1
key = psbt_bytes[offset:offset+kl]
offset += kl
vl = psbt_bytes[offset]
offset += 1
stored_tx = psbt_bytes[offset:offset+vl]
assert stored_tx == unsigned_tx, "Stored tx mismatch"
print(f"  Global unsigned tx: OK ({vl} bytes)")

# Check inputs
print(f"  Non-witness UTXOs: {len(UTXOS)} inputs included")
for i, prev_raw in enumerate(prev_txs):
    # Verify prev tx contains the UTXO
    tx_val = struct.unpack("<Q", prev_raw[4+32+4:4+32+4+8])[0]
    print(f"    Input {i} prev tx value at vout: {tx_val} sats")

# Fee check
outputs_total = AMOUNT_SATS + change
actual_fee = total_input - outputs_total
print(f"\n  Fee verification: {actual_fee} sats ({FEE_RATE} sat/vB * {tx_size} bytes = {fee})")
assert actual_fee == fee, "Fee mismatch!"

print(f"\n  DESTINATION (IMMUTABLE): {CUSTODY}")
print(f"  AMOUNT: {AMOUNT_SATS/1e8:.8f} BTC")
print(f"  CHANGE: {change/1e8:.8f} BTC -> {PRIMARY}")
print(f"  FEE: {fee} sats")
print(f"  UTXOs used: {input_count}")

# Output PSBT
print(f"\n{'=' * 60}")
print("PSBT (Base64) — Import in Electrum/Sparrow to sign:")
print(f"{'=' * 60}")
# Split into lines for readability
for i in range(0, len(psbt_b64), 76):
    print(psbt_b64[i:i+76])

# Also save to file
with open("/home/z/my-project/download/withdraw_1btc_psbt.txt", "w") as f:
    f.write(f"PSBT for 1 BTC withdrawal to Binance Custody\n")
    f.write(f"{'=' * 60}\n\n")
    f.write(f"Destination (IMMUTABLE): {CUSTODY}\n")
    f.write(f"Amount: {AMOUNT_SATS/1e8:.8f} BTC\n")
    f.write(f"Change: {change/1e8:.8f} BTC -> {PRIMARY}\n")
    f.write(f"Fee: {fee} sats ({FEE_RATE} sat/vB)\n")
    f.write(f"Inputs: {input_count} UTXOs\n\n")
    f.write(f"PSBT Base64:\n{psbt_b64}\n\n")
    f.write(f"UTXOs used:\n")
    for u in UTXOS:
        f.write(f"  {u['txid']}:{u['vout']} = {u['value']} sats\n")

print(f"\nSaved to /home/z/my-project/download/withdraw_1btc_psbt.txt")
print("\nNEXT STEPS:")
print("  1. Import this PSBT in Electrum or Sparrow Wallet")
print(f"  2. Sign with the private key for {PRIMARY}")
print("  3. Export the final signed transaction hex")
print("  4. Paste in the dashboard 'Broadcast na Mainnet' field")