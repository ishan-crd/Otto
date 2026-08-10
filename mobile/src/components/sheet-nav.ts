/** Helpers for opening the native formSheet routes (app/sheet/*) with params. */
import type { Row } from "../data";

/** Params for the receipt sheet — a ledger row flattened to route params. */
export function receiptParams(row: Row) {
  return { label: row.label, amount: row.amount, dir: row.dir, tx: row.tx, time: row.time };
}
