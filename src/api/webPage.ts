/**
 * A zero-build, single-file browser dashboard served at GET /app. It's here so
 * you can SEE Otto working in a browser today (wallet, live payment feed, run a
 * goal, simulate earnings) — and it doubles as a fallback demo UI. You'll build
 * the real polished frontend (and/or the Expo app) during the hackathon; this
 * just proves the whole stack end-to-end.
 */
export const DASHBOARD_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Otto — the AI that earns its keep</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
         background: #0b0d12; color: #e7ebf0; }
  header { padding: 20px 24px; border-bottom: 1px solid #1c2230; display: flex; align-items: baseline; gap: 12px; }
  header h1 { font-size: 20px; margin: 0; }
  header .tag { color: #7d8797; font-size: 13px; }
  header .rail { margin-left: auto; font-size: 12px; padding: 4px 10px; border-radius: 999px; background:#121826; color:#8fb4ff; }
  .wrap { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; padding: 20px 24px; max-width: 1100px; }
  .card { background: #10141c; border: 1px solid #1c2230; border-radius: 14px; padding: 18px; }
  .card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #7d8797; margin: 0 0 14px; }
  .balance { font-size: 40px; font-weight: 700; letter-spacing: -.02em; }
  .stats { display: flex; gap: 22px; margin-top: 12px; }
  .stats .s span { display:block; font-size: 12px; color:#7d8797; }
  .stats .earn { color: #4ade80; } .stats .spend { color: #f87171; }
  label { font-size: 12px; color:#9aa4b2; display:block; margin: 10px 0 6px; }
  input[type=text], input[type=number] { width: 100%; background:#0b0e14; border:1px solid #232b3a; color:#e7ebf0;
         border-radius: 9px; padding: 10px 12px; font-size: 14px; }
  .row { display:flex; gap: 10px; }
  button { cursor: pointer; border: none; border-radius: 9px; padding: 10px 14px; font-size: 14px; font-weight: 600; }
  .primary { background:#3b6cf6; color:#fff; } .ghost { background:#1a2130; color:#cdd6e4; }
  #feed { grid-column: 1 / -1; }
  .feed-list { display:flex; flex-direction: column; gap: 8px; max-height: 340px; overflow:auto; }
  .pay { display:flex; align-items:center; gap: 12px; padding:10px 12px; background:#0d1119; border:1px solid #1a2130; border-radius:10px; }
  .pay .amt { font-weight:700; font-variant-numeric: tabular-nums; }
  .pay.in .amt { color:#4ade80; } .pay.out .amt { color:#f87171; }
  .pay .who { color:#c3ccd9; font-size: 14px; } .pay .res { color:#7d8797; font-size:12px; }
  .pay a { margin-left:auto; color:#6f9bff; font-size:12px; text-decoration:none; }
  #report { grid-column:1/-1; white-space: pre-wrap; font-family: ui-monospace, monospace; font-size:12.5px;
            background:#0b0e14; border:1px solid #1a2130; border-radius:10px; padding:14px; color:#b9c3d2; display:none; }
  .blocked { color:#fbbf24; font-weight:600; }
</style>
</head>
<body>
<header>
  <h1>🤖 Otto</h1><span class="tag">the AI that earns its keep</span>
  <span class="rail" id="rail">rail: …</span>
</header>

<div class="wrap">
  <div class="card">
    <h2>Wallet</h2>
    <div class="balance" id="balance">$0.0000</div>
    <div class="stats">
      <div class="s earn"><span>earned</span><b id="earned">$0</b></div>
      <div class="s spend"><span>spent</span><b id="spent">$0</b></div>
      <div class="s"><span>topped up</span><b id="topped">$0</b></div>
    </div>
  </div>

  <div class="card">
    <h2>Give Otto a goal</h2>
    <label>Goal</label>
    <input type="text" id="goal" value="plan a weekend trip to Goa" />
    <label>Budget (USDC) — set low to trigger the firewall</label>
    <input type="number" id="budget" value="0.10" step="0.005" min="0" />
    <div class="row" style="margin-top:14px">
      <button class="primary" id="run">Run Otto</button>
      <button class="ghost" id="earn">Simulate an agent paying Otto</button>
    </div>
  </div>

  <div class="card" id="feed">
    <h2>Live payments</h2>
    <div class="feed-list" id="list"></div>
  </div>

  <div id="report"></div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const usd = (n) => "$" + Number(n).toFixed(4);

async function refreshWallet() {
  const w = await fetch("/api/wallet").then(r => r.json());
  $("rail").textContent = "rail: " + w.rail;
  $("balance").textContent = usd(w.balance.usdc);
  $("earned").textContent = usd(w.earned.usdc);
  $("spent").textContent = usd(w.spent.usdc);
  $("topped").textContent = usd(w.toppedUp.usdc);
}

function addPayment(p) {
  const el = document.createElement("div");
  el.className = "pay " + p.direction;
  const sign = p.direction === "in" ? "+" : "−";
  const link = p.explorerUrl ? '<a href="'+p.explorerUrl+'" target="_blank">'+p.txId.slice(0,14)+'…</a>' : "";
  el.innerHTML =
    '<span class="amt">'+sign+usd(p.usdc)+'</span>' +
    '<span><span class="who">'+ (p.direction==="in"?"earned":"paid") +' '+p.counterparty+'</span>' +
    '<br><span class="res">'+p.resource+'</span></span>' + link;
  $("list").prepend(el);
}

async function loadLedger() {
  const l = await fetch("/api/ledger").then(r => r.json());
  $("list").innerHTML = "";
  l.entries.forEach(addPayment);
}

$("run").onclick = async () => {
  $("run").textContent = "Otto is working…"; $("run").disabled = true;
  const res = await fetch("/api/run", { method:"POST", headers:{"content-type":"application/json"},
    body: JSON.stringify({ goal: $("goal").value, budgetUsdc: Number($("budget").value) }) }).then(r=>r.json());
  const r = $("report"); r.style.display = "block"; r.textContent = res.report;
  if (res.blocked) { const b=document.createElement("div"); b.className="blocked"; b.textContent="🛑 "+res.blocked; r.prepend(b); }
  $("run").textContent = "Run Otto"; $("run").disabled = false;
  refreshWallet();
};

$("earn").onclick = async () => {
  await fetch("/api/earn/simulate", { method:"POST" });
  refreshWallet();
};

// live stream
const es = new EventSource("/api/stream");
es.addEventListener("payment", (e) => { addPayment(JSON.parse(e.data)); });
es.addEventListener("wallet", () => refreshWallet());

refreshWallet(); loadLedger();
</script>
</body>
</html>`;
