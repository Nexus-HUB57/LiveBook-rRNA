// One-time script: Generate 10 new vault wallets and output as TypeScript code
// Run: npx tsx scripts/generate-vault-wallets.ts

import { generateWallet, toVaultWallet } from "../src/lib/keygen";

const COUNT = 10;

console.log("// ============================================================");
console.log(`// GENERATED VAULT WALLETS — ${COUNT} new keys`);
console.log(`// Generated: ${new Date().toISOString()}`);
console.log("// Entropy: crypto.randomBytes (CSPRNG)");
console.log("// Curve: secp256k1");
console.log("// ============================================================");
console.log("");
console.log("export const GENERATED_VAULT_WALLETS: VaultWallet[] = [");
console.log("  // === Appended to existing VAULT_WALLETS ===");

for (let i = 0; i < COUNT; i++) {
  const w = generateWallet();
  const vw = toVaultWallet(w, `Gen Vault #${i + 1}`);
  console.log(`  { name: "${vw.name}", address: "${vw.address}", wif: "${vw.wif}", compressed: ${vw.compressed}, pubkeyHex: "${vw.pubkeyHex}", type: "P2PKH" },`);
}

console.log("];");
console.log("");
console.log("// COPY the above lines and append to VAULT_WALLETS in bitcoin-data.ts");