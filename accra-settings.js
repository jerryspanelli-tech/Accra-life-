/* Accra Life: real render-quality controls, original Ghana-inspired instrumental and fullscreen play. */
(function () {
"use strict";
const api=window.ACCRA_SETTINGS_API;if(!api)return;
const {engine,scene,cam,ipc,shadowGenerator,phone}=api;
const KEY="accra-settings-v2",defaults={quality:phone?"medium":"high",brightness:1.05,fog:true,cameraSensitivity:800,cameraDistance:9,music:false,volume:.24};
let prefs={...defaults};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch(_){}
prefs.music=false;
let audio=null,master=null,musicTimer=null,step=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
function applyQuality(value){
 const levels={low:{scale:phone?1.75:1.5,shadows:false,map:256,contrast:1.02},medium:{scale:phone?1.35:1.2,shadows:false,map:512,contrast:1.08},high:{scale:phone?1.1:1,shadows:!phone,map:1024,contrast:1.15},ultra:{scale:phone?1:.75,shadows:true,map:2048,contrast:1.2}};
 const q=levels[value]||levels.medium;prefs.quality=levels[value]?value:"medium";
 engine.setHardwareScalingLevel(q.scale);engine.resize();
 scene.shadowsEnabled=q.shadows;
 if(shadowGenerator){const map=shadowGenerator.getShadowMap&&shadowGenerator.getShadowMap();if(map&&map.getSize&&map.getSize().width!==q.map)map.resize(q.map);shadowGenerator.usePercentageCloserFiltering=q.shadows;}
 ipc.contrast=q.contrast;persist();
}
function applyAll(){applyQuality(prefs.quality);ipc.exposure=clamp(Number(prefs.brightness)||1.05,.65,1.5);scene.fogEnabled=!!prefs.fog;cam.angularSensibility=clamp(Number(prefs.cameraSensitivity)||800,300,1800);cam.radius=clamp(Number(prefs.cameraDistance)||9,4,16);}
function envelope(gain,now,peak,attack,decay){gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),now+attack);gain.gain.exponentialRampToValueAtTime(.0001,now+attack+decay);}
function noiseBuffer(){const b=audio.createBuffer(1,audio.sampleRate*.35,audio.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
function pluck(freq,when,duration,volume,bright){if(!audio||!master)return;const o=audio.createOscillator(),o2=audio.createOscillator(),f=audio.createBiquadFilter(),g=audio.createGain();o.type="triangle";o.frequency.setValueAtTime(freq,when);o2.type="sine";o2.frequency.setValueAtTime(freq*2.01,when);f.type="lowpass";f.frequency.setValueAtTime(bright?3200:900,when);g.connect(f);f.connect(master);const g2=audio.createGain();g2.gain.value=.22;o2.connect(g2);g2.connect(g);envelope(g,when,volume,.008,duration);o.connect(g);o.start(when);o2.start(when);o.stop(when+duration+.04);o2.stop(when+duration+.04);}
function bass(freq,when){if(!audio||!master)return;const o=audio.createOscillator(),f=audio.createBiquadFilter(),g=audio.createGain();o.type="triangle";o.frequency.setValueAtTime(freq,when);f.type="lowpass";f.frequency.value=260;o.connect(f);f.connect(g);g.connect(master);envelope(g,when,.22,.015,.34);o.start(when);o.stop(when+.4);}
function drum(when,deep){if(!audio||!master)return;const o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.setValueAtTime(deep?145:230,when);o.frequency.exponentialRampToValueAtTime(deep?62:115,when+.11);o.connect(g);g.connect(master);envelope(g,when,deep?.36:.2,.003,deep?.16:.09);o.start(when);o.stop(when+.22);}
function shaker(when){if(!audio||!master)return;const src=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();src.buffer=noiseBuffer();f.type="highpass";f.frequency.value=6200;src.connect(f);f.connect(g);g.connect(master);envelope(g,when,.035,.002,.045);src.start(when);src.stop(when+.06);}
const N={C3:130.81,E3:164.81,G3:196,A3:220,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,G5:783.99};
const bars=[
{bass:N.C3,chord:[N.E4,N.G4,N.C5],melody:[N.G4,N.A4,N.G4,N.E4,N.D4,N.E4,N.G4,N.E4]},
{bass:N.F4/2,chord:[N.A4,N.C5,N.E5],melody:[N.A4,N.C5,N.A4,N.G4,N.E4,N.G4,N.A4,N.C5]},
{bass:N.G3,chord:[N.B4,N.D5,N.G5],melody:[N.D5,N.B4,N.A4,N.G4,N.A4,N.B4,N.D5,N.B4]},
{bass:N.C3,chord:[N.E4,N.G4,N.C5],melody:[N.G4,N.E4,N.D4,N.C4,N.E4,N.G4,N.E4,N.C4]}];
function musicStep(){if(!audio||audio.state!=="running")return;const now=audio.currentTime+.025,bar=bars[Math.floor(step/16)%4],pos=step%16;
 if(pos===0||pos===8)bass(bar.bass,now);
 if([0,6,8,14].includes(pos))drum(now,pos===0||pos===8);
 if([2,6,10,14].includes(pos))bar.chord.forEach((n,i)=>pluck(n,now+i*.012,.23,.055,true));
 if(pos%2===1)shaker(now);if(pos%4===2)drum(now,false);
 if(pos%2===0)pluck(bar.melody[(pos/2)%8],now,.28,.075,true);step++;}
async function startMusic(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;if(!audio){audio=new C();master=audio.createGain();master.gain.value=clamp(Number(prefs.volume),0,.6);master.connect(audio.destination);}if(audio.state==="suspended")await audio.resume();if(musicTimer)return true;prefs.music=true;persist();step=0;musicStep();musicTimer=setInterval(musicStep,150);return true;}
function stopMusic(){if(musicTimer)clearInterval(musicTimer);musicTimer=null;if(audio){audio.close().catch(()=>{});audio=null;master=null;}prefs.music=false;persist();}
function setVolume(v){prefs.volume=clamp(Number(v),0,.6);if(master&&audio)master.gain.setTargetAtTime(prefs.volume,audio.currentTime,.03);persist();}
function addStyles(){const s=document.createElement("style");s.textContent=
"#accraSettingsBtn,#accraFullscreenBtn{position:fixed;z-index:80;right:12px;border:1px solid #c9a54a;border-radius:12px;padding:9px 12px;background:#171b20ed;color:#f3d47b;font:700 13px system-ui}"+
"#accraFullscreenBtn{top:calc(env(safe-area-inset-top,0px) + 56px)}#accraSettingsBtn{top:calc(env(safe-area-inset-top,0px) + 104px)}"+
"#accraSettings{position:fixed;inset:0;z-index:100010;background:#07090bdc;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font:14px system-ui;color:#fff}"+
"#accraSettings .panel{width:min(100%,430px);max-height:88dvh;overflow:auto;background:#1b2025;border:1px solid #c9a54a;border-radius:20px;padding:20px;box-sizing:border-box;box-shadow:0 20px 70px #000b}"+
"#accraSettings h2{margin:0;color:#e6c46b;font-size:22px}#accraSettings label{display:block;margin:15px 0 7px;color:#d7dce0;font-weight:650}"+
"#accraSettings input,#accraSettings select{width:100%;accent-color:#c9a54a}#accraSettings select{padding:11px;border-radius:10px;background:#fff;color:#111;font:600 14px system-ui}"+
"#accraSettings .setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px}#accraSettings button{border:0;border-radius:11px;padding:12px;background:#c9a54a;color:#17191c;font:800 14px system-ui}"+
"#accraSettings .secondary{background:#303940;color:#fff;border:1px solid #66717a}#accraSettings output{color:#f3d47b;font-variant-numeric:tabular-nums}"+
"#accraFullscreenHelp{position:fixed;inset:0;z-index:100020;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:#080b0eee;color:#fff;font:15px/1.5 system-ui}#accraFullscreenHelp .panel{max-width:380px;padding:22px;border:1px solid #c9a54a;border-radius:18px;background:#1b2025}";
document.head.appendChild(s);}
function build(){addStyles();
 const full=document.createElement("button");full.id="accraFullscreenBtn";full.textContent="⛶ Full screen";
 const btn=document.createElement("button");btn.id="accraSettingsBtn";btn.textContent="⚙ Settings";
 const root=document.createElement("div");root.id="accraSettings";
 root.innerHTML='<div class="panel"><div class="setting-row"><h2>Game settings</h2><button class="secondary" id="asClose">✕</button></div><p style="color:#aeb8bd;margin:5px 0 14px">Tune Accra Life for your device and play style.</p><label for="asQuality">Graphics quality</label><select id="asQuality"><option value="low">Low · best performance</option><option value="medium">Medium · balanced</option><option value="high">High · detailed</option><option value="ultra">Ultra · demanding</option></select><label for="asCamera">Camera sensitivity <output id="asCameraOut"></output></label><input id="asCamera" type="range" min="300" max="1800" step="50"><label for="asDistance">Camera distance <output id="asDistanceOut"></output></label><input id="asDistance" type="range" min="4" max="16" step=".5"><label for="asBrightness">Brightness <output id="asBrightnessOut"></output></label><input id="asBrightness" type="range" min=".65" max="1.5" step=".05"><div class="setting-row" style="margin-top:16px"><label for="asFog" style="margin:0">Environment fog</label><input id="asFog" type="checkbox" style="width:22px;height:22px"></div><label>Background music · Ghana-inspired instrumental</label><div class="setting-row"><button id="asMusic" class="secondary">Play music</button><span style="color:#aeb8bd">Original highlife / Afrobeat feel</span></div><label for="asVolume">Music volume <output id="asVolumeOut"></output></label><input id="asVolume" type="range" min="0" max=".6" step=".02"><button id="asReset" class="secondary" style="width:100%;margin-top:18px">Reset settings</button></div>';
 const help=document.createElement("div");help.id="accraFullscreenHelp";help.innerHTML='<div class="panel"><h2 style="color:#e6c46b;margin-top:0">Play without browser bars</h2><p>On iPhone, open the browser Share menu, choose <b>Add to Home Screen</b>, then launch Accra Life from its new Home Screen icon. It will open in an app-like full-screen window.</p><p>On supported browsers, use the Full screen button during play.</p><button id="asHelpClose" style="width:100%;padding:12px;border:0;border-radius:10px;background:#c9a54a;font-weight:800">Got it</button></div>';
 document.body.append(full,btn,root,help);const $=id=>root.querySelector("#"+id);
 const sync=()=>{$("asQuality").value=prefs.quality;$("asCamera").value=prefs.cameraSensitivity;$("asDistance").value=prefs.cameraDistance;$("asBrightness").value=prefs.brightness;$("asFog").checked=!!prefs.fog;$("asVolume").value=prefs.volume;$("asCameraOut").textContent=prefs.cameraSensitivity;$("asDistanceOut").textContent=Number(prefs.cameraDistance).toFixed(1);$("asBrightnessOut").textContent=Number(prefs.brightness).toFixed(2);$("asVolumeOut").textContent=Math.round(prefs.volume*100)+"%";$("asMusic").textContent=prefs.music?"Stop music":"Play music";};
 btn.onclick=()=>{root.style.display="flex";sync();};$("asClose").onclick=()=>root.style.display="none";root.addEventListener("click",e=>{if(e.target===root)root.style.display="none";});
 $("asQuality").onchange=e=>{applyQuality(e.target.value);sync();};$("asCamera").oninput=e=>{prefs.cameraSensitivity=+e.target.value;cam.angularSensibility=prefs.cameraSensitivity;persist();sync();};
 $("asDistance").oninput=e=>{prefs.cameraDistance=+e.target.value;cam.radius=prefs.cameraDistance;persist();sync();};$("asBrightness").oninput=e=>{prefs.brightness=+e.target.value;ipc.exposure=prefs.brightness;persist();sync();};
 $("asFog").onchange=e=>{prefs.fog=e.target.checked;scene.fogEnabled=prefs.fog;persist();};$("asVolume").oninput=e=>{setVolume(e.target.value);sync();};
 $("asMusic").onclick=async()=>{if(prefs.music)stopMusic();else{const ok=await startMusic();if(!ok)window.alert("This browser does not support background music.");}sync();};
 $("asReset").onclick=()=>{stopMusic();prefs={...defaults};applyAll();sync();};
 document.addEventListener("keydown",e=>{if(e.key==="Escape")root.style.display="none";});
 full.onclick=async()=>{if(document.fullscreenElement){if(document.exitFullscreen)await document.exitFullscreen();return;}try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:"hide"});else help.style.display="flex";}catch(_){help.style.display="flex";}};
 help.querySelector("#asHelpClose").onclick=()=>help.style.display="none";document.addEventListener("fullscreenchange",()=>{full.textContent=document.fullscreenElement?"⛶ Exit full screen":"⛶ Full screen";});
 if(window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches)full.style.display="none";
 applyAll();sync();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
window.ACCRA_SETTINGS={open:()=>document.getElementById("accraSettingsBtn")?.click()};
})();