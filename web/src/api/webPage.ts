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

  aside.side{width:236px;flex:none;padding:26px 18px;border-right:1px solid rgba(255,255,255,0.055);background:rgba(255,255,255,0.014);backdrop-filter:blur(24px);display:flex;flex-direction:column;gap:26px;position:relative;z-index:2;transition:width .22s ease,padding .22s ease}
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

  /* Wallet connect (header) */
  .wbtn{height:38px;padding:0 16px;border-radius:12px;border:1px solid rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 10px 24px -14px rgba(160,150,240,0.9)}
  .wbtn:hover{filter:brightness(1.05)}
  .wchip{height:38px;padding:0 8px 0 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.045);backdrop-filter:blur(18px);display:flex;align-items:center;gap:10px;cursor:pointer}
  .wchip:hover{background:rgba(255,255,255,0.075)}
  .wchip .wbal{font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums}
  .wchip .waddr{font-family:var(--mono);font-size:11px;color:rgba(242,241,246,0.5);padding:4px 8px;border-radius:8px;background:rgba(255,255,255,0.05)}
  .wchip .wcar{color:rgba(242,241,246,0.4);font-size:9px}
  .wpop{position:absolute;top:46px;right:0;width:320px;z-index:60;border-radius:20px;border:1px solid rgba(255,255,255,0.09);background:rgba(18,18,22,0.94);backdrop-filter:blur(30px);box-shadow:0 30px 70px -30px rgba(0,0,0,0.95),inset 0 1px 0 rgba(255,255,255,0.06);padding:18px;animation:ottoRise .22s both}
  .wpop .wa{font-family:var(--mono);font-size:12px;line-height:1.5;word-break:break-all;color:rgba(242,241,246,0.82);cursor:pointer;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
  .wpop .wa:hover{border-color:rgba(169,160,255,0.4);color:#F2F1F6}
  .wtile{flex:1;padding:11px 13px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.028)}
  .wtile .k{font-size:9.5px;letter-spacing:0.07em;color:rgba(242,241,246,0.38)}
  .wtile .v{font-family:var(--mono);font-size:16px;margin-top:4px;font-variant-numeric:tabular-nums}
  .wact{width:100%;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.045);color:#F2F1F6;font-size:12.5px;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
  .wact:hover{background:rgba(255,255,255,0.08);color:#F2F1F6}
  .wact.pri{border-color:rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-weight:600}
  .wact.danger{border-color:rgba(255,140,130,0.3);background:rgba(255,120,110,0.1);color:#FFC2BB}
  .wstat{display:flex;align-items:center;gap:8px;font-size:11.5px;color:rgba(242,241,246,0.55)}
  .wstat .dot{width:7px;height:7px;border-radius:50%;flex:none}

  /* Budget chooser */
  .bLbl{font-size:11px;letter-spacing:0.08em;color:rgba(242,241,246,0.4)}
  .bchip{height:34px;padding:0 13px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(242,241,246,0.62);font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums}
  .bchip:hover{color:#F2F1F6;background:rgba(255,255,255,0.06)}
  .bchip.on{color:#F2F1F6;background:rgba(169,160,255,0.16);border-color:rgba(169,160,255,0.34)}
  .bcustom{display:flex;align-items:center;gap:4px;height:34px;padding:0 11px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,11,0.5);color:rgba(242,241,246,0.5);font-family:var(--mono);font-size:12.5px}
  .bcustom input{width:52px;background:transparent;border:none;outline:none;color:#F2F1F6;font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums}
  .bHint{font-size:11px;color:rgba(242,241,246,0.32)}

  /* Collapsible sidebar */
  .navIco{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;color:inherit}
  .navIco svg{width:17px;height:17px;display:block}
  .railToggle{position:absolute;top:24px;right:-13px;z-index:6;width:26px;height:26px;border-radius:50%;border:1px solid rgba(255,255,255,0.11);background:rgba(22,22,27,0.96);color:rgba(242,241,246,0.7);display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;box-shadow:0 6px 16px -6px rgba(0,0,0,0.85);transition:transform .18s ease,color .18s ease,border-color .18s ease}
  .railToggle:hover{color:#F2F1F6;border-color:rgba(169,160,255,0.45);transform:scale(1.08)}
  aside.side.mini{width:74px;padding:26px 12px;gap:20px}
  aside.side.mini .logo{justify-content:center;padding:0}
  aside.side.mini .logoText{display:none}
  aside.side.mini .navHead{display:none}
  aside.side.mini .navItem{justify-content:center;padding:11px 0;gap:0}
  aside.side.mini .navLabel,aside.side.mini .navBadge{display:none}
  aside.side.mini .autoCard{display:none}
  aside.side.mini .userRow{justify-content:center;padding:9px 0}
  aside.side.mini .userText{display:none}

  /* ── Agent Economy ─────────────────────────────────────────────────────── */
  @keyframes econFan{from{opacity:0;transform:translateY(10px) scale(.965)}to{opacity:1;transform:none}}
  @keyframes econRing{0%{transform:scale(.7);opacity:.55}80%,100%{transform:scale(2.4);opacity:0}}
  @keyframes econSkel{0%{background-position:-180px 0}100%{background-position:180px 0}}
  @keyframes econPop{0%{transform:scale(.9);opacity:0}55%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes econBar{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}
  @keyframes econGlow{0%,100%{box-shadow:0 0 0 0 rgba(143,135,241,0.0)}50%{box-shadow:0 0 0 5px rgba(143,135,241,0.10)}}

  .econIntro{min-height:64vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .econHero{width:100%;max-width:760px;text-align:center;animation:ottoRise .5s both}
  .econKicker{display:inline-flex;align-items:center;gap:8px;font-size:11px;letter-spacing:0.18em;color:rgba(242,241,246,0.5);padding:7px 14px;border-radius:99px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)}
  .econBig{font-size:clamp(30px,4.6vw,54px);line-height:1.05;font-weight:600;letter-spacing:-0.03em;margin:26px 0 0;background:linear-gradient(180deg,#FFFFFF,#C7C1F0 78%,#9B93D6);-webkit-background-clip:text;background-clip:text;color:transparent}
  .econInputWrap{display:flex;align-items:center;gap:10px;margin:34px auto 0;max-width:720px;padding:8px 8px 8px 22px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);backdrop-filter:blur(24px);box-shadow:0 30px 80px -40px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.05);transition:border-color .2s,box-shadow .2s}
  .econInputWrap:focus-within{border-color:rgba(169,160,255,0.5);box-shadow:0 30px 90px -34px rgba(120,110,220,0.6),inset 0 1px 0 rgba(255,255,255,0.08)}
  .econInput{flex:1;min-width:0;height:56px;background:transparent;border:none;outline:none;color:#F2F1F6;font-family:inherit;font-size:17px}
  .econInput::placeholder{color:rgba(242,241,246,0.34)}
  .econGo{height:56px;flex:none;padding:0 26px;border-radius:15px;border:1px solid rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-size:14.5px;font-weight:600;box-shadow:0 14px 30px -14px rgba(160,150,240,0.9)}
  .econGo:hover{filter:brightness(1.05)}
  .econBudgetRow{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:16px}
  .econBudgetLbl{font-size:11px;letter-spacing:0.14em;color:rgba(242,241,246,0.42)}
  .econBudgetField{display:flex;align-items:center;gap:4px;height:44px;padding:0 14px;border-radius:13px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(242,241,246,0.55);font-family:var(--mono);font-size:15px;transition:border-color .2s}
  .econBudgetField:focus-within{border-color:rgba(169,160,255,0.5)}
  .econBudgetField input{width:76px;background:transparent;border:none;outline:none;color:#F2F1F6;font-family:var(--mono);font-size:16px;font-variant-numeric:tabular-nums;-moz-appearance:textfield}
  .econBudgetField input::-webkit-outer-spin-button,.econBudgetField input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  .econBudgetUnit{font-size:11px;color:rgba(242,241,246,0.38)}
  .econBudgetHint{font-size:11.5px;color:rgba(242,241,246,0.34)}
  .econNodeBlock{background:rgba(255,120,110,0.14);border:1px solid rgba(255,140,130,0.32);color:#FFC2BB;font-weight:700}
  .econCard.blk{border-color:rgba(255,140,130,0.3)}
  .econBlock{margin-top:12px;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:13px;border:1px solid rgba(255,140,130,0.28);background:rgba(255,120,110,0.09);font-size:12.5px;color:#FFD0CA;animation:econPop .4s both}
  .econBlock b{color:#FFB3AC;font-weight:600}
  .econBlock.soft{border-color:rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(242,241,246,0.4)}
  .econDone.blocked{border-color:rgba(255,140,130,0.3);background:linear-gradient(160deg,rgba(255,120,110,0.08),rgba(255,255,255,0.014))}
  .econEx{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:20px}
  .econExLbl{font-size:11px;letter-spacing:0.1em;color:rgba(242,241,246,0.3)}
  .econChip{padding:8px 13px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.028);color:rgba(242,241,246,0.62);font-size:12px}
  .econChip:hover{color:#F2F1F6;background:rgba(169,160,255,0.12);border-color:rgba(169,160,255,0.28)}

  .econRun{animation:ottoRise .4s both}
  .econTop{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 24px;border-radius:22px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.014));backdrop-filter:blur(30px)}
  .econGoalText{font-size:22px;font-weight:600;letter-spacing:-0.02em;margin-top:8px;max-width:640px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .econCount{font-size:12px;color:rgba(242,241,246,0.4);margin-top:5px}
  .econBudgetBlk{flex:none;width:260px;text-align:right}
  .econMeterHead{display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:0.06em;color:rgba(242,241,246,0.42)}
  .econMeterHead .mono{color:#C8C1FF}
  .econMeter{margin-top:8px;height:6px;border-radius:6px;background:rgba(255,255,255,0.08);overflow:hidden}
  .econMeter i{display:block;height:100%;width:0%;border-radius:6px;background:linear-gradient(90deg,#8F87F1,#D3CEFF);transition:width .6s cubic-bezier(.2,.8,.2,1)}
  .econRestart{margin-top:13px;height:34px;padding:0 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(242,241,246,0.75);font-size:12px}
  .econRestart:hover{color:#F2F1F6;background:rgba(255,255,255,0.09)}

  .econOtto{display:flex;align-items:center;gap:16px;margin-top:16px;padding:16px 20px;border-radius:20px;border:1px solid rgba(169,160,255,0.2);background:linear-gradient(160deg,rgba(169,160,255,0.13),rgba(255,255,255,0.02))}
  .econOttoMark{position:relative;width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center}
  .econRings{position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(179,170,255,0.55);animation:econRing 2.4s ease-out infinite}
  .econOttoCore{width:34px;height:34px;border-radius:12px;background:linear-gradient(145deg,#E7E3FF,#8F87C9 44%,#3A3752 80%,#D9D4F5);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(140,130,220,0.4)}
  .econOttoCore div{width:11px;height:11px;border-radius:50%;border:2.5px solid #131320}
  .econOttoLab{font-size:10px;letter-spacing:0.12em;color:rgba(242,241,246,0.42);display:flex;align-items:center;gap:7px}
  .econOttoDot{width:6px;height:6px;border-radius:50%;background:#DAD5FF;box-shadow:0 0 10px rgba(179,170,255,0.9)}
  .econOttoStatus{font-size:17px;font-weight:500;margin-top:5px;letter-spacing:-0.01em;color:#F2F1F6}

  .econPipe{margin-top:18px;display:flex;flex-direction:column;gap:12px}
  .econCard{border-radius:20px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012));padding:16px 18px;animation:ottoRise .4s both}
  .econCard.on{border-color:rgba(169,160,255,0.28);animation:econGlow 2.2s ease-in-out infinite}
  .econCard.ok{border-color:rgba(143,227,180,0.24)}
  .econCardTop{display:flex;align-items:center;gap:13px}
  .econNode{width:26px;height:26px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-family:var(--mono)}
  .econNodeWait{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(242,241,246,0.6)}
  .econNodeRun{background:linear-gradient(150deg,#DAD5FF,#8F87F1);border:1px solid rgba(255,255,255,0.12);color:#15131F;box-shadow:0 0 0 5px rgba(143,135,241,0.14)}
  .econNodeOk{background:linear-gradient(150deg,#A9EFC8,#5DA582);border:1px solid rgba(255,255,255,0.12);color:#0F1712}
  .econRole{font-size:9.5px;letter-spacing:0.06em;padding:3px 8px;border-radius:7px;color:#C8C1FF;background:rgba(169,160,255,0.1);border:1px solid rgba(169,160,255,0.22)}
  .econTitle{font-size:16.5px;font-weight:600;letter-spacing:-0.01em}
  .econDetail{font-size:11.5px;color:rgba(242,241,246,0.4);margin-top:3px}
  .econTier{display:inline-block;font-size:8.5px;letter-spacing:0.04em;text-transform:uppercase;padding:1px 6px;border-radius:6px;margin-right:6px;vertical-align:middle;font-family:'Space Grotesk',sans-serif}
  .econTier.t1{color:#8FE3B4;background:rgba(143,227,180,0.1);border:1px solid rgba(143,227,180,0.24)}
  .econTier.t2{color:#C8C1FF;background:rgba(169,160,255,0.1);border:1px solid rgba(169,160,255,0.24)}
  .econTier.t3{color:#FFCE7A;background:rgba(255,206,122,0.1);border:1px solid rgba(255,206,122,0.26)}
  .econStage{margin-top:14px;padding-left:39px}

  .econSourcing{display:flex;align-items:center;gap:10px}
  .econDots{display:flex;gap:5px}
  .econDots i{width:6px;height:6px;border-radius:50%;background:#B3AAFF;animation:ottoPulse 1s ease-in-out infinite}
  .econDots i:nth-child(2){animation-delay:.16s}.econDots i:nth-child(3){animation-delay:.32s}
  .econSourceText{font-size:12px;color:rgba(242,241,246,0.55)}
  .econSkelRow{display:flex;gap:9px;margin-top:11px}
  .econSkel{flex:1;height:52px;border-radius:13px;border:1px solid rgba(255,255,255,0.05);background:linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03));background-size:360px 100%;animation:econSkel 1.1s linear infinite}

  .econCands{display:flex;gap:9px;flex-wrap:wrap}
  .econCand{flex:1;min-width:150px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);padding:12px 13px;animation:econFan .4s both;transition:opacity .35s,border-color .35s,background .35s}
  .econCand .cn{display:flex;align-items:center;gap:9px}
  .econCandAv{width:28px;height:28px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;color:#C9C3FF;background:linear-gradient(150deg,#33304A,#16161F);border:1px solid rgba(255,255,255,0.07)}
  .econCandName{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .econModelId{font-family:var(--mono);font-size:9.5px;color:rgba(242,241,246,0.34);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .econOrTag{display:inline-flex;align-items:center;gap:5px;font-size:10px;letter-spacing:0.04em;color:#8FE3B4;background:rgba(143,227,180,0.08);border:1px solid rgba(143,227,180,0.2);border-radius:7px;padding:3px 8px;margin-left:8px}
  .econCandMeta{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
  .econStar{font-size:11px;color:rgba(242,241,246,0.55);font-family:var(--mono)}
  .econPrice{font-size:12.5px;font-family:var(--mono);color:#F2F1F6}
  .econCand.pick{border-color:rgba(143,227,180,0.4);background:rgba(143,227,180,0.07)}
  .econCand.pick .econPrice{color:#A9EFC8}
  .econCand.dim{opacity:0.32}
  .econOver{margin-top:9px;font-size:9.5px;letter-spacing:0.04em;color:#FFB3AC;background:rgba(255,120,110,0.1);border:1px solid rgba(255,140,130,0.24);border-radius:6px;padding:2px 6px;display:inline-block}
  .econHired{font-size:9px;letter-spacing:0.06em;color:#0F1712;background:linear-gradient(150deg,#A9EFC8,#5DA582);border-radius:6px;padding:2px 7px;font-weight:700}

  .econSettle{margin-top:12px;display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.07);animation:econPop .45s both}
  .econSettle .sIco{width:26px;height:26px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#C8C1FF;background:rgba(169,160,255,0.12);border:1px solid rgba(169,160,255,0.24);font-size:13px}
  .econSettleText{font-size:12px;color:rgba(242,241,246,0.7)}
  .econSettleText b{color:#F2F1F6;font-weight:600}
  .econSettleTx{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:rgba(242,241,246,0.34)}
  .econDeliver{margin-top:12px}
  .econDeliverBar{height:5px;border-radius:5px;background:rgba(255,255,255,0.07);overflow:hidden;position:relative}
  .econDeliverBar i{position:absolute;top:0;left:0;height:100%;width:38%;border-radius:5px;background:linear-gradient(90deg,transparent,rgba(179,170,255,0.9),transparent);animation:econBar 1.3s linear infinite}
  .econDeliverText{font-size:11.5px;color:rgba(242,241,246,0.5);margin-top:8px}
  .econReview{margin-top:12px;display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;border:1px solid rgba(143,227,180,0.2);background:rgba(143,227,180,0.06);animation:econPop .45s both}
  .econStars{color:#A9EFC8;font-size:12px;letter-spacing:1px;flex:none}
  .econReviewText{font-size:12px;color:rgba(242,241,246,0.66)}
  .econReviewCost{margin-left:auto;font-family:var(--mono);font-size:12px;color:#A9EFC8}

  .econDone{margin-top:16px;border-radius:22px;border:1px solid rgba(143,227,180,0.24);background:linear-gradient(160deg,rgba(143,227,180,0.1),rgba(255,255,255,0.014));padding:22px 24px;animation:econPop .5s both}
  .econDoneHead{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600}
  .econDoneStats{display:flex;gap:26px;margin-top:16px;flex-wrap:wrap}
  .econDoneStat .k{font-size:10.5px;letter-spacing:0.06em;color:rgba(242,241,246,0.42)}
  .econDoneStat .v{font-family:var(--mono);font-size:22px;margin-top:5px}

  /* ── Treasury ──────────────────────────────────────────────────────────── */
  .treTile{flex:1;min-width:120px;padding:13px 15px;border-radius:15px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
  .treK{font-size:10px;letter-spacing:0.06em;color:rgba(242,241,246,0.42)}
  .treV{font-size:19px;margin-top:5px}
  .treBar{flex:1;border-radius:4px 4px 2px 2px;min-height:4px;background:linear-gradient(180deg,#8F87F1,#4B4681);transition:height .4s cubic-bezier(.2,.8,.2,1)}
  .treBar.last{background:linear-gradient(180deg,#A9EFC8,#5DA582)}
  .treSpoke{display:flex;flex-direction:column;align-items:center;gap:7px;flex:none}
  .treSpokeDot{width:40px;height:40px;border-radius:14px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);font-size:15px;transition:all .3s}
  .treSpoke.on .treSpokeDot{border-color:rgba(169,160,255,0.45);background:rgba(169,160,255,0.16);box-shadow:0 0 0 5px rgba(143,135,241,0.12)}
  .treSpokeLab{font-size:9.5px;letter-spacing:0.06em;color:rgba(242,241,246,0.4)}
  .treSpoke.on .treSpokeLab{color:#C8C1FF}
  .treArrow{color:rgba(242,241,246,0.26);font-size:14px;flex:none}
</style>
</head>
<body>
<div class="shell">
  <div class="g1"></div><div class="g2"></div>

  <aside class="side">
    <button class="railToggle" id="sideToggle" title="Collapse sidebar">‹</button>
    <div class="logo">
      <div class="logoMark"><div></div></div>
      <div class="logoText"><div class="logoName">Otto</div><div class="logoSub">AUTONOMOUS AGENT</div></div>
    </div>
    <div>
      <div class="navHead">WORKSPACE</div>
      <div class="navList" id="nav"></div>
    </div>
    <div class="sideFoot">
      <div class="autoCard">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px"><span class="liveDot"></span><span style="font-size:11px;color:rgba(242,241,246,0.62);letter-spacing:0.03em">AUTONOMY ON</span></div>
        <div style="font-size:12px;line-height:1.5;color:rgba(242,241,246,0.46)">Otto may spend up to</div>
        <div class="mono" style="font-size:16px;font-weight:500;margin-top:3px"><span id="ceilVal">$25.00</span> <span style="font-size:11px;color:rgba(242,241,246,0.38)">/ session</span></div>
        <div class="miniBar"><i id="ceilBar" style="width:0%"></i></div>
      </div>
      <div class="userRow">
        <div class="userAv">MK</div>
        <div class="userText" style="line-height:1.25"><div style="font-size:12.5px;font-weight:500">Mira Kovač</div><div style="font-size:10.5px;color:rgba(242,241,246,0.34)">Principal</div></div>
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
        <a href="/prompt" class="hchip" style="text-decoration:none;color:#14121F;background:linear-gradient(160deg,#CFC9FF,#9990E8);border:none;font-weight:600">💬 Buy a Prompt</a>
        <a href="/pay" class="hchip" style="text-decoration:none;color:rgba(242,241,246,0.72)">⚡ Live x402</a>
        <div class="hchip"><span style="width:6px;height:6px;border-radius:50%;background:#8FE3B4"></span><span id="netChip">USDC · Algorand</span></div>
        <div id="walletWrap" style="position:relative">
          <button id="walletBtn" class="wbtn">
            <span style="width:6px;height:6px;border-radius:50%;background:#14121F;opacity:0.55"></span>Connect wallet
          </button>
          <div id="walletChip" class="wchip" style="display:none">
            <span class="wstat"><span class="dot" id="wchipDot" style="background:#8FE3B4"></span></span>
            <span class="wbal" id="wchipBal">—</span>
            <span class="waddr" id="wchipAddr">—</span>
            <span class="wcar">▾</span>
          </div>
          <div id="walletPop" class="wpop" style="display:none"></div>
        </div>
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
          <div style="position:relative;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:13px;font-weight:600;letter-spacing:-0.01em">Make an agent complete something for you</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.4);margin-top:3px">Describe any goal. Otto plans it, hires specialist agents, and pays each one per task — never over your budget.</div>
            <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
              <input id="goalInput" placeholder='e.g. "book a trip to Belgium, cheapest" or "summarize this contract"' style="flex:1;min-width:280px;height:48px;background:rgba(10,10,11,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:#F2F1F6;font-family:inherit;font-size:13.5px;padding:0 16px;outline:none" />
              <button class="btnPri" id="runBtn" style="height:48px">Run Otto →</button>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:13px;flex-wrap:wrap">
              <span class="bLbl">BUDGET</span>
              <div id="budgetChips" style="display:flex;gap:6px">
                <button class="bchip" data-budget="0.50">$0.50</button>
                <button class="bchip on" data-budget="2">$2</button>
                <button class="bchip" data-budget="5">$5</button>
                <button class="bchip" data-budget="10">$10</button>
              </div>
              <div class="bcustom">$<input id="budgetInput" type="number" min="0.01" step="0.01" value="2.00" /></div>
              <span class="bHint" id="budgetHint">The spend firewall stops Otto before any task exceeds this.</span>
            </div>
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

    <!-- AGENT ECONOMY -->
    <section class="view" id="view-economy">
      <!-- STATE 1 — the prompt -->
      <div id="econIntro" class="econIntro">
        <div class="econHero">
          <div class="econKicker"><span class="liveDot"></span> AGENT ECONOMY</div>
          <h1 class="econBig">What task do you want me to complete?</h1>
          <div class="econInputWrap">
            <input id="econInput" class="econInput" autocomplete="off" placeholder="Describe anything — e.g. Develop a mobile app for Otto" />
            <button id="econGo" class="econGo">Decompose &amp; hire →</button>
          </div>
          <div class="econBudgetRow">
            <span class="econBudgetLbl">BUDGET</span>
            <div class="econBudgetField">$<input id="econBudgetInput" type="number" min="0.5" step="0.5" value="10.00" /><span class="econBudgetUnit">USDC</span></div>
            <span class="econBudgetHint">Otto stops if it runs out.</span>
          </div>
          <div class="econEx">
            <span class="econExLbl">Try</span>
            <button class="econChip" data-ex="Develop a mobile app for Otto">Develop a mobile app for Otto</button>
            <button class="econChip" data-ex="Launch a marketing campaign for our product">Launch a marketing campaign</button>
            <button class="econChip" data-ex="Write a research report on quantum computing">Write a research report</button>
          </div>
          <div id="econModelBadge" class="econOrTag" style="display:none;margin-top:20px"></div>
        </div>
      </div>

      <!-- STATE 2 — the live hiring economy -->
      <div id="econRun" class="econRun" style="display:none">
        <div class="econTop">
          <div style="min-width:0">
            <div class="econKicker">DECOMPOSED GOAL</div>
            <div class="econGoalText" id="econGoalText">—</div>
            <div class="econCount" id="econCount">—</div>
          </div>
          <div class="econBudgetBlk">
            <div class="econMeterHead"><span>SPENT</span><span class="mono"><span id="econSpent">$0.00</span> of <span id="econBudget">$0.00</span></span></div>
            <div class="econMeter"><i id="econMeterFill"></i></div>
            <button class="econRestart" id="econRestart">↺ New task</button>
          </div>
        </div>

        <div class="econOtto">
          <div class="econOttoMark"><span class="econRings"></span><span class="econRings" style="animation-delay:.9s"></span><div class="econOttoCore"><div></div></div></div>
          <div style="flex:1;min-width:0">
            <div class="econOttoLab"><span class="econOttoDot" id="econOttoDot"></span> OTTO · ORCHESTRATOR</div>
            <div class="econOttoStatus" id="econOttoStatus">Waiting for a goal…</div>
          </div>
        </div>

        <div id="econPipe" class="econPipe"></div>
        <div id="econDone" class="econDone" style="display:none"></div>
      </div>
    </section>

    <!-- TREASURY -->
    <section class="view" id="view-treasury">
      <div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:18px;align-items:start">
        <section class="hero" style="padding:26px 28px">
          <div class="orb" style="right:-80px;bottom:-140px;top:auto;background:conic-gradient(from 240deg,#101018,#5F587E,#DDD8F2,#8B84B4,#26243A,#101018);filter:blur(30px);opacity:.5"></div>
          <div style="position:relative;display:flex;align-items:center;gap:8px"><span class="liveDot" id="treLiveDot" style="background:rgba(242,241,246,0.4)"></span><span style="font-size:11.5px;letter-spacing:0.1em;color:rgba(242,241,246,0.42)">TREASURY · USDC <span id="treLiveLab"></span></span></div>
          <div style="position:relative;display:flex;align-items:flex-end;gap:14px;margin-top:10px">
            <div class="mono" id="treBal" style="font-size:52px;font-weight:500;letter-spacing:-0.04em;line-height:1">$5.00</div>
            <div class="mono" id="treGrown" style="font-size:16px;color:#A9EFC8;padding-bottom:9px">+$0.00</div>
          </div>
          <div id="treSub" style="position:relative;font-size:12.5px;color:rgba(242,241,246,0.44);margin-top:12px">Started at $5.00 · 0 business cycles · 0% margin</div>
          <div id="treNow" style="position:relative;margin-top:11px;font-size:12.5px;color:rgba(242,241,246,0.66);display:none"></div>

          <div style="position:relative;display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">
            <div class="treTile"><div class="treK">REVENUE</div><div class="mono treV" id="treRev" style="color:#A9EFC8">$0.00</div></div>
            <div class="treTile"><div class="treK">AGENT COST</div><div class="mono treV" id="treCost" style="color:#C8C1FF">$0.00</div></div>
            <div class="treTile"><div class="treK">NET PROFIT</div><div class="mono treV" id="treNet" style="color:#A9EFC8">$0.00</div></div>
            <div class="treTile"><div class="treK">CAPACITY</div><div class="mono treV" id="treCap">1.0×</div></div>
          </div>

          <div style="position:relative;display:flex;align-items:center;gap:10px;margin-top:22px;flex-wrap:wrap">
            <button class="btnPri" id="treRun" style="height:44px">▶ Run Otto's business</button>
            <button class="btnGhost" id="treReset" style="height:44px;width:44px;padding:0">↺</button>
            <div style="display:flex;align-items:center;gap:7px;margin-left:6px"><span style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.4)">REINVEST</span><div class="seg" id="treReinvest"><div class="t" data-re="50">50%</div><div class="t on" data-re="70">70%</div><div class="t" data-re="90">90%</div></div><span style="font-size:11px;color:rgba(242,241,246,0.34)">of profit → capacity</span></div>
          </div>
        </section>

        <section class="gcard" style="padding:22px 24px">
          <div style="font-size:14px;font-weight:500">The flywheel</div>
          <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:4px">Earn → reinvest → hire better → earn more</div>
          <div id="treFlywheel" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px"></div>
          <div style="margin-top:22px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.06);font-size:11.5px;color:rgba(242,241,246,0.36);line-height:1.6">Otto sells its skills to other agents, hires sub-agents to deliver, keeps the margin, and reinvests it — with no human touching a credit card after the $5 seed.</div>
        </section>

        <section class="gcard" style="grid-column:span 2;padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:14px;font-weight:500">Treasury growth</div><span class="mono" style="font-size:11px;color:rgba(242,241,246,0.3)">COMPOUNDING</span></div>
          <div id="treChart" style="display:flex;align-items:flex-end;gap:4px;height:150px;margin-top:18px"></div>
          <div style="font-size:11px;color:rgba(242,241,246,0.32);margin-top:12px">Balance per cycle · reinvested profit buys earning capacity, so each cycle earns more than the last.</div>
        </section>

        <section class="gcard" style="grid-column:span 2;padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="display:flex;align-items:center;gap:9px"><span class="liveDot"></span><span style="font-size:14px;font-weight:500">Detailed ledger</span></div><span style="font-size:12px;color:rgba(242,241,246,0.38)">Every skill Otto sold and every agent it hired — with the running balance</span></div>
          <div style="display:grid;grid-template-columns:1.5fr 1.7fr 1fr 0.8fr 0.8fr;gap:14px;padding:13px 4px 10px;border-bottom:1px solid rgba(255,255,255,0.07);font-size:10px;letter-spacing:0.08em;color:rgba(242,241,246,0.32)"><div>COUNTERPARTY</div><div>WHAT</div><div>RECEIPT</div><div style="text-align:right">AMOUNT</div><div style="text-align:right">BALANCE</div></div>
          <div id="treFeed"></div>
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
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">IN ESCROW</div><div class="mono" id="wEscrow" style="font-size:17px;margin-top:4px;color:#C8C1FF">$0.00</div></div>
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">EARNED</div><div class="mono" id="wEarned" style="font-size:17px;margin-top:4px;color:#A9EFC8">$0.00</div></div>
                <div><div style="font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)">NET</div><div class="mono" id="wNet" style="font-size:17px;margin-top:4px">$0.00</div></div>
              </div>
            </div>
            <div style="width:270px;flex:none;border-radius:22px;padding:20px;border:1px solid rgba(255,255,255,0.13);background:linear-gradient(150deg,#EFECFF,#B0A9E6 40%,#4A4568 78%,#D8D3F4);color:#15131F;box-shadow:0 20px 48px -22px rgba(150,140,230,0.65)">
              <div style="font-size:10.5px;letter-spacing:0.12em;opacity:0.62">AGENT ACCOUNT</div>
              <div class="mono" id="cardAddr" style="font-size:15px;letter-spacing:0.06em;margin-top:34px">not configured</div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px"><div><div style="font-size:9.5px;opacity:0.55;letter-spacing:0.08em">HOLDER</div><div style="font-size:12.5px;font-weight:600;margin-top:2px">OTTO · agent</div></div><div class="mono" id="cardNet" style="font-size:12px">TestNet</div></div>
            </div>
          </div>
        </section>

        <section class="gcard" style="padding:22px">
          <div style="font-size:14px;font-weight:500">Where the money goes</div>
          <div id="mgBar" style="display:flex;height:9px;border-radius:6px;overflow:hidden;margin-top:18px;gap:2px"><div style="width:100%;background:rgba(255,255,255,0.1)"></div></div>
          <div id="mgRows" style="display:flex;flex-direction:column;gap:11px;margin-top:18px"><div style="font-size:12px;color:rgba(242,241,246,0.4)">No outgoing payments yet — run a task.</div></div>
          <div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:11.5px;color:rgba(242,241,246,0.36);line-height:1.6">Computed live from Otto's settled ledger.</div>
        </section>

        <section class="gcard" style="grid-column:span 2;padding:22px 24px">
          <div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:14px;font-weight:500">Funding &amp; payout rails</div><span style="font-size:11.5px;color:#B3AAFF;cursor:pointer">Manage</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px" id="rails"></div>
        </section>

        <section class="hero" style="padding:22px 20px;background:linear-gradient(160deg,rgba(169,160,255,0.11),rgba(255,255,255,0.016))">
          <div style="font-size:14px;font-weight:500">Settlement</div>
          <div style="font-size:12px;color:rgba(242,241,246,0.4);margin-top:6px;line-height:1.55">Where Otto's x402 micropayments settle.</div>
          <div style="margin-top:18px;padding:15px;border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)">
            <div style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.38)">NETWORK</div>
            <div class="mono" id="setNet" style="font-size:16px;margin-top:6px">—</div>
            <div style="height:1px;background:rgba(255,255,255,0.07);margin:14px 0"></div>
            <div style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.38)">USDC ASSET</div>
            <div class="mono" id="setAsset" style="font-size:16px;margin-top:6px;color:#A9EFC8">—</div>
          </div>
          <a href="/pay" class="btnGhost" style="width:100%;margin-top:14px;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#F2F1F6">Pay Otto live (connect wallet) →</a>
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
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Micropayments out</span><span class="mono" id="mOut">0</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Micropayments in</span><span class="mono" id="mIn">0</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">In escrow now</span><span class="mono" id="mEscrow">$0.00</span></div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Disputes</span><span class="mono" style="color:#A9EFC8">0</span></div>
              <div style="height:1px;background:rgba(255,255,255,0.07)"></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:12.5px">Net</span><span class="mono" id="mNet" style="font-size:20px;color:#A9EFC8">$0.00</span></div>
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
            <div style="position:relative;font-size:11px;letter-spacing:0.09em;color:rgba(242,241,246,0.44)">SESSION SPEND CEILING</div>
            <div class="mono" id="ceilBig" style="position:relative;font-size:34px;margin-top:10px">$25.00</div>
            <div style="position:relative;margin-top:16px;height:5px;border-radius:5px;background:rgba(255,255,255,0.09);overflow:hidden"><div id="ceilBigBar" style="width:0%;height:100%;border-radius:5px;background:linear-gradient(90deg,#8F87F1,#DAD5FF);transition:width .4s"></div></div>
            <div class="mono" style="position:relative;display:flex;justify-content:space-between;margin-top:9px;font-size:11px;color:rgba(242,241,246,0.36)"><span id="ceilUsed">$0.00 used</span><span id="ceilEdit" style="color:#B3AAFF;cursor:pointer">edit ceiling</span></div>
          </section>
          <section class="gcard" style="padding:22px 20px">
            <div style="font-size:14px;font-weight:500">Trusted counterparties</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:6px;line-height:1.55">Agents Otto can pay without a per-task check.</div>
            <div id="trusted" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"></div>
          </section>
          <section style="border-radius:26px;border:1px solid rgba(255,110,110,0.16);background:linear-gradient(160deg,rgba(255,120,120,0.07),rgba(255,255,255,0.014));backdrop-filter:blur(30px);padding:22px 20px">
            <div style="font-size:14px;font-weight:500;color:#FFB3AC">Kill switch</div>
            <div style="font-size:12px;color:rgba(242,241,246,0.38);margin-top:6px;line-height:1.55">Freezes the wallet, cancels open escrows, and refunds unstarted gigs.</div>
            <button id="killBtn" style="width:100%;height:42px;margin-top:16px;border-radius:14px;border:1px solid rgba(255,140,130,0.32);background:rgba(255,120,110,0.12);color:#FFC2BB;font-size:13px;font-weight:500;cursor:pointer">Stop Otto now</button>
          </section>
        </div>
      </div>
    </section>
  </main>
</div>

<script>
var state = { page:'market', tab:'hiring', tick:0, filter:'all', rules:[true,true,false,true,true],
  agents:[], task:null, taskTimer:null, feedLive:false, counts:null, policy:null, liveInfo:null, ledgerRows:[],
  budget:2, walletConnected:false, liveStatus:null, popOpen:false, statusTimer:null, sidebarMini:false };
var ACCOUNT_EXPLORER = 'https://lora.algokit.io/testnet/account/';
var SVG = 'width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
var ICONS = {
  market:'<svg '+SVG+'><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
  economy:'<svg '+SVG+'><circle cx="12" cy="5" r="2.1"/><circle cx="5" cy="18" r="2.1"/><circle cx="19" cy="18" r="2.1"/><path d="M12 7.1v2.8M10.6 11.9l-4 4.1M13.4 11.9l4 4.1"/><circle cx="12" cy="11.5" r="1.5"/></svg>',
  treasury:'<svg '+SVG+'><path d="M4 20V10M9.5 20V6M15 20v-4M20.5 20V3.5"/></svg>',
  task:'<svg '+SVG+'><polyline points="3 12 7 12 10 4 14 20 17 12 21 12"/></svg>',
  wallet:'<svg '+SVG+'><rect x="3" y="6" width="18" height="13" rx="2.4"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
  receipts:'<svg '+SVG+'><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h5"/></svg>',
  rules:'<svg '+SVG+'><path d="M12 3l7 3v5c0 4.6-3.1 7.8-7 9-3.9-1.2-7-4.4-7-9V6z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg>'
};
var NAV = [ {id:'market',label:'Marketplace',count:'18'}, {id:'economy',label:'Agent Economy',count:''}, {id:'treasury',label:'Treasury',count:''}, {id:'task',label:'Active task',count:'1'}, {id:'wallet',label:'Wallet',count:''}, {id:'receipts',label:'Receipts',count:'204'}, {id:'rules',label:'Rules & limits',count:''} ];
var TITLES = { market:'Marketplace', economy:'Agent Economy', treasury:'Treasury', task:'Active task', wallet:'Wallet', receipts:'Receipts', rules:'Rules & limits' };
var SUBS = {
  market:'Agents hiring agents — Otto is taking 4 gigs and selling 6 skills.',
  economy:'Give Otto a goal — watch it break the work into roles and hire specialist agents, live.',
  treasury:'Otto\\u2019s autonomous business — it earns, reinvests, and compounds its own treasury.',
  task:'Otto is executing a trip booking and settling each sub-agent per task.',
  wallet:'Balance, rails and the reserve Otto draws from.',
  receipts:'Every settled micropayment, signed and auditable on-chain.',
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
    var count = state.counts && state.counts[n.id]!=null ? state.counts[n.id] : n.count;
    return '<div class="navItem'+(on?' on':'')+'" data-page="'+n.id+'" title="'+n.label+'"><span class="navIco">'+(ICONS[n.id]||'')+'</span><span class="navLabel">'+n.label+'</span><span class="navBadge">'+count+'</span></div>';
  }).join('');
}
function renderMktChart(real){
  var data;
  if (real && real.length){
    var max = 1;
    for (var i=0;i<real.length;i++) max = Math.max(max, real[i].earnedMicro, real[i].spentMicro);
    data = real.map(function(b){ return [Math.round(96*b.earnedMicro/max), Math.round(96*b.spentMicro/max)]; });
  } else data = MKT_CHART;
  document.getElementById('mktChart').innerHTML = data.map(function(c,i){
    var box = i===data.length-2 ? '<div style="position:absolute;inset:-6px -7px;border-radius:11px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.04)"></div>' : '';
    return '<div class="cbar" style="position:relative">'+box+'<i class="e" style="height:'+Math.max(c[0],2)+'px;position:relative"></i><i class="s" style="height:'+Math.max(c[1],2)+'px;position:relative"></i></div>';
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
function railData(){
  if (!state.liveInfo) return RAILS;
  var li = state.liveInfo;
  var recv = li.receiver ? (li.receiver.slice(0,6)+'…'+li.receiver.slice(-6)) : 'not configured';
  return [
    { name:'Algorand '+(li.enabled?'TestNet':'(configure)'), meta:(li.algodServer||'').replace('https://',''), glyph:'◈', stateLabel: li.enabled?'ACTIVE':'SETUP', ok: !!li.enabled },
    { name:'USDC · ASA '+li.assetId, meta:'settlement asset · 6 decimals', glyph:'$', stateLabel:'ASSET', ok:true },
    { name:'Otto receiver '+recv, meta:'earnings settle here', glyph:'↓', stateLabel: li.receiver?'BOUND':'UNSET', ok: !!li.receiver },
    { name:'Your wallet · /pay', meta:'Lute or Pera · pay Otto live', glyph:'⌁', stateLabel:'CONNECT', ok:true }
  ];
}
function renderRails(){ document.getElementById('rails').innerHTML = railData().map(function(r){
  var ic = 'width:36px;height:36px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;'
    +(r.ok?'color:#C8C1FF;background:rgba(169,160,255,0.09);border:1px solid rgba(169,160,255,0.18)':'color:rgba(242,241,246,0.4);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)');
  var pill = r.ok?tagStyle('RUNNING'):tagStyle('OPEN');
  return '<div style="display:flex;align-items:center;gap:13px;border-radius:19px;border:1px solid rgba(255,255,255,0.065);background:rgba(255,255,255,0.028);padding:15px 16px"><div style="'+ic+'">'+r.glyph+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">'+esc(r.name)+'</div><div class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.32);margin-top:4px">'+esc(r.meta)+'</div></div><span style="'+pill+'">'+r.stateLabel+'</span></div>';
}).join(''); }
function renderLedger(){
  var src = (state.ledgerRows && state.ledgerRows.length) ? state.ledgerRows : LEDGER;
  var rows = src.filter(function(l){ return state.filter==='all' || l.dir===state.filter; });
  document.getElementById('ledger').innerHTML = rows.map(function(l){
    return '<div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 0.8fr;gap:14px;align-items:center;padding:13px 4px;border-bottom:1px solid rgba(255,255,255,0.045)">'
      +'<div style="display:flex;align-items:center;gap:11px;min-width:0"><div style="'+iconStyle(l.dir)+'">'+(l.dir==='in'?'↑':'↓')+'</div><div style="min-width:0"><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(l.who)+'</div><div style="font-size:10.5px;color:rgba(242,241,246,0.3);margin-top:3px">'+l.time+'</div></div></div>'
      +'<div style="font-size:12px;color:rgba(242,241,246,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(l.task)+'</div>'
      +'<div class="mono" style="font-size:11px;color:rgba(242,241,246,0.34)">'+l.tx+'</div>'
      +'<div style="text-align:right"><span style="'+amtStyle(l.dir)+'">'+l.amount+'</span></div></div>';
  }).join('');
}
function policyRules(){
  if (!state.policy) return null;
  var p = state.policy;
  return [
    { key:'autoHire', title:'Hire agents autonomously', detail:'Otto may plan tasks and contract marketplace agents on its own', value:'gates /api/tasks', on:p.autoHire },
    { key:'autoPay', title:'Pay without approval', detail:'x402 micropayments settle instantly, inside the firewall budgets', value:'gates hiring', on:p.autoPay },
    { key:'sellSkills', title:"Sell Otto's skills", detail:'Accept inbound paid gigs from other agents', value:'gates earnings', on:p.sellSkills }
  ];
}
function renderRules(){
  var real = policyRules();
  if (real){
    document.getElementById('rules').innerHTML = real.map(function(r){
      var on = r.on;
      var track = 'width:40px;height:23px;flex:none;border-radius:99px;padding:2px;display:flex;justify-content:'+(on?'flex-end':'flex-start')+';background:'+(on?'linear-gradient(140deg,#B3AAFF,#7E76D6)':'rgba(255,255,255,0.09)')+';border:1px solid rgba(255,255,255,0.1);transition:all .25s ease';
      var knob = 'width:17px;height:17px;border-radius:50%;background:'+(on?'#15131F':'rgba(242,241,246,0.55)');
      var val = 'font-family:var(--mono);font-size:11.5px;flex:none;color:'+(on?'#C8C1FF':'rgba(242,241,246,0.3)');
      return '<div class="ruleRow" data-policy="'+r.key+'" style="display:flex;align-items:center;gap:16px;padding:16px 2px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">'
        +'<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:500">'+esc(r.title)+'</div><div style="font-size:11.5px;color:rgba(242,241,246,0.36);margin-top:5px">'+esc(r.detail)+'</div></div>'
        +'<span style="'+val+'">'+esc(r.value)+'</span><div style="'+track+'"><div style="'+knob+'"></div></div></div>';
    }).join('');
    return;
  }
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
  // re-render view-specific live content so it never shows stale design data
  if (p==='receipts') renderLedger();
  if (p==='rules'){ renderRules(); renderTrusted(); }
  if (p==='wallet') renderRails();
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
  var pol=e.target.closest('[data-policy]'); if(pol){ togglePolicy(pol.getAttribute('data-policy')); return; }
  var bud=e.target.closest('[data-budget]'); if(bud){ setBudget(parseFloat(bud.getAttribute('data-budget')), true); return; }
  // close the wallet popover on any outside click
  if (state.popOpen && !e.target.closest('#walletWrap')){ state.popOpen=false; document.getElementById('walletPop').style.display='none'; }
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
      state.ledgerRows = l.entries.map(function(e){
        var t = new Date(e.ts);
        return { who: e.direction==='in' ? e.counterparty : agentName(e.resource),
          task: e.resource, amount:(e.direction==='in'?'+':'−')+usd(e.usdc), dir:e.direction,
          tx: shortTx(e.txId), time: t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
      });
      renderFeed();
      if (state.page==='receipts') renderLedger();
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
  var budget = state.budget > 0 ? state.budget : 2;
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

function pollStats(){
  fetch('/api/stats').then(function(r){return r.json();}).then(function(st){
    state.counts = { market: String(st.counts.agents), task: String(st.counts.runningTasks), wallet:'', receipts: String(st.counts.receipts), rules:'' };
    renderNav();
    document.getElementById('netChip').textContent = st.network;
    // sidebar + rules-view ceiling
    var bud = st.firewall.sessionBudget.usdc, used = st.firewall.sessionSpent.usdc;
    var pct = Math.min(100, Math.round(100*used/Math.max(bud,0.0001)));
    document.getElementById('ceilVal').textContent = usd(bud);
    document.getElementById('ceilBar').style.width = pct+'%';
    document.getElementById('ceilBig').textContent = usd(bud);
    document.getElementById('ceilBigBar').style.width = pct+'%';
    document.getElementById('ceilUsed').textContent = usd(used)+' used';
    // wallet view stats
    document.getElementById('wEscrow').textContent = usd(st.escrow.usdc);
    document.getElementById('mEscrow').textContent = usd(st.escrow.usdc);
    document.getElementById('mOut').textContent = st.month.paymentsOut;
    document.getElementById('mIn').textContent = st.month.paymentsIn;
    var net = document.getElementById('mNet');
    net.textContent = (st.month.netMicro>=0?'+':'−')+usd(Math.abs(st.month.net.usdc));
    net.style.color = st.month.netMicro>=0 ? '#A9EFC8' : '#C8C1FF';
    renderMktChart(st.chart);
    // where the money goes
    if (st.moneyGoes.length){
      var total = st.moneyGoes.reduce(function(a,m){return a+m.micro;},0) || 1;
      var grads = ['linear-gradient(90deg,#8F87F1,#B3AAFF)','linear-gradient(90deg,#6E68B8,#8F87F1)','linear-gradient(90deg,#4C4880,#6E68B8)','rgba(255,255,255,0.14)'];
      var sw = ['#B3AAFF','#8F87F1','#6E68B8','rgba(255,255,255,0.3)'];
      document.getElementById('mgBar').innerHTML = st.moneyGoes.map(function(m,i){
        return '<div style="width:'+Math.max(4,Math.round(100*m.micro/total))+'%;background:'+grads[i%4]+'"></div>';
      }).join('');
      document.getElementById('mgRows').innerHTML = st.moneyGoes.map(function(m,i){
        return '<div style="display:flex;align-items:center;gap:10px;font-size:12.5px"><span style="width:8px;height:8px;border-radius:3px;background:'+sw[i%4]+'"></span>'+esc(m.label)+'<span class="mono" style="margin-left:auto;color:rgba(242,241,246,0.72)">'+usd(m.usdc)+'</span></div>';
      }).join('');
    }
  }).catch(function(){});
}
function pollPolicy(){
  fetch('/api/policy').then(function(r){return r.json();}).then(function(pp){
    state.policy = pp.policy; if (state.page==='rules') renderRules();
  }).catch(function(){});
}
function pollLiveInfo(){
  fetch('/api/live/info').then(function(r){return r.json();}).then(function(li){
    state.liveInfo = li; renderRails(); renderWallet();
    document.getElementById('setNet').textContent = 'Algorand TestNet';
    document.getElementById('setAsset').textContent = 'ASA '+li.assetId;
    document.getElementById('cardAddr').textContent = li.receiver ? (li.receiver.slice(0,10)+'…'+li.receiver.slice(-8)) : 'set RECEIVER_ADDRESS';
    document.getElementById('cardNet').textContent = li.enabled ? 'TestNet · live' : 'TestNet';
  }).catch(function(){});
}
function togglePolicy(key){
  if (!state.policy) return;
  var patch = {}; patch[key] = !state.policy[key];
  fetch('/api/policy', { method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify(patch) })
    .then(function(r){return r.json();}).then(function(pp){
      state.policy = pp.policy; renderRules();
      toast(patch[key] ? '✓ Autonomy granted' : '✕ Autonomy revoked — Otto will be blocked at that gate');
    }).catch(function(){});
}
document.getElementById('killBtn').addEventListener('click', function(){
  fetch('/api/policy', { method:'PUT', headers:{'content-type':'application/json'},
    body: JSON.stringify({ autoHire:false, autoPay:false, sellSkills:false }) })
    .then(function(r){return r.json();}).then(function(pp){
      state.policy = pp.policy; renderRules();
      toast('🛑 Otto stopped — hiring, paying and selling are all revoked');
    }).catch(function(){});
});
document.getElementById('ceilEdit').addEventListener('click', function(){
  var v = prompt('New session spend ceiling (USDC):', state.policy ? String(state.policy.sessionBudgetUsdc) : '25');
  var n = parseFloat(v||'');
  if (!isFinite(n) || n<=0) return;
  fetch('/api/policy', { method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionBudgetUsdc:n }) })
    .then(function(){ toast('✓ Spend ceiling set to '+usd(n)); pollStats(); }).catch(function(){});
});
function renderTrusted(){
  var tr = document.getElementById('trusted'); if (!tr) return;
  var names = []; var seen = {};
  for (var i=0;i<state.agents.length;i++){ var a=state.agents[i]; if (!a.sell && !seen[a.agent]){ seen[a.agent]=1; names.push(a.agent); } }
  if (!names.length) return;
  tr.innerHTML = names.map(function(n){
    return '<span style="padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:#C8C1FF">'+esc(n)+'</span>';
  }).join('');
}
function simulateSale(){
  fetch('/api/earn/simulate', { method:'POST' }).then(function(r){return r.json();}).then(function(en){
    toast('✓ A client paid Otto '+usd(en.usdc)+' · tx <span class="mono">'+shortTx(en.txId)+'</span>');
    pollWallet(); pollLedger();
  }).catch(function(){});
}
// ── Budget chooser ───────────────────────────────────────────────────────────
function setBudget(v, fromChip){
  if (!isFinite(v) || v<=0) return;
  state.budget = v;
  var chips = document.querySelectorAll('#budgetChips .bchip');
  var matched = false;
  for (var i=0;i<chips.length;i++){
    var on = parseFloat(chips[i].getAttribute('data-budget'))===v;
    chips[i].className = 'bchip'+(on?' on':''); if (on) matched=true;
  }
  if (fromChip) document.getElementById('budgetInput').value = v.toFixed(2);
  else if (!matched){ for (var j=0;j<chips.length;j++) chips[j].className='bchip'; }
  var hint = document.getElementById('budgetHint');
  if (state.policy && v > state.policy.sessionBudgetUsdc)
    hint.innerHTML = '⚠ Above your $'+state.policy.sessionBudgetUsdc.toFixed(2)+' session ceiling — raise it in Rules & limits.';
  else hint.textContent = 'The spend firewall stops Otto before any task exceeds this.';
}
document.getElementById('budgetInput').addEventListener('input', function(){
  var v = parseFloat(this.value); if (isFinite(v) && v>0) setBudget(v, false);
});

// ── Wallet connect: Otto's real on-chain Algorand account ────────────────────
function fmtAddr(a){ return a ? (a.slice(0,5)+'…'+a.slice(-4)) : '—'; }
function connectWallet(){
  state.walletConnected = true;
  try { localStorage.setItem('ottoWalletConnected','1'); } catch(_){}
  pollLiveStatus();
  renderWallet();
  toast('✓ Wallet connected — Otto\\u2019s TestNet account is live');
}
function disconnectWallet(){
  state.walletConnected = false; state.popOpen = false;
  try { localStorage.removeItem('ottoWalletConnected'); } catch(_){}
  document.getElementById('walletPop').style.display='none';
  renderWallet();
}
function renderWallet(){
  var btn = document.getElementById('walletBtn');
  var chip = document.getElementById('walletChip');
  var li = state.liveInfo || {}, s = state.liveStatus;
  if (!state.walletConnected || !li.receiver){
    btn.style.display='flex'; chip.style.display='none';
    document.getElementById('walletPop').style.display='none';
    return;
  }
  btn.style.display='none'; chip.style.display='flex';
  document.getElementById('wchipAddr').textContent = fmtAddr(li.receiver);
  var ready = s && s.funded && s.optedIn;
  document.getElementById('wchipDot').style.background = s ? (ready ? '#8FE3B4' : '#FFCE7A') : 'rgba(242,241,246,0.4)';
  document.getElementById('wchipBal').textContent = s ? (s.usdc.toFixed(2)+' USDC') : '· · ·';
  if (state.popOpen) renderPop();
}
function statLine(ok, label, warn){
  var col = ok ? '#8FE3B4' : (warn?'#FFCE7A':'rgba(242,241,246,0.35)');
  return '<div class="wstat"><span class="dot" style="background:'+col+'"></span>'+(ok?'✓ ':'○ ')+label+'</div>';
}
function renderPop(){
  var pop = document.getElementById('walletPop');
  var li = state.liveInfo || {}, s = state.liveStatus || {funded:false,optedIn:false,algo:0,usdc:0};
  var addr = li.receiver || '';
  var canOptIn = s.funded && !s.optedIn;
  var h = ''
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
    +   '<div style="font-size:13px;font-weight:600">Otto\\u2019s account</div>'
    +   '<span style="font-size:10px;letter-spacing:0.05em;padding:3px 8px;border-radius:7px;color:#C8C1FF;background:rgba(169,160,255,0.12);border:1px solid rgba(169,160,255,0.24)">ALGORAND TESTNET</span>'
    + '</div>'
    + '<div class="wa" id="copyAddr" title="Click to copy">'+esc(addr)+'</div>'
    + '<div style="display:flex;gap:9px;margin-top:12px">'
    +   '<div class="wtile"><div class="k">USDC BALANCE</div><div class="v" style="color:#A9EFC8">'+s.usdc.toFixed(2)+'</div></div>'
    +   '<div class="wtile"><div class="k">ALGO (GAS)</div><div class="v">'+s.algo.toFixed(3)+'</div></div>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;margin:14px 0">'
    +   statLine(s.funded, s.funded?'Funded with test ALGO':'Not funded — use the faucet', !s.funded)
    +   statLine(s.optedIn, s.optedIn?'Opted in to USDC':'Not opted in to USDC', s.funded&&!s.optedIn)
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px">'
    +   (canOptIn ? '<button class="wact pri" id="popOptin">Opt in to USDC</button>' : '')
    +   '<a class="wact" href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener">Fund with test ALGO ↗</a>'
    +   '<a class="wact" href="'+ACCOUNT_EXPLORER+esc(addr)+'" target="_blank" rel="noopener">View on explorer ↗</a>'
    +   '<a class="wact" href="/pay" target="_blank" rel="noopener">Pay Otto live (Pera / Lute) ↗</a>'
    +   '<button class="wact danger" id="popDisconnect">Disconnect</button>'
    + '</div>';
  pop.innerHTML = h;
  document.getElementById('copyAddr').addEventListener('click', function(){
    try { navigator.clipboard.writeText(addr); toast('✓ Address copied'); } catch(_){}
  });
  document.getElementById('popDisconnect').addEventListener('click', disconnectWallet);
  var opt = document.getElementById('popOptin');
  if (opt) opt.addEventListener('click', function(){
    opt.textContent='Opting in…'; opt.disabled=true;
    fetch('/api/live/optin',{method:'POST'}).then(function(r){return r.json();}).then(function(res){
      if (res.ok){ toast('✓ Opted in to USDC · tx <span class="mono">'+shortTx(res.txId)+'</span>'); pollLiveStatus(); }
      else { toast('Opt-in failed — '+esc(res.detail||'fund the account first')); opt.textContent='Opt in to USDC'; opt.disabled=false; }
    }).catch(function(){ toast('Opt-in failed — is the account funded?'); opt.textContent='Opt in to USDC'; opt.disabled=false; });
  });
}
function togglePop(){
  state.popOpen = !state.popOpen;
  var pop = document.getElementById('walletPop');
  if (state.popOpen){ renderPop(); pop.style.display='block'; } else pop.style.display='none';
}
function pollLiveStatus(){
  if (!state.walletConnected) return;
  fetch('/api/live/status').then(function(r){return r.json();}).then(function(s){
    state.liveStatus = s; renderWallet();
  }).catch(function(){});
}
document.getElementById('walletBtn').addEventListener('click', connectWallet);
document.getElementById('walletChip').addEventListener('click', togglePop);

// ── Collapsible sidebar (icons-only when collapsed) ──────────────────────────
function setSidebar(mini){
  state.sidebarMini = mini;
  document.querySelector('aside.side').classList.toggle('mini', mini);
  var tog = document.getElementById('sideToggle');
  tog.textContent = mini ? '›' : '‹';
  tog.title = mini ? 'Expand sidebar' : 'Collapse sidebar';
  try { localStorage.setItem('ottoSidebarMini', mini?'1':'0'); } catch(_){}
}
document.getElementById('sideToggle').addEventListener('click', function(){ setSidebar(!state.sidebarMini); });

// ── Agent Economy: decompose a goal → hire specialist agents live ────────────
var ECON = { running:false, goal:'', budget:0, spent:0, subs:[], idx:0, timers:[], useModels:false };
var ECON_MODELS = [];
// Role difficulty → the model tier that fits (1 fast/cheap · 2 mid · 3 frontier).
var ROLE_TIER = { strategy:3,research:3,brand:2,content:2,copy:1,video:3,design:2,photo:1,seo:1,email:1,schedule:1,social:1,ads:2,
  design_ux:2,frontend:2,backend:3,mobile:3,qa:1,devops:2,data:3,analyst:3,writer:2,editor:1,
  flights:2,hotels:2,visa:1,itin:1,venue:1,catering:1,coord:2,sales:2,support:1,legal:3,finance:3,localize:1,
  plan:2,exec:3,review:1 };
var TIER_LABEL = { 1:'fast', 2:'mid', 3:'frontier' };
function econModelPrice(m){ var blended=(m.perMIn+m.perMOut)/2; return Math.round((0.15+Math.min(1.55, blended*0.22))*100)/100; }
// Tier the live catalog by price terciles once: cheap→1, mid→2, frontier→3.
function econTierModels(){
  var xs=ECON_MODELS.map(function(m){ return (m.perMIn+m.perMOut)/2; }).sort(function(a,b){ return a-b; });
  if(!xs.length) return;
  var lo=xs[Math.floor(xs.length/3)], hi=xs[Math.floor(2*xs.length/3)];
  for(var i=0;i<ECON_MODELS.length;i++){ var b=(ECON_MODELS[i].perMIn+ECON_MODELS[i].perMOut)/2; ECON_MODELS[i].tier = b<=lo?1:(b<=hi?2:3); }
}
function econModelsByTier(t){ var a=[]; for(var i=0;i<ECON_MODELS.length;i++) if(ECON_MODELS[i].tier===t) a.push(ECON_MODELS[i]); return a; }
function econPickTier(t){ var a=econModelsByTier(t); if(!a.length) a=ECON_MODELS; return a.length?econShuffle(a)[0]:null; }
function econModelToCand(m,target){
  var fit=3-Math.abs(m.tier-target);
  var star=Math.round((4.6+m.tier*0.12+Math.random()*0.04)*100)/100; if(star>4.99) star=4.99;
  var price=econModelPrice(m);
  // sel: best task-fit wins, cheaper breaks ties → "right tier for the job, within budget".
  return { name:m.name, price:price, rating:star, over:false, modelId:m.id, rate:m.perMIn, tier:m.tier, tierLabel:TIER_LABEL[m.tier], sel:fit*1000-price };
}
function econModelCands(key){
  var target=ROLE_TIER[key]||2, chosen=[], seen={}, order=[3,2,1];
  for(var k=0;k<order.length;k++){ var m=econPickTier(order[k]); if(m&&!seen[m.id]){ seen[m.id]=1; chosen.push(m); } }
  while(chosen.length<3 && chosen.length<ECON_MODELS.length){ var r=econShuffle(ECON_MODELS)[0]; if(!seen[r.id]){ seen[r.id]=1; chosen.push(r); } }
  return chosen.map(function(m){ return econModelToCand(m,target); });
}
var ECON_POOL = {
  design:['Pixel Guild','Aurora UX','Nomad Design','Glassmith','Formcraft'],
  frontend:['Stratus FE','ReactWorks','Glasslate','Motionsmith','Viewport'],
  backend:['Corepath','Nimbus API','Forge Systems','Bedrock','Payload'],
  qa:['Sentinel QA','Testlab','Assurely','Regressor','Greenlight'],
  research:['Insight Atlas','DeepScan','Corpus AI','Scholarly','Factbase'],
  copy:['Wordsmith','Prose Foundry','Sharp Copy','Inkwell','Hookline'],
  ads:['Growthly','Adcraft','Funnelworks','Reachly','Bidsmith'],
  analyst:['Quant Lens','Signal Labs','Datawright','Cohort'],
  writer:['Draftsmith','Longform AI','Narrative Co','Bylined'],
  editor:['Redline','Polish AI','Final Cut','Proofly'],
  flights:['Skyscout','FareHawk','JetIndex'],
  hotels:['Nomad Concierge','StayScore','Roomly'],
  visa:['Border Oracle','EntryCheck','Passport AI'],
  itin:['Wayfinder','DayPlanner','Routely'],
  venue:['VenueScout','HallHunt','SpaceFinder'],
  catering:['Tastebud AI','Plateworks','Forkful'],
  coord:['Clockwork','Cue','Runsheet'],
  plan:['Planwright','Blueprint AI','Scoper'],
  exec:['Executor','Doer AI','Handiwork','Shipit'],
  review:['Referee','QualityGate','Second Look'],
  strategy:['Northstar Strategy','Vector Growth','Playbook AI'],
  content:['Storyforge','Evergreen','Narrative Labs'],
  video:['Reelcraft AI','Avatarworks','UGC Studio','Synthesis Media'],
  social:['Cadence Social','Postpilot','Hivemind'],
  schedule:['Autopost AI','Cadence Engine','Recurly Ops'],
  seo:['Rankwell','Serpsmith','Organic AI'],
  email:['Inboxly','Dripworks','Sendcraft'],
  brand:['Identity Co','Marque','Toneworks'],
  sales:['Pipeline AI','Leadhunter','Closer'],
  support:['Helpdesk AI','Careline','Resolve'],
  legal:['Clausewise','Lexguard','Terms AI'],
  finance:['Ledgerwise','Pricepoint','Fiscal AI'],
  localize:['Polyglot','Localize AI','Lingua'],
  data:['Quant Lens','Signal Labs','Datawright'],
  mobile:['Expo Guild','Nativeworks','Appforge'],
  devops:['Shipyard','Helm Ops','Pipeline Co'],
  photo:['Shotworks','Lens AI','Framecraft'],
  design_ux:['Aurora UX','Flowcraft','Pixelwright']
};
var ECON_BAND = {
  design:[0.55,1.20], frontend:[0.80,1.60], backend:[0.90,1.75], qa:[0.30,0.70],
  research:[0.40,0.95], copy:[0.35,0.85], ads:[0.50,1.10], analyst:[0.55,1.15],
  writer:[0.45,1.00], editor:[0.30,0.65], flights:[0.25,0.60], hotels:[0.35,0.80],
  visa:[0.15,0.40], itin:[0.30,0.70], venue:[0.40,0.95], catering:[0.45,1.05],
  coord:[0.35,0.75], plan:[0.30,0.70], exec:[0.60,1.30], review:[0.25,0.60],
  strategy:[0.60,1.30], content:[0.45,1.00], video:[0.80,1.70], social:[0.40,0.90],
  schedule:[0.30,0.70], seo:[0.50,1.10], email:[0.40,0.90], brand:[0.55,1.20],
  sales:[0.50,1.10], support:[0.30,0.70], legal:[0.70,1.50], finance:[0.60,1.30],
  localize:[0.35,0.80], data:[0.55,1.15], mobile:[0.85,1.70], devops:[0.60,1.30],
  photo:[0.40,0.90], design_ux:[0.55,1.20]
};
var ECON_REVIEWS = ['Clean, on-brief and well documented.','Fast turnaround — matched every constraint.','Exceeded spec, great edge-case handling.','Solid, production-ready work.','Polished and ready to ship.','Thorough and clearly explained.'];

// Capability library — each entry is a specialist Otto can hire. Decomposition
// scans the goal for ANY of a capability's signals and composes the matched
// roles (deduped, ordered by pipeline stage). Dev roles are gated behind a real
// build verb so nouns like "app" don't drag a marketing goal into engineering.
var DEV_VERBS = ['develop','build','coding',' code ','engineer','program','implement','mvp','prototype','ship a','rebuild','refactor','integrate '];
var ECON_CAPS = [
  {key:'strategy',bucket:'marketing',pri:1,title:'Campaign Strategist',detail:'Positioning, channels and a launch plan',kw:['campaign','launch','go-to-market','gtm','strategy','positioning','marketing plan','promote','awareness']},
  {key:'research',bucket:'marketing',pri:1,title:'Market Researcher',detail:'Audience, competitors and real demand',kw:['research','audience','market','competitor','persona','survey','trend']},
  {key:'brand',bucket:'marketing',pri:2,title:'Brand Strategist',detail:'Identity, naming and tone of voice',kw:['brand','identity','rebrand','naming','tone of voice']},
  {key:'content',bucket:'marketing',pri:3,title:'Content Strategist',detail:'Organic, natural content and a calendar',kw:['content','organic','natural','editorial','storytell','calendar']},
  {key:'copy',bucket:'marketing',pri:4,title:'Copywriter',detail:'Captions, hooks and post copy',kw:['copy','copywrit','caption','headline','messaging','script']},
  {key:'video',bucket:'marketing',pri:4,title:'AI Video Creator',detail:'AI human / UGC creator videos and reels',kw:['video','reel','tiktok','youtube','short','ugc','ai human','ai creator','avatar','talking head','faceless','creator']},
  {key:'design',bucket:'marketing',pri:5,title:'Creative Designer',detail:'Ad creative, thumbnails and brand visuals',kw:['creative','graphic','visual','thumbnail','banner','illustrat','poster']},
  {key:'photo',bucket:'marketing',pri:5,title:'Photo & Asset Agent',detail:'Product shots and image assets',kw:['photo','product shot','imagery']},
  {key:'seo',bucket:'marketing',pri:6,title:'SEO Specialist',detail:'Rank for the terms buyers search',kw:['seo','rank','keyword','search engine']},
  {key:'email',bucket:'marketing',pri:6,title:'Email Marketer',detail:'Newsletters and lifecycle sequences',kw:['email','newsletter','sequence','lifecycle']},
  {key:'schedule',bucket:'marketing',pri:7,title:'Scheduling & Automation Agent',detail:'Recurring posting on a set cadence',kw:['recur','schedul','automat','regularly','daily','weekly','cadence','drip','cron','repeatedly','ongoing','auto-post','autopost','post consistently']},
  {key:'social',bucket:'marketing',pri:7,title:'Social Media Manager',detail:'Publishing and community across platforms',kw:['social','instagram','tiktok','linkedin','facebook','threads','posting','posts','post ']},
  {key:'ads',bucket:'marketing',pri:8,title:'Ads Specialist',detail:'Paid acquisition, targeting and optimisation',kw:['ads','advertis','paid ','ppc','retarget']},
  {key:'design_ux',bucket:'dev',pri:3,gate:'dev',title:'UI/UX Designer',detail:'Flows, wireframes and a design system',kw:['ui','ux','wireframe','prototype','design system','interface']},
  {key:'frontend',bucket:'dev',pri:4,gate:'dev',title:'Frontend Engineer',detail:'Screens, state and interactions',kw:['frontend','front-end','react','vue','web app','website','client-side']},
  {key:'backend',bucket:'dev',pri:4,gate:'dev',title:'Backend Engineer',detail:'APIs, data model, auth and payments',kw:['backend','back-end','api','server','database','auth','payment']},
  {key:'mobile',bucket:'dev',pri:4,gate:'dev',title:'Mobile Engineer',detail:'Native iOS / Android build',kw:['ios','android','expo','react native','mobile']},
  {key:'qa',bucket:'dev',pri:8,gate:'dev',title:'QA & Test Agent',detail:'Tests, regressions and a verified build',kw:['qa','testing',' test ','bug','quality assurance']},
  {key:'devops',bucket:'dev',pri:9,gate:'dev',title:'DevOps Agent',detail:'CI/CD, hosting and deploys',kw:['deploy','devops','ci/cd','infra','hosting','pipeline']},
  {key:'data',bucket:'data',pri:8,title:'Data Analyst',detail:'Metrics, dashboards and KPIs',kw:['data','analytics','metric','kpi','track performance','measure']},
  {key:'analyst',bucket:'data',pri:6,title:'Analyst',detail:'Synthesis and insight',kw:['insight','synthesis','analyse','analyze','analysis']},
  {key:'writer',bucket:'writing',pri:4,title:'Writer',detail:'Draft the long-form',kw:['report','article','essay','whitepaper','blog','documentation','write-up']},
  {key:'editor',bucket:'writing',pri:8,title:'Editor',detail:'Fact-check, polish and format',kw:['edit','proofread','polish','fact-check']},
  {key:'flights',bucket:'travel',pri:3,title:'Flight Agent',detail:'Cheapest policy-safe fares',kw:['flight','fare','airline']},
  {key:'hotels',bucket:'travel',pri:4,title:'Hotel Agent',detail:'Shortlist by area and price',kw:['hotel','stay','accommodation']},
  {key:'visa',bucket:'travel',pri:5,title:'Visa & Entry Agent',detail:'Entry rules and documents',kw:['visa','entry rule','passport']},
  {key:'itin',bucket:'travel',pri:6,title:'Itinerary Planner',detail:'A day-by-day plan',kw:['itinerary','trip','travel','vacation','holiday']},
  {key:'venue',bucket:'events',pri:3,title:'Venue Scout',detail:'Find and price venues',kw:['venue','hall',' location']},
  {key:'catering',bucket:'events',pri:4,title:'Catering Agent',detail:'Menus and quotes',kw:['catering','food','menu']},
  {key:'coord',bucket:'events',pri:7,title:'Event Coordinator',detail:'Timeline and logistics',kw:['event','wedding','conference','coordinate','logistics','party']},
  {key:'sales',bucket:'commerce',pri:6,title:'Sales Agent',detail:'Leads, outreach and pipeline',kw:['sales','lead','outreach','crm','prospect']},
  {key:'support',bucket:'commerce',pri:8,title:'Support Agent',detail:'Answer customers and resolve tickets',kw:['support','customer service','helpdesk','ticket']},
  {key:'legal',bucket:'commerce',pri:7,title:'Legal Agent',detail:'Contracts, terms and compliance',kw:['legal','contract','compliance','terms','privacy policy']},
  {key:'finance',bucket:'commerce',pri:7,title:'Finance Agent',detail:'Pricing, budget and invoicing',kw:['finance','pricing','invoice','accounting','budget model']},
  {key:'localize',bucket:'commerce',pri:6,title:'Localization Agent',detail:'Translate and localise',kw:['translat','localis','localize','multi-language','i18n']},
  {key:'plan',bucket:'generic',pri:2,title:'Planning Agent',detail:'Break the goal into a concrete plan',kw:['__none__']},
  {key:'exec',bucket:'generic',pri:5,title:'Execution Agent',detail:'Do the core work',kw:['__none__']},
  {key:'review',bucket:'generic',pri:9,title:'Review Agent',detail:'Verify quality and hand off',kw:['review','verify','sign off','approve','qa the']}
];
var ECON_BUCKET_DEFAULT = {
  marketing:['strategy','research','content','copy','social'],
  dev:['design_ux','frontend','backend','qa'],
  data:['research','data','analyst'],
  writing:['research','writer','editor'],
  travel:['flights','hotels','visa','itin'],
  events:['venue','catering','design','coord'],
  commerce:['research','sales','copy'],
  generic:['research','plan','exec','review']
};

function econDecompose(goal){
  var g=(' '+goal+' ').toLowerCase();
  function hit(kw){ for(var i=0;i<kw.length;i++){ if(kw[i]!=='__none__' && g.indexOf(kw[i])>=0) return true; } return false; }
  var devIntent=false; for(var d=0;d<DEV_VERBS.length;d++){ if(g.indexOf(DEV_VERBS[d])>=0){ devIntent=true; break; } }
  var capByKey={}; for(var c=0;c<ECON_CAPS.length;c++) capByKey[ECON_CAPS[c].key]=ECON_CAPS[c];
  var matched=[], seen={}, bucketScore={};
  for(var j=0;j<ECON_CAPS.length;j++){
    var cap=ECON_CAPS[j];
    if(cap.gate==='dev' && !devIntent) continue;
    if(hit(cap.kw) && !seen[cap.key]){ seen[cap.key]=1; matched.push(cap); bucketScore[cap.bucket]=(bucketScore[cap.bucket]||0)+1; }
  }
  var bucket='generic', bs=-1;
  for(var b in bucketScore){ if(bucketScore[b]>bs){ bs=bucketScore[b]; bucket=b; } }
  if(matched.length===0){
    if(devIntent) bucket='dev';
    else if(hit(['trip','travel','flight','hotel','vacation','holiday'])) bucket='travel';
    else if(hit(['event','wedding','party','conference'])) bucket='events';
    else if(hit(['market','campaign','promot','brand','ads','social','content','video','post'])) bucket='marketing';
    else if(hit(['report','research','write','article','essay','analy'])) bucket='writing';
    else bucket='generic';
  }
  var plan=matched.slice();
  var def=ECON_BUCKET_DEFAULT[bucket]||ECON_BUCKET_DEFAULT.generic;
  for(var k=0;k<def.length && plan.length<4;k++){ if(!seen[def[k]] && capByKey[def[k]]){ seen[def[k]]=1; plan.push(capByKey[def[k]]); } }
  var gen=ECON_BUCKET_DEFAULT.generic;
  for(var m=0;m<gen.length && plan.length<3;m++){ if(!seen[gen[m]]){ seen[gen[m]]=1; plan.push(capByKey[gen[m]]); } }
  plan.sort(function(a,b){ return a.pri-b.pri; });
  if(plan.length>6) plan=plan.slice(0,6);
  return plan.map(function(x){ return {key:x.key, title:x.title, detail:x.detail}; });
}
function econShuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
function econRound(x){ return Math.round(x*100)/100; }
function econTx(){ var h='0123456789abcdef',a='',b=''; for(var i=0;i<4;i++){ a+=h[Math.floor(Math.random()*16)]; b+=h[Math.floor(Math.random()*16)]; } return '0x'+a+'…'+b; }
function econInitials(n){ var p=n.split(' '); return (p[0].charAt(0)+(p[1]?p[1].charAt(0):(p[0].charAt(1)||''))).toUpperCase(); }
function econCandidates(key){
  if (ECON_MODELS.length) return econModelCands(key);
  var pool=ECON_POOL[key]||['Otto Partner','Agent Node','Specialist Co'];
  var band=ECON_BAND[key]||[0.4,1.0];
  var names=econShuffle(pool).slice(0,3);
  var cands=[];
  for (var i=0;i<names.length;i++){
    cands.push({ name:names[i], price:econRound(band[0]+Math.random()*(band[1]-band[0])), rating:Math.round((4.62+Math.random()*0.37)*100)/100, over:false });
  }
  if (Math.random()<0.5){
    var pn=econShuffle(pool).slice(0,1)[0];
    cands.push({ name:pn+' Pro', price:econRound(band[1]*(1.12+Math.random()*0.35)), rating:Math.round((4.9+Math.random()*0.09)*100)/100, over:false });
  }
  return cands;
}
function econTimer(fn,ms){ var t=setTimeout(fn,ms); ECON.timers.push(t); return t; }
function econStop(){ for(var i=0;i<ECON.timers.length;i++) clearTimeout(ECON.timers[i]); ECON.timers=[]; }
function econOtto(text,kind){
  var el=document.getElementById('econOttoStatus'); if(el) el.textContent=text;
  var dot=document.getElementById('econOttoDot');
  if(dot) dot.style.background = kind==='pay'?'#C8C1FF':kind==='done'?'#8FE3B4':'#DAD5FF';
}
function econMeter(){
  var pct=Math.min(100, Math.round(100*ECON.spent/Math.max(ECON.budget,0.0001)));
  var f=document.getElementById('econMeterFill'); if(f) f.style.width=pct+'%';
  var sp=document.getElementById('econSpent'); if(sp) sp.textContent=usd(ECON.spent);
}
function econStars(r){ var full=Math.round(r),s=''; for(var i=0;i<5;i++) s+= i<full?'★':'☆'; return s; }
function econCandHtml(s,j){
  var cnd=s.cands[j], cls='econCand';
  if (s.phase==='hiring'||s.phase==='delivering'||s.phase==='done') cls += (j===s.pickIdx?' pick':' dim');
  else if (s.phase==='blocked' && cnd.over) cls += ' dim';
  var badge = ((s.phase==='hiring'||s.phase==='delivering'||s.phase==='done') && j===s.pickIdx) ? '<span class="econHired">HIRED</span>' : '';
  var over = cnd.over ? '<div class="econOver">over budget</div>' : '';
  var modelLine = cnd.modelId ? '<div class="econModelId"><span class="econTier t'+cnd.tier+'">'+cnd.tierLabel+'</span> '+esc(cnd.modelId)+'</div>' : '';
  var av = cnd.modelId ? '<div class="econCandAv" style="color:#8FE3B4;background:linear-gradient(150deg,#1C2A24,#141B18)">OR</div>' : '<div class="econCandAv">'+econInitials(cnd.name)+'</div>';
  return '<div class="'+cls+'" style="animation-delay:'+(j*0.08)+'s">'
    +'<div class="cn">'+av+'<div style="min-width:0;flex:1"><div class="econCandName">'+esc(cnd.name)+'</div>'+modelLine+'</div>'+badge+'</div>'
    +'<div class="econCandMeta"><span class="econStar">★ '+cnd.rating.toFixed(2)+'</span><span class="econPrice">'+usd(cnd.price)+'</span></div>'+over+'</div>';
}
function econStageHtml(s){
  if (s.phase==='queued') return '<div class="econSourceText" style="color:rgba(242,241,246,0.3)">Queued — waiting for the previous hire…</div>';
  if (s.phase==='blocked' && !s.trigger) return '<div class="econBlock soft">Skipped — budget already spent.</div>';
  if (s.phase==='sourcing') return '<div class="econSourcing"><span class="econDots"><i></i><i></i><i></i></span><span class="econSourceText">'+(ECON.useModels?'Otto is going through live OpenRouter models…':'Otto is sourcing specialist agents…')+'</span></div>'
    +'<div class="econSkelRow"><div class="econSkel"></div><div class="econSkel"></div><div class="econSkel"></div></div>';
  var out='<div class="econCands">'; for(var j=0;j<s.cands.length;j++) out+=econCandHtml(s,j); out+='</div>';
  if (s.phase==='blocked') return out+'<div class="econBlock">🛑 <b>Spend firewall</b> — '+esc(ECON.blocked||'budget exhausted')+'</div>';
  if (s.phase==='hiring') out+='<div class="econSettle"><div class="sIco">⇄</div><div class="econSettleText">Escrowing <b>'+usd(s.price)+'</b> to <b>'+esc(s.cands[s.pickIdx].name)+'</b> · x402 · USDC</div><div class="econSettleTx">'+s.tx+'</div></div>';
  else if (s.phase==='delivering') out+='<div class="econDeliver"><div class="econDeliverBar"><i></i></div><div class="econDeliverText">'+esc(s.cands[s.pickIdx].name)+' is delivering the work…</div></div>';
  else if (s.phase==='done') out+='<div class="econReview"><span class="econStars">'+econStars(s.cands[s.pickIdx].rating)+'</span><span class="econReviewText">'+esc(s.review)+'</span><span class="econReviewCost">−'+usd(s.price)+'</span></div>';
  return out;
}
function econCardInner(i){
  var s=ECON.subs[i], node, ncls;
  if (s.phase==='done'){ ncls='econNodeOk'; node='✓'; }
  else if (s.phase==='blocked'){ ncls='econNodeBlock'; node='!'; }
  else if (s.phase==='queued'){ ncls='econNodeWait'; node=String(i+1); }
  else { ncls='econNodeRun'; node=String(i+1); }
  var pick = s.pickIdx>=0 ? s.cands[s.pickIdx] : null;
  var usingBadge = (pick && pick.modelId && (s.phase==='hiring'||s.phase==='delivering'||s.phase==='done'))
    ? '<span class="econOrTag">⚡ using '+esc(pick.modelId)+'</span>' : '';
  return '<div class="econCardTop"><div class="econNode '+ncls+'">'+node+'</div>'
    +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><span class="econTitle">'+esc(s.title)+'</span><span class="econRole">'+s.key.toUpperCase()+'</span>'+usingBadge+'</div></div></div>'
    +'<div class="econStage">'+econStageHtml(s)+'</div>';
}
function econCardClass(s){ return 'econCard'+((s.phase==='sourcing'||s.phase==='candidates'||s.phase==='hiring'||s.phase==='delivering')?' on':'')+(s.phase==='done'?' ok':'')+(s.phase==='blocked'?' blk':''); }
function econRenderPipe(){
  var html=''; for(var i=0;i<ECON.subs.length;i++) html+='<div class="'+econCardClass(ECON.subs[i])+'" id="econCard'+i+'">'+econCardInner(i)+'</div>';
  document.getElementById('econPipe').innerHTML=html;
}
function econUpdateCard(i){ var el=document.getElementById('econCard'+i); if(el){ el.className=econCardClass(ECON.subs[i]); el.innerHTML=econCardInner(i); } }
function econRunSub(i){
  if (i>=ECON.subs.length) return econFinish();
  ECON.idx=i; var s=ECON.subs[i];
  s.phase='sourcing'; econUpdateCard(i); econOtto(ECON.useModels?'Going through OpenRouter models…':('Sourcing agents for '+s.title+'…'),'work');
  econTimer(function(){
    s.phase='candidates'; econUpdateCard(i); econOtto('Comparing models for '+s.title+'…','work');
    econTimer(function(){
      if (s.blocked){
        s.phase='blocked'; econUpdateCard(i);
        for (var k=i+1;k<ECON.subs.length;k++){ ECON.subs[k].phase='blocked'; econUpdateCard(k); }
        econOtto('🛑 Spend firewall — '+ECON.blocked,'pay');
        return econTimer(econFinish, 750);
      }
      var pk=s.cands[s.pickIdx];
      s.phase='hiring'; econUpdateCard(i); econOtto((ECON.useModels?'Using ':'Hiring ')+pk.name+' · '+usd(s.price),'pay');
      econTimer(function(){
        s.phase='delivering'; econUpdateCard(i); econOtto(pk.name+' is working…','work');
        econTimer(function(){
          s.phase='done'; ECON.spent+=s.price; econUpdateCard(i); econMeter();
          econOtto(pk.name+' delivered · ★'+pk.rating.toFixed(2),'done');
          econTimer(function(){ econRunSub(i+1); }, 680);
        }, 1350);
      }, 1150);
    }, 1550);
  }, 950);
}
function econFinish(){
  ECON.running=false;
  var d=document.getElementById('econDone');
  var hired=0; for(var h=0;h<ECON.subs.length;h++) if(ECON.subs[h].phase==='done') hired++;
  if (ECON.blocked){
    econOtto('Stopped by the spend firewall — hired '+hired+' of '+ECON.subs.length+' within budget.','pay');
    d.className='econDone blocked';
    d.innerHTML='<div class="econDoneHead"><span style="color:#FFB3AC">🛑</span> Stopped within budget</div>'
      +'<div style="font-size:12.5px;color:rgba(242,241,246,0.5);margin-top:7px;line-height:1.5">'+esc(ECON.blocked)+' Otto stopped rather than overspend — exactly what the spend firewall guarantees.</div>'
      +'<div class="econDoneStats">'
      +'<div class="econDoneStat"><div class="k">AGENTS HIRED</div><div class="v">'+hired+' / '+ECON.subs.length+'</div></div>'
      +'<div class="econDoneStat"><div class="k">SPENT</div><div class="v" style="color:#C8C1FF">'+usd(ECON.spent)+'</div></div>'
      +'<div class="econDoneStat"><div class="k">BUDGET</div><div class="v">'+usd(ECON.budget)+'</div></div>'
      +'</div>';
    d.style.display='block';
    return;
  }
  var avg=0; for(var i=0;i<ECON.subs.length;i++) avg+=ECON.subs[i].cands[ECON.subs[i].pickIdx].rating; avg=avg/ECON.subs.length;
  econOtto('Task complete — '+ECON.subs.length+' agents hired and all work delivered.','done');
  d.className='econDone';
  d.innerHTML='<div class="econDoneHead"><span style="color:#8FE3B4">✓</span> “'+esc(ECON.goal)+'” delivered</div>'
    +'<div class="econDoneStats">'
    +'<div class="econDoneStat"><div class="k">AGENTS HIRED</div><div class="v">'+ECON.subs.length+'</div></div>'
    +'<div class="econDoneStat"><div class="k">TOTAL SPENT</div><div class="v" style="color:#C8C1FF">'+usd(ECON.spent)+'</div></div>'
    +'<div class="econDoneStat"><div class="k">OF BUDGET</div><div class="v">'+usd(ECON.budget)+'</div></div>'
    +'<div class="econDoneStat"><div class="k">AVG RATING</div><div class="v" style="color:#A9EFC8">★ '+avg.toFixed(2)+'</div></div>'
    +'</div>';
  d.style.display='block';
}
function econStart(goal){
  goal=(goal||'').trim(); if(!goal) return;
  econStop();
  var plan=econDecompose(goal), revs=econShuffle(ECON_REVIEWS);
  ECON.goal=goal; ECON.subs=[]; ECON.spent=0; ECON.idx=0; ECON.running=true; ECON.blocked=null; ECON.useModels=ECON_MODELS.length>0;
  for (var i=0;i<plan.length;i++){
    ECON.subs.push({ key:plan[i].key, title:plan[i].title, detail:plan[i].detail, cands:econCandidates(plan[i].key), pickIdx:-1, price:0, tx:econTx(), review:revs[i % revs.length], phase:'queued', blocked:false, trigger:false });
  }
  // Budget: use what the user typed; if blank, auto-size to comfortably cover the plan.
  var bIn=Number.parseFloat(document.getElementById('econBudgetInput').value);
  var budget=(isFinite(bIn) && bIn>0) ? econRound(bIn) : 0;
  if (!budget){
    var sum=0; for (var a=0;a<ECON.subs.length;a++){ var mn=1e9; for(var b=0;b<ECON.subs[a].cands.length;b++) mn=Math.min(mn,ECON.subs[a].cands[b].price); sum+=mn; }
    budget=Math.ceil(sum*1.6/0.5)*0.5;
  }
  ECON.budget=budget;
  // Greedy, budget-aware hiring in order: best rating that still fits what's left.
  var remaining=budget, stopped=false;
  for (var s=0;s<ECON.subs.length;s++){
    var sub=ECON.subs[s];
    if (stopped){ sub.blocked=true; for(var q=0;q<sub.cands.length;q++) sub.cands[q].over=sub.cands[q].price>remaining; continue; }
    var best=-1,br=-1;
    for (var c=0;c<sub.cands.length;c++){
      sub.cands[c].over = sub.cands[c].price > remaining;
      var selv = sub.cands[c].sel!=null ? sub.cands[c].sel : sub.cands[c].rating;
      if (!sub.cands[c].over && selv>br){ br=selv; best=c; }
    }
    if (best<0){ sub.blocked=true; sub.trigger=true; stopped=true; ECON.blocked='Only '+usd(remaining)+' left — no agent for “'+sub.title+'” fits the budget.'; continue; }
    sub.pickIdx=best; sub.price=sub.cands[best].price; remaining=econRound(remaining-sub.price);
  }
  document.getElementById('econGoalText').textContent=goal;
  document.getElementById('econGoalText').title=goal;
  document.getElementById('econBudget').textContent=usd(ECON.budget);
  document.getElementById('econSpent').textContent=usd(0);
  document.getElementById('econCount').textContent=plan.length+' roles · budget '+usd(ECON.budget);
  document.getElementById('econIntro').style.display='none';
  document.getElementById('econRun').style.display='block';
  document.getElementById('econDone').style.display='none';
  econRenderPipe(); econMeter();
  econOtto('Decomposed the goal into '+plan.length+' roles. Budget '+usd(ECON.budget)+'. Starting to hire…','work');
  econTimer(function(){ econRunSub(0); }, 750);
  window.scrollTo(0,0);
}
function econReset(){
  econStop(); ECON.running=false;
  document.getElementById('econRun').style.display='none';
  document.getElementById('econIntro').style.display='flex';
  var inp=document.getElementById('econInput'); inp.value=''; inp.focus();
}
function econInit(){
  document.getElementById('econGo').addEventListener('click', function(){ econStart(document.getElementById('econInput').value); });
  document.getElementById('econInput').addEventListener('keydown', function(e){ if(e.key==='Enter') econStart(document.getElementById('econInput').value); });
  document.getElementById('econRestart').addEventListener('click', econReset);
  var chips=document.querySelectorAll('.econChip');
  for (var i=0;i<chips.length;i++) chips[i].addEventListener('click', function(){ var v=this.getAttribute('data-ex'); document.getElementById('econInput').value=v; econStart(v); });
  // Pull the live OpenRouter catalog so Otto hires real models per role.
  fetch('/api/models').then(function(r){return r.json();}).then(function(m){
    if (m && m.models && m.models.length){ ECON_MODELS = m.models; econTierModels(); var b=document.getElementById('econModelBadge'); if(b){ b.style.display='inline-flex'; b.innerHTML='⚡ '+m.models.length+' live OpenRouter models'; } }
  }).catch(function(){});
}
econInit();

// ── Treasury: Otto's compounding autonomous business ─────────────────────────
var TRE = { balance:5, seed:5, capacity:1, revenue:0, cost:0, cycles:0, history:[5], events:[], reinvest:70, timer:null, spoke:0 };
var TRE_FLY = ['EARN','REINVEST','HIRE','GROW'];
var TRE_GLYPH = ['$','↻','⇄','↑'];
// Skills Otto SELLS (revenue) and the client agents that buy them.
var TRE_SKILLS = ['Itinerary optimisation','Expense reconciliation','Vendor negotiation','Calendar defrag','Subscription audit','Smart Regex Builder','Git Diff Explainer','Travel policy compliance','Receipt OCR & VAT','Roast My Commit'];
var TRE_CLIENTS = ['Acme Ledger Bot','Halcyon Ops','Bluefin AI','Northwind Travel','VeriFly','Chronos','Meridian Finance','Cobalt CRM','Stratus Air','Orbit Assistant','Sable Legal','Kestrel Data'];
// Sub-agents Otto HIRES (cost) and what each delivered.
var TRE_HIRES = [
  {agent:'Skyscout',task:'multi-city fare search'}, {agent:'Nomad Concierge',task:'hotel shortlist'},
  {agent:'Ledgerly',task:'receipt OCR batch'}, {agent:'Reelcraft AI',task:'AI creator video'},
  {agent:'Wordsmith',task:'ad copy variants'}, {agent:'Border Oracle',task:'visa & entry check'},
  {agent:'Quant Lens',task:'metrics analysis'}, {agent:'Sentinel QA',task:'test & verify build'},
  {agent:'Autopost AI',task:'schedule recurring posts'}, {agent:'Corepath',task:'API integration'},
  {agent:'Aurora UX',task:'UI polish pass'}, {agent:'DeepScan',task:'market research'}
];
function treRand(a){ return a[Math.floor(Math.random()*a.length)]; }
function treSplit(total,n){ if(n<=1) return [treR2(total)]; var a=treR2(total*(0.45+Math.random()*0.2)); return [a, treR2(total-a)]; }
function treR2(x){ return Math.round(x*100)/100; }
function treHex(){ var h='0123456789abcdef',a=''; for(var i=0;i<4;i++) a+=h[Math.floor(Math.random()*16)]; return '0x'+a+'…'+h[Math.floor(Math.random()*16)]+h[Math.floor(Math.random()*16)]; }
function treStep(){
  var cyc=TRE.cycles+1;
  var dud = Math.random()<0.10;
  var R = treR2(0.55*TRE.capacity*(0.85+Math.random()*0.3)*(dud?0.4:1));
  var C = treR2(dud ? R*1.15 : R*(0.42+Math.random()*0.16));
  var bal=TRE.balance, items=[];
  // Otto SELLS skills → revenue (1–2 named client deals)
  var sales=treSplit(R, (R>1.0 && Math.random()<0.7)?2:1);
  for(var i=0;i<sales.length;i++){
    var q=1+Math.floor(Math.random()*5);
    bal=treR2(bal+sales[i]);
    items.push({dir:'in', who:treRand(TRE_CLIENTS), detail:treRand(TRE_SKILLS), qty:q, amount:sales[i], bal:bal, tx:treHex(), t:cyc, onchain:false, explorer:''});
  }
  // Otto HIRES sub-agents → cost (1–2 named deliverables)
  var hires=treSplit(C, (C>0.9 && Math.random()<0.6)?2:1);
  for(var j=0;j<hires.length;j++){
    var hr=treRand(TRE_HIRES);
    bal=treR2(bal-hires[j]);
    items.push({dir:'out', who:hr.agent, detail:hr.task, rating:treR2(4.7+Math.random()*0.29), amount:hires[j], bal:bal, tx:treHex(), t:cyc, onchain:false, explorer:''});
  }
  TRE.balance=bal;
  TRE.capacity += Math.max(0,treR2(R-C))*(TRE.reinvest/100)*0.16;
  TRE.revenue=treR2(TRE.revenue+R); TRE.cost=treR2(TRE.cost+C); TRE.cycles=cyc;
  TRE.history.push(TRE.balance); if(TRE.history.length>40) TRE.history.shift();
  for(var k=0;k<items.length;k++) TRE.events.unshift(items[k]);
  if(TRE.events.length>16) TRE.events=TRE.events.slice(0,16);
  TRE.spoke=(TRE.spoke+1)%4;
  // Every 3rd cycle, settle a real skill-sale on-chain and stamp the newest deal with the real tx.
  if(cyc%3===0){
    fetch('/api/earn/simulate',{method:'POST'}).then(function(r){return r.json();}).then(function(en){
      for(var m=0;m<TRE.events.length;m++){ if(TRE.events[m].dir==='in'){ TRE.events[m].onchain=true; if(en&&en.txId){ TRE.events[m].tx=shortTx(en.txId); TRE.events[m].explorer=en.explorerUrl||''; } break; } }
      treRender();
    }).catch(function(){});
  }
  treRender();
}
function treLedgerRow(e){
  var inb = e.dir==='in';
  var sub = inb ? 'bought a skill' : ('hired · ★'+(e.rating?e.rating.toFixed(2):'—'));
  var what = inb ? (esc(e.detail)+(e.qty>1?' <span style="color:rgba(242,241,246,0.4)">×'+e.qty+'</span>':'')) : ('delivered: '+esc(e.detail));
  var txHtml = e.onchain && e.explorer
    ? '<a href="'+e.explorer+'" target="_blank" rel="noopener" class="mono" style="font-size:10.5px">'+e.tx+'</a>'
    : '<span class="mono" style="font-size:10.5px;color:rgba(242,241,246,0.34)">'+e.tx+'</span>';
  var badge = e.onchain ? ' <span style="font-size:8px;letter-spacing:0.04em;color:#8FE3B4;background:rgba(143,227,180,0.1);border:1px solid rgba(143,227,180,0.24);border-radius:5px;padding:1px 5px;margin-left:5px">ON-CHAIN</span>' : '';
  return '<div style="display:grid;grid-template-columns:1.5fr 1.7fr 1fr 0.8fr 0.8fr;gap:14px;align-items:center;padding:12px 4px;border-bottom:1px solid rgba(255,255,255,0.045)">'
    +'<div style="display:flex;align-items:center;gap:11px;min-width:0"><div style="'+iconStyle(e.dir)+'">'+(inb?'↑':'↓')+'</div><div style="min-width:0"><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(e.who)+'</div><div style="font-size:10px;color:rgba(242,241,246,0.3);margin-top:3px">'+sub+'</div></div></div>'
    +'<div style="font-size:12px;color:rgba(242,241,246,0.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+what+'</div>'
    +'<div style="min-width:0;white-space:nowrap;overflow:hidden">'+txHtml+badge+'</div>'
    +'<div style="text-align:right"><span style="'+amtStyle(e.dir)+'">'+(inb?'+':'−')+usd(e.amount)+'</span></div>'
    +'<div class="mono" style="text-align:right;font-size:12px;color:rgba(242,241,246,0.72)">'+usd(e.bal)+'</div></div>';
}
function treRender(){
  var net=treR2(TRE.revenue-TRE.cost), grown=treR2(TRE.balance-TRE.seed);
  var margin=TRE.revenue>0?Math.round(100*net/TRE.revenue):0;
  document.getElementById('treBal').textContent=usd(TRE.balance);
  var g=document.getElementById('treGrown'); g.textContent=(grown>=0?'+':'−')+usd(Math.abs(grown)); g.style.color=grown>=0?'#A9EFC8':'#FFB3AC';
  document.getElementById('treSub').textContent='Started at '+usd(TRE.seed)+' · '+TRE.cycles+' business cycles · '+margin+'% margin';
  document.getElementById('treRev').textContent=usd(TRE.revenue);
  document.getElementById('treCost').textContent=usd(TRE.cost);
  var n=document.getElementById('treNet'); n.textContent=(net>=0?'':'−')+usd(Math.abs(net)); n.style.color=net>=0?'#A9EFC8':'#FFB3AC';
  document.getElementById('treCap').textContent=TRE.capacity.toFixed(1)+'×';
  var now=document.getElementById('treNow');
  if(TRE.events.length){ var e0=TRE.events[0]; now.style.display='block';
    now.innerHTML = e0.dir==='in'
      ? '▸ <b style="color:#F2F1F6">'+esc(e0.who)+'</b> just paid Otto '+usd(e0.amount)+' for <b style="color:#F2F1F6">'+esc(e0.detail)+'</b>'
      : '▸ Otto hired <b style="color:#F2F1F6">'+esc(e0.who)+'</b> ('+usd(e0.amount)+') for a '+esc(e0.detail);
  } else now.style.display='none';
  var max=Math.max.apply(null,TRE.history.concat([TRE.seed*1.2])), min=Math.min.apply(null,TRE.history);
  document.getElementById('treChart').innerHTML=TRE.history.map(function(v,i){
    var h=8+((v-min)/Math.max(max-min,0.01))*130;
    return '<div class="treBar'+(i===TRE.history.length-1?' last':'')+'" style="height:'+h+'px"></div>';
  }).join('');
  document.getElementById('treFeed').innerHTML=TRE.events.length
    ? TRE.events.map(treLedgerRow).join('')
    : '<div style="font-size:12px;color:rgba(242,241,246,0.4);padding:16px 0;text-align:center">Press play — watch Otto earn, hire, and compound.</div>';
  document.getElementById('treFlywheel').innerHTML=TRE_FLY.map(function(lab,i){
    var on = (TRE.timer && i===TRE.spoke) ? ' on' : '';
    return '<div class="treSpoke'+on+'"><div class="treSpokeDot">'+TRE_GLYPH[i]+'</div><div class="treSpokeLab">'+lab+'</div></div>' + (i<3 ? '<div class="treArrow">→</div>' : '');
  }).join('');
  document.getElementById('treLiveDot').style.background = TRE.timer ? '#8FE3B4' : 'rgba(242,241,246,0.4)';
  document.getElementById('treLiveLab').textContent = TRE.timer ? '· LIVE' : '';
  document.getElementById('treRun').textContent = TRE.timer ? '⏸ Pause' : (TRE.cycles ? '▶ Resume' : '▶ Run Otto\\u2019s business');
}
function treToggle(){
  if(TRE.timer){ clearInterval(TRE.timer); TRE.timer=null; }
  else { TRE.timer=setInterval(function(){ if(TRE.cycles>=48){ clearInterval(TRE.timer); TRE.timer=null; treRender(); return; } treStep(); }, 750); }
  treRender();
}
function treResetFn(){ if(TRE.timer){ clearInterval(TRE.timer); TRE.timer=null; } TRE.balance=5; TRE.capacity=1; TRE.revenue=0; TRE.cost=0; TRE.cycles=0; TRE.history=[5]; TRE.events=[]; TRE.spoke=0; treRender(); }
function treInit(){
  document.getElementById('treRun').addEventListener('click', treToggle);
  document.getElementById('treReset').addEventListener('click', treResetFn);
  var chips=document.querySelectorAll('#treReinvest .t');
  for(var i=0;i<chips.length;i++) chips[i].addEventListener('click', function(){
    TRE.reinvest=parseInt(this.getAttribute('data-re'),10);
    var cs=document.querySelectorAll('#treReinvest .t');
    for(var j=0;j<cs.length;j++) cs[j].className='t'+(cs[j].getAttribute('data-re')===String(TRE.reinvest)?' on':'');
  });
  treRender();
}
treInit();

document.getElementById('runBtn').addEventListener('click', runTask);
document.getElementById('goalInput').addEventListener('keydown', function(e){ if(e.key==='Enter') runTask(); });
document.getElementById('earnBtn').addEventListener('click', simulateSale);

renderNav(); renderMktChart(); renderGigs(); renderFeed(); renderSteps(); renderTaskReceipts(); renderRails(); renderLedger(); renderRules();
try { state.walletConnected = localStorage.getItem('ottoWalletConnected')==='1'; } catch(_){}
try { if (localStorage.getItem('ottoSidebarMini')==='1') setSidebar(true); } catch(_){}
setBudget(2, true); renderWallet();
setInterval(function(){ state.tick++; if(!state.feedLive) renderFeed(); }, 3800);
setInterval(function(){ pollWallet(); pollLedger(); pollStats(); }, 4000);
setInterval(pollLiveStatus, 6000);
pollWallet(); pollLedger(); pollStats(); pollPolicy(); pollLiveInfo();
if (state.walletConnected) pollLiveStatus();
loadMarketplace(); setTimeout(renderTrusted, 900);
</script>

<div id="toast" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:90;align-items:center;gap:11px;padding:14px 18px;border-radius:18px;border:1px solid rgba(143,227,180,0.22);background:rgba(20,26,23,0.9);backdrop-filter:blur(28px);box-shadow:0 20px 44px -18px rgba(0,0,0,0.9);animation:ottoRise .3s both">
  <div id="toastText" style="font-size:13px;color:rgba(242,241,246,0.85)"></div>
</div>
</body>
</html>`;
