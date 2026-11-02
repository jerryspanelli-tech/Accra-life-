/* accra-start.js - character selection uses the same 3D male/female GLBs as the playable character. */
(async function () {
  try {
    const auth = await window.ACCRA_AUTH_READY;
    const savedProfile = await auth.requireSession();
    const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const saved = (window.ACCRA_AVATAR && window.ACCRA_AVATAR.look) || {};
    const sel = {
      gender: saved.gender === "female" ? "female" : "male",
      name: localStorage.getItem("accra-name") || "",
      age: localStorage.getItem("accra-age") || (savedProfile && savedProfile.age != null ? String(savedProfile.age) : "")
    };

    if (savedProfile && savedProfile.display_name) {
      sel.gender = savedProfile.gender === "female" ? "female" : "male";
      sel.name = savedProfile.display_name;
      if (savedProfile.age != null) sel.age = String(savedProfile.age);
      localStorage.setItem("accra-name", sel.name);
      if (savedProfile.age != null) localStorage.setItem("accra-age", String(savedProfile.age));
      const look = window.ACCRA_AVATAR && window.ACCRA_AVATAR.look;
      if (look) { look.gender = sel.gender; if (savedProfile.look) Object.assign(look, savedProfile.look); }
      const lobby = document.createElement("div");
      lobby.id = "accraLobby";
      lobby.style.cssText = "position:fixed;inset:0;z-index:200;background:linear-gradient(145deg,#101820,#18252a 55%,#0b0d10);color:#fff;font:14px system-ui;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box";
      lobby.innerHTML = `<div style="width:min(100%,420px);padding:24px;border:1px solid #c9a54a;border-radius:22px;background:rgba(25,29,31,.96);box-shadow:0 20px 70px #0009;text-align:center"><div style="font-size:12px;letter-spacing:4px;color:#c9a54a;font-weight:800">WELCOME BACK</div><div style="font-size:30px;font-weight:900;margin:8px 0;color:#f4d27a">ACCRA LIFE</div><div style="font-size:20px;font-weight:700">${escHtml(sel.name)}</div><div style="color:#aeb8bd;margin:6px 0 22px">${sel.gender === "female" ? "Female citizen" : "Male citizen"}${sel.age ? " · " + escHtml(sel.age) + " years old" : ""}</div><button id="lobbyContinue" style="width:100%;padding:15px;border:0;border-radius:13px;background:#c9a54a;color:#17191c;font:800 16px system-ui">Continue your life</button><button id="lobbyCharacter" style="width:100%;padding:13px;margin-top:10px;border:1px solid #777;border-radius:13px;background:transparent;color:#fff;font:700 14px system-ui">Manage character</button></div>`;
      document.body.appendChild(lobby);
      const enter = () => { lobby.remove(); if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply(); };
      lobby.querySelector("#lobbyContinue").onclick = enter;
      lobby.querySelector("#lobbyCharacter").onclick = () => { enter(); setTimeout(() => window.ACCRA_STYLER && window.ACCRA_STYLER("edit"), 250); };
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).start = 1;
      return;
    }

    const ov = document.createElement("div");
    ov.id = "startScreen";
    ov.style.cssText = "position:fixed;inset:0;z-index:200;background:linear-gradient(180deg,#14161a,#0b0c0f);color:#fff;font:14px system-ui;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:18px 12px;box-sizing:border-box";
    const card = document.createElement("div");
    card.style.cssText = "width:min(94vw,380px);background:rgba(28,30,33,.95);border:2px solid #c9a54a;border-radius:20px;padding:16px;box-sizing:border-box";
    ov.appendChild(card);
    document.body.appendChild(ov);

    const btn = (active, label) => `<button data-v="${label}" style="flex:1;min-width:0;border:0;border-radius:12px;padding:10px 6px;font:700 13px system-ui;background:${active ? "#c9a54a" : "rgba(255,255,255,.12)"};color:${active ? "#17191c" : "#fff"}">${label}</button>`;
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
          window.__accraSelectionPreviewLoaded=sel.gender;
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
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Your name</div>
        <input id="sName" maxlength="16" value="${escHtml(sel.name)}" placeholder="Your name" autocomplete="nickname" style="width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:11px 12px;font:600 15px system-ui;background:#fff;color:#111"><div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Age</div><input id="sAge" type="number" min="1" max="120" step="1" value="${escHtml(sel.age)}" placeholder="Your age" inputmode="numeric" style="width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:11px 12px;font:600 15px system-ui;background:#fff;color:#111">
        <div style="color:#aaa;font-size:11px;margin-top:8px">This is the same 3D character model used in the game. Choose your character here; buy clothes at Accra Galleria Mall and change hairstyles at the barber shop.</div>
        <button id="sStart" style="margin-top:16px;width:100%;border:0;border-radius:16px;padding:14px;font:800 17px system-ui;background:#c9a54a;color:#17191c">Start Game</button>`;
      drawPreview(document.getElementById("sPrev"));
    }

    card.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "sStart") return startGame();
      if (b.dataset.v === "male" || b.dataset.v === "female") { sel.gender = b.dataset.v; render(); }
    });
    card.addEventListener("input", e => { if (e.target.id === "sName") sel.name = e.target.value.trim();
      if (e.target.id === "sAge") sel.age = e.target.value; });

    async function startGame() {
      const name = (sel.name || "").slice(0, 16) || "Citizen";
      const age = Number(sel.age);
      if (!Number.isInteger(age) || age < 1 || age > 120) { const ageInput = document.getElementById("sAge"); ageInput.setCustomValidity("Enter an age from 1 to 120."); ageInput.reportValidity(); return; }
      localStorage.setItem("accra-age", String(age));
      localStorage.setItem("accra-name", name);
      const look = window.ACCRA_AVATAR && window.ACCRA_AVATAR.look;
      if (look) look.gender = sel.gender;
      try { await auth.saveProfile({ display_name: name, gender: sel.gender, age, look: look || { gender: sel.gender } }); }
      catch (err) { console.error("[AccraAuth] Could not save player profile:", err); }
      if(previewEngine){previewEngine.stopRenderLoop();previewEngine.dispose();previewEngine=null;previewScene=null;}
      ov.remove();
      setTimeout(() => {
        try {
          if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
          if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.isNew && window.ACCRA_STYLER) window.ACCRA_STYLER("first");
          if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("Welcome to Accra, " + name);
        } catch (err) {
          console.error("accra-start: character selection failed", err);
          if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("Character step failed: " + (err.message || err));
        }
      }, 100);
    }

    render();
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).start = 1;
  } catch (err) { console.error("accra-start failed:", err); }
})();
