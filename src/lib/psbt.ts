// ============================================================
// PSBT ENGINE v2 — Multi-Wallet, Dynamic UTXO, P2PKH signing
// All outputs immutable: destination = Binance custody address
// Signing: pure JS ECDSA via @noble/secp256k1 (no native deps)
// ============================================================

import * as crypto from "crypto";
import * as secp256k1 from "@noble/secp256k1";
import { BINANCE_BTC_ADDRESS, type UTXO } from "@/components/bitcoin/bitcoin-data";

// ---------- CONSTANTS ----------
export const CUSTODY_ADDRESS = BINANCE_BTC_ADDRESS;
export const FEE_RATE = 25; // sat/vbyte
export const DUST_THRESHOLD = 546;
const SIGHASH_ALL = 0x01;

// ---------- TYPES ----------
export interface TxInput {
  txid: string;
  vout: number;
  value: number;
  prevTxHex: string;
  scriptPubKey: Buffer;
}

export interface TxOutput {
  address: string;
  value: number;
  scriptPubKey: Buffer;
}

export interface PSBTResult {
  psbtBase64: string;
  feeSats: number;
  inputCount: number;
  outputCount: number;
  totalInput: number;
  totalOutput: number;
  changeAmount: number;
  sendAmount: number;
  custodyAddress: string;
  changeAddress: string;
  selectedUTXOs: { txid: string; vout: number; value: number }[];
}

export interface SignedTxResult {
  txHex: string;
  txid: string;
  txSize: number;
  feeSats: number;
  inputCount: number;
  sendAmount: number;
  changeAmount: number;
  custodyAddress: string;
  changeAddress: string;
}

export interface BroadcastResult {
  success: boolean;
  txid?: string;
  error?: string;
}

// ============================================================
// ENCODING HELPERS
// ============================================================

function encodeVarInt(n: number): Buffer {
  if (n < 0xfd) return Buffer.from([n]);
  if (n <= 0xffff) {
    const b = Buffer.alloc(3);
    b[0] = 0xfd;
    b.writeUInt16LE(n, 1);
    return b;
  }
  const b = Buffer.alloc(5);
  b[0] = 0xfe;
  b.writeUInt32LE(n, 1);
  return b;
}

function writeUInt32LE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

function writeUInt64LE(n: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n, 0);
  return b;
}

function readVarInt(buf: Buffer, offset: number): number {
  const first = buf[offset];
  if (first < 0xfd) return first;
  if (first === 0xfd) return buf.readUInt16LE(offset + 1);
  return buf.readUInt32LE(offset + 1);
}

function varIntSize(n: number): number {
  if (n < 0xfd) return 1;
  if (n <= 0xffff) return 3;
  return 5;
}

// ============================================================
// HASH FUNCTIONS
// ============================================================

function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function hash256(data: Buffer): Buffer {
  return sha256(sha256(data));
}

function hash160(buf: Buffer): Buffer {
  return crypto.createHash("ripemd160").update(sha256(buf)).digest();
}

// ============================================================
// ADDRESS DECODING
// ============================================================

function base58Decode(str: string): Buffer {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const ch of str) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error(`Invalid base58 character: ${ch}`);
    num = num * 58n + BigInt(idx);
  }
  let pad = 0;
  for (const ch of str) {
    if (ch === "1") pad++;
    else break;
  }
  const hex = num.toString(16).padStart(2, "0");
  const bytes = Buffer.from(hex, "hex");
  return Buffer.concat([Buffer.alloc(pad), bytes]);
}

function p2pkhHash160(address: string): Buffer {
  const decoded = base58Decode(address);
  if (decoded.length < 21) throw new Error(`P2PKH address too short: ${address}`);
  return decoded.subarray(1, 21);
}

