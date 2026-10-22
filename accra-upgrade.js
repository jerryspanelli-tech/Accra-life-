/* accra-upgrade.js — loads AFTER the game script and upgrades the look.
 * It does not change your game logic. To undo, remove its <script> line.
 * Needs accra-assets.js loaded first. */
(function () {
  const banner = m => { try { const d = document.createElement("div"); d.style.cssText = "position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 110px);background:#8b1a1a;color:#fff;padding:8px 10px;border-radius:10px;font:12px system-ui;z-index:99;max-width:92vw"; d.textContent = "\u26A0 " + m + " (tap to hide)"; d.onclick = () => d.remove(); document.body.appendChild(d); } catch (e) {} };
  // touch: stop iOS page-zoom and accidental pinch, keep UI buttons independent of the canvas
  ["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener("touchmove", e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  { let lt = 0; document.addEventListener("touchend", e => { const n = Date.now(); if (n - lt < 300) e.preventDefault(); lt = n; }, { passive: false }); }
  { const cv = document.getElementById("c"); if (cv) cv.style.touchAction = "none";
    const us = document.createElement("style"); us.textContent = "#joy,#jump,#act,#knob,.pb,.p2,.apn,#pbtn2{touch-action:none;pointer-events:auto}"; document.head.appendChild(us); }
  let shown = 0; window.addEventListener("error", e => { if (shown < 2 && e.filename && /accra|online|phone/.test(e.filename)) { shown++; banner((e.filename.split("/").pop()) + ": " + e.message); } });
  try {
    const A = AccraAssets, B = BABYLON;

    // ===== SHOPPING, WARDROBE, FITTING ROOM, MALL =====
    const cash = () => (window.ACCRA_STATE ? window.ACCRA_STATE.money : 0);
    const pay = (n, why) => { if (window.ACCRA_ADD) window.ACCRA_ADD(-n, why); };
    const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
    const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const note = (() => {
      const d = document.createElement("div");
      d.style.cssText = "position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);transform:translateX(-50%);background:#25282c;border:1px solid #c9a54a;color:#f2f0ea;padding:8px 14px;border-radius:14px;font:700 14px system-ui;z-index:50;opacity:0;transition:opacity .3s;pointer-events:none;text-align:center;max-width:80%";
      document.body.appendChild(d); let t;
      return m => { d.textContent = m; d.style.opacity = 1; clearTimeout(t); t = setTimeout(() => d.style.opacity = 0, 2400); };
    })();
    // shared panel
    const pan = document.createElement("div");
    pan.className = "apn";
    { const ps = document.createElement("style");
      ps.textContent = ".apn{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);transform:translateX(-50%);width:min(64vw,440px);max-height:min(48vh,230px);overflow:auto;background:rgba(28,30,33,.93);border:2px solid #c9a54a;border-radius:16px;padding:6px 8px 8px;z-index:40;color:#fff;font:12.5px system-ui;display:none;grid-template-columns:1fr 1fr;gap:0 6px;align-content:start;touch-action:pan-y;-webkit-overflow-scrolling:touch}.apn.min{max-height:42px;overflow:hidden}.apn>*{grid-column:1/-1}.apn>button{grid-column:auto}@media (orientation:portrait){.apn{width:min(94vw,420px);max-height:min(44vh,320px)}}";
      document.head.appendChild(ps); }
    document.body.appendChild(pan);
    const BS = "display:block;width:100%;margin:3px 0;border:0;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font:600 13px system-ui;padding:7px 10px;text-align:left";
    const GOLD = BS + ";background:#c9a54a;color:#17191c;text-align:center;font-weight:800";
    const ttl = t => '<div style="font-weight:800;font-size:16px;color:#c9a54a;margin-bottom:4px">' + t + "</div>";
    let onPan = null, lock = false, ptOpen = false;
    { const jy = document.getElementById("joy"); if (jy) jy.addEventListener("pointerdown", () => { if (pan.style.display !== "none") pan.classList.add("min"); }); }
    pan.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.m) { pan.classList.toggle("min"); return; } if (onPan) onPan(b.dataset); };
    const XB = '<div style="position:sticky;top:-8px;text-align:right;height:0;z-index:2"><button data-m="1" style="border:0;border-radius:50%;width:26px;height:26px;background:#555;color:#fff;font:800 14px system-ui;margin:-2px 6px 0 0">\u25BE</button><button data-x="1" style="border:0;border-radius:50%;width:26px;height:26px;background:#c9a54a;color:#17191c;font:800 14px system-ui;margin:-2px -4px 0 0">\u2715</button></div>';
    const show = (html, fn) => { pan.innerHTML = XB + html; onPan = fn; pan.classList.remove("min"); pan.style.display = "grid"; };
    const hide = () => { pan.classList.remove("min"); pan.style.display = "none"; onPan = null; lock = false; ptOpen = false; };

    // ---- clothes: wardrobe (owned only), fitting room (buy), first join (free) ----
    const STYLE_N = ["Tee and trousers", "Suit and tie", "Dress", "Hoodie and shorts", "Batik kaftan (Accra)", "Ghana jersey", "Kente shirt (Accra)", "Leather jacket"];
    const HAIR_N = ["Bald", "Fade", "Afro", "Dreads", "Braids", "Cornrows", "Locs", "Mohawk", "Low cut", "Twists"];
    const SKIN_N = ["Deep brown", "Brown", "Dark brown", "Espresso", "Caramel", "Ebony", "Light brown", "Honey"];
    const ACC_N = ["None", "Gold chain", "Cap", "Beanie", "Sunglasses", "Kente headwrap (Accra)"];
    const SHOE_N = ["White sneakers", "Black shoes", "Brown leather", "Red sneakers"];
    const HCOL_N = ["Black", "Dark brown", "Brown", "Honey"];
    const OPT = [["Outfit", "style", 8, STYLE_N], ["Hairstyle", "hair", 10, HAIR_N], ["Hair colour", "hcol", 4, HCOL_N], ["Top colour", "top", 8], ["Trousers", "pants", 6], ["Skin tone", "skin", 8, SKIN_N], ["Accessory", "acc", 6, ACC_N], ["Shoes", "shoe", 4, SHOE_N]];
    const PR = { style: [0, 150, 100, 80, 120, 140, 160, 130], hair: 15, hcol: 10, top: 20, pants: 20, skin: 0, acc: 25, shoe: 30 };
    const price = (k, v) => Array.isArray(PR[k]) ? PR[k][v] : PR[k];
    const owned = Object.assign({ style: [0], hair: [1], hcol: [0], top: [3], pants: [0], skin: [0, 1, 2, 3, 4, 5, 6, 7], acc: [0], shoe: [0] }, ls("accra-owned", {}));
    const has = (k, v) => owned[k].includes(v);
    const markOwned = L => { OPT.forEach(o => { if (!has(o[1], L[o[1]])) owned[o[1]].push(L[o[1]]); }); sv("accra-owned", owned); };
    function styler(mode) {
      const av = window.ACCRA_AVATAR; if (!av) return note("Character not ready yet");
      const L = av.look, backup = JSON.stringify(L);
      const cost = () => OPT.reduce((s, o) => s + (has(o[1], L[o[1]]) ? 0 : price(o[1], L[o[1]])), 0);
      const click = d => {
        if (d.i !== undefined) {
          const o = OPT[+d.i], k = o[1]; let v = L[k], c = 0;
          do { v = (v + 1) % o[2]; c++; } while (mode === "wardrobe" && !has(k, v) && c < o[2]);
          L[k] = v; av.apply(); draw();
        } else if (d.buy) {
          const c = cost(); if (c > cash()) return note("Not enough cash. You need GH\u00A2" + c);
          if (c) pay(c, "Clothing store"); markOwned(L); hide(); note(c ? "Bought and wearing it!" : "Looks good!");
        } else if (d.done) { markOwned(L); hide(); }
        else if (d.x) { Object.assign(L, JSON.parse(backup)); av.apply(); hide(); }
      };
      const draw = () => {
        const c = cost(), shop = mode === "shop";
        show(ttl(shop ? "Fitting room" : mode === "first" ? "Create your character" : mode === "edit" ? "Edit look" : "Your wardrobe") +
          OPT.map((o, i) => '<button data-i="' + i + '" style="' + BS + '">' + o[0] + " \u00B7 " + (o[3] ? o[3][L[o[1]]] : (L[o[1]] + 1) + " / " + o[2]) +
            (shop ? (has(o[1], L[o[1]]) ? " \u00B7 owned" : " \u00B7 GH\u00A2" + price(o[1], L[o[1]])) : "") + "</button>").join("") +
          (shop ? '<button data-buy="1" style="' + GOLD + '">' + (c ? "Buy & wear \u00B7 GH\u00A2" + c : "Wear") + '</button><button data-x="1" style="' + BS + ';text-align:center">Cancel</button>'
                : '<button data-done="1" style="' + GOLD + '">Done</button>'), click);
      };
      draw(); lock = mode === "first";
    }
    window.ACCRA_STYLER = styler;
    if (window.ACCRA_AVATAR) { markOwned(window.ACCRA_AVATAR.look); if (window.ACCRA_AVATAR.isNew) setTimeout(() => styler("first"), 1000); }

    function tag(t, x, y, z, tw) {
      const w = tw || 2.2, dt = new B.DynamicTexture("tg", { width: 256, height: 64 }, scene, false), c = dt.getContext();
      c.fillStyle = "rgba(23,25,28,.85)"; c.fillRect(0, 0, 256, 64);
      c.fillStyle = "#c9a54a"; c.font = "bold 26px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, 128, 34, 244); dt.update();
      const m = B.MeshBuilder.CreatePlane("tg", { width: w, height: w / 4 }, scene);
      m.position.set(x, y, z); m.billboardMode = B.Mesh.BILLBOARDMODE_ALL; m.isPickable = false;
      const mt = new B.StandardMaterial("tgm", scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false; m.material = mt; return m;
    }
    // ---- items you can buy: [name, price, parts [w,h,d,x,y,z,colour]] ----
    const ITEMS = {
      fan: ["Standing fan", 60, [[.4,.05,.4,0,.03,0,"#222"],[.06,1,.06,0,.55,0,"#ccc"],[.45,.45,.1,0,1.15,0,"#e8e8e8"]]],
      micro: ["Microwave", 90, [[.5,.3,.4,0,.15,0,"#cfd6dc"],[.3,.2,.02,-.06,.15,.21,"#111"]]],
      cooker: ["Gas cooker", 150, [[.7,.85,.6,0,.43,0,"#e9edf0"],[.7,.04,.6,0,.87,0,"#222"],[.15,.02,.15,-.15,.9,-.12,"#555"],[.15,.02,.15,.15,.9,-.12,"#555"],[.5,.4,.02,0,.4,.31,"#111"]]],
      fridge: ["Refrigerator", 300, [[.8,1.8,.7,0,.9,0,"#cfd6dc"],[.04,.5,.04,.3,1.2,.37,"#555"],[.8,.02,.71,0,1.25,0,"#444"]]],
      tv: ["Television", 350, [[.9,.45,.4,0,.23,0,"#5a3a22"],[1.3,.75,.06,0,.95,0,"#0b0b0e"],[1.2,.65,.02,0,.95,.04,"#1d3b57"]]],
      washer: ["Washing machine", 400, [[.7,.9,.65,0,.45,0,"#f4f7fa"],[.4,.4,.02,0,.45,.33,"#7aa3c0"],[.6,.1,.02,0,.82,.33,"#444"]]],
      bed1: ["Single bed", 120, [[1,.3,2,0,.15,0,"#6d4c2f"],[.95,.2,1.95,0,.4,0,"#e9e6df"],[.6,.12,.35,0,.55,-.7,"#fff"],[1,.7,.08,0,.5,-1,"#5a3a22"]]],
      bed2: ["Double bed", 250, [[1.6,.3,2,0,.15,0,"#6d4c2f"],[1.55,.2,1.95,0,.4,0,"#d9cbb6"],[.6,.12,.35,-.4,.55,-.7,"#fff"],[.6,.12,.35,.4,.55,-.7,"#fff"],[1.6,.8,.08,0,.55,-1,"#5a3a22"]]],
      sofa: ["Sofa", 300, [[2,.4,.9,0,.25,0,"#7a3b3b"],[2,.5,.25,0,.65,-.35,"#7a3b3b"],[.2,.3,.9,-.9,.5,0,"#6a2f2f"],[.2,.3,.9,.9,.5,0,"#6a2f2f"]]],
      dining: ["Dining set", 220, [[1.4,.08,.9,0,.75,0,"#8a5a2b"],[.08,.75,.08,-.6,.37,-.38,"#5a3a22"],[.08,.75,.08,.6,.37,-.38,"#5a3a22"],[.08,.75,.08,-.6,.37,.38,"#5a3a22"],[.08,.75,.08,.6,.37,.38,"#5a3a22"],[.4,.06,.4,0,.45,.75,"#6d4c2f"],[.4,.06,.4,0,.45,-.75,"#6d4c2f"]]],
      wardrobe: ["Wardrobe", 180, [[1.2,2,.6,0,1,0,"#6b4a2e"],[.02,1.8,.62,0,1,0,"#3a2616"],[.05,.3,.05,-.1,1,.33,"#c9a54a"],[.05,.3,.05,.1,1,.33,"#c9a54a"]]],
      shelf: ["Bookshelf", 90, [[1,1.8,.35,0,.9,0,"#8a5a2b"],[.9,.25,.3,0,.45,.02,"#c8553d"],[.9,.25,.3,0,.95,.02,"#2456a6"],[.9,.25,.3,0,1.45,.02,"#3f8f7a"]]],
      desk: ["Desk", 0, [[1.6,.06,.75,0,.75,0,"#6d4c2f"],[.05,.75,.7,-.75,.37,0,"#5a3a22"],[.05,.75,.7,.75,.37,0,"#5a3a22"],[.5,.35,.02,0,1,-.2,"#111"],[.05,.2,.05,0,.85,-.2,"#555"],[.5,.03,.2,0,.79,.1,"#222"],[.5,.06,.5,0,.5,.9,"#222"],[.5,.5,.06,0,.78,1.15,"#222"],[.06,.5,.06,0,.25,.9,"#555"]]],
      chair: ["Armchair", 0, [[.9,.4,.9,0,.25,0,"#3a3a40"],[.9,.55,.2,0,.7,-.35,"#3a3a40"],[.15,.35,.9,-.42,.5,0,"#2f2f34"],[.15,.35,.9,.42,.5,0,"#2f2f34"]]],
      coffee: ["Coffee table", 0, [[1.1,.05,.6,0,.4,0,"#6d4c2f"],[.06,.4,.06,-.5,.2,-.25,"#5a3a22"],[.06,.4,.06,.5,.2,-.25,"#5a3a22"],[.06,.4,.06,-.5,.2,.25,"#5a3a22"],[.06,.4,.06,.5,.2,.25,"#5a3a22"]]],
      counter: ["Kitchen counter", 0, [[5,.9,.7,0,.45,0,"#e9edf0"],[5,.05,.75,0,.92,0,"#3a3a3e"],[.8,.06,.5,-1.2,.95,.02,"#aab4bc"],[.05,.28,.05,-1.2,1.08,-.2,"#ccc"],[.45,.03,.45,1,.96,0,"#222"],[.45,.03,.45,1.8,.96,0,"#222"]]],
      island: ["Kitchen island", 0, [[1,.9,3,0,.45,0,"#f4f1ea"],[1.1,.05,3.1,0,.92,0,"#8a8a8a"],[.4,.5,.4,-.85,.25,-.9,"#6d4c2f"],[.4,.5,.4,-.85,.25,.9,"#6d4c2f"]]],
      bath: ["Bathtub", 0, [[1.6,.6,.8,0,.3,0,"#f4f7fa"],[1.4,.05,.6,0,.58,0,"#9fd0e8"],[.05,.2,.05,.7,.7,0,"#ccc"]]],
      vanity: ["Vanity", 0, [[.6,.8,1.6,0,.4,0,"#e3eef4"],[.5,.06,.9,0,.82,0,"#ffffff"],[.04,.25,.04,0,.95,-.3,"#ccc"]]],
      kit2: ["Kitchenette", 0, [[2,.9,.65,0,.45,0,"#e9edf0"],[2,.05,.7,0,.92,0,"#3a3a3e"],[.5,.06,.45,-.5,.95,.02,"#aab4bc"],[.05,.25,.05,-.5,1.07,-.2,"#ccc"],[.4,.03,.4,.35,.96,0,"#222"],[.4,.03,.4,.75,.96,0,"#222"]]]
    };
    const APPL = ["fridge", "tv", "cooker", "washer", "micro", "fan"], FURN = ["bed1", "bed2", "sofa", "dining", "wardrobe", "shelf"];
    function item(id, x, z, ry, lbl, sc, parent) {
      const nd = new B.TransformNode("it", scene); nd.position.set(x, 0, z); nd.rotation.y = ry || 0;
      if (parent) nd.parent = parent; if (sc) nd.scaling.setAll(sc);
      ITEMS[id][2].forEach(p => {
        const m = B.MeshBuilder.CreateBox("ip", { width: p[0], height: p[1], depth: p[2] }, scene);
        m.parent = nd; m.position.set(p[3], p[4], p[5]); m.material = mat(p[6]); m.isPickable = false; if (!parent) sg.addShadowCaster(m);
      });
      if (lbl) tag(lbl === true ? ITEMS[id][0] + " \u00B7 GH\u00A2" + ITEMS[id][1] : lbl, x, 2.5, z);
      return nd;
    }
    function collider(id, x, z, ry, sc) {   // invisible solid box so you cannot walk through furniture
      let x0 = 9, x1 = -9, z0 = 9, z1 = -9, y1 = 0;
      ITEMS[id][2].forEach(p => { x0 = Math.min(x0, p[3] - p[0] / 2); x1 = Math.max(x1, p[3] + p[0] / 2); z0 = Math.min(z0, p[5] - p[2] / 2); z1 = Math.max(z1, p[5] + p[2] / 2); y1 = Math.max(y1, p[4] + p[1] / 2); });
      const s = sc || 1, cx = (x0 + x1) / 2 * s, cz = (z0 + z1) / 2 * s, c = Math.cos(ry), sn = Math.sin(ry), h = Math.min(y1 * s, 1.3);
      const m = B.MeshBuilder.CreateBox("col", { width: (x1 - x0) * s * .92, height: h, depth: (z1 - z0) * s * .92 }, scene);
      m.position.set(x + cx * c + cz * sn, h / 2, z - cx * sn + cz * c); m.rotation.y = ry; m.isVisible = false; m.checkCollisions = true; m.isPickable = false; return m;
    }
    // bought items are delivered to the villa garage (3 x 3 slots)
    const inv = ls("accra-inv", []);
    const place = i => item(inv[i], VX + [-2.3, 0, 2.3][i % 3], VZ + [3, 5.2, 7.4][Math.floor(i / 3) % 3], 0, ITEMS[inv[i]][0]);
    inv.forEach((_, i) => place(i));
    function shop(name, ids) {
      const draw = () => show(ttl(name) + "<small>Cash: GH\u00A2" + cash() + " \u00B7 delivered to your garage (" + inv.length + "/9)</small>" +
        ids.map(id => '<button data-b="' + id + '" style="' + BS + '">' + ITEMS[id][0] + " \u00B7 GH\u00A2" + ITEMS[id][1] + (inv.includes(id) ? " \u00B7 owned" : "") + "</button>").join("") +
        '<button data-x="1" style="' + BS + ';text-align:center">Close</button>', d => {
          if (d.x) return hide();
          const id = d.b, p = ITEMS[id][1];
          if (inv.includes(id)) return note("You already own this.");
          if (inv.length >= 9) return note("Your garage is full.");
          if (cash() < p) return note("Not enough cash. You need GH\u00A2" + p);
          pay(p, "Mall: " + ITEMS[id][0]); inv.push(id); sv("accra-inv", inv); place(inv.length - 1);
          note(ITEMS[id][0] + " delivered to your garage"); draw();
        });
      draw();
    }

    // ---- the mall: replaces the Makola block at x 15..55, z 17..53; entrance faces the road ----
    const MX = 35, MZ = 35, MH = 4.6;
    scene.meshes.filter(m => (m.name === "bd" || m.name === "rf") && Math.abs(m.position.x - MX) < 26 && Math.abs(m.position.z - MZ) < 26).forEach(m => m.dispose());
    const mw = (lx, lz, sw, sd) => box(sw, MH, sd, MX + lx, MH / 2, MZ + lz, "#efe7d2");
    const fl = (lx, lz, sw, sd, c) => box(sw, .05, sd, MX + lx, .03, MZ + lz, c, false);
    mw(0, 18, 40, .4); mw(-20, 0, .4, 36); mw(20, 0, .4, 36); mw(-12, -18, 16, .4); mw(12, -18, 16, .4);   // outer walls, 8 m entrance
    box(8, 1, .4, MX, MH - .5, MZ - 18, "#efe7d2");
    mw(-6.5, 10, .3, 16); mw(6.5, 10, .3, 16);                                                            // store dividers
    [[-17.875, 4.25], [-8.625, 4.25], [-4.5, 4], [4.5, 4], [8.625, 4.25], [17.875, 4.25]].forEach(s => mw(s[0], 2, s[1], .3)); // store fronts, 5 m doorways
    const ck = (a, b, us, vs) => {
      const t = new B.DynamicTexture("ck", 128, scene, true), c = t.getContext();
      c.fillStyle = a; c.fillRect(0, 0, 128, 128); c.fillStyle = b; c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64); t.update();
      t.uScale = us; t.vScale = vs; t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE;
      const m = new B.StandardMaterial("ckm", scene); m.diffuseTexture = t; m.specularColor = B.Color3.Black(); return m;
    };
    fl(0, -8, 40, 20, "#e8e2d6").material = ck("#e9e4d8", "#cfc8b8", 10, 5);
    fl(-13.25, 10, 13.5, 16, "#d9b8b8").material = ck("#f0d5d5", "#e2bcbc", 3.4, 4);
    fl(0, 10, 13, 16, "#b9c4cc").material = ck("#d8e2ea", "#b3c3d0", 3.3, 4);
    fl(13.25, 10, 13.5, 16, "#c9b79a").material = ck("#e2d2b2", "#cdb98f", 3.4, 4);
    [[-13.25, "#f0c8c8"], [0, "#c3d6ee"], [13.25, "#eadbb8"]].forEach(c => { box(13.4, 3.6, .06, MX + c[0], 2.1, MZ + 17.7, c[1], false); box(13.4, .25, .08, MX + c[0], 3.7, MZ + 17.65, "#ffffff", false); });
    A.createKiosk(scene, { position: [MX - 11, 0, MZ - 14], color: "#d9382c" });
    A.createKiosk(scene, { position: [MX + 11, 0, MZ - 14], color: "#2f7fd0", awning: "#ffffff" });
    const mroof = box(40.8, .4, 36.8, MX, MH + .2, MZ, "#8a8a84", false);
    function sign(t, x, y, z, sw, sh, bg, fg) {
      const dt = new B.DynamicTexture("sg", { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128); c.fillStyle = fg; c.font = "bold 54px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, 256, 66); dt.update();
      const m = B.MeshBuilder.CreatePlane("sn", { width: sw, height: sh }, scene); m.position.set(x, y, z); m.isPickable = false;
      const mt = new B.StandardMaterial("snm", scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false; m.material = mt;
    }
    sign("ACCRA MALL", MX, MH + 1.8, MZ - 18.4, 16, 3.4, "#17191c", "#c9a54a");
    sign("Clothing", MX - 13.25, 3.7, MZ + 1.8, 9, 1.1, "#7a2d4a", "#ffffff");
    sign("Appliances", MX, 3.7, MZ + 1.8, 9, 1.1, "#2456a6", "#ffffff");
    sign("Furniture & Beds", MX + 13.25, 3.7, MZ + 1.8, 9, 1.1, "#8a5a2b", "#ffffff");
    APPL.forEach((id, i) => item(id, MX + (-5 + i * 2), MZ + 16.3, Math.PI, true));
    FURN.forEach((id, i) => item(id, MX + 13.25 + (-5.5 + i * 2.2), MZ + 16.4, Math.PI, true));
    for (let i = 0; i < 5; i++) { box(.5, 1, .15, MX - 13.25 - 5 + i * 2.5, 1.2, MZ + 16.2, ["#9a4a42", "#c9a54a", "#56705a", "#4d6a8a", "#e8e6df"][i], false); box(1.6, .05, .4, MX - 13.25 - 5 + i * 2.5, 1.65, MZ + 16.2, "#6d4c2f", false); }
    box(2.4, 2.2, .06, MX - 13.25, 1.4, MZ + 17.7, "#9cc9e0", false);
    [-8, 8].forEach(x => { box(2.5, .5, .7, MX + x, .25, MZ - 8, "#6d4c2f", false); [-4, 4].forEach(z => { box(.8, .5, .8, MX + x, .25, MZ + z - 10, "#7a5a3a", false); const s = B.MeshBuilder.CreateSphere("pl", { diameter: 1.4, segments: 5 }, scene); s.convertToFlatShadedMesh(); s.position.set(MX + x, 1.2, MZ + z - 10); s.material = mat("#3f8f4a"); s.isPickable = false; }); });

    // ---- stock the mall and label the villa ----
    const bx = (a, b, c, x, y, z, col) => box(a, b, c, MX + x, y, MZ + z, col, false);
    const ball = (d, x, y, z, col) => { const s = B.MeshBuilder.CreateSphere("bl", { diameter: d, segments: 6 }, scene); s.convertToFlatShadedMesh(); s.position.set(MX + x, y, MZ + z); s.material = mat(col); s.isPickable = false; return s; };
    const cy = (d, h, x, y, z, col) => { const m = B.MeshBuilder.CreateCylinder("cy", { diameter: d, height: h, tessellation: 12 }, scene); m.convertToFlatShadedMesh(); m.position.set(MX + x, y, MZ + z); m.material = mat(col); m.isPickable = false; return m; };
    const COL = ["#9a4a42", "#c9a54a", "#56705a", "#4d6a8a", "#e8e6df", "#2a2c30", "#7a6a8a", "#c08a5a"];
    const shelves = x => { box(.5, 2, 10, MX + x, 1, MZ + 10.2, "#8a5a2b", false); for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) bx(.4, .28, .9, x, .6 + k * .6, 6.6 + j * 1.6, COL[(j + k * 3) % 8]); };
    [-19.6, -6.1, 6.1, 19.6].forEach(shelves);
    [[-4.5, 0], [-1.5, 3], [1.5, 1], [4.5, 2]].forEach(m => {        // mannequins in the clothing store
      const x = -13.25 + m[0], c = COL[m[1]];
      bx(.5, .06, .5, x, .03, 9, "#222"); bx(.2, .9, .2, x, .5, 9, "#2f3a4a"); bx(.5, .7, .25, x, 1.3, 9, c);
      bx(.12, .6, .12, x - .31, 1.3, 9, c); bx(.12, .6, .12, x + .31, 1.3, 9, c); ball(.28, x, 1.8, 9, "#d9b8a0");
    });
    [[-13.25 + 4.3, 5], [3.8, 4.5], [13.25 - 4.3, 5]].forEach(c => { bx(2.4, 1, .8, c[0], .5, c[1], "#4a4a52"); bx(.4, .3, .4, c[0], 1.15, c[1], "#222"); });   // counters + tills
    bx(4, .03, 3, 13.25 - 3.5, .06, 10.5, "#9a4a42"); bx(4, .03, 3, 13.25 + 3.5, .06, 10.5, "#4d6a8a");
    item("sofa", MX + 13.25 - 3.5, MZ + 10.5, Math.PI, true); item("bed1", MX + 13.25 + 3.5, MZ + 10.5, Math.PI, true);
    item("tv", MX - 3.5, MZ + 10.5, Math.PI, true); item("washer", MX + 3.5, MZ + 10.5, Math.PI, true);
    [-1, 1].forEach(s => { const x = 13.25 + s * 6.2; bx(.06, 1.6, .06, x, .8, 14, "#ccc"); ball(.5, x, 1.7, 14, "#fff3c4"); });
    cy(4, .5, 0, .25, -8, "#bdb7aa"); cy(3.4, .35, 0, .4, -8, "#4aa3c7"); cy(.5, 1.6, 0, .9, -8, "#bdb7aa"); ball(.9, 0, 1.9, -8, "#4aa3c7");   // fountain
    bx(6, .02, 14, 0, .07, -11, "#cdbd8f");
    bx(40.4, .9, .6, 0, MH - .55, -18.1, "#c9a54a"); [-12, 12].forEach(x => bx(10, 2.2, .1, x, 2.1, -18.3, "#2b4a63"));
    tag("Clothing \u00B7 Appliances \u00B7 Furniture", MX, 2.8, MZ - 15, 6);
    tag("Suit GH\u00A2150 \u00B7 Dress GH\u00A2100 \u00B7 Hoodie GH\u00A280", MX - 13.25, 3.2, MZ + 17, 6);
    tag("SALE \u2014 TVs & fridges", MX, 3.2, MZ + 17, 5);
    tag("Beds \u00B7 Sofas \u00B7 Tables", MX + 13.25, 3.2, MZ + 17, 5);
    // villa: name tags and details so every object can be identified
    [["Sofa", -9.6, 5.5, .9], ["Corner sofa", -7, 8.1, .85], ["Armchair", -4.9, 7.9, 1], ["TV", -12.45, 5.5, 1.1], ["Coffee table", -7.4, 5.4, .8],
     ["Kitchen counter", 12.5, 4, .9], ["Kitchen island", 9.2, 4, .95], ["Fridge", 12.4, 7.9, 2], ["Dining table", 6.3, 7.2, .75],
     ["Desk", 0, -6.2, .75], ["Bookshelf", -2.6, -8.55, 2.2], ["Bookshelf", 2.6, -8.55, 2.2],
     ["Bed", -6.5, -6.8, .5], ["Wardrobe", -5, -.55, 2], ["Bathtub", -11.4, -8.2, .6], ["Sink", -10, -7.2, .9],
     ["Cinema sofa", 8.5, -3.2, .6], ["Cinema screen", 8.5, -8.4, 1.1]].forEach(o => tag(o[0], VX + o[1], o[3] + .7, VZ + o[2], 1.6));
    {
      const vdec = new B.TransformNode("villaDeco", scene), P = Math.PI;
      const VF = [[-12.45, 5.5, "tv", P / 2, 1.7, -8.5, .7], [-9.6, 5.5, "sofa", -P / 2, 1.5, -8.5, 3], [-7, 8.1, "sofa", P, 1.5, -6.9, 6.2], [-4.9, 7.9, "chair", P, 1.1, -11.6, 7.2], [-7.4, 5.4, "coffee", 0, 1.5, -4.9, 8],
       [12.5, 4, "counter", -P / 2, 1], [9.2, 4, "island", 0, 1], [12.4, 7.9, "fridge", -P / 2, 1.1], [6.3, 7.2, "dining", 0, 1.5],
       [0, -6.2, "desk", 0, 1.4], [-2.6, -8.55, "shelf", 0, 1.25], [2.6, -8.55, "shelf", 0, 1.25],
       [-6.5, -6.8, "bed2", 0, 1.4], [-5, -.55, "wardrobe", P, 1.3], [-11.4, -8.2, "bath", 0, 1], [-10, -7.2, "vanity", 0, 1],
       [8.5, -3.2, "sofa", P, 1.5], [8.5, -8.4, "tv", 0, 1.7]];
      window.ACCRA_VILLA = VF;
      VF.forEach(f => {
        const ox = f[5] !== undefined ? f[5] : f[0], oz = f[6] !== undefined ? f[6] : f[1];
        const old = scene.meshes.find(m => m.name === "b" && Math.abs(m.position.x - (VX + ox)) < .01 && Math.abs(m.position.z - (VZ + oz)) < .01);
        if (old) { sg.removeShadowCaster(old); old.dispose(); }
        collider(f[2], VX + f[0], VZ + f[1], f[3], f[4]);
        item(f[2], VX + f[0], VZ + f[1], f[3], false, f[4], vdec);
      });
      const vm = mergeAsset(vdec); if (vm) { vm.receiveShadows = true; vm.isPickable = false; }
    }

    // gold beam over the mall so it is easy to find, plus a banner proving this version is loaded
    {
      const bm = B.MeshBuilder.CreateCylinder("mallbeam", { height: 70, diameter: 3 }, scene);
      bm.position.set(MX, 35, MZ - 22); bm.isPickable = false;
      const bmt = new B.StandardMaterial("mallbeamm", scene);
      bmt.emissiveColor = B.Color3.FromHexString("#c9a54a"); bmt.disableLighting = true; bmt.alpha = .35; bmt.fogEnabled = false; bm.material = bmt;
      note("Accra Mall loaded \u2014 follow the gold beam");
      if (/newchar/.test(location.search)) setTimeout(() => styler("first"), 1200);
    }
    // ---- "interact" button: appears next to the car button when you are at a wardrobe, fitting room or store counter ----
    const POINTS = [
      { x: VX - 5, z: VZ - .55, r: 2.4, t: "\uD83D\uDC54 Wardrobe", ok: p => p.z < VZ - .2, f: () => styler("wardrobe") },
      { x: MX - 13.25, z: MZ + 12.5, r: 6, t: "\uD83E\uDE9E Fitting room", f: () => styler("shop") },
      { x: MX, z: MZ + 12.5, r: 6, t: "\uD83D\uDCFA Appliances", f: () => shop("Home appliances", APPL) },
      { x: MX + 13.25, z: MZ + 12.5, r: 6, t: "\uD83D\uDECF\uFE0F Furniture & beds", f: () => shop("Furniture & beds", FURN) }
    ];
    const ab = document.createElement("button");
    ab.style.cssText = "position:fixed;right:calc(env(safe-area-inset-right,0px) + 174px);bottom:calc(env(safe-area-inset-bottom,0px) + 28px);height:50px;padding:0 18px;border:0;border-radius:25px;background:#c9a54a;color:#17191c;font:800 15px system-ui;z-index:8;display:none;touch-action:none";
    document.body.appendChild(ab);
    let cp = null, ft = 0;
    ab.onclick = () => { if (cp) { ptOpen = true; cp.f(); } };
    scene.onBeforeRenderObservable.add(() => {
      if (ft++ % 6) return;
      const p = player.position; cp = null;
      if (!driving && !document.body.classList.contains("po")) { let bd = 1e9; POINTS.forEach(q => { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < q.r && d < bd && (!q.ok || q.ok(p))) { bd = d; cp = q; } }); }
      ab.style.display = cp ? "block" : "none"; if (cp) ab.textContent = typeof cp.t === "function" ? cp.t() : cp.t;
      if (!cp && pan.style.display === "grid" && ptOpen && !lock) hide();
      mroof.setEnabled(!(Math.abs(p.x - MX) < 20.5 && Math.abs(p.z - MZ) < 18.5));
    });


    try {
    // ===== AMOAMAH ESTATE: detached houses with red hip-tile roofs, lawns, wooden fences, pools; and the SPORTS STADIUM =====
    scene.meshes.filter(m => (m.name === "bd" || m.name === "rf") && m.position.x > 80 && m.position.x < 140 && Math.abs(m.position.z) > 10 && Math.abs(m.position.z) < 60).forEach(m => m.dispose());
    const hipSrc = {};
    window.ACCRA_HIP = hex => hip(hex);
    try {   // the villa gets a pitched hip roof instead of the flat box
      const flat = scene.meshes.find(m => m.name === "b" && Math.abs(m.position.x - VX) < .01 && Math.abs(m.position.z - VZ) < .01 && Math.abs(m.position.y - 3.35) < .01);
      if (flat) { flat.isVisible = false; const vr = hip("#8c3b2b").createInstance("villahip"); vr.scaling.set(13.9, 3.8, 13.2); vr.position.set(VX, 3.2, VZ); vr.isPickable = false;
        scene.onBeforeRenderObservable.add(() => { const f = driving ? car.position : player.position; vr.setEnabled(!(Math.abs(f.x - VX) < 13.5 && Math.abs(f.z - VZ) < 9.5)); }); }
    } catch (e) { banner("Villa roof: " + e.message); }
    function hip(hex) {   // hip roof: a ridge with four sloping faces
      if (hipSrc[hex]) return hipSrc[hex];
      const a = 1, b = .75, c = .25, h = 1, pos = [], idx = [];
      [[[-a, 0, -b], [a, 0, -b], [c, h, 0], [-c, h, 0]], [[a, 0, b], [-a, 0, b], [-c, h, 0], [c, h, 0]], [[a, 0, -b], [a, 0, b], [c, h, 0]], [[-a, 0, b], [-a, 0, -b], [-c, h, 0]]].forEach(f => {
        const o = pos.length / 3; f.forEach(v => pos.push(v[0], v[1], v[2]));
        idx.push(o, o + 1, o + 2); if (f.length === 4) idx.push(o, o + 2, o + 3);
      });
      const nrm = []; B.VertexData.ComputeNormals(pos, idx, nrm);
      const m = new B.Mesh("hip", scene), vd = new B.VertexData(); vd.positions = pos; vd.indices = idx; vd.normals = nrm; vd.applyToMesh(m);
      const mt = new B.StandardMaterial("hipm" + hex, scene); mt.diffuseColor = B.Color3.FromHexString(hex); mt.specularColor = new B.Color3(.05, .05, .05); mt.backFaceCulling = false; mt.twoSidedLighting = true;
      m.material = mt; m.isVisible = false; m.isPickable = false; return (hipSrc[hex] = m);
    }
    function amoPlot(cx, cz, s, k) {   // s = 1: front faces -z (south), s = -1: front faces +z
      const bx = (w, h, d, lx, y, lz, col, solid) => box(w, h, d, cx + s * lx, y, cz + s * lz, col, solid);
      bx(26, .06, 21, 0, .04, 0, "#62b04b", false);                                            // lawn
      bx(26, 1.3, .2, 0, .65, 10.4, "#7a4a2a"); bx(.2, 1.3, 21, -13, .65, 0, "#7a4a2a"); bx(.2, 1.3, 21, 13, .65, 0, "#7a4a2a");   // wooden fence
      bx(11.5, 1.3, .2, -7.25, .65, -10.4, "#7a4a2a"); bx(11.5, 1.3, .2, 7.25, .65, -10.4, "#7a4a2a");                            // gate gap in front
      bx(1.6, .05, 6.9, 0, .07, -6.95, "#d8c9a0", false);                                      // stone path
      const wall = ["#d9d2c3", "#e8ddc6", "#cfd8d6", "#e6cbb0"][k % 4];
      const body = bx(11, 3.4, 8, 0, 1.7, .5, wall); body.name = "amh";
      const gp = [cx, cz - s * 10.4]; body.metadata = { gate: gp, n: [0, -s], garage: { x: cx + s * -9.4, z: cz + s * -2.5, h: s === 1 ? Math.PI : 0 } };
      bx(5, .06, 6.5, -9.4, .05, -2.5, "#9a9a92", false); bx(5.4, .25, 6.9, -9.4, 3, -2.5, "#8a8a84", false);          // personal garage / carport
      [[-2.4, -3.2], [2.4, -3.2], [-2.4, 3.2], [2.4, 3.2]].forEach(q => bx(.2, 3, .2, -9.4 + q[0], 1.5, -2.5 + q[1], "#777777", false));
      [-3.6, 3.6].forEach(x => { bx(1.5, 1.3, .08, x, 1.9, -3.52, "#e8e2d0", false); bx(1.3, 1.1, .1, x, 1.9, -3.54, "#1d3042", false); });
      bx(1.4, 2.4, .1, 0, 1.2, -3.53, "#e8e2d0", false); bx(1.2, 2.2, .12, 0, 1.1, -3.56, "#5a3a22", false);
      [-1, 1].forEach(q => bx(.1, 1.1, 1.3, q * 5.54, 1.9, .5, "#1d3042", false)); bx(1.3, 1.1, .1, 0, 1.9, 4.54, "#1d3042", false);
      const r = hip(k % 2 ? "#c65a2e" : "#b5472c").createInstance("hipi"); r.scaling.set(6.1, 2.6, 6.13); r.position.set(cx + s * 0, 3.4, cz + s * .5); r.isPickable = false;
      if (k % 2 === 0) { bx(10, .06, 4.8, 0, .07, 7.5, "#e6e0d0", false); bx(8.6, .08, 3.4, 0, .1, 7.5, "#46b6d9", false); }        // swimming pool
      else tree(cx + s * 9, cz + s * 7.5);
      tree(cx - 10.2, cz - 7); tree(cx + 10.2, cz - 7);
    }
    [[96, 1], [124, 1]].forEach((p, i) => { [[-46.5, 1], [-23.5, -1]].forEach((q, j) => amoPlot(p[0], q[0], q[1], i * 2 + j)); });

    // ---- sports stadium (block x 82..138, z 12..58) ----
    {
      const SX = 110, SZ = 35, g = (w, h, d, x, y, z, c, solid) => box(w, h, d, SX + x, y, SZ + z, c, solid);
      g(44, .05, 36, 0, .03, 0, "#9a9a92", false);                                              // concrete apron
      g(36, .06, 22, 0, .06, 0, "#3f9a3a", false);                                              // pitch
      for (let i = 0; i < 6; i += 2) g(6, .02, 22, -15 + i * 6, .1, 0, "#388a34", false);       // mowing stripes
      const ln = (w, d, x, z) => g(w, .02, d, x, .12, z, "#ffffff", false);
      ln(36, .2, 0, 11); ln(36, .2, 0, -11); ln(.2, 22, -18, 0); ln(.2, 22, 18, 0); ln(.2, 22, 0, 0);       // outline + halfway line
      [-1, 1].forEach(q => { ln(.2, 10, q * 13.5, 0); ln(4.5, .2, q * 15.75, 5); ln(4.5, .2, q * 15.75, -5); ln(.2, 10, q * 15.75, 0); g(.2, 2.4, .2, q * 18, 1.2, -1.8, "#ffffff", false); g(.2, 2.4, .2, q * 18, 1.2, 1.8, "#ffffff", false); g(.2, .2, 3.8, q * 18, 2.4, 0, "#ffffff", false); });
      const ring = B.MeshBuilder.CreateTorus("cc", { diameter: 6, thickness: .2, tessellation: 24 }, scene); ring.scaling.y = .1; ring.position.set(SX, .13, SZ); ring.material = mat("#ffffff"); ring.isPickable = false;
      const CL = ["#c8102e", "#fcd116", "#006b3f"];
      const stand = (cx, cz, len, dir, tiers, tdepth) => {   // dir: 0 = long side along x, 1 = short side along z; outward step layout
        for (let t = 0; t < tiers; t++) {
          const hgt = 1.2 * (t + 1), off = (t + .5) * tdepth;
          const px = dir ? cx + Math.sign(cx) * off : cx, pz = dir ? cz : cz + Math.sign(cz) * off;
          g(dir ? tdepth : len, hgt, dir ? len : tdepth, px, hgt / 2, pz, "#8a8a8a");
          for (let q = 0; q < 3; q++) g(dir ? .25 : len / 3, .06, dir ? len / 3 : .25, dir ? px - Math.sign(cx) * (tdepth / 2 - .35) : px - len / 3 + q * len / 3 + len / 3 - len / 3 + 0, hgt + .03, dir ? pz - len / 3 + q * len / 3 : pz - Math.sign(cz) * (tdepth / 2 - .35), CL[q], false);
        }
      };
      stand(0, 14.5, 44, 0, 3, 2.3);                                                              // north stand
      stand(-11.5, -14.5, 21, 0, 3, 2.3); stand(11.5, -14.5, 21, 0, 3, 2.3);                      // south stand with a 2 m entrance tunnel
      stand(-20, 0, 22, 1, 2, 2); stand(20, 0, 22, 1, 2, 2);                                      // west and east ends
      [[-23, -17], [23, -17], [-23, 17], [23, 17]].forEach(p => { g(.5, 14, .5, p[0], 7, p[1], "#555555"); g(2.4, .5, .9, p[0], 14.3, p[1], "#fffbe0", false); });   // floodlights
      const dt = new B.DynamicTexture("stn", { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#fcd116"; c.font = "bold 44px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ACCRA SPORTS STADIUM", 256, 66, 490); dt.update();
      const sn = B.MeshBuilder.CreatePlane("stsn", { width: 14, height: 3.5 }, scene); sn.position.set(SX, 6, SZ - 17.4); sn.isPickable = false;
      const mt = new B.StandardMaterial("stsm", scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false; sn.material = mt;
    }
    } catch (e) { banner("Amoamah/stadium: " + e.message); }

    // ===== POLICE DEPARTMENT, ACCRA HOSPITAL and CAR DEALERSHIP: real buildings with separate rooms =====
    try {
      const inB = (m, x0, x1, z0, z1) => m.position.x > x0 && m.position.x < x1 && m.position.z > z0 && m.position.z < z1;
      scene.meshes.filter(m => (m.name === "bd" || m.name === "rf") && (inB(m, 12, 58, 82, 112) || inB(m, 82, 138, 82, 112) || inB(m, 12, 58, -58, -12))).forEach(m => m.dispose());
      const roofs = [], dec = new B.TransformNode("facDeco", scene), PI = Math.PI;
      const D = (w, h, d, x, y, z, c) => { const m = B.MeshBuilder.CreateBox("d", { width: w, height: h, depth: d }, scene); m.parent = dec; m.position.set(x, y, z); m.material = mat(c); return m; };
      const I = (id, x, z, ry, sc) => { collider(id, x, z, ry, sc); return item(id, x, z, ry, false, sc, dec); };
      const SOLID = (w, h, d, x, y, z, c) => box(w, h, d, x, y, z, c);
      function bld(cx, cz, W, D2, wallCol, floorCol, inner, title, bg, fg, gap) {   // outer shell + inner walls [x, z, w, d] in local coordinates, front = -z
        const H = 4.2, w = (x, z, sw, sd) => box(sw, H, sd, cx + x, H / 2, cz + z, wallCol), g = gap || 5;
        w(0, D2 / 2, W, .4); w(-W / 2, 0, .4, D2); w(W / 2, 0, .4, D2);
        const hw = W / 2 - g / 2; w(-(W / 2 + g / 2) / 2, -D2 / 2, hw, .4); w((W / 2 + g / 2) / 2, -D2 / 2, hw, .4);
        inner.forEach(p => w(p[0], p[1], p[2], p[3]));
        box(W, .05, D2, cx, .03, cz, floorCol, false);
        { const hr = window.ACCRA_HIP ? window.ACCRA_HIP(/POLICE/.test(title) ? "#26385e" : /HOSPITAL/.test(title) ? "#a83232" : "#5f6670").createInstance("bldhip") : null;
          if (hr) { hr.scaling.set((W + 1.6) / 2, 3.4, (D2 + 1.6) / 2 / .75); hr.position.set(cx, H, cz); hr.isPickable = false; roofs.push([hr, cx, cz, W / 2, D2 / 2]); }
          else roofs.push([box(W + .8, .4, D2 + .8, cx, H + .2, cz, "#8a8a84", false), cx, cz, W / 2, D2 / 2]); }
        const dt = new B.DynamicTexture("fs", { width: 512, height: 128 }, scene, false), c = dt.getContext();
        c.fillStyle = bg; c.fillRect(0, 0, 512, 128); c.fillStyle = fg; c.font = "bold 44px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(title, 256, 66, 490); dt.update();
        const sn = B.MeshBuilder.CreatePlane("fsn", { width: 16, height: 4 }, scene); sn.position.set(cx, H + 2.4, cz - D2 / 2 - .5); sn.isPickable = false;
        const mt = new B.StandardMaterial("fsm", scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false; sn.material = mt;
      }
      const fl = (x, z, w, d, c) => box(w, .04, d, x, .06, z, c, false);
      // ---- POLICE DEPARTMENT: lobby, 2 offices, interview room, holding cells ----
      { const cx = 35, cz = 98;
        bld(cx, cz, 30, 18, "#dfe6ee", "#c9d3de", [[-9, -1, 12, .3], [9, -1, 12, .3], [-3, 0, .3, 2], [-3, 4.1, .3, 3.8], [-3, 8.1, .3, 1.8], [3, 0, .3, 2], [3, 4.1, .3, 3.8], [3, 8.1, .3, 1.8], [-9, 4.1, 12, .3], [11, 2.1, 8, .3], [11, 5.4, 8, .3]], "POLICE DEPARTMENT", "#1d3b6b", "#ffffff");
        fl(cx - 9, cz + 1.5, 11.5, 5, "#b9c6d6"); fl(cx - 9, cz + 6.5, 11.5, 4.5, "#cdbfa5"); fl(cx + 9, cz + 4, 11.5, 10, "#8f979f");
        SOLID(7, 1.1, 1.2, cx, .55, cz - 5.2, "#5a4a3a"); D(.6, .4, .05, cx - 1.5, 1.3, cz - 5.2, "#111");
        [-13, -11.2, -9.4].forEach(x => I("chair", cx + x, cz - 7, PI, .9));
        I("desk", cx - 14, cz + 1.5, PI / 2, 1); I("shelf", cx - 8, cz + .3, 0, 1); I("desk", cx - 14, cz + 6.8, PI / 2, 1); I("dining", cx - 8.5, cz + 6.8, 0, .9);
        for (let i = 0; i < 17; i++) D(.07, 3, .07, cx + 7, 1.5, cz - .8 + i * .6, "#555");
        [0, 3.3, 6.6].forEach(z => D(2.2, .45, .8, cx + 13.6, .22, cz + z + .6, "#7a7a7a"));
        box(.15, 8, .15, 18, 4, 86, "#cccccc", false); [["#c8102e", 7.6], ["#fcd116", 7.1], ["#006b3f", 6.6]].forEach(f => D(1.8, .5, .05, 18.95, f[1], 86, f[0]));
        D(6, .02, 10, cx, .07, 83, "#ffffff"); D(5.6, .03, 9.6, cx, .075, 83, "#3a3d42");
        A.createTrotro(scene, { position: [24, 0, 83], rotY: PI / 2, color: "#1d3b6b", stripe: "#ffffff" });
      }
      // ---- HOSPITAL: reception, emergency room, consulting room, pharmacy, 2 wards ----
      { const cx = 110, cz = 98;
        bld(cx, cz, 44, 24, "#f4f7fa", "#e6eef2", [[-19.5, -3, 5, .3], [-8.9, -3, 13.8, .3], [8, -3, 12, .3], [18.6, -3, 6.8, .3], [-11, 4.5, .3, 15], [-2, 0, .3, 6], [-2, 8.1, .3, 7.8], [2, 0, .3, 6], [2, 8.1, .3, 7.8], [9, 4.5, .3, 15], [11.5, 4.5, 5, .3], [18.6, 4.5, 6.8, .3]], "ACCRA HOSPITAL", "#ffffff", "#c8102e");
        D(4.4, 4.4, .3, cx, 9.4, cz - 12.4, "#ffffff"); D(1.2, 3.6, .4, cx, 9.4, cz - 12.5, "#c8102e"); D(3.6, 1.2, .4, cx, 9.4, cz - 12.5, "#c8102e");
        fl(cx - 16.5, cz + 4.5, 11, 15, "#d6e6ea"); fl(cx - 6.5, cz + 4.5, 9, 15, "#e0e8f0"); fl(cx + 5.5, cz + 4.5, 7, 15, "#e4efe0"); fl(cx + 15.5, cz + 4.5, 13, 15, "#dce8f0");
        SOLID(8, 1.1, 1.2, cx, .55, cz - 6.5, "#ffffff"); D(8.4, .1, 1.4, cx, 1.15, cz - 6.5, "#c8102e");
        [-10, -8, -6, 6, 8, 10].forEach(x => I("chair", cx + x, cz - 9.5, 0, .9));
        [-19, -14.5].forEach(x => I("bed1", cx + x, cz + 10.5, PI)); D(.7, 1.6, .5, cx - 21, .8, cz + 3, "#9aa7b0");
        I("desk", cx - 10, cz + 1, PI / 2, 1); I("bed1", cx - 4, cz + 10, PI);
        SOLID(5, 1, .8, cx + 5.5, .5, cz + 1.5, "#cfd6dc"); I("shelf", cx + 8.4, cz + 7, -PI / 2); I("shelf", cx + 8.4, cz + 9.4, -PI / 2);
        [-1.8, .8, 3.2].forEach(z => I("bed1", cx + 20.4, cz + z, -PI / 2)); [6, 8.5, 11].forEach(z => I("bed1", cx + 20.4, cz + z, -PI / 2));
        A.createTrotro(scene, { position: [100, 0, 83], rotY: PI / 2, color: "#f0f0f0", stripe: "#c8102e" });
      }
      // ---- CAR DEALERSHIP (Makola, east) ----
      { const cx = 35, cz = -35;
        bld(cx, cz, 36, 22, "#e4ebf0", "#d9dde3", [[12, 6, .3, 8], [14.5, 2.2, 5, .3]], "ACCRA MOTORS \u00B7 CAR DEALERSHIP", "#17191c", "#fcd116", 8);
        fl(cx, cz, 36, 22, "#e9eaee");
        const KIND = { "#f2f2f2": "landcruiser", "#b8bcc2": "sedan", "#1f4fa3": "hatch", "#17191c": "jeep", "#d11a2a": "bugatti", "#f2c200": "sports" };
        const car = (x, z, hex, ry) => { A.createCar(scene, KIND[hex] || "sedan", { color: hex, position: [x, 0, z], rotY: ry }); };
        [["#f2f2f2", -10, -2], ["#b8bcc2", 0, -2], ["#1f4fa3", 10, -2], ["#17191c", -10, 5], ["#d11a2a", 0, 5], ["#f2c200", 10, 5]].forEach(c => car(cx + c[1], cz + c[2], c[0], PI));
        SOLID(6, 1.1, 1.2, cx - 11, .55, cz + 9, "#5a4a3a");
      }
      const meshDec = mergeAsset(dec); if (meshDec) meshDec.isPickable = false;
      scene.onBeforeRenderObservable.add(() => { const p = player.position; roofs.forEach(r => r[0].setEnabled(!(Math.abs(p.x - r[1]) < r[3] + .5 && Math.abs(p.z - r[2]) < r[4] + .5))); });
      window.ACCRA_PLACES = {
        pd: { x: 35, z: 94.4, ox: 35, oz: 84, depot: { x: 35, z: 83, h: Math.PI } },
        hp: { x: 110, z: 89.5, ox: 110, oz: 82, depot: { x: 110, z: 81, h: Math.PI } },
        dealer: { x: 24, z: -26, ox: 35, oz: -50 }
      };
    } catch (e) { banner("Police/Hospital/Dealership: " + e.message); }

    // ===== THE ACCRA VIBES PUB (Osu): glass front, bar, football TVs, dance floor, rooftop deck, patio and parking =====
    try {
      const PX = -110, PZ = -41, PH = 4.6;   // 34 x 18 m, front wall faces -z (the road)
      scene.meshes.filter(m => (m.name === "bd" || m.name === "rf") && m.position.x > -136 && m.position.x < -86 && m.position.z < -34 && m.position.z > -60).forEach(m => m.dispose());
      ITEMS.pubchair = ["Pub chair", 0, [[.45, .06, .45, 0, .45, 0, "#6b4a2e"], [.45, .5, .05, 0, .72, -.2, "#6b4a2e"], [.05, .45, .05, -.18, .22, -.18, "#3a2a1c"], [.05, .45, .05, .18, .22, -.18, "#3a2a1c"], [.05, .45, .05, -.18, .22, .18, "#3a2a1c"], [.05, .45, .05, .18, .22, .18, "#3a2a1c"]]];
      const dec = new B.TransformNode("pubDeco", scene), roofN = new B.TransformNode("pubRoof", scene), emc = {};
      const em = hex => emc[hex] || (emc[hex] = Object.assign(new B.StandardMaterial("pem" + hex, scene), { emissiveColor: B.Color3.FromHexString(hex), disableLighting: true }));
      const glass = Object.assign(new B.StandardMaterial("pubglass", scene), { diffuseColor: B.Color3.FromHexString("#8fc8e8"), alpha: .22, specularColor: new B.Color3(.6, .6, .6) });
      const pb = (w, h, d, x, y, z, c, par, m) => { const q = B.MeshBuilder.CreateBox("pd", { width: w, height: h, depth: d }, scene); q.parent = par || dec; q.position.set(PX + x, y, PZ + z); q.material = m || mat(c); q.isPickable = false; return q; };
      const solid = (w, h, d, x, y, z) => { const q = box(w, h, d, PX + x, y, PZ + z, "#000"); q.isVisible = false; sg.removeShadowCaster(q); return q; };
      const wall = (x, z, w, d) => box(w, PH, d, PX + x, PH / 2, PZ + z, "#2b2b30");
      wall(-14.1, 9, 5.8, .4); wall(4.1, 9, 25.8, .4); wall(-17, 0, .4, 18); wall(17, 0, .4, 18);
      [-10, 10].forEach(x => { const g = box(14, 3.2, .15, PX + x, 1.6, PZ - 9, "#8fc8e8"); g.material = glass; sg.removeShadowCaster(g); });   // glass shop-front, 6 m doorway between
      [-17, -3, 3, 17].forEach(x => box(.5, PH, .5, PX + x, PH / 2, PZ - 9, "#17171a")); box(34, 1.4, .5, PX, 3.9, PZ - 9, "#141416");
      // ---- signs ----
      const sign = (w, h, x, y, z, draw) => { const t = new B.DynamicTexture("ps", { width: 512, height: Math.round(512 * h / w) }, scene, false), c = t.getContext(); draw(c, 512, Math.round(512 * h / w)); t.update();
        const m = B.MeshBuilder.CreatePlane("psn", { width: w, height: h }, scene); m.position.set(PX + x, y, PZ + z); m.isPickable = false;
        const mt = new B.StandardMaterial("psm", scene); mt.diffuseTexture = t; mt.emissiveTexture = t; mt.disableLighting = true; mt.backFaceCulling = false; m.material = mt; };
      sign(15, 3.4, 0, 3.9, -9.4, (c, w, h) => { c.fillStyle = "#141416"; c.fillRect(0, 0, w, h); c.shadowColor = "#ffb000"; c.shadowBlur = 16; c.fillStyle = "#ffd23f"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 62px system-ui"; c.fillText("The Accra Vibes", w / 2, h * .38, 490); c.fillStyle = "#ffffff"; c.font = "bold 44px system-ui"; c.fillText("PUB", w / 2, h * .78); });
      sign(3, 5, -19.5, 3.2, -9.4, (c, w, h) => { c.fillStyle = "#141416"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd23f"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#ffd23f"; c.textAlign = "center"; c.font = "bold 46px system-ui"; ["BEERS", "COCKTAILS", "SPIRITS", "LOCAL", "DRINKS", "FOOD"].forEach((t, i) => c.fillText(t, w / 2, 90 + i * 120, 440)); });
      sign(1.6, 2.2, 15.5, 1.15, -14.2, (c, w, h) => { c.fillStyle = "#1c2420"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.textAlign = "center"; c.font = "bold 40px system-ui"; c.fillText("Today's Specials", w / 2, 60, 470); c.font = "34px system-ui"; ["Accra Lager", "Club Beer", "Star Beer", "Cocktails", "Grilled Chicken", "Jollof Rice", "Banku & Tilapia"].forEach((t, i) => c.fillText(t, w / 2, 130 + i * 58, 470)); });
      [["#c8102e", 4.3], ["#fcd116", 4.0], ["#006b3f", 3.7]].forEach(f => pb(1.8, .3, .05, 14.5, f[1], -9.3, f[0]));
      // ---- floors ----
      pb(33.6, .05, 17.6, 0, .03, 0, "#5a3d2b"); pb(40, .05, 7, 0, .04, -12.5, "#8a7a6a");
      pb(11, .06, 10, 10.5, .07, 3, null, null, ck("#2a1450", "#6a2fa0", 5, 5));
      [[0, 8.3, 11, .3], [0, -2.3, 11, .3], [-5.3, 3, .3, 10.6], [5.3, 3, .3, 10.6]].forEach(e => { void e; });
      const pm = new B.StandardMaterial("pubpulse", scene); pm.disableLighting = true;
      [[10.5, -1.9, 11, .25], [10.5, 7.9, 11, .25], [5.1, 3, .25, 10], [15.9, 3, .25, 10]].forEach(e => { const q = pb(e[2], .04, e[3], e[0], .1, e[1], null, null, pm); q.parent = null; });
      // ---- bar, shelves, fridge, stools ----
      pb(14, 1.15, 1.1, -5.5, .575, 3.2, "#3a2418"); pb(14.4, .1, 1.3, -5.5, 1.2, 3.2, "#1c120c"); pb(14, .08, .05, -5.5, .45, 2.62, null, null, em("#ff9a3c")); solid(14, 1.2, 1.1, -5.5, .6, 3.2);
      pb(8.4, 2.8, .5, -2.8, 1.4, 8.6, "#2a1a10"); solid(8.4, 2.8, .5, -2.8, 1.4, 8.6);   // shortened: the VIP doorway (x -11.2 to -8.8) must stay open
      [.95, 1.65, 2.35].forEach((y, r) => { pb(8.4, .05, .45, -2.8, y, 8.3, "#4a3220"); pb(8.0, .04, .05, -2.8, y + .04, 8.0, null, null, em("#ffcf7a")); for (let i = 0; i < 9; i++) pb(.12, .32, .12, -6.6 + i * .93, y + .2, 8.35, ["#2f8f4a", "#c98a2e", "#d9e2e6", "#8a2a2a"][(i + r) % 4]); });
      pb(1.6, 2.1, .7, 5.3, 1.05, 8.5, "#1f1f24"); pb(1.4, 1.8, .05, 5.3, 1.05, 8.12, null, null, em("#9fd8ff")); solid(1.6, 2.1, .7, 5.3, 1.05, 8.5);
      const seats = [];
      for (let i = 0; i < 6; i++) { const x = -10.5 + i * 2; pb(.45, .08, .45, x, .72, 1.9, "#1c1c1f"); pb(.08, .7, .08, x, .36, 1.9, "#555"); seats.push({ x: PX + x, z: PZ + 1.9, ry: Math.PI, sh: .75 }); }
      // ---- tables and chairs ----
      const table = (x, z, par, y0) => { pb(1.2, .06, 1.2, x, (y0 || 0) + .75, z, "#3a2a1c", par); pb(.14, .72, .14, x, (y0 || 0) + .36, z, "#222", par); };
      const chairs3 = (x, z, par, y0, reg) => [[0, -1, 0], [0, 1, Math.PI], [1, 0, -Math.PI / 2]].forEach(c => { item("pubchair", PX + x + c[0], PZ + z + c[1], c[2], false, 1, par).position.y = y0 || 0; if (reg) seats.push({ x: PX + x + c[0], z: PZ + z + c[1], ry: c[2], sh: .46 }); });
      [[-13, -6], [-8, -6], [-13, -1.5], [-8, -1.5], [7, -6.5], [13, -6.5]].forEach(t => { table(t[0], t[1]); solid(1.2, .8, 1.2, t[0], .4, t[1]); chairs3(t[0], t[1], dec, 0, true); });
      [-12, -7, 7, 12].forEach(x => { table(x, -13); solid(1.2, .8, 1.2, x, .4, -13); chairs3(x, -13, dec, 0, true); });
      // ---- football TVs ----
      const pitch = new B.DynamicTexture("pitch", { width: 256, height: 144 }, scene, false), pc = pitch.getContext();
      pc.fillStyle = "#2f8f3a"; pc.fillRect(0, 0, 256, 144); pc.strokeStyle = "#fff"; pc.lineWidth = 3; pc.strokeRect(12, 12, 232, 120); pc.beginPath(); pc.moveTo(128, 12); pc.lineTo(128, 132); pc.stroke(); pc.beginPath(); pc.arc(128, 72, 20, 0, 6.3); pc.stroke(); pc.fillStyle = "#fcd116"; pc.fillRect(8, 2, 60, 10); pitch.update();
      const pitchM = Object.assign(new B.StandardMaterial("pitchm", scene), { emissiveTexture: pitch, disableLighting: true, backFaceCulling: false });
      const tv = (x, y, z, ry, par) => { const n = new B.TransformNode("tv", scene); n.parent = par || dec; n.position.set(PX + x, y, PZ + z); n.rotation.y = ry;
        const f = B.MeshBuilder.CreateBox("tvf", { width: 2.5, height: 1.45, depth: .12 }, scene); f.parent = n; f.position.z = -.07; f.material = mat("#0b0b0e");
        const s = B.MeshBuilder.CreatePlane("tvs", { width: 2.3, height: 1.3 }, scene); s.parent = n; s.rotation.y = Math.PI; s.material = pitchM; };
      tv(9.5, 2.9, 8.3, Math.PI); tv(-16.6, 2.7, -3, Math.PI / 2); tv(16.6, 2.7, -3, -Math.PI / 2);
      // ---- speakers, DJ booth, lamps ----
      [[15.7, 8.3], [15.7, -1.6], [-16, -8.2], [16, -8.2]].forEach(p => { pb(.7, 1.5, .6, p[0], .75, p[1], "#101012"); pb(.4, .4, .05, p[0], .45, p[1] + (p[1] > 0 ? -.33 : .33), "#333"); pb(.25, .25, .05, p[0], 1.1, p[1] + (p[1] > 0 ? -.33 : .33), "#333"); });
      pb(3, 1.1, 1.2, 12.5, .55, 8, "#1a1a1f"); pb(2.6, .06, .8, 12.5, 1.13, 8, null, null, em("#7a5cff")); solid(3, 1.1, 1.2, 12.5, .55, 8);
      for (let i = 0; i < 12; i++) { const x = -13 + (i % 6) * 5.2, z = i < 6 ? -5 : 1; pb(.05, .9, .05, x, 4.15, z, "#222"); pb(.45, .25, .45, x, 3.65, z, null, null, em("#ffcf7a")); }
      for (let i = 0; i < 6; i++) pb(.8, .06, .8, -13.5 + i * 2.4 + 0, 0.1, 5.2, "#000", null, em("#3c2a14")).visibility = 0;
      // ---- patio: railing, plants, parking, cars, street lamp ----
      [[-10, 14], [10, 14]].forEach(r => { const q = box(r[1], 1, .06, PX + r[0], 1, PZ - 16, "#1a1a1d"); sg.removeShadowCaster(q); }); for (let i = 0; i < 18; i++) if (Math.abs(-16.5 + i * 2) > 3) pb(.08, 1, .08, -16.5 + i * 2, .5, -16, "#1a1a1d");
      [[-16, -10], [-4.6, -10], [4.6, -10], [16, -10], [-16, -15], [16, -15]].forEach(p => { pb(.7, .7, .7, p[0], .35, p[1], "#3a3a3a"); const s = B.MeshBuilder.CreateSphere("pl", { diameter: 1.1, segments: 5 }, scene); s.convertToFlatShadedMesh(); s.parent = dec; s.position.set(PX + p[0], 1.25, PZ + p[1]); s.scaling.y = 1.4; s.material = mat("#2f8f4a"); s.isPickable = false; });
      pb(40, .05, 5.2, 0, .045, -20.6, "#3a3a3e"); for (let i = 0; i < 9; i++) pb(.12, .02, 4.4, -18 + i * 4.5, .08, -20.6, "#ffffff");
      const miniCar = (x, z, col) => { pb(1.9, .7, 4.2, x, .65, z, col); pb(1.6, .55, 2.2, x, 1.28, z - .1, "#1a2530"); pb(1.55, .06, 1.9, x, 1.58, z - .1, col); [-1, 1].forEach(a => [-1.4, 1.4].forEach(b => pb(.25, .6, .6, x + a * .95, .3, z + b, "#111"))); [-.6, .6].forEach(a => { pb(.4, .15, .05, x + a, .7, z + 2.12, null, null, em("#fff6d6")); pb(.4, .12, .05, x + a, .7, z - 2.12, null, null, em("#ff2a2a")); }); };
      miniCar(-11, -20.6, "#e8e8e8"); miniCar(-6.5, -20.6, "#2f5fd0"); miniCar(6.5, -20.6, "#1d2f6b"); miniCar(11, -20.6, "#d8d8d8");
      pb(.15, 6, .15, -19, 3, -17, "#333"); pb(.9, .2, .5, -18.5, 6, -17, null, null, em("#ffcf7a"));
      // ---- WINE & SPIRITS counter (back wall) ----
      pb(5, 1.1, 1, 1.5, .55, 7.8, "#2a1a10"); solid(5, 1.1, 1, 1.5, .55, 7.8); pb(5.2, .06, 1.2, 1.5, 1.13, 7.8, "#c9a54a");
      pb(5, 2.4, .4, 1.5, 1.4, 8.7, "#3a2514");
      for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) pb(.14, .36, .14, -.6 + c * .37, 1.0 + r * .5, 8.45, ["#5a1224", "#2d5a2a", "#c8a02a", "#3a1a4a"][(r + c) % 4]);
      sign(4, .8, 1.5, 3.2, 8.6, (c, w, h) => { c.fillStyle = "#141416"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8c86a"; c.font = "bold 62px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("WINE & SPIRITS", w / 2, h / 2, w - 20); });
      // ---- VIP LOUNGE: annex behind the pub, neon purple light, velvet seating, a bouncer on the door ----
      ITEMS.vipsofa = ["VIP sofa", 0, [[2.2, .45, .9, 0, .25, 0, "#4b1d6e"], [2.2, .6, .25, 0, .75, -.35, "#5c2488"], [.25, .35, .9, -1, .5, 0, "#3d1759"], [.25, .35, .9, 1, .5, 0, "#3d1759"], [2.1, .05, .8, 0, .5, .02, "#6a2f9a"]]];
      wall(-17, 13.6, .4, 8.8); wall(-4, 13.6, .4, 8.8); wall(-10.5, 18, 13.4, .4);
      pb(13, .05, 8.8, -10.5, .04, 13.6, "#1b1026");
      [[-10.5, 17.6, 12.6, .1], [-10.5, 9.6, 12.6, .1]].forEach(n => pb(n[2], n[3], .1, n[0], .18, n[1], null, null, em("#b04dff")));
      [[-16.6, 13.6], [-4.4, 13.6]].forEach(n => pb(.1, .1, 8.4, n[0], .18, n[1], null, null, em("#b04dff")));
      [-14, -10.5, -7].forEach(x => pb(.14, .06, 8, x, 3.95, 13.6, null, null, em("#c470ff")));
      [[-10.5, 16.9, Math.PI], [-15.9, 13.6, Math.PI / 2], [-5.1, 13.6, -Math.PI / 2]].forEach(q => { item("vipsofa", PX + q[0], PZ + q[1], q[2], false, 1, dec); solid(2.2, .8, 1, q[0], .4, q[1]).rotation.y = q[2]; });
      pb(1.5, .06, 1.5, -10.5, .58, 13.6, "#14081f"); pb(.18, .55, .18, -10.5, .28, 13.6, "#c9a54a"); solid(1.5, .6, 1.5, -10.5, .3, 13.6);
      [[-10.9, 13.3, "#c9a54a"], [-10.1, 13.9, "#1d6b3a"], [-10.5, 14.3, "#b04dff"]].forEach(b => pb(.12, .34, .12, b[0], .78, b[1], b[2]));
      sign(4.2, 1, -10.5, 3.3, 17.7, (c, w, h) => { c.fillStyle = "#12061c"; c.fillRect(0, 0, w, h); c.shadowColor = "#b04dff"; c.shadowBlur = 22; c.fillStyle = "#e6b8ff"; c.font = "bold 90px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("VIP LOUNGE", w / 2, h / 2, w - 30); });
      sign(3.4, .8, -10, 3.4, 8.7, (c, w, h) => { c.fillStyle = "#12061c"; c.fillRect(0, 0, w, h); c.shadowColor = "#b04dff"; c.shadowBlur = 18; c.fillStyle = "#e6b8ff"; c.font = "bold 80px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("VIP \u2192", w / 2, h / 2, w - 20); });
      const vipGate = solid(2.4, 2.6, .5, -10, 1.3, 9.1);   // the bouncer's rope: only solid while you have no VIP pass
      const vipRoof = box(14.2, .4, 9.6, PX - 10.5, PH + .2, PZ + 13.6, "#2a2a2e", false);
      const vlight = new B.PointLight("viplight", new B.Vector3(PX - 10.5, 3, PZ + 13.6), scene); vlight.diffuse = B.Color3.FromHexString("#b04dff"); vlight.intensity = .85; vlight.range = 13;
      scene.onBeforeRenderObservable.add(() => { const p = player.position; vlight.setEnabled(Math.hypot(p.x - PX, p.z - PZ) < 40); vipRoof.setEnabled(!(Math.abs(p.x - (PX - 10.5)) < 7.2 && Math.abs(p.z - (PZ + 13.6)) < 5)); });
      const bnc = A.createCharacter(scene, { shirt: "#0d0d0f", pants: "#0d0d0f", skin: "#4a2c1c", hair: "#0d0d0d", kente: false, scale: .9 }); bnc.root.position.set(PX - 8.6, 0, PZ + 8.4); bnc.root.rotation.y = Math.PI * 1.25;
      tag("Bouncer \u00B7 VIP", PX - 8.6, 2.6, PZ + 8.4, 2.4);
      // ---- rooftop deck (hides while you are inside) ----
      const rb = (w, h, d, x, y, z, c, m) => pb(w, h, d, x, y, z, c, roofN, m);
      rb(34.6, .4, 18.6, 0, PH + .2, 0, "#2a2a2e"); rb(33, .05, 17, 0, PH + .42, 0, "#6d5a46");
      for (let i = 0; i < 12; i++) { rb(.08, 1.1, .08, -16.5 + i * 3, PH + 1, -8.7, "#1a1a1d"); rb(.08, 1.1, .08, -16.5 + i * 3, PH + 1, 8.7, "#1a1a1d"); } rb(33, .06, .06, 0, PH + 1.5, -8.7, "#1a1a1d"); rb(33, .06, .06, 0, PH + 1.5, 8.7, "#1a1a1d");
      [[-12, -4], [-6, -4], [0, -4], [6, -4], [12, -4], [-9, 3], [3, 3], [11, 3]].forEach(t => { table(t[0], t[1], roofN, PH + .42); chairs3(t[0], t[1], roofN, PH + .42, false); });
      for (let i = 0; i < 14; i++) rb(.14, .14, .14, -16 + i * 2.4, PH + 2.7, -8, null, em("#ffe9a0")); for (let i = 0; i < 14; i++) rb(.14, .14, .14, -16 + i * 2.4, PH + 2.7, 8, null, em("#ffe9a0"));
      tv(-10, PH + 1.9, 8.4, Math.PI, roofN); tv(10, PH + 1.9, 8.4, Math.PI, roofN);
      const roofM = mergeAsset(roofN); const decM = mergeAsset(dec); if (decM) decM.isPickable = false;
      // ---- bartender, warm light, disco colours ----
      const bt = A.createCharacter(scene, { shirt: "#1d1d22", pants: "#1d1d22", skin: "#6b4028", hair: "#0d0d0d", kente: false, scale: .85 }); bt.root.position.set(PX - 5.5, 0, PZ + 4.7); bt.root.rotation.y = Math.PI;
      tag("Kwame \u00B7 Bartender", PX - 5.5, 2.5, PZ + 4.7, 2.4);
      const pl = new B.PointLight("publight", new B.Vector3(PX, 3.2, PZ + 1), scene); pl.diffuse = B.Color3.FromHexString("#ffb066"); pl.intensity = .55; pl.range = 26;
      const ball = B.MeshBuilder.CreateSphere("discoball", { diameter: .8, segments: 8 }, scene); ball.convertToFlatShadedMesh(); ball.position.set(PX + 10.5, 3.9, PZ + 3); ball.material = pm; ball.isPickable = false;
      let phs = 0;
      scene.onBeforeRenderObservable.add(() => {
        const p = player.position, inside = Math.abs(p.x - PX) < 17.5 && Math.abs(p.z - PZ) < 9.5, near = Math.hypot(p.x - PX, p.z - PZ) < 48;
        if (roofM) roofM.setEnabled(!inside); pl.setEnabled(near);
        if (near) { phs += engine.getDeltaTime() / 1000; pm.emissiveColor = B.Color3.FromHSV((phs * 70) % 360, .85, 1); ball.rotation.y += .02; }
      });
      window.ACCRA_PLACES = Object.assign(window.ACCRA_PLACES || {}, { pub: { bar: { x: PX - 5.5, z: PZ + .6 }, dance: { x: PX + 10.5, z: PZ + 3 }, seats, ox: PX, oz: PZ - 23 } });
      window.ACCRA_PLACES.pub.vip = { gate: vipGate, door: { x: PX - 8.9, z: PZ + 7.6 }, in: { x: PX - 10.5, z: PZ + 13.6, hw: 6.5, hd: 4.4 } };
      window.ACCRA_PLACES.pub.wine = { x: PX + 1.5, z: PZ + 6.2 };
    } catch (e) { banner("Pub: " + e.message); }

    // ===== LAYOUT GUARD: no older building may overlap or poke into anything new (runs before roofs are added) =====
    try {
      const FOOT = { mall: [14, 56, 16, 54], pub: [-128, -80, -61, -31], pubVIP: [-128, -113, -32, -21], police: [19, 51, 88, 108], hospital: [87, 133, 85, 111],
        dealer: [17, 53, -46, -24], stadium: [85, 135, 13, 57], amoamah: [81, 139, -59, -11] };
      let gone = 0;
      scene.meshes.filter(m => m.name === "bd" || m.name === "rf").forEach(m => {
        const e = m.getBoundingInfo().boundingBox.extendSize, x = m.position.x, z = m.position.z;
        for (const k in FOOT) { const f = FOOT[k]; if (x + e.x > f[0] - 1.2 && x - e.x < f[1] + 1.2 && z + e.z > f[2] - 1.2 && z - e.z < f[3] + 1.2) { m.dispose(); gone++; break; } }
      });
      window.ACCRA_LAYOUT = { cleared: gone, footprints: FOOT };
    } catch (e) { banner("Layout guard: " + e.message); }

    // ---------- 1. TIN ROOFS on low and mid-rise buildings ----------
    const roofSrc = {};
    function prismSrc(hex) {
      if (roofSrc[hex]) return roofSrc[hex];
      const gp = new B.TransformNode("gp", scene); gp.rotation.z = Math.PI / 2;
      const p = B.MeshBuilder.CreateCylinder("rp", { diameter: 2, tessellation: 3, height: 1 }, scene);
      p.convertToFlatShadedMesh(); p.rotation.x = Math.PI / 2; p.parent = gp;
      gp.computeWorldMatrix(true); p.computeWorldMatrix(true);
      const m = B.Mesh.MergeMeshes([p], true, true);
      m.material = mat(hex); m.isVisible = false; m.isPickable = false;
      return (roofSrc[hex] = m);
    }
    const flatRoofs = {};
    scene.meshes.forEach(m => { if (m.name === "rf") flatRoofs[m.position.x.toFixed(1) + "," + m.position.z.toFixed(1)] = m; });
    const RC = ["#b5472c", "#4a5d7a", "#2f6f4f", "#8a8a84", "#8b3a2a", "#3d5a80"];
    const AW = ["#c8553d", "#2456a6", "#d9822b", "#3f8f7a"];

    // ---------- 2. STRIPED SHOP AWNINGS (Makola buildings) ----------
    const awnSrc = {};
    function awningSrc(hex) {
      if (awnSrc[hex]) return awnSrc[hex];
      const t = new B.DynamicTexture("aw", { width: 64, height: 8 }, scene, false), c = t.getContext();
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#ffffff" : hex; c.fillRect(i * 8, 0, 8, 8); }
      t.update();
      const m = B.MeshBuilder.CreateBox("awn", { width: 1, height: 0.08, depth: 1 }, scene);
      const mt = new B.StandardMaterial("awm" + hex, scene);
      mt.diffuseTexture = t; mt.specularColor = B.Color3.Black();
      m.material = mt; m.isVisible = false; m.isPickable = false;
      return (awnSrc[hex] = m);
    }
    const nearest = v => R.reduce((a, r) => Math.abs(v - r) < Math.abs(a) ? v - r : a, 1e9);
    function awning(b, w, d, col) {
      const dx = nearest(b.position.x), dz = nearest(b.position.z);
      let ox = 0, oz = 0, W, half;
      if (Math.abs(dz) <= Math.abs(dx)) { oz = -Math.sign(dz) || 1; W = w - 0.6; half = d / 2; }
      else { ox = -Math.sign(dx) || 1; W = d - 0.6; half = w / 2; }
      const i = awningSrc(col).createInstance("awi");
      i.scaling.set(W, 1, 1.5);
      i.rotation.set(0.3, Math.atan2(ox, oz), 0);
      i.position.set(b.position.x + ox * (half + 0.7), 3.1, b.position.z + oz * (half + 0.7));
      i.isPickable = false;
    }

    let n = 0;
    scene.meshes.filter(m => m.name === "bd").forEach(b => {
      const e = b.getBoundingInfo().boundingBox.extendSize, w = e.x * 2, h = e.y * 2, d = e.z * 2;
      if (h > 20 || w < 6) return;                       // leave the tall glass towers alone
      const rf = flatRoofs[b.position.x.toFixed(1) + "," + b.position.z.toFixed(1)];
      if (rf) rf.setEnabled(false);
      const span = Math.min(w, d), len = Math.max(w, d), rh = Math.min(span * 0.2, 3.2), sy = rh / 1.5;
      const r = prismSrc(RC[n % RC.length]).createInstance("rfi");
      r.scaling.set((span + 1) / 1.732, sy, len + 1);
      r.rotation.y = w > d ? Math.PI / 2 : 0;
      r.position.set(b.position.x, h + 0.5 * sy, b.position.z);
      r.isPickable = false;
      if (w <= 9.4 && h <= 6.3) awning(b, w, d, AW[n % AW.length]);
      n++;
    });

    // ---------- 3. KIOSKS and TROTROS along the streets ----------
    function mergeAsset(root) {
      root.computeWorldMatrix(true);
      const ms = root.getChildMeshes();
      ms.forEach(m => m.computeWorldMatrix(true));
      const m = B.Mesh.MergeMeshes(ms, true, true, undefined, false, true);
      root.dispose(true, false);
      return m;
    }
    function placer(make) {            // first placement is the real mesh, the rest are cheap instances
      let src = null;
      return (x, z, ry) => {
        let m;
        if (!src) { src = mergeAsset(make()); m = src; sg.addShadowCaster(m); m.receiveShadows = true; }
        else m = src.createInstance("i");
        m.position.set(x, 0, z); m.rotation.y = ry; m.checkCollisions = true;
        return m;
      };
    }
    const kiosks = [
      placer(() => A.createKiosk(scene, { color: "#d9382c", awning: "#ffd23f" })),
      placer(() => A.createKiosk(scene, { color: "#2f7fd0", awning: "#ffffff" })),
      placer(() => A.createKiosk(scene, { color: "#2f8f5a", awning: "#ffd23f" }))
    ];
    const trotros = [
      placer(() => A.createTrotro(scene, {})),
      placer(() => A.createTrotro(scene, { color: "#f0f0f0", stripe: "#006b3f" }))
    ];
    R.forEach((c, k) => {
      const odd = k % 2;
      const s1 = odd ? 1 : -1, s2 = odd ? -1 : 1;
      kiosks[k % 3](odd ? -100 : 40, c + s1 * 9.2, s1 > 0 ? Math.PI : 0);                       // road along X
      kiosks[(k + 1) % 3](c + s2 * 9.2, odd ? 40 : -100, s2 > 0 ? -Math.PI / 2 : Math.PI / 2);   // road along Z
      const lane = odd ? 2 : -2;
      trotros[k % 2](odd ? 105 : -35, c + lane, lane > 0 ? Math.PI / 2 : -Math.PI / 2);          // parked in lane
      trotros[(k + 1) % 2](c + lane, odd ? -35 : 105, lane > 0 ? 0 : Math.PI);
    });

    // ---- smoothness: render fewer pixels when the phone struggles, refresh shadows every other frame ----
    try {
      const smap = sg.getShadowMap(); if (smap) smap.refreshRate = 2;
      let fr = 0;
      scene.onBeforeRenderObservable.add(() => {
        if (++fr % 120 || fr > 2400) return;
        const lv = engine.getHardwareScalingLevel();
        if (engine.getFps() < 40 && lv < 1) engine.setHardwareScalingLevel(Math.min(1, lv + .17));
      });
    } catch (e) {}
    window.ACCRA_KIT = { item, ITEMS, note, show, hide, ttl, BS, GOLD, cash, pay, ls, sv, styler, points: POINTS, MX, MZ, collider, tag, keep: () => { lock = true; } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).upgrade = 1;
    const lifeJs = document.createElement("script"); window.ACCRA_BUILD = window.ACCRA_BUILD || 64; lifeJs.src = "accra-life.js?v=" + window.ACCRA_BUILD; lifeJs.onerror = () => banner("accra-life.js was not found. Upload it to your repo."); document.body.appendChild(lifeJs);
    const locJs = document.createElement("script"); locJs.src = "AccraLocations.js?v=" + (window.ACCRA_BUILD || 64);
    locJs.onload = () => {
      try {
        if (typeof window.AccraLocations !== "function") { banner("AccraLocations.js on your site is the OLD module version (import/export), so it cannot run. Upload the fixed AccraLocations.js and reload."); return; }
        window.ACCRA_LOC = new window.AccraLocations(scene); window.ACCRA_LOC.buildFullAccraMap();
      } catch (e) { banner("AccraLocations: " + e.message); }
    };
    locJs.onerror = () => banner("AccraLocations.js was not found. Upload it to the same folder as babylon.html.");
    document.body.appendChild(locJs);
    console.log("Accra upgrade loaded:", n, "roofs");
  } catch (err) {
    console.error("accra-upgrade failed (game still runs):", err); banner("Upgrade stopped: " + (err && err.message));
  }
})();
