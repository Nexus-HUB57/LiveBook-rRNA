// Bitcoin Core Data — extracted from uploaded wallet/dat files

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: "unspent" | "spent";
}

export interface WalletAddress {
  address: string;
  type: "P2PKH" | "imported" | "HD" | "change";
  balance: number;
  utxos: UTXO[];
  label?: string;
}

export interface HDWallet {
  xpub: string;
  xprv: string;
  seed: string;
  receivingPubkeys: string[];
  changePubkeys: string[];
}

export const PRIMARY_ADDRESS = "1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p";

export const PRIMARY_UTXOS: UTXO[] = [
  { txid: "d50871077b83f7f2497a65c8ff00172c9bbfefd46cd2c4c258a2cccbad337d82", vout: 922, value: 28597795, status: "unspent" },
  { txid: "1718f4030854838eb25ebc031f32e21beee197559ad5f38934b3d0d7450c0d27", vout: 96, value: 49072094, status: "unspent" },
  { txid: "be24778608c51a270d9eeb52f3a19cf244eb04547e7960ac8fe48d3ef4752c70", vout: 61, value: 33607791, status: "unspent" },
  { txid: "f36222943ad100899acbd8300f943ee2c127babef879d8a3c0696c0d914e04ca", vout: 438, value: 14484924, status: "unspent" },
  { txid: "086e0da0a12b7023197d5a571a60cdda60fbea3cb81f856d446e54d7a113b74e", vout: 51, value: 102490601, status: "unspent" },
  { txid: "0efd5fe6677b219476b4033f766ca0313da77352cbca4eba3dc5448772e87e92", vout: 27, value: 100168537, status: "unspent" },
  { txid: "7101948b7b995876b88b6e7c598db348927034cc9b164c79efd9931115accca3", vout: 102, value: 35662603, status: "unspent" },
  { txid: "d7743aa3cf1c03d5d549f3bac609434efb2be203758ae1c1029ba104ca849344", vout: 34, value: 102619816, status: "unspent" },
  { txid: "154e4719de8e2f98c6aad17ea13feee0195d6255afbc0590003602f4c34c291e", vout: 49, value: 103405287, status: "unspent" },
  { txid: "863cee05512da5650d04fac45ea16846353889a232268a4c93a388b5ec65fd30", vout: 19, value: 103244381, status: "unspent" },
  { txid: "f1356e36066b517ac2ba9722daee75faea81c2bc7f62204b92c01c6b819146bb", vout: 29, value: 112805208, status: "unspent" },
  { txid: "be3a32656b74142a92bb33240cba123bbb43ab44f068830217268ec6eba1e997", vout: 28, value: 102471509, status: "unspent" },
  { txid: "5568a5784bd1d0a2e1106213d540d7128eac6d407f75a06b8ffe5251b3193b97", vout: 30, value: 101988576, status: "unspent" },
  { txid: "23d474c06aa407b606b8b782275ff3a6df73637649127a19356c29e1c006abfb", vout: 27, value: 107758946, status: "unspent" },
  { txid: "addc0a9fe04869f194c53eb9c88bca3e333aca09ba023b7e23ab0fd5ca920ecd", vout: 27, value: 116545217, status: "unspent" },
  { txid: "478737a3655e16f86304dad75e181b3c3e615b932126cf2f50987fcc55bf76b2", vout: 25, value: 145106743, status: "unspent" },
  { txid: "b7e891994c64a62cb0d89b6fab03c8d28c71e969ba710b95c42ebc690c6958f9", vout: 23, value: 111900382, status: "unspent" },
  { txid: "651f2d653c084b4e7036969040ec0e7a45fd03dd12c99c3a7c056c8a728f02a9", vout: 7, value: 130374261, status: "unspent" },
  { txid: "2afd22ca960bf17c8a197e2ff6da79de9f080e5d18235ea0b9bb82133ef8a07d", vout: 26, value: 123064568, status: "unspent" },
  { txid: "e7b98db167e78c69f5f111d380a3bbadcceefba63c67843f620b268817931e28", vout: 28, value: 109216775, status: "unspent" },
  { txid: "6136c5887f96df445cd3169cae377d6890a5f090cab4a0e8f84b83ecb7de2603", vout: 36, value: 106186836, status: "unspent" },
  { txid: "cb18bca8dd479d340c9307ceee5910fcb8ae89c7c883633abd49d68f837a5295", vout: 27, value: 128588780, status: "unspent" },
  { txid: "008480fd094950e600b0af51a12792c760d42cbef76202f243209669d1509394", vout: 18, value: 104338196, status: "unspent" },
  { txid: "201bc3890f0f12c6eb31460d455d86e7616bb6b018b07759e7e2d18745c8214d", vout: 18, value: 121970193, status: "unspent" },
  { txid: "9ee8addb633469bd2be840ab3b23db7f5fa5906c72a894a19e4890b24e38cbf9", vout: 24, value: 110031837, status: "unspent" },
  { txid: "ec193509df9db918f2d926195e82f352e9822ff1179818436b356752a22fa63d", vout: 27, value: 149742650, status: "unspent" },
  { txid: "f40a2e972408bf24b9e707710de19563258f418866c7080fefeb3be4eafdf7fd", vout: 0, value: 600, status: "unspent" },
  { txid: "2fe796c33a95e15d86534d3bc737ec85c6500f088e4a85b1aacda29f0e52799c", vout: 0, value: 600, status: "unspent" },
  { txid: "d8d4d3e2610b3844cf87759fd0a3b94769c5aafda855a19dd71b319eb55671e0", vout: 0, value: 600, status: "unspent" },
  { txid: "59c8683930f486e5e78763d25b5a0c0632a08baa57399bcafdb181918081f33c", vout: 152, value: 547, status: "unspent" },
  { txid: "fa13972a9adff9037f6cdccd2278cfd61c3af99fbfdf4ebc8218f3e1d56a5f8c", vout: 283, value: 547, status: "unspent" },
  { txid: "1c19389b0461f0901d8eace260764691926a5636c74bd8a3cc68db08dbbeb80a", vout: 459, value: 5171113, status: "spent" },
];