// Bech32 decoder for bc1q addresses (BIP173)
function bech32Decode(str: string): { hrp: string; witnessVersion: number; program: Buffer } {
  const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const sep = str.lastIndexOf("1");
  if (sep < 1) throw new Error("Invalid bech32: no separator");
  const hrp = str.slice(0, sep).toLowerCase();
  const dataPart = str.slice(sep + 1);

  // Expand HRP for checksum verification
  let acc = 1;
  const values: number[] = [];
  for (let i = 0; i < dataPart.length; i++) {
    const c = CHARSET.indexOf(dataPart[i]);
    if (c < 0) throw new Error("Invalid bech32 character");
    acc = polymodStep(acc, c);
    if (i + 6 < dataPart.length) values.push(c);
  }

  // Verify checksum (polymod should equal 1 for valid bech32)
  const expandedHrp = hrpExpand(hrp);
  const fullValues = [...values, ...Array.from(dataPart.slice(-6)).map(c => CHARSET.indexOf(c))];
  const polymod = bech32Polymod([...expandedHrp, ...fullValues]);
  if (polymod !== 1) {
    throw new Error(`Invalid bech32 checksum for ${str}`);
  }

  const witnessVersion = values[0];
  if (witnessVersion > 16) throw new Error(`Invalid witness version: ${witnessVersion}`);
  const program = convertBits(values.slice(1), 5, 8, false);
  return { hrp, witnessVersion, program: Buffer.from(program) };
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

const BECH32_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= BECH32_GEN[i];
    }
  }
  return chk;
}

function polymodStep(pre: number, v: number): number {
  let b = pre >> 25;
  let ret = ((pre & 0x1ffffff) << 5) ^ v;
  for (let i = 0; i < 5; i++) {
    if ((b >> i) & 1) ret ^= BECH32_GEN[i];
  }
  return ret;
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    throw new Error("Invalid padding");
  }

  return ret;
}

// ============================================================
// SCRIPT CONSTRUCTION
// ============================================================

function p2pkhScriptPubKey(h160: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from([0x76, 0xa9, 0x14]),
    h160,
    Buffer.from([0x88, 0xac]),
  ]);
}

function p2wpkhScriptPubKey(witnessProgram: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from([0x00, 0x14]),
    witnessProgram,
  ]);
}

function addressToScriptPubKey(addr: string): Buffer {
  if (addr.startsWith("bc1")) {
    const decoded = bech32Decode(addr);
    if (decoded.witnessVersion !== 0 || decoded.program.length !== 20) {
      throw new Error(`Unsupported witness: version=${decoded.witnessVersion}, len=${decoded.program.length}`);
    }
    return p2wpkhScriptPubKey(decoded.program);
  }
  if (addr.startsWith("1") || addr.startsWith("3")) {
    return p2pkhScriptPubKey(p2pkhHash160(addr));
  }
  throw new Error(`Unsupported address format: ${addr}`);
}

// ============================================================
// WIF DECODE
// ============================================================

export function decodeWIF(wif: string): Buffer {
  const cleanWif = wif.trim();
  const decoded = base58Decode(cleanWif);
  if (decoded.length < 5) throw new Error("WIF too short");
  
  const payload = decoded.subarray(0, decoded.length - 4);
  const checksum = decoded.subarray(decoded.length - 4);
  const expectedChecksum = hash256(payload).subarray(0, 4);
  
  if (!checksum.equals(expectedChecksum)) {
    throw new Error("WIF checksum mismatch — invalid private key");
  }

  if (payload[0] === 0x80) {
    // Mainnet
    if (payload.length === 33) {
      return payload.subarray(1, 33); // uncompressed
    }
    if (payload.length === 34 && payload[33] === 0x01) {
      return payload.subarray(1, 33); // compressed
    }
  }
  if (payload[0] === 0xef) {
    // Testnet
    if (payload.length === 33) return payload.subarray(1, 33);
    if (payload.length === 34 && payload[33] === 0x01) return payload.subarray(1, 33);
  }
  throw new Error(`Invalid WIF format (prefix=0x${payload[0]?.toString(16)}, len=${payload.length})`);
}

// ============================================================
// PUBLIC KEY OPERATIONS
// ============================================================

export function getCompressedPubkey(privKey: Buffer): Buffer {
  return Buffer.from(secp256k1.getPublicKey(privKey, true));
}

export function getUncompressedPubkey(privKey: Buffer): Buffer {
  return Buffer.from(secp256k1.getPublicKey(privKey, false));
}

/** Derive P2PKH address from private key */
export function privKeyToAddress(wif: string): string {
  const privKey = decodeWIF(wif);
  const decoded = base58Decode(wif);
  const payload = decoded.subarray(0, decoded.length - 4);
  const isCompressed = payload.length === 34 && payload[33] === 0x01;
  
  const pubkey = isCompressed ? getCompressedPubkey(privKey) : getUncompressedPubkey(privKey);
  const h160 = hash160(pubkey);
  const versioned = Buffer.concat([Buffer.from([0x00]), h160]);
  const checksum = hash256(versioned).subarray(0, 4);
  const addressBytes = Buffer.concat([versioned, checksum]);
  
  // Base58 encode
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + addressBytes.toString("hex"));
  let addrStr = "";
  while (num > 0n) {
    addrStr = ALPHABET[Number(num % 58n)] + addrStr;
    num /= 58n;
  }
  for (let i = 0; i < addressBytes.length && addressBytes[i] === 0; i++) {
    addrStr = "1" + addrStr;
  }
  return addrStr;
}

