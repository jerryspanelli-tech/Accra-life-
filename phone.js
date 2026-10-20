// phone.js - Accra Life smartphone with Street Crown Dancehall & JAMBOX GH
(function(){
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let S={money:200,sav:0,tx:[]};try{S=Object.assign(S,JSON.parse(localStorage.getItem('accra-bb-save')))}catch(e){}
 const save=()=>{try{localStorage.setItem('accra-bb-save',JSON.stringify(S))}catch(e){}};
 const add=(d,w)=>{S.money+=d;S.tx.unshift({d,w});S.tx.length=Math.min(S.tx.length,20);save();paint();if(ph.classList.contains('on'))render()};
 window.ACCRA_STATE=S;window.ACCRA_ADD=add;

 // ---------- ALERTS ----------
 let AL=[];try{AL=JSON.parse(localStorage.getItem('accra-alerts'))||[]}catch(e){}
 const saveAl=()=>{try{localStorage.setItem('accra-alerts',JSON.stringify(AL.slice(0,30)))}catch(e){}};
 const unread=()=>AL.filter(a=>a.u).length;
 window.ACCRA_NOTIFY=(m,a)=>{AL.unshift({m:String(m),a:a||'msg',t:Date.now(),u:1});AL=AL.slice(0,30);saveAl();badges()};

 // ---------- STYLES ----------
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

 const bars=()=>{const c=navigator.connection&&navigator.connection.effectiveType,n=!navigator.onLine?0:c==='4g'?4:c==='3g'?3:c==='2g'?2:c==='slow-2g'?1:4;return '▂▄▆█'.slice(0,n).padEnd(4,'·')+(c?' '+c.toUpperCase():'')};
 if(navigator.getBattery)navigator.getBattery().then(b=>{const u=()=>{$('pbat').textContent='🔋'+Math.round(b.level*100)+'%'};u();b.addEventListener('levelchange',u)}).catch(()=>{});

 // ---------- DESTINATIONS ----------
 const XS=[-110,-35,35,110],D={};
 if (typeof DG !== 'undefined') {
   DG.forEach((row,i)=>row.forEach((n,j)=>{(D[n]=D[n]||[]).push([XS[i],XS[j]])}));
 }
 const DEST=Object.entries(D).map(([n,a])=>({n,x:a.reduce((s,p)=>s+p[0],0)/a.length,z:a.reduce((s,p)=>s+p[1],0)/a.length}));
 const VX_VAL = typeof VX !== 'undefined' ? VX : 110, VZ_VAL = typeof VZ !== 'undefined' ? VZ : -95;
 DEST.push({n:'Your villa',x:VX_VAL,z:VZ_VAL});DEST.push({n:'Accra Mall',x:35,z:22});DEST.push({n:'Sports Stadium',x:110,z:35});DEST.push({n:'Police Department',x:35,z:82});DEST.push({n:'Accra Hospital',x:110,z:82});DEST.push({n:'Accra Motors (cars)',x:35,z:-52});
 const ALLD=()=>DEST.concat(window.ACCRA_DEST_EXTRA||[]),fd=n=>n>=1000?(n/1000).toFixed(1)+' km':n+' m',pos=()=>(typeof driving !== 'undefined' && driving ? car : player).position,dist=d=>Math.round(Math.hypot(d.x-pos().x,d.z-pos().z));
 let nav=null,job=null;
 const bm=BABYLON.MeshBuilder.CreateCylinder('bc',{height:70,diameter:3},scene);bm.material=Object.assign(new BABYLON.StandardMaterial('bcm',scene),{emissiveColor:C3('#c9a54a'),disableLighting:true,alpha:.35,fogEnabled:false});bm.isPickable=false;bm.setEnabled(false);
 function setNav(d){nav=d;bm.setEnabled(!!d);if(d)bm.position.set(d.x,35,d.z);navp.style.display=d?'block':'none'}

 let clk=0;
 scene.onBeforeRenderObservable.add(()=>{
  if(++clk%30===0&&ph.classList.contains('on')){$('ptm2').textContent=new Date().toTimeString().slice(0,5);$('psg').textContent=bars()}
  if(!nav)return;const m=dist(nav);navp.textContent='➤ '+nav.n+' · '+fd(m);
  if(m<20){const n=nav;setNav(null);
   if(job&&job.stage===0&&n===job.a){job.stage=1;setNav(job.b);toast('Package picked up. Deliver to '+job.b.n)}
   else if(job&&job.stage===1&&n===job.b){const p=job.pay;add(p,'Delivery to '+job.b.n);toast('Delivered! +GH₵'+p);job=null}
   else toast('You have arrived: '+n.n)}});

 // ---------- GHANAIAN CULTURAL AUDIO ENGINE (JAMBOX GH) ----------
 const AU={ctx:null,master:null,timer:null,step:0,next:0,vol:.6,key:null,noise:null};
 
 const STN={
  streetCrown:{
    n:'👑 Street Crown (Shatta Vibe)',
    bpm:102,
    root:164.81, // E minor street vibe
    scale:[0, 3, 5, 7, 10, 12, 15],
    bell:[1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,1,0], // Heavy dancehall bell
    conga:[1,0,1,0, 1,1,0,0, 1,0,1,0, 1,1,0,1], // Log-drum pattern
    bass:[0,,,,2,,,, 3,,,,5,,,,],                // Heavy sub bass hits
    lead:[0,3,7,10, 12,10,7,3, 5,7,10,12, 10,7,3,0]
  },
  highlife:{
    n:'Palm-Wine Highlife',
    bpm:104,
    root:261.63,
    scale:[0, 2, 4, 7, 9, 12, 14, 16],
    bell:[1,0,1,1,0,1,0,1, 1,0,1,1,0,1,0,1],
    conga:[1,0,0,1, 1,0,1,0, 1,0,0,1, 1,0,1,0],
    bass:[0,,,,0,,,, 5,,,,5,,,,],
    lead:[0,2,4,7, 9,7,4,2, 4,7,12,9, 7,4,2,0]
  },
  kpanlogo:{
    n:'Coastal Kpanlogo',
    bpm:112,
    root:220,
    scale:[0, 3, 5, 7, 10, 12, 15],
    bell:[1,0,0,1, 0,1,1,0, 1,0,0,1, 0,1,1,0],
    conga:[1,1,0,1, 0,1,0,1, 1,1,0,1, 0,1,1,0],
    bass:[0,,,3,,,5,,, 0,,,3,,,5,,],
    lead:[0,5,7,10, 12,10,7,5, 3,5,7,12, 10,7,5,3]
  }
 };

 function audioOn(){
  if(!AU.ctx){
   const C=window.AudioContext||window.webkitAudioContext;
   if(!C)return false;
   AU.ctx=new C();
   AU.master=AU.ctx.createGain();
   AU.master.gain.value=AU.vol;
   AU.master.connect(AU.ctx.destination);
   const b=AU.ctx.createBuffer(1,AU.ctx.sampleRate*.5,AU.ctx.sampleRate),d=b.getChannelData(0);
   for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(AU.ctx.sampleRate*.1));
   AU.noise=b;
  }
  if(AU.ctx.state==='suspended')AU.ctx.resume();
  return true;
 }

 function playNote(t, freq, dur, type, gainVal){
  if(!AU.ctx)return;
  const c=AU.ctx, o=c.createOscillator(), g=c.createGain();
  o.type=type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gainVal, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(g); g.connect(AU.master);
  o.start(t); o.stop(t+dur+.05);
 }

 function playPerc(t, freq, dur, gainVal){
  if(!AU.ctx)return;
  const c=AU.ctx, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
  s.buffer=AU.noise;
  f.type='bandpass'; f.frequency.value=freq; f.Q.value=5;
  g.gain.setValueAtTime(gainVal, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  s.connect(f); f.connect(g); g.connect(AU.master);
  s.start(t); s.stop(t+dur);
 }

 function tick(){
  const P=STN[AU.key]; if(!P||!AU.ctx)return;
  const sd=60/P.bpm/4;
  while(AU.next<AU.ctx.currentTime+.15){
   const i=AU.step%16, t=AU.next;
   
   if(P.bell&&P.bell[i]){
    playNote(t, i%4===0? 1300 : 980, 0.05, 'triangle', 0.18);
   }
   if(P.conga&&P.conga[i]){
    playPerc(t, i%2===0 ? 110 : 85, 0.15, 0.6); // Deep dancehall log-drum thud
   }
   if(P.bass&&P.bass[i]!=null){
    const noteIdx=P.bass[i];
    const freq=(P.root/2)*Math.pow(2, P.scale[noteIdx%P.scale.length]/12);
    playNote(t, freq, 0.25, 'sawtooth', 0.4);
   }
   if(P.lead&&P.lead[i]!=null){
    const noteIdx=P.lead[i];
    const freq=P.root*Math.pow(2, P.scale[noteIdx%P.scale.length]/12);
    playNote(t, freq, 0.14, 'square', 0.12);
   }

   AU.next+=sd; AU.step++;
  }
 }

 function playSt(k,v){
  if(!STN[k]||!audioOn())return;
  AU.key=k;
  if(v!=null){AU.vol=v;AU.master.gain.value=v}
  AU.step=0; AU.next=AU.ctx.currentTime+.05;
  clearInterval(AU.timer); AU.timer=setInterval(tick,35);
  toast('🎵 Playing ' + STN[k].n);
  if(tab==='jam') render();
 }

 function stopSt(){
  clearInterval(AU.timer);
  AU.key=null;
  toast('JAMBOX stopped');
  if(tab==='jam') render();
 }

 window.ACCRA_AUDIO={
  play:playSt,
  stop:stopSt,
  volume:v=>{AU.vol=v;if(AU.master)AU.master.gain.value=v},
  now:()=>AU.key,
  unlock:()=>audioOn()
 };

 // ---------- APPS ----------
 const APPS=[['bank','💰','Bank','#2e7d32'],['map','🗺️','Map','#1e88e5'],['jobs','💼','Jobs','#6d4c41'],['cam','📷','Camera','#546e7a'],['msg','💬','Messages','#00897b'],['mart','🛍️','JOLLY MART','#1565c0'],['cedi','👛','CEDIPAY','#16a34a'],['jam','🎵','JAMBOX GH','#7c4dff'],['set','⚙️','Settings','#37474f']];
 let tab='home',stack=[],shots=[];

 const txs=()=>S.tx.slice(0,8).map(x=>'<div class="cd tx"><span>'+esc(x.w)+'</span><b class="'+(x.d>0?'up':'dn')+'">'+(x.d>0?'+':'')+x.d+'</b></div>').join('')||'<div class="cd">No transactions yet</div>';

 const V2={
  bank:()=>'<div class="cd" style="text-align:center"><small>Balance</small><div class="big">GH₵ '+S.money.toLocaleString()+'</div><small>MoMo savings: GH₵ '+S.sav+'</small></div><button class="bt" data-do="dep">Save GH₵20</button><button class="bt" data-do="wd">Withdraw GH₵20</button><h3>Recent</h3>'+txs(),
  cedi:()=>'<div class="cd" style="text-align:center"><small>Wallet</small><div class="big">GH₵ '+S.money.toLocaleString()+'</div></div><h3>Transactions</h3>'+txs(),
  map:()=>(nav?'<div class="cd tx"><span>➤ '+esc(nav.n)+' · '+dist(nav)+' m</span><button class="bt" data-do="stop">Stop</button></div>':'')+ALLD().slice().sort((a,b)=>dist(a)-dist(b)).map(d=>'<div class="cd tx"><span>'+esc(d.n)+'<br><small>'+fd(dist(d))+' away</small></span><button class="bt" data-go="'+ALLD().indexOf(d)+'">Go</button></div>').join(''),
  jobs:()=>'<div class="cd"><b>🏍️ Delivery rider</b><br><small>Pick up a package in one district and deliver it to another.</small><br>'+(job?'<small>Active: deliver to '+esc(job.b.n)+' · GH₵'+job.pay+'</small><br><button class="bt" data-do="cancel">Cancel</button>':'<button class="bt" data-do="deliv">Start delivery</button>')+'</div>',
  cam:()=>'<button class="bt" data-do="shot">📸 Take photo</button>'+shots.map(x=>'<img src="'+x+'">').join(''),
  msg:()=>{const h=AL.length?AL.map(a=>'<div class="cd">'+esc(a.m)+'</div>').join('')+'<button class="bt" data-do="clr">Clear all</button>':'<div class="cd">No alerts.</div>';AL.forEach(a=>a.u=0);saveAl();setTimeout(badges,0);return h},
  jam:()=>'<div class="cd"><small><b>Ghana Cultural Sound System</b><br>Featuring Street Crown Dancehall & Highlife beats.</small></div>'+Object.keys(STN).map(k=>'<div class="cd tx"><span><b>'+STN[k].n+'</b><br><small>'+STN[k].bpm+' BPM</small></span><button class="bt" data-st="'+k+'">'+(AU.key===k?'■ Stop':'▶ Play')+'</button></div>').join('')+'<div class="cd"><small>Volume</small><input type="range" min="0" max="100" value="'+Math.round(AU.vol*100)+'" data-vol="1"></div>',
  set:()=>'<div class="cd tx"><span>Shadows</span><button class="bt" data-do="shd">'+(sun.shadowEnabled?'On':'Off')+'</button></div>'
 };

 function badges(){const n=unread(),b=$('pbdg');if(b){b.style.display=n?'block':'none';b.textContent=n}if(ph.classList.contains('on')&&tab==='home')render()}
 const home=()=>'<div class="ag">'+APPS.map(a=>'<button class="ai" data-app="'+a[0]+'" style="--c:'+a[3]+'"><i>'+a[1]+(a[0]==='msg'&&unread()?'<u class="bg">'+unread()+'</u>':'')+'</i>'+a[2]+'</button>').join('')+'</div><button class="bal" data-app="cedi"><span>GH₵ '+S.money.toLocaleString()+'</span><b>›</b></button>';
 
 function render(){const ap=APPS.find(a=>a[0]===tab),bd=$('pbd');$('pbk').style.visibility=tab==='home'?'hidden':'visible';
  bd.innerHTML=ap?'<h3>'+ap[1]+' '+ap[2]+'</h3>'+V2[tab]():home();bd.classList.remove('pin');void bd.offsetWidth;bd.classList.add('pin')}
 
 const go=t=>{if(t!==tab){stack.push(tab);tab=t}};
 function open(o){ph.classList.toggle('on',o);document.body.classList.toggle('po',o);if(o){tab='home';stack=[];$('ptm2').textContent=new Date().toTimeString().slice(0,5);$('psg').textContent=bars();render()}}
 
 btn.onclick=()=>open(!ph.classList.contains('on'));$('pcl').onclick=()=>open(false);$('phm').onclick=()=>{tab='home';stack=[];render()};$('pbk').onclick=()=>{tab=stack.pop()||'home';render()};
 
 ph.addEventListener('input',e=>{if(e.target.dataset.vol){const v=e.target.value/100;AU.vol=v;if(AU.master)AU.master.gain.value=v}});
 ph.addEventListener('click',e=>{const b=e.target.closest('[data-app],[data-do],[data-go],[data-buy],[data-st]');if(!b)return;const d=b.dataset;
  if(d.app)go(d.app);
  else if(d.go!==undefined){setNav(ALLD()[+d.go]);toast('Route set.');open(false);return}
  else if(d.st){if(AU.key===d.st)stopSt();else playSt(d.st)}
  else if(d.do==='dep'){if(S.money<20)toast('Not enough cash.');else{S.money-=20;S.sav+=20;save();paint()}}
  else if(d.do==='wd'){if(S.sav<20)toast('Savings too low.');else{S.sav-=20;S.money+=20;save();paint()}}
  else if(d.do==='stop')setNav(null);
  else if(d.do==='deliv'){const a=DEST[Math.floor(Math.random()*DEST.length)];let b;do{b=DEST[Math.floor(Math.random()*DEST.length)]}while(b===a);
   job={a,b,stage:0,pay:Math.min(150,Math.round(40+Math.hypot(a.x-b.x,a.z-b.z)*.4))};setNav(a);toast('Pick up at '+a.n);open(false);return}
  else if(d.do==='cancel'){job=null;setNav(null)}
  else if(d.do==='shot'){BABYLON.Tools.CreateScreenshot(engine,cam,{precision:.6},data=>{shots.unshift(data);shots.length=Math.min(shots.length,4);if(tab==='cam')render();toast('Photo saved')})}
  else if(d.do==='clr'){AL=[];saveAl();badges()}
  else if(d.do==='shd')sun.shadowEnabled=!sun.shadowEnabled;
  render();
 });
 badges();render();
})();
