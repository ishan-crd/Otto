/** Login / sign-up (Supabase-backed), served at /login. */
export const LOGIN_PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sign in — Otto</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root{ --bg:#0A0A0B; --tx:#F2F1F6; --mut:rgba(242,241,246,0.55); --dim:rgba(242,241,246,0.34);
    --lav:#B3AAFF; --grn2:#A9EFC8; --card:rgba(255,255,255,0.04); --bd:rgba(255,255,255,0.08); }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:var(--bg);color:var(--tx);font-family:'Space Grotesk',system-ui,sans-serif}
  body{display:flex;align-items:center;justify-content:center;padding:24px}
  .g{position:fixed;top:-200px;left:40%;width:800px;height:500px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(150,140,225,0.18),rgba(10,10,11,0) 68%);filter:blur(30px);pointer-events:none}
  .box{position:relative;width:100%;max-width:420px}
  .mark{display:flex;align-items:center;gap:11px;justify-content:center;margin-bottom:22px}
  .mk{width:36px;height:36px;border-radius:12px;background:linear-gradient(145deg,#E7E3FF,#8F87C9 42%,#3A3752 78%,#D9D4F5);display:flex;align-items:center;justify-content:center}
  .mk div{width:11px;height:11px;border-radius:50%;border:2.5px solid #131320}
  .mname{font-size:17px;font-weight:600}
  h1{font-size:24px;letter-spacing:-0.02em;text-align:center;margin:0 0 6px}
  .sub{font-size:13px;color:var(--mut);text-align:center;margin-bottom:22px}
  .card{border:1px solid var(--bd);background:var(--card);backdrop-filter:blur(24px);border-radius:22px;padding:24px}
  .tabs{display:flex;gap:5px;padding:4px;border:1px solid var(--bd);background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:18px}
  .tab{flex:1;text-align:center;padding:9px;border-radius:9px;font-size:13px;color:var(--mut);cursor:pointer;border:1px solid transparent}
  .tab.on{color:var(--tx);background:rgba(169,160,255,0.16);border-color:rgba(169,160,255,0.24)}
  label{font-size:11px;letter-spacing:0.07em;color:var(--dim);display:block;margin:12px 0 7px}
  input{width:100%;height:46px;background:rgba(10,10,11,0.5);border:1px solid var(--bd);border-radius:12px;color:var(--tx);font-family:inherit;font-size:14.5px;padding:0 14px;outline:none}
  input:focus{border-color:rgba(169,160,255,0.5)}
  .btn{width:100%;height:48px;margin-top:18px;border-radius:13px;border:1px solid rgba(211,206,255,0.4);background:linear-gradient(160deg,#CFC9FF,#9990E8);color:#14121F;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer}
  .btn:disabled{opacity:0.6}
  .msg{font-size:12.5px;color:#FFB3AC;text-align:center;margin-top:12px;min-height:16px;line-height:1.5}
  .msg.ok{color:var(--grn2)}
  .foot{font-size:11.5px;color:var(--dim);text-align:center;margin-top:16px;line-height:1.6}
</style>
</head>
<body>
<div class="g"></div>
<div class="box">
  <div class="mark"><div class="mk"><div></div></div><div class="mname">Otto</div></div>
  <h1 id="title">Welcome back</h1>
  <div class="sub">Sign in to buy prompts over x402 — accounts live in Supabase.</div>
  <div class="card">
    <div class="tabs"><div class="tab on" id="tLogin">Log in</div><div class="tab" id="tSignup">Sign up</div></div>
    <div id="nameRow" style="display:none"><label>NAME</label><input id="name" placeholder="Your name" /></div>
    <label>EMAIL</label><input id="email" type="email" placeholder="you@example.com" autocomplete="username" />
    <label>PASSWORD</label><input id="password" type="password" placeholder="6+ characters" autocomplete="current-password" />
    <button class="btn" id="submit">Log in</button>
    <div class="msg" id="msg"></div>
  </div>
  <div class="foot">Auth &amp; user data are stored in your Supabase project (Postgres).<br/>Payments settle in USDC over x402 on Algorand TestNet.</div>
</div>

<script>
var mode='login';
function el(id){ return document.getElementById(id); }
function setMode(m){
  mode=m;
  el('tLogin').className='tab'+(m==='login'?' on':''); el('tSignup').className='tab'+(m==='signup'?' on':'');
  el('nameRow').style.display=m==='signup'?'block':'none';
  el('submit').textContent=m==='signup'?'Create account':'Log in';
  el('title').textContent=m==='signup'?'Create your account':'Welcome back';
  el('msg').textContent='';
}
el('tLogin').onclick=function(){ setMode('login'); };
el('tSignup').onclick=function(){ setMode('signup'); };

async function submit(){
  var email=el('email').value.trim(), password=el('password').value;
  if(!email||!password){ el('msg').className='msg'; el('msg').textContent='Enter email and password.'; return; }
  var btn=el('submit'); btn.disabled=true;
  var path=mode==='signup'?'/api/auth/signup':'/api/auth/login';
  var body=mode==='signup'?{ name:el('name').value.trim(), email:email, password:password }:{ email:email, password:password };
  try{
    var r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(x){return x.json();});
    if(r.error) throw new Error(r.error);
    if(r.confirmEmail){
      el('msg').className='msg ok';
      el('msg').textContent='✓ Account created — check your inbox for the confirmation link, then log in.';
      setMode('login'); btn.disabled=false; return;
    }
    localStorage.setItem('otto_token', r.token);
    localStorage.setItem('otto_user', JSON.stringify(r.user));
    el('msg').className='msg ok'; el('msg').textContent='✓ Welcome, '+r.user.name+' — entering…';
    setTimeout(function(){ location.href=new URLSearchParams(location.search).get('next')||'/'; }, 400);
  }catch(e){ el('msg').className='msg'; el('msg').textContent=String(e.message||e); btn.disabled=false; }
}
el('submit').onclick=submit;
el('password').addEventListener('keydown',function(e){ if(e.key==='Enter') submit(); });

if(localStorage.getItem('otto_token')){
  fetch('/api/auth/me',{headers:{Authorization:'Bearer '+localStorage.getItem('otto_token')}}).then(function(r){ if(r.ok) location.href=new URLSearchParams(location.search).get('next')||'/'; else localStorage.removeItem('otto_token'); });
}
</script>
</body>
</html>`;
