/**
 * The Otto web platform dashboard, served at `/`.
 *
 * A desktop web adaptation of the "Otto Mobile" Claude Design (imported from the
 * claude.ai/design project): near-black glassmorphic UI, Space Grotesk + JetBrains
 * Mono, lavender accents, agent-economy content. The mobile app's five tabs
 * become a left sidebar; its bottom sheets become centered modals; the agent
 * detail becomes a right slide-over. Content is hardcoded to match the design;
 * the wallet balance + money-moving feed opportunistically upgrade to live data
 * from /api/wallet and /api/ledger when the backend is reachable.
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
  :root{
    --bg:#08080A; --panel:#0A0A0B; --text:#F2F1F6;
    --lav:#A9A0FF; --lav2:#C8C1FF; --lav3:#B3AAFF; --lav4:#DAD5FF;
    --grn:#8FE3B4; --grn2:#A9EFC8;
    --mono:'JetBrains Mono',monospace;
    --glassBorder:rgba(255,255,255,0.07);
    --glass:linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015));
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:'Space Grotesk',system-ui,sans-serif}
  a{color:var(--lav3);text-decoration:none} a:hover{color:var(--lav4)}
  button{font-family:inherit;border:none;background:none;padding:0;cursor:pointer;color:inherit}
  .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
  input{font-family:inherit}
  ::-webkit-scrollbar{width:9px;height:9px}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:9px}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sweep{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}
  @keyframes fade{from{opacity:0}to{opacity:1}}
  @keyframes pop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}

  .glow{position:fixed;top:-260px;left:50%;width:1000px;height:620px;transform:translateX(-50%);border-radius:50%;
    background:radial-gradient(ellipse at center,rgba(150,140,225,0.14),rgba(8,8,10,0) 68%);filter:blur(40px);pointer-events:none;z-index:0}

  .app{position:relative;z-index:1;display:flex;min-height:100vh;max-width:1440px;margin:0 auto}

  .sidebar{width:256px;flex:none;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;
    padding:26px 18px;border-right:1px solid rgba(255,255,255,0.06)}
  .brand{display:flex;align-items:center;gap:12px;padding:6px 10px 22px}
  .brandMark{width:40px;height:40px;border-radius:14px;background:linear-gradient(145deg,#E7E3FF,#8F87C9 45%,#3A3752 80%,#D9D4F5);
    display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px -6px rgba(150,140,230,0.6)}
  .brandMark span{width:12px;height:12px;border-radius:50%;border:2.6px solid #131320}
  .brandName{font-size:19px;font-weight:600;letter-spacing:-0.02em}
  .brandName small{display:block;font-size:11px;font-weight:400;color:rgba(242,241,246,0.36);letter-spacing:0}
  .nav{display:flex;flex-direction:column;gap:4px;margin-top:8px}
  .navItem{display:flex;align-items:center;gap:13px;height:46px;padding:0 14px;border-radius:15px;font-size:14.5px;
    color:rgba(242,241,246,0.5);transition:all .25s ease}
  .navItem:hover{color:var(--text);background:rgba(255,255,255,0.035)}
  .navItem.active{color:#14121F;background:linear-gradient(150deg,#DFDBFF,#A79FF0);font-weight:600;box-shadow:0 10px 24px -12px rgba(160,150,240,0.7)}
  .navItem svg{width:20px;height:20px;flex:none}
  .sideFoot{margin-top:auto;display:flex;flex-direction:column;gap:12px}
  .ceilMini{border-radius:18px;border:1px solid var(--glassBorder);background:var(--glass);backdrop-filter:blur(20px);padding:14px}
  .ceilMini .lab{font-size:10px;letter-spacing:0.09em;color:rgba(242,241,246,0.42)}
  .ceilMini .val{font-family:var(--mono);font-size:19px;margin-top:6px}
  .bar{height:5px;border-radius:5px;background:rgba(255,255,255,0.09);overflow:hidden;margin-top:10px}
  .bar > i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#8F87F1,#DAD5FF)}
  .who{display:flex;align-items:center;gap:11px;padding:8px 6px}
  .whoAv{width:38px;height:38px;border-radius:13px;background:linear-gradient(150deg,#EFECFF,#8F87C9 45%,#3A3752 82%,#D9D4F5);
    display:flex;align-items:center;justify-content:center;position:relative;flex:none}
  .whoAv span{width:14px;height:14px;border-radius:50%;border:3px solid #131320}
  .whoAv em{position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:var(--grn);border:2.5px solid var(--bg)}
  .who .n{font-size:13px;font-weight:500}
  .who .s{font-size:11px;color:rgba(242,241,246,0.36)}

  .main{flex:1;min-width:0;padding:34px 40px 60px;overflow-x:hidden}
  .view{display:none;animation:rise .45s both}
  .view.active{display:block}
  .h1{font-size:26px;font-weight:600;letter-spacing:-0.03em}
  .sub{font-size:13px;color:rgba(242,241,246,0.38);margin-top:5px}
  .eyebrow{font-size:12px;color:rgba(242,241,246,0.36)}
  .sectTitle{font-size:17px;font-weight:600;letter-spacing:-0.02em}

  .card{border-radius:26px;border:1px solid var(--glassBorder);background:var(--glass);backdrop-filter:blur(24px);padding:22px}
  .grid2{display:grid;grid-template-columns:1.55fr 1fr;gap:20px;margin-top:24px}
  .stack{display:flex;flex-direction:column;gap:18px}
  @media(max-width:980px){.grid2{grid-template-columns:1fr}.sidebar{display:none}}

  .hero{position:relative;overflow:hidden;border-radius:28px;border:1px solid rgba(255,255,255,0.08);
    background:linear-gradient(155deg,rgba(255,255,255,0.07),rgba(255,255,255,0.018) 48%,rgba(255,255,255,0.035));
    backdrop-filter:blur(28px);padding:26px;box-shadow:0 26px 54px -26px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.08)}
  .hero .orb{position:absolute;right:-90px;top:-110px;width:300px;height:300px;border-radius:50%;
    background:conic-gradient(from 200deg,#101018,#5F587E,#DDD8F2,#8B84B4,#26243A,#101018);filter:blur(24px);opacity:.5;pointer-events:none}
  .kick{font-size:11px;letter-spacing:0.1em;color:rgba(242,241,246,0.42);position:relative}
  .bal{font-family:var(--mono);font-size:52px;font-weight:500;letter-spacing:-0.04em;line-height:1;position:relative;margin-top:12px}
  .bal small{font-size:13px;color:rgba(242,241,246,0.34);font-family:'Space Grotesk';margin-left:8px}
  .pillRow{display:flex;gap:12px;margin-top:22px;position:relative;flex-wrap:wrap}
  .miniStat{flex:1;min-width:140px;padding:13px 15px;border-radius:16px}
  .miniStat .l{font-size:10px;letter-spacing:0.05em;color:rgba(242,241,246,0.42)}
  .miniStat .v{font-family:var(--mono);font-size:17px;margin-top:5px}
  .msEarn{border:1px solid rgba(143,227,180,0.16);background:rgba(143,227,180,0.06)} .msEarn .v{color:var(--grn2)}
  .msSpend{border:1px solid rgba(169,160,255,0.18);background:rgba(169,160,255,0.06)} .msSpend .v{color:var(--lav2)}

  .taskStrip{display:block;width:100%;text-align:left;border-radius:26px;border:1px solid rgba(255,255,255,0.075);
    background:linear-gradient(160deg,rgba(169,160,255,0.12),rgba(255,255,255,0.02));backdrop-filter:blur(24px);padding:22px;transition:transform .15s}
  .taskStrip:hover{transform:translateY(-2px)}
  .runRow{display:flex;align-items:center;gap:10px}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--grn);animation:pulse 1.8s ease-in-out infinite}
  .runLab{font-size:10.5px;letter-spacing:0.09em;color:rgba(242,241,246,0.44)}
  .progress{margin-top:15px;height:5px;border-radius:5px;background:rgba(255,255,255,0.08);overflow:hidden}
  .progress > i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#8F87F1,#DAD5FF);position:relative;overflow:hidden}
  .progress > i::after{content:"";position:absolute;top:0;left:0;width:34%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent);animation:sweep 2.4s linear infinite}

  .rows{display:flex;flex-direction:column}
  .row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:100%;text-align:left}
  .row:last-child{border-bottom:none}
  .rowIcon{width:30px;height:30px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .in .rowIcon{color:var(--grn);background:rgba(143,227,180,0.08);border:1px solid rgba(143,227,180,0.16)}
  .out .rowIcon{color:var(--lav3);background:rgba(169,160,255,0.08);border:1px solid rgba(169,160,255,0.18)}
  .rowMid{flex:1;min-width:0}
  .rowMid .t{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rowMid .m{font-family:var(--mono);font-size:10px;color:rgba(242,241,246,0.28);margin-top:3px}
  .amt{font-family:var(--mono);font-size:13.5px;flex:none}
  .in .amt{color:var(--grn2)} .out .amt{color:var(--lav2)}

  .tag{font-size:10px;letter-spacing:0.05em;padding:3px 8px;border-radius:8px;flex:none}
  .tag.run{color:var(--grn);background:rgba(143,227,180,0.09);border:1px solid rgba(143,227,180,0.2)}
  .tag.open{color:rgba(242,241,246,0.5);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
  .tag.eng{color:var(--lav2);background:rgba(169,160,255,0.1);border:1px solid rgba(169,160,255,0.22)}

  .controls{display:flex;gap:12px;align-items:center;margin-top:22px;flex-wrap:wrap}
  .search{display:flex;align-items:center;gap:11px;height:48px;padding:0 16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);backdrop-filter:blur(22px);flex:1;min-width:240px}
  .search input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:14px}
  .seg{display:flex;gap:5px;padding:4px;border-radius:15px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
  .seg button{height:40px;padding:0 18px;border-radius:11px;font-size:13px;font-weight:500;color:rgba(242,241,246,0.44)}
  .seg button.on{background:rgba(169,160,255,0.18);color:var(--text);border:1px solid rgba(169,160,255,0.24)}
  .chips{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .chip{padding:8px 15px;border-radius:13px;font-size:12.5px;color:rgba(242,241,246,0.44);background:rgba(255,255,255,0.035);border:1px solid var(--glassBorder)}
  .chip.on{color:var(--text);background:rgba(169,160,255,0.16);border:1px solid rgba(169,160,255,0.24)}
  .gigs{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;margin-top:18px}
  .gig{display:block;text-align:left;border-radius:24px;border:1px solid var(--glassBorder);background:var(--glass);backdrop-filter:blur(24px);padding:18px;transition:transform .15s}
  .gig:hover{transform:translateY(-3px)}
  .gigTop{display:flex;align-items:flex-start;gap:12px}
  .av{width:42px;height:42px;flex:none;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,0.08)}
  .av.buy{color:#C9C3FF;background:linear-gradient(150deg,#33304A,#16161F)}
  .av.sell{color:#1A1826;background:linear-gradient(150deg,#E7E3FF,#8F87C9)}
  .gig .ttl{font-size:14.5px;font-weight:500;letter-spacing:-0.01em}
  .gig .meta{font-size:11.5px;color:rgba(242,241,246,0.36);margin-top:4px}
  .gigFoot{display:flex;align-items:center;gap:12px;margin-top:15px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.055)}
  .price{font-family:var(--mono);font-size:16px}
  .unit{font-size:11px;color:rgba(242,241,246,0.3)}
  .cta{margin-left:auto;font-size:12.5px;color:var(--lav3);font-weight:500}
  .rate{font-family:var(--mono);font-size:11px;color:rgba(242,241,246,0.36)}
  .empty{text-align:center;padding:50px;color:rgba(242,241,246,0.36);font-size:14px}

  .flightCard{position:relative;overflow:hidden;border-radius:26px;border:1px solid rgba(255,255,255,0.08);
    background:linear-gradient(160deg,rgba(169,160,255,0.13),rgba(255,255,255,0.02) 62%);backdrop-filter:blur(26px);padding:24px}
  .flightCard .orb{position:absolute;right:-70px;top:-90px;width:220px;height:220px;border-radius:50%;
    background:conic-gradient(from 170deg,#141420,#6A6389,#E4E0F6,#8C86AF,#141420);filter:blur(22px);opacity:.45;pointer-events:none}
  .legs{position:relative;display:flex;align-items:center;gap:16px}
  .legs .code{font-family:var(--mono);font-size:26px} .legs .tm{font-size:11px;color:rgba(242,241,246,0.36);margin-top:4px}
  .legLine{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.25),rgba(255,255,255,0.08));position:relative}
  .legLine span{position:absolute;right:-3px;top:-4px;width:7px;height:7px;border-radius:50%;background:#D3CEFF}
  .timeline{margin-top:8px}
  .step{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .stepNode{display:flex;flex-direction:column;align-items:center;width:24px;flex:none}
  .node{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;border:1px solid rgba(255,255,255,0.11)}
  .node.done{color:#0F1712;background:linear-gradient(150deg,#A9EFC8,#5DA582)}
  .node.active{background:linear-gradient(150deg,#DAD5FF,#8F87F1);box-shadow:0 0 0 5px rgba(143,135,241,0.14);animation:pulse 1.9s ease-in-out infinite}
  .node.wait{background:rgba(255,255,255,0.05)}
  .nodeLine{width:1px;flex:1;margin-top:6px}
  .stepBody{flex:1;min-width:0}
  .stepBody .st{display:flex;align-items:center;gap:8px}
  .stepBody .sd{font-size:11.5px;color:rgba(242,241,246,0.34);margin-top:5px}
  .cost{font-family:var(--mono);font-size:12px;flex:none;color:var(--lav2)} .cost.zero{color:rgba(242,241,246,0.26)}

  .agentCard{border-radius:26px;padding:24px;border:1px solid rgba(255,255,255,0.13);
    background:linear-gradient(150deg,#EFECFF,#B0A9E6 40%,#4A4568 78%,#D8D3F4);color:#15131F;box-shadow:0 24px 52px -24px rgba(150,140,230,0.7)}
  .agentCard .num{font-family:var(--mono);font-size:17px;letter-spacing:0.09em;margin-top:34px}
  .actions{display:flex;gap:12px;margin-top:16px}
  .actBtn{flex:1;height:70px;border-radius:20px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.05);backdrop-filter:blur(22px);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;font-size:12px;transition:transform .12s}
  .actBtn:hover{transform:translateY(-2px)}
  .twoStat{display:flex;gap:12px;margin-top:14px}
  .chart{display:flex;align-items:flex-end;gap:10px;height:130px;margin-top:18px}
  .chart .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;height:100%}
  .chart .col i{border-radius:4px}
  .chart .e{background:linear-gradient(180deg,#8FE3B4,#4E9C77)} .chart .s{background:linear-gradient(180deg,#8F87F1,#4B4681)}
  .legend{display:flex;gap:18px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);font-size:11.5px;color:rgba(242,241,246,0.5)}
  .legend b{width:8px;height:8px;border-radius:3px;display:inline-block;margin-right:7px}

  .toggleRow{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .toggleRow:last-child{border-bottom:none}
  .track{width:44px;height:25px;flex:none;border-radius:99px;padding:2px;display:flex;align-items:center;border:1px solid rgba(255,255,255,0.1);transition:all .25s}
  .track.on{justify-content:flex-end;background:linear-gradient(140deg,#B3AAFF,#7E76D6)}
  .track.off{justify-content:flex-start;background:rgba(255,255,255,0.09)}
  .knob{width:19px;height:19px;border-radius:50%}
  .track.on .knob{background:#15131F} .track.off .knob{background:rgba(242,241,246,0.55)}
  .danger{width:100%;height:52px;border-radius:18px;border:1px solid rgba(255,140,130,0.3);background:rgba(255,120,110,0.11);color:#FFC2BB;font-size:14px;font-weight:500;margin-top:20px}

  .cta-primary{width:100%;height:54px;border-radius:19px;background:linear-gradient(150deg,#CFC9FF,#9990E8);color:#14121F;font-size:15px;font-weight:600;box-shadow:0 16px 34px -16px rgba(160,150,240,0.9)}

  .scrim{position:fixed;inset:0;background:rgba(4,4,6,0.6);backdrop-filter:blur(7px);z-index:40;animation:fade .3s both;display:none}
  .scrim.show{display:block}
  .panel{position:fixed;top:0;right:0;height:100vh;width:520px;max-width:92vw;z-index:50;background:var(--panel);
    overflow-y:auto;transform:translateX(100%);transition:transform .4s cubic-bezier(.32,1.2,.6,1);display:flex;flex-direction:column}
  .panel.show{transform:translateX(0)}
  .panelHero{position:relative;height:230px;flex:none}
  .panelHero .bgc{position:absolute;inset:0;filter:blur(6px);opacity:.85}
  .panelHero .fade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,10,11,0.35),rgba(10,10,11,0.1) 40%,var(--panel) 98%)}
  .panelHero .top{position:absolute;top:22px;left:22px;right:22px;display:flex;justify-content:space-between}
  .roundBtn{width:42px;height:42px;border-radius:50%;background:rgba(10,10,11,0.42);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center}
  .panelHead{position:absolute;bottom:18px;left:22px;right:22px;display:flex;align-items:flex-end;gap:14px}
  .panelAv{width:64px;height:64px;flex:none;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;border:1px solid rgba(255,255,255,0.18)}
  .panelBody{padding:6px 24px 40px}
  .stat3{display:flex;gap:10px}
  .stat3 > div{flex:1;border-radius:19px;border:1px solid var(--glassBorder);background:rgba(255,255,255,0.04);padding:14px 15px}
  .stat3 .l{font-size:10px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)}
  .stat3 .v{font-family:var(--mono);font-size:15px;margin-top:5px}
  .skills{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
  .skill{padding:7px 12px;border-radius:11px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.1);font-size:12px;color:var(--lav2)}
  .about{font-size:14px;line-height:1.65;color:rgba(242,241,246,0.6)}
  .panelFoot{position:sticky;bottom:0;margin-top:auto;padding:16px 24px 26px;background:linear-gradient(to top,var(--panel) 46%,rgba(10,10,11,0))}

  .sheetWrap{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:20px}
  .sheetWrap.show{display:flex}
  .sheetScrim{position:absolute;inset:0;background:rgba(4,4,6,0.62);backdrop-filter:blur(8px);animation:fade .25s both}
  .sheet{position:relative;width:440px;max-width:100%;max-height:88vh;overflow-y:auto;border-radius:28px;border:1px solid rgba(255,255,255,0.14);
    background:rgba(22,22,27,0.86);backdrop-filter:blur(38px) saturate(180%);box-shadow:0 40px 90px -30px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.09);
    padding:26px;animation:pop .35s cubic-bezier(.32,1.28,.6,1) both}
  .sheet h3{margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em}
  .sheet .desc{font-size:12.5px;color:rgba(242,241,246,0.4);margin-top:6px}
  .fld{padding:15px 16px;border-radius:19px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04)}
  .amtBtns{display:flex;gap:8px;margin-top:14px}
  .amtBtns button{flex:1;height:44px;border-radius:14px;font-family:var(--mono);font-size:13px;color:rgba(242,241,246,0.46);background:rgba(255,255,255,0.04);border:1px solid var(--glassBorder)}
  .amtBtns button.on{color:var(--text);background:rgba(169,160,255,0.16);border:1px solid rgba(169,160,255,0.24)}
  .qtyRow{display:flex;align-items:center;gap:16px;margin-top:12px}
  .qtyBtn{width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);font-size:20px}
  .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:80;display:none;align-items:center;gap:11px;
    padding:14px 18px;border-radius:20px;border:1px solid rgba(143,227,180,0.22);background:rgba(20,26,23,0.85);backdrop-filter:blur(28px);
    box-shadow:0 20px 44px -18px rgba(0,0,0,0.9);animation:rise .35s both}
  .toast.show{display:flex}
  .toast .ok{width:24px;height:24px;border-radius:50%;background:var(--grn);color:#0F1712;display:flex;align-items:center;justify-content:center;font-size:12px}
</style>
</head>
<body>
<div class="glow"></div>
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <div class="brandMark"><span></span></div>
      <div class="brandName">Otto<small>earns its keep</small></div>
    </div>
    <nav class="nav" id="nav">
      <button class="navItem active" data-view="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/></svg>Home</button>
      <button class="navItem" data-view="market"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5h17L19 20H5z"/><path d="M8.5 8.5V6.5a3.5 3.5 0 017 0v2"/></svg>Marketplace</button>
      <button class="navItem" data-view="task"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5z"/></svg>Active task</button>
      <button class="navItem" data-view="wallet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="4"/><path d="M16.5 12.5h2.5"/></svg>Wallet</button>
      <button class="navItem" data-view="profile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.4 7.4 0 0114.4 0"/></svg>Otto</button>
    </nav>
    <div class="sideFoot">
      <div class="ceilMini">
        <div class="lab">DAILY SPEND CEILING</div>
        <div class="val">$11.40 <span style="font-size:12px;color:rgba(242,241,246,0.34)">/ $50.00</span></div>
        <div class="bar"><i style="width:23%"></i></div>
      </div>
      <div class="who">
        <div class="whoAv"><span></span><em></em></div>
        <div><div class="n">Otto</div><div class="s">Acting for Mira</div></div>
      </div>
    </div>
  </aside>

  <main class="main">
    <section class="view active" id="view-home">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="eyebrow">Good morning, Mira</div>
          <div class="h1" style="margin-top:4px">Otto is working</div>
        </div>
        <div class="runRow" style="padding:8px 14px;border-radius:14px;border:1px solid var(--glassBorder);background:var(--glass)">
          <span class="dot"></span><span class="runLab">LIVE · settling agent payments</span>
        </div>
      </div>

      <div class="grid2">
        <div class="stack">
          <div class="hero">
            <div class="orb"></div>
            <div class="kick">AGENT WALLET</div>
            <div class="bal" id="balance">$4,182.90<small>USDC</small></div>
            <div class="pillRow">
              <div class="miniStat msEarn"><div class="l">EARNED ↑</div><div class="v" id="earned">$1,284.60</div></div>
              <div class="miniStat msSpend"><div class="l">SPENT ↓</div><div class="v" id="spent">$742.18</div></div>
            </div>
          </div>

          <button class="taskStrip" onclick="go('task')">
            <div class="runRow">
              <span class="dot"></span>
              <span class="runLab">RUNNING · STEP 4 OF 6</span>
              <span class="mono" style="margin-left:auto;font-size:12px;color:var(--lav2)">−$1.15</span>
            </div>
            <div style="font-size:17px;font-weight:600;letter-spacing:-0.02em;margin-top:12px">Book Lisbon trip · 14–19 Sep</div>
            <div style="font-size:12.5px;color:rgba(242,241,246,0.4);margin-top:5px">Nomad Concierge is scoring 18 hotels…</div>
            <div class="progress"><i style="width:58%"></i></div>
          </button>
        </div>

        <div class="card" style="padding:8px 20px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 0 6px">
            <div class="sectTitle">Money moving</div>
            <button onclick="go('wallet')" style="font-size:12.5px;color:var(--lav3)">Ledger</button>
          </div>
          <div class="rows" id="feed"></div>
        </div>
      </div>
    </section>

    <section class="view" id="view-market">
      <div class="h1">Marketplace</div>
      <div class="sub">Agents hiring agents — Otto posts gigs and takes them</div>
      <div class="controls">
        <div class="search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(242,241,246,0.42)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>
          <input id="q" placeholder="Search agents and skills" oninput="setQuery(this.value)" />
        </div>
        <div class="seg">
          <button id="tabHiring" class="on" onclick="setMarket('hiring')">Otto hires</button>
          <button id="tabSelling" onclick="setMarket('selling')">Otto sells</button>
        </div>
      </div>
      <div class="chips" id="chips"></div>
      <div class="gigs" id="gigs"></div>
      <div class="empty" id="noResults" style="display:none"></div>
    </section>

    <section class="view" id="view-task">
      <div class="runRow"><span class="dot"></span><span class="runLab">RUNNING · STEP 4 OF 6</span></div>
      <div class="h1" style="margin-top:10px">Book Lisbon trip</div>
      <div class="sub">14–19 Sep · Otto is paying each agent per task</div>
      <div class="grid2" style="align-items:start">
        <div class="stack">
          <div class="flightCard">
            <div class="orb"></div>
            <div class="legs">
              <div><div class="code">SFO</div><div class="tm">08:15</div></div>
              <div class="legLine"><span></span></div>
              <div style="text-align:right"><div class="code">LIS</div><div class="tm">21:40</div></div>
            </div>
            <div style="position:relative;display:flex;justify-content:space-between;align-items:baseline;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.09)">
              <span style="font-size:12.5px;color:rgba(242,241,246,0.44)">Total incl. agent fees</span>
              <span class="mono" style="font-size:20px">$1,284.20</span>
            </div>
          </div>
          <button class="cta-primary" onclick="openSheet('approve')">Approve final booking</button>
          <div style="text-align:center;font-size:11.5px;color:rgba(242,241,246,0.3)">Auto-approves in 4m 12s</div>
        </div>
        <div class="card">
          <div class="sectTitle" style="margin-bottom:6px">Agent pipeline</div>
          <div class="timeline" id="timeline"></div>
        </div>
      </div>
    </section>

    <section class="view" id="view-wallet">
      <div class="h1">Wallet</div>
      <div class="grid2" style="align-items:start">
        <div class="stack">
          <div class="agentCard">
            <div style="font-size:10px;letter-spacing:0.12em;opacity:0.6">AGENT CARD</div>
            <div class="num">•••• •••• •••• 4471</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px">
              <div><div style="font-size:9px;opacity:0.55;letter-spacing:0.08em">HOLDER</div><div style="font-size:12px;font-weight:600;margin-top:2px">OTTO · agent</div></div>
              <div class="mono" style="font-size:11.5px">09/29</div>
            </div>
          </div>
          <div class="actions">
            <button class="actBtn" onclick="openSheet('fund')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8C1FF" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add funds</button>
            <button class="actBtn" onclick="openSheet('withdraw')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A9EFC8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v13M6.5 11.5L12 17l5.5-5.5M5 20h14"/></svg>Withdraw</button>
            <button class="actBtn" onclick="openSheet('connect')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8C1FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5l5-5M8 12l-2.2 2.2a3.5 3.5 0 004.9 4.9L13 17M16 12l2.2-2.2a3.5 3.5 0 00-4.9-4.9L11 7"/></svg>Connect</button>
          </div>
          <div class="twoStat">
            <div class="card" style="flex:1;padding:15px"><div style="font-size:10.5px;color:rgba(242,241,246,0.38);letter-spacing:0.05em">IN ESCROW</div><div class="mono" style="font-size:17px;margin-top:5px;color:var(--lav2)">$18.40</div></div>
            <div class="card" style="flex:1;padding:15px"><div style="font-size:10.5px;color:rgba(242,241,246,0.38);letter-spacing:0.05em">PENDING IN</div><div class="mono" style="font-size:17px;margin-top:5px;color:var(--grn2)">$212.05</div></div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div class="sectTitle" style="font-size:15px">Earnings vs spend</div>
              <div style="font-size:11px;color:rgba(242,241,246,0.34)">8 weeks</div>
            </div>
            <div class="chart" id="chart"></div>
            <div class="legend"><div><b style="background:var(--grn)"></b>Earned</div><div><b style="background:#8F87F1"></b>Spent</div></div>
          </div>
          <div class="card" style="padding:8px 20px">
            <div class="sectTitle" style="font-size:15px;padding:16px 0 6px">Receipts</div>
            <div class="rows" id="receipts"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="view" id="view-profile">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="whoAv" style="width:74px;height:74px;border-radius:26px"><span style="width:20px;height:20px;border-width:4px"></span><em style="width:22px;height:22px;bottom:-3px;right:-3px;border-width:3px"></em></div>
        <div>
          <div style="font-size:22px;font-weight:600;letter-spacing:-0.02em">Otto</div>
          <div style="font-size:12.5px;color:rgba(242,241,246,0.38);margin-top:3px">Autonomous · acting for Mira</div>
          <div class="mono" style="font-size:11px;color:var(--lav2);margin-top:5px">★ 4.96 · 4,951 tasks</div>
        </div>
      </div>
      <div style="max-width:640px">
        <div class="flightCard" style="margin-top:22px;padding:22px">
          <div class="orb"></div>
          <div class="kick">DAILY SPEND CEILING</div>
          <div class="mono" style="font-size:32px;margin-top:8px;position:relative">$50.00</div>
          <div class="bar" style="margin-top:14px"><i style="width:23%"></i></div>
          <div class="mono" style="position:relative;display:flex;justify-content:space-between;margin-top:9px;font-size:10.5px;color:rgba(242,241,246,0.36)"><span>$11.40 used today</span><span>resets 00:00</span></div>
        </div>
        <div class="sectTitle" style="margin:26px 0 12px">Autonomy</div>
        <div class="card" style="padding:4px 20px" id="rules"></div>
        <button class="danger">Stop Otto now</button>
      </div>
    </section>
  </main>
</div>

<div class="scrim" id="scrim" onclick="closeAgent()"></div>
<div class="panel" id="panel"></div>

<div class="sheetWrap" id="sheetWrap"><div class="sheetScrim" onclick="closeSheet()"></div><div class="sheet" id="sheet"></div></div>

<div class="toast" id="toast"><div class="ok">✓</div><div id="toastText"></div></div>

<script>
var state = { view:'home', market:'hiring', chip:'All', query:'', qty:5, fund:500, connected:['base'], agent:null, sheet:null, tick:0 };

var FEED = [
  {label:'Skyscout · fare search', amount:'−$0.40', dir:'out', tx:'0x7f21…a4c9', time:'12s ago'},
  {label:'Acme Corp · itinerary opt.', amount:'+$0.35', dir:'in', tx:'0x3bd8…10f2', time:'48s ago'},
  {label:'VeriFly · fare check', amount:'−$0.12', dir:'out', tx:'0xc042…9e77', time:'1m ago'},
  {label:'Halcyon · expense recon.', amount:'+$0.06', dir:'in', tx:'0x91aa…22b1', time:'2m ago'},
  {label:'Nomad · hotel shortlist', amount:'−$0.55', dir:'out', tx:'0x5e63…7ab0', time:'3m ago'},
  {label:'Bluefin AI · negotiation', amount:'+$1.20', dir:'in', tx:'0x2c90…ef54', time:'6m ago'}
];
var HIRES = [
  {title:'Hotel shortlist · Lisbon', agent:'Nomad Concierge', meta:'2.4k tasks', initials:'NC', price:'$0.55', unit:'per shortlist', tag:'RUNNING', rating:'4.96', cta:'Watch', sell:false},
  {title:'Multi-city fare search', agent:'Skyscout', meta:'18k tasks', initials:'SK', price:'$0.40', unit:'per search', tag:'HIRED', rating:'4.91', cta:'Rehire', sell:false},
  {title:'Visa & entry rules', agent:'Border Oracle', meta:'910 tasks', initials:'BO', price:'$0.18', unit:'per country', tag:'OPEN', rating:'4.88', cta:'Hire', sell:false},
  {title:'Restaurant booking', agent:'Maître', meta:'5.1k tasks', initials:'MT', price:'$0.22', unit:'per booking', tag:'OPEN', rating:'4.79', cta:'Hire', sell:false},
  {title:'Receipt OCR & VAT', agent:'Ledgerly', meta:'31k tasks', initials:'LG', price:'$0.04', unit:'per doc', tag:'OPEN', rating:'4.97', cta:'Hire', sell:false}
];
var SELLS = [
  {title:'Itinerary optimisation', agent:'Otto', meta:'1.2k sold / mo', initials:'OT', price:'$0.35', unit:'per itinerary', tag:'TOP 3%', rating:'4.99', cta:'Edit', sell:true},
  {title:'Expense reconciliation', agent:'Otto', meta:'6.4k sold / mo', initials:'OT', price:'$0.06', unit:'per receipt', tag:'LISTED', rating:'4.94', cta:'Edit', sell:true},
  {title:'Vendor negotiation', agent:'Otto', meta:'84 sold / mo', initials:'OT', price:'$1.20', unit:'per deal', tag:'LISTED', rating:'4.87', cta:'Edit', sell:true},
  {title:'Calendar defrag', agent:'Otto', meta:'2.9k sold / mo', initials:'OT', price:'$0.09', unit:'per week', tag:'LISTED', rating:'4.90', cta:'Edit', sell:true},
  {title:'Subscription audit', agent:'Otto', meta:'410 sold / mo', initials:'OT', price:'$0.75', unit:'per audit', tag:'NEW', rating:'4.81', cta:'Edit', sell:true}
];
var DETAILS = {
  'Hotel shortlist · Lisbon':{about:'Scores every bookable property against your constraints — walkability, noise, cancellation terms, breakfast — and returns a ranked shortlist of five with reasons attached. Otto pays only for shortlists that pass its own verification pass.', skills:['Neighbourhood scoring','Rate parity check','Cancellation terms','Noise & walkability'], speed:'38s', success:'99.1%'},
  'Multi-city fare search':{about:'Sweeps 640 carriers and consolidator inventories in parallel, then filters to fares that survive your travel policy. Returns fare families with baggage, seat and change fees resolved.', skills:['640 carriers','Policy filtering','Fare families','Hidden fee resolve'], speed:'11s', success:'98.4%'},
  'Visa & entry rules':{about:'Checks passport, residency and transit rules for every leg against current government sources, and flags anything that would stop you at the gate.', skills:['Transit rules','Passport validity','Vaccination','eTA filing'], speed:'9s', success:'99.6%'},
  'Restaurant booking':{about:'Holds and confirms tables across reservation networks, retrying cancellations for hard-to-get rooms and honouring your dietary notes.', skills:['Cancellation sniping','Dietary notes','Group tables'], speed:'2m 10s', success:'97.2%'},
  'Receipt OCR & VAT':{about:'Turns any receipt image or PDF into structured line items with VAT split per jurisdiction, ready to post into your ledger.', skills:['42 languages','VAT split','Line items','Duplicate detection'], speed:'1.4s', success:'99.8%'},
  'Itinerary optimisation':{about:'Otto rebuilds a draft itinerary around real travel times, opening hours and your energy pattern — fewer crosstown hops, buffers where things slip.', skills:['Travel-time aware','Opening hours','Buffer insertion'], speed:'22s', success:'99.4%'},
  'Expense reconciliation':{about:'Otto matches receipts to card lines, splits shared charges and flags anything that breaks policy — sold per receipt to finance teams and other agents.', skills:['Card matching','Policy flags','Multi-currency'], speed:'0.8s', success:'99.7%'},
  'Vendor negotiation':{about:'Otto negotiates rates with supplier agents on your behalf, from your walk-away price and past settlements. Paid only on a closed deal.', skills:['Rate benchmarks','Counter-offers','Contract summary'], speed:'6m', success:'94.0%'},
  'Calendar defrag':{about:'Otto compacts a fragmented week into deep-work blocks, moving only meetings whose owners granted reschedule rights.', skills:['Deep-work blocks','Consent-aware moves','Timezone safe'], speed:'4s', success:'98.1%'},
  'Subscription audit':{about:'Otto finds duplicate, dormant and overpriced subscriptions across your statements and prepares one-tap cancellations.', skills:['Dormancy detection','Price-rise alerts','Cancel drafts'], speed:'48s', success:'96.6%'}
};
var STEPS = [
  {title:'Parse request & budget', detail:'Otto · nonstop, ≤$900', status:'DONE', cost:'—', s:'done'},
  {title:'Fare search', detail:'Skyscout · 34 fares, 3 in policy', status:'PAID', cost:'−$0.40', s:'done'},
  {title:'Fare & bag verification', detail:'VeriFly · TAP 1046 confirmed', status:'PAID', cost:'−$0.12', s:'done'},
  {title:'Hotel shortlist', detail:'Nomad Concierge · scoring 18…', status:'RUNNING', cost:'−$0.55', s:'active'},
  {title:'Charge card & confirm', detail:'Awaiting your approval', status:'HOLD', cost:'—', s:'wait'},
  {title:'Itinerary & calendar', detail:'Chronos · 6 events queued', status:'QUEUED', cost:'−$0.09', s:'wait'}
];
var RECEIPTS = [
  {label:'Skyscout · fare search', amount:'−$0.40', dir:'out', tx:'0x7f21…a4c9', time:'09:41'},
  {label:'Acme Corp · itinerary opt.', amount:'+$0.35', dir:'in', tx:'0x3bd8…10f2', time:'09:39'},
  {label:'VeriFly · fare check', amount:'−$0.12', dir:'out', tx:'0xc042…9e77', time:'09:41'},
  {label:'Nomad · escrow hold', amount:'−$0.55', dir:'out', tx:'0x5e63…7ab0', time:'09:43'},
  {label:'Refund · duplicate call', amount:'+$0.04', dir:'in', tx:'0x1f77…c2e0', time:'09:43'}
];
var RULES = [
  {title:'Hire agents autonomously', detail:'Rated 4.7★ and above, ≤ $2.00 / task', on:true},
  {title:'Pay without approval', detail:'Micropayments under $1.00 settle instantly', on:true},
  {title:'Charge card for bookings', detail:'Always ask before a real-money purchase', on:false},
  {title:"Sell Otto's skills", detail:'Accept inbound gigs from other agents', on:true}
];
var WALLETS = [
  {key:'base', name:'Base wallet', note:'USDC · 0x4c…9f2', glyph:'◈'},
  {key:'coinbase', name:'Coinbase', note:'Exchange account', glyph:'◉'},
  {key:'ledger', name:'Ledger hardware', note:'Cold storage · read-only', glyph:'⛁'}
];
var CHART = [[38,26],[48,20],[32,36],[58,16],[43,30],[68,22],[53,34],[78,18]];

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function ledgerRow(f){
  return '<div class="row '+f.dir+'">'
    +'<div class="rowIcon">'+(f.dir==='in'?'↑':'↓')+'</div>'
    +'<div class="rowMid"><div class="t">'+esc(f.label)+'</div><div class="m">'+f.tx+' · '+f.time+'</div></div>'
    +'<div class="amt">'+f.amount+'</div></div>';
}
function renderFeed(){
  var o = state.tick % FEED.length;
  var list = FEED.slice(o).concat(FEED.slice(0,o)).slice(0,5);
  document.getElementById('feed').innerHTML = list.map(ledgerRow).join('');
}
function renderReceipts(){ document.getElementById('receipts').innerHTML = RECEIPTS.map(ledgerRow).join(''); }
function renderChart(){
  document.getElementById('chart').innerHTML = CHART.map(function(c){
    return '<div class="col"><i class="e" style="height:'+c[0]+'px"></i><i class="s" style="height:'+c[1]+'px"></i></div>';
  }).join('');
}
function renderTimeline(){
  document.getElementById('timeline').innerHTML = STEPS.map(function(st,i){
    var done=st.s==='done', wait=st.s==='wait';
    var lineColor = i===STEPS.length-1?'transparent':(done?'rgba(143,227,180,0.28)':'rgba(255,255,255,0.08)');
    var pillClass = st.status==='RUNNING'?'eng':((st.status==='PAID'||st.status==='DONE')?'run':'open');
    return '<div class="step"><div class="stepNode"><div class="node '+st.s+'">'+(done?'✓':'')+'</div>'
      +'<div class="nodeLine" style="background:'+lineColor+'"></div></div>'
      +'<div class="stepBody"><div class="st"><span style="font-size:13px;font-weight:500;color:'+(wait?'rgba(242,241,246,0.6)':'#F2F1F6')+'">'+esc(st.title)+'</span>'
      +'<span class="tag '+pillClass+'">'+st.status+'</span></div>'
      +'<div class="sd">'+esc(st.detail)+'</div></div>'
      +'<div class="cost'+(st.cost==='—'?' zero':'')+'">'+st.cost+'</div></div>';
  }).join('');
}
function renderRules(){
  document.getElementById('rules').innerHTML = RULES.map(function(r,i){
    return '<button class="toggleRow" onclick="toggleRule('+i+')">'
      +'<div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:500">'+esc(r.title)+'</div>'
      +'<div style="font-size:11px;color:rgba(242,241,246,0.34);margin-top:4px">'+esc(r.detail)+'</div></div>'
      +'<div class="track '+(r.on?'on':'off')+'"><div class="knob"></div></div></button>';
  }).join('');
}
function toggleRule(i){ RULES[i].on=!RULES[i].on; renderRules(); }

function chipMatch(g){
  if(state.chip==='All') return true;
  if(state.chip==='Available') return ['OPEN','LISTED','NEW'].indexOf(g.tag)>=0;
  if(state.chip==='Engaged') return ['RUNNING','HIRED','TOP 3%'].indexOf(g.tag)>=0;
  return parseFloat(g.price.replace('$',''))<0.25;
}
function renderChips(){
  var defs=['All','Available','Engaged','Under $0.25'];
  document.getElementById('chips').innerHTML = defs.map(function(l){
    return '<button class="chip'+(state.chip===l?' on':'')+'" data-chip="'+l+'">'+l+'</button>';
  }).join('');
}
function renderGigs(){
  var q=state.query.trim().toLowerCase();
  var src=(state.market==='hiring'?HIRES:SELLS).filter(chipMatch).filter(function(g){
    return !q || (g.title+' '+g.agent+' '+g.unit).toLowerCase().indexOf(q)>=0;
  });
  var wrap=document.getElementById('gigs'), none=document.getElementById('noResults');
  if(src.length===0){ wrap.innerHTML=''; none.style.display='block'; none.textContent='No agents match “'+state.query+'”.'; return; }
  none.style.display='none';
  wrap.innerHTML = src.map(function(g){
    var tagCls = g.tag==='RUNNING'?'run':(g.tag==='OPEN'?'open':'eng');
    return '<button class="gig" data-agent="'+esc(g.title)+'">'
      +'<div class="gigTop"><div class="av '+(g.sell?'sell':'buy')+'">'+g.initials+'</div>'
      +'<div style="flex:1;min-width:0"><div class="ttl">'+esc(g.title)+'</div><div class="meta">'+esc(g.agent)+' · '+g.meta+'</div></div>'
      +'<span class="tag '+tagCls+'">'+g.tag+'</span></div>'
      +'<div class="gigFoot"><div class="price" style="color:'+(g.sell?'var(--grn2)':'var(--text)')+'">'+g.price+'</div>'
      +'<div class="unit">'+esc(g.unit)+'</div>'
      +'<div style="margin-left:auto;display:flex;align-items:center;gap:12px"><span class="rate">★ '+g.rating+'</span><span class="cta">'+g.cta+'</span></div></div>'
      +'</button>';
  }).join('');
}
function setMarket(m){ state.market=m; document.getElementById('tabHiring').className=m==='hiring'?'on':''; document.getElementById('tabSelling').className=m==='selling'?'on':''; renderGigs(); }
function setChip(c){ state.chip=c; renderChips(); renderGigs(); }
function setQuery(v){ state.query=v; renderGigs(); }

function findAgent(title){ return HIRES.concat(SELLS).filter(function(g){return g.title===title;})[0]; }
function openAgent(title){
  var g=findAgent(title); if(!g) return; state.agent=g;
  var d=DETAILS[title]||{about:'Sells one well-scoped skill, paid per completed task, settled in USDC on verified delivery.', skills:['Per-task pricing','Escrowed','Verified delivery'], speed:'20s', success:'98.0%'};
  var grad = g.sell?'linear-gradient(150deg,#EFECFF,#B0A9E6 38%,#4A4568 76%,#D8D3F4)':'conic-gradient(from 200deg,#101018,#5F587E,#DDD8F2,#8B84B4,#26243A,#101018)';
  var avStyle = g.sell?'color:#1A1826;background:linear-gradient(150deg,#E7E3FF,#8F87C9)':'color:#C9C3FF;background:linear-gradient(150deg,#33304A,#16161F)';
  var hist=[
    {label:g.title+' · completed', amount:'−'+g.price, dir:'out', tx:'0x7f21…a4c9', time:'Today 09:41'},
    {label:g.title+' · completed', amount:'−'+g.price, dir:'out', tx:'0x5e63…7ab0', time:'Yesterday'},
    {label:'Partial refund · slow delivery', amount:'+$0.04', dir:'in', tx:'0x1f77…c2e0', time:'3 Sep'}
  ];
  var terms=[
    {l:'Per completed task', n:'Charged only on verified delivery', v:g.price},
    {l:'Escrow hold', n:'Released automatically on delivery', v:'100%'},
    {l:'Failed task', n:'Auto-refunded within 60s', v:'$0.00'}
  ];
  var cta = g.sell ? '<button class="cta-primary" style="height:56px" onclick="closeAgent()">Edit listing</button>'
                   : '<button class="cta-primary" style="height:56px" onclick="openSheet(\\'hire\\')">Hire '+esc(g.agent)+'</button>';
  document.getElementById('panel').innerHTML =
    '<div class="panelHero"><div class="bgc" style="background:'+grad+'"></div><div class="fade"></div>'
    +'<div class="top"><button class="roundBtn" onclick="closeAgent()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>'
    +'<button class="roundBtn" style="width:auto;padding:0 16px;border-radius:22px;font-size:12.5px">Share</button></div>'
    +'<div class="panelHead"><div class="panelAv" style="'+avStyle+'">'+g.initials+'</div>'
    +'<div style="padding-bottom:3px"><div style="font-size:22px;font-weight:600;letter-spacing:-0.025em">'+esc(g.agent)+'</div>'
    +'<div style="font-size:12.5px;color:rgba(242,241,246,0.5);margin-top:4px">'+esc(g.title)+'</div>'
    +'<div class="mono" style="font-size:11.5px;color:var(--lav2);margin-top:4px">★ '+g.rating+' · '+g.meta+'</div></div></div></div>'
    +'<div class="panelBody"><div class="stat3">'
    +'<div><div class="l">PRICE</div><div class="v">'+g.price+' '+esc(g.unit)+'</div></div>'
    +'<div><div class="l">MEDIAN TIME</div><div class="v">'+d.speed+'</div></div>'
    +'<div><div class="l">SUCCESS</div><div class="v" style="color:var(--grn2)">'+d.success+'</div></div></div>'
    +'<div class="sectTitle" style="margin:26px 0 10px">What it does</div><div class="about">'+esc(d.about)+'</div>'
    +'<div class="skills">'+d.skills.map(function(k){return '<span class="skill">'+esc(k)+'</span>';}).join('')+'</div>'
    +'<div class="sectTitle" style="margin:28px 0 12px">How it charges</div><div class="card" style="padding:4px 16px">'
    +terms.map(function(t){return '<div class="row" style="border-bottom:1px solid rgba(255,255,255,0.05)"><div style="flex:1"><div style="font-size:13px">'+t.l+'</div><div style="font-size:11px;color:rgba(242,241,246,0.34);margin-top:3px">'+t.n+'</div></div><div class="mono" style="font-size:13px;color:var(--lav2)">'+t.v+'</div></div>';}).join('')+'</div>'
    +'<div class="sectTitle" style="margin:28px 0 12px">Recent work for Otto</div><div class="card" style="padding:4px 16px">'
    +hist.map(ledgerRow).join('')+'</div></div>'
    +'<div class="panelFoot">'+cta+'</div>';
  document.getElementById('scrim').classList.add('show');
  document.getElementById('panel').classList.add('show');
}
function closeAgent(){ document.getElementById('scrim').classList.remove('show'); document.getElementById('panel').classList.remove('show'); state.agent=null; }

function sheetHTML(kind){
  if(kind==='fund'){
    var amts=[100,500,1000,2500];
    var amtStr='$'+state.fund.toLocaleString('en-US')+'.00';
    return '<h3>Add funds</h3><div class="desc">Otto draws from this balance to pay other agents.</div>'
      +'<div style="text-align:center;margin:26px 0 6px"><span class="mono" style="font-size:40px">'+amtStr+'</span></div>'
      +'<div class="amtBtns">'+amts.map(function(v){return '<button class="'+(state.fund===v?'on':'')+'" data-fund="'+v+'">$'+v.toLocaleString('en-US')+'</button>';}).join('')+'</div>'
      +'<div class="fld" style="margin-top:16px;display:flex;align-items:center;gap:13px"><div style="width:36px;height:36px;border-radius:12px;background:rgba(169,160,255,0.1);border:1px solid rgba(169,160,255,0.2);display:flex;align-items:center;justify-content:center;color:var(--lav2)">⌁</div><div style="flex:1"><div style="font-size:13px">Mercury ···8821</div><div style="font-size:11px;color:rgba(242,241,246,0.34);margin-top:3px">ACH · arrives instantly</div></div><span style="font-size:12px;color:var(--lav3)">Change</span></div>'
      +'<button class="cta-primary" style="margin-top:16px" data-flash="Added '+amtStr+'">Add '+amtStr+'</button>';
  }
  if(kind==='withdraw'){
    return '<h3>Withdraw earnings</h3><div class="desc">Available now — escrowed funds stay with Otto.</div>'
      +'<div style="margin:22px 0 16px;padding:18px;border-radius:22px;border:1px solid rgba(143,227,180,0.16);background:rgba(143,227,180,0.06);text-align:center">'
      +'<div style="font-size:11px;letter-spacing:0.06em;color:rgba(242,241,246,0.42)">WITHDRAWABLE</div>'
      +'<div class="mono" style="font-size:34px;color:var(--grn2);margin-top:7px">$1,266.20</div>'
      +'<div style="font-size:11px;color:rgba(242,241,246,0.32);margin-top:6px">$18.40 held in open escrows</div></div>'
      +'<div class="fld" style="display:flex;align-items:center;gap:13px;border:1px solid rgba(169,160,255,0.22);background:rgba(169,160,255,0.08);margin-bottom:9px"><div style="width:36px;height:36px;border-radius:12px;background:rgba(169,160,255,0.14);display:flex;align-items:center;justify-content:center;color:var(--lav2)">⌁</div><div style="flex:1"><div style="font-size:13px">Mercury ···8821</div><div style="font-size:11px;color:rgba(242,241,246,0.36);margin-top:3px">1–2 business days · no fee</div></div><div style="width:18px;height:18px;border-radius:50%;background:var(--lav3);display:flex;align-items:center;justify-content:center;color:#15131F;font-size:10px">✓</div></div>'
      +'<div class="fld" style="display:flex;align-items:center;gap:13px"><div style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:rgba(242,241,246,0.6)">◈</div><div style="flex:1"><div style="font-size:13px">Base wallet 0x4c…9f2</div><div style="font-size:11px;color:rgba(242,241,246,0.34);margin-top:3px">USDC · ~2s · $0.01 network fee</div></div></div>'
      +'<button class="cta-primary" style="margin-top:16px" data-flash="Withdrawal queued">Withdraw $1,266.20</button>';
  }
  if(kind==='connect'){
    return '<h3>Connect a wallet</h3><div class="desc">Otto settles agent-to-agent payments in USDC.</div>'
      +'<div style="display:flex;flex-direction:column;gap:9px;margin-top:20px">'
      +WALLETS.map(function(w){ var on=state.connected.indexOf(w.key)>=0;
        return '<button class="fld" style="display:flex;align-items:center;gap:13px;text-align:left" data-connect="'+w.key+'"><div style="width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:'+(on?'var(--lav2)':'rgba(242,241,246,0.55)')+';background:'+(on?'rgba(169,160,255,0.12)':'rgba(255,255,255,0.05)')+';border:1px solid '+(on?'rgba(169,160,255,0.2)':'rgba(255,255,255,0.08)')+'">'+w.glyph+'</div><div style="flex:1"><div style="font-size:13.5px">'+w.name+'</div><div style="font-size:11px;color:rgba(242,241,246,0.34);margin-top:3px">'+w.note+'</div></div><span class="tag '+(on?'run':'eng')+'">'+(on?'CONNECTED':'CONNECT')+'</span></button>';
      }).join('')+'</div>'
      +'<div style="font-size:11.5px;color:rgba(242,241,246,0.3);margin-top:16px;line-height:1.6;text-align:center">Otto can only spend inside the limits you set. You keep the keys.</div>';
  }
  if(kind==='hire'){
    var g=state.agent||{price:'$0.00',unit:'',agent:'Agent'};
    var rate=parseFloat(g.price.replace('$',''))||0;
    var total='$'+(rate*state.qty).toFixed(2);
    return '<h3>Hire '+esc(g.agent)+'</h3><div class="desc">Otto pays per completed task, held in escrow until delivery.</div>'
      +'<div class="fld" style="margin-top:20px"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:12.5px;color:rgba(242,241,246,0.46)">Rate</span><span class="mono" style="font-size:15px">'+g.price+' '+esc(g.unit)+'</span></div>'
      +'<div style="height:1px;background:rgba(255,255,255,0.07);margin:14px 0"></div>'
      +'<div style="font-size:12px;letter-spacing:0.05em;color:rgba(242,241,246,0.4)">TASKS TO BUY</div>'
      +'<div class="qtyRow"><button class="qtyBtn" data-qty="-1">−</button><div style="flex:1;text-align:center" class="mono"><span style="font-size:26px">'+state.qty+'</span></div><button class="qtyBtn" data-qty="1">+</button></div>'
      +'<div style="height:1px;background:rgba(255,255,255,0.07);margin:16px 0"></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px">Escrow total</span><span class="mono" style="font-size:20px;color:var(--lav2)">'+total+'</span></div></div>'
      +'<div class="fld" style="display:flex;align-items:center;gap:12px;margin-top:12px;border:1px solid rgba(143,227,180,0.16);background:rgba(143,227,180,0.05)"><div style="width:30px;height:30px;border-radius:11px;background:rgba(143,227,180,0.1);display:flex;align-items:center;justify-content:center;color:var(--grn)">⛨</div><div style="flex:1;font-size:11.5px;color:rgba(242,241,246,0.46);line-height:1.5">Funds release only on verified delivery. Unused tasks refund automatically.</div></div>'
      +'<button class="cta-primary" style="margin-top:16px" data-hire="1">Escrow '+total+' & hire</button>';
  }
  if(kind==='approve'){
    return '<h3>Approve booking</h3><div class="desc">Otto will charge your card and confirm with the airline and hotel.</div>'
      +'<div class="fld" style="margin-top:20px;display:flex;flex-direction:column;gap:11px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Flights · TAP 1046</span><span class="mono">$842.00</span></div>'
      +'<div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Hotel · Casa Amalia, 5n</span><span class="mono">$441.05</span></div>'
      +'<div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:rgba(242,241,246,0.44)">Agent fees</span><span class="mono" style="color:var(--lav2)">$1.15</span></div>'
      +'<div style="height:1px;background:rgba(255,255,255,0.08)"></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px">Total</span><span class="mono" style="font-size:21px">$1,284.20</span></div></div>'
      +'<div style="display:flex;gap:9px;margin-top:16px"><button class="fld" style="flex:1;height:54px;text-align:center;font-size:14.5px" data-close="1">Not yet</button><button class="cta-primary" style="flex:1.4" data-flash="Booking confirmed">Confirm & pay</button></div>';
  }
  return '';
}
function renderSheet(){ if(state.sheet) document.getElementById('sheet').innerHTML=sheetHTML(state.sheet); }
function openSheet(kind){ state.sheet=kind; renderSheet(); document.getElementById('sheetWrap').classList.add('show'); }
function closeSheet(){ document.getElementById('sheetWrap').classList.remove('show'); state.sheet=null; }
function connectWallet(k){ if(state.connected.indexOf(k)<0){ state.connected.push(k); var w=WALLETS.filter(function(x){return x.key===k;})[0]; flash((w?w.name:'Wallet')+' connected'); closeSheet(); } }
function confirmHire(){ var g=state.agent; closeSheet(); closeAgent(); flash((g?g.agent:'Agent')+' hired · escrowed'); }

var toastTimer;
function flash(t){ var el=document.getElementById('toast'); document.getElementById('toastText').textContent=t; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){el.classList.remove('show');},2600); }

function go(view){
  state.view=view;
  var items=document.querySelectorAll('#nav .navItem');
  for(var i=0;i<items.length;i++){ items[i].classList.toggle('active', items[i].getAttribute('data-view')===view); }
  var views=document.querySelectorAll('.view');
  for(var j=0;j<views.length;j++){ views[j].classList.toggle('active', views[j].id==='view-'+view); }
  window.scrollTo(0,0);
}

// The hero numbers stay on the (hardcoded) design values. Only the money-moving
// feed opportunistically comes alive from real backend payments when Otto runs.
function liveData(){
  fetch('/api/ledger').then(function(r){return r.json();}).then(function(l){
    if(l && l.entries && l.entries.length){
      FEED = l.entries.slice(0,6).map(function(e){
        var id=e.txId||'';
        return { label:e.resource+' · '+e.counterparty, amount:(e.direction==='in'?'+':'−')+'$'+Number(e.usdc).toFixed(2), dir:e.direction, tx:id.slice(0,6)+'…'+id.slice(-4), time:'live' };
      });
      renderFeed();
    }
  }).catch(function(){});
}

// Event delegation (keeps handlers out of inline HTML the framework re-renders).
document.getElementById('nav').addEventListener('click', function(e){
  var b=e.target.closest('.navItem'); if(b) go(b.getAttribute('data-view'));
});
document.getElementById('gigs').addEventListener('click', function(e){
  var b=e.target.closest('[data-agent]'); if(b) openAgent(b.getAttribute('data-agent'));
});
document.getElementById('chips').addEventListener('click', function(e){
  var b=e.target.closest('[data-chip]'); if(b) setChip(b.getAttribute('data-chip'));
});
document.getElementById('sheet').addEventListener('click', function(e){
  var t=e.target.closest('[data-fund],[data-qty],[data-connect],[data-hire],[data-flash],[data-close]'); if(!t) return;
  if(t.hasAttribute('data-fund')){ state.fund=parseInt(t.getAttribute('data-fund'),10); renderSheet(); }
  else if(t.hasAttribute('data-qty')){ state.qty=Math.max(1,Math.min(50,state.qty+parseInt(t.getAttribute('data-qty'),10))); renderSheet(); }
  else if(t.hasAttribute('data-connect')){ connectWallet(t.getAttribute('data-connect')); }
  else if(t.hasAttribute('data-hire')){ confirmHire(); }
  else if(t.hasAttribute('data-flash')){ flash(t.getAttribute('data-flash')); closeSheet(); }
  else if(t.hasAttribute('data-close')){ closeSheet(); }
});
document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeSheet(); closeAgent(); } });

renderFeed(); renderReceipts(); renderChart(); renderTimeline(); renderRules(); renderChips(); renderGigs();
setInterval(function(){ state.tick++; renderFeed(); }, 3800);
liveData();
</script>
</body>
</html>`;
