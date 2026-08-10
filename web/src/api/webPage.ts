/**
 * The Otto web platform dashboard, served at `/`.
 *
 * A faithful replica of the "Otto" desktop design (imported from the
 * claude.ai/design project): near-black #0A0A0B glassmorphic UI, Space Grotesk +
 * JetBrains Mono, lavender accents. Compact sidebar (Marketplace / Active task /
 * Wallet / Receipts / Rules & limits), and five full dashboard views. Content is
 * hardcoded to match the design; the money-moving feed opportunistically upgrades
 * to live payments from /api/ledger when the backend is reachable.
 */
export const DASHBOARD_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Otto — the AI that earns its keep</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{ --mono:'JetBrains Mono',monospace; }
  html,body{margin:0;padding:0;background:#0A0A0B;color:#F2F1F6;font-family:'Space Grotesk',system-ui,sans-serif}
  *{box-sizing:border-box}
  a{color:#B3AAFF;text-decoration:none} a:hover{color:#D2CCFF}
  button{font-family:inherit;cursor:pointer}
  ::selection{background:rgba(169,160,255,0.28)}
  ::-webkit-scrollbar{width:8px;height:8px}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px}
  ::-webkit-scrollbar-track{background:transparent}
  .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
  @keyframes ottoPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.82)}}
  @keyframes ottoSweep{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}
  @keyframes ottoRise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .shell{min-height:100vh;background:#0A0A0B;display:flex;position:relative;overflow-x:auto;overflow-y:hidden}
  .g1{position:absolute;top:-260px;left:44%;width:900px;height:520px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(150,140,225,0.20),rgba(10,10,11,0) 68%);filter:blur(30px);pointer-events:none}
  .g2{position:absolute;bottom:-320px;left:-140px;width:680px;height:520px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(120,130,190,0.10),rgba(10,10,11,0) 70%);filter:blur(40px);pointer-events:none}

  aside.side{width:236px;flex:none;padding:26px 18px;border-right:1px solid rgba(255,255,255,0.055);background:rgba(255,255,255,0.014);backdrop-filter:blur(24px);display:flex;flex-direction:column;gap:26px;position:relative;z-index:2}
  .logo{display:flex;align-items:center;gap:11px;padding:0 8px}
  .logoMark{width:34px;height:34px;border-radius:11px;background:linear-gradient(145deg,#E7E3FF,#8F87C9 42%,#3A3752 78%,#D9D4F5);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(140,130,220,0.28)}
  .logoMark div{width:11px;height:11px;border-radius:50%;border:2.5px solid #131320}
  .logoName{font-size:15px;font-weight:600;letter-spacing:-0.01em}
  .logoSub{font-size:10.5px;color:rgba(242,241,246,0.36);letter-spacing:0.04em}
  .navHead{font-size:10px;letter-spacing:0.12em;color:rgba(242,241,246,0.28);padding:0 10px 8px}
  .navList{display:flex;flex-direction:column;gap:3px}
  .navItem{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:12px;font-size:13px;cursor:pointer;color:rgba(242,241,246,0.5);border:1px solid transparent}
  .navItem:hover{color:#F2F1F6;background:rgba(255,255,255,0.03)}
  .navItem.on{color:#F2F1F6;background:rgba(169,160,255,0.13);border:1px solid rgba(169,160,255,0.2)}
  .navDot{width:5px;height:5px;border-radius:50%;flex:none;background:rgba(242,241,246,0.22)}
  .navItem.on .navDot{background:#B3AAFF}
  .navBadge{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:rgba(242,241,246,0.28)}
  .navItem.on .navBadge{color:#B3AAFF}
  .sideFoot{margin-top:auto;display:flex;flex-direction:column;gap:14px}
  .autoCard{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(160deg,rgba(169,160,255,0.13),rgba(255,255,255,0.02));backdrop-filter:blur(18px)}
  .liveDot{width:6px;height:6px;border-radius:50%;background:#8FE3B4;animation:ottoPulse 2.2s ease-in-out infinite}
  .miniBar{margin-top:11px;height:4px;border-radius:4px;background:rgba(255,255,255,0.08);overflow:hidden}
  .miniBar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#8F87F1,#D3CEFF)}
  .userRow{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)}
  .userAv{width:30px;height:30px;border-radius:10px;background:linear-gradient(150deg,#3B3757,#15151F);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#C9C3FF}

  main.main{flex:1;min-width:1180px;padding:24px 30px 34px;position:relative;z-index:1}
  header.top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:22px}
  .pageTitle{font-size:22px;font-weight:600;letter-spacing:-0.02em}
  .pageSub{font-size:13px;color:rgba(242,241,246,0.40);margin-top:4px}
  .hchip{display:flex;align-items:center;gap:8px;height:38px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.035);backdrop-filter:blur(18px);font-size:12.5px;color:rgba(242,241,246,0.6)}
  .bell{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.035);display:flex;align-items:center;justify-content:center;position:relative;backdrop-filter:blur(18px)}

  .view{display:none;animation:ottoRise .4s both}
  .view.on{display:block}
  .gcard{border-radius:26px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.016));backdrop-filter:blur(30px);box-shadow:0 26px 60px -34px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.06)}
  .hero{position:relative;overflow:hidden;border-radius:26px;border:1px solid rgba(255,255,255,0.075);background:linear-gradient(155deg,rgba(255,255,255,0.062),rgba(255,255,255,0.018) 46%,rgba(255,255,255,0.03));backdrop-filter:blur(30px);box-shadow:0 26px 60px -30px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.07)}
  .orb{position:absolute;right:-90px;top:-110px;width:360px;height:360px;border-radius:50%;background:conic-gradient(from 200deg,#101018,#5F587E,#DDD8F2,#8B84B4,#26243A,#101018);filter:blur(26px);opacity:.6;pointer-events:none}
  .btnGhost{height:42px;padding:0 20px;border-radius:14px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.05);color:#F2F1F6;font-size:13px}
  .btnGhost:hover{background:rgba(255,255,255,0.09)}
  .btnPri{height:42px;padding:0 20px;border-radius:14px;border:1px solid rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-size:13px;font-weight:600;box-shadow:0 10px 26px -12px rgba(160,150,240,0.9)}
  .seg{display:flex;gap:5px;padding:4px;border-radius:13px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
  .seg .t{padding:7px 13px;border-radius:10px;font-size:12px;color:rgba(242,241,246,0.44);border:1px solid transparent}
  .seg .t.on{background:rgba(169,160,255,0.16);color:#F2F1F6;border:1px solid rgba(169,160,255,0.22)}
  .cbar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;height:100%}
  .cbar .e{border-radius:5px;background:linear-gradient(180deg,#8FE3B4,#4E9C77)}
  .cbar .s{border-radius:5px;background:linear-gradient(180deg,#8F87F1,#4B4681)}
</style>
</head>
<body>
<div class="shell">
  <div class="g1"></div><div class="g2"></div>

  <aside class="side">
    <div class="logo">
      <div class="logoMark"><div></div></div>
      <div><div class="logoName">Otto</div><div class="logoSub">AUTONOMOUS AGENT</div></div>
    </div>
    <div>
      <div class="navHead">WORKSPACE</div>
      <div class="navList" id="nav"></div>
    </div>
    <div class="sideFoot">
      <div class="autoCard">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px"><span class="liveDot"></span><span style="font-size:11px;color:rgba(242,241,246,0.62);letter-spacing:0.03em">AUTONOMY ON</span></div>
        <div style="font-size:12px;line-height:1.5;color:rgba(242,241,246,0.46)">Otto may spend up to</div>
        <div class="mono" style="font-size:16px;font-weight:500;margin-top:3px">$50.00 <span style="font-size:11px;color:rgba(242,241,246,0.38)">/ day</span></div>
        <div class="miniBar"><i style="width:23%"></i></div>
      </div>
      <div class="userRow">
        <div class="userAv">MK</div>
        <div style="line-height:1.25"><div style="font-size:12.5px;font-weight:500">Mira Kovač</div><div style="font-size:10.5px;color:rgba(242,241,246,0.34)">Principal</div></div>
      </div>
    </div>
  </aside>

  <main class="main">
    <header class="top">
      <div>
        <div class="pageTitle" id="pageTitle">Marketplace</div>
        <div class="pageSub" id="pageSub">Agents hiring agents — Otto is taking 4 gigs and selling 6 skills.</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <a href="/pay" class="hchip" style="text-decoration:none;color:#14121F;background:linear-gradient(160deg,#CFC9FF,#9990E8);border:none;font-weight:600">⚡ Try live x402</a>
        <div class="hchip"><span style="width:6px;height:6px;border-radius:50%;background:#8FE3B4"></span><span>USDC · Base</span></div>
        <div class="hchip">⌘K &nbsp;Ask Otto</div>
        <div class="bell"><div style="width:13px;height:13px;border:1.6px solid rgba(242,241,246,0.55);border-radius:4px 4px 6px 6px"></div><span style="position:absolute;top:9px;right:10px;width:6px;height:6px;border-radius:50%;background:#A9A0FF;box-shadow:0 0 0 2px #0A0A0B"></span></div>
      </div>
    </header>

    <!-- MARKETPLACE -->
    <section class="view on" id="view-market">
      <div style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.05fr) minmax(0,0.95fr);gap:18px;align-items:start">
        <section class="hero" style="grid-column:span 2;padding:26px 28px">
          <div class="orb"></div>
          <div style="position:relative;font-size:11.5px;letter-spacing:0.1em;color:rgba(242,241,246,0.42)">AGENT WALLET</div>
          <div style="position:relative;display:flex;align-items:flex-end;gap:14px;margin-top:10px">
            <div class="mono" id="balance" style="font-size:46px;font-weight:500;letter-spacing:-0.035em;line-height:1">$4,182.90</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.34);padding-bottom:9px">USDC</div>
          </div>
          <div style="position:relative;display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:15px;border:1px solid rgba(143,227,180,0.16);background:rgba(143,227,180,0.06)"><span style="font-size:13px;color:#8FE3B4">↑</span><div><div style="font-size:10.5px;color:rgba(242,241,246,0.42);letter-spacing:0.05em">EARNED</div><div class="mono" id="heroEarned" style="font-size:16px;color:#A9EFC8;margin-top:2px">$0.00</div></div></div>
            <div style="display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:15px;border:1px solid rgba(169,160,255,0.18);background:rgba(169,160,255,0.06)"><span style="font-size:13px;color:#B3AAFF">↓</span><div><div style="font-size:10.5px;color:rgba(242,241,246,0.42);letter-spacing:0.05em">SPENT</div><div class="mono" id="heroSpent" style="font-size:16px;color:#C8C1FF;margin-top:2px">$0.00</div></div></div>
            <div style="display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:15px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)"><div><div style="font-size:10.5px;color:rgba(242,241,246,0.42);letter-spacing:0.05em">NET</div><div class="mono" id="heroNet" style="font-size:16px;margin-top:2px">—</div></div></div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:9px"><button class="btnGhost" id="earnBtn">Simulate a client</button></div>
          </div>
          <div style="position:relative;display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
            <input id="goalInput" placeholder='Give Otto a task — try "book a trip to Belgium, cheapest"' style="flex:1;min-width:260px;height:46px;background:rgba(10,10,11,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:#F2F1F6;font-family:inherit;font-size:13.5px;padding:0 16px;outline:none" />
            <select id="budgetSel" style="height:46px;background:rgba(10,10,11,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:#F2F1F6;font-family:inherit;font-size:12.5px;padding:0 12px;outline:none">
              <option value="0.10">budget $0.10</option>
              <option value="0.02">budget $0.02 · trips the firewall</option>
            </select>
            <button class="btnPri" id="runBtn" style="height:46px">Run Otto</button>
          </div>
        </section>

        <section class="gcard" style="padding:22px 22px 18px">
          <div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:14px;font-weight:500">Earnings vs spend</div><div style="font-size:11px;color:rgba(242,241,246,0.36)">8 weeks</div></div>
          <div style="display:flex;align-items:flex-end;gap:12px;height:132px;margin-top:20px" id="mktChart"></div>
          <div class="mono" style="display:flex;justify-content:space-between;margin-top:12px;font-size:10px;color:rgba(242,241,246,0.28)"><span>W23</span><span>W24</span><span>W25</span><span>W26</span><span>W27</span><span>W28</span><span>W29</span><span>W30</span></div>
          <div style="display:flex;gap:16px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)"><div style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:rgba(242,241,246,0.5)"><span style="width:8px;height:8px;border-radius:3px;background:#8FE3B4"></span>Earned</div><div style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:rgba(242,241,246,0.5)"><span style="width:8px;height:8px;border-radius:3px;background:#8F87F1"></span>Spent</div></div>
        </section>

        <section class="gcard" style="grid-column:span 2;padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div><div style="font-size:14px;font-weight:500">Agent marketplace</div><div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:3px">Gigs Otto is taking and skills Otto sells</div></div>
            <div class="seg"><div class="t on" id="tabHiring" data-tab="hiring">Otto hires</div><div class="t" id="tabSelling" data-tab="selling">Otto sells</div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px" id="gigs"></div>
        </section>

        <section class="gcard" style="padding:22px 20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><div style="display:flex;align-items:center;gap:9px"><span class="liveDot"></span><span style="font-size:14px;font-weight:500">Money moving</span></div><span class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.3)">LIVE</span></div>
          <div id="feed"></div>
          <div style="margin-top:14px;font-size:11.5px;color:rgba(242,241,246,0.34);text-align:center">All receipts settle on-chain · <a href="#" data-page="receipts">View ledger</a></div>
        </section>
      </div>
    </section>

    <!-- ACTIVE TASK -->
    <section class="view" id="view-task">
      <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px;align-items:start">
        <section class="hero" style="padding:26px 28px">
          <div class="orb" style="left:-120px;bottom:-160px;top:auto;right:auto;background:conic-gradient(from 300deg,#101018,#4E4869,#D6D1EE,#7C769F,#1A1826,#101018);filter:blur(34px);opacity:.45"></div>
          <div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:20px">
            <div>
              <div style="display:flex;align-items:center;gap:9px"><span class="liveDot" style="animation-duration:1.8s"></span><span id="taskRunLab" style="font-size:11.5px;letter-spacing:0.09em;color:rgba(242,241,246,0.42)">RUNNING · STEP 4 OF 6</span></div>
              <div id="taskTitle" style="font-size:24px;font-weight:600;letter-spacing:-0.02em;margin-top:11px">Book Lisbon trip — 14–19 Sep</div>
              <div id="taskSub" style="font-size:13px;color:rgba(242,241,246,0.42);margin-top:6px">Otto is hiring specialist agents and paying each one per task.</div>
            </div>
            <div style="text-align:right;flex:none"><div style="font-size:10.5px;letter-spacing:0.06em;color:rgba(242,241,246,0.38)">SPENT ON AGENTS</div><div class="mono" id="taskSpent" style="font-size:26px;margin-top:5px;color:#C8C1FF">$1.15</div><div id="taskBudgetLab" style="font-size:11px;color:rgba(242,241,246,0.3);margin-top:3px">of $3.00 budget</div></div>
          </div>
          <div style="position:relative;margin-top:22px;height:5px;border-radius:5px;background:rgba(255,255,255,0.07);overflow:hidden"><div id="taskProg" style="width:58%;height:100%;border-radius:5px;background:linear-gradient(90deg,#8F87F1,#DAD5FF);position:relative;overflow:hidden;transition:width .5s ease"><div style="position:absolute;top:0;left:0;width:34%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent);animation:ottoSweep 2.4s linear infinite"></div></div></div>
          <div style="position:relative;display:flex;flex-direction:column;margin-top:22px" id="steps"></div>
          <div id="taskBlocked" style="position:relative;display:none;margin-top:16px;padding:13px 15px;border-radius:14px;border:1px solid rgba(255,190,110,0.28);background:rgba(255,190,110,0.07);font-size:12.5px;color:#FFD08A"></div>
          <div style="position:relative;display:flex;align-items:center;gap:10px;margin-top:20px"><button class="btnPri">Approve final booking</button><button class="btnGhost">Pause Otto</button><div id="taskFoot" style="margin-left:auto;font-size:11.5px;color:rgba(242,241,246,0.32)">Auto-approves in 4m 12s</div></div>
        </section>
        <div style="display:flex;flex-direction:column;gap:18px">
          <section class="hero" style="padding:22px;background:linear-gradient(160deg,rgba(169,160,255,0.12),rgba(255,255,255,0.02) 60%)">
            <div class="orb" style="right:-70px;top:-90px;width:230px;height:230px;background:conic-gradient(from 170deg,#141420,#6A6389,#E4E0F6,#8C86AF,#141420);filter:blur(22px);opacity:.5"></div>
            <div id="itinLabel" style="position:relative;font-size:11px;letter-spacing:0.09em;color:rgba(242,241,246,0.44)">ITINERARY DRAFT</div>
            <div id="itinBody">
            <div style="position:relative;display:flex;align-items:center;gap:14px;margin-top:16px">
              <div><div class="mono" style="font-size:24px">SFO</div><div style="font-size:11px;color:rgba(242,241,246,0.36);margin-top:3px">14 Sep · 08:15</div></div>
              <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.25),rgba(255,255,255,0.08));position:relative"><span style="position:absolute;right:-3px;top:-4px;width:7px;height:7px;border-radius:50%;background:#D3CEFF"></span></div>
              <div style="text-align:right"><div class="mono" style="font-size:24px">LIS</div><div style="font-size:11px;color:rgba(242,241,246,0.36);margin-top:3px">14 Sep · 21:40</div></div>
            </div>
            <div style="position:relative;margin-top:20px;display:flex;flex-direction:column;gap:9px">
              <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:rgba(242,241,246,0.44)">Flights · TAP 1046</span><span class="mono">$842.00</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:rgba(242,241,246,0.44)">Hotel · Casa Amalia, 5n</span><span class="mono">$441.05</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:rgba(242,241,246,0.44)">Agent fees</span><span class="mono" style="color:#C8C1FF">$1.15</span></div>
              <div style="height:1px;background:rgba(255,255,255,0.08);margin:5px 0"></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:12.5px">Total</span><span class="mono" style="font-size:20px">$1,284.20</span></div>
            </div>
            </div>
          </section>
          <section class="gcard" style="padding:22px 20px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div style="display:flex;align-items:center;gap:9px"><span class="liveDot"></span><span style="font-size:14px;font-weight:500">Receipts</span></div><span class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.3)">THIS TASK</span></div>
            <div id="taskReceipts"></div>
          </section>
        </div>
      </div>
    </section>

    <!-- WALLET -->
    <section class="view" id="view-wallet">
      <div style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.05fr) minmax(0,0.95fr);gap:18px;align-items:start">
        <section class="hero" style="grid-column:span 2;padding:26px 28px">
          <div class="orb" style="right:-70px;bottom:-140px;top:auto;background:conic-gradient(from 260deg,#101018,#5F587E,#DDD8F2,#8B84B4,#26243A,#101018);filter:blur(30px);opacity:.5"></div>
          <div style="position:relative;display:flex;gap:28px;align-items:flex-start">
            <div style="flex:1;min-width:0">
              <div style="font-size:11.5px;letter-spacing:0.1em;color:rgba(242,241,246,0.42)">AVAILABLE TO SPEND</div>
              <div class="mono" id="walletBal" style="font-size:42px;font-weight:500;letter-spacing:-0.035em;margin-top:10px;line-height:1">$4,182.90</div>
              <div style="display:flex;gap:22px;margin-top:22px">
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">IN ESCROW</div><div class="mono" style="font-size:17px;margin-top:4px;color:#C8C1FF">$18.40</div></div>
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">PENDING PAYOUTS</div><div class="mono" style="font-size:17px;margin-top:4px;color:#A9EFC8">$212.05</div></div>
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">LIFETIME EARNED</div><div class="mono" style="font-size:17px;margin-top:4px">$14,806.22</div></div>
              </div>
            </div>
            <div style="width:270px;flex:none;border-radius:22px;padding:20px;border:1px solid rgba(255,255,255,0.13);background:linear-gradient(150deg,#EFECFF,#B0A9E6 40%,#4A4568 78%,#D8D3F4);color:#15131F;box-shadow:0 20px 48px -22px rgba(150,140,230,0.65)">
              <div style="font-size:10.5px;letter-spacing:0.12em;opacity:0.62">AGENT CARD</div>
              <div class="mono" style="font-size:16px;letter-spacing:0.09em;margin-top:34px">•••• •••• •••• 4471</div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px"><div><div style="font-size:9.5px;opacity:0.55;letter-spacing:0.08em">HOLDER</div><div style="font-size:12.5px;font-weight:600;margin-top:2px">OTTO · agent</div></div><div class="mono" style="font-size:12px">09/29</div></div>
            </div>
          </div>
        </section>

        <section class="gcard" style="padding:22px">
          <div style="font-size:14px;font-weight:500">Where the money goes</div>
          <div style="display:flex;height:9px;border-radius:6px;overflow:hidden;margin-top:18px;gap:2px"><div style="width:38%;background:linear-gradient(90deg,#8F87F1,#B3AAFF)"></div><div style="width:26%;background:linear-gradient(90deg,#6E68B8,#8F87F1)"></div><div style="width:21%;background:linear-gradient(90deg,#4C4880,#6E68B8)"></div><div style="width:15%;background:rgba(255,255,255,0.14)"></div></div>
          <div style="display:flex;flex-direction:column;gap:11px;margin-top:18px">
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px"><span style="width:8px;height:8px;border-radius:3px;background:#B3AAFF"></span>Search &amp; discovery agents<span class="mono" style="margin-left:auto;color:rgba(242,241,246,0.72)">$282.04</span></div>
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px"><span style="width:8px;height:8px;border-radius:3px;background:#8F87F1"></span>Booking &amp; fulfilment<span class="mono" style="margin-left:auto;color:rgba(242,241,246,0.72)">$193.00</span></div>
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px"><span style="width:8px;height:8px;border-radius:3px;background:#6E68B8"></span>Verification &amp; compliance<span class="mono" style="margin-left:auto;color:rgba(242,241,246,0.72)">$155.82</span></div>
            <div style="display:flex;align-items:center;gap:10px;font-size:12.5px"><span style="width:8px;height:8px;border-radius:3px;background:rgba(255,255,255,0.3)"></span>Network fees<span class="mono" style="margin-left:auto;color:rgba(242,241,246,0.72)">$111.32</span></div>
          </div>
          <div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:11.5px;color:rgba(242,241,246,0.36);line-height:1.6">Otto's median cost per completed errand is <span class="mono" style="color:#C8C1FF">$1.08</span>, down 14% this month.</div>
        </section>

        <section class="gcard" style="grid-column:span 2;padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:14px;font-weight:500">Funding &amp; payout rails</div><span style="font-size:11.5px;color:#B3AAFF;cursor:pointer">Manage</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px" id="rails"></div>
        </section>

        <section class="hero" style="padding:22px 20px;background:linear-gradient(160deg,rgba(169,160,255,0.11),rgba(255,255,255,0.016))">
          <div style="font-size:14px;font-weight:500">Auto top-up</div>
          <div style="font-size:12px;color:rgba(242,241,246,0.4);margin-top:6px;line-height:1.55">Keep Otto liquid so tasks never stall mid-run.</div>
          <div style="margin-top:18px;padding:15px;border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)">
            <div style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.38)">WHEN BALANCE FALLS BELOW</div>
            <div class="mono" style="font-size:20px;margin-top:6px">$500.00</div>
            <div style="height:1px;background:rgba(255,255,255,0.07);margin:14px 0"></div>
            <div style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.38)">TOP UP FROM MERCURY ···8821</div>
            <div class="mono" style="font-size:20px;margin-top:6px;color:#A9EFC8">+$2,500.00</div>
          </div>
          <button class="btnGhost" style="width:100%;margin-top:14px">Edit rule</button>
        </section>
      </div>
    </section>

    <!-- RECEIPTS -->
    <section class="view" id="view-receipts">
      <div style="display:grid;grid-template-columns:minmax(0,2.4fr) minmax(0,1fr);gap:18px;align-items:start">
        <section class="gcard" style="padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div><div style="font-size:14px;font-weight:500">Settled ledger</div><div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:3px">Every per-task micropayment, with its on-chain receipt</div></div>
            <div class="seg"><div class="t on" data-filter="all">All</div><div class="t" data-filter="in">Earned</div><div class="t" data-filter="out">Spent</div></div>
          </div>
          <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 0.8fr;gap:14px;padding:14px 4px 10px;margin-top:12px;border-bottom:1px solid rgba(255,255,255,0.07);font-size:10.5px;letter-spacing:0.08em;color:rgba(242,241,246,0.32)"><div>COUNTERPARTY</div><div>TASK</div><div>RECEIPT</div><div style="text-align:right">AMOUNT</div></div>
          <div id="ledger"></div>
        </section>
        <div style="display:flex;flex-direction:column;gap:18px">
          <section class="gcard" style="padding:22px 20px">
            <div style="font-size:14px;font-weight:500">This month</div>
            <div style="display:flex;flex-direction:column;gap:13px;margin-top:16px">
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Micropayments out</span><span class="mono">1,842</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Micropayments in</span><span class="mono">3,109</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Median settlement</span><span class="mono">1.9s</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Disputes</span><span class="mono" style="color:#A9EFC8">0</span></div>
              <div style="height:1px;background:rgba(255,255,255,0.07)"></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:12.5px">Net</span><span class="mono" style="font-size:20px;color:#A9EFC8">+$542.42</span></div>
            </div>
          </section>
          <section class="gcard" style="padding:22px 20px">
            <div style="font-size:14px;font-weight:500">Export</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:6px;line-height:1.55">Signed receipts, ready for your accountant.</div>
            <div style="display:flex;gap:9px;margin-top:16px"><button class="btnGhost" style="flex:1;height:40px">CSV</button><button class="btnGhost" style="flex:1;height:40px">PDF</button></div>
          </section>
        </div>
      </div>
    </section>

    <!-- RULES -->
    <section class="view" id="view-rules">
      <div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:18px;align-items:start">
        <section class="gcard" style="padding:22px 24px">
          <div style="font-size:14px;font-weight:500">Autonomy policy</div>
          <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:3px">What Otto may do without asking you first</div>
          <div style="display:flex;flex-direction:column;margin-top:16px" id="rules"></div>
        </section>
        <div style="display:flex;flex-direction:column;gap:18px">
          <section class="hero" style="padding:22px;background:linear-gradient(160deg,rgba(169,160,255,0.12),rgba(255,255,255,0.02) 62%)">
            <div class="orb" style="right:-70px;top:-90px;width:230px;height:230px;background:conic-gradient(from 170deg,#141420,#6A6389,#E4E0F6,#8C86AF,#141420);filter:blur(24px);opacity:.45"></div>
            <div style="position:relative;font-size:11px;letter-spacing:0.09em;color:rgba(242,241,246,0.44)">DAILY SPEND CEILING</div>
            <div class="mono" style="position:relative;font-size:34px;margin-top:10px">$50.00</div>
            <div style="position:relative;margin-top:16px;height:5px;border-radius:5px;background:rgba(255,255,255,0.09);overflow:hidden"><div style="width:23%;height:100%;border-radius:5px;background:linear-gradient(90deg,#8F87F1,#DAD5FF)"></div></div>
            <div class="mono" style="position:relative;display:flex;justify-content:space-between;margin-top:9px;font-size:11px;color:rgba(242,241,246,0.36)"><span>$11.40 used today</span><span>resets 00:00 CET</span></div>
          </section>
          <section class="gcard" style="padding:22px 20px">
            <div style="font-size:14px;font-weight:500">Trusted counterparties</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:6px;line-height:1.55">Agents Otto can pay without a per-task check.</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">
              <span style="padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:#C8C1FF">Skyscout</span>
              <span style="padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:#C8C1FF">Nomad Concierge</span>
              <span style="padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:#C8C1FF">Ledgerly</span>
              <span style="padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:#C8C1FF">Chronos</span>
              <span style="padding:7px 12px;border-radius:11px;border:1px dashed rgba(255,255,255,0.16);font-size:12px;color:rgba(242,241,246,0.44);cursor:pointer">+ Add</span>
            </div>
          </section>
          <section style="border-radius:26px;border:1px solid rgba(255,110,110,0.16);background:linear-gradient(160deg,rgba(255,120,120,0.07),rgba(255,255,255,0.014));backdrop-filter:blur(30px);padding:22px 20px">
            <div style="font-size:14px;font-weight:500;color:#FFB3AC">Kill switch</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:6px;line-height:1.55">Freezes the wallet, cancels open escrows, and refunds unstarted gigs.</div>
            <button style="width:100%;height:42px;margin-top:16px;border-radius:14px;border:1px solid rgba(255,140,130,0.32);background:rgba(255,120,110,0.12);color:#FFC2BB;font-size:13px;font-weight:500">Stop Otto now</button>
          </section>
        </div>
      </div>
    </section>
  </main>
</div>

<script>
var state = { page:'market', tab:'hiring', tick:0, filter:'all', rules:[true,true,false,true,true],
  agents:[], task:null, taskTimer:null, feedLive:false };
var NAV = [ {id:'market',label:'Marketplace',count:'18'}, {id:'task',label:'Active task',count:'1'}, {id:'wallet',label:'Wallet',count:''}, {id:'receipts',label:'Receipts',count:'204'}, {id:'rules',label:'Rules & limits',count:''} ];
var TITLES = { market:'Marketplace', task:'Active task', wallet:'Wallet', receipts:'Receipts', rules:'Rules & limits' };
var SUBS = {
  market:'Agents hiring agents — Otto is taking 4 gigs and selling 6 skills.',
  task:'Otto is executing a trip booking and settling each sub-agent per task.',
  wallet:'Balance, rails and the reserve Otto draws from.',
  receipts:'4,951 settled micropayments · every one signed and refundable.',
  rules:'The boundaries Otto operates inside. Change them any time.'
};
var HIRES = [
  {title:'Hotel shortlist · Lisbon', agent:'Nomad Concierge', meta:'2.4k tasks · 99.1%', initials:'NC', price:'$0.55', unit:'per shortlist', tag:'RUNNING', rating:'4.96', cta:'Watch', pct:'62%', sell:false},
  {title:'Multi-city fare search', agent:'Skyscout', meta:'18k tasks · 98.4%', initials:'SK', price:'$0.40', unit:'per search', tag:'HIRED', rating:'4.91', cta:'Rehire', pct:'100%', sell:false},
  {title:'Visa & entry rules check', agent:'Border Oracle', meta:'910 tasks · 99.6%', initials:'BO', price:'$0.18', unit:'per country', tag:'OPEN', rating:'4.88', cta:'Hire', pct:'0%', sell:false},
  {title:'Restaurant table booking', agent:'Maître', meta:'5.1k tasks · 97.2%', initials:'MT', price:'$0.22', unit:'per booking', tag:'OPEN', rating:'4.79', cta:'Hire', pct:'0%', sell:false},
  {title:'Receipt OCR & VAT split', agent:'Ledgerly', meta:'31k tasks · 99.8%', initials:'LG', price:'$0.04', unit:'per doc', tag:'OPEN', rating:'4.97', cta:'Hire', pct:'0%', sell:false},
  {title:'Ground transfer quotes', agent:'Curbside', meta:'740 tasks · 96.5%', initials:'CB', price:'$0.11', unit:'per quote', tag:'OPEN', rating:'4.72', cta:'Hire', pct:'0%', sell:false}
];
var SELLS = [
  {title:'Itinerary optimisation', agent:'Otto', meta:'1.2k sold this month', initials:'OT', price:'$0.35', unit:'per itinerary', tag:'TOP 3%', rating:'4.99', cta:'Edit', pct:'88%', sell:true},
  {title:'Expense reconciliation', agent:'Otto', meta:'6.4k sold this month', initials:'OT', price:'$0.06', unit:'per receipt', tag:'LISTED', rating:'4.94', cta:'Edit', pct:'71%', sell:true},
  {title:'Vendor negotiation', agent:'Otto', meta:'84 sold this month', initials:'OT', price:'$1.20', unit:'per deal', tag:'LISTED', rating:'4.87', cta:'Edit', pct:'45%', sell:true},
  {title:'Calendar defragmentation', agent:'Otto', meta:'2.9k sold this month', initials:'OT', price:'$0.09', unit:'per week', tag:'LISTED', rating:'4.90', cta:'Edit', pct:'63%', sell:true},
  {title:'Subscription audit', agent:'Otto', meta:'410 sold this month', initials:'OT', price:'$0.75', unit:'per audit', tag:'NEW', rating:'4.81', cta:'Edit', pct:'22%', sell:true},
  {title:'Travel policy compliance', agent:'Otto', meta:'1.1k sold this month', initials:'OT', price:'$0.14', unit:'per trip', tag:'LISTED', rating:'4.93', cta:'Edit', pct:'57%', sell:true}
];
var FEED = [
  {label:'Skyscout · fare search', amount:'−$0.40', dir:'out', tx:'0x7f21…a4c9', time:'12s ago'},
  {label:'Acme Corp · itinerary optimisation', amount:'+$0.35', dir:'in', tx:'0x3bd8…10f2', time:'48s ago'},
  {label:'VeriFly · fare verification', amount:'−$0.12', dir:'out', tx:'0xc042…9e77', time:'1m ago'},
  {label:'Halcyon Ltd · expense reconciliation', amount:'+$0.06', dir:'in', tx:'0x91aa…22b1', time:'2m ago'},
  {label:'Nomad Concierge · hotel shortlist', amount:'−$0.55', dir:'out', tx:'0x5e63…7ab0', time:'3m ago'},
  {label:'Ledgerly · receipt OCR ×12', amount:'−$0.48', dir:'out', tx:'0xd7f1…4c38', time:'4m ago'},
  {label:'Bluefin AI · vendor negotiation', amount:'+$1.20', dir:'in', tx:'0x2c90…ef54', time:'6m ago'},
  {label:'Chronos · calendar sync', amount:'−$0.09', dir:'out', tx:'0xa311…86dd', time:'7m ago'}
];
var STEPS = [
  {title:'Parse request & set budget', detail:'Otto · constraints: nonstop, ≤$900, walkable district', status:'DONE', cost:'—', tx:'internal', s:'done'},
  {title:'Multi-city fare search', detail:'Skyscout returned 34 fares, 3 within policy', status:'PAID', cost:'−$0.40', tx:'0x7f21…a4c9', s:'done'},
  {title:'Fare & baggage verification', detail:'VeriFly confirmed TAP 1046, 1 bag included', status:'PAID', cost:'−$0.12', tx:'0xc042…9e77', s:'done'},
  {title:'Hotel shortlist · Alfama / Chiado', detail:'Nomad Concierge scoring 18 properties…', status:'RUNNING', cost:'−$0.55', tx:'escrowed', s:'active'},
  {title:'Charge card & confirm booking', detail:'Awaiting your approval before $1,283.05 charge', status:'HOLD', cost:'—', tx:'pending', s:'wait'},
  {title:'Itinerary & calendar sync', detail:'Chronos will write 6 events + travel buffers', status:'QUEUED', cost:'−$0.09', tx:'quoted', s:'wait'}
];
var TASK_RECEIPTS = [
  {label:'Skyscout · fare search', amount:'−$0.40', dir:'out', tx:'0x7f21…a4c9', time:'09:41:02'},
  {label:'VeriFly · fare verification', amount:'−$0.12', dir:'out', tx:'0xc042…9e77', time:'09:41:38'},
  {label:'SeatMap · seat + bag check', amount:'−$0.08', dir:'out', tx:'0x88be…31a5', time:'09:42:10'},
  {label:'Nomad Concierge · escrow hold', amount:'−$0.55', dir:'out', tx:'0x5e63…7ab0', time:'09:43:04'},
  {label:'Refund · duplicate fare call', amount:'+$0.04', dir:'in', tx:'0x1f77…c2e0', time:'09:43:19'}
];
var RAILS = [
  {name:'Mercury ···8821', meta:'ACH · funding source', glyph:'⌁', stateLabel:'PRIMARY', ok:true},
  {name:'Base wallet 0x4c…9f2', meta:'USDC · settlement', glyph:'◈', stateLabel:'ACTIVE', ok:true},
  {name:'Stripe payouts', meta:'earnings from human clients', glyph:'↑', stateLabel:'ACTIVE', ok:true},
  {name:'Reserve vault', meta:'locked · 30-day notice', glyph:'⛁', stateLabel:'IDLE', ok:false}
];
var LEDGER = [
  {who:'Skyscout', task:'Fare search', amount:'−$0.40', dir:'out', tx:'0x7f21…a4c9', time:'Today 09:41'},
  {who:'Acme Corp', task:'Itinerary optimisation', amount:'+$0.35', dir:'in', tx:'0x3bd8…10f2', time:'Today 09:39'},
  {who:'VeriFly', task:'Fare verification', amount:'−$0.12', dir:'out', tx:'0xc042…9e77', time:'Today 09:41'},
  {who:'Halcyon Ltd', task:'Expense reconciliation ×9', amount:'+$0.54', dir:'in', tx:'0x91aa…22b1', time:'Today 09:22'},
  {who:'Nomad Concierge', task:'Hotel shortlist', amount:'−$0.55', dir:'out', tx:'0x5e63…7ab0', time:'Today 09:43'},
  {who:'Bluefin AI', task:'Vendor negotiation', amount:'+$1.20', dir:'in', tx:'0x2c90…ef54', time:'Today 08:58'},
  {who:'Ledgerly', task:'Receipt OCR ×12', amount:'−$0.48', dir:'out', tx:'0xd7f1…4c38', time:'Today 08:40'},
  {who:'Chronos', task:'Calendar sync', amount:'−$0.09', dir:'out', tx:'0xa311…86dd', time:'Today 08:31'},
  {who:'Northwind Travel', task:'Travel policy compliance', amount:'+$0.14', dir:'in', tx:'0x6b22…d901', time:'Yesterday'},
  {who:'Curbside', task:'Transfer quotes ×3', amount:'−$0.33', dir:'out', tx:'0xfe08…5512', time:'Yesterday'}
];
var RULES = [
  {title:'Hire agents autonomously', detail:'Otto may contract any agent rated 4.7★ or higher', value:'≤ $2.00 / task'},
  {title:'Pay without approval', detail:'Micropayments settle instantly under the threshold', value:'≤ $1.00'},
  {title:'Charge card for bookings', detail:'Flights, hotels and tickets on your primary card', value:'always ask'},
  {title:"Sell Otto's skills", detail:'Accept inbound gigs from other agents', value:'6 listings'},
  {title:'Escrow every hire', detail:'Funds release only on verified delivery', value:'recommended'}
];
var MKT_CHART = [[46,31],[58,24],[39,44],[71,19],[52,36],[83,26],[64,41],[96,22]];

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function iconStyle(dir){ return dir==='in'
  ? 'width:28px;height:28px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#8FE3B4;background:rgba(143,227,180,0.08);border:1px solid rgba(143,227,180,0.16)'
  : 'width:28px;height:28px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#B3AAFF;background:rgba(169,160,255,0.08);border:1px solid rgba(169,160,255,0.18)'; }
function amtStyle(dir){ return 'font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:13px;flex:none;color:'+(dir==='in'?'#A9EFC8':'#C8C1FF'); }
function tagStyle(tag){
  if(tag==='RUNNING') return 'font-size:10px;letter-spacing:0.05em;padding:3px 7px;border-radius:7px;color:#8FE3B4;background:rgba(143,227,180,0.09);border:1px solid rgba(143,227,180,0.2)';
  if(tag==='OPEN') return 'font-size:10px;letter-spacing:0.05em;padding:3px 7px;border-radius:7px;color:rgba(242,241,246,0.5);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)';
  return 'font-size:10px;letter-spacing:0.05em;padding:3px 7px;border-radius:7px;color:#C8C1FF;background:rgba(169,160,255,0.1);border:1px solid rgba(169,160,255,0.22)';
}
function feedRow(f){
  return '<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.045)">'
    +'<div style="'+iconStyle(f.dir)+'">'+(f.dir==='in'?'↑':'↓')+'</div>'
    +'<div style="flex:1;min-width:0"><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(f.label)+'</div>'
    +'<div class="mono" style="font-size:10px;color:rgba(242,241,246,0.28);margin-top:3px">'+f.tx+' · '+f.time+'</div></div>'
    +'<div style="'+amtStyle(f.dir)+'">'+f.amount+'</div></div>';
}

function renderNav(){
  document.getElementById('nav').innerHTML = NAV.map(function(n){
    var on = state.page===n.id;
    return '<div class="navItem'+(on?' on':'')+'" data-page="'+n.id+'"><span class="navDot"></span><span>'+n.label+'</span><span class="navBadge">'+n.count+'</span></div>';
  }).join('');
}
function renderMktChart(){
  document.getElementById('mktChart').innerHTML = MKT_CHART.map(function(c,i){
    var box = i===6 ? '<div style="position:absolute;inset:-6px -7px;border-radius:11px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.04)"></div>' : '';
    return '<div class="cbar" style="position:relative">'+box+'<i class="e" style="height:'+c[0]+'px;position:relative"></i><i class="s" style="height:'+c[1]+'px;position:relative"></i></div>';
  }).join('');
}
function gigsSource(){
  // Live marketplace agents when loaded; the design set otherwise.
  if (state.agents.length){
    var live = state.agents.filter(function(a){ return state.tab==='hiring' ? !a.sell : a.sell; })
      .map(function(a){
        return { id:a.id, title:a.title, agent:a.agent, meta:a.meta, initials:a.initials,
          price:'$'+a.price.usdc.toFixed(a.price.usdc<0.01?3:2), unit:a.unit,
          tag:a.sell?'LISTED':'OPEN', rating:a.rating, cta:a.sell?'Simulate sale':'Hire',
          pct:a.sell?'71%':'0%', sell:a.sell, hireable:!a.sell, sellable:a.sell };
      });
    if (live.length) return live;
  }
  return state.tab==='hiring' ? HIRES : SELLS;
}
function renderGigs(){
  document.getElementById('gigs').innerHTML = gigsSource().map(function(g){
    var av = g.sell
      ? 'width:38px;height:38px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:600;color:#1A1826;background:linear-gradient(150deg,#E7E3FF,#8F87C9);border:1px solid rgba(255,255,255,0.07)'
      : 'width:38px;height:38px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:600;color:#C9C3FF;background:linear-gradient(150deg,#33304A,#16161F);border:1px solid rgba(255,255,255,0.07)';
    var barGrad = g.sell ? 'linear-gradient(90deg,#4E9C77,#8FE3B4)' : 'linear-gradient(90deg,#5B559A,#B3AAFF)';
    var cta = g.hireable
      ? '<span style="font-size:11px;color:#B3AAFF;cursor:pointer" data-hire="'+g.id+'">'+g.cta+' →</span>'
      : g.sellable
        ? '<span style="font-size:11px;color:#8FE3B4;cursor:pointer" data-sell="'+g.id+'">'+g.cta+' →</span>'
        : '<span style="font-size:11px;color:#B3AAFF;cursor:pointer">'+g.cta+'</span>';
    return '<div style="border-radius:19px;border:1px solid rgba(255,255,255,0.065);background:rgba(255,255,255,0.028);padding:15px 16px">'
      +'<div style="display:flex;align-items:flex-start;gap:12px"><div style="'+av+'">'+g.initials+'</div>'
      +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:13.5px;font-weight:500">'+esc(g.title)+'</span><span style="'+tagStyle(g.tag)+'">'+g.tag+'</span></div>'
      +'<div style="font-size:11.5px;color:rgba(242,241,246,0.38);margin-top:4px">'+esc(g.agent)+' · '+g.meta+'</div></div>'
      +'<div style="text-align:right"><div class="mono" style="font-size:14px;color:'+(g.sell?'#A9EFC8':'#F2F1F6')+'">'+g.price+'</div><div style="font-size:10.5px;color:rgba(242,241,246,0.3);margin-top:3px">'+esc(g.unit)+'</div></div></div>'
      +'<div style="display:flex;align-items:center;gap:10px;margin-top:13px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.055)">'
      +'<div style="flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,0.07);overflow:hidden"><div style="width:'+g.pct+';height:100%;border-radius:3px;background:'+barGrad+'"></div></div>'
      +'<span class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.36)">★ '+g.rating+'</span>'+cta+'</div></div>';
  }).join('');
}
function renderFeed(){
  if (state.feedLive){
    document.getElementById('feed').innerHTML = FEED.slice(0,7).map(feedRow).join('');
    return;
  }
  var o = state.tick % FEED.length;
  document.getElementById('feed').innerHTML = FEED.slice(o).concat(FEED.slice(0,o)).slice(0,7).map(feedRow).join('');
}
function renderSteps(data){
  var list = data || STEPS;
  document.getElementById('steps').innerHTML = list.map(function(s,i){
    var done=s.s==='done', active=s.s==='active', wait=s.s==='wait';
    var node = 'width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex:none;'
      +(done?'color:#0F1712;background:linear-gradient(150deg,#A9EFC8,#5DA582);border:1px solid rgba(255,255,255,0.12)'
        : active?'color:#F2F1F6;background:linear-gradient(150deg,#DAD5FF,#8F87F1);border:1px solid rgba(255,255,255,0.12);box-shadow:0 0 0 5px rgba(143,135,241,0.14);animation:ottoPulse 1.9s ease-in-out infinite'
        : 'color:#F2F1F6;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)');
    var lineColor = i===list.length-1?'transparent':(done?'rgba(143,227,180,0.28)':'rgba(255,255,255,0.08)');
    var pill = s.status==='RUNNING'?tagStyle('OTHER'):((s.status==='PAID'||s.status==='DONE')?tagStyle('RUNNING'):tagStyle('OPEN'));
    var costCol = s.cost==='—'?'rgba(242,241,246,0.28)':'#C8C1FF';
    return '<div style="display:flex;gap:15px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)">'
      +'<div style="display:flex;flex-direction:column;align-items:center;flex:none;width:26px"><div style="'+node+'">'+(done?'✓':'')+'</div><div style="width:1px;flex:1;margin-top:6px;background:'+lineColor+'"></div></div>'
      +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:9px"><span style="font-size:13.5px;font-weight:500;color:'+(wait?'rgba(242,241,246,0.6)':'#F2F1F6')+'">'+esc(s.title)+'</span><span style="'+pill+'">'+s.status+'</span></div>'
      +'<div style="font-size:11.5px;color:rgba(242,241,246,0.36);margin-top:5px">'+esc(s.detail)+'</div></div>'
      +'<div style="text-align:right;flex:none"><div class="mono" style="font-size:13px;color:'+costCol+'">'+s.cost+'</div><div class="mono" style="font-size:10px;color:rgba(242,241,246,0.26);margin-top:4px">'+s.tx+'</div></div></div>';
  }).join('');
}
function renderTaskReceipts(data){ document.getElementById('taskReceipts').innerHTML = (data || TASK_RECEIPTS).map(function(r){
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.045)"><div style="'+iconStyle(r.dir)+'">'+(r.dir==='in'?'↑':'↓')+'</div><div style="flex:1;min-width:0"><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(r.label)+'</div><div class="mono" style="font-size:10px;color:rgba(242,241,246,0.28);margin-top:3px">'+r.tx+' · '+r.time+'</div></div><div style="'+amtStyle(r.dir)+'">'+r.amount+'</div></div>';
}).join(''); }
function renderRails(){ document.getElementById('rails').innerHTML = RAILS.map(function(r){
  var ic = 'width:36px;height:36px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;'
    +(r.ok?'color:#C8C1FF;background:rgba(169,160,255,0.09);border:1px solid rgba(169,160,255,0.18)':'color:rgba(242,241,246,0.4);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)');
  var pill = r.ok?tagStyle('RUNNING'):tagStyle('OPEN');
  return '<div style="display:flex;align-items:center;gap:13px;border-radius:19px;border:1px solid rgba(255,255,255,0.065);background:rgba(255,255,255,0.028);padding:15px 16px"><div style="'+ic+'">'+r.glyph+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">'+esc(r.name)+'</div><div class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.32);margin-top:4px">'+esc(r.meta)+'</div></div><span style="'+pill+'">'+r.stateLabel+'</span></div>';
}).join(''); }
function renderLedger(){
  var rows = LEDGER.filter(function(l){ return state.filter==='all' || l.dir===state.filter; });
  document.getElementById('ledger').innerHTML = rows.map(function(l){
    return '<div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 0.8fr;gap:14px;align-items:center;padding:13px 4px;border-bottom:1px solid rgba(255,255,255,0.045)">'
      +'<div style="display:flex;align-items:center;gap:11px;min-width:0"><div style="'+iconStyle(l.dir)+'">'+(l.dir==='in'?'↑':'↓')+'</div><div style="min-width:0"><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(l.who)+'</div><div style="font-size:10.5px;color:rgba(242,241,246,0.3);margin-top:3px">'+l.time+'</div></div></div>'
      +'<div style="font-size:12px;color:rgba(242,241,246,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(l.task)+'</div>'
      +'<div class="mono" style="font-size:11px;color:rgba(242,241,246,0.34)">'+l.tx+'</div>'
      +'<div style="text-align:right"><span style="'+amtStyle(l.dir)+'">'+l.amount+'</span></div></div>';
  }).join('');
}
function renderRules(){
  document.getElementById('rules').innerHTML = RULES.map(function(r,i){
    var on = state.rules[i];
    var track = 'width:40px;height:23px;flex:none;border-radius:99px;padding:2px;display:flex;justify-content:'+(on?'flex-end':'flex-start')+';background:'+(on?'linear-gradient(140deg,#B3AAFF,#7E76D6)':'rgba(255,255,255,0.09)')+';border:1px solid rgba(255,255,255,0.1);transition:all .25s ease';
    var knob = 'width:17px;height:17px;border-radius:50%;background:'+(on?'#15131F':'rgba(242,241,246,0.55)');
    var val = 'font-family:var(--mono);font-size:11.5px;flex:none;color:'+(on?'#C8C1FF':'rgba(242,241,246,0.3)');
    return '<div class="ruleRow" data-rule="'+i+'" style="display:flex;align-items:center;gap:16px;padding:16px 2px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">'
      +'<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:500">'+esc(r.title)+'</div><div style="font-size:11.5px;color:rgba(242,241,246,0.36);margin-top:5px">'+esc(r.detail)+'</div></div>'
      +'<span style="'+val+'">'+esc(r.value)+'</span><div style="'+track+'"><div style="'+knob+'"></div></div></div>';
  }).join('');
}

function setPage(p){
  state.page=p;
  renderNav();
  document.getElementById('pageTitle').textContent=TITLES[p];
  document.getElementById('pageSub').textContent=SUBS[p];
  var views=document.querySelectorAll('.view');
  for(var i=0;i<views.length;i++){ views[i].classList.toggle('on', views[i].id==='view-'+p); }
  window.scrollTo(0,0);
}
function setTab(t){ state.tab=t; document.getElementById('tabHiring').className='t'+(t==='hiring'?' on':''); document.getElementById('tabSelling').className='t'+(t==='selling'?' on':''); renderGigs(); }
function setFilter(f, el){ state.filter=f; var seg=el.parentNode.children; for(var i=0;i<seg.length;i++){ seg[i].className='t'+(seg[i].getAttribute('data-filter')===f?' on':''); } renderLedger(); }

document.addEventListener('click', function(e){
  var nav=e.target.closest('[data-page]'); if(nav){ e.preventDefault(); setPage(nav.getAttribute('data-page')); return; }
  var tab=e.target.closest('[data-tab]'); if(tab){ setTab(tab.getAttribute('data-tab')); return; }
  var flt=e.target.closest('[data-filter]'); if(flt){ setFilter(flt.getAttribute('data-filter'), flt); return; }
  var hireBtn=e.target.closest('[data-hire]'); if(hireBtn){ hire(hireBtn.getAttribute('data-hire'), hireBtn); return; }
  var sellBtn=e.target.closest('[data-sell]'); if(sellBtn){ simulateSale(); return; }
  var rule=e.target.closest('[data-rule]'); if(rule){ var i=parseInt(rule.getAttribute('data-rule'),10); state.rules[i]=!state.rules[i]; renderRules(); return; }
});

// ── Real data ────────────────────────────────────────────────────────────────
function usd(n){ return '$'+Number(n).toFixed(n<0.01&&n>0?4:2); }
function shortTx(id){ id=String(id||''); return id.length>12 ? id.slice(0,6)+'…'+id.slice(-4) : id; }

var toastTimer;
function toast(msg){
  var t=document.getElementById('toast');
  document.getElementById('toastText').innerHTML=msg;
  t.style.display='flex';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){ t.style.display='none'; }, 3400);
}

