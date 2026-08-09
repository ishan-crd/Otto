import algosdk from "algosdk";
import { config, microToUsdc } from "../src/config";

/**
 * Pre-flight check for the real Algorand rail. Catches the three things that
 * make `npm run dry-run` fail, BEFORE you waste time on it:
 *   - account not funded with test ALGO (can't pay tx fees)
 *   - account not opted in to the USDC ASA (can't hold/send USDC)
 *   - no test USDC balance
 *
 *   npm run check-wallet
 */
async function main() {
  if (config.RAIL !== "algorand")
    console.log("ℹ RAIL is not 'algorand' yet — this checks the real wallet regardless.\n");
  if (!config.PAYER_MNEMONIC) {
    console.error("✗ PAYER_MNEMONIC is empty. Run `npm run gen-wallet` and fill .env.\n");
    process.exit(1);
  }

  const algod = new algosdk.Algodv2(config.ALGOD_TOKEN, config.ALGOD_SERVER, config.ALGOD_PORT);
  const payer = algosdk.mnemonicToSecretKey(config.PAYER_MNEMONIC.trim());
  const address = payer.addr.toString();
  console.log(`\n=== Wallet check — ${address} ===\n`);

  const info = (await algod.accountInformation(payer.addr).do()) as any;
  const algoBalance = Number(info.amount ?? 0) / 1e6;
  const assets: any[] = info.assets ?? info["assets"] ?? [];
  const usdc = assets.find(
    (a) => Number(a.assetId ?? a["asset-id"]) === config.USDC_ASSET_ID,
  );
  const usdcOptedIn = Boolean(usdc);
  const usdcBalance = usdc ? microToUsdc(Number(usdc.amount ?? 0)) : 0;

  const ok = (b: boolean) => (b ? "✅" : "❌");
  console.log(`${ok(algoBalance > 0.1)} test ALGO for fees : ${algoBalance} ALGO`);
  console.log(`${ok(usdcOptedIn)} opted in to USDC (${config.USDC_ASSET_ID}) : ${usdcOptedIn}`);
  console.log(`${ok(usdcBalance > 0)} test USDC balance : ${usdcBalance} USDC`);

  const ready = algoBalance > 0.1 && usdcOptedIn && usdcBalance > 0;
  console.log(`\n${ready ? "✅ READY — run `npm run dry-run`" : "❌ NOT READY — fix the ❌ items above (see SETUP.md)"}\n`);
  if (!algoBalance) console.log("  → fund ALGO: https://bank.testnet.algorand.network/");
  if (!usdcOptedIn || !usdcBalance) console.log("  → get USDC (auto opt-in): https://faucet.circle.com/ (Algorand TestNet)");
  console.log();
  process.exit(ready ? 0 : 1);
}

main().catch((err) => {
  console.error("\n✗ Check failed (is the address valid / node reachable?):\n", err, "\n");
  process.exit(1);
});
