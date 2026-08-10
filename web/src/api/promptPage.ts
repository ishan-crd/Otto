/**
 * The "Sell a Prompt" page, served at /prompt. A buyer types a prompt, Otto runs
 * it on a real model and prices it by the actual output size; the answer is only
 * revealed once the buyer pays that exact amount over x402 on Algorand (either
 * with Otto's account for a one-click demo, or their own Pera/Lute wallet).
 */
export const PROMPT_PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sell a Prompt — Otto x402</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{ --bg:#0A0A0B; --tx:#F2F1F6; --mut:rgba(242,241,246,0.55); --dim:rgba(242,241,246,0.34);
    --lav:#B3AAFF; --lav2:#C8C1FF; --grn:#8FE3B4; --grn2:#A9EFC8; --mono:'JetBrains Mono',monospace;
    --card:rgba(255,255,255,0.04); --bd:rgba(255,255,255,0.08); }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--tx);font-family:'Space Grotesk',system-ui,sans-serif}
  a{color:var(--lav)} .mono{font-family:var(--mono)}
  .wrap{max-width:760px;margin:0 auto;padding:40px 22px 80px}
  .top{display:flex;align-items:center;justify-content:space-between;gap:14px}
  .back{font-size:13px;color:var(--mut);text-decoration:none}
  .chip{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--mut);border:1px solid var(--bd);background:var(--card);border-radius:99px;padding:6px 12px}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--grn)}
  h1{font-size:clamp(30px,5vw,46px);letter-spacing:-0.03em;line-height:1.05;margin:26px 0 10px;
    background:linear-gradient(180deg,#fff,#C7C1F0 80%,#9B93D6);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lead{font-size:15px;color:var(--mut);line-height:1.55;max-width:620px}
  .steps{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .step{flex:1;min-width:170px;border:1px solid var(--bd);background:var(--card);border-radius:14px;padding:13px 15px;font-size:12.5px;color:var(--mut)}
  .step b{color:var(--tx);display:block;font-size:12.5px;margin-bottom:3px}
  .card{border:1px solid var(--bd);background:var(--card);border-radius:22px;padding:22px;margin-top:22px}
  label{font-size:11px;letter-spacing:0.08em;color:var(--dim);display:block;margin-bottom:8px}
  textarea{width:100%;min-height:120px;resize:vertical;background:rgba(10,10,11,0.5);border:1px solid var(--bd);border-radius:14px;
    color:var(--tx);font-family:inherit;font-size:15px;padding:14px 16px;outline:none}
  textarea:focus{border-color:rgba(169,160,255,0.5)}
  .row{display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap}
  select{height:46px;background:rgba(10,10,11,0.5);border:1px solid var(--bd);border-radius:13px;color:var(--tx);font-family:inherit;font-size:13px;padding:0 12px;outline:none}
  .btn{height:46px;padding:0 20px;border-radius:13px;border:1px solid var(--bd);background:rgba(255,255,255,0.05);color:var(--tx);font-family:inherit;font-size:13.5px;cursor:pointer}
  .btn:hover{background:rgba(255,255,255,0.09)}
  .btn.pri{border-color:rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-weight:600}
  .btn:disabled{opacity:0.6;cursor:default}
  .quote{display:none;border:1px solid rgba(169,160,255,0.28);background:linear-gradient(160deg,rgba(169,160,255,0.1),rgba(255,255,255,0.02));border-radius:22px;padding:22px;margin-top:18px}
  .qhead{display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap}
  .qprice{font-family:var(--mono);font-size:34px;letter-spacing:-0.02em}
  .qtok{font-size:12.5px;color:var(--mut)}
  .qbreak{font-size:11.5px;color:var(--dim);margin-top:4px}
  .preview{margin-top:16px;padding:14px 16px;border:1px solid var(--bd);border-radius:14px;background:rgba(10,10,11,0.4);
    font-size:13.5px;line-height:1.5;color:var(--mut);position:relative;max-height:78px;overflow:hidden}
  .preview:after{content:'';position:absolute;left:0;right:0;bottom:0;height:40px;background:linear-gradient(180deg,transparent,rgba(10,10,11,0.9))}
  .plabel{font-size:10px;letter-spacing:0.08em;color:var(--dim);margin-bottom:7px}
  .pays{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
  .result{display:none;border:1px solid rgba(143,227,180,0.28);background:linear-gradient(160deg,rgba(143,227,180,0.08),rgba(255,255,255,0.02));border-radius:22px;padding:22px;margin-top:18px}
  .rhead{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600;color:var(--grn2)}
  .answer{margin-top:14px;white-space:pre-wrap;font-size:14.5px;line-height:1.6}
  .rmeta{margin-top:14px;padding-top:14px;border-top:1px solid var(--bd);font-size:12px;color:var(--mut)}
  .note{font-size:12px;color:var(--dim);margin-top:16px;line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a class="back" href="/">‹ Otto dashboard</a>
    <span class="chip"><span class="dot"></span> USDC · Algorand TestNet</span>
  </div>

  <h1>Sell a prompt.</h1>
  <div class="lead">Someone out of AI credits? Send Otto a prompt. It runs on a real model, prices the job by the <b>actual output size</b>, and reveals the answer once you pay — a real USDC micropayment over x402 on Algorand.</div>

  <div class="steps">
    <div class="step"><b>1 · Submit</b>Type a prompt, pick a model.</div>
    <div class="step"><b>2 · Priced by output</b>base + per-token × tokens generated.</div>
    <div class="step"><b>3 · Pay → reveal</b>USDC on Algorand, then the full answer.</div>
  </div>

  <div class="card">
    <label>YOUR PROMPT</label>
    <textarea id="prompt" placeholder="e.g. Write a 6-line pitch for an AI that pays other AIs to do work."></textarea>
    <div class="row">
      <select id="model"></select>
      <button class="btn pri" id="quoteBtn">Get quote &amp; run</button>
    </div>
  </div>

  <div class="quote" id="quote">
    <div class="qhead">
      <div>
        <div class="plabel">PRICE FOR THIS ANSWER</div>
        <div class="qprice" id="qPrice">$0.00</div>
        <div class="qbreak" id="qBreak"></div>
      </div>
      <div style="text-align:right">
        <div class="qtok mono" id="qTokens"></div>
        <div class="qtok" id="qModel" style="margin-top:4px;color:var(--dim)"></div>
      </div>
    </div>
    <div class="plabel" style="margin-top:16px">PREVIEW (pay to unlock the full answer)</div>
    <div class="preview" id="qPreview"></div>
    <div class="pays">
      <button class="btn pri" id="demoBtn">Pay with Otto (demo)</button>
      <button class="btn" id="peraBtn">Pay with Pera</button>
      <button class="btn" id="luteBtn">Pay with Lute</button>
    </div>
    <div class="note">“Otto (demo)” pays from Otto’s own funded TestNet account — one click, real on-chain settlement. Pera / Lute pay from your wallet (needs test USDC + opt-in).</div>
  </div>

  <div class="result" id="result">
    <div class="rhead">✓ Paid — here’s your answer</div>
    <div class="answer mono" id="aAnswer"></div>
    <div class="rmeta" id="aMeta"></div>
  </div>
</div>

<script type="module">
var algosdk=null; try{ algosdk=(await import('https://esm.sh/algosdk@3.2.0')).default; }catch(e){}
var TESTNET_GENESIS='testnet-v1.0';
var S={ info:null, quote:null, algod:null, address:null };
function el(id){ return document.getElementById(id); }
function u8ToB64(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s); }

async function boot(){
  try{ S.info=await fetch('/api/live/info').then(function(r){return r.json();}); }catch(e){}
  if(algosdk && S.info) S.algod=new algosdk.Algodv2('', S.info.algodServer, S.info.algodPort);
  var models=[];
  try{ var m=await fetch('/api/models').then(function(r){return r.json();}); models=(m.models||[]).filter(function(x){return x.id.indexOf('anthropic/')===0;}).slice(0,8); }catch(e){}
  if(!models.length) models=[{id:'anthropic/claude-3.5-sonnet',name:'Claude 3.5 Sonnet'},{id:'anthropic/claude-3-haiku',name:'Claude 3 Haiku'}];
  models.push({id:'openai/gpt-4o-mini',name:'GPT-4o mini (cheap)'});
  el('model').innerHTML=models.map(function(x){ return '<option value="'+x.id+'">'+(x.name||x.id)+'</option>'; }).join('');
}

async function getQuote(){
  var prompt=el('prompt').value.trim(); if(!prompt){ el('prompt').focus(); return; }
  var btn=el('quoteBtn'); btn.disabled=true; btn.textContent='Running the model…';
  el('result').style.display='none'; el('quote').style.display='none';
  try{
    var q=await fetch('/api/prompt/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:prompt, model:el('model').value})}).then(function(r){return r.json();});
    if(q.error) throw new Error(q.detail||q.error);
    S.quote=q; renderQuote(q);
  }catch(e){ alert('Quote failed: '+String(e)); }
  finally{ btn.disabled=false; btn.textContent='Get quote & run'; }
}
function renderQuote(q){
  el('qModel').textContent=q.model;
  el('qTokens').textContent=q.outputTokens+' output tokens · '+q.words+' words';
  el('qPrice').textContent='$'+Number(q.priceUsdc).toFixed(4);
  el('qBreak').textContent='base $'+Number(q.baseUsdc).toFixed(3)+'  +  '+q.outputTokens+' × $'+Number(q.perTokenUsdc).toFixed(5)+'/token';
  el('qPreview').textContent=q.preview;
  el('quote').style.display='block';
  el('quote').scrollIntoView({behavior:'smooth',block:'center'});
}
async function payDemo(){
  if(!S.quote) return; var btn=el('demoBtn'); btn.disabled=true; btn.textContent='Settling on Algorand…';
  try{
    var r=await fetch('/api/prompt/claim-demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jobId:S.quote.jobId})}).then(function(x){return x.json();});
    if(!r.ok) throw new Error(r.detail||'failed'); reveal(r);
  }catch(e){ alert('Payment failed: '+String(e)); }
  finally{ btn.disabled=false; btn.textContent='Pay with Otto (demo)'; }
}
async function makeWallet(kind){
  if(kind==='lute'){
    var LuteConnect=(await import('https://esm.sh/lute-connect@1.4.1')).default;
    var lute=new LuteConnect('Otto');
    return { connect:function(){ return lute.connect(TESTNET_GENESIS); },
      signB64:async function(txn){ var b64=u8ToB64(algosdk.encodeUnsignedTransaction(txn)); var res=await lute.signTxns([{txn:b64}]); var s=res[0]; return (typeof s==='string')?s:u8ToB64(s); } };
  }
  var mod=await import('https://esm.sh/@perawallet/connect@1');
  var pera=new mod.PeraWalletConnect({ chainId:S.info.chainId });
  return { connect:function(){ return pera.connect(); },
    signB64:async function(txn){ var s=await pera.signTransaction([[{ txn:txn, signers:[S.address] }]]); return u8ToB64(s[0]); } };
}
async function payWallet(kind){
  if(!S.quote || !algosdk || !S.algod){ alert('Wallet path needs algosdk — use the demo button.'); return; }
  var req=S.quote.accepts[0];
  var btn=el(kind==='lute'?'luteBtn':'peraBtn'); var label=btn.textContent; btn.disabled=true; btn.textContent='Connecting…';
  try{
    var w=await makeWallet(kind);
    var accts=await w.connect();
    var a=accts&&accts[0]; S.address=(a&&a.address)?a.address:a;
    btn.textContent='Sign payment…';
    var sp=await S.algod.getTransactionParams().do();
    var txn=algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ sender:S.address, receiver:req.payTo, amount:req.amountMicroUsdc, assetIndex:Number(req.asset), suggestedParams:sp, note:new TextEncoder().encode('x402:'+req.paymentId) });
    var signedB64=await w.signB64(txn);
    btn.textContent='Settling…';
    var payload={ x402Version:1, paymentId:req.paymentId, nonce:req.nonce, from:S.address, amount:req.maxAmountRequired, amountMicroUsdc:req.amountMicroUsdc, authorizedAt:new Date().toISOString(), network:req.network, asset:req.asset, payTo:req.payTo, signedTxnB64:signedB64 };
    var r=await fetch('/api/prompt/claim',{method:'POST',headers:{'content-type':'application/json','X-PAYMENT':btoa(JSON.stringify(payload))},body:'{}'}).then(function(x){return x.json();});
    if(!r.ok) throw new Error(r.detail||r.error||'failed'); reveal(r);
  }catch(e){ alert('Wallet payment failed: '+String(e)); }
  finally{ btn.disabled=false; btn.textContent=label; }
}
function reveal(r){
  el('quote').style.display='none';
  el('aAnswer').textContent=r.answer;
  el('aMeta').innerHTML='Paid $'+Number(r.priceUsdc).toFixed(4)+' · '+r.model+' · '+r.outputTokens+' output tokens · '+(r.explorerUrl?'<a href="'+r.explorerUrl+'" target="_blank">tx '+String(r.txId).slice(0,12)+'…</a>':('tx '+r.txId));
  el('result').style.display='block';
  el('result').scrollIntoView({behavior:'smooth',block:'center'});
}
el('quoteBtn').onclick=getQuote;
el('demoBtn').onclick=payDemo;
el('peraBtn').onclick=function(){ payWallet('pera'); };
el('luteBtn').onclick=function(){ payWallet('lute'); };
boot();
</script>
</body>
</html>`;
