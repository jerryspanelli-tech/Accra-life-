/* accra-start.js - the start screen. The player picks gender, name, skin tone, shirt colour, hairstyle and hat,
 * sees a preview, and presses Start Game. The screen closes first, then the figure is rebuilt a moment later,
 * so the phone does not do two heavy jobs at the same time. */
(function () {
  try {
    const SKINS = ["#6b4028", "#8d5a3b", "#a8754f", "#c68a5e", "#e0b48a"];
    const SHIRTS = ["#1f5c3a", "#8a1c2b", "#d9822b", "#e8e6df", "#c9a54a", "#2b2f36", "#2e7fd0"];
    const HAIRS = ["dreads", "braids", "afro", "fade", "bald"];
    const HATS = ["none", "cap", "beanie", "hood"];

    // --- Translation tables between UI display values and the internal
    // look indices that online.js / accra-figure.js actually read. ---
    const SKIN_TO_IDX  = {"#6b4028":2, "#8d5a3b":1, "#a8754f":4, "#c68a5e":0, "#e0b48a":7};
    const SKIN_FROM_IDX= {0:"#c68a5e", 1:"#8d5a3b", 2:"#6b4028", 3:"#6b4028", 4:"#a8754f", 5:"#6b4028", 6:"#e0b48a", 7:"#e0b48a"};
    const HAIR_TO_IDX  = {dreads:3, braids:4, afro:2, fade:1, bald:0};
    const HAIR_FROM_IDX= {0:"bald", 1:"fade", 2:"afro", 3:"dreads", 4:"braids", 5:"braids", 6:"dreads", 7:"fade", 8:"fade", 9:"dreads"};
    const HAT_TO_IDX   = {none:0, cap:2, beanie:3, hood:0};
    const HAT_FROM_IDX = {0:"none", 1:"none", 2:"cap", 3:"beanie", 4:"none", 5:"none"};
    const SHIRT_TO_IDX = {"#1f5c3a":2, "#8a1c2b":0, "#d9822b":7, "#e8e6df":4, "#c9a54a":1, "#2b2f36":5, "#2e7fd0":3};
    const SHIRT_FROM_IDX={0:"#8a1c2b", 1:"#c9a54a", 2:"#1f5c3a", 3:"#2e7fd0", 4:"#e8e6df", 5:"#2b2f36", 6:"#2b2f36", 7:"#d9822b"};

    const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeIdx = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;

    const saved = (window.ACCRA_AVATAR && window.ACCRA_AVATAR.look) || {};
    const sel = {
      gender:    saved.gender || "male",
      name:      localStorage.getItem("accra-name") || "",
      skinTone:  saved.skinTone   || SKIN_FROM_IDX[safeIdx(saved.skin, 2)]  || SKINS[0],
      shirtHex:  saved.shirtHex   || SHIRT_FROM_IDX[safeIdx(saved.top, 3)]  || SHIRTS[0],
      hairStyle: saved.hairStyle  || HAIR_FROM_IDX[safeIdx(saved.hair, 1)]  || "dreads",
      hatStyle:  saved.hatStyle   || HAT_FROM_IDX[safeIdx(saved.acc, 0)]    || "none"
    };

    const ov = document.createElement("div");
    ov.id = "startScreen";
    ov.style.cssText = "position:fixed;inset:0;z-index:200;background:linear-gradient(180deg,#14161a,#0b0c0f);color:#fff;font:14px system-ui;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:18px 12px;box-sizing:border-box";
    const card = document.createElement("div");
    card.style.cssText = "width:min(94vw,380px);background:rgba(28,30,33,.95);border:2px solid #c9a54a;border-radius:20px;padding:16px;box-sizing:border-box";
    ov.appendChild(card);
    document.body.appendChild(ov);

    const btn = (active, label) => `<button data-v="${label}" style="flex:1;min-width:0;border:0;border-radius:12px;padding:10px 6px;font:700 13px system-ui;background:${active ? "#c9a54a" : "rgba(255,255,255,.12)"};color:${active ? "#17191c" : "#fff"}">${label}</button>`;
    const sw = (arr, key, cur) => arr.map(c => `<button data-k="${key}" data-v="${c}" style="width:38px;height:38px;border-radius:50%;border:${c === cur ? "3px solid #c9a54a" : "2px solid rgba(255,255,255,.3)"};background:${c};padding:0"></button>`).join("");
    const chips = (arr, key, cur) => arr.map(c => `<button data-k="${key}" data-v="${c}" style="border:0;border-radius:12px;padding:8px 10px;font:700 12px system-ui;background:${c === cur ? "#c9a54a" : "rgba(255,255,255,.12)"};color:${c === cur ? "#17191c" : "#fff"}">${c}</button>`).join("");

    let previewEngine=null,previewScene=null,previewToken=0;
    function drawPreview(cv) {
      const token=++previewToken;
      if(previewEngine){previewEngine.stopRenderLoop();previewEngine.dispose();previewEngine=null;previewScene=null;}
      if(!cv||!window.BABYLON)return;
      try{
        previewEngine=new BABYLON.Engine(cv,false,{adaptToDeviceRatio:true,stencil:false,preserveDrawingBuffer:false});
        if(/iPhone|iPad|Android/i.test(navigator.userAgent))previewEngine.setHardwareScalingLevel(1.6);
        previewScene=new BABYLON.Scene(previewEngine);previewScene.clearColor=new BABYLON.Color4(.72,.81,.85,1);
        const hemi=new BABYLON.HemisphericLight("startHemi",new BABYLON.Vector3(0,1,0),previewScene);hemi.intensity=.9;
        const sun=new BABYLON.DirectionalLight("startSun",new BABYLON.Vector3(-.4,-1,-.5),previewScene);sun.position.set(3,8,5);sun.intensity=1.1;
        const camera=new BABYLON.ArcRotateCamera("startCamera",-Math.PI/2,1.2,3.6,new BABYLON.Vector3(0,.9,0),previewScene);
        camera.lowerRadiusLimit=2.7;camera.upperRadiusLimit=5;camera.lowerBetaLimit=.8;camera.upperBetaLimit=1.45;camera.attachControl(cv,true);
        BABYLON.SceneLoader.ImportMeshAsync("","People/AccraLife/","AccraLife_"+(sel.gender==="female"?"Female":"Male")+".glb",previewScene).then(res=>{
          if(token!==previewToken){res.animationGroups.forEach(g=>g.dispose());res.meshes.forEach(m=>m.dispose(false,true));return;}
          const root=res.meshes[0],bb=root.getHierarchyBoundingVectors(true),h=bb.max.y-bb.min.y,scale=h>0?1.8/h:1;
          root.scaling.setAll(scale);root.position.y=-bb.min.y*scale;
          const idle=(res.animationGroups||[]).find(g=>g.name.toLowerCase()==="idle");if(idle)idle.start(true);
        }).catch(err=>console.error("[accra-start] 3D preview failed:",err));
        previewEngine.runRenderLoop(()=>{if(previewScene)previewScene.render();});
      }catch(err){console.error("[accra-start] Preview engine failed:",err);}
    }

    function render() {
      card.innerHTML = `
        <div style="text-align:center;margin-bottom:10px">
          <div style="font:800 22px system-ui;color:#c9a54a;letter-spacing:1px">ACCRA LIFE</div>
          <div style="color:#aaa;font-size:12px">Create your character</div>
        </div>
        <div style="display:flex;justify-content:center;margin-bottom:10px"><canvas id="sPrev" width="200" height="260" style="width:180px;height:234px;border-radius:14px;touch-action:pan-y"></canvas></div>
        <div style="margin:8px 0 4px;color:#c9a54a;font-weight:700">Choose your character</div>
        <div style="display:flex;gap:8px">${btn(sel.gender === "male", "male")}${btn(sel.gender === "female", "female")}</div>
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Name</div>
        <input id="sName" maxlength="16" value="${escHtml(sel.name)}" placeholder="Your name" style="width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:11px 12px;font:600 15px system-ui;background:#fff;color:#111">
        <div style="color:#aaa;font-size:11px;margin-top:8px">The preview uses the actual in-game 3D character. Clothing, hairstyles and further appearance options will be added to this model system next.</div>
        <button id="sStart" style="margin-top:16px;width:100%;border:0;border-radius:16px;padding:14px;font:800 17px system-ui;background:#c9a54a;color:#17191c">Start Game</button>`;
      drawPreview(document.getElementById("sPrev"));
    }

    card.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "sStart") return startGame();
      if (b.dataset.k) { sel[b.dataset.k] = b.dataset.v; render(); return; }
      if (b.dataset.v === "male" || b.dataset.v === "female") { sel.gender = b.dataset.v; render(); }
    });
    card.addEventListener("input", e => { if (e.target.id === "sName") { sel.name = e.target.value.trim(); } });

    function startGame() {
      const name = (sel.name || "").slice(0, 16) || "Citizen";
      localStorage.setItem("accra-name", name);
      const look = window.ACCRA_AVATAR && window.ACCRA_AVATAR.look;
      if (look) {
        // Save both the UI values (so this screen remembers what the player picked)
        // AND the internal indices (so online.js / accra-figure.js actually renders them).
        Object.assign(look, {
          gender:    sel.gender,
          skinTone:  sel.skinTone,
          shirtHex:  sel.shirtHex,
          hairStyle: sel.hairStyle,
          hatStyle:  sel.hatStyle,
          skin: SKIN_TO_IDX[sel.skinTone]  != null ? SKIN_TO_IDX[sel.skinTone]  : 2,
          top:  SHIRT_TO_IDX[sel.shirtHex] != null ? SHIRT_TO_IDX[sel.shirtHex] : 3,
          hair: HAIR_TO_IDX[sel.hairStyle] != null ? HAIR_TO_IDX[sel.hairStyle] : 1,
          acc:  HAT_TO_IDX[sel.hatStyle]   != null ? HAT_TO_IDX[sel.hatStyle]   : 0
        });
        if (sel.hatStyle === 'hood') console.log('[accra-start] hood not yet supported on the 3D avatar, using no hat');
      }
      if(previewEngine){previewEngine.stopRenderLoop();previewEngine.dispose();previewEngine=null;previewScene=null;}
      ov.remove();
      setTimeout(() => {
        try {
          if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
          if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("Welcome to Accra, " + name);
        } catch (err) {
          console.error("accra-start: figure rebuild failed", err);
          if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("Character step failed: " + (err.message || err));
        }
      }, 400);
    }

    render();
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).start = 1;
  } catch (err) { console.error("accra-start failed:", err); }
})();
