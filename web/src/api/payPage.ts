/**
 * The LIVE x402 wallet flow, served at GET /pay.
 *
 * A user connects their Pera Wallet, and paying for an Otto service triggers a
 * REAL USDC-ASA transfer on Algorand TestNet — their wallet signs client-side,
 * the server verifies + submits, and the page shows the real tx id + explorer
 * link. This is the end-to-end, real-money (testnet) proof of the x402 flow.
 *
 * Zero-build: algosdk + @perawallet/connect load from ESM CDN. Browser JS uses
 * string concatenation (no template literals) so it can live inside this TS
 * template literal safely.
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
  .wrap{max-width:720px;margin:0 auto;padding:34px 22px 80px}
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
  .pri{background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;height:46px;padding:0 22px;box-shadow:0 12px 28px -14px rgba(160,150,240,0.9)}
  .pri:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
  .ghost{background:rgba(255,255,255,0.05);color:#F2F1F6;border:1px solid rgba(255,255,255,0.1);height:40px;padding:0 16px;font-weight:500}
  .row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .row:last-child{border-bottom:none}
  .pill{font-size:10px;letter-spacing:0.05em;padding:3px 8px;border-radius:8px}
  .pOk{color:var(--grn);background:rgba(143,227,180,0.09);border:1px solid rgba(143,227,180,0.2)}
  .pWarn{color:#FFD08A;background:rgba(255,190,110,0.08);border:1px solid rgba(255,190,110,0.2)}
  .stat{display:flex;gap:22px;margin-top:14px;flex-wrap:wrap}
  .stat .l{font-size:10.5px;letter-spacing:0.05em;color:rgba(242,241,246,0.38)}
  .stat .v{font-family:var(--mono);font-size:16px;margin-top:4px}
  .svc{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .svc:last-child{border-bottom:none}
  .svcMid{flex:1;min-width:0} .svcMid .t{font-size:14px;font-weight:500} .svcMid .d{font-size:12px;color:rgba(242,241,246,0.4);margin-top:3px}
  .price{font-family:var(--mono);font-size:13px;color:var(--lav2)}
  .spinner{width:14px;height:14px;border:2px solid rgba(20,18,31,0.35);border-top-color:#14121F;border-radius:50%;display:inline-block;animation:spin .7s linear infinite;vertical-align:-2px}
  .steps{margin-top:14px;display:none}
  .step{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13px;color:rgba(242,241,246,0.5)}
  .step.on{color:#F2F1F6} .step.ok{color:var(--grn2)} .step.err{color:#FFB3AC}
  .dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);flex:none}
  .step.on .dot{background:var(--lav)} .step.ok .dot{background:var(--grn)} .step.err .dot{background:#FFB3AC}
  .receipt{border-radius:16px;border:1px solid rgba(143,227,180,0.2);background:rgba(143,227,180,0.05);padding:14px 16px;margin-top:12px}
  .kv{display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0}
  .kv span:first-child{color:rgba(242,241,246,0.44)}
  pre{background:#0B0E14;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;font-family:var(--mono);font-size:11.5px;color:#B9C3D2;overflow:auto;margin:8px 0 0}
  .note{font-size:12px;color:rgba(242,241,246,0.4);line-height:1.6}
  input.field{width:100%;background:#0B0E14;border:1px solid rgba(255,255,255,0.09);color:#F2F1F6;border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;margin-top:8px}
</style>
</head>
<body>
<div class="glow"></div>
<div class="wrap">
  <header>
    <div class="brand"><div class="mark"><div></div></div><div class="name">Otto<small>Live x402 · Algorand TestNet</small></div></div>
    <a class="back" href="/">← Dashboard</a>
  </header>

  <div class="card" id="configCard" style="display:none">
    <div class="kick">SETUP NEEDED</div>
    <div class="note" style="margin-top:10px" id="configMsg"></div>
  </div>

  <div class="card" id="walletCard">
    <div class="kick">YOUR WALLET</div>
    <div id="walletBody" style="margin-top:12px">
      <div class="note">Connect an Algorand wallet (Pera) to pay for Otto's agent services with real testnet USDC.</div>
      <button class="btn pri" id="connectBtn" style="margin-top:16px">Connect Pera Wallet</button>
    </div>
  </div>

  <div class="card">
    <div class="kick">PAY FOR AN AGENT SERVICE</div>
    <div class="note" style="margin-top:8px">Each call charges <span class="mono">0.001 USDC</span>, paid per request over x402 — your wallet signs, it settles on-chain in ~2s.</div>
    <input class="field" id="svcInput" placeholder="Optional input for the service (e.g. 'a US phone number')" />
    <div id="services" style="margin-top:6px"></div>
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
      2. Your Pera wallet <b>signs</b> a USDC-ASA transfer to Otto's account.<br/>
      3. Server <b>verifies + submits</b> it to Algorand → real tx receipt → the API responds.<br/>
      No subscriptions, no API keys — pay-per-call, settled in USDC on Algorand.
    </div>
  </div>
</div>

<script type="module">
var algosdk, PeraWalletConnect;
try {
  algosdk = (await import('https://esm.sh/algosdk@3.2.0')).default;
  var pera = await import('https://esm.sh/@perawallet/connect@1');
  PeraWalletConnect = pera.PeraWalletConnect;
} catch (e) {
  document.getElementById('walletBody').innerHTML = '<div class="note" style="color:#FFB3AC">Could not load wallet libraries (network?). Refresh to retry. ' + String(e) + '</div>';
}

var S = { info:null, services:[], wallet:null, address:null, algod:null };

function el(id){ return document.getElementById(id); }
function u8ToB64(u8){ var s=''; for (var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s); }
function decodeResp(h){ try { return JSON.parse(atob(h)); } catch(e){ return null; } }
function money(micro){ return '$'+(micro/1e6).toFixed(3); }

async function boot(){
  S.info = await fetch('/api/live/info').then(function(r){return r.json();});
  S.services = (await fetch('/api/live/services').then(function(r){return r.json();})).services;
  if (S.info.algodServer && algosdk) S.algod = new algosdk.Algodv2('', S.info.algodServer, S.info.algodPort);
  renderServices();
  if (!S.info.enabled){
    el('configCard').style.display='block';
    el('configMsg').innerHTML = 'The live flow needs an Algorand receiver. Set <span class="mono">RAIL=algorand</span> and <span class="mono">RECEIVER_ADDRESS</span> (an opted-in TestNet account) in <span class="mono">web/.env</span>, then restart the server. The dashboard still works without this.';
    el('connectBtn').disabled = true;
  }
  if (PeraWalletConnect){
    S.wallet = new PeraWalletConnect({ chainId: S.info.chainId });
    try { var acc = await S.wallet.reconnectSession(); if (acc && acc.length){ S.address = acc[0]; await refreshAccount(); } } catch(e){}
    S.wallet.connector && S.wallet.connector.on && S.wallet.connector.on('disconnect', onDisconnect);
  }
}

async function connect(){
  if (!S.wallet) return;
  try { var acc = await S.wallet.connect(); S.address = acc[0]; await refreshAccount(); }
  catch(e){ if (String(e).indexOf('Connect modal is closed')<0) el('walletBody').innerHTML = '<div class="note" style="color:#FFB3AC">Connect failed: '+String(e)+'</div><button class="btn pri" id="connectBtn2" style="margin-top:14px">Try again</button>', el('connectBtn2').onclick=connect; }
}
function onDisconnect(){ S.address=null; renderWallet(); renderServices(); }
function disconnect(){ try{ S.wallet.disconnect(); }catch(e){} onDisconnect(); }

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

function short(a){ return a.slice(0,6)+'…'+a.slice(-6); }
function renderWallet(){
  if (!S.address){ el('walletBody').innerHTML = '<div class="note">Connect an Algorand wallet (Pera) to pay with real testnet USDC.</div><button class="btn pri" id="connectBtn" style="margin-top:16px">Connect Pera Wallet</button>'; el('connectBtn').onclick=connect; return; }
  var optPill = S.optedIn ? '<span class="pill pOk">OPTED IN</span>' : '<span class="pill pWarn">NOT OPTED IN</span>';
  var optBtn = S.optedIn ? '' : '<button class="btn ghost" id="optBtn" style="margin-top:14px">Opt in to USDC</button>';
  el('walletBody').innerHTML =
    '<div class="row" style="padding-top:0"><div style="flex:1"><div class="mono" style="font-size:13.5px">'+short(S.address)+'</div><div style="font-size:11px;color:rgba(242,241,246,0.4);margin-top:3px">Pera · TestNet</div></div>'+optPill+'<button class="btn ghost" id="dcBtn" style="height:32px;padding:0 12px;font-size:12px">Disconnect</button></div>'
    +'<div class="stat"><div><div class="l">ALGO</div><div class="v">'+S.balAlgo.toFixed(3)+'</div></div><div><div class="l">USDC</div><div class="v" style="color:var(--grn2)">'+S.balUsdc.toFixed(3)+'</div></div></div>'+optBtn;
  el('dcBtn').onclick=disconnect;
  if (el('optBtn')) el('optBtn').onclick=optIn;
}

function renderServices(){
  var ready = S.address && S.optedIn && S.info && S.info.enabled;
  el('services').innerHTML = S.services.map(function(s){
    return '<div class="svc"><div class="svcMid"><div class="t">'+s.description.split(' — ')[0]+'</div><div class="d">'+(s.description.split(' — ')[1]||'')+'</div></div>'
      +'<div class="price">'+s.price+'</div><button class="btn pri" data-svc="'+s.id+'" style="height:38px;padding:0 16px;font-size:13px"'+(ready?'':' disabled')+'>Pay & call</button></div>';
  }).join('');
  var btns = el('services').querySelectorAll('[data-svc]');
  for (var i=0;i<btns.length;i++){ btns[i].onclick = function(){ var id=this.getAttribute('data-svc'); pay(S.services.filter(function(x){return x.id===id;})[0], this); }; }
}

function setSteps(list){ el('flowCard').style.display='block'; el('steps').style.display='block';
  el('steps').innerHTML = list.map(function(s){ return '<div class="step '+s.k+'"><span class="dot"></span>'+s.t+'</div>'; }).join('');
}

async function optIn(){
  try {
    var sp = await S.algod.getTransactionParams().do();
    var txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ sender:S.address, receiver:S.address, amount:0, assetIndex:S.info.assetId, suggestedParams:sp });
    var signed = await S.wallet.signTransaction([[{ txn: txn, signers:[S.address] }]]);
    var sent = await S.algod.sendRawTransaction(signed[0]).do();
    var txid = sent.txid || sent.txId;
    await algosdk.waitForConfirmation(S.algod, txid, 4);
    await refreshAccount();
  } catch(e){ alert('Opt-in failed: '+String(e)); }
}

async function pay(svc, btn){
  if (!svc || !S.address) return;
  var label = btn.innerHTML; btn.disabled=true; btn.innerHTML='<span class="spinner"></span>';
  var input = el('svcInput').value.trim();
  var steps = [ {k:'on',t:'Requesting service → 402 challenge'}, {k:'',t:'Sign USDC payment in Pera'}, {k:'',t:'Settling on Algorand TestNet'}, {k:'',t:'Service response'} ];
  setSteps(steps);
  function mark(i,k,t){ steps[i].k=k; if(t)steps[i].t=t; setSteps(steps); }
  try {
    // 1. 402 challenge
    var chalRes = await fetch(svc.path, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: input }) });
    if (chalRes.status !== 402) throw new Error('expected 402, got '+chalRes.status);
    var req = (await chalRes.json()).accepts[0];
    mark(0,'ok'); mark(1,'on');

    // 2. build + sign the USDC transfer
    var sp = await S.algod.getTransactionParams().do();
    var txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: S.address, receiver: req.payTo, amount: req.amountMicroUsdc,
      assetIndex: Number(req.asset), suggestedParams: sp,
      note: new TextEncoder().encode('x402:'+req.paymentId)
    });
    var signed = await S.wallet.signTransaction([[{ txn: txn, signers:[S.address] }]]);
    mark(1,'ok'); mark(2,'on');

    // 3. X-PAYMENT retry → server verifies + submits + settles
    var payload = { x402Version:1, paymentId:req.paymentId, nonce:req.nonce, from:S.address,
      amount:req.maxAmountRequired, amountMicroUsdc:req.amountMicroUsdc, authorizedAt:new Date().toISOString(),
      network:req.network, asset:req.asset, payTo:req.payTo, signedTxnB64:u8ToB64(signed[0]) };
    var xpay = btoa(JSON.stringify(payload));
    var payRes = await fetch(svc.path, { method:'POST', headers:{'content-type':'application/json','X-PAYMENT':xpay}, body: JSON.stringify({ text: input }) });
    if (!payRes.ok){ var err = await payRes.json().catch(function(){return {};}); throw new Error(err.detail||err.error||('HTTP '+payRes.status)); }
    var settle = decodeResp(payRes.headers.get('X-PAYMENT-RESPONSE')) || {};
    var body = await payRes.json();
    mark(2,'ok', 'Settled on-chain'); mark(3,'ok');

    addReceipt(svc, settle, body);
    await refreshAccount();
  } catch(e){
    var i = steps.findIndex(function(s){return s.k==='on';}); if(i<0)i=1;
    mark(i,'err', String(e).indexOf('modal is closed')>=0 || String(e).indexOf('rejected')>=0 ? 'Signature cancelled' : ('Failed: '+String(e)));
  } finally { btn.disabled=false; btn.innerHTML=label; renderServices(); }
}

function addReceipt(svc, settle, body){
  var link = settle.explorerUrl ? '<a href="'+settle.explorerUrl+'" target="_blank">'+(settle.txId||'').slice(0,10)+'…</a>' : (settle.txId||'—');
  var div = document.createElement('div'); div.className='receipt';
  div.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--grn2)">✓ Paid '+svc.price+' · '+svc.id+'</div>'
    +'<div class="kv"><span>Status</span><span style="color:var(--grn2)">Settled · USDC · Algorand</span></div>'
    +'<div class="kv"><span>Tx</span><span class="mono">'+link+'</span></div>'
    +'<pre>'+JSON.stringify(body.result||body, null, 2)+'</pre>';
  el('receipts').prepend(div);
}

boot();
</script>
</body>
</html>`;
