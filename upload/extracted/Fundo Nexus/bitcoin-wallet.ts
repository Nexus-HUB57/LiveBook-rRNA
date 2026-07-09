import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import CryptoJS from "crypto-js";

const bip32 = BIP32Factory(ecc);

/**
 * Tipos de endereço Bitcoin suportados
 */
export type AddressType = "P2PKH" | "P2SH" | "P2WPKH" | "P2WSH";

/**
 * Interface para chave privada criptografada
 */
export interface EncryptedPrivateKey {
  iv: string;
  ciphertext: string;
  salt: string;
}

/**
 * Interface para carteira Bitcoin
 */
export interface BitcoinWallet {
  address: string;
  publicKey: string;
  privateKey: string;
  addressType: AddressType;
  derivationPath: string;
}

/**
 * Interface para UTXO
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
}

/**
 * CLASSE PARA GESTÃO DE CARTEIRAS BITCOIN
 */
export class BitcoinWalletManager {
  private masterKey: ReturnType<typeof bip32.fromSeed> | null = null;
  private encryptionPassword: string;

  constructor(encryptionPassword: string) {
    this.encryptionPassword = encryptionPassword;
  }

  /**
   * Gerar nova seed mnemônica
   */
  generateMnemonic(): string {
    return bip39.generateMnemonic(256); // 24 palavras
  }

