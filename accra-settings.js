/* Accra Life settings: accessible camera, graphics, lighting, fog and original Ghana-inspired ambient rhythm. */
(function(){
  "use strict";
  const api=window.ACCRA_SETTINGS_API;
  if(!api)return;
  const {engine,scene,cam,ipc,sun,shadowGenerator,phone}=api;
  const KEY="accra-settings-v1";
  const defaults={quality:phone?"medium":"high",brightness:1.05,fog:true,cameraSensitivity:800,cameraDistance:9,sound:false,volume:.22};
  let prefs={...defaults};
  try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch(_){}
  prefs.sound=false;
  let audio=null,loop=null;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
  function quality(q){
    prefs.quality=q;
    const levels={low:{scale:1.6,shadows:false},medium:{scale:1.25,shadows:false},high:{scale:1,shadows:!phone},ultra:{scale:phone?1:.85,shadows:!phone}};
    const v=levels[q]||levels.medium;
    engine.setHardwareScalingLevel(v.scale);
    sun.shadowEnabled=v.shadows;
    const map=shadowGenerator&&shadowGenerator.getShadowMap();if(map&&map.resize)map.resize(q==="ultra"?2048:q==="high"?1024:512);
    persist();
  }
  function apply(){
    quality(prefs.quality);
    ipc.exposure=clamp(Number(prefs.brightness)||1.05,.65,1.5);
    scene.fogEnabled=!!prefs.fog;
    cam.angularSensibility=clamp(Number(prefs.cameraSensitivity)||800,300,1800);
    cam.radius=clamp(Number(prefs.cameraDistance)||9,4,16);
    if(window.ACCRA_CAMERA)window.ACCRA_CAMERA.setDistance(prefs.cameraDistance);
  }
  function tone(freq,wave,volume,duration){
    if(!audio||audio.state!=="running")return;
    const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
    o.type=wave;o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.012);
    g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+duration+.02);
  }
  function stopSound(){if(loop){clearInterval(loop);loop=null;}if(audio){audio.close().catch(()=>{});audio=null;}prefs.sound=false;persist();}
  async function startSound(){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    if(!audio)audio=new C();if(audio.state==="suspended")await audio.resume();
    if(loop)return;
    prefs.sound=true;persist();
    // A short original 4/4 bell-and-drum-inspired pattern; no sampled or copyrighted recording.
    let beat=0;
    const play=()=>{const v=clamp(Number(prefs.volume)||0,0,.6);if(beat%4===0)tone(92,"sine",v*.42,.18);if(beat%4===2)tone(128,"triangle",v*.25,.12);if(beat%2===1)tone(620+(beat%4)*70,"sine",v*.12,.075);if(beat%8===6)tone(880,"triangle",v*.08,.09);beat++;};
    play();loop=setInterval(play,375);
  }
  function addStyles(){
    const s=document.createElement("style");s.textContent="#accraSettingsBtn{position:fixed;z-index:80;right:12px;top:calc(env(safe-area-inset-top,0px) + 58px);border:1px solid #c9a54a;border-radius:13px;padding:9px 12px;background:#171b20e8;color:#f3d47b;font:700 13px system-ui}#accraSettings{position:fixed;inset:0;z-index:100010;background:#07090bdc;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font:14px system-ui;color:#fff}#accraSettings .panel{width:min(100%,430px);max-height:88dvh;overflow:auto;background:#1b2025;border:1px solid #c9a54a;border-radius:20px;padding:20px;box-sizing:border-box;box-shadow:0 20px 70px #000b}#accraSettings h2{margin:0;color:#e6c46b;font-size:22px}#accraSettings label{display:block;margin:15px 0 7px;color:#d7dce0;font-weight:650}#accraSettings input,#accraSettings select{width:100%;accent-color:#c9a54a}#accraSettings select{padding:11px;border-radius:10px;background:#fff;color:#111;font:600 14px system-ui}#accraSettings .setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px}#accraSettings button{border:0;border-radius:11px;padding:12px;background:#c9a54a;color:#17191c;font:800 14px system-ui}#accraSettings .secondary{background:#303940;color:#fff;border:1px solid #66717a}#accraSettings output{color:#f3d47b;font-variant-numeric:tabular-nums}";
    document.head.appendChild(s);
  }
  function build(){
    addStyles();
    const btn=document.createElement("button");btn.id="accraSettingsBtn";btn.textContent="⚙ Settings";
    const root=document.createElement("div");root.id="accraSettings";
    root.innerHTML='<div class="panel"><div class="setting-row"><h2>Game settings</h2><button class="secondary" id="asClose">✕</button></div><p style="color:#aeb8bd;margin:5px 0 14px">Tune Accra Life for your device and play style.</p><label for="asQuality">Graphics quality</label><select id="asQuality"><option value="low">Low · best performance</option><option value="medium">Medium · balanced</option><option value="high">High · detailed</option><option value="ultra">Ultra · demanding</option></select><label>Camera style</label><div style="padding:11px 12px;border:1px solid #59636b;border-radius:10px;background:#11171b;color:#f3d47b;font-weight:700">GTA-style third-person follow camera</div><label for="asCamera">Camera look sensitivity <output id="asCameraOut"></output></label><input id="asCamera" type="range" min="300" max="1800" step="50"><label for="asDistance">Camera distance <output id="asDistanceOut"></output></label><input id="asDistance" type="range" min="4" max="16" step=".5"><label for="asBrightness">Brightness <output id="asBrightnessOut"></output></label><input id="asBrightness" type="range" min=".65" max="1.5" step=".05"><div class="setting-row" style="margin-top:16px"><label for="asFog" style="margin:0">Environment fog</label><input id="asFog" type="checkbox" style="width:22px;height:22px"></div><label>Sound · original Ghana-inspired rhythm</label><div class="setting-row"><button id="asSound" class="secondary">Enable sound</button><span style="color:#aeb8bd">Ambient percussion</span></div><label for="asVolume">Sound volume <output id="asVolumeOut"></output></label><input id="asVolume" type="range" min="0" max=".6" step=".02"><button id="asReset" class="secondary" style="width:100%;margin-top:18px">Reset settings</button></div>';
    document.body.append(btn,root);
    const $=id=>root.querySelector("#"+id);
    const sync=()=>{$("asQuality").value=prefs.quality;$("asCamera").value=prefs.cameraSensitivity;$("asDistance").value=prefs.cameraDistance;$("asBrightness").value=prefs.brightness;$("asFog").checked=!!prefs.fog;$("asVolume").value=prefs.volume;$("asCameraOut").textContent=prefs.cameraSensitivity;$("asDistanceOut").textContent=Number(prefs.cameraDistance).toFixed(1);$("asBrightnessOut").textContent=Number(prefs.brightness).toFixed(2);$("asVolumeOut").textContent=Math.round(prefs.volume*100)+"%";$("asSound").textContent=prefs.sound?"Mute sound":"Enable sound";};
    btn.onclick=()=>{root.style.display="flex";sync();};
    $("asClose").onclick=()=>root.style.display="none";
    root.addEventListener("click",e=>{if(e.target===root)root.style.display="none";});
    $("asQuality").onchange=e=>{quality(e.target.value);};
    $("asCamera").oninput=e=>{prefs.cameraSensitivity=+e.target.value;cam.angularSensibility=prefs.cameraSensitivity;persist();sync();};
    $("asDistance").oninput=e=>{prefs.cameraDistance=+e.target.value;cam.radius=prefs.cameraDistance;if(window.ACCRA_CAMERA)window.ACCRA_CAMERA.setDistance(prefs.cameraDistance);persist();sync();};
    $("asBrightness").oninput=e=>{prefs.brightness=+e.target.value;ipc.exposure=prefs.brightness;persist();sync();};
    $("asFog").onchange=e=>{prefs.fog=e.target.checked;scene.fogEnabled=prefs.fog;persist();};
    $("asVolume").oninput=e=>{prefs.volume=+e.target.value;persist();sync();};
    $("asSound").onclick=async()=>{if(prefs.sound)stopSound();else await startSound();sync();};
    $("asReset").onclick=()=>{stopSound();prefs={...defaults};apply();sync();};
    document.addEventListener("keydown",e=>{if(e.key==="Escape")root.style.display="none";});
  }
  apply();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
  window.ACCRA_SETTINGS={open:()=>document.getElementById("accraSettingsBtn")?.click(),reset:()=>document.getElementById("asReset")?.click()};
})();