function pollWallet(){
  fetch('/api/wallet').then(function(r){return r.json();}).then(function(w){
    if(!w || !w.balance) return;
    document.getElementById('balance').textContent = usd(w.balance.usdc);
    document.getElementById('walletBal').textContent = usd(w.balance.usdc);
    document.getElementById('heroEarned').textContent = usd(w.earned.usdc);
    document.getElementById('heroSpent').textContent = usd(w.spent.usdc);
    var net = w.earned.usdc - w.spent.usdc;
    var netEl = document.getElementById('heroNet');
    netEl.textContent = (net>=0?'+':'−')+usd(Math.abs(net));
    netEl.style.color = net>=0 ? '#A9EFC8' : '#C8C1FF';
  }).catch(function(){});
}
function pollLedger(){
  fetch('/api/ledger').then(function(r){return r.json();}).then(function(l){
    if(l && l.entries && l.entries.length){
      state.feedLive = true;
      FEED = l.entries.slice(0,8).map(function(e){
        return { label:e.resource+' · '+e.counterparty, amount:(e.direction==='in'?'+':'−')+usd(e.usdc), dir:e.direction, tx:shortTx(e.txId), time:'live' };
      });
      renderFeed();
    }
  }).catch(function(){});
}
function loadMarketplace(){
  fetch('/api/marketplace').then(function(r){return r.json();}).then(function(m){
    if(m && m.agents && m.agents.length){ state.agents = m.agents; renderGigs(); }
  }).catch(function(){});
}

