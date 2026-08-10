import fs from "node:fs";
import path from "node:path";
import algosdk from "algosdk";
import { config } from "../config";

/**
 * Otto's own Algorand TestNet account, auto-provisioned so `pnpm dev:web` is
 * the only command needed. Resolution order:
 *   1. PAYER_MNEMONIC in web/.env (explicit — always wins)
 *   2. web/.otto-wallet.json (persisted from a previous boot)
 *   3. freshly generated + persisted (first boot)
 *
 * TestNet only. The file is gitignored; a leaked testnet key risks nothing but
 * faucet money, but don't reuse this pattern for mainnet.
 */
export interface OttoWallet {
  address: string;
  mnemonic: string;
}

const WALLET_FILE = path.resolve(process.cwd(), ".otto-wallet.json");

let cached: OttoWallet | null = null;

export function loadOttoWallet(): OttoWallet {
  if (cached) return cached;

  if (config.PAYER_MNEMONIC) {
    const acct = algosdk.mnemonicToSecretKey(config.PAYER_MNEMONIC.trim());
    cached = { address: acct.addr.toString(), mnemonic: config.PAYER_MNEMONIC.trim() };
    return cached;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8")) as OttoWallet;
    if (raw.mnemonic && raw.address) {
      // Re-derive to guard against a hand-edited file drifting.
      const acct = algosdk.mnemonicToSecretKey(raw.mnemonic);
      cached = { address: acct.addr.toString(), mnemonic: raw.mnemonic };
      return cached;
    }
  } catch {
    /* no file yet — generate below */
  }

  const acct = algosdk.generateAccount();
  cached = {
    address: acct.addr.toString(),
    mnemonic: algosdk.secretKeyToMnemonic(acct.sk),
  };
  try {
    fs.writeFileSync(WALLET_FILE, `${JSON.stringify(cached, null, 2)}\n`);
  } catch {
    // Read-only / ephemeral filesystem (containers, Render). The account still
    // works for this process; set PAYER_MNEMONIC in the environment to pin a
    // funded account across deploys.
    console.warn("[otto] could not persist .otto-wallet.json — set PAYER_MNEMONIC in production");
  }
  return cached;
}
