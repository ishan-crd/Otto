/**
 * The LIVE x402 flow, served at GET /pay.
 *
 * Otto's Algorand TestNet account is auto-provisioned at boot, so this page
 * works from a bare `pnpm dev:web`. It guides the only two human steps (faucet
 * funding + USDC) with live status, then offers two real payment paths:
 *
 *   1. "Otto pays (demo)" — the server key signs; the full x402 loop settles a
 *      REAL on-chain USDC transfer with NO browser wallet. Guaranteed demo.
 *   2. Browser wallet (Pera / Lute) — the user's own wallet signs client-side.
 *      NOTE: Trust Wallet / MetaMask are EVM wallets — they cannot sign
 *      Algorand transactions and have no Algorand testnet; the page says so.
 *
 * Zero-build: algosdk + wallet connectors load from ESM CDN. Browser JS uses
 * string concatenation (no template literals) so it lives safely inside this
 * TS template literal.
 */
export const PAY_PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Otto — Live x402 · Algorand TestNet</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{ --mono:'JetBrains Mono',monospace; --lav:#B3AAFF; --lav2:#C8C1FF; --grn:#8FE3B4; --grn2:#A9EFC8; }
  *{box-sizing:border-box}
  html,body{margin:0;background:#0A0A0B;color:#F2F1F6;font-family:'Space Grotesk',system-ui,sans-serif}
  a{color:var(--lav)} .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
  ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .wrap{max-width:760px;margin:0 auto;padding:34px 22px 80px}
  .glow{position:fixed;top:-240px;left:50%;transform:translateX(-50%);width:900px;height:520px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(150,140,225,0.16),rgba(10,10,11,0) 68%);filter:blur(34px);pointer-events:none}
  header{display:flex;align-items:center;justify-content:space-between;position:relative}
  .brand{display:flex;align-items:center;gap:11px}
  .mark{width:34px;height:34px;border-radius:11px;background:linear-gradient(145deg,#E7E3FF,#8F87C9 42%,#3A3752 78%,#D9D4F5);display:flex;align-items:center;justify-content:center}
  .mark div{width:11px;height:11px;border-radius:50%;border:2.5px solid #131320}
  .name{font-size:16px;font-weight:600} .name small{display:block;font-size:11px;color:rgba(242,241,246,0.4)}
  .back{font-size:12.5px;color:rgba(242,241,246,0.5)}
  .card{position:relative;border-radius:22px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.016));backdrop-filter:blur(24px);padding:22px;margin-top:18px}
  .kick{font-size:11px;letter-spacing:0.1em;color:rgba(242,241,246,0.42)}
  .btn{border:none;cursor:pointer;font-family:inherit;border-radius:14px;font-size:14px;font-weight:600}
  .pri{background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;height:44px;padding:0 20px;box-shadow:0 12px 28px -14px rgba(160,150,240,0.9)}
  .pri:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
  .ghost{background:rgba(255,255,255,0.05);color:#F2F1F6;border:1px solid rgba(255,255,255,0.1);height:44px;padding:0 16px;font-weight:500}
  .ghost:disabled{opacity:.35;cursor:not-allowed}
  .row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .row:last-child{border-bottom:none}
  .pill{font-size:10px;letter-spacing:0.05em;padding:3px 8px;border-radius:8px;flex:none}
  .pOk{color:var(--grn);background:rgba(143,227,180,0.09);border:1px solid rgba(143,227,180,0.2)}
  .pWarn{color:#FFD08A;background:rgba(255,190,110,0.08);border:1px solid rgba(255,190,110,0.2)}
  .stat{display:flex;gap:22px;margin-top:14px;flex-wrap:wrap}
  .stat .l{font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)}
  .stat .v{font-family:var(--mono);font-size:16px;margin-top:4px}
  .svc{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);flex-wrap:wrap}
  .svc:last-child{border-bottom:none}
  .svcMid{flex:1;min-width:200px} .svcMid .t{font-size:14px;font-weight:500} .svcMid .d{font-size:12px;color:rgba(242,241,246,0.4);margin-top:3px}
  .price{font-family:var(--mono);font-size:13px;color:var(--lav2)}
  .spinner{width:14px;height:14px;border:2px solid rgba(20,18,31,0.35);border-top-color:#14121F;border-radius:50%;display:inline-block;animation:spin .7s linear infinite;vertical-align:-2px}
  .steps{margin-top:14px;display:none}
  .step{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13px;color:rgba(242,241,246,0.5)}
  .step.on{color:#F2F1F6} .step.ok{color:var(--grn2)} .step.err{color:#FFB3AC}
  .dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);flex:none}
  .step.on .dot{background:var(--lav)} .step.ok .dot{background:var(--grn)} .step.err .dot{background:#FFB3AC}
  .receipt{border-radius:16px;border:1px solid rgba(143,227,180,0.2);background:rgba(143,227,180,0.05);padding:14px 16px;margin-top:12px}
  .kv{display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;gap:12px}
  .kv span:first-child{color:rgba(242,241,246,0.44)}
  pre{background:#0B0E14;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;font-family:var(--mono);font-size:11.5px;color:#B9C3D2;overflow:auto;margin:8px 0 0}
  .note{font-size:12px;color:rgba(242,241,246,0.4);line-height:1.6}
  .warn{font-size:12px;color:#FFD08A;line-height:1.6;border:1px solid rgba(255,190,110,0.2);background:rgba(255,190,110,0.06);border-radius:12px;padding:10px 13px;margin-top:12px}
  input.field{width:100%;background:#0B0E14;border:1px solid rgba(255,255,255,0.09);color:#F2F1F6;border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;margin-top:8px}
  .addr{font-family:var(--mono);font-size:12px;word-break:break-all;color:var(--lav2);cursor:pointer}
  .checks{display:flex;flex-direction:column;gap:9px;margin-top:14px}
  .check{display:flex;align-items:center;gap:11px;font-size:13px}
  .check .ic{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:11px}
  .icOk{background:rgba(143,227,180,0.15);color:var(--grn)}
  .icNo{background:rgba(255,190,110,0.12);color:#FFD08A}
</style>
</head>
<body>
<div class="glow"></div>
<div class="wrap">
  <header>
    <div class="brand"><div class="mark"><div></div></div><div class="name">Otto<small>Live x402 · Algorand TestNet</small></div></div>
    <a class="back" href="/">← Dashboard</a>
  </header>

  <div class="card">
    <div class="kick">OTTO'S ACCOUNT — auto-provisioned at boot</div>
    <div class="addr" id="ottoAddr" title="Click to copy">loading…</div>
    <div class="checks" id="checks"></div>
    <div id="setupActions" style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap"></div>
  </div>

  <div class="card">
    <div class="kick">PAY FOR AN AGENT SERVICE</div>
    <div class="note" style="margin-top:8px">Each call charges <span class="mono">0.001 USDC</span>, paid per request over x402 — a real USDC transfer settles on Algorand TestNet in ~3s.</div>
    <input class="field" id="svcInput" placeholder="Optional input for the service (e.g. 'a US phone number')" />
    <div id="services" style="margin-top:6px"></div>
  </div>

  <div class="card">
    <div class="kick">YOUR WALLET (optional)</div>
    <div id="walletBody" style="margin-top:12px"></div>
  </div>

  <div class="card" id="flowCard" style="display:none">
    <div class="kick">PAYMENT FLOW</div>
    <div class="steps" id="steps"></div>
    <div id="receipts"></div>
  </div>

  <div class="card">
    <div class="kick">HOW IT WORKS</div>
    <div class="note" style="margin-top:10px">
      1. Request a service → server returns <b>402 Payment Required</b> with a USDC price.<br/>
      2. A wallet <b>signs</b> a USDC-ASA transfer to Otto's account — either your browser wallet, or Otto's own key in demo mode.<br/>
      3. Server <b>verifies + submits</b> it to Algorand → real tx receipt → the API responds.<br/>
      No subscriptions, no API keys — pay-per-call, settled in USDC on Algorand.
    </div>
  </div>
</div>

<script type="module">
var TESTNET_GENESIS = 'testnet-v1.0';
var algosdk = null;
try { algosdk = (await import('https://esm.sh/algosdk@3.2.0')).default; } catch (e) {}

var S = { info:null, status:null, services:[], wallet:null, address:null, balAlgo:0, balUsdc:0, optedIn:false };

function el(id){ return document.getElementById(id); }
function u8ToB64(u8){ var s=''; for (var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s); }
function decodeResp(h){ try { return JSON.parse(atob(h)); } catch(e){ return null; } }
function short(a){ return a ? a.slice(0,8)+'…'+a.slice(-8) : '—'; }

async function boot(){
  S.info = await fetch('/api/live/info').then(function(r){return r.json();});
  S.services = (await fetch('/api/live/services').then(function(r){return r.json();})).services;
  if (algosdk) S.algod = new algosdk.Algodv2('', S.info.algodServer, S.info.algodPort);
  el('ottoAddr').textContent = S.info.receiver;
  el('ottoAddr').onclick = function(){ navigator.clipboard && navigator.clipboard.writeText(S.info.receiver); el('ottoAddr').textContent = S.info.receiver+'  (copied)'; setTimeout(function(){ el('ottoAddr').textContent = S.info.receiver; }, 1400); };
  renderWallet();
  tryReconnectPera();
  await refreshStatus();
  setInterval(refreshStatus, 5000);
}

async function refreshStatus(){
  try { S.status = await fetch('/api/live/status').then(function(r){return r.json();}); }
  catch(e){ S.status = null; }
  renderChecks(); renderServices();
}

function renderChecks(){
  var st = S.status;
  if (!st){ el('checks').innerHTML = '<div class="note">Checking Algorand TestNet…</div>'; return; }
  function check(ok, okText, noText){
    return '<div class="check"><div class="ic '+(ok?'icOk':'icNo')+'">'+(ok?'✓':'!')+'</div><div>'+(ok?okText:noText)+'</div></div>';
  }
  el('checks').innerHTML =
    check(st.funded, 'Funded — '+st.algo.toFixed(3)+' test ALGO for fees',
      'Needs test ALGO — <a href="https://bank.testnet.algorand.network/" target="_blank">open the faucet</a>, paste Otto\\u2019s address above')
    + check(st.optedIn, 'Opted in to USDC (ASA '+S.info.assetId+')',
      st.funded ? 'Not opted in to USDC yet — click the button below' : 'Opt-in unlocks after funding')
    + check(st.usdc>0, st.usdc.toFixed(3)+' test USDC ready to move',
      st.optedIn ? 'No test USDC yet — <a href="https://faucet.circle.com/" target="_blank">Circle faucet</a> (Algorand TestNet)' : 'USDC balance appears after opt-in');
  var actions = '';
  if (st.funded && !st.optedIn) actions += '<button class="btn pri" id="optOtto">Opt in to USDC</button>';
  actions += '<button class="btn ghost" id="reStatus">Refresh status</button>';
  el('setupActions').innerHTML = actions;
  if (el('optOtto')) el('optOtto').onclick = optInOtto;
  el('reStatus').onclick = refreshStatus;
}

async function optInOtto(){
  var b = el('optOtto'); b.disabled = true; b.innerHTML = '<span class="spinner"></span> Opting in…';
  try {
    var res = await fetch('/api/live/optin', { method:'POST' }).then(function(r){ return r.json(); });
    if (!res.ok) throw new Error(res.detail||'failed');
  } catch(e){ alert('Opt-in failed: '+String(e)); }
  await refreshStatus();
}

// ── Wallet connectors (optional path) ────────────────────────────────────────
async function makeWallet(kind){
  if (kind === 'lute'){
    var LuteConnect = (await import('https://esm.sh/lute-connect@1.4.1')).default;
    var lute = new LuteConnect('Otto');
    return {
      kind:'lute', label:'Lute',
      connect: function(){ return lute.connect(TESTNET_GENESIS); },
      disconnect: function(){},
      signB64: async function(txn){
        var b64 = u8ToB64(algosdk.encodeUnsignedTransaction(txn));
        var res = await lute.signTxns([{ txn: b64 }]);
        var s = res[0];
        return (typeof s === 'string') ? s : u8ToB64(s);
      }
    };
  }
  var mod = await import('https://esm.sh/@perawallet/connect@1');
  return peraWrapper(new mod.PeraWalletConnect({ chainId: S.info.chainId }));
}

function peraWrapper(pera){
  return {
    kind:'pera', label:'Pera',
    connect: async function(){
      // Adopt an existing WalletConnect session instead of erroring on it.
      try { var ex = await pera.reconnectSession(); if (ex && ex.length) return ex; } catch(e){}
      try { return await pera.connect(); }
      catch(e){
        if (String(e).indexOf('Session currently connected') >= 0){
          try { await pera.disconnect(); } catch(_){}
          return await pera.connect();
        }
        throw e;
      }
    },
    disconnect: function(){ try { pera.disconnect(); } catch(e){} },
    signB64: async function(txn){
      var s = await pera.signTransaction([[{ txn: txn, signers:[S.address] }]]);
      return u8ToB64(s[0]);
    }
  };
}

/** If Pera was connected before (session survives reloads), restore it silently
 *  so the page opens already-connected with the Disconnect button visible. */
async function tryReconnectPera(){
  if (!algosdk || S.address) return;
  try {
    var mod = await import('https://esm.sh/@perawallet/connect@1');
    var pera = new mod.PeraWalletConnect({ chainId: S.info.chainId });
    var accs = await pera.reconnectSession();
    if (accs && accs.length){ S.wallet = peraWrapper(pera); S.address = accs[0]; await refreshAccount(); }
  } catch(e){}
}

async function connect(kind){
  if (!algosdk) return;
  el('walletBody').innerHTML = '<div class="note">Opening ' + (kind==='lute'?'Lute':'Pera') + '…</div>';
  try {
    S.wallet = await makeWallet(kind);
    var acc = await S.wallet.connect();
    S.address = acc[0];
    await refreshAccount();
  } catch(e){
    var msg = String(e);
    S.wallet = null;
    renderWallet();
    if (msg.indexOf('closed')<0 && msg.indexOf('cancel')<0){
      el('walletBody').insertAdjacentHTML('afterbegin', '<div class="warn">Connect failed: '+msg+'</div>');
    }
  }
}
function disconnect(){ if (S.wallet) S.wallet.disconnect(); S.wallet=null; S.address=null; renderWallet(); renderServices(); }

async function refreshAccount(){
  S.balAlgo=0; S.balUsdc=0; S.optedIn=false;
  try {
    var info = await S.algod.accountInformation(S.address).do();
    S.balAlgo = Number(info.amount||0)/1e6;
    var assets = info.assets||[];
    for (var i=0;i<assets.length;i++){ var a=assets[i]; if (Number(a.assetId!=null?a.assetId:a['asset-id'])===S.info.assetId){ S.optedIn=true; S.balUsdc=Number(a.amount||0)/1e6; } }
  } catch(e){}
  renderWallet(); renderServices();
}

function renderWallet(){
  if (!S.address){
    el('walletBody').innerHTML =
      '<div class="note">Pay with your own Algorand wallet instead of the demo. <b>Lute</b> is a browser extension (desktop); <b>Pera</b> is the Algorand mobile wallet (enable Developer Mode → TestNet in its settings).</div>'
      +'<div class="warn">⚠ Trust Wallet and MetaMask are Ethereum wallets — they cannot sign Algorand transactions and have no Algorand TestNet, so they will not work here. Use the <b>Otto pays (demo)</b> buttons above, or Pera / Lute.</div>'
      +'<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn pri" id="cPera">Connect Pera</button><button class="btn ghost" id="cLute">Connect Lute</button></div>';
    el('cPera').onclick=function(){ connect('pera'); };
    el('cLute').onclick=function(){ connect('lute'); };
    return;
  }
  var optPill = S.optedIn ? '<span class="pill pOk">OPTED IN</span>' : '<span class="pill pWarn">NOT OPTED IN</span>';
  var optBtn = S.optedIn ? '' : '<button class="btn ghost" id="optBtn" style="height:38px;margin-top:12px">Opt in to USDC</button>';
  el('walletBody').innerHTML =
    '<div class="row" style="padding-top:0"><div style="flex:1"><div class="mono" style="font-size:13.5px">'+short(S.address)+'</div><div style="font-size:11px;color:rgba(242,241,246,0.4);margin-top:3px">'+S.wallet.label+' · TestNet</div></div>'+optPill+'<button class="btn ghost" id="dcBtn" style="height:32px;padding:0 12px;font-size:12px">Disconnect</button></div>'
    +'<div class="stat"><div><div class="l">ALGO</div><div class="v">'+S.balAlgo.toFixed(3)+'</div></div><div><div class="l">USDC</div><div class="v" style="color:var(--grn2)">'+S.balUsdc.toFixed(3)+'</div></div></div>'+optBtn;
  el('dcBtn').onclick=disconnect;
  if (el('optBtn')) el('optBtn').onclick=optInUser;
}

function renderServices(){
  var demoReady = S.status && S.status.funded && S.status.optedIn && S.status.usdc>0;
  var walletReady = S.address && S.optedIn && S.balUsdc>0;
  el('services').innerHTML = S.services.map(function(s){
    var parts = s.description.split(' — ');
    return '<div class="svc"><div class="svcMid"><div class="t">'+parts[0]+'</div><div class="d">'+(parts[1]||'')+'</div></div>'
      +'<div class="price">'+s.price+'</div>'
      +'<button class="btn pri" data-demo="'+s.id+'" style="height:38px;padding:0 14px;font-size:13px"'+(demoReady?'':' disabled')+'>Otto pays (demo)</button>'
      +'<button class="btn ghost" data-pay="'+s.id+'" style="height:38px;padding:0 14px;font-size:13px"'+(walletReady?'':' disabled')+'>Pay with wallet</button>'
      +'</div>';
  }).join('');
  var demoBtns = el('services').querySelectorAll('[data-demo]');
  for (var i=0;i<demoBtns.length;i++){ demoBtns[i].onclick = function(){ demoPay(this.getAttribute('data-demo'), this); }; }
  var payBtns = el('services').querySelectorAll('[data-pay]');
  for (var j=0;j<payBtns.length;j++){ payBtns[j].onclick = function(){ var id=this.getAttribute('data-pay'); walletPay(S.services.filter(function(x){return x.id===id;})[0], this); }; }
  if (!demoReady){
    el('services').insertAdjacentHTML('beforeend', '<div class="note" style="margin-top:12px">Buttons unlock once Otto\\u2019s account is funded + opted in + holds USDC (see the checklist above).</div>');
  }
}

function setSteps(list){ el('flowCard').style.display='block'; el('steps').style.display='block';
  el('steps').innerHTML = list.map(function(s){ return '<div class="step '+s.k+'"><span class="dot"></span>'+s.t+'</div>'; }).join('');
  el('flowCard').scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ── Path 1: server-signed demo (no browser wallet) ───────────────────────────
async function demoPay(svcId, btn){
  var svc = S.services.filter(function(x){return x.id===svcId;})[0];
  var label = btn.innerHTML; btn.disabled=true; btn.innerHTML='<span class="spinner"></span>';
  var steps = [ {k:'on',t:'402 challenge issued'}, {k:'',t:'Otto signs the USDC transfer (server key)'}, {k:'',t:'Settling on Algorand TestNet'}, {k:'',t:'Service response'} ];
  setSteps(steps);
  function mark(i,k,t){ steps[i].k=k; if(t)steps[i].t=t; setSteps(steps); }
  try {
    mark(0,'ok'); mark(1,'on');
    var res = await fetch('/api/live/self-pay', { method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ serviceId: svcId, text: el('svcInput').value.trim() }) }).then(function(r){ return r.json(); });
    if (!res.ok) throw new Error(res.detail||'failed');
    mark(1,'ok'); mark(2,'ok','Settled on-chain'); mark(3,'ok');
    addReceipt(svc, res.settle||{}, { result: res.result });
    refreshStatus();
  } catch(e){
    var i = steps.findIndex(function(s){return s.k==='on';}); if(i<0)i=2;
    mark(i,'err','Failed: '+String(e));
  } finally { btn.disabled=false; btn.innerHTML=label; renderServices(); }
}

// ── Path 2: browser wallet signs ─────────────────────────────────────────────
async function optInUser(){
  var btn = el('optBtn'); if (btn){ btn.disabled=true; btn.innerHTML='<span class="spinner" style="border-top-color:#fff"></span> Opting in…'; }
  try {
    var sp = await S.algod.getTransactionParams().do();
    var txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ sender:S.address, receiver:S.address, amount:0, assetIndex:S.info.assetId, suggestedParams:sp });
    var signedB64 = await S.wallet.signB64(txn);
    var sent = await S.algod.sendRawTransaction(new Uint8Array(atob(signedB64).split('').map(function(c){return c.charCodeAt(0);}))).do();
    var txid = sent.txid || sent.txId;
    await algosdk.waitForConfirmation(S.algod, txid, 4);
    await refreshAccount();
  } catch(e){ alert('Opt-in failed: '+String(e)); renderWallet(); }
}

async function walletPay(svc, button){
  if (!svc || !S.address) return;
  var label = button.innerHTML; button.disabled=true; button.innerHTML='<span class="spinner" style="border-top-color:#fff"></span>';
  var input = el('svcInput').value.trim();
  var steps = [ {k:'on',t:'Requesting service → 402 challenge'}, {k:'',t:'Sign USDC payment in '+S.wallet.label}, {k:'',t:'Settling on Algorand TestNet'}, {k:'',t:'Service response'} ];
  setSteps(steps);
  function mark(i,k,t){ steps[i].k=k; if(t)steps[i].t=t; setSteps(steps); }
  try {
    var chalRes = await fetch(svc.path, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: input }) });
    if (chalRes.status !== 402) throw new Error('expected 402, got '+chalRes.status);
    var req = (await chalRes.json()).accepts[0];
    mark(0,'ok'); mark(1,'on');
    var sp = await S.algod.getTransactionParams().do();
    var txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: S.address, receiver: req.payTo, amount: req.amountMicroUsdc,
      assetIndex: Number(req.asset), suggestedParams: sp,
      note: new TextEncoder().encode('x402:'+req.paymentId)
    });
    var signedB64 = await S.wallet.signB64(txn);
    mark(1,'ok'); mark(2,'on');
    var payload = { x402Version:1, paymentId:req.paymentId, nonce:req.nonce, from:S.address,
      amount:req.maxAmountRequired, amountMicroUsdc:req.amountMicroUsdc, authorizedAt:new Date().toISOString(),
      network:req.network, asset:req.asset, payTo:req.payTo, signedTxnB64:signedB64 };
    var payRes = await fetch(svc.path, { method:'POST', headers:{'content-type':'application/json','X-PAYMENT':btoa(JSON.stringify(payload))}, body: JSON.stringify({ text: input }) });
    if (!payRes.ok){ var err = await payRes.json().catch(function(){return {};}); throw new Error(err.detail||err.error||('HTTP '+payRes.status)); }
    var settle = decodeResp(payRes.headers.get('X-PAYMENT-RESPONSE')) || {};
    var body = await payRes.json();
    mark(2,'ok','Settled on-chain'); mark(3,'ok');
    addReceipt(svc, settle, body);
    await refreshAccount(); refreshStatus();
  } catch(e){
    var i = steps.findIndex(function(s){return s.k==='on';}); if(i<0)i=1;
    var msg = String(e);
    mark(i,'err', (msg.indexOf('closed')>=0 || msg.indexOf('reject')>=0 || msg.indexOf('cancel')>=0) ? 'Signature cancelled' : ('Failed: '+msg));
  } finally { button.disabled=false; button.innerHTML=label; renderServices(); }
}

function addReceipt(svc, settle, body){
  var link = settle.explorerUrl ? '<a href="'+settle.explorerUrl+'" target="_blank">'+(settle.txId||'').slice(0,12)+'…</a>' : (settle.txId||'—');
  var div = document.createElement('div'); div.className='receipt';
  div.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--grn2)">✓ Paid '+svc.price+' USDC · '+svc.id+'</div>'
    +'<div class="kv"><span>Status</span><span style="color:var(--grn2)">Settled · USDC · Algorand TestNet</span></div>'
    +'<div class="kv"><span>Tx</span><span class="mono">'+link+'</span></div>'
    +'<pre>'+JSON.stringify(body.result||body, null, 2)+'</pre>';
  el('receipts').prepend(div);
}

boot();
</script>
</body>
</html>`;
