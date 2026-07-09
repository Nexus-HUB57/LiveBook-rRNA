import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import * as bip32 from "bip32";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";
import axios from "axios";

// Initialize ECPair with tinysecp
const ECPair = ECPairFactory(tinysecp);

// Bitcoin network configuration
const NETWORK = bitcoin.networks.bitcoin; // Mainnet
const TESTNET = bitcoin.networks.testnet; // Testnet for testing

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  privateKey?: string;
}

export interface TransactionInput {
  utxos: UTXO[];
  outputs: Array<{ address: string; value: number }>;
  fee: number;
  changeAddress: string;
  privateKeys: Map<string, string>;
}

export interface SignedTransaction {
  txid: string;
  hex: string;
  size: number;
}

/**
 * Gera uma nova carteira HD a partir de uma seed
 */
export function generateHDWallet(mnemonic?: string) {
  const seedMnemonic = mnemonic || bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(seedMnemonic);
  const root = bip32.BIP32Factory(tinysecp).fromSeed(seed, NETWORK);

  // BIP84 path para SegWit: m/84'/0'/0'/0/0
  const path = "m/84'/0'/0'/0/0";
  const child = root.derivePath(path);

  const publicKey = (child.publicKey as Buffer).toString("hex");
  const privateKey = (child.privateKey as Buffer | undefined)?.toString("hex") || "";

  // Gerar endereço SegWit (bc1)
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey as any,
    network: NETWORK,
  });

  const childAny = child as any;
  return {
    mnemonic: seedMnemonic,
    seed: seed.toString("hex"),
    xpub: childAny.neutered().toBase58(),
    xprv: childAny.toBase58(),
    publicKey,
    privateKey,
    address,
    path,
  };
}

/**
 * Gera endereço a partir de chave pública
 */
export function generateAddress(
  publicKeyHex: string,
  addressType: "P2PKH" | "P2SH" | "SegWit" = "SegWit"
) {
  const publicKey = Buffer.from(publicKeyHex, "hex");

  switch (addressType) {
    case "P2PKH":
      // Legacy address (1...)
      return bitcoin.payments.p2pkh({ pubkey: publicKey, network: NETWORK })
        .address;

    case "P2SH":
      // P2SH address (3...)
      const p2wpkh = bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network: NETWORK,
      });
      return bitcoin.payments.p2sh({ redeem: p2wpkh, network: NETWORK })
        .address;

    case "SegWit":
      // SegWit address (bc1...)
      return bitcoin.payments.p2wpkh({ pubkey: publicKey, network: NETWORK })
        .address;

    default:
      throw new Error(`Unknown address type: ${addressType}`);
  }
}

/**
 * Valida um endereço Bitcoin
 */
export function validateAddress(address: string): boolean {
  try {
    bitcoin.address.toOutputScript(address, NETWORK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Constrói e assina uma transação Bitcoin
 */
export async function buildAndSignTransaction(
  input: TransactionInput
): Promise<SignedTransaction> {
  const psbt = new bitcoin.Psbt({ network: NETWORK });

  let totalInput = 0;
  let totalOutput = 0;

  // Adicionar inputs (UTXOs)
  for (const utxo of input.utxos) {
    // Buscar transação anterior para obter o script
    const prevTx = await fetchTransaction(utxo.txid);

    if (!prevTx) {
      throw new Error(`Could not fetch transaction: ${utxo.txid}`);
    }

    const prevTxBuffer = Buffer.from(prevTx, "hex");

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: prevTxBuffer,
    });

    totalInput += utxo.value;
  }

  // Adicionar outputs
  for (const output of input.outputs) {
    if (!validateAddress(output.address)) {
      throw new Error(`Invalid address: ${output.address}`);
    }

    psbt.addOutput({
      address: output.address,
      value: BigInt(output.value),
    });

    totalOutput += output.value;
  }

  // Adicionar change se necessário
  const change = totalInput - totalOutput - input.fee;
  if (change > 0) {
    psbt.addOutput({
      address: input.changeAddress,
      value: BigInt(change),
    });
  } else if (change < 0) {
    throw new Error(
      `Insufficient funds: need ${totalOutput + input.fee}, have ${totalInput}`
    );
  }

  // Assinar inputs
  for (let i = 0; i < input.utxos.length; i++) {
    const utxo = input.utxos[i];
    const privateKeyHex = input.privateKeys.get(utxo.address);

    if (!privateKeyHex) {
      throw new Error(`No private key for address: ${utxo.address}`);
    }

    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKeyHex, "hex"), {
      network: NETWORK,
    });

    psbt.signInput(i, keyPair);
  }

  // Finalizar transação
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txid = tx.getId();

  return {
    txid,
    hex: txHex,
    size: tx.byteLength(),
  };
}

/**
 * Transmite uma transação assinada para a rede Bitcoin
 */
export async function broadcastTransaction(txHex: string): Promise<string> {
  try {
    // Usar BlockCypher API para broadcast
    const response = await axios.post(
      "https://api.blockcypher.com/v1/btc/main/txs/push",
      { tx: txHex },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.tx && response.data.tx.hash) {
      return response.data.tx.hash;
    }

    throw new Error("Broadcast failed: no transaction hash in response");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Broadcast error: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Busca UTXOs de um endereço
 */
export async function getUTXOs(address: string): Promise<UTXO[]> {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}`
    );

    if (!response.data.txrefs) {
      return [];
    }

    return response.data.txrefs
      .filter((ref: any) => !ref.spent_by)
      .map((ref: any) => ({
        txid: ref.tx_hash,
        vout: ref.tx_output_n,
        value: ref.output_value,
        address: address,
      }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch UTXOs: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Busca saldo de um endereço
 */
export async function getBalance(address: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`
    );

    return response.data.balance || 0;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch balance: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Busca transação completa
 */
export async function fetchTransaction(txid: string): Promise<string | null> {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/txs/${txid}?includeHex=true`
    );

    return response.data.tx || null;
  } catch (error) {
    console.error(`Failed to fetch transaction ${txid}:`, error);
    return null;
  }
}

/**
 * Estima taxa de transação
 */
export async function estimateFee(bytes: number): Promise<number> {
  try {
    const response = await axios.get(
      "https://api.blockcypher.com/v1/btc/main"
    );

    // BlockCypher retorna fee em satoshis por byte
    const feePerByte = response.data.medium_fee_per_kb / 1000;
    return Math.ceil(bytes * feePerByte);
  } catch (error) {
    // Fallback: 50 satoshis por byte
    return Math.ceil(bytes * 50);
  }
}

/**
 * Criptografa chave privada com senha
 */
export function encryptPrivateKey(
  privateKey: string,
  password: string
): string {
  // Implementação simplificada - em produção, usar bcrypt ou similar
  const encrypted = Buffer.from(privateKey + ":" + password).toString("base64");
  return encrypted;
}

/**
 * Descriptografa chave privada com senha
 */
export function decryptPrivateKey(
  encrypted: string,
  password: string
): string {
  // Implementação simplificada
  const decrypted = Buffer.from(encrypted, "base64").toString("utf-8");
  const [privateKey, pwd] = decrypted.split(":");

  if (pwd !== password) {
    throw new Error("Invalid password");
  }

  return privateKey;
}
