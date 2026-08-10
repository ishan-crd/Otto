import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { SettlementReceipt } from "../rails/types";

export type Direction = "in" | "out"; // in = Otto earned, out = Otto spent

export interface LedgerEntry {
  id: string;
  direction: Direction;
  amountMicroUsdc: number;
  counterparty: string;
  resource: string;
  txId: string;
  explorerUrl: string;
  mock: boolean;
  ts: string;
  taskId?: string;
}

/**
 * Append-only record of every micropayment, in and out. It is the source of
 * truth the live dashboard renders and streams from — the "watch the money
 * move" surface that wins the demo.
 */
class Ledger extends EventEmitter {
  private entries: LedgerEntry[] = [];

  record(
    direction: Direction,
    receipt: SettlementReceipt,
    resource: string,
    taskId?: string,
  ): LedgerEntry {
    const entry: LedgerEntry = {
      id: randomUUID(),
      direction,
      amountMicroUsdc: receipt.amountMicroUsdc,
      counterparty: direction === "out" ? receipt.to : receipt.from,
      resource,
      txId: receipt.txId,
      explorerUrl: receipt.explorerUrl,
      mock: receipt.mock,
      ts: receipt.settledAt,
      taskId,
    };
    this.entries.push(entry);
    this.emit("entry", entry);
    return entry;
  }

  /** Rehydrate from the database at boot (oldest-first, no events). */
  restore(rows: LedgerEntry[]) {
    this.entries = [...rows];
  }

  all(): LedgerEntry[] {
    return [...this.entries].reverse(); // newest first
  }

  byTask(taskId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.taskId === taskId);
  }

  totals() {
    let earned = 0;
    let spent = 0;
    for (const e of this.entries) {
      if (e.direction === "in") earned += e.amountMicroUsdc;
      else spent += e.amountMicroUsdc;
    }
    return { earnedMicro: earned, spentMicro: spent, count: this.entries.length };
  }
}

export const ledger = new Ledger();
