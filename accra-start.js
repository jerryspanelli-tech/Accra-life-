/* accra-start.js - the start screen. The player picks gender, name, skin tone, shirt colour, hairstyle and hat,
 * sees a preview, and presses Start Game. Uses the production GLB avatar (CesiumMan.glb) when active. */
(function () {
  try {
    const SKINS = ["#6b4028", "#8d5a3b", "#a8754f", "#c68a5e", "#e0b48a"];
    const SHIRTS = ["#1f5c3a", "#8a1c2b", "#d9822b", "#e8e6df", "#c9a54a", "#2b2f36", "#2e7fd0"];
    const HAIRS = ["dreads", "braids", "afro", "fade", "bald"];
    const HATS = ["none", "cap", "beanie", "hood"];

    // --- Translation tables between UI display values and internal look indices ---
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

    function drawPreview(cv) {
      if (!cv) return;
      const c = cv.getContext("2d"); c.clearRect(0, 0, 200, 260);
      const g = c.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, "#cfe6f5"); g.addColorStop(1, "#eaf4fb"); c.fillStyle = g; c.fillRect(0, 0, 200, 260);
      const fem = sel.gender === "female";
      c.fillStyle = sel.shirtHex; c.fillRect(fem ? 66 : 62, 92, fem ? 68 : 76, 86);
      c.fillStyle = "#15171c"; c.fillRect(70, 176, 26, 40); c.fillRect(104, 176, 26, 40);
      c.fillStyle = sel.skinTone; c.fillRect(70, 214, 22, 30); c.fillRect(108, 214, 22, 30);
      c.fillStyle = "#f4f4f2"; c.fillRect(64, 244, 30, 12); c.fillRect(106, 244, 30, 12);
      c.fillStyle = sel.shirtHex; c.fillRect(46, 96, 14, 70); c.fillRect(140, 96, 14, 70);
      c.fillStyle = sel.skinTone; c.beginPath(); c.arc(100, 72, 24, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#1a1410";
      if (sel.hairStyle === "dreads") for (let i = -3; i <= 3; i++) c.fillRect(100 + i * 8 - 2, 88, 4, 28);
      if (sel.hairStyle === "braids") for (let i = -3; i <= 3; i++) c.fillRect(100 + i * 8 - 1, 88, 3, 34);
      if (sel.hairStyle === "afro") { c.beginPath(); c.arc(100, 58, 36, 0, Math.PI * 2); c.fill(); c.fillStyle = sel.skinTone; c.beginPath(); c.arc(100, 74, 22, 0, Math.PI * 2); c.fill(); }
      if (sel.hairStyle === "fade") { c.beginPath(); c.arc(100, 68, 25, Math.PI, 0); c.fill(); }
      if (sel.hatStyle === "cap") { c.fillStyle = "#3a3a44"; c.fillRect(74, 42, 52, 12); c.fillRect(70, 52, 34, 6); }
      if (sel.hatStyle === "beanie") { c.fillStyle = "#c9d13a"; c.beginPath(); c.arc(100, 52, 28, Math.PI, 0); c.fill(); }
      if (sel.hatStyle === "hood") { c.fillStyle = sel.shirtHex; c.beginPath(); c.arc(100, 66, 34, Math.PI * 0.9, Math.PI * 2.1); c.fill(); }
    }

    function render() {
      card.innerHTML = `
        <div style="text-align:center;margin-bottom:10px">
          <div style="font:800 22px system-ui;color:#c9a54a;letter-spacing:1px">ACCRA LIFE</div>
          <div style="color:#aaa;font-size:12px">Create your character</div>
        </div>
        <div style="display:flex;justify-content:center;margin-bottom:10px"><canvas id="sPrev" width="200" height="260" style="width:130px;height:169px;border-radius:14px"></canvas></div>
        <div style="margin:8px 0 4px;color:#c9a54a;font-weight:700">Gender</div>
        <div style="display:flex;gap:8px">${btn(sel.gender === "male", "male")}${btn(sel.gender === "female", "female")}</div>
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Name</div>
        <input id="sName" maxlength="16" value="${escHtml(sel.name)}" placeholder="Your name" style="width:100%;box-sizing:border-box;border:0;border-radius:12px;padding:11px 12px;font:600 15px system-ui;background:#fff;color:#111">
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Skin tone</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${sw(SKINS, "skinTone", sel.skinTone)}</div>
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Shirt colour</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${sw(SHIRTS, "shirtHex", sel.shirtHex)}</div>
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Hairstyle</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${chips(HAIRS, "hairStyle", sel.hairStyle)}</div>
        <div style="margin:10px 0 4px;color:#c9a54a;font-weight:700">Hat or hood</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${chips(HATS, "hatStyle", sel.hatStyle)}</div>
        <button id="sStart" style="margin-top:16px;width:100%;border:0;border-radius:16px;padding:14px;font:800 17px system-ui;background:#c9a54a;color:#17191c">Start Game</button>`;
      drawPreview(document.getElementById("sPrev"));
    }

    card.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "sStart") return startGame();
      if (b.dataset.k) { sel[b.dataset.k] = b.dataset.v; render(); return; }
      if (b.dataset.v === "male" || b.dataset.v === "female") { sel.gender = b.dataset.v; render(); }
    });
    card.addEventListener("input", e => { if (e.target.id === "sName") { sel.name = e.target.value.trim(); drawPreview(document.getElementById("sPrev")); } });

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
