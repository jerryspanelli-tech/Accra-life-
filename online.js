// Accra Life (Babylon.js): low-poly 3D characters + online multiplayer + opt-in area location
(function(){
 const SK=['#c68a5e','#8d5a3b','#6b4028','#4a2c1c','#a8754f','#3a2216','#f1c9a5','#e0a878'],HC=['#0d0d0d','#2a1a10','#5a3b22','#9a7b3c'],TP=['#9a4a42','#c9a54a','#56705a','#4d6a8a','#e8e6df','#2a2c30','#7a6a8a','#c08a5a'],PN=['#1f2a44','#111111','#5b4630','#6b6b6b','#2f5d3a','#b8a27a'],SH=['#f0f0ec','#111111','#5a3a22','#b5182c'];window.ACCRA_LOOKDATA={SK,HC,TP,PN,SH};
 // outfit: 0 tee+trousers, 1 suit+tie, 2 dress, 3 hoodie+shorts, 4 kaftan (batik), 5 Ghana jersey, 6 kente shirt, 7 leather jacket
 // hair: 0 bald, 1 fade, 2 afro, 3 dreads, 4 braids, 5 cornrows, 6 locs, 7 mohawk, 8 low cut, 9 twists
 // accessories: 0 none, 1 gold chain, 2 cap, 3 beanie, 4 sunglasses, 5 kente headwrap
 function human(l){
  if (window.__useCesiumPlayer) {
    const root = new BABYLON.TransformNode("hu", scene);
    const g = new BABYLON.TransformNode("hg", scene); g.parent = root;
    const al = new BABYLON.TransformNode("al", scene); al.parent = g;
    const ar = new BABYLON.TransformNode("ar", scene); ar.parent = g;
    const ll = new BABYLON.TransformNode("ll", scene); ll.parent = g;
    const lr = new BABYLON.TransformNode("lr", scene); lr.parent = g;
    return { root, g, al, ar, ll, lr, pk: [], ph: 0 };
  }
  if (window.AccraFigure) return window.AccraFigure.human(l);
  l=Object.assign({skin:1,hair:1,hcol:0,top:3,pants:0,style:0,acc:0,shoe:0},l||{});
  const root=new BABYLON.TransformNode('hu',scene);
  const g=new BABYLON.TransformNode('hg',scene);g.parent=root;g.scaling.setAll(.85);
  const P=(k,o,x,y,z,c,par)=>{const m=BABYLON.MeshBuilder['Create'+k]('hp',o,scene);if(k!=='Box')m.convertToFlatShadedMesh();m.parent=par||g;m.position.set(x,y,z);m.material=mat(c);m.checkCollisions=false;m.isPickable=false;if(typeof sg!=='undefined')sg.addShadowCaster(m);return m};
  const B=(w,h,d,x,y,z,c,par)=>P('Box',{width:w,height:h,depth:d},x,y,z,c,par);
  const piv=(x,y)=>{const t=new BABYLON.TransformNode('pv',scene);t.parent=g;t.position.set(x,y,0);return t};
  const sk=SK[l.skin%8],st=l.style%8,ts=st==1?'#1c1e21':st==5?'#f4f4f0':TP[l.top%8],pn=PN[l.pants%6],hc=HC[l.hcol%4],h=l.hair%10,ac=l.acc%6,shc=SH[l.shoe%4];
  // torso and outfit
  if(st==4){B(.8,1.15,.44,0,1.2,0,ts);B(.82,.1,.46,0,.66,0,'#c9a54a');B(.82,.1,.46,0,1.68,0,'#c9a54a')}
  else B(.56,.78,.32,0,1.3,0,ts);
  if(st==0){B(.74,.1,.42,0,1.02,0,'#c8102e');B(.74,.1,.42,0,.92,0,'#006b3f')}
  if(st==1)B(.1,.5,.02,0,1.3,.21,'#b5473d');
  if(st==3)B(.5,.22,.16,0,1.72,-.2,ts);
  if(st==5){B(.74,.14,.42,0,1.52,0,'#c8102e');B(.74,.14,.42,0,1.36,0,'#fcd116');B(.74,.14,.42,0,1.2,0,'#006b3f');B(.22,.22,.02,0,1.3,.21,'#111111')}
  if(st==6){[[-.16,'#c8102e'],[-.02,'#fcd116'],[.12,'#006b3f']].forEach(q=>B(.1,.7,.03,q[0],1.3,.215,q[1]));B(.76,.07,.43,0,1.0,0,'#fcd116')}
  if(st==7){B(.76,.8,.44,0,1.3,0,'#3b2a1e');B(.3,.72,.02,0,1.3,.225,'#e8e6df');[-1,1].forEach(s=>B(.08,.5,.03,s*.15,1.36,.235,'#2a1c14'))}
  // head and hair
  const hd=P('Sphere',{diameter:.44,segments:6},0,1.9,0,sk);hd.scaling.y=1.05;
  if(h==1||h==4){const c=P('Sphere',{diameter:.56,segments:6},0,2.03,-.02,hc);c.scaling.y=.55}
  if(h==2)P('Sphere',{diameter:.84,segments:6},0,2.02,-.04,hc);
  if(h==3)for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P('Cylinder',{height:.45,diameter:.06,tessellation:5},Math.sin(a)*.26,1.78,Math.cos(a)*.26-.04,hc)}
  if(h==4)[-.18,.18].forEach(x=>P('Cylinder',{height:.7,diameter:.07,tessellation:5},x,1.62,-.22,hc));
  if(h==5)[-.09,-.03,.03,.09].forEach(x=>B(.04,.03,.46,x,2.07,-.03,hc));
  if(h==6){const c=P('Sphere',{diameter:.56,segments:6},0,2.03,-.02,hc);c.scaling.y=.55;for(let i=0;i<8;i++){P('Cylinder',{height:.62,diameter:.06,tessellation:5},-.2+i*.057,1.6,-.24,hc)}}
  if(h==7)B(.08,.24,.5,0,2.1,-.02,hc);
  if(h==8){const c=P('Sphere',{diameter:.54,segments:6},0,2.02,-.02,hc);c.scaling.y=.42}
  if(h==9)for(let i=0;i<7;i++){const a=i/7*Math.PI*2;P('Sphere',{diameter:.17,segments:4},Math.sin(a)*.2,2.0,Math.cos(a)*.2-.02,hc)}
  // accessories
  if(ac==1)for(let i=0;i<5;i++)P('Sphere',{diameter:.05,segments:4},-.12+i*.06,1.62-Math.abs(i-2)*.02,.225,'#c9a54a');
  if(ac==2){B(.54,.1,.54,0,2.1,0,'#c8102e');B(.3,.03,.22,0,2.07,.3,'#c8102e')}
  if(ac==3){const c=P('Sphere',{diameter:.6,segments:6},0,2.05,-.02,'#c9d13a');c.scaling.y=.55}
  if(ac==4){B(.2,.07,.03,-.11,1.93,.28,'#111111');B(.2,.07,.03,.11,1.93,.28,'#111111');B(.04,.02,.03,0,1.94,.28,'#111111')}
  if(ac==5)B(.56,.12,.56,0,2.0,0,'#fcd116');
  // face
  [-1,1].forEach(s=>{B(.12,.09,.06,s*.11,1.93,.245,'#ffffff');B(.06,.07,.05,s*.11,1.93,.27,'#111111');B(.13,.03,.04,s*.11,2.02,.25,hc)});
  B(.06,.08,.06,0,1.86,.27,sk);                                   // nose
  [-1,1].forEach(s=>B(.05,.1,.07,s*.265,1.9,0,sk));                // ears
  B(.17,.035,.04,0,1.77,.255,'#7a2a2a');B(.05,.035,.04,-.09,1.79,.25,'#7a2a2a');B(.05,.035,.04,.09,1.79,.25,'#7a2a2a');   // mouth + smile
  // arms (pivot at shoulder)
  const arm=s=>{const a=piv(s*.36,1.62);
   if(st==0||st==2||st==5||st==6){P('Capsule',{height:.46,radius:.078,tessellation:8},0,-.2,0,st==5?'#f4f4f0':ts,a);P('Capsule',{height:.36,radius:.064,tessellation:8},0,-.56,0,sk,a)}
   else{P('Capsule',{height:.5,radius:.08,tessellation:8},0,-.26,0,ts,a);P('Sphere',{diameter:.14,segments:6},0,-.6,0,sk,a)}
   return a};
  // legs (pivot at hip)
  const leg=s=>{const q=piv(s*.12,.88);
   if(st==2)B(.2,.62,.2,0,-.31,0,sk,q);
   else if(st==3){B(.22,.3,.24,0,-.15,0,pn,q);B(.2,.34,.2,0,-.45,0,sk,q)}
   else P('Capsule',{height:.56,radius:.105,tessellation:8},0,-.31,0,pn,q);
   B(.24,.2,.38,0,-.78,.06,shc,q);return q};
  const al=arm(-1),ar=arm(1),ll=leg(-1),lr=leg(1);
  if(st==2)P('Cylinder',{height:.75,diameterTop:.75,diameterBottom:1.1,tessellation:8},0,.95,0,ts);
  const pk=[B(.07,1,.07,0,-.95,.14,'#6b4a2e',ar),B(.6,.1,.1,0,-1.45,.14,'#9aa0a8',ar)];pk.forEach(m=>m.setEnabled(false));   // pickaxe, only shown while mining
  return{root,g,al,ar,ll,lr,pk,ph:0}}
 function walk(h,sp,dt){const k=Math.min(1,sp/1.1),run=Math.min(1,sp/5.5);h.ph+=sp*dt*2.3;   // stride follows real distance: no foot sliding
  const s=Math.sin(h.ph)*(.5+.6*run)*k;
  h.ll.rotation.x=s;h.lr.rotation.x=-s;h.al.rotation.x=-s*.9;h.ar.rotation.x=s*.9;
  h.g.rotation.x=(.03+.17*run)*k;                                                            // lean into the run
  h.g.position.y=Math.abs(Math.sin(h.ph))*.07*k+Math.sin(performance.now()/450)*.012*(1-k)} // step bounce + idle breathing
 let look;try{look=JSON.parse(localStorage.getItem('accra-look'))}catch(e){}
 const isNew=!look;
 look=Object.assign({skin:1,hair:1,hcol:0,top:3,pants:0,style:0,acc:0,shoe:0},look||{});
 let mine=null;
 function dress(){if(mine)mine.root.dispose();try{localStorage.setItem('accra-look',JSON.stringify(look))}catch(e){}if(window.__useCesiumPlayer)return;mine=human(look);mine.root.parent=player;mine.root.position.y=-.91;player.isVisible=false}
 dress();
 let net=null;
 // customization screens (wardrobe, fitting room, first join) live in accra-upgrade.js
 const ui=(id,txt,top,fn)=>{const b=document.createElement('button');b.id=id;b.textContent=txt;b.style.cssText='position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + '+top+'px);border:0;border-radius:14px;background:rgba(28,30,33,.78);color:#fff;font-size:20px;padding:4px 12px;z-index:5';b.onclick=fn;document.body.appendChild(b);return b};
 window.ACCRA_AVATAR={look,isNew,pose:null,net:()=>net,apply:()=>{dress();if(net)net.emit('playerMove',snap())}};
 let lpx=player.position.x,lpz=player.position.z,smv=0,vyaw=player.rotation.y;
 const adiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 scene.onBeforeRenderObservable.add(()=>{const dt=Math.max(engine.getDeltaTime()/1000,.001),src=driving?car:player;
  const raw=Math.hypot(src.position.x-lpx,src.position.z-lpz)/dt;lpx=src.position.x;lpz=src.position.z;
  smv+=(Math.min(raw,9)-smv)*Math.min(1,dt*9);cur.sp=smv;
  if(!mine)return;
  vyaw+=adiff(player.rotation.y,vyaw)*Math.min(1,dt*12);mine.root.rotation.y=vyaw-player.rotation.y;   // smooth turning
  const r=mine.root,pose=window.ACCRA_AVATAR&&window.ACCRA_AVATAR.pose;if(mine.pk)mine.pk.forEach(m=>m.setEnabled(pose==='mine'));
  if(pose==='sit'){r.rotation.x=0;r.position.set(0,-.91+((window.ACCRA_AVATAR.sitH||.45)+.05-.748),0);mine.g.rotation.x=0;mine.g.position.y=0;mine.ll.rotation.x=mine.lr.rotation.x=-1.5;mine.al.rotation.x=mine.ar.rotation.x=-.7}
  else if(pose==='sleep'){r.rotation.x=-Math.PI/2;r.position.set(0,-.29,.95);mine.g.rotation.x=0;mine.g.position.y=0;mine.ll.rotation.x=mine.lr.rotation.x=mine.al.rotation.x=mine.ar.rotation.x=0}
  else if(pose==='dance'){const t=performance.now()/1000,w=Math.sin(t*8);r.rotation.x=0;r.position.set(0,-.91,0);mine.g.position.y=Math.abs(w)*.11;mine.g.rotation.x=0;mine.g.rotation.z=Math.sin(t*4)*.12;
    mine.ll.rotation.x=w*.55;mine.lr.rotation.x=-w*.55;mine.al.rotation.x=-2.3+Math.sin(t*8)*.5;mine.ar.rotation.x=-2.3-Math.sin(t*8)*.5}
  else if(pose==='wave'||pose==='clap'||pose==='cheer'||pose==='handsup'||pose==='punch'){const t=performance.now()/1000;r.rotation.x=0;r.position.set(0,-.91,0);mine.g.rotation.x=0;mine.g.rotation.z=0;mine.g.position.y=0;mine.ll.rotation.x=mine.lr.rotation.x=0;mine.al.rotation.x=mine.ar.rotation.x=0;mine.al.rotation.z=mine.ar.rotation.z=0;
    if(pose==='wave'){mine.ar.rotation.x=-2.7;mine.ar.rotation.z=Math.sin(t*9)*.5}
    else if(pose==='clap'){const c=Math.abs(Math.sin(t*8));mine.al.rotation.x=mine.ar.rotation.x=-1.4;mine.al.rotation.z=-.5+c*.5;mine.ar.rotation.z=.5-c*.5}
    else if(pose==='cheer'){mine.g.position.y=Math.abs(Math.sin(t*6))*.18;mine.al.rotation.x=mine.ar.rotation.x=-2.8}
    else if(pose==='handsup'){mine.al.rotation.x=mine.ar.rotation.x=-3;mine.al.rotation.z=.3;mine.ar.rotation.z=-.3}
    else{const p=Math.sin(t*10);mine.g.rotation.x=.1;mine.ar.rotation.x=-1.5+p*.5;mine.al.rotation.x=-1.2;mine.ll.rotation.x=.3;mine.lr.rotation.x=-.3}}
  else if(pose==='mine'){const t=performance.now()/1000,c=(t*2.1)%1,a=c<.6?-.6-c/.6*2.2:c<.72?-2.8+(c-.6)/.12*2.6:-.2-(c-.72)/.28*.4;r.rotation.x=0;r.position.set(0,-.91,0);mine.g.position.y=0;mine.g.rotation.z=0;mine.g.rotation.x=c>.6&&c<.8?.28:.1;
    mine.al.rotation.x=a;mine.ar.rotation.x=a;mine.al.rotation.z=-.15;mine.ar.rotation.z=.15;mine.ll.rotation.x=.25;mine.lr.rotation.x=-.25}
  else if(pose==='swim'){mine.ph+=dt*(3+smv*1.4);const w=Math.sin(mine.ph);mine.g.rotation.z=0;mine.g.rotation.x=0;mine.g.position.y=0;r.rotation.x=1.25;r.position.set(0,-.55,0);
    mine.al.rotation.x=-2.5+w*.9;mine.ar.rotation.x=-2.5-w*.9;mine.ll.rotation.x=Math.sin(mine.ph*2)*.4;mine.lr.rotation.x=-Math.sin(mine.ph*2)*.4}
  else{mine.al.rotation.z=mine.ar.rotation.z=0;mine.g.rotation.z=0;r.rotation.x=0;r.position.set(0,-.91,0);walk(mine,driving?0:smv,dt)}});
 // ---------- online ----------
 const URL_=window.ACCRA_SERVER||'PASTE_SERVER_URL_HERE';
 const cur={sp:0};let px=0,pz=0;
 const snap=()=>{const o=driving?car:player;return{x:o.position.x,z:o.position.z,ry:driving?heading:player.rotation.y,sp:cur.sp,drv:driving?1:0,look}};
 if(!window.io||URL_.indexOf('PASTE')===0){console.log('Offline mode: set ACCRA_SERVER in online.js to play online');return}
 const pid='p'+crypto.randomUUID().replace(/-/g,''),gt=(k,v)=>{let x=localStorage.getItem(k);if(!x){x=v;localStorage.setItem(k,x)}return x};
 const ID=gt('accra-pid',pid),SEC=gt('accra-secret',crypto.randomUUID()+crypto.randomUUID()),NAME=gt('accra-name','Citizen'+Math.floor(1000+Math.random()*9000));
 const hud=document.createElement('div');hud.className='pill';hud.style.cssText+=';top:calc(env(safe-area-inset-top,0px) + 46px);font-size:12px;color:#fff';document.body.appendChild(hud);
 let count=1,bal=0,area=null;const paint=()=>{hud.textContent='\uD83D\uDC65 '+count+' \u00B7 GH\u20B5 '+bal+(area?' \u00B7 \uD83D\uDCCD '+area:'')};paint();
 net=io(URL_,{transports:['websocket'],auth:{pid:ID,secret:SEC,name:NAME}});
 const others=new Map();
 function label(t){const dt=new BABYLON.DynamicTexture('l',{width:256,height:64},scene,false);dt.hasAlpha=true;const c=dt.getContext();c.font='bold 30px system-ui';c.textAlign='center';c.fillStyle='rgba(23,25,28,.8)';c.fillRect(0,8,256,48);c.fillStyle='#c9a54a';c.fillText(t,128,44);dt.update();
  const m=BABYLON.MeshBuilder.CreatePlane('nl',{width:1.6,height:.4},scene);m.material=Object.assign(new BABYLON.StandardMaterial('lm',scene),{diffuseTexture:dt,emissiveTexture:dt,opacityTexture:dt,disableLighting:true,backFaceCulling:false});m.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;m.isPickable=false;return m}
 function add(p){if(others.has(p.id)||p.id===net.id)return;const h=human(p.look||look),n=label(p.name+(p.area?' \u00B7 '+p.area:''));n.parent=h.root;n.position.y=2.15;h.root.position.set(p.x,0,p.z);others.set(p.id,{h,tx:p.x,tz:p.z,ry:p.ry,sp:p.sp,name:n,lbl:p.name+'|'+p.area,look:JSON.stringify(p.look)});count=others.size+1;paint()}
 net.on('hello',d=>{bal=d.balance;paint()});
 net.on('balance',b=>{bal=b;paint()});
 net.on('areaSet',a=>{area=a;paint()});
 net.on('currentPlayers',l=>Object.values(l).forEach(add));
 net.on('playerJoined',add);
 net.on('playerMoved',p=>{const o=others.get(p.id);if(!o)return add(p);o.tx=p.x;o.tz=p.z;o.ry=p.ry;o.sp=p.sp;
  const s=JSON.stringify(p.look),l=p.name+'|'+p.area;if(s!==o.look||l!==o.lbl){o.h.root.dispose();others.delete(p.id);add(p)}});
 net.on('playerLeft',id=>{const o=others.get(id);if(o){o.h.root.dispose();others.delete(id)}count=others.size+1;paint()});
 net.on('momoReceived',d=>alert(d.from+' sent you GH\u20B5'+d.amount));
 net.on('connect_error',()=>{hud.textContent='Offline (server not reachable)'});
 scene.onBeforeRenderObservable.add(()=>{const dt=engine.getDeltaTime()/1000;
  others.forEach(o=>{const r=o.h.root,k=Math.min(1,dt*10);r.position.x+=(o.tx-r.position.x)*k;r.position.z+=(o.tz-r.position.z)*k;let d=o.ry-r.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));r.rotation.y+=d*k;walk(o.h,o.sp,dt)})});
 setInterval(()=>{net.emit('playerMove',snap())},100);
 // real-world location is OPT-IN. The server turns it into an area name (like "Osu") and forgets the coordinates.
 ui('locbtn','\uD83D\uDCCD',134,()=>{
  if(area){net.emit('clearLocation');return}
  if(!navigator.geolocation)return alert('Location is not available on this device.');
  if(!confirm('Share your general area (for example "Osu") with other players? Your exact location is never saved or shown. You can turn it off any time.'))return;
  navigator.geolocation.getCurrentPosition(p=>net.emit('setLocation',{lat:p.coords.latitude,lon:p.coords.longitude}),()=>alert('Location permission was not given.'),{enableHighAccuracy:false,maximumAge:600000,timeout:10000})});
})();