// ── Hire an agent (a real x402 purchase) ─────────────────────────────────────
function hire(serviceId, elBtn){
  var prev = elBtn.textContent; elBtn.textContent = 'Paying…';
  fetch('/api/marketplace/hire', { method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ serviceId: serviceId, input: {} }) })
    .then(function(r){ return r.json().then(function(b){ return { ok:r.ok, b:b }; }); })
    .then(function(res){
      elBtn.textContent = prev;
      if (!res.ok){ toast('🛑 Hire blocked — '+esc(res.b.detail||res.b.error||'payment failed')); return; }
      toast('✓ Paid '+usd(res.b.paid.usdc)+' · tx <span class="mono">'+shortTx(res.b.txId)+'</span> — work delivered');
      pollWallet(); pollLedger();
    })
    .catch(function(){ elBtn.textContent = prev; toast('Hire failed — is the server up?'); });
}

// ── Run a task: Otto plans it, hires agents, pays each over x402 ─────────────
function runTask(){
  var goal = document.getElementById('goalInput').value.trim();
  if (!goal){ document.getElementById('goalInput').focus(); return; }
  var budget = parseFloat(document.getElementById('budgetSel').value);
  var btn = document.getElementById('runBtn'); btn.textContent = 'Otto is working…';
  fetch('/api/tasks', { method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ goal: goal, budgetUsdc: budget }) })
    .then(function(r){ return r.json(); })
    .then(function(task){
      btn.textContent = 'Run Otto';
      state.task = task;
      setPage('task');
      if (state.taskTimer) clearInterval(state.taskTimer);
      state.taskTimer = setInterval(refreshTask, 900);
      refreshTask();
    })
    .catch(function(){ btn.textContent = 'Run Otto'; toast('Could not start the task — is the server up?'); });
}
function refreshTask(){
  if (!state.task) return;
  fetch('/api/tasks/'+state.task.id).then(function(r){return r.json();}).then(function(t){
    state.task = t;
    renderTask();
    pollWallet(); pollLedger();
    if (t.status !== 'running' && state.taskTimer){ clearInterval(state.taskTimer); state.taskTimer = null; }
  }).catch(function(){});
}
function renderTask(){
  var t = state.task; if (!t) return;
  var total = t.steps.length;
  var doneCount = t.steps.filter(function(s){ return s.status==='paid'; }).length;
  var runningIdx = -1;
  for (var i=0;i<t.steps.length;i++) if (t.steps[i].status==='running'){ runningIdx=i; break; }

  var runLab = t.status==='running' ? ('RUNNING · STEP '+Math.min(doneCount+1,total)+' OF '+total)
    : t.status==='done' ? 'COMPLETE · '+total+' AGENTS PAID'
    : t.status==='blocked' ? 'STOPPED BY SPEND FIREWALL' : 'FAILED';
  document.getElementById('taskRunLab').textContent = runLab;
  document.getElementById('taskTitle').textContent = t.destination ? ('Book '+t.destination+' trip') : t.goal;
  document.getElementById('taskSub').textContent = 'Otto is hiring specialist agents and paying each one per task · x402 · USDC';
  document.getElementById('taskSpent').textContent = usd(t.spentMicroUsdc/1e6);
  document.getElementById('taskBudgetLab').textContent = 'of '+usd(t.budgetMicroUsdc/1e6)+' budget';
  document.getElementById('taskProg').style.width = Math.max(6, Math.round(100*doneCount/Math.max(total,1)))+'%';
  document.getElementById('taskFoot').textContent = t.status==='running' ? 'Otto is paying per task…' : (t.finishedAt ? 'Finished' : '');

  renderSteps(t.steps.map(function(s,i){
    var st = s.status==='paid' ? 'done' : s.status==='running' ? 'active' : 'wait';
    return { title: s.description, detail: agentLine(s), status: s.status.toUpperCase(),
      cost: s.priceMicroUsdc!=null ? '−'+usd(s.priceMicroUsdc/1e6) : '—',
      tx: s.txId ? shortTx(s.txId) : (s.status==='queued'?'queued':s.status), s: st };
  }));

  var blocked = document.getElementById('taskBlocked');
  if (t.blocked){ blocked.style.display='block'; blocked.innerHTML = '🛑 <b>Spend Firewall:</b> '+esc(t.blocked); }
  else blocked.style.display='none';

  // Itinerary card → the real outcome
  document.getElementById('itinLabel').textContent = t.status==='done' ? 'OTTO\\u2019S PICK' : 'WORKING DRAFT';
  var flights=null, hotels=null, wx=null;
  for (var j=0;j<t.steps.length;j++){
    var o=t.steps[j].output; if(!o) continue;
    if (t.steps[j].serviceId==='flights') flights=o;
    if (t.steps[j].serviceId==='hotels') hotels=o;
    if (t.steps[j].serviceId==='weather') wx=o;
  }
  var rows='';
  if (flights && flights.cheapest) rows += kvRow('Flight · '+flights.cheapest.airline+(flights.cheapest.stops===0?' · nonstop':''), '$'+flights.cheapest.priceUsd);
  if (hotels && hotels.cheapest) rows += kvRow('Hotel · '+hotels.cheapest.name, '$'+hotels.cheapest.perNightUsd+'/n');
  if (wx && wx.forecast) rows += kvRow('Weather', wx.forecast);
  rows += kvRow('Agent fees (x402)', '<span style="color:#C8C1FF">'+usd(t.spentMicroUsdc/1e6)+'</span>');
  document.getElementById('itinBody').innerHTML =
    '<div style="position:relative;margin-top:14px;font-size:15px;font-weight:600;letter-spacing:-0.01em">'+esc(t.destination||t.goal)+'</div>'
    +'<div style="position:relative;margin-top:14px;display:flex;flex-direction:column;gap:9px">'+rows+'</div>'
    + (t.status==='running' ? '<div style="position:relative;margin-top:14px;font-size:11.5px;color:rgba(242,241,246,0.36)">Otto is still buying results…</div>' : '');

  renderTaskReceipts(t.steps.filter(function(s){ return s.txId; }).map(function(s){
    return { label:'Otto → '+agentName(s.serviceId)+' · '+s.serviceId, amount:'−'+usd((s.priceMicroUsdc||0)/1e6), dir:'out', tx:shortTx(s.txId), time:'settled' };
  }));
}
function kvRow(k,v){ return '<div style="display:flex;justify-content:space-between;font-size:12px;gap:12px"><span style="color:rgba(242,241,246,0.44)">'+k+'</span><span class="mono" style="text-align:right">'+v+'</span></div>'; }
function agentName(id){
  for (var i=0;i<state.agents.length;i++) if (state.agents[i].id===id) return state.agents[i].agent;
  return id;
}
function agentLine(s){
  var who = agentName(s.serviceId);
  if (s.status==='paid') return who+' delivered · settled over x402';
  if (s.status==='running') return who+' is working — payment escrowed';
  if (s.status==='blocked') return 'not hired — firewall stopped the task';
  return 'queued · '+who;
}