export const HD_WALLET: HDWallet = {
  xpub: "xpub661MyMwAqRbcH3qZAL2neui6Rh894yMwDKCDpar3ErCRA2PYTxq6n2HET2yM4eXkptg2FTBHxQVFzVhBzhNocaxtahKXAaobGkzPKAjJhWA",
  xprv: "xprv9s21ZrQH143K4Zm64JVnHmmMsfHefWe5r6Gd2CSRgWfSHE4PvRWrEDxkbnBVh9hT9r2PWbYQZo4iBNg7EiG517AgdhGcJvn49futQHVH7sC",
  seed: "marriage steel million dress original father clock come flush ostrich kangaroo method abuse",
  receivingPubkeys: [
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
  ],
  changePubkeys: [
    "025bbd70ab04b4921933fcbe17042bb0a5104407e32b6e6c7ca6f3e9b65c7177e6",
    "02e72abfb554a744b20365b35f9299f90982cd3a3e82a748460842a6c16fb87e37",
    "03535a2945d6843a1655bcf4cdd2d9ea94ed8182097189137be9a9980bea413672",
  ],
};

export const IMPORTED_WALLETS: WalletAddress[] = [
  { address: "125AKhtDPtjZbJSDSeVEZFUf4Dz9ptNGqU", type: "imported", balance: 0, utxos: [], label: "Imported 300.dat" },
  { address: "1MBiuQc6L7vq5sc7k1qtfpb2KF5XfpbfmR", type: "imported", balance: 0, utxos: [], label: "Imported 300.dat" },
  { address: "12fcWddtXyxrnxUn6UdmqCbSaVsaYKvHQp", type: "imported", balance: 0, utxos: [], label: "Imported 304.dat" },
  { address: "1CYtH4TeoAHZUZqCHBBkrLtwRh5Kquj82i", type: "imported", balance: 0, utxos: [], label: "Imported 303.dat" },
];

export const ACTIVE_ADDRESS = "113aNq2MZDE2HFKsUe7uXLNrfnF5iSHQug";
export const ACTIVE_ADDRESS_TX_COUNT = 200;

export function satToBTC(sats: number): string {
  return (sats / 100000000).toFixed(8);
}

export function satToDisplay(sats: number): string {
  const btc = sats / 100000000;
  if (btc >= 1) return btc.toFixed(4) + " BTC";
  if (btc >= 0.001) return (btc * 1000).toFixed(2) + " mBTC";
  if (btc >= 0.000001) return (btc * 1000000).toFixed(0) + " uBTC";
  return sats + " sat";
}

export const PRIMARY_UNSPENT_BALANCE = PRIMARY_UTXOS.filter(u => u.status === "unspent").reduce((s, u) => s + u.value, 0);
export const PRIMARY_BTC_BALANCE = satToBTC(PRIMARY_UNSPENT_BALANCE);
export const PRIMARY_UNSPENT_COUNT = PRIMARY_UTXOS.filter(u => u.status === "unspent").length;