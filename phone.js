// phone.js - Accra Life smartphone: Bank, Map, Jobs, Camera, Accra Vibe, Messages, VYBA, CHIRP, LOOP, PING, JOLLY MART, CEDIPAY, JAMBOX, Settings
(function(){
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let S={money:200,sav:0,tx:[]};try{S=Object.assign(S,JSON.parse(localStorage.getItem('accra-bb-save')))}catch(e){}
 const save=()=>{try{localStorage.setItem('accra-bb-save',JSON.stringify(S))}catch(e){}};
 const add=(d,w)=>{S.money+=d;S.tx.unshift({d,w});S.tx.length=Math.min(S.tx.length,20);save();paint();if(ph.classList.contains('on'))render()};
 window.ACCRA_STATE=S;window.ACCRA_ADD=add;
 // ---------- alerts (real: other scripts call ACCRA_NOTIFY) ----------
 let AL=[];try{AL=JSON.parse(localStorage.getItem('accra-alerts'))||[]}catch(e){}
 const saveAl=()=>{try{localStorage.setItem('accra-alerts',JSON.stringify(AL.slice(0,30)))}catch(e){}};
 const unread=()=>AL.filter(a=>a.u).length;
 window.ACCRA_NOTIFY=(m,a)=>{AL.unshift({m:String(m),a:a||'msg',t:Date.now(),u:1});AL=AL.slice(0,30);saveAl();badges()};
 // ---------- styles ----------
 const st=document.createElement('style');
 st.textContent='#pbtn2{position:fixed;right:8px;top:calc(env(safe-area-inset-top,0px) + 90px);border:0;border-radius:14px;background:#c9a54a;font-size:22px;padding:4px 12px;z-index:6}'+
 '.bg{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;background:#e5484d;color:#fff;font:700 10px/16px system-ui;text-align:center;text-decoration:none;padding:0 3px;box-shadow:0 0 0 2px #14161a}'+
 '.p2{position:fixed;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);width:min(54vw,262px);display:flex;flex-direction:column;background:linear-gradient(165deg,#25282d,#14161a 62%,#0c0d10);border:6px solid #0b0b0e;border-radius:34px;overflow:hidden;z-index:30;color:#fff;font:13px -apple-system,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6),0 0 0 1px rgba(201,165,74,.35);transform:translateY(24px) scale(.96);opacity:0;pointer-events:none;visibility:hidden;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .22s,visibility 0s .28s}'+
 '.p2.on{transform:none;opacity:1;pointer-events:auto;visibility:visible;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .22s}'+
 '@media (orientation:portrait){.p2{width:min(76vw,300px)}}'+
 '.p2 .sb{display:flex;justify-content:space-between;align-items:center;padding:8px 18px 0;font-weight:700;font-size:11px}.p2 .hd{display:flex;align-items:center;gap:8px;padding:6px 14px 2px;color:#c9a54a;font:700 11px system-ui;letter-spacing:.5px;white-space:nowrap}.p2 .hd i{flex:1;height:1px;background:rgba(201,165,74,.55)}'+
 '.p2 .bd{flex:1;overflow:auto;padding:6px 12px;-webkit-overflow-scrolling:touch;touch-action:pan-y}.p2 .pin{animation:pin .22s ease-out}@keyframes pin{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}.p2 h3{margin:4px 0 6px;font-size:15px}'+
 '.p2 .nv{display:flex;justify-content:space-between;align-items:center;padding:6px 14px 10px;border-top:1px solid rgba(255,255,255,.08)}.p2 .nv button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:50%;width:40px;height:40px;font-size:17px}.p2 .nv #phm{width:46px;height:46px;background:none;border:2px solid #c9a54a;color:#c9a54a;font-size:20px}'+
 '.p2 .ag{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 4px;margin-top:4px}.p2 .ai{border:0;background:none;color:#fff;font-size:10.5px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0;min-height:44px}.p2 .ai i{position:relative;font-style:normal;width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:25px;background:linear-gradient(160deg,rgba(255,255,255,.3),rgba(255,255,255,0) 55%),var(--c);box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .12s}.p2 .ai:active i{transform:scale(.9)}'+
 '.p2 .bal{display:flex;justify-content:center;align-items:center;gap:8px;width:100%;margin-top:14px;padding:10px;border:1.5px solid #c9a54a;border-radius:20px;background:rgba(201,165,74,.08);color:#c9a54a;font:800 17px system-ui}.p2 .bal b{font-size:20px}'+
 '.p2 .cd{background:rgba(255,255,255,.1);border-radius:12px;padding:8px 10px;margin:6px 0}.p2 .tx{display:flex;justify-content:space-between;align-items:center;gap:6px}.p2 .bt{border:0;border-radius:10px;background:#c9a54a;color:#17191c;font-weight:700;padding:9px 12px;font-size:12px;margin:3px 3px 0 0;min-height:38px}.p2 .big{font-size:24px;font-weight:800;color:#c9a54a}.p2 .up{color:#69f0ae}.p2 .dn{color:#ff8a80}.p2 img{width:100%;border-radius:10px;margin-top:6px}.p2 .unr{border-left:3px solid #e5484d}.p2 input[type=range]{width:100%}'+
 '#mny,#nvp{position:fixed;right:8px;background:rgba(28,30,33,.78);border-radius:14px;padding:6px 12px;font:700 13px system-ui;z-index:5}#mny{top:calc(env(safe-area-inset-top,0px) + 46px);color:#c9a54a}#nvp{top:calc(env(safe-area-inset-top,0px) + 134px);color:#fff;display:none}'+
 '#ptoast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);transform:translateX(-50%);background:#25282c;border:1px solid #c9a54a;color:#f2f0ea;padding:8px 14px;border-radius:14px;font:700 14px system-ui;z-index:40;opacity:0;transition:opacity .3s;pointer-events:none;text-align:center;max-width:80%}';
 document.head.appendChild(st);
 const el=(t,id,cls)=>{const e=document.createElement(t);if(id)e.id=id;if(cls)e.className=cls;document.body.appendChild(e);return e};
 const money=el('div','mny'),navp=el('div','nvp'),tst=el('div','ptoast'),ph=el('div','phone2','p2'),btn=el('button','pbtn2');
 btn.innerHTML='📱<u id="pbdg" class="bg" style="display:none"></u>';
 ph.innerHTML='<div class="sb"><span id="ptm2"></span><span id="psg"></span><span id="pbat">🔋</span></div><div class="hd"><i></i>ACCRA LIFE • v3<i></i></div><div class="bd" id="pbd"></div><div class="nv"><button id="pbk" aria-label="Back">◂</button><button id="phm" aria-label="Home">⌂</button><button id="pcl" aria-label="Close">✕</button></div>';
 let tt;const toast=m=>{tst.textContent=m;tst.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>tst.style.opacity=0,2400)};
 const paint=()=>{money.textContent='GH₵ '+S.money.toLocaleString()};paint();
 // ---------- status bar: real clock, connection and battery when the browser reports them ----------
 const bars=()=>{const c=navigator.connection&&navigator.connection.effectiveType,n=!navigator.onLine?0:c==='4g'?4:c==='3g'?3:c==='2g'?2:c==='slow-2g'?1:4;return '▂▄▆█'.slice(0,n).padEnd(4,'·')+(c?' '+c.toUpperCase():'')};
 if(navigator.getBattery)navigator.getBattery().then(b=>{const u=()=>{$('pbat').textContent='🔋'+Math.round(b.level*100)+'%'};u();b.addEventListener('levelchange',u)}).catch(()=>{});
 // ---------- destinations from the real city grid ----------
 const XS=[-110,-35,35,110],D={};DG.forEach((row,i)=>row.forEach((n,j)=>{(D[n]=D[n]||[]).push([XS[i],XS[j]])}));
 const DEST=Object.entries(D).map(([n,a])=>({n,x:a.reduce((s,p)=>s+p[0],0)/a.length,z:a.reduce((s,p)=>s+p[1],0)/a.length}));
 DEST.push({n:'Your villa',x:VX,z:VZ});DEST.push({n:'Accra Mall',x:35,z:22});DEST.push({n:'Sports Stadium',x:110,z:35});DEST.push({n:'Police Department',x:35,z:82});DEST.push({n:'Accra Hospital',x:110,z:82});DEST.push({n:'Accra Motors (cars)',x:35,z:-52});DEST.push({n:'Accra Stone Quarry',x:190,z:-150});DEST.push({n:'Accra Gold Works',x:196,z:120});DEST.push({n:'Labadi Beach (swimming)',x:-90,z:188});(window.ACCRA_LANDMARKS||[]).forEach(d=>DEST.push(d));
 const ALLD=()=>DEST.concat(window.ACCRA_DEST_EXTRA||[]),fd=n=>n>=1000?(n/1000).toFixed(1)+' km':n+' m',pos=()=>(driving?car:player).position,dist=d=>Math.round(Math.hypot(d.x-pos().x,d.z-pos().z));
 let nav=null,job=null;
 const bm=BABYLON.MeshBuilder.CreateCylinder('bc',{height:70,diameter:3},scene);bm.material=Object.assign(new BABYLON.StandardMaterial('bcm',scene),{emissiveColor:C3('#c9a54a'),disableLighting:true,alpha:.35,fogEnabled:false});bm.isPickable=false;bm.setEnabled(false);
 function setNav(d){nav=d;bm.setEnabled(!!d);if(d)bm.position.set(d.x,35,d.z);navp.style.display=d?'block':'none'}
 let clk=0;
 scene.onBeforeRenderObservable.add(()=>{
  if(++clk%30===0&&ph.classList.contains('on')){$('ptm2').textContent=new Date().toTimeString().slice(0,5);$('psg').textContent=bars()+(window.ACCRA_WEATHER?' · '+window.ACCRA_WEATHER.label():'')}
  if(!nav)return;const m=dist(nav);navp.textContent='➤ '+nav.n+' · '+fd(m);
  if(m<20){const n=nav;setNav(null);
   if(job&&job.stage===0&&n===job.a){job.stage=1;setNav(job.b);toast('Package picked up. Deliver to '+job.b.n)}
   else if(job&&job.stage===1&&n===job.b){const p=job.pay;add(p,'Delivery to '+job.b.n);toast('Delivered! +GH₵'+p);window.ACCRA_NOTIFY('Delivery to '+job.b.n+' complete: +GH₵'+p,'jobs');job=null}
   else toast('You have arrived: '+n.n)}});
 // ---------- JAMBOX: generated music (no licensed songs). Pub and other scripts can call ACCRA_AUDIO ----------
 const AU={ctx:null,master:null,sg:null,timer:null,step:0,next:0,vol:.6,key:null,noise:null};let OUT=null;
 const STN={highlife:{n:'Highlife Sunrise',bpm:108,root:196,kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],bass:[0,,,,5,,,,7,,,,5,,,,],lead:[12,,16,,19,,16,,14,,17,,21,,17,]},
  afro:{n:'Afro Groove',bpm:102,root:175,kick:[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0],snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],bass:[0,,0,,,3,,,5,,,3,,,2,],lead:[,12,,,15,,12,,,19,,,17,,15,]},
  chill:{n:'Accra FM Chill',bpm:78,root:196,kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],snare:[],hat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],bass:[0,,,,,,,,-3,,,,,,,],lead:[12,,,,16,,,,19,,,,16,,,]}};
 function audioOn(){if(!AU.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;AU.ctx=new C();AU.master=AU.ctx.createGain();AU.master.gain.value=AU.vol;AU.master.connect(AU.ctx.destination);AU.sg=AU.ctx.createGain();AU.sg.gain.value=.9;AU.sg.connect(AU.ctx.destination);
   const b=AU.ctx.createBuffer(1,AU.ctx.sampleRate*.3,AU.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=b}
  if(AU.ctx.state==='suspended')AU.ctx.resume();return true}
 function voice(t,type,f0,f1,dur,g){const c=AU.ctx,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(v);v.connect(OUT||AU.master);o.start(t);o.stop(t+dur+.02)}
 function hit(t,freq,dur,g,type){const c=AU.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain();s.buffer=AU.noise;f.type=type;f.frequency.value=freq;v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(v);v.connect(OUT||AU.master);s.start(t);s.stop(t+dur)}
 function tick(){const P=STN[AU.key];if(!P||!AU.ctx)return;const sd=60/P.bpm/4;
  while(AU.next<AU.ctx.currentTime+.15){const i=AU.step%16,t=AU.next;
   if(P.kick[i])voice(t,'sine',130,45,.16,.9);if(P.snare[i])hit(t,1800,.1,.5,'bandpass');if(P.hat[i])hit(t,7000,.04,.22,'highpass');
   if(P.bass[i]!=null)voice(t,'triangle',P.root/2*Math.pow(2,P.bass[i]/12),0,.24,.5);
   if(P.lead[i]!=null)voice(t,'square',P.root*Math.pow(2,P.lead[i]/12),0,.16,.07);
   AU.next+=sd;AU.step++}}
 function playSt(k,v){if(!STN[k]||!audioOn())return;AU.key=k;if(v!=null){AU.vol=v;AU.master.gain.value=v}AU.step=0;AU.next=AU.ctx.currentTime+.05;clearInterval(AU.timer);AU.timer=setInterval(tick,40)}
 function stopSt(){clearInterval(AU.timer);AU.key=null}
 const SX={eng:null,engG:null,sir:null,sirIv:null};
 function sfx(n){
  if(n==='siren'){if(!audioOn()||SX.sir)return;const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.type='sawtooth';g.gain.value=.05;o.connect(g);g.connect(AU.sg);o.start();SX.sir=o;let hi=0;const f=()=>{o.frequency.setTargetAtTime(hi?950:700,c.currentTime,.05);hi^=1};f();SX.sirIv=setInterval(f,450);return}
  if(n==='siren-stop'){if(SX.sir){try{SX.sir.stop()}catch(e){}SX.sir=null;clearInterval(SX.sirIv)}return}
  if(!audioOn())return;const t=AU.ctx.currentTime;OUT=AU.sg;
  try{
   if(n==='step')hit(t,520,.05,.14,'lowpass');
   else if(n==='splash')hit(t,900,.2,.25,'bandpass');
   else if(n==='clink'){voice(t,'sine',2400,2000,.25,.14);voice(t+.04,'sine',3100,2600,.2,.1)}
   else if(n==='punch'){hit(t,650,.09,.7,'lowpass');voice(t,'sine',140,50,.14,.7)}
   else if(n==='clap')hit(t,1600,.05,.55,'bandpass');
   else if(n==='cheer'){[0,.12,.24].forEach((d,i)=>voice(t+d,'sawtooth',300+i*90,520+i*90,.28,.05))}
   else if(n==='clang'){voice(t,'square',900,700,.12,.22);hit(t,3000,.08,.3,'highpass')}
   else if(n==='gunshot'){hit(t,2500,.25,.9,'lowpass');voice(t,'sine',90,40,.22,.8)}
   else if(n==='alarm'){[0,.25,.5,.75].forEach(d=>voice(t+d,'square',1200,1200,.14,.14))}
  }finally{OUT=null}}
 function engineSnd(on,sp){
  if(!on){if(SX.eng){try{SX.eng.stop()}catch(e){}SX.eng=null}return}
  if(!audioOn())return;const c=AU.ctx;
  if(!SX.eng){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=520;g.gain.value=.05;o.connect(f);f.connect(g);g.connect(AU.sg);o.start();SX.eng=o}
  SX.eng.frequency.setTargetAtTime(52+sp*5.5,c.currentTime,.08)}
 window.ACCRA_AUDIO={play:playSt,stop:stopSt,volume:v=>{AU.vol=v;if(AU.master)AU.master.gain.value=v},now:()=>AU.key,unlock:()=>audioOn(),sfx,engine:engineSnd};
 // ---------- apps ----------
 const APPS=[['bank','💰','Bank','#2e7d32'],['map','🗺️','Map','#1e88e5'],['jobs','💼','Jobs','#6d4c41'],['cam','📷','Camera','#546e7a'],['msg','💬','Messages','#00897b'],['vyba','📸','VYBA','#d62976'],['bet','⚽','AccraBet','#0b7a3b'],['date','💞','VybaDate','#c2185b'],['mart','🛍️','JOLLY MART','#1565c0'],['cedi','👛','CEDIPAY','#16a34a'],['jam','🎵','JAMBOX','#7c4dff'],['set','⚙️','Settings','#37474f']];
 let tab='home',stack=[],shots=[];
 const soon=(n,t)=>'<div class="cd"><b>'+n+'</b><br><small>'+t+' This needs the online server, which is not built yet, so nothing can be posted or sent here for now.</small></div>';
 const txs=()=>S.tx.slice(0,8).map(x=>'<div class="cd tx"><span>'+esc(x.w)+'</span><b class="'+(x.d>0?'up':'dn')+'">'+(x.d>0?'+':'')+x.d+'</b></div>').join('')||'<div class="cd">No transactions yet</div>';
 const V2={
  bank:()=>'<div class="cd" style="text-align:center"><small>Balance</small><div class="big">GH₵ '+S.money.toLocaleString()+'</div><small>MoMo savings: GH₵ '+S.sav+'</small></div><button class="bt" data-do="dep">Save GH₵20</button><button class="bt" data-do="wd">Withdraw GH₵20</button><h3>Recent</h3>'+txs(),
  cedi:()=>{const L=window.ACCRA_LIFE,r=L&&L.rents?L.rents():[];return '<div class="cd" style="text-align:center"><small>Wallet</small><div class="big">GH₵ '+S.money.toLocaleString()+'</div><small>Savings: GH₵ '+S.sav+'</small></div><button class="bt" data-app="bank">Savings &amp; withdrawals</button>'+(r.length?'<h3>Rent due</h3>'+r.map(x=>'<div class="cd tx"><span>'+esc(x.name)+'</span><b>GH₵'+x.rent+' in '+x.mins+' min</b></div>').join(''):'')+'<h3>Transactions</h3>'+txs()+'<div class="cd"><small>Sending money to other players needs the online server (not built yet).</small></div>'},
  map:()=>(nav?'<div class="cd tx"><span>➤ '+esc(nav.n)+' · '+dist(nav)+' m</span><button class="bt" data-do="stop">Stop</button></div>':'')+ALLD().slice().sort((a,b)=>dist(a)-dist(b)).map(d=>'<div class="cd tx"><span>'+esc(d.n)+'<br><small>'+fd(dist(d))+' away</small></span><button class="bt" data-go="'+ALLD().indexOf(d)+'">Go</button></div>').join(''),
  jobs:()=>'<div class="cd"><b>🏍️ Delivery rider</b><br><small>Pick up a package in one district and deliver it to another. Pay depends on distance.</small><br>'+(job?'<small>Active: '+(job.stage?'deliver to '+esc(job.b.n):'pick up at '+esc(job.a.n))+' · GH₵'+job.pay+'</small><br><button class="bt" data-do="cancel">Cancel</button>':'<button class="bt" data-do="deliv">Start delivery</button>')+'</div>',
  cam:()=>'<button class="bt" data-do="shot">📸 Take photo</button>'+shots.map(x=>'<img src="'+x+'">').join('')+(shots.length?'<small>Press and hold a photo to save it.</small>':'<div class="cd">Photos of the game world appear here.</div>'),
  vyba:()=>'<div class="cd"><b>VYBA</b><br><small>Your photos from the Camera app. Sharing with other players needs the online server (not built yet).</small></div><button class="bt" data-do="shot">📸 Take photo</button>'+shots.map(x=>'<img src="'+x+'">').join(''),
  msg:()=>{const h=AL.length?AL.map(a=>'<div class="cd'+(a.u?' unr':'')+'">'+esc(a.m)+'<br><small>'+new Date(a.t).toTimeString().slice(0,5)+'</small></div>').join('')+'<button class="bt" data-do="clr">Clear all</button>':'<div class="cd">No alerts. Rent, health and job updates appear here.</div>';AL.forEach(a=>a.u=0);saveAl();setTimeout(badges,0);return '<div class="cd"><small>Game alerts. Messages from other players need the online server.</small></div>'+h},
  mart:()=>{const L=window.ACCRA_LIFE;if(!L)return '<div class="cd">Groceries are not ready yet. Reload the game.</div>';return '<div class="cd"><small>Groceries delivered straight to your fridge (10% fee). Cash: GH₵'+S.money.toLocaleString()+'</small></div>'+Object.keys(L.food).map(k=>'<div class="cd tx"><span>'+L.food[k][0]+'<br><small>GH₵'+Math.ceil(L.food[k][1]*1.1)+' · in fridge '+(L.stock()[k]||0)+'</small></span><button class="bt" data-buy="'+k+'">Buy</button></div>').join('')+'<div class="cd"><small>Furniture, appliances and clothes are sold at Accra Mall.</small></div>'},
  jam:()=>'<div class="cd"><small>Generated music, not licensed songs. You can add real tracks later.</small></div>'+Object.keys(STN).map(k=>'<div class="cd tx"><span>'+STN[k].n+'<br><small>'+STN[k].bpm+' BPM</small></span><button class="bt" data-st="'+k+'">'+(AU.key===k?'■ Stop':'▶ Play')+'</button></div>').join('')+'<div class="cd"><small>Volume</small><input type="range" min="0" max="100" value="'+Math.round(AU.vol*100)+'" data-vol="1"></div>',
  bet:()=>betScreen(),date:()=>dateScreen(),
  set:()=>'<div class="cd tx"><span>Shadows</span><button class="bt" data-do="shd">'+(sun.shadowEnabled?'On':'Off')+'</button></div><div class="cd tx"><span>Hide far-away buildings<br><small>Turn off if anything looks missing</small></span><button class="bt" data-do="cull">'+((window.ACCRA_CULL||{on:true}).on?'On':'Off')+'</button></div><div class="cd"><small>Progress (cash, savings, alerts) saves on this device.</small></div><div class="cd"><b>Build 5</b><br><small>'+['upgrade','life','pub','crime','fx','locations'].map(k=>k+' '+((window.ACCRA_MODULES||{})[k]?'✔':'✘')).join(' · ')+'</small></div>'};
 
 // ---------- AccraBet: play-money betting on made-up matches ----------
 const rng=seed=>{let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)};
 const TEAMS=['Accra Hearts XI','Kumasi Lions','Cape Coast Stars','Tema Mariners','Takoradi Hawks','Tamale Warriors','Ho Eagles','Koforidua Rams','Sunyani Tigers','Volta United'];
 const strength=n=>{let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))%97;return 3+h%7};
 let BETS=[];try{BETS=JSON.parse(localStorage.getItem('accra-bets'))||[]}catch(e){}
 const saveBets=()=>{try{localStorage.setItem('accra-bets',JSON.stringify(BETS.slice(0,14)))}catch(e){}};
 function matches(){const slot=Math.floor(Date.now()/600000),r=rng(slot*7919+13),t=TEAMS.slice(),out=[];
  for(let i=0;i<4;i++){const a=t.splice(Math.floor(r()*t.length),1)[0],b=t.splice(Math.floor(r()*t.length),1)[0],sa=strength(a)+1,sb=strength(b),pd=.26,p0=sa/(sa+sb)*(1-pd),p2=sb/(sa+sb)*(1-pd),od=p=>Math.max(1.15,Math.round(100/(p*1.12))/100);
   out.push({id:slot+':'+i,h:a,a:b,p:[p0,pd,p2],o:[od(p0),od(pd),od(p2)]})}return out}
 let slip=null;
 const scoreFor=r=>{const w=[[1,0],[2,1],[2,0],[3,1],[3,0]][Math.floor(Math.random()*5)];return r===0?w[0]+'-'+w[1]:r===2?w[1]+'-'+w[0]:(Math.random()<.5?'0-0':'1-1')};
 function placeBet(stake){const m=slip.m,pick=slip.pick;if(stake>S.money)return toast('Not enough cash.');
  const r=Math.random(),res=r<m.p[0]?0:r<m.p[0]+m.p[1]?1:2;
  add(-stake,'AccraBet stake');BETS.unshift({id:Date.now(),h:m.h,a:m.a,pick,odds:m.o[pick],stake,res,score:scoreFor(res),t:Date.now()+60000,done:0});saveBets();slip=null;toast('Bet placed. The match is live for 60 seconds.')}
 function settle(){let ch=0;BETS.forEach(b=>{if(!b.done&&Date.now()>=b.t){b.done=1;ch=1;const win=b.res===b.pick,pay=Math.round(b.stake*b.odds);
   if(win)add(pay,'AccraBet win');window.ACCRA_NOTIFY&&window.ACCRA_NOTIFY('AccraBet: '+b.h+' '+b.score+' '+b.a+' - '+(win?'you won GH₵'+pay:'your bet lost'),'bet')}});
  if(ch){saveBets();if(ph.classList.contains('on')&&tab==='bet')render()}}
 setInterval(settle,3000);settle();
 const LBL=['Home','Draw','Away'];
 function betScreen(){const ms=matches();
  let h='<div class="cd"><small>Play money only. Teams and matches are made up and results are random with a house edge. Never bet what you cannot lose.</small></div>';
  if(slip){h+='<div class="cd"><b>'+esc(slip.m.h)+' vs '+esc(slip.m.a)+'</b><br><small>'+LBL[slip.pick]+' @ '+slip.m.o[slip.pick]+' · choose a stake</small><br>'+[10,50,100,500].map(s=>'<button class="bt" data-stake="'+s+'">GH₵'+s+'</button>').join('')+'<button class="bt" style="background:#555;color:#fff" data-do="slipx">Cancel</button></div>'}
  h+='<h3>Matches</h3>'+ms.map((m,i)=>'<div class="cd"><b>'+esc(m.h)+'</b> vs <b>'+esc(m.a)+'</b><br>'+m.o.map((o,k)=>'<button class="bt" data-pick="'+i+':'+k+'">'+['1','X','2'][k]+' '+o+'</button>').join('')+'</div>').join('');
  h+='<h3>My bets</h3>'+(BETS.length?BETS.slice(0,8).map(b=>{const left=Math.max(0,Math.ceil((b.t-Date.now())/1000));return '<div class="cd tx"><span>'+esc(b.h)+' v '+esc(b.a)+'<br><small>'+LBL[b.pick]+' @ '+b.odds+' · stake GH₵'+b.stake+'</small></span><b class="'+(!b.done?'':b.res===b.pick?'up':'dn')+'">'+(!b.done?'Live '+left+'s':b.score+(b.res===b.pick?' ✔':' ✘'))+'</b></div>'}).join(''):'<div class="cd">No bets yet</div>');
  return h}
 // ---------- VybaDate: fictional profiles, likes, matches, chats and dates ----------
 const PROF=[['Akosua',26,'Nurse','Osu','👩🏾‍⚕️','jollof · highlife · beach walks'],['Kwame',29,'Graphic designer','East Legon','👨🏾‍🎨','football · art · street food'],['Ama',24,'Student','Labadi','👩🏾‍🎓','music · dancing · fashion'],['Kofi',31,'Mechanic','Makola','👨🏾‍🔧','cars · banku · gospel'],['Efua',27,'Teacher','Central Accra','👩🏾‍🏫','books · kenkey · sunsets'],['Yaw',28,'Chef','Airport City','👨🏾‍🍳','cooking · afrobeats · travel'],['Abena',25,'Photographer','Osu','📸','photos · cafes · nightlife'],['Kojo',30,'Trotro driver','Makola','🚐','radio · football · fufu'],['Nana',26,'Fashion designer','Labadi','👩🏾‍🎨','kente · design · markets'],['Selasi',29,'Engineer','Amoamah','👨🏾‍💻','tech · jollof · running']];
 let DT={like:[],pass:[],match:{}};try{DT=Object.assign(DT,JSON.parse(localStorage.getItem('accra-date')))}catch(e){}
 const saveDt=()=>{try{localStorage.setItem('accra-date',JSON.stringify(DT))}catch(e){}};
 let dTab='find',chat=null;
 const VENUES=[['Street food & a walk',30,{md:15,hu:10}],['Accra Mall café',60,{md:20,hu:15}],['Labadi Beach sunset',40,{md:22,en:-5}],['The Accra Vibes Pub',100,{md:26,hu:12}]];
 function dateScreen(){const api=window.ACCRA_LIFE&&window.ACCRA_LIFE.api;
  let h='<div class="cd"><small>Fictional people for now. Matching with real players needs the online server.</small></div><div class="tx"><button class="bt" data-dt="find">Discover</button><button class="bt" data-dt="matches">Matches ('+Object.keys(DT.match).length+')</button></div>';
  if(dTab==='find'){const left=PROF.map((p,i)=>i).filter(i=>!DT.like.includes(i)&&!DT.pass.includes(i));
   if(!left.length)return h+'<div class="cd">You have seen everyone nearby.<br><button class="bt" data-do="dreset">Look again</button></div>';
   const p=PROF[left[0]];return h+'<div class="cd" style="text-align:center"><div style="font-size:46px">'+p[4]+'</div><b>'+p[0]+', '+p[1]+'</b><br><small>'+p[2]+' · '+p[3]+'</small><br><small>'+p[5]+'</small><br><button class="bt" data-like="'+left[0]+'">♥ Like</button><button class="bt" style="background:#555;color:#fff" data-pass="'+left[0]+'">✕ Pass</button></div>'}
  if(chat!==null){const p=PROF[chat],m=DT.match[chat];return h+'<div class="cd"><b>'+p[4]+' '+p[0]+'</b><br><small>Bond '+m.aff+'/100</small><div style="height:6px;background:rgba(255,255,255,.15);border-radius:4px;margin:4px 0"><div style="height:100%;width:'+m.aff+'%;background:#ff4d8d;border-radius:4px"></div></div><div class="cd" style="background:rgba(255,255,255,.06)">'+esc(m.last||'Say hi!')+'</div><button class="bt" data-say="0">Compliment</button><button class="bt" data-say="1">Ask about their day</button><button class="bt" data-say="2">Tell a joke</button><h3>Plan a date</h3>'+VENUES.map((v,i)=>'<button class="bt" data-venue="'+i+'">'+v[0]+' · GH₵'+v[1]+'</button>').join('')+'<br><button class="bt" style="background:#555;color:#fff" data-dt="matches">Back</button></div>'}
  const ids=Object.keys(DT.match);return h+(ids.length?ids.map(i=>{const p=PROF[i],m=DT.match[i];return '<div class="cd tx"><span>'+p[4]+' '+p[0]+', '+p[1]+'<br><small>'+(m.aff>=100?'In a relationship ❤️':'Bond '+m.aff+'/100')+'</small></span><button class="bt" data-chat="'+i+'">Open</button></div>'}).join(''):'<div class="cd">No matches yet. Like some profiles in Discover.</div>')}
 const SAY=[['Thank you, that was sweet! 😊',3,-1],['Busy but good! How was yours?',2,0],['Ha, that was actually funny!',2,-2]];

 function badges(){const n=unread(),b=$('pbdg');if(b){b.style.display=n?'block':'none';b.textContent=n}if(ph.classList.contains('on')&&tab==='home')render()}
 const home=()=>'<div class="ag">'+APPS.map(a=>'<button class="ai" data-app="'+a[0]+'" style="--c:'+a[3]+'"><i>'+a[1]+(a[0]==='msg'&&unread()?'<u class="bg">'+unread()+'</u>':'')+'</i>'+a[2]+'</button>').join('')+'</div><button class="bal" data-app="cedi"><span>GH₵ '+S.money.toLocaleString()+'</span><b>›</b></button>';
 function render(){const ap=APPS.find(a=>a[0]===tab),bd=$('pbd');$('pbk').style.visibility=tab==='home'?'hidden':'visible';
  bd.innerHTML=ap?'<h3>'+ap[1]+' '+ap[2]+'</h3>'+V2[tab]():home();bd.classList.remove('pin');void bd.offsetWidth;bd.classList.add('pin')}
 const go=t=>{if(t!==tab){stack.push(tab);tab=t}};
 function open(o){ph.classList.toggle('on',o);document.body.classList.toggle('po',o);if(o){tab='home';stack=[];$('ptm2').textContent=new Date().toTimeString().slice(0,5);$('psg').textContent=bars();render()}}
 btn.onclick=()=>open(!ph.classList.contains('on'));$('pcl').onclick=()=>open(false);$('phm').onclick=()=>{tab='home';stack=[];render()};$('pbk').onclick=()=>{tab=stack.pop()||'home';render()};
 ph.addEventListener('input',e=>{if(e.target.dataset.vol){const v=e.target.value/100;AU.vol=v;if(AU.master)AU.master.gain.value=v}});
 ph.addEventListener('click',e=>{const b=e.target.closest('[data-app],[data-do],[data-go],[data-buy],[data-st],[data-pick],[data-stake],[data-dt],[data-like],[data-pass],[data-chat],[data-say],[data-venue]');if(!b)return;const d=b.dataset;
  if(d.app)go(d.app);
  else if(d.pick){const q=d.pick.split(':');slip={m:matches()[+q[0]],pick:+q[1]}}
  else if(d.stake){placeBet(+d.stake)}
  else if(d.do==='slipx')slip=null
  else if(d.dt){dTab=d.dt;chat=null}
  else if(d.like!==undefined){const i=+d.like,api=window.ACCRA_LIFE&&window.ACCRA_LIFE.api,md=api?api.st.md:50;DT.like.push(i);
   if(Math.random()<.4+md/250){DT.match[i]={aff:10,last:'',cd:0};toast('It is a match with '+PROF[i][0]+'!');window.ACCRA_NOTIFY&&window.ACCRA_NOTIFY('VybaDate: you matched with '+PROF[i][0]+'.','date')}else toast('No match this time.');saveDt()}
  else if(d.pass!==undefined){DT.pass.push(+d.pass);saveDt()}
  else if(d.do==='dreset'){DT.like=DT.like.filter(i=>DT.match[i]);DT.pass=[];saveDt()}
  else if(d.chat!==undefined){chat=+d.chat;dTab='chat'}
  else if(d.say!==undefined){const m=DT.match[chat],s=SAY[+d.say],g=s[1]-(Math.random()<.25?1:0);m.aff=Math.min(100,Math.max(0,m.aff+g));m.last=s[0];saveDt()}
  else if(d.venue!==undefined){const m=DT.match[chat],v=VENUES[+d.venue],api=window.ACCRA_LIFE&&window.ACCRA_LIFE.api;
   if(Date.now()<(m.cd||0))toast('Give them a little time before the next date.');
   else if(S.money<v[1])toast('Not enough cash for this date.');
   else{add(-v[1],'Date: '+v[0]);if(api)api.vitals(Object.assign({},v[2]));m.aff=Math.min(100,m.aff+12);m.cd=Date.now()+90000;m.last='That was a lovely time at '+v[0]+'!';saveDt();toast('Great date! Mood up.');if(m.aff>=100)window.ACCRA_NOTIFY&&window.ACCRA_NOTIFY('You are now in a relationship with '+PROF[chat][0]+' ❤️','date')}}
  else if(d.go!==undefined){setNav(ALLD()[+d.go]);toast('Route set. Follow the gold beam.');open(false);return}
  else if(d.buy){const r=window.ACCRA_LIFE?window.ACCRA_LIFE.buy(d.buy,true):'Not ready';toast(r==='ok'?'Added to your fridge':r)}
  else if(d.st){if(AU.key===d.st)stopSt();else playSt(d.st)}
  else if(d.do==='dep'){if(S.money<20)toast('Not enough cash.');else{S.money-=20;S.sav+=20;S.tx.unshift({d:-20,w:'MoMo savings'});save();paint()}}
  else if(d.do==='wd'){if(S.sav<20)toast('MoMo savings are below GH₵20.');else{S.sav-=20;S.money+=20;S.tx.unshift({d:20,w:'MoMo withdrawal'});save();paint()}}
  else if(d.do==='stop')setNav(null);
  else if(d.do==='deliv'){const a=DEST[Math.floor(Math.random()*DEST.length)];let b;do{b=DEST[Math.floor(Math.random()*DEST.length)]}while(b===a);
   job={a,b,stage:0,pay:Math.min(150,Math.round(40+Math.hypot(a.x-b.x,a.z-b.z)*.4))};setNav(a);toast('Pick up the package at '+a.n);open(false);return}
  else if(d.do==='cancel'){job=null;setNav(null)}
  else if(d.do==='shot'){BABYLON.Tools.CreateScreenshot(engine,cam,{precision:.6},data=>{shots.unshift(data);shots.length=Math.min(shots.length,4);if(tab==='cam'||tab==='vyba')render();toast('Photo saved to your phone')})}
  else if(d.do==='clr'){AL=[];saveAl();badges()}
  else if(d.do==='shd')sun.shadowEnabled=!sun.shadowEnabled;
  else if(d.do==='cull'){window.ACCRA_CULL=window.ACCRA_CULL||{on:true};window.ACCRA_CULL.on=!window.ACCRA_CULL.on}
  render()});
 badges();render();
})();
