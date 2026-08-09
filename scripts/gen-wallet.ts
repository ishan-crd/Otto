import algosdk from "algosdk";

/**
 * Generates a fresh Algorand account for TestNet. Run this to get the
 * PAYER_MNEMONIC (and optionally a second one for RECEIVER) without installing
 * a wallet app. Paste the mnemonic into .env, then fund + opt-in (see output).
 *
 *   npm run gen-wallet
 *
 * ⚠️ TestNet only. Never put a real mainnet mnemonic in .env or a repo.
 */
const account = algosdk.generateAccount();
const address = account.addr.toString();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log("\n=== New Algorand TestNet account ===\n");
console.log("Address :", address);
console.log("\nMnemonic (25 words) — paste into .env as PAYER_MNEMONIC:\n");
console.log(mnemonic);
console.log("\nNext steps:");
console.log("  1. .env:  RAIL=algorand  and  PAYER_MNEMONIC=<the 25 words above>");
console.log("  2. Fund with test ALGO:  https://bank.testnet.algorand.network/  (paste the address)");
console.log("  3. Opt in + get test USDC: https://faucet.circle.com/  (choose Algorand TestNet)");
console.log("     (opt-in happens automatically when Circle's faucet sends you USDC)");
console.log("  4. Verify readiness:  npm run check-wallet");
console.log("  5. Prove it works:    npm run dry-run\n");