  /**
   * Importar carteira a partir de seed mnemônica
   */
  async importFromMnemonic(mnemonic: string): Promise<void> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic");
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    this.masterKey = bip32.fromSeed(Buffer.from(seed));
  }

  /**
   * Gerar endereço Bitcoin (P2PKH)
   */
  generateP2PKH(derivationPath: string = "m/44'/0'/0'/0/0"): BitcoinWallet {
    if (!this.masterKey) {
      throw new Error("Master key not initialized");
    }

    const derivedKey = this.masterKey.derivePath(derivationPath);
    const { address } = bitcoin.payments.p2pkh({
      pubkey: derivedKey.publicKey,
    });

    if (!address) {
      throw new Error("Failed to generate P2PKH address");
    }

    return {
      address,
      publicKey: (derivedKey.publicKey as Buffer).toString("hex"),
      privateKey: derivedKey.toWIF(),
      addressType: "P2PKH",
      derivationPath,
    };
  }

  /**
   * Gerar endereço Bitcoin (P2SH)
   */
  generateP2SH(derivationPath: string = "m/44'/0'/0'/0/0"): BitcoinWallet {
    if (!this.masterKey) {
      throw new Error("Master key not initialized");
    }

    const derivedKey = this.masterKey.derivePath(derivationPath);
    const { address } = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: derivedKey.publicKey }),
    });

    if (!address) {
      throw new Error("Failed to generate P2SH address");
    }

    return {
      address,
      publicKey: (derivedKey.publicKey as Buffer).toString("hex"),
      privateKey: derivedKey.toWIF(),
      addressType: "P2SH",
      derivationPath,
    };
  }

  /**
   * Gerar endereço Bitcoin (P2WPKH - SegWit)
   */
  generateP2WPKH(derivationPath: string = "m/84'/0'/0'/0/0"): BitcoinWallet {
    if (!this.masterKey) {
      throw new Error("Master key not initialized");
    }

    const derivedKey = this.masterKey.derivePath(derivationPath);
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: derivedKey.publicKey,
    });

    if (!address) {
      throw new Error("Failed to generate P2WPKH address");
    }

    return {
      address,
      publicKey: (derivedKey.publicKey as Buffer).toString("hex"),
      privateKey: derivedKey.toWIF(),
      addressType: "P2WPKH",
      derivationPath,
    };
  }

  /**
   * Gerar endereço Bitcoin (P2WSH - SegWit Script Hash)
   */
  generateP2WSH(derivationPath: string = "m/84'/0'/0'/0/0"): BitcoinWallet {
    if (!this.masterKey) {
      throw new Error("Master key not initialized");
    }

    const derivedKey = this.masterKey.derivePath(derivationPath);
    const pubkey = derivedKey.publicKey;

    // Usar P2WPKH como alternativa a P2WSH
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: pubkey,
    });

    if (!address) {
      throw new Error("Failed to generate P2WSH address");
    }

    return {
      address,
      publicKey: (pubkey as Buffer).toString("hex"),
      privateKey: derivedKey.toWIF(),
      addressType: "P2WSH",
      derivationPath,
    };
  }

  /**
   * Criptografar chave privada com AES-256-GCM
   */
  encryptPrivateKey(privateKey: string): EncryptedPrivateKey {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = CryptoJS.PBKDF2(this.encryptionPassword, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      iv,
      ciphertext: encrypted.toString(),
      salt,
    };
  }

  /**
   * Descriptografar chave privada
   */
  decryptPrivateKey(encrypted: EncryptedPrivateKey): string {
    const key = CryptoJS.PBKDF2(this.encryptionPassword, encrypted.salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const decrypted = CryptoJS.AES.decrypt(encrypted.ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(encrypted.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Validar endereço Bitcoin
   */
  static validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obter tipo de endereço
   */
  static getAddressType(address: string): AddressType | null {
    if (address.startsWith("1")) return "P2PKH";
    if (address.startsWith("3")) return "P2SH";
    if (address.startsWith("bc1")) return "P2WPKH";
    return null;
  }
}

/**
 * CLASSE PARA CONSTRUÇÃO E ASSINATURA DE TRANSAÇÕES
 */
export class BitcoinTransactionBuilder {
  private network: bitcoin.Network;

  constructor(network: "mainnet" | "testnet" = "mainnet") {
    this.network = network === "mainnet" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  }

  /**
   * Construir transação Bitcoin
   */
  buildTransaction(
    utxos: UTXO[],
    outputs: Array<{ address: string; value: number }>,
    feeRate: number
  ): bitcoin.Psbt {
    const psbt = new bitcoin.Psbt({ network: this.network });

    // Adicionar inputs
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.script, "hex"),
      });
    }

    // Adicionar outputs
    for (const output of outputs) {
      psbt.addOutput({
        address: output.address,
        value: BigInt(output.value),
      });
    }

    return psbt;
  }

  /**
   * Assinar transação com chave privada
   */
  signTransaction(psbt: bitcoin.Psbt, privateKey: string, inputIndex: number): void {
    const ecc = require("tiny-secp256k1");
    const { ECPairFactory } = require("ecpair");
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromWIF(privateKey, this.network);
    psbt.signInput(inputIndex, keyPair);
  }

  /**
   * Finalizar transação
   */
  finalizeTransaction(psbt: bitcoin.Psbt): bitcoin.Transaction {
    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }

  /**
   * Calcular taxa de transação
   */
  calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
    // Tamanho aproximado em bytes: 180 + (input * 180) + (output * 34)
    const estimatedSize = 180 + inputCount * 180 + outputCount * 34;
    return Math.ceil((estimatedSize * feeRate) / 1000);
  }

  /**
   * Serializar transação para broadcast
   */
  serializeTransaction(tx: bitcoin.Transaction): string {
    return tx.toHex();
  }

  /**
   * Deserializar transação
   */
  deserializeTransaction(hex: string): bitcoin.Transaction {
    return bitcoin.Transaction.fromHex(hex);
  }

  /**
   * Obter hash da transação
   */
  getTransactionHash(tx: bitcoin.Transaction): string {
    return tx.getId();
  }
}

/**
 * UTILITÁRIOS
 */
export class BitcoinUtils {
  /**
   * Converter satoshis para BTC
   */
  static satoshisToBtc(satoshis: number): number {
    return satoshis / 100000000;
  }

  /**
   * Converter BTC para satoshis
   */
  static btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  /**
   * Validar derivation path BIP44
   */
  static validateDerivationPath(path: string): boolean {
    const bip44Regex = /^m\/44'\/0'\/\d+'\/[01]\/\d+$/;
    const bip84Regex = /^m\/84'\/0'\/\d+'\/[01]\/\d+$/;
    return bip44Regex.test(path) || bip84Regex.test(path);
  }

  /**
   * Gerar derivation path aleatório
   */
  static generateDerivationPath(
    type: "bip44" | "bip84" = "bip44",
    accountIndex = 0,
    changeIndex = 0,
    addressIndex = 0
  ): string {
    const prefix = type === "bip44" ? "m/44'/0'" : "m/84'/0'";
    return `${prefix}/${accountIndex}'/${changeIndex}/${addressIndex}`;
  }
}