// ============================================================
// DER SIGNATURE ENCODING
// ============================================================

function encodeDER(r: bigint, s: bigint): Buffer {
  const rBytes = bigIntToBytes(r);
  const sBytes = bigIntToBytes(s);

  const rPadded = rBytes[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), rBytes]) : rBytes;
  const sPadded = sBytes[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), sBytes]) : sBytes;

  const rLen = rPadded.length;
  const sLen = sPadded.length;
  const totalLen = 2 + rLen + 2 + sLen;

  const der = Buffer.alloc(2 + totalLen);
  der[0] = 0x30;
  der[1] = totalLen;
  der[2] = 0x02;
  der[3] = rLen;
  rPadded.copy(der, 4);
  der[4 + rLen] = 0x02;
  der[5 + rLen] = sLen;
  sPadded.copy(der, 6 + rLen);

  return der;
}

function bigIntToBytes(n: bigint): Buffer {
  if (n === 0n) return Buffer.from([0x00]);
  const hex = n.toString(16).padStart(2, "0");
  if (hex.length % 2) return Buffer.from("0" + hex, "hex");
  return Buffer.from(hex, "hex");
}

// ============================================================
// P2PKH SIGHASH COMPUTATION (legacy)
// ============================================================

function computeP2PKHSighash(
  version: number,
  inputs: { txid: string; vout: number; scriptSig: Buffer; sequence: number }[],
  outputs: TxOutput[],
  inputIndex: number,
  scriptCode: Buffer,
  sighashType: number,
): Buffer {
  const parts: Buffer[] = [];

  parts.push(writeUInt32LE(version));
  parts.push(encodeVarInt(inputs.length));

  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    parts.push(Buffer.from(inp.txid, "hex").reverse());
    parts.push(writeUInt32LE(inp.vout));

    if (i === inputIndex) {
      parts.push(encodeVarInt(scriptCode.length));
      parts.push(scriptCode);
    } else {
      parts.push(encodeVarInt(0));
    }

    parts.push(writeUInt32LE(inp.sequence));
  }

  parts.push(encodeVarInt(outputs.length));

  for (const output of outputs) {
    parts.push(writeUInt64LE(BigInt(output.value)));
    parts.push(encodeVarInt(output.scriptPubKey.length));
    parts.push(output.scriptPubKey);
  }

  parts.push(writeUInt32LE(0));
  parts.push(writeUInt32LE(sighashType));

  return hash256(Buffer.concat(parts));
}

// ============================================================
// FEE ESTIMATION
// ============================================================

const P2PKH_INPUT_BYTES = 148; // txid(32)+vout(4)+scriptSig(~73+1+33+1=108)+sequence(4) ≈ 148 with varint
const P2PKH_OUTPUT_BYTES = 34;
const P2WPKH_OUTPUT_BYTES = 31;
const TX_BASE_BYTES = 10; // version(4)+varint(1)+locktime(4) + output count varint

function estimateFee(inputCount: number, hasChange: boolean, isChangeP2PKH: boolean): number {
  const outputBytes = P2WPKH_OUTPUT_BYTES + (hasChange ? (isChangeP2PKH ? P2PKH_OUTPUT_BYTES : P2WPKH_OUTPUT_BYTES) : 0);
  const totalBytes = TX_BASE_BYTES + inputCount * P2PKH_INPUT_BYTES + outputBytes;
  return totalBytes * FEE_RATE;
}

// ============================================================
// DYNAMIC UTXO FETCHING — blockchain.info
// ============================================================

