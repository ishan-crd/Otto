import { EventEmitter } from "node:events";
import { config } from "../config";

/**
 * Otto's in-memory wallet. Balance = top-ups + earnings - spends.
 * (On the real rail the on-chain balance is authoritative; this mirror is what
 * the dashboard shows so earnings and spending animate live in one place.)
 */
class Wallet extends EventEmitter {
  private toppedUpMicro = config.sessionBudgetMicro; // seed float for the session
  private earnedMicro = 0;
  private spentMicro = 0;

  /** Rehydrate totals from the database at boot (no event). */
  restore(t: { toppedUpMicro: number; earnedMicro: number; spentMicro: number }) {
    this.toppedUpMicro = t.toppedUpMicro;
    this.earnedMicro = t.earnedMicro;
    this.spentMicro = t.spentMicro;
  }

  topUp(micro: number) {
    this.toppedUpMicro += micro;
    this.emit("change", this.snapshot());
  }

  credit(micro: number) {
    // Otto got paid by another agent
    this.earnedMicro += micro;
    this.emit("change", this.snapshot());
  }

  debit(micro: number) {
    // Otto paid a service
    this.spentMicro += micro;
    this.emit("change", this.snapshot());
  }

  balanceMicro() {
    return this.toppedUpMicro + this.earnedMicro - this.spentMicro;
  }

  snapshot() {
    return {
      balanceMicro: this.balanceMicro(),
      toppedUpMicro: this.toppedUpMicro,
      earnedMicro: this.earnedMicro,
      spentMicro: this.spentMicro,
    };
  }
}

export const wallet = new Wallet();