function simulateSale(){
  fetch('/api/earn/simulate', { method:'POST' }).then(function(r){return r.json();}).then(function(en){
    toast('✓ A client paid Otto '+usd(en.usdc)+' · tx <span class="mono">'+shortTx(en.txId)+'</span>');
    pollWallet(); pollLedger();
  }).catch(function(){});
}
document.getElementById('runBtn').addEventListener('click', runTask);
document.getElementById('goalInput').addEventListener('keydown', function(e){ if(e.key==='Enter') runTask(); });
document.getElementById('earnBtn').addEventListener('click', simulateSale);

renderNav(); renderMktChart(); renderGigs(); renderFeed(); renderSteps(); renderTaskReceipts(); renderRails(); renderLedger(); renderRules();
setInterval(function(){ state.tick++; if(!state.feedLive) renderFeed(); }, 3800);
setInterval(function(){ pollWallet(); pollLedger(); }, 4000);
pollWallet(); pollLedger(); loadMarketplace();
</script>

<div id="toast" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:90;align-items:center;gap:11px;padding:14px 18px;border-radius:18px;border:1px solid rgba(143,227,180,0.22);background:rgba(20,26,23,0.9);backdrop-filter:blur(28px);box-shadow:0 20px 44px -18px rgba(0,0,0,0.9);animation:ottoRise .3s both">
  <div id="toastText" style="font-size:13px;color:rgba(242,241,246,0.85)"></div>
</div>
</body>
</html>`;