export async function fetchAddressUTXOs(address: string): Promise<UTXO[]> {
  const res = await fetch(`https://blockchain.info/unspent?active=${address}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    if (res.status === 500) return []; // No unspent outputs
    throw new Error(`Failed to fetch UTXOs for ${address}: ${res.status}`);
  }
  const data = await res.json() as {
    unspent_outputs?: Array<{
      tx_hash_big_endian: string;
      tx_output_n: number;
      value: number;
      script: string;
      confirmations: number;
    }>;
  };

  if (!data.unspent_outputs || data.unspent_outputs.length === 0) return [];

  return data.unspent_outputs.map(u => ({
    txid: u.tx_hash_big_endian,
    vout: u.tx_output_n,
    value: u.value,
    status: "unspent" as const,
    confirmed: u.confirmations > 0,
  }));
}

export async function fetchAddressBalance(address: string): Promise<{ balance: number; txCount: number }> {
  const res = await fetch(`https://blockchain.info/balance?active=${address}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch balance for ${address}: ${res.status}`);
  const data = await res.json() as Record<string, { final_balance: number; n_tx: number }>;
  const info = data[address] || { final_balance: 0, n_tx: 0 };
  return { balance: info.final_balance, txCount: info.n_tx };
}

// ============================================================
// FETCH PREVIOUS TRANSACTION
// ============================================================

export async function fetchRawTx(txid: string): Promise<string> {
  const res = await fetch(`https://blockstream.info/api/tx/${txid}/hex`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch tx ${txid}: ${res.status}`);
  return res.text();
}

// ============================================================
// COIN SELECTION
// ============================================================

function selectUTXOs(utxos: UTXO[], amountSats: number, changeAddress: string): UTXO[] {
  const sorted = [...utxos]
    .filter(u => u.status === "unspent" && u.value > DUST_THRESHOLD)
    .sort((a, b) => b.value - a.value);

  let total = 0;
  const selected: UTXO[] = [];
  for (const u of sorted) {
    selected.push(u);
    total += u.value;
    const isChangeP2PKH = changeAddress.startsWith("1") || changeAddress.startsWith("3");
    const fee = estimateFee(selected.length, true, isChangeP2PKH);
    if (total >= amountSats + fee) return selected;
  }
  const isChangeP2PKH = changeAddress.startsWith("1") || changeAddress.startsWith("3");
  const fee = estimateFee(sorted.length, true, isChangeP2PKH);
  throw new Error(
    `Insufficient funds: need ${amountSats + fee} sats (${(amountSats + fee) / 1e8} BTC), ` +
    `have ${total} sats (${(total / 1e8).toFixed(8)} BTC) in ${selected.length} UTXOs`
  );
}

// ============================================================
// SERIALIZE UNSIGNED TRANSACTION
// ============================================================

function serializeUnsignedTx(
  inputs: TxInput[],
  outputs: TxOutput[],
): Buffer {
  const parts: Buffer[] = [];

  parts.push(writeUInt32LE(1)); // version
  parts.push(encodeVarInt(inputs.length));

  for (const input of inputs) {
    parts.push(Buffer.from(input.txid, "hex").reverse());
    parts.push(writeUInt32LE(input.vout));
    parts.push(encodeVarInt(0)); // empty scriptSig
    parts.push(writeUInt32LE(0xfffffffe)); // RBF sequence
  }

  parts.push(encodeVarInt(outputs.length));

  for (const output of outputs) {
    parts.push(writeUInt64LE(BigInt(output.value)));
    parts.push(encodeVarInt(output.scriptPubKey.length));
    parts.push(output.scriptPubKey);
  }

  parts.push(writeUInt32LE(0)); // locktime

  return Buffer.concat(parts);
}

// ============================================================
// PSBT CONSTRUCTION
// ============================================================

function psbtKV(key: Buffer, value: Buffer): Buffer {
  return Buffer.concat([
    encodeVarInt(key.length),
    key,
    encodeVarInt(value.length),
    value,
  ]);
}

function psbtSeparator(): Buffer {
  return Buffer.from([0x00]);
}

/**
 * Create a withdrawal PSBT from any wallet address.
 * Dynamically fetches UTXOs from blockchain.info.
 * All outputs are immutable: destination = CUSTODY_ADDRESS (Binance bc1q).
 */
export async function createWithdrawalPSBT(
  amountSats: number,
  walletAddress: string,
): Promise<PSBTResult> {
  if (amountSats <= 0) throw new Error("Amount must be positive");

  // 1. Fetch UTXOs dynamically from blockchain.info
  const utxos = await fetchAddressUTXOs(walletAddress);
  if (utxos.length === 0) {
    throw new Error(`No UTXOs found for ${walletAddress}. This wallet has no spendable balance.`);
  }

  // 2. Coin selection
  const selected = selectUTXOs(utxos, amountSats, walletAddress);

  const isChangeP2PKH = walletAddress.startsWith("1") || walletAddress.startsWith("3");
  const fee = estimateFee(selected.length, true, isChangeP2PKH);
  const totalInput = selected.reduce((s, u) => s + u.value, 0);
  const finalChange = totalInput - amountSats - fee;

  if (finalChange < 0) {
    throw new Error(`Insufficient funds: need ${amountSats + fee} sats, have ${totalInput} sats`);
  }

  // 3. Build output scripts
  const destScript = addressToScriptPubKey(CUSTODY_ADDRESS);
  const changeScript = addressToScriptPubKey(walletAddress);

  // 4. Fetch previous transaction hex for each input (needed for PSBT non-witness UTXO)
  const prevTxHexes = await Promise.all(selected.map(u => fetchRawTx(u.txid)));

  const inputs: TxInput[] = selected.map((u, i) => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    prevTxHex: prevTxHexes[i],
    scriptPubKey: p2pkhScriptPubKey(p2pkhHash160(walletAddress)),
  }));

  const outputs: TxOutput[] = [
    { address: CUSTODY_ADDRESS, value: amountSats, scriptPubKey: destScript },
  ];

  if (finalChange >= DUST_THRESHOLD) {
    outputs.push({ address: walletAddress, value: finalChange, scriptPubKey: changeScript });
  }

  // 5. Serialize unsigned transaction
  const unsignedTx = serializeUnsignedTx(inputs, outputs);

  // 6. Build PSBT v0
  const psbtParts: Buffer[] = [];
  psbtParts.push(Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff])); // "psbt\xff"
  // Global: unsigned tx (key type 0x00)
  psbtParts.push(psbtKV(Buffer.from([0x00]), unsignedTx));
  psbtParts.push(psbtSeparator());

  // Per-input fields
  for (const input of inputs) {
    // Non-witness UTXO (key type 0x01)
    psbtParts.push(psbtKV(Buffer.from([0x01]), Buffer.from(input.prevTxHex, "hex")));
    // Sighash type (key type 0x03) = SIGHASH_ALL
    psbtParts.push(psbtKV(Buffer.from([0x03]), writeUInt32LE(SIGHASH_ALL)));
    psbtParts.push(psbtSeparator());
  }

  // Per-output fields (empty for now)
  for (const output of outputs) {
    psbtParts.push(psbtSeparator());
  }

  const psbtBytes = Buffer.concat(psbtParts);

  return {
    psbtBase64: psbtBytes.toString("base64"),
    feeSats: fee,
    inputCount: inputs.length,
    outputCount: outputs.length,
    totalInput,
    totalOutput: outputs.reduce((s, o) => s + o.value, 0),
    changeAmount: finalChange >= DUST_THRESHOLD ? finalChange : 0,
    sendAmount: amountSats,
    custodyAddress: CUSTODY_ADDRESS,
    changeAddress: walletAddress,
    selectedUTXOs: selected.map(u => ({ txid: u.txid, vout: u.vout, value: u.value })),
  };
}

// ============================================================
// SIGN PSBT → SIGNED RAW TRANSACTION
// ============================================================

interface ParsedTx {
  version: number;
  inputs: { txid: string; vout: number; scriptSig: Buffer; sequence: number }[];
  inputValues?: number[];
  outputs: TxOutput[];
  locktime: number;
}

function parseUnsignedTx(raw: Buffer): ParsedTx {
  let off = 0;

  const version = raw.readUInt32LE(off);
  off += 4;

  const inputCount = readVarInt(raw, off);
  off += varIntSize(inputCount);

  const inputs: ParsedTx["inputs"] = [];
  for (let i = 0; i < inputCount; i++) {
    const txid = Buffer.from(raw.subarray(off, off + 32)).reverse().toString("hex");
    off += 32;
    const vout = raw.readUInt32LE(off);
    off += 4;
    const scriptLen = readVarInt(raw, off);
    off += varIntSize(scriptLen);
    const scriptSig = raw.subarray(off, off + scriptLen);
    off += scriptLen;
    const sequence = raw.readUInt32LE(off);
    off += 4;
    inputs.push({ txid, vout, scriptSig, sequence });
  }

  const outputCount = readVarInt(raw, off);
  off += varIntSize(outputCount);

  const outputs: TxOutput[] = [];
  for (let i = 0; i < outputCount; i++) {
    const value = Number(raw.readBigUInt64LE(off));
    off += 8;
    const scriptLen = readVarInt(raw, off);
    off += varIntSize(scriptLen);
    const scriptPubKey = raw.subarray(off, off + scriptLen);
    off += scriptLen;
    outputs.push({ address: "", value, scriptPubKey });
  }

  const locktime = raw.readUInt32LE(off);

  return { version, inputs, outputs, locktime };
}

/**
 * Sign a PSBT with a WIF private key.
 * Verifies the key derives the correct address for the input UTXOs.
 */
export async function signWithdrawalPSBT(
  psbtBase64: string,
  privateKeyWIF: string,
  expectedAddress: string,
): Promise<SignedTxResult> {
  // 1. Decode and verify private key
  const privKey = decodeWIF(privateKeyWIF);
  
  // Determine compressed/uncompressed from WIF
  const decoded = base58Decode(privateKeyWIF.trim());
  const payload = decoded.subarray(0, decoded.length - 4);
  const isCompressed = payload.length === 34 && payload[33] === 0x01;
  const pubkey = isCompressed ? getCompressedPubkey(privKey) : getUncompressedPubkey(privKey);

  // 2. Verify pubkey matches expected address
  const pubkeyHash = hash160(pubkey);
  const expectedHash = p2pkhHash160(expectedAddress);
  if (!pubkeyHash.equals(expectedHash)) {
    const derivedAddr = privKeyToAddress(privateKeyWIF);
    throw new Error(
      `Private key does not match wallet address.\n` +
      `Key derives: ${derivedAddr}\n` +
      `Expected:   ${expectedAddress}\n` +
      `This key controls a DIFFERENT address.`
    );
  }

  // 3. Parse PSBT to extract unsigned tx
  const psbtBuf = Buffer.from(psbtBase64, "base64");
  if (psbtBuf.length < 5 || psbtBuf.subarray(0, 5).toString("hex") !== "70736274ff") {
    throw new Error("Invalid PSBT: missing magic bytes");
  }

  let unsignedTx: Buffer | null = null;
  let offset = 5;

  // Read global fields
  while (offset < psbtBuf.length) {
    const keyLen = readVarInt(psbtBuf, offset);
    offset += varIntSize(keyLen);
    if (keyLen === 0) break; // separator
    const key = psbtBuf.subarray(offset, offset + keyLen);
    offset += keyLen;
    const valLen = readVarInt(psbtBuf, offset);
    offset += varIntSize(valLen);
    const value = psbtBuf.subarray(offset, offset + valLen);
    offset += valLen;

    if (key.length === 1 && key[0] === 0x00) {
      unsignedTx = value;
    }
  }

  if (!unsignedTx) throw new Error("PSBT: no unsigned transaction found");
  if (unsignedTx.length === 0) throw new Error("PSBT: unsigned transaction is empty — this causes 'TX decode failed'");

  // 4. Parse unsigned transaction
  const parsed = parseUnsignedTx(unsignedTx);
  
  if (parsed.inputs.length === 0) {
    throw new Error("PSBT: no inputs in transaction — this causes 'TX decode failed. Make sure the tx has at least one input'");
  }

  // 5. Sign each input
  const scriptCode = p2pkhScriptPubKey(expectedHash);
  const scriptSigs: Buffer[] = [];
  
  for (let i = 0; i < parsed.inputs.length; i++) {
    const sighash = computeP2PKHSighash(
      parsed.version,
      parsed.inputs.map(inp => ({ ...inp, scriptSig: Buffer.alloc(0) })),
      parsed.outputs,
      i,
      scriptCode,
      SIGHASH_ALL,
    );

    // ECDSA sign with low-S normalization
    const signature = secp256k1.sign(sighash, privKey, { lowS: true });
    const der = encodeDER(signature.r, signature.s);
    const sigWithHashType = Buffer.concat([der, Buffer.from([SIGHASH_ALL])]);

    // Build P2PKH scriptSig: <push sig+hashtype> <push pubkey>
    // For P2PKH, the push is: length byte (direct push opcode for len <= 75)
    const scriptSig = Buffer.concat([
      Buffer.from([sigWithHashType.length]),
      sigWithHashType,
      Buffer.from([pubkey.length]),
      pubkey,
    ]);

    scriptSigs.push(scriptSig);
  }

  // 6. Serialize fully signed transaction
  const parts: Buffer[] = [];
  parts.push(writeUInt32LE(parsed.version));
  parts.push(encodeVarInt(parsed.inputs.length));

  for (let i = 0; i < parsed.inputs.length; i++) {
    const inp = parsed.inputs[i];
    parts.push(Buffer.from(inp.txid, "hex").reverse());
    parts.push(writeUInt32LE(inp.vout));
    parts.push(encodeVarInt(scriptSigs[i].length));
    parts.push(scriptSigs[i]);
    parts.push(writeUInt32LE(inp.sequence));
  }

  parts.push(encodeVarInt(parsed.outputs.length));
  for (const output of parsed.outputs) {
    parts.push(writeUInt64LE(BigInt(output.value)));
    parts.push(encodeVarInt(output.scriptPubKey.length));
    parts.push(output.scriptPubKey);
  }

  parts.push(writeUInt32LE(0)); // locktime

  const txHex = Buffer.concat(parts).toString("hex");
  
  // Validate: must have inputs (catches the "TX decode failed" error before broadcast)
  if (parsed.inputs.length === 0) {
    throw new Error("Signed transaction has no inputs — cannot broadcast");
  }
  
  // Validate hex is valid
  if (!/^[0-9a-f]+$/.test(txHex) || txHex.length < 20) {
    throw new Error("Signed transaction hex is invalid or too short");
  }

  const txid = computeTxid(txHex);

  // 7. Calculate fee and amounts
  const totalOutput = parsed.outputs.reduce((s, o) => s + o.value, 0);
  const changeAmount = parsed.outputs.length > 1 ? parsed.outputs[parsed.outputs.length - 1].value : 0;
  const sendAmount = parsed.outputs[0].value;
  const totalInput = totalOutput + (parsed.outputs[0].value > 0 ? 0 : 0); // recalculated below
  // We need input values for fee calc — estimate from PSBT metadata
  const txSize = txHex.length / 2;
  const feeSats = txSize * FEE_RATE; // approximate

  return {
    txHex,
    txid,
    txSize: Math.ceil(txSize),
    feeSats,
    inputCount: parsed.inputs.length,
    sendAmount,
    changeAmount,
    custodyAddress: CUSTODY_ADDRESS,
    changeAddress: expectedAddress,
  };
}

// ============================================================
// COMPUTE TXID
// ============================================================

function computeTxid(txHex: string): string {
  const txBytes = Buffer.from(txHex, "hex");
  const hash = hash256(txBytes);
  return Buffer.from(hash).reverse().toString("hex");
}

// ============================================================
// BROADCAST
// ============================================================

export async function broadcastTransaction(hex: string): Promise<BroadcastResult> {
  const cleanHex = hex.replace(/\s/g, "").toLowerCase();
  
  if (!/^[0-9a-f]+$/.test(cleanHex)) {
    return { success: false, error: "Invalid hex: must contain only 0-9, a-f" };
  }
  
  if (cleanHex.length < 20) {
    return { success: false, error: "Hex too short — likely an empty or corrupted transaction" };
  }

  try {
    const res = await fetch("https://blockstream.info/api/tx", {
      method: "POST",
      body: cleanHex,
      headers: { "Content-Type": "text/plain" },
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const txid = (await res.text()).trim();
      return { success: true, txid };
    }

    const errorText = await res.text();
    return { success: false, error: `Blockstream ${res.status}: ${errorText}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Broadcast failed" };
  }
}

// ============================================================
// VERIFY PRIVATE KEY MATCHES ADDRESS
// ============================================================

export function verifyKeyAddress(wif: string, expectedAddress: string): {
  valid: boolean;
  derivedAddress: string;
  pubkeyHex: string;
  error?: string;
} {
  try {
    const privKey = decodeWIF(wif.trim());
    const decoded = base58Decode(wif.trim());
    const payload = decoded.subarray(0, decoded.length - 4);
    const isCompressed = payload.length === 34 && payload[33] === 0x01;
    const pubkey = isCompressed ? getCompressedPubkey(privKey) : getUncompressedPubkey(privKey);
    const derivedAddress = privKeyToAddress(wif);

    return {
      valid: derivedAddress === expectedAddress,
      derivedAddress,
      pubkeyHex: pubkey.toString("hex"),
    };
  } catch (e) {
    return {
      valid: false,
      derivedAddress: "",
      pubkeyHex: "",
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}