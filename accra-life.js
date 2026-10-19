/* accra-life.js — loaded by accra-upgrade.js.
 * Vitals (health, energy, hunger, hygiene, mood), sitting, sleeping, fridge, cooking, laptop,
 * food kiosks, and homes you can rent or buy (towers, houses, a mansion) with real interiors. */
(function () {
  const K0 = window.ACCRA_KIT;
  try {
    const K = window.ACCRA_KIT, AV = window.ACCRA_AVATAR;
    if (!K || !AV) { console.log("accra-life: needs accra-upgrade.js and online.js"); return; }
    const B = BABYLON, P = Math.PI, { item, note, show, hide, ttl, BS, GOLD, cash, ls, sv, points } = K;
    const clamp = v => Math.max(0, Math.min(100, v));
    const notify = (m, a) => { if (window.ACCRA_NOTIFY) window.ACCRA_NOTIFY(m, a); };
    const earn = (n, why) => { if (window.ACCRA_ADD) window.ACCRA_ADD(n, why); save(); };
    const st = Object.assign({ hp: 100, en: 100, hu: 80, hy: 80, md: 70, food: {}, keys: {}, play: 0 }, ls("accra-life", {}));
    st.food = st.food || {}; st.inv = st.inv || {}; st.deco = st.deco || {}; st.drunk = st.drunk || 0;
    window.playerInventory = { fridgeItems: st.food, items: st.inv };   // everything bought for the fridge lives here and is saved
    const save = () => sv("accra-life", st);
    const pay = (n, w) => { K.pay(n, w); save(); };
    window.addEventListener("pagehide", save); document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
    const SB = "border:0;border-radius:9px;background:#c9a54a;color:#17191c;font:700 12px system-ui;padding:6px 10px;margin:4px 4px 0 0";
    const CLOSE = '<button data-x="1" style="' + BS + ';text-align:center">Close</button>';
    let seated = null, busy = false, inside = null, ret = null, swimming = false;
    const SP = { on: false }; window.ACCRA_MOVE = SP;
    { const sb = document.createElement("button"); sb.textContent = "\u26A1"; sb.setAttribute("aria-label", "Sprint");
      sb.style.cssText = "position:fixed;right:calc(env(safe-area-inset-right,0px) + 26px);bottom:calc(env(safe-area-inset-bottom,0px) + 94px);width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(28,30,33,.55);color:#fff;font-size:22px;z-index:6;touch-action:none;padding:0";
      sb.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); SP.on = true; sb.style.background = "rgba(201,165,74,.9)"; });
      ["pointerup", "pointercancel", "pointerleave"].forEach(t => sb.addEventListener(t, () => { SP.on = false; sb.style.background = "rgba(28,30,33,.55)"; }));
      document.body.appendChild(sb); }
    const tp = (x, z) => player.position.set(x, .91, z);

    // ---------- fade helper ----------
    const fadeEl = document.createElement("div");
    fadeEl.style.cssText = "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .6s;z-index:60";
    document.body.appendChild(fadeEl);
    const fade = (ms, mid, end) => { busy = true; fadeEl.style.opacity = 1; setTimeout(() => { if (mid) mid(); fadeEl.style.opacity = 0; setTimeout(() => { busy = false; if (end) end(); }, 600); }, ms); };

    // ---------- vitals HUD ----------
    const hud = document.createElement("div");
    hud.style.cssText = "position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 56px);width:112px;background:rgba(28,30,33,.72);border-radius:12px;padding:5px 7px;z-index:5;font:11px system-ui;color:#fff;pointer-events:none";
    document.body.appendChild(hud);
    const BAR = [["hp", "\u2764\uFE0F", "#e5484d"], ["en", "\u26A1", "#f5c542"], ["hu", "\uD83C\uDF7D\uFE0F", "#f08a3c"], ["hy", "\uD83D\uDEBF", "#4aa3d9"], ["md", "\uD83D\uDE42", "#5cc27a"]];
    const paintHud = () => { hud.innerHTML = BAR.map(b => '<div style="display:flex;align-items:center;gap:5px;margin:2px 0"><span style="width:14px">' + b[1] + '</span><div style="flex:1;height:7px;background:rgba(255,255,255,.18);border-radius:4px;overflow:hidden"><div style="width:' + clamp(st[b[0]]) + '%;height:100%;background:' + b[2] + '"></div></div></div>').join(""); };
    paintHud();

    // ---------- slow down when exhausted, freeze when seated or busy ----------
    const mwc = player.moveWithCollisions.bind(player);
    player.moveWithCollisions = v => { const f = (busy || seated) ? 0 : (swimming ? .55 : (st.en < 12 ? .8 : 1.3) * (SP.on && st.en > 6 ? 1.65 : 1) * (st.drunk > 6 ? .8 : 1)); return mwc(new B.Vector3(v.x * f, v.y, v.z * f)); };

    // ---------- seating and sleeping ----------
    function sit(x, z, ry, sh, m) {   // sh = seat height, m = how you get up: 1 forward, -1 backward, 0 sideways
      const f = [Math.sin(ry), Math.cos(ry)], o = m === 0 ? [f[1], -f[0]] : [f[0] * m, f[1] * m];
      seated = { x, z, out: [o[0] * 1.2, o[1] * 1.2] }; player.position.set(x, .91, z); player.rotation.y = ry; AV.sitH = sh || .45; AV.pose = "sit";
    }
    function stand() { if (!seated) return; const s = seated; seated = null; AV.pose = null; player.position.set(s.x + s.out[0], .91, s.z + s.out[1]); }
    points.push({ get x() { return player.position.x; }, get z() { return player.position.z; }, r: 1e9, t: "\u2B06 Stand up", ok: () => !!seated, f: stand });
    function sleep(x, z, ry) {
      if (st.en > 85) return note("You are not tired enough to sleep.");
      AV.pose = "sleep"; player.position.set(x, .91, z); player.rotation.y = ry;
      fade(2600, () => { st.en = 100; st.hp = clamp(st.hp + 20); st.hu = clamp(st.hu - 12); st.hy = clamp(st.hy - 8); st.md = clamp(st.md + 10); },
        () => { AV.pose = null; player.position.set(x + Math.cos(ry) * 1.7, .91, z - Math.sin(ry) * 1.7); note("You slept well. Energy restored."); });
    }
    function wash() { fade(1500, () => { st.hy = 100; st.md = clamp(st.md + 6); }, () => note("Fresh and clean!")); }

    // ---------- food, fridge, cooker, kiosks ----------
    const FOOD = { rice: ["Rice", 15], tomato: ["Tomatoes", 6], chicken: ["Chicken", 25], fish: ["Fish", 20], yam: ["Yam", 12], plantain: ["Plantain", 8], eggs: ["Eggs", 10], bread: ["Bread", 7], oil: ["Cooking oil", 12] };
    const SNACKS = [["Waakye plate", 20, 35, 4], ["Kelewele", 8, 14, 3], ["Sobolo drink", 5, 8, 2], ["Bottled water", 3, 4, 0]];
    const RECIPES = [["Jollof rice", { rice: 1, tomato: 1, oil: 1 }, 40, 10], ["Fried rice & chicken", { rice: 1, chicken: 1, oil: 1 }, 45, 10], ["Fried yam & fish", { yam: 1, fish: 1, oil: 1 }, 45, 10], ["Omelette & bread", { eggs: 1, bread: 1, oil: 1 }, 30, 6], ["Fried plantain", { plantain: 1, oil: 1 }, 25, 5]];
    function fridge() {
      const inv = window.playerInventory.fridgeItems, ks = Object.keys(FOOD).filter(k => inv[k] > 0), total = ks.reduce((n, k) => n + inv[k], 0);
      show(ttl("\uD83E\uDDCA Your fridge") + (ks.length ? '<div style="opacity:.7;padding:2px 0">' + total + " items stored</div>" + ks.map(k => '<div style="grid-column:auto;padding:7px 9px;margin:3px 0;background:rgba(255,255,255,.1);border-radius:10px">' + FOOD[k][0] + " \u00D7 " + inv[k] + "</div>").join("") : '<div style="padding:6px 0">Empty. Buy groceries at a kiosk, in the mall, or with JOLLY MART on your phone.</div>') + CLOSE, hide);
    }
    function cook() {
      const draw = () => show(ttl("Cooker") + RECIPES.map((r, i) => {
        const ok = Object.keys(r[1]).every(k => (st.food[k] || 0) >= r[1][k]);
        return '<button data-i="' + i + '" style="' + BS + (ok ? "" : ";opacity:.5") + '">' + r[0] + (ok ? " \u00B7 cook" : " \u00B7 need " + Object.keys(r[1]).map(k => FOOD[k][0]).join(", ")) + "</button>";
      }).join("") + CLOSE, d => {
        if (d.x) return hide();
        const r = RECIPES[+d.i]; if (!Object.keys(r[1]).every(k => (st.food[k] || 0) >= r[1][k])) return note("You are missing ingredients.");
        hide(); busy = true; note("Cooking " + r[0] + "\u2026");
        setTimeout(() => { Object.keys(r[1]).forEach(k => st.food[k] -= r[1][k]); st.hu = clamp(st.hu + r[2]); st.md = clamp(st.md + r[3]); st.hp = clamp(st.hp + 3); st.en = clamp(st.en + 5); busy = false; note("Enjoy your " + r[0] + "!"); }, 3500);
      });
      draw();
    }
    function kiosk(online) {
      const px = p => online ? Math.ceil(p * 1.1) : p;
      const draw = () => show(ttl(online ? "Online groceries (+10%)" : "Kiosk") + "<small>Cash: GH\u00A2" + cash() + "</small>" +
        (online ? "" : '<div style="margin:6px 0;color:#c9a54a;font-weight:700">Eat now</div>' + SNACKS.map((s, i) => '<button data-s="' + i + '" style="' + BS + '">' + s[0] + " \u00B7 GH\u00A2" + s[1] + " \u00B7 +" + s[2] + " hunger</button>").join("")) +
        '<div style="margin:6px 0;color:#c9a54a;font-weight:700">Groceries for your fridge</div>' +
        Object.keys(FOOD).map(k => '<button data-g="' + k + '" style="' + BS + '">' + FOOD[k][0] + " \u00B7 GH\u00A2" + px(FOOD[k][1]) + " \u00B7 have " + (st.food[k] || 0) + "</button>").join("") + CLOSE, d => {
        if (d.x) return hide();
        if (d.s !== undefined) { const s = SNACKS[+d.s]; if (cash() < s[1]) return note("Not enough cash."); pay(s[1], s[0]); st.hu = clamp(st.hu + s[2]); st.md = clamp(st.md + s[3]); note("Yum! " + s[0]); }
        else { const g = FOOD[d.g], c = px(g[1]); if (cash() < c) return note("Not enough cash."); pay(c, g[0]); st.food[d.g] = (st.food[d.g] || 0) + 1; save(); note(g[0] + " added to your fridge"); }
        draw();
      });
      draw();
    }
    const spots = [[K.MX - 11, K.MZ - 14], [K.MX + 11, K.MZ - 14]];
    R.forEach((c, k) => { const odd = k % 2, s1 = odd ? 1 : -1, s2 = odd ? -1 : 1; spots.push([odd ? -100 : 40, c + s1 * 9.2], [c + s2 * 9.2, odd ? 40 : -100]); });
    spots.forEach(s => points.push({ x: s[0], z: s[1], r: 3.8, t: "\uD83D\uDED2 Kiosk", ok: () => !busy && !seated, f: () => kiosk(false) }));

    // ---------- laptop ----------
    function laptop() {
      show(ttl("\uD83D\uDCBB Laptop") + '<button data-a="work" style="' + BS + '">Freelance work \u00B7 +GH\u00A240\u201390</button><button data-a="shop" style="' + BS + '">Order groceries online</button><button data-a="prop" style="' + BS + '">Property listings</button><button data-a="homes" style="' + BS + '">My homes &amp; rent</button>' + CLOSE, d => {
        if (d.x) return hide();
        if (d.a === "work") {
          if (st.en < 20) return note("Too tired to work. Rest or sleep first."); if (st.hu < 10) return note("You are too hungry to focus. Eat something.");
          hide(); busy = true; note("Working\u2026");
          setTimeout(() => { const g = 40 + Math.floor(Math.random() * 51); earn(g, "Freelance work"); st.en = clamp(st.en - 15); st.hu = clamp(st.hu - 6); st.md = clamp(st.md - 2); busy = false; note("Job done! +GH\u00A2" + g); }, 3000);
        } else if (d.a === "shop") kiosk(true);
        else if (d.a === "prop") allListings();
        else if (d.a === "homes") myHomes();
      });
    }
    // ---------- furniture that does things (villa + every home) ----------
    function reg(list, ox, oz, ok, skipWard) {
      list.forEach(f => {
        const id = f[2], ry = f[3], sc = f[4] || 1, x = ox + f[0], z = oz + f[1], fx = Math.sin(ry), fz = Math.cos(ry);
        const A = (px, pz, r, t, fn) => points.push({ x: px, z: pz, r, t, f: fn, ok: p => !busy && !seated && (!ok || ok(p)) });
        if (/^bed/.test(id)) A(x, z, 2.8, "\uD83D\uDECF\uFE0F Sleep", () => sleep(x, z, ry));
        else if (id === "fridge") A(x + fx * 1.1, z + fz * 1.1, 1.7, "\uD83E\uDDCA Fridge", fridge);
        else if (id === "counter" || id === "kit2") A(x + fx, z + fz, 2.6, "\uD83C\uDF73 Cook", cook);
        else if (id === "desk") { const sx = x + fx * .9 * sc, sz = z + fz * .9 * sc; A(sx, sz, 2, "\uD83D\uDCBB Laptop", () => { sit(sx, sz, ry + P, .53 * sc, -1); laptop(); }); }
        else if (id === "sofa" || id === "chair") A(x, z, 2.4, "\uD83D\uDECB\uFE0F Sit", () => sit(x, z, ry, .45 * sc, 1));
        else if (id === "dining") { [[1, P], [-1, 0]].forEach(s => { const sx = x + fx * .75 * sc * s[0], sz = z + fz * .75 * sc * s[0]; A(sx, sz, 1.6, "\uD83C\uDF7D\uFE0F Sit", () => sit(sx, sz, ry + s[1], .48 * sc, 0)); }); }
        else if (id === "bath") A(x, z, 2.4, "\uD83D\uDEC1 Wash", wash);
        else if (id === "wardrobe" && !skipWard) A(x + fx, z + fz, 1.8, "\uD83D\uDC54 Wardrobe", () => K.styler("wardrobe"));
      });
    }
    reg(window.ACCRA_VILLA || [], VX, VZ, null, true);

    // ---------- home interiors (built the first time you walk in) ----------
    const TPL = {
      room: { W: 6, D: 5, c: "#d8c9ad", p: [], f: [[-2, 1.5, "bed1", P], [2, 2.2, "wardrobe", P], [2.65, -1, "kit2", -P / 2], [2.6, .9, "fridge", -P / 2], [-.3, 2.3, "tv", P], [.4, -.3, "chair", 0, .9]] },
      hall: { W: 10, D: 5, c: "#d8c9ad", p: [[1, -1.65, .3, 1.7], [1, 1.65, .3, 1.7]], f: [[-3, 1.6, "bed2", P], [-3.6, -1.8, "wardrobe", 0], [2.2, -1.6, "sofa", 0], [2.2, 2.3, "tv", P], [4.65, .2, "kit2", -P / 2], [4.6, 2, "fridge", -P / 2], [-3.8, .3, "bath", 0]] },
      studio: { W: 8, D: 6, c: "#cfc3ae", p: [], f: [[-3, 2, "bed2", P], [.6, 2.65, "wardrobe", P], [3.2, 2.6, "tv", P], [2.4, -1, "sofa", 0], [3.65, -2, "kit2", -P / 2], [3.6, .5, "fridge", -P / 2], [-3.6, -.4, "desk", P / 2], [-3.2, -2.2, "bath", 0]] },
      apt1: { W: 10, D: 7, c: "#cfc3ae", p: [[-1.5, -2.35, .3, 2.3], [-1.5, 2.4, .3, 2.2]], f: [[-3.4, 2.3, "bed2", P], [-3, -3.2, "wardrobe", 0], [-4.5, 0, "desk", P / 2], [-3.8, -1.9, "bath", 0], [2.2, -1.6, "sofa", 0], [2.2, 3.2, "tv", P], [1.6, .8, "dining", 0], [4.65, .5, "kit2", -P / 2], [4.6, 2.3, "fridge", -P / 2]] },
      house: { W: 14, D: 9, c: "#cdbfa5", p: [[-1.5, -3.5, .3, 2], [-1.5, 0, .3, 2], [-1.5, 3.5, .3, 2], [-4.325, 0, 5.35, .3]], f: [[-4.3, -3.5, "bed2", 0], [-6.4, -1.2, "wardrobe", P / 2], [-4.3, 3.5, "bed1", P], [-6.4, 1.5, "desk", P / 2], [-2.8, .9, "bath", 0], [2.5, -2.5, "sofa", 0], [2.5, 4.1, "tv", P], [4.5, 1, "dining", 0, 1.2], [6.65, -1.5, "kit2", -P / 2], [6.6, .4, "fridge", -P / 2]] },
      mansion: { W: 18, D: 12, c: "#d6c9b0", p: [[-1.5, -4.25, .3, 3.5], [-1.5, 0, .3, 2], [-1.5, 4.25, .3, 3.5], [-5.325, 0, 7.35, .3]], f: [[-5.5, -5, "bed2", 0, 1.1], [-8.4, -1.5, "wardrobe", P / 2], [-5.5, 5, "bed2", P, 1.1], [-8.4, 2, "desk", P / 2], [-3.4, .9, "bath", 0], [3, -3.5, "sofa", 0, 1.2], [6, -3.5, "sofa", 0], [3, 5.7, "tv", P, 1.4], [5.5, 2.2, "dining", 0, 1.3], [8.65, -3, "kit2", -P / 2], [8.6, -1, "fridge", -P / 2], [7.5, 5.5, "shelf", P], [-.5, -2.5, "chair", 0]] }
    };
    const built = {};
    // ---- interior designer for luxury homes (houses, mansions, penthouses): tiles, carpets, wallpaper ----
    const LUX = ["house", "mansion"];
    const FLOOR_OPT = [["marble", "Marble tiles", 1500], ["checker", "Black & white tiles", 1200], ["carpet_cream", "Cream carpet", 800], ["carpet_burg", "Burgundy carpet", 900], ["carpet_navy", "Navy carpet", 900], ["wood", "Hardwood planks", 1000]];
    const WALL_OPT = [["cream", "Cream paint", 300], ["grey", "Grey paint", 300], ["stripes", "Gold stripe wallpaper", 600], ["damask", "Green damask wallpaper", 900], ["floral", "Blue floral wallpaper", 700], ["blackgold", "Black & gold wallpaper", 1200]];
    const nz = (c, w, h, n, cols) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } };
    const DRAW = {
      marble: (c, w, h) => { c.fillStyle = "#f2efe9"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(120,120,130,.35)"; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(Math.random() * w, 0); c.bezierCurveTo(Math.random() * w, h / 3, Math.random() * w, h * 2 / 3, Math.random() * w, h); c.stroke(); } c.strokeStyle = "#b9b4aa"; c.lineWidth = 3; c.strokeRect(0, 0, w, h); },
      checker: (c, w, h) => { c.fillStyle = "#f4f4f4"; c.fillRect(0, 0, w, h); c.fillStyle = "#17171a"; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2); },
      carpet_cream: (c, w, h) => { c.fillStyle = "#e8dcc2"; c.fillRect(0, 0, w, h); nz(c, w, h, 1500, ["#d9cba9", "#f0e6cf"]); },
      carpet_burg: (c, w, h) => { c.fillStyle = "#7a1f2b"; c.fillRect(0, 0, w, h); nz(c, w, h, 1500, ["#6a1a25", "#8d2a38"]); },
      carpet_navy: (c, w, h) => { c.fillStyle = "#1f2f55"; c.fillRect(0, 0, w, h); nz(c, w, h, 1500, ["#18264a", "#2b3d6a"]); },
      wood: (c, w, h) => { c.fillStyle = "#9a6b3f"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#8c5f36" : "#a87649"; c.fillRect(0, i * h / 4, w, h / 4 - 2); } },
      cream: (c, w, h) => { c.fillStyle = "#efe7d2"; c.fillRect(0, 0, w, h); }, grey: (c, w, h) => { c.fillStyle = "#cfd3d6"; c.fillRect(0, 0, w, h); },
      stripes: (c, w, h) => { c.fillStyle = "#f3ecd8"; c.fillRect(0, 0, w, h); c.fillStyle = "#c9a54a"; for (let i = 0; i < 4; i++) c.fillRect(i * w / 4 + w / 8 - 3, 0, 6, h); },
      damask: (c, w, h) => { c.fillStyle = "#2f5d4a"; c.fillRect(0, 0, w, h); c.fillStyle = "#4f8a6f"; [[w / 4, h / 4], [w * 3 / 4, h * 3 / 4]].forEach(p => { c.beginPath(); c.moveTo(p[0], p[1] - 26); c.quadraticCurveTo(p[0] + 22, p[1], p[0], p[1] + 26); c.quadraticCurveTo(p[0] - 22, p[1], p[0], p[1] - 26); c.fill(); }); },
      floral: (c, w, h) => { c.fillStyle = "#3d5a80"; c.fillRect(0, 0, w, h); c.fillStyle = "#9fc0e8"; [[w / 4, h / 4], [w * 3 / 4, h * 3 / 4]].forEach(p => { for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(p[0] + Math.cos(k * 1.05) * 12, p[1] + Math.sin(k * 1.05) * 12, 8, 0, 6.3); c.fill(); } c.fillStyle = "#f4d35e"; c.beginPath(); c.arc(p[0], p[1], 6, 0, 6.3); c.fill(); c.fillStyle = "#9fc0e8"; }); },
      blackgold: (c, w, h) => { c.fillStyle = "#17191c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c9a54a"; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(i * w / 4, 0); c.lineTo(i * w / 4 + w / 8, h / 2); c.lineTo(i * w / 4, h); c.stroke(); } }
    };
    const dmat = (kind, ru, rv) => { const t = new B.DynamicTexture("dz", { width: 128, height: 128 }, scene, true); DRAW[kind](t.getContext(), 128, 128); t.update(); t.uScale = ru; t.vScale = rv; t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE; const m = new B.StandardMaterial("dzm", scene); m.diffuseTexture = t; m.specularColor = new B.Color3(.08, .08, .08); return m; };
    function applyDeco(b, dc) {
      if (dc.f) b.floorM.material = dmat(dc.f, b.W / (dc.f === "wood" ? 3 : dc.f.indexOf("carpet") === 0 ? 4 : 2.2), b.D / (dc.f === "wood" ? 3 : dc.f.indexOf("carpet") === 0 ? 4 : 2.2));
      if (dc.w) b.walls.forEach(m => { const e = m.getBoundingInfo().boundingBox.extendSize; m.material = dmat(dc.w, Math.max(e.x, e.z) * 2 / 2.4, 1); });
    }
    function designer(u, b) {
      if (!st.keys[u.id]) return note("Only the tenant or owner can redecorate.");
      const cur = st.deco[u.id] || {};
      show(ttl("\uD83C\uDFA8 Interior designer") + "<small>Cash: GH\u00A2" + cash() + "</small><div style=\"margin:6px 0;color:#c9a54a;font-weight:700\">Floors, tiles and carpets</div>" +
        FLOOR_OPT.map(o => '<button data-f="' + o[0] + '" style="' + BS + '">' + o[1] + (cur.f === o[0] ? " \u00B7 current" : " \u00B7 GH\u00A2" + o[2]) + "</button>").join("") +
        "<div style=\"margin:6px 0;color:#c9a54a;font-weight:700\">Walls and wallpaper</div>" + WALL_OPT.map(o => '<button data-w="' + o[0] + '" style="' + BS + '">' + o[1] + (cur.w === o[0] ? " \u00B7 current" : " \u00B7 GH\u00A2" + o[2]) + "</button>").join("") + CLOSE, d => {
        if (d.x) return hide();
        const kind = d.f ? "f" : "w", key = d.f || d.w, o = (d.f ? FLOOR_OPT : WALL_OPT).find(x => x[0] === key);
        if ((st.deco[u.id] || {})[kind] === key) return note("Already installed.");
        if (cash() < o[2]) return note("Not enough cash. It costs GH\u00A2" + o[2]);
        pay(o[2], "Interior: " + o[1]); st.deco[u.id] = Object.assign(st.deco[u.id] || {}, { [kind]: key }); applyDeco(b, st.deco[u.id]); save(); note(o[1] + " installed.");
        designer(u, b);
      });
    }
    function build(u) {
      if (built[u.id]) return built[u.id];
      const T = TPL[u.tpl], s = u.sz || 1, n = Object.keys(built).length, sx = -285 + (n % 4) * 35, sz = -285 + Math.floor(n / 4) * 35, W = T.W * s, D = T.D * s, H = 3.2;
      const hsh = [...u.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
      const WALLS = ["#efe7d2", "#e8d9c0", "#dfe6ea", "#f0dcd0", "#e2e8d8"], FLOORS = ["#d8c9ad", "#cdb89a", "#c9d0d4", "#d6c2b4", "#bfc8b0"];
      const walls = [], wall = (x, z, w, d) => { const m = box(w, H, d, sx + x, H / 2, sz + z, WALLS[hsh % 5]); walls.push(m); return m; };
      wall(0, D / 2, W, .3); wall(-W / 2, 0, .3, D);
      const lux4 = u.tier === 4, gz = D / 4;
      if (lux4) { wall(W / 2, (-D / 2 + gz - 1.3) / 2, .3, gz - 1.3 + D / 2); wall(W / 2, (gz + 1.3 + D / 2) / 2, .3, D / 2 - gz - 1.3); }   // east wall with a 2.6 m door to the garage
      else wall(W / 2, 0, .3, D);
      const hw = W / 2 - .9; wall(-(W / 2 + .9) / 2, -D / 2, hw, .3); wall((W / 2 + .9) / 2, -D / 2, hw, .3);   // 1.8 m doorway
      T.p.forEach(p => wall(p[0] * s, p[1] * s, p[2] === .3 ? .3 : p[2] * s, p[3] === .3 ? .3 : p[3] * s));
      const floorM = box(W, .05, D, sx, .03, sz, FLOORS[(hsh >> 3) % 5], false);
      const F = T.f.map(f => [f[0] * s, f[1] * s, f[2], f[3], f[4]]);
      const nds = F.map(f => { K.collider(f[2], sx + f[0], sz + f[1], f[3], f[4] || 1); return item(f[2], sx + f[0], sz + f[1], f[3], false, f[4] || 1); });
      const here = p => Math.abs(p.x - sx) < W / 2 && Math.abs(p.z - sz) < D / 2;
      reg(F, sx, sz, here);
      points.push({ x: sx, z: sz - D / 2 + 1.1, r: 1.9, t: "\uD83D\uDEAA Leave", ok: () => !busy && !seated && here(player.position), f: leave });
      const bb = (built[u.id] = { sx, sz, D, W, walls, floorM });
      try { if (window.ACCRA_DECOR) window.ACCRA_DECOR.apply({ u, T: { p: T.p }, s, sx, sz, W, D, H, hsh, walls, floorM, nds, F, tier: u.tier || 1, box, mat, item, ITEMS: K.ITEMS }); }
      catch (e) { note("\u26A0 Interior style: " + e.message); }
      if (LUX.includes(u.tpl)) {
        if (st.deco[u.id]) applyDeco(bb, st.deco[u.id]);
        points.push({ x: sx + W / 2 - 1.3, z: sz - D / 2 + 2.2, r: 2.3, t: "\uD83C\uDFA8 Interior designer", ok: () => !busy && !seated && here(player.position), f: () => designer(u, bb) });
      }
      return bb;
    }
    function enter(u, door) {
      if (busy) return; const b = build(u);
      fade(700, () => { ret = door; inside = u.id; tp(b.sx, b.sz - b.D / 2 + 1.6); player.rotation.y = 0; }, () => note("Welcome to " + u.name));
    }
    function leave() { if (!inside) return; if (seated) stand(); fade(600, () => { const r = ret || { x: VX, z: VZ + 12 }; inside = null; tp(r.x, r.z); }); }

    // ---------- property listings: doors on real buildings ----------
    const WEEK = 600, UNITS = {}, LISTS = [], used = new Set();
    const bds = scene.meshes.filter(m => m.name === "bd" || m.name === "amh");
    const hOf = m => m.getBoundingInfo().boundingBox.extendSize.y * 2;
    const inBlock = (m, i, j) => m.position.x > R[i] && m.position.x < R[i + 1] && m.position.z > R[j] && m.position.z < R[j + 1];
    function pick(i, j, tall) {
      const c = bds.filter(m => !used.has(m) && inBlock(m, i, j));
      if (tall) c.sort((a, b) => hOf(b) - hOf(a));
      else c.sort((a, b) => Math.hypot(a.position.x - R[i] - 12, a.position.z - R[j] - 12) - Math.hypot(b.position.x - R[i] - 12, b.position.z - R[j] - 12));
      const m = c[0]; if (m) used.add(m); return m;
    }
    const nearestRoad = v => R.reduce((a, r) => Math.abs(v - r) < Math.abs(a) ? v - r : a, 1e9);
    function door(b, l1, l2, col) {
      const e = b.getBoundingInfo().boundingBox.extendSize, w = e.x * 2, d = e.z * 2, dx = nearestRoad(b.position.x), dz = nearestRoad(b.position.z);
      let ox = 0, oz = 0, half;
      if (Math.abs(dz) <= Math.abs(dx)) { oz = -Math.sign(dz) || 1; half = d / 2; } else { ox = -Math.sign(dx) || 1; half = w / 2; }
      const gate = b.metadata && b.metadata.gate;
      if (gate) { ox = b.metadata.n[0]; oz = b.metadata.n[1]; half = Math.abs(oz) ? d / 2 : w / 2; }
      else { const dm = B.MeshBuilder.CreateBox("dr", { width: ox ? .3 : 2.2, height: 3.2, depth: oz ? .3 : 2.2 }, scene);
        dm.position.set(b.position.x + ox * (half + .15), 1.6, b.position.z + oz * (half + .15)); dm.material = mat(col); dm.isPickable = false; }
      const dt = new B.DynamicTexture("ds", { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#c9a54a"; c.font = "bold 40px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(l1, 256, 40, 490);
      c.fillStyle = "#ffffff"; c.font = "bold 28px system-ui"; c.fillText(l2, 256, 92, 490); dt.update();
      const sn = B.MeshBuilder.CreatePlane("dsn", { width: 7, height: 1.75 }, scene);
      if (gate) sn.position.set(gate[0], 2.6, gate[1]); else sn.position.set(b.position.x + ox * (half + .2), 4.9, b.position.z + oz * (half + .2));
      sn.rotation.y = Math.atan2(-ox, -oz); sn.isPickable = false; if (gate) sn.scaling.set(.7, .7, 1);
      const mt = new B.StandardMaterial("dsm", scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false; sn.material = mt;
      return { x: b.position.x + ox * (half + 2.4), z: b.position.z + oz * (half + 2.4) };
    }
    const BEDS = { room: "1 room", hall: "chamber & hall", studio: "studio", apt1: "1 bed", house: "2 bed", mansion: "3 bed" };
    const RATE = { "Airport City": 165, Osu: 150, Makola: 62, "Central Accra": 105, Labadi: 140, "East Legon": 210, "Amoamah Estate": 135 };   // GH¢ per m²
    const SZ = { osu1: 1, osu2: 1.05, mak1: .9, mak2: .95, cen1: 1, lab1: 1.2, eln1: 1.35, elm1: 1.25, amo1: 1, amo2: 1.12, amo3: 1.3 };
    function mkUnit(id, name, dist, tpl, sz) {   // price follows the real floor area, the district and the quality
      const T = TPL[tpl], area = Math.round(T.W * T.D * sz * sz), q = tpl === "mansion" ? 1.4 : tpl === "house" ? 1.1 : 1;
      const buy = Math.round(area * RATE[dist] * q / 50) * 50, rent = Math.max(20, Math.round(buy / 160 / 5) * 5);
      const tier = tpl === "mansion" ? 4 : buy < 6000 ? 1 : buy < 22000 ? 2 : 3;   // 1 Basic, 2 Comfort, 3 Premium, 4 Luxury
      return { id, name, tpl, dist, sz, area, buy, rent, tier };
    }
    const TU = [["studio", "Studio apartment", "studio", 80, 8000], ["1bed", "1-bedroom apartment", "apt1", 140, 14000], ["2bed", "2-bedroom apartment", "house", 220, 24000], ["pent", "Penthouse", "mansion", 500, 80000]];
    ["Airport Heights", "Kotoka Residence", "Skyline Towers", "Runway View"].forEach((nm, n) => {
      const b = pick(n < 2 ? 0 : 1, 0, true); if (!b) return;
      const units = TU.map(t => (UNITS["T" + n + t[0]] = mkUnit("T" + n + t[0], nm + " \u00B7 " + t[1], "Airport City", t[2], 1 + .08 * n + (t[2] === "mansion" ? .05 : 0))));
      LISTS.push({ name: nm + " \u2014 Apartments", units, door: door(b, nm, "Apartments \u00B7 studio to penthouse", "#c9a54a") });
    });
    [["osu1", "Osu 1-bed apartment", "Osu", 0, 1, "apt1", 150, 14000], ["osu2", "Osu 2-bed flat", "Osu", 0, 2, "house", 230, 24000], ["mak1", "Makola single room", "Makola", 1, 1, "room", 35, 2500],
     ["mak2", "Makola chamber & hall", "Makola", 1, 2, "hall", 60, 5000], ["cen1", "Central Accra studio", "Central Accra", 2, 3, "studio", 90, 8000], ["lab1", "Labadi beach house", "Labadi", 1, 3, "house", 320, 38000],
     ["eln1", "East Legon 4-bed house", "East Legon", 2, 0, "house", 380, 52000], ["elm1", "East Legon mansion", "East Legon", 3, 0, "mansion", 650, 120000], ["amo1", "Amoamah family house", "Amoamah Estate", 3, 1, "house", 200, 26000], ["amo2", "Amoamah garden house", "Amoamah Estate", 3, 1, "house", 240, 32000], ["amo3", "Amoamah poolside house", "Amoamah Estate", 3, 1, "mansion", 300, 42000]].forEach(h => {
      const b = pick(h[3], h[4], false); if (!b) return;
      const u = UNITS[h[0]] = mkUnit(h[0], h[1], h[2], h[5], SZ[h[0]] || 1);
      LISTS.push({ name: h[1], units: [u], gar: b.metadata && b.metadata.garage, door: door(b, h[1], u.area + " m\u00B2 \u00B7 Rent GH\u00A2" + u.rent + "/wk \u00B7 Buy GH\u00A2" + u.buy.toLocaleString(), "#2a7ab8") });
    });
    // ---- ownership + marketplace: owners can list their homes for sale or rent; everyone sees the listings ----
    const ME = localStorage.getItem("accra-name") || "You";
    const mk = ls("accra-market", {});
    const saveMk = () => sv("accra-market", mk);
    const NET = () => (AV.net ? AV.net() : null);
    const bcast = () => { const n = NET(); if (n) n.emit("propMarket", mk); };
    { const n = NET(); if (n) { n.on("propMarket", d => { Object.keys(d || {}).forEach(id => { if (d[id] && d[id].owner !== ME) mk[id] = d[id]; }); saveMk(); }); n.on("adminGift", d => { earn(d.amount, "Gift from admin"); note("Admin sent you GH\u00A2" + d.amount); }); } }
    const priceOf = u => { const m = mk[u.id]; return { buy: m && m.mode === "sale" ? m.price : u.buy, rent: m && m.mode === "rent" ? m.price : u.rent }; };
    const TIERN = ["", "Basic finish", "Comfort finish", "Premium finish", "Luxury finish"];
    function unitRow(u, atDoor) {
      const k = st.keys[u.id], m = mk[u.id], p = priceOf(u), sale = m && m.mode === "sale", rl = m && m.mode === "rent";
      let status = "Available now", col = "#c9d1d9";
      if (k && k.t === "own") { status = "You own this" + (m ? " \u00B7 listed for " + (sale ? "sale" : "rent") + " GH\u00A2" + m.price.toLocaleString() : ""); col = "#69f0ae"; }
      else if (k) { status = "You rent this"; col = "#69f0ae"; }
      else if (m) { status = (m.owner === ME ? "Your listing" : "Listed by " + m.owner) + " \u00B7 " + (sale ? "FOR SALE" : "FOR RENT"); col = "#ffd24a"; }
      return '<div style="margin:6px 0;padding:7px;background:rgba(255,255,255,.1);border-radius:10px"><b>' + u.name + '</b> <span style="color:#c9a54a">' + "\u2605".repeat(u.tier || 1) + "</span><br><small>" + TIERN[u.tier || 1] + " \u00B7 " + u.dist + " \u00B7 " + u.area + " m\u00B2 \u00B7 " + BEDS[u.tpl] + " \u00B7 rent GH\u00A2" + p.rent + "/wk \u00B7 buy GH\u00A2" + p.buy.toLocaleString() + '</small><br><small style="color:' + col + '">' + status + "</small><br>" +
        (!k && !sale ? '<button data-r="' + u.id + '" style="' + SB + '">Rent</button>' : "") + (!(k && k.t === "own") && !rl ? '<button data-b="' + u.id + '" style="' + SB + '">Buy</button>' : "") +
        (k && atDoor ? '<button data-e="' + u.id + '" style="' + SB + '">Enter</button>' : "") + "</div>";
    }
    const propClick = (redraw, door) => d => {
      if (d.x) return hide();
      const id = d.r || d.b || d.e, u = UNITS[id]; if (!u) return;
      if (d.e) { hide(); return enter(u, door); }
      const p = priceOf(u), m = mk[id];
      if (d.r) { if (cash() < p.rent) return note("Not enough cash. First week costs GH\u00A2" + p.rent); pay(p.rent, "Rent: " + u.name); st.keys[id] = { t: "rent", due: st.play + WEEK }; note("Rented! Rent is charged every 10 minutes of play."); }
      else { if (cash() < p.buy) return note("Not enough cash. Price GH\u00A2" + p.buy.toLocaleString()); pay(p.buy, "Bought: " + u.name); st.keys[id] = { t: "own" }; if (m && m.mode === "sale") { delete mk[id]; saveMk(); bcast(); } note("Congratulations, you own " + u.name + "!"); }
      save(); redraw();
    };
    function myHomes() {
      const draw = () => show(ttl("My homes") + (Object.keys(st.keys).filter(id => UNITS[id]).map(id => {
        const k = st.keys[id], u = UNITS[id], m = mk[id];
        return '<div style="margin:6px 0;padding:7px;background:rgba(255,255,255,.1);border-radius:10px"><b>' + u.name + "</b><br><small>" +
          (k.t === "own" ? (m ? "Owned \u00B7 listed for " + (m.mode === "sale" ? "sale" : "rent") + " GH\u00A2" + m.price.toLocaleString() : "Owned") : "Rent GH\u00A2" + u.rent + "/wk \u00B7 next payment in " + Math.max(0, Math.ceil((k.due - st.play) / 60)) + " min") + "</small><br>" +
          (k.t === "own" ? (m ? '<button data-lx="' + id + '" style="' + SB + '">Remove listing</button>' : '<button data-ls="' + id + '" style="' + SB + '">List for sale</button><button data-lr="' + id + '" style="' + SB + '">List for rent</button>') : '<button data-mo="' + id + '" style="' + SB + '">Move out</button>') + '<button data-en="' + id + '" style="' + SB + '">\uD83D\uDD11 Enter</button></div>';
      }).join("") || '<div style="padding:6px 0">You do not rent or own any extra homes yet. Your villa is yours already.</div>') + CLOSE, d => {
        if (d.x) return hide();
        const id = d.ls || d.lr || d.lx || d.mo || d.en, u = UNITS[id]; if (!u) return;
        if (d.en) { const li = LISTS.find(q => q.units.some(y => y.id === id)); hide(); return enter(u, li ? li.door : null); }
        if (d.ls) { const v = Math.round(+prompt("Asking price in GH\u00A2", u.buy)); if (!(v > 0)) return; mk[id] = { owner: ME, mode: "sale", price: v }; }
        else if (d.lr) { const v = Math.round(+prompt("Weekly rent in GH\u00A2", u.rent)); if (!(v > 0)) return; mk[id] = { owner: ME, mode: "rent", price: v }; }
        else if (d.lx) delete mk[id];
        else if (d.mo) { delete st.keys[id]; if (inside === id) leave(); }
        saveMk(); bcast(); draw();
      });
      draw();
    }
    function listing(l, door) { const draw = () => show(ttl(l.name) + "<small>Cash: GH\u00A2" + cash() + "</small>" + l.units.map(u => unitRow(u, true)).join("") + CLOSE, propClick(draw, door)); draw(); }
    function allListings() { const draw = () => show(ttl("Property listings") + "<small>Rent or buy online, then go to the building's door to enter.</small>" + Object.values(UNITS).map(u => unitRow(u, false)).join("") + CLOSE, propClick(draw, null)); draw(); }
    LISTS.forEach(l => points.push({ x: l.door.x, z: l.door.z, r: 3.4, t: () => l.units.some(u => st.keys[u.id]) ? "\uD83D\uDD11 " + l.name : "\uD83C\uDFE0 View, rent or buy", ok: () => !busy && !seated, f: () => listing(l, l.door) }));

    // ---------- rent, vitals, saving ----------
    function rentCheck() {
      Object.keys(st.keys).forEach(id => {
        const k = st.keys[id], u = UNITS[id]; if (!u || k.t !== "rent" || st.play < k.due) return;
        if (cash() >= u.rent) { pay(u.rent, "Rent: " + u.name); k.due += WEEK; note("Rent paid: " + u.name + " GH\u00A2" + u.rent); notify("Rent paid for " + u.name + ": GH\u20B5" + u.rent, "msg"); }
        else { delete st.keys[id]; note("Evicted from " + u.name + " (rent unpaid)"); notify("You were evicted from " + u.name + " because rent was unpaid.", "msg"); if (inside === id) leave(); }
      });
    }
    function passOut() {
      st.hp = 30; st.hu = Math.max(st.hu, 40); st.en = Math.max(st.en, 40);
      const fine = Math.min(50, Math.floor(cash() * .1)); if (fine) pay(fine, "Hospital bill");
      if (seated) stand(); AV.pose = null;
      const HP = window.ACCRA_PLACES && window.ACCRA_PLACES.hp;
      fade(800, () => { inside = null; if (HP) tp(HP.ox, HP.oz); else tp(VX, VZ + 12); }, () => note("You passed out and woke up " + (HP ? "at Accra Hospital" : "at home") + ". Bill GH\u00A2" + fine));
    }
    const W = {};
    let lx = player.position.x, lz = player.position.z, acc = 0, saveT = 0, rentT = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .1);
      const mv = Math.hypot(player.position.x - lx, player.position.z - lz) / Math.max(dt, .001); lx = player.position.x; lz = player.position.z;
      st.play += dt;
      st.hu = clamp(st.hu - dt * .035); st.hy = clamp(st.hy - dt * .012);
      st.en = clamp(st.en - dt * (.012 + (driving || mv > 40 ? 0 : mv * .0045)));
      if (seated) { if (AV.pose === "dance") { st.en = clamp(st.en - dt * .25); st.md = clamp(st.md + dt * .5); } else { st.en = clamp(st.en + dt * .6); st.md = clamp(st.md + dt * .15); } }
      if (SP.on && mv > 3 && !seated) st.en = clamp(st.en - dt * .12);
      if (st.drunk > 0) st.drunk = Math.max(0, st.drunk - dt * .02);
      { const Wt = window.ACCRA_WATER, sw = !!(Wt && !driving && !inside && !seated && Wt.contains(player.position));
        if (sw !== swimming) { swimming = sw; if (sw && !AV.pose) AV.pose = "swim"; else if (!sw && AV.pose === "swim") AV.pose = null; }
        if (swimming) { st.en = clamp(st.en - dt * .08); st.hy = clamp(st.hy + dt * .6); } }
      const bad = st.hu < 8 || st.en < 4;
      st.hp = clamp(st.hp + dt * (bad ? -.25 : (st.hu > 40 && st.en > 25 ? .04 : 0)));
      if (st.hu < 20 || st.hy < 20) st.md = clamp(st.md - dt * .05); else st.md = clamp(st.md + (60 - st.md) * dt * .002);
      if (st.hp <= 0 && !busy) passOut();
      if (st.hu < 20 && !W.hu) { W.hu = 1; notify("You are very hungry. Eat something.", "msg"); } else if (st.hu > 35) W.hu = 0;
      if (st.en < 15 && !W.en) { W.en = 1; notify("You are exhausted. Find a bed or a sofa to rest.", "msg"); } else if (st.en > 35) W.en = 0;
      if (st.hp < 30 && !W.hp) { W.hp = 1; notify("Your health is low. Visit Accra Hospital.", "msg"); } else if (st.hp > 50) W.hp = 0;
      acc += dt; if (acc > .5) { acc = 0; paintHud(); }
      saveT += dt; if (saveT > 2) { saveT = 0; save(); }
      rentT += dt; if (rentT > 2) { rentT = 0; rentCheck(); }
      { const p = player.position, PLs = window.ACCRA_PLACES || {}, d = PLs.dealer, ind = !!inside ||
          (Math.abs(p.x - 35) < 21 && Math.abs(p.z - 35) < 19) || (Math.abs(p.x - VX) < 14 && Math.abs(p.z - VZ) < 10) ||
          (Math.abs(p.x - 35) < 16 && Math.abs(p.z - 98) < 10) || (Math.abs(p.x - 110) < 23 && Math.abs(p.z - 98) < 13) ||
          (Math.abs(p.x + 110) < 18 && Math.abs(p.z + 41) < 10) || (d && Math.abs(p.x - d.x) < 16 && Math.abs(p.z - d.z) < 12);
        cam.checkCollisions = !ind;                       // walls no longer squeeze the camera in
        if (ind && cam.radius < 8) cam.radius += (9 - cam.radius) * .12; }
    });
    // ---------- Hospital (HP), Police (PD), car dealership, garages and driving jobs ----------
    const PL = window.ACCRA_PLACES || {};
    let freeAt = 0;
    function hospital() {
      show(ttl("\uD83C\uDFE5 Accra Hospital") + "<small>Health " + Math.round(st.hp) + "% \u00B7 Cash GH\u00A2" + cash() + "</small>" +
        '<button data-h="30" style="' + BS + '">Check-up \u00B7 GH\u00A230 \u00B7 +40 health</button><button data-h="80" style="' + BS + '">Full treatment \u00B7 GH\u00A280 \u00B7 full health, +25 energy</button><button data-h="0" style="' + BS + '">Emergency care (free if you cannot pay)</button><button data-amb="1" style="' + BS + '">\uD83D\uDE91 Ambulance duty \u00B7 drive an emergency call \u00B7 +GH\u00A2120</button>' + CLOSE, d => {
        if (d.x) return hide();
        if (d.amb) return startJob(ambulanceJob());
        const f = +d.h;
        if (f === 0) { if (cash() >= 30) return note("Free care is only for people who cannot pay."); if (st.play < freeAt) return note("Please wait a few minutes before free care again."); freeAt = st.play + 180; st.hp = clamp(st.hp + 25); return note("A nurse treated you. +25 health"); }
        if (cash() < f) return note("Not enough cash.");
        pay(f, "Hospital"); if (f === 30) st.hp = clamp(st.hp + 40); else { st.hp = 100; st.en = clamp(st.en + 25); }
        note("Treated. Health " + Math.round(st.hp) + "%"); hospital();
      });
    }
    const TIPS = ["Keep your phone safe in busy markets like Makola.", "Always lock your door when you leave home.", "Do not drive when you are exhausted.", "Eat and rest: low health makes you pass out."];
    function police() {
      show(ttl("\uD83D\uDE93 Police Department") + '<button data-j="patrol" style="' + BS + '">\uD83D\uDE94 Patrol: drive the police car \u00B7 +GH\u00A2140</button><button data-j="comm" style="' + BS + '">Community service \u00B7 +GH\u00A245 \u00B7 uses 12 energy</button><button data-j="tip" style="' + BS + '">Safety tip</button>' + CLOSE, d => {
        if (d.x) return hide();
        if (d.j === "tip") return note(TIPS[Math.floor(Math.random() * TIPS.length)]);
        if (d.j === "patrol") return startJob(patrolJob());
        if (st.en < 12) return note("Too tired for this shift."); if (st.hu < 10) return note("Eat something first.");
        hide(); busy = true; note("Community service\u2026");
        setTimeout(() => { earn(45, "Community service"); st.en = clamp(st.en - 12); st.hu = clamp(st.hu - 8); st.md = clamp(st.md + 3); busy = false; note("Shift done. +GH\u00A245"); save(); }, 4000);
      });
    }
    // ---- driving jobs: you take the police car or ambulance out and drive to the gold beams ----
    let job = null, savedPaint = null, flash = 0;
    const lightBar = [[-.3, "#ff1a1a"], [.3, "#1a4bff"]].map(o => {
      const m = B.MeshBuilder.CreateBox("lb", { width: .4, height: .12, depth: .3 }, scene); m.parent = car; m.position.set(o[0], 1.22, -.25);
      const mt = new B.StandardMaterial("lbm", scene); mt.emissiveColor = B.Color3.FromHexString(o[1]); mt.disableLighting = true; m.material = mt; m.isPickable = false; m.setEnabled(false); return m;
    });
    const beam = B.MeshBuilder.CreateCylinder("jobbeam", { height: 60, diameter: 3 }, scene);
    { const mt = new B.StandardMaterial("jbm", scene); mt.emissiveColor = B.Color3.FromHexString("#c9a54a"); mt.disableLighting = true; mt.alpha = .35; mt.fogEnabled = false; beam.material = mt; beam.isPickable = false; beam.setEnabled(false); }
    function endJob(ok) {
      if (!job) return; const j = job; job = null; beam.setEnabled(false); lightBar.forEach(l => l.setEnabled(false)); if (savedPaint) carPaint.diffuseColor = savedPaint;
      if (ok) { earn(j.pay, j.title); st.en = clamp(st.en - j.cost); st.hu = clamp(st.hu - 8); st.md = clamp(st.md + 4); note(j.title + " complete! +GH\u00A2" + j.pay); } else note(j.title + " cancelled");
      save();
    }
    function startJob(j) {
      if (job) return note("Finish your current job first."); if (st.en < j.cost) return note("Too tired. Rest first."); if (st.hu < 10) return note("Eat something first.");
      hide(); job = Object.assign({ i: 0, t0: st.play }, j); savedPaint = carPaint.diffuseColor.clone();
      if (driving) toggleCar();
      car.position.set(j.depot.x, .8, j.depot.z); heading = j.depot.h; car.rotation.y = heading;
      player.position.set(j.depot.x + 2.8, .91, j.depot.z); toggleCar();
      carPaint.diffuseColor = B.Color3.FromHexString(j.paint); lightBar.forEach(l => l.setEnabled(true));
      beam.setEnabled(true); beam.position.set(j.stops[0].x, 30, j.stops[0].z); note(j.title + ": " + j.stops[0].say);
    }
    const inter = () => ({ x: R[Math.floor(Math.random() * 5)], z: R[Math.floor(Math.random() * 5)] });
    const patrolJob = () => { const stops = []; for (let i = 0; i < 4; i++) { const p = inter(); stops.push({ x: p.x, z: p.z, say: "Checkpoint " + (i + 1) + " of 4: drive to the gold beam" }); } return { title: "Police patrol", paint: "#1d3b6b", pay: 140, cost: 25, depot: PL.pd.depot, stops }; };
    const ambulanceJob = () => { const p = inter(); return { title: "Ambulance call", paint: "#f0f0f0", pay: 120, cost: 20, depot: PL.hp.depot, stops: [{ x: p.x, z: p.z, say: "A patient is waiting at the gold beam" }, { x: PL.hp.ox, z: PL.hp.oz, say: "Take the patient to the hospital" }] }; };
    scene.onBeforeRenderObservable.add(() => {
      if (!job) return;
      flash += engine.getDeltaTime(); const on = Math.floor(flash / 250) % 2; lightBar[0].setEnabled(!!on); lightBar[1].setEnabled(!on);
      if (!driving) { if (st.play - job.t0 > 3) endJob(false); return; }
      const s = job.stops[job.i];
      if (Math.hypot(car.position.x - s.x, car.position.z - s.z) < 12) { job.i++; if (job.i >= job.stops.length) return endJob(true); const n = job.stops[job.i]; beam.position.set(n.x, 30, n.z); note(n.say); }
    });
    // ---- cars: dealership + personal garages ----
    const CARS = [["starter", "Starter hatch", 0, "#a3172b"], ["hatch", "City hatch", 8000, "#f2f2f2"], ["sedan", "Osu sedan", 15000, "#b8bcc2"], ["legon", "Legon sedan", 22000, "#1f4fa3"], ["suv", "Labadi SUV", 35000, "#17191c"], ["coupe", "Sport coupe", 80000, "#d11a2a"], ["super", "Supercar", 250000, "#f2c200"]];
    st.cars = st.cars || ["starter"]; st.car = st.car || "starter";
    const paintCar = id => { const c = CARS.find(x => x[0] === id); if (c) carPaint.diffuseColor = B.Color3.FromHexString(c[3]); };
    paintCar(st.car);
    function garage(g) {
      const draw = () => show(ttl("\uD83D\uDE97 My garage") + st.cars.map(id => { const c = CARS.find(x => x[0] === id); return '<button data-c="' + id + '" style="' + BS + '">' + c[1] + (st.car === id ? " \u00B7 current" : "") + " \u00B7 take out</button>"; }).join("") + CLOSE, d => {
        if (d.x) return hide(); if (!d.c || job) return note("Finish your job first.");
        st.car = d.c; paintCar(d.c); if (driving) toggleCar(); car.position.set(g.x, .8, g.z); heading = g.h; car.rotation.y = heading; save(); hide(); note("Your " + CARS.find(x => x[0] === d.c)[1] + " is ready outside.");
      });
      draw();
    }
    function dealer() {
      const draw = () => show(ttl("\uD83D\uDE98 Accra Motors") + "<small>Cash: GH\u00A2" + cash() + " \u00B7 new cars go to your garage</small>" + CARS.filter(c => c[2] > 0).map(c => '<button data-c="' + c[0] + '" style="' + BS + '">' + c[1] + " \u00B7 GH\u00A2" + c[2].toLocaleString() + (st.cars.includes(c[0]) ? " \u00B7 owned" : "") + "</button>").join("") + CLOSE, d => {
        if (d.x) return hide(); const c = CARS.find(x => x[0] === d.c); if (!c) return;
        if (st.cars.includes(c[0])) return note("You already own this car.");
        if (cash() < c[2]) return note("Not enough cash. You need GH\u00A2" + c[2].toLocaleString());
        pay(c[2], "Car: " + c[1]); st.cars.push(c[0]); save(); note(c[1] + " is yours! Collect it from your garage."); draw();
      });
      draw();
    }
    const A2 = (x, z, r, t, fn) => points.push({ x, z, r, t, f: fn, ok: () => !busy && !seated });
    if (PL.hp) A2(PL.hp.x, PL.hp.z, 3.2, "\uD83C\uDFE5 Hospital desk", hospital);
    if (PL.pd) A2(PL.pd.x, PL.pd.z, 3.2, "\uD83D\uDE93 Police desk", police);
    if (PL.dealer) A2(PL.dealer.x, PL.dealer.z, 3.6, "\uD83D\uDE98 Car dealer", dealer);
    A2(VX, VZ + 8.3, 3, "\uD83D\uDE97 My garage", () => garage({ x: VX, z: VZ + 14, h: 0 }));
    LISTS.forEach(l => { if (l.gar) points.push({ x: l.gar.x, z: l.gar.z, r: 3.8, t: "\uD83D\uDE97 My garage", ok: () => !busy && !seated && l.units.some(u => st.keys[u.id]), f: () => garage({ x: l.gar.x, z: l.gar.z, h: l.gar.h }) }); });
    window.ACCRA_SHOP = () => kiosk(true);
    window.ACCRA_LIFE = {
      food: FOOD, stock: () => st.food,
      buy: (k, online) => { const g = FOOD[k]; if (!g) return "Unknown item"; const c = online ? Math.ceil(g[1] * 1.1) : g[1]; if (cash() < c) return "Not enough cash (need GH\u20B5" + c + ")"; pay(c, "JOLLY MART: " + g[0]); st.food[k] = (st.food[k] || 0) + 1; save(); return "ok"; },
      rents: () => Object.keys(st.keys).filter(id => UNITS[id] && st.keys[id].t === "rent").map(id => ({ name: UNITS[id].name, rent: UNITS[id].rent, mins: Math.max(0, Math.ceil((st.keys[id].due - st.play) / 60)) }))
    };
    // plugin API used by accra-pub.js, accra-crime.js and accra-fx.js
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).life = 1;
    window.ACCRA_LIFE.api = {
      st, clamp, cash, pay, earn, save, notify, fade, tp, show, hide, ttl, BS, GOLD, SB, CLOSE, note, sit, stand, points, K, AV,
      get busy() { return busy; }, set busy(v) { busy = v; }, get seated() { return seated; }, get inside() { return inside; }, get driving() { return driving; },
      homes: () => Object.keys(st.keys).filter(id => UNITS[id]).map(id => ({ name: UNITS[id].name, own: st.keys[id].t === "own", rent: UNITS[id].rent, mins: Math.max(0, Math.ceil((st.keys[id].due - st.play) / 60)) })), leaveHome: () => leave(), vitals: d => { Object.keys(d).forEach(k => { if (k in st) st[k] = clamp(st[k] + d[k]); }); save(); }
    };
    ["accra-decor.js", "accra-crime.js", "accra-pub.js", "accra-fx.js", "accra-mining.js", "accra-world.js", "accra-weather.js", "accra-profile.js", "accra-carskin.js", "accra-model.js"].forEach(f => { const s = document.createElement("script"); s.src = f + "?v=" + (window.ACCRA_BUILD || 0); s.onerror = () => note("\u26A0 " + f + " was not found. Upload it to your repo."); document.body.appendChild(s); });

    // ---------- admin (tap the "ACCRA LIFE" label 5 times) ----------
    const ADMIN_CODE = "ACCRA-ADMIN-2026";   // change this. It only protects this device: online gifts must also be checked by the server.
    const TELE = { mall: [35, 12], stadium: [110, 12], hospital: [110, 80], police: [35, 80], villa: [VX, VZ + 12], airport: [-60, -66],
      "Labadi beach": [-90, 190], "Amoamah estate": [110, -30], "Car dealership": [35, -35], "Gold works": [196, 120], "Stone quarry": [190, -150],
      "Accra North (highway)": [-60, -180], "Nsawam": [-120, -3470], "Suhum": [-120, -6470], "Nkawkaw": [-120, -12970], "Konongo": [-120, -18970], "Ejisu": [-760, -22470], "Kumasi (Kejetia)": [-820, -24470] };
    function adminPanel() {
      show(ttl("\uD83D\uDD27 Admin") + "<small>Play-money and test tools</small>" + [500, 5000, 50000, 500000].map(a => '<button data-m="' + a + '" style="' + BS + '">Give myself GH\u00A2' + a.toLocaleString() + "</button>").join("") +
        '<button data-p="1" style="' + BS + '">Give play money to an online player\u2026</button><button data-v="1" style="' + BS + '">Refill my health, energy, hunger</button>' +
        '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">Weather</div>' + ["sunny", "cloudy", "rain", "storm", "haze"].map(w => '<button data-w="' + w + '" style="' + BS + '">Set: ' + w + "</button>").join("") + '<button data-w="auto" style="' + BS + '">Back to automatic weather</button>' +
        '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">Transit and places</div>' + Object.keys(TELE).map(t => '<button data-t="' + t + '" style="' + BS + '">Go to: ' + t + "</button>").join("") +
        '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">Test tools</div><button data-r="1" style="' + BS + '">Clear my wanted level</button>' + CLOSE, d => {
        if (d.x) return hide();
        if (d.m) { earn(+d.m, "Admin grant"); note("You received GH\u00A2" + (+d.m).toLocaleString()); }
        else if (d.v) { st.hp = st.en = st.hu = st.hy = st.md = 100; note("Refilled"); }
        else if (d.t) { hide(); tp(TELE[d.t][0], TELE[d.t][1]); }
        else if (d.w) { if (window.ACCRA_WEATHER) { if (d.w === "auto") window.ACCRA_WEATHER.auto(); else window.ACCRA_WEATHER.set(d.w); } note(d.w === "auto" ? "Weather is automatic again" : "Weather set to " + d.w); }
        else if (d.r) { if (window.ACCRA_CRIME) window.ACCRA_CRIME.setWanted(0); note("Wanted level cleared"); }
        else if (d.p) { const to = prompt("Player name"), amount = Math.round(+prompt("Amount in GH\u00A2")), n = NET(); if (!to || !(amount > 0)) return; if (!n) return note("Not online: no server connection."); n.emit("adminGive", { to, amount, code: ADMIN_CODE }); note("Request sent. The server must support adminGive."); }
      });
    }
    { const pill = document.querySelector(".pill"); let taps = 0, tt = 0;
      if (pill) pill.addEventListener("click", () => { const t = Date.now(); taps = t - tt < 900 ? taps + 1 : 1; tt = t; if (taps >= 5) { taps = 0; if (prompt("Admin code") === ADMIN_CODE) { adminPanel(); K.keep(); } else note("Wrong code"); } }); }

    // ---------- command bar: tap the "/" button (or press the / key) and type a command ----------
    let isAdmin = false;
    const cmdBox = document.createElement("div");
    cmdBox.style.cssText = "position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);transform:translateX(-50%);width:min(72vw,380px);display:none;gap:6px;z-index:70;background:rgba(28,30,33,.95);border:2px solid #c9a54a;border-radius:14px;padding:8px";
    const cmdIn = document.createElement("input"), cmdGo = document.createElement("button"), cmdOpen = document.createElement("button");
    cmdIn.placeholder = "Type a command, e.g. /help"; cmdIn.autocomplete = "off"; cmdIn.autocapitalize = "off"; cmdIn.spellcheck = false;
    cmdIn.style.cssText = "flex:1;min-width:0;border:0;border-radius:10px;padding:9px 10px;font:16px system-ui;background:#fff;color:#111";
    cmdGo.textContent = "Go"; cmdGo.style.cssText = "border:0;border-radius:10px;background:#c9a54a;color:#17191c;font:800 14px system-ui;padding:0 14px";
    cmdOpen.textContent = "/"; cmdOpen.style.cssText = "position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 134px);width:34px;height:30px;border:0;border-radius:10px;background:rgba(28,30,33,.72);color:#c9a54a;font:800 18px system-ui;z-index:5";
    cmdBox.appendChild(cmdIn); cmdBox.appendChild(cmdGo); document.body.appendChild(cmdBox); document.body.appendChild(cmdOpen);
    const openCmd = () => { cmdBox.style.display = "flex"; cmdIn.value = "/"; cmdIn.focus(); };
    const closeCmd = () => { cmdBox.style.display = "none"; cmdIn.blur(); };
    function bag() {
      const ks = Object.keys(st.inv).filter(k => st.inv[k] > 0), fr = Object.values(window.playerInventory.fridgeItems).reduce((a, b) => a + b, 0);
      show(ttl("\uD83C\uDF92 Bag") + (ks.length ? ks.map(k => '<button data-d="' + k + '" style="' + BS + '">Dump ' + k + " \u00D7 " + st.inv[k] + " (illegal)</button>").join("") : '<div style="padding:6px 0">Nothing illegal in your bag.</div>') + '<div style="opacity:.7;padding:4px 0">Fridge items: ' + fr + "</div>" + CLOSE, d => { if (d.x) return hide(); if (d.d) { delete st.inv[d.d]; save(); note("You dumped it."); bag(); } });
    }
    function runCmd(raw) {
      const parts = raw.trim().replace(/^\//, "").split(/\s+/), k = (parts[0] || "").toUpperCase();
      if (k === ADMIN_CODE.toUpperCase()) { isAdmin = true; closeCmd(); adminPanel(); return K.keep(); }
      if (k === "HOMES") { closeCmd(); myHomes(); return K.keep(); }
      if (k === "LISTINGS") { closeCmd(); allListings(); return K.keep(); }
      if (k === "GIVE" && isAdmin && /^[a-z]/i.test(parts[1] || "")) { const it = parts[1].toLowerCase(), n = Math.max(1, Math.round(+parts[2] || 1)); if (it === "weed" || it === "cocaine") { st.inv[it] = (st.inv[it] || 0) + n; save(); closeCmd(); return note("Added " + n + " " + it + " to your bag. It is illegal: police will search for it."); } return note("Items: weed, cocaine (test items)"); }
      if (k === "WANTED" && isAdmin) { if (window.ACCRA_CRIME) window.ACCRA_CRIME.setWanted(Math.max(0, Math.min(5, Math.round(+parts[1] || 0)))); closeCmd(); return; }
      if (k === "BAG") { closeCmd(); return bag(); }
      if (k === "GIVE" && isAdmin) { const a = Math.round(+parts[1]); if (!(a > 0)) return note("Use /give 5000"); earn(a, "Admin grant"); closeCmd(); return note("You received GH\u00A2" + a.toLocaleString()); }
      if (k === "VIP") { const v = window.ACCRA_VIP; return note(v ? "VIP state: " + v.state + " \u00B7 " + Math.max(0, Math.ceil(((st.vip || 0) - st.play) / 60)) + " min left \u00B7 " + v.log.slice(-3).join(", ") : "VIP module not loaded"); }
      if (k === "HELP") return note("/homes  /listings  /bag  /help" + (isAdmin ? "  /give 5000  /give weed 2  /wanted 3" : ""));
      note("Unknown command. Try /help");
    }
    cmdOpen.onclick = () => (cmdBox.style.display === "flex" ? closeCmd() : openCmd());
    cmdGo.onclick = () => runCmd(cmdIn.value);
    cmdIn.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") runCmd(cmdIn.value); if (e.key === "Escape") closeCmd(); });
    window.addEventListener("keydown", e => { if (e.key === "/" && cmdBox.style.display !== "flex") { e.preventDefault(); openCmd(); } });

    window.addEventListener("pagehide", save); document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
    console.log("Accra life loaded:", LISTS.length, "property doors");
    note("Life systems on \u2014 watch your health, energy and hunger");
  } catch (err) { console.error("accra-life failed (game still runs):", err); try { K0 && K0.note("\u26A0 Life: " + err.message); } catch (e) {} }
})();
