import algosdk from "algosdk";
import { config } from "../src/config";

/**
 * Opt Otto's receiver account into the USDC ASA so it can RECEIVE payments.
 * A brand-new Algorand account must opt in to an asset before it can hold it.
 *
 *   1. put Otto's account mnemonic in web/.env as PAYER_MNEMONIC
 *   2. fund that address with a little test ALGO (bank.testnet.algorand.network)
 *   3. pnpm opt-in
 *   4. set RECEIVER_ADDRESS to that address (or leave blank — it defaults to it)
 *
 * The USER paying at /pay uses their OWN Pera wallet; this only prepares the
 * receiver. Idempotent: exits cleanly if already opted in.
 */
async function main() {
  if (!config.PAYER_MNEMONIC) {
    console.error("\n✗ Set PAYER_MNEMONIC in web/.env first (run `pnpm gen-wallet`).\n");
    process.exit(1);
  }
  const algod = new algosdk.Algodv2(config.ALGOD_TOKEN, config.ALGOD_SERVER, config.ALGOD_PORT);
  const acct = algosdk.mnemonicToSecretKey(config.PAYER_MNEMONIC.trim());
  const address = acct.addr.toString();
  console.log(`\n=== Opt ${address} into USDC (asset ${config.USDC_ASSET_ID}) ===\n`);

  const info = (await algod.accountInformation(acct.addr).do()) as {
    assets?: { assetId?: number | bigint; "asset-id"?: number | bigint }[];
  };
  const already = (info.assets ?? []).some(
    (a) => Number(a.assetId ?? a["asset-id"]) === config.USDC_ASSET_ID,
  );
  if (already) {
    console.log("✅ Already opted in. Nothing to do.\n");
    return;
  }

  const sp = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: acct.addr,
    receiver: acct.addr,
    amount: 0,
    assetIndex: config.USDC_ASSET_ID,
    suggestedParams: sp,
  });
  const signed = txn.signTxn(acct.sk);
  const sent = (await algod.sendRawTransaction(signed).do()) as { txid?: string; txId?: string };
  const txId = sent.txid ?? sent.txId ?? "";
  await algosdk.waitForConfirmation(algod, txId, 4);
  console.log(`✅ Opted in. tx ${txId}`);
  console.log(
    "→ set RECEIVER_ADDRESS to this address (or leave blank) and restart. /pay is live.\n",
  );
}

main().catch((err) => {
  console.error("\n✗ Opt-in failed:", err);
  console.error("Check the address is funded with test ALGO and USDC_ASSET_ID is correct.\n");
  process.exit(1);
});
