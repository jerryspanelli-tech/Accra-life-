/* accra-mining.js - Accra Stone Quarry (east, z -150) and Accra Gold Works (east, z +120).
 * Node-based mining: rocks and ore veins you can mine with a pickaxe or jackhammer, with swing animation and sounds,
 * loot that goes into your resources, a foreman who sells tools and buys ore, and nodes that regrow. Loaded by accra-life.js. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
    if (!L) { console.log("accra-mining: life API not ready"); return; }
    const B = BABYLON, { st, cash, pay, earn, note, show, hide, ttl, BS, CLOSE, points, AV, save } = L;
    const sfx = n => { const a = window.ACCRA_AUDIO; if (a && a.sfx) a.sfx(n); };
    st.res = st.res || { stone: 0, goldore: 0, nugget: 0 }; st.tool = st.tool || { pick: 0, jack: 0 };
    window.playerInventory.resources = st.res;

    // ---------- data ----------
    const TOOLS = { pick: ["Pickaxe", 80, 60, 1], jack: ["Jackhammer", 250, 40, 3] };      // name, price, uses, power
    const ITEMS = { stone: ["Stone", 6], goldore: ["Gold ore", 25], nugget: ["Gold nugget", 150] };
    const NODE = {
      stone: { name: "Rock", hp: 4, back: 120, col: "#8c8c88", loot: p => ({ stone: 2 + Math.floor(Math.random() * 3) * p }) },
      gold: { name: "Gold vein", hp: 5, back: 300, col: "#5a5248", loot: p => { const o = { goldore: 1 + Math.floor(Math.random() * 2) * p }; if (Math.random() < .15 * p) o.nugget = 1; return o; } }
    };
    const gmat = new B.StandardMaterial("goldfleck", scene); gmat.diffuseColor = B.Color3.FromHexString("#f2c230"); gmat.emissiveColor = new B.Color3(.5, .38, .05);

    // ---------- site builders (plain boxes, a few hundred triangles) ----------
    const bx = (w, h, d, x, y, z, c, solid) => box(w, h, d, x, y, z, c, !!solid);
    function sign(text, x, y, z, ry) {
      const dt = new B.DynamicTexture("mnsn", { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#fcd116"; c.font = "bold 44px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 256, 66, 490); dt.update();
      const p = B.MeshBuilder.CreatePlane("mnsp", { width: 10, height: 2.5 }, scene); p.position.set(x, y, z); p.rotation.y = ry || 0; p.isPickable = false;
      const m = new B.StandardMaterial("mnsm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; p.material = m;
    }
    const spin = [];                                            // machinery parts that rotate while you are nearby
    const drum = (x, y, z, d, len, c, axis) => { const m = B.MeshBuilder.CreateCylinder("drum", { diameter: d, height: len, tessellation: 12 }, scene); m.position.set(x, y, z); m.material = mat(c); m.isPickable = false; if (axis === "x") m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; spin.push({ m, axis, x, z }); return m; };
    const cone = (x, z, r, h, c) => { const m = B.MeshBuilder.CreateCylinder("heap", { diameterTop: 0, diameterBottom: r * 2, height: h, tessellation: 7 }, scene); m.convertToFlatShadedMesh(); m.position.set(x, h / 2, z); m.material = mat(c); m.isPickable = false; };
    const nodes = [];
    function node(kind, x, z, s) {
      const m = B.MeshBuilder.CreateIcoSphere("node", { radius: 1.15 * s, subdivisions: 1 }, scene); m.convertToFlatShadedMesh();
      m.position.set(x, .8 * s, z); m.scaling.y = .75; m.rotation.y = Math.random() * 6; m.material = mat(NODE[kind].col); m.checkCollisions = true; m.isPickable = false;
      const flecks = [];
      if (kind === "gold") for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, f = B.MeshBuilder.CreateBox("fleck", { size: .2 }, scene); f.position.set(x + Math.cos(a) * .85 * s, .8 * s + Math.random() * .6, z + Math.sin(a) * .85 * s); f.material = gmat; f.isPickable = false; flecks.push(f); }
      const n = { kind, x, z, m, flecks, s, hp: NODE[kind].hp, back: 0 }; nodes.push(n); return n;
    }
    // Quarry
    const QX = 215, QZ = -150;
    bx(44, .1, 34, QX, .05, QZ, "#b9b3a3");
    [0, 1, 2].forEach(i => { bx(44 - i * 6, .9 + i * .9, 3.4, QX, (.9 + i * .9) / 2, QZ + 17 + i * 3.4, ["#a39d8f", "#9a9486", "#8d887a"][i], true); bx(3.4, .9 + i * .9, 28 - i * 4, QX + 22 + i * 3.4, (.9 + i * .9) / 2, QZ - 1, ["#a39d8f", "#9a9486", "#8d887a"][i], true); });
    [[-14, -8], [-8, 6], [0, -10], [6, 8], [12, -4], [-16, 8], [-2, 2], [10, 10], [14, 4]].forEach((p, i) => node("stone", QX + p[0], QZ + p[1], .9 + (i % 3) * .2));
    bx(4, 3.2, 4, QX - 6, 1.7, QZ - 14, "#d9a21a", true); drum(QX - 6, 3.6, QZ - 14, 2.4, 3.6, "#444", "x");           // crusher hopper and drum
    bx(10, .4, 1.2, QX + 1, 1.4, QZ - 14, "#333"); for (let i = 0; i < 8; i++) bx(.15, .45, 1.2, QX - 3.5 + i * 1.3, 1.65, QZ - 14, "#d9a21a");
    cone(QX + 8, QZ - 14, 3, 3.4, "#bdb7a8"); cone(QX + 12, QZ - 12, 2.2, 2.6, "#a9a395");
    bx(5.5, 1.6, 2.6, QX + 8, 1.2, QZ + 12, "#f2c230", true); bx(2.2, 1.7, 2.6, QX + 11.3, 1.5, QZ + 12, "#e0b020", true); [[-2, -1.4], [-2, 1.4], [2, -1.4], [2, 1.4]].forEach(w => drum(QX + 8 + w[0], .6, QZ + 12 + w[1], 1.2, .5, "#111", "z"));   // dump truck
    bx(6, 3, 4, QX - 19, 1.5, QZ - 10, "#e8e2d6", true); bx(6.6, .25, 4.6, QX - 19, 3.1, QZ - 10, "#8c3b2b");        // foreman cabin
    sign("ACCRA STONE QUARRY", QX - 21.4, 5, QZ - 10, -Math.PI / 2);
    for (let i = 0; i < 6; i++) bx(.15, 1.5, .15, QX - 22, .75, QZ - 17 + i * 5.4, "#7a4a2a");
    bx(36, .06, 6, 182, .06, QZ, "#8a7a5a");                                 // dirt access road to the city
    // Gold mine
    const GX = 222, GZ = 120;
    bx(40, .1, 30, GX, .05, GZ, "#8f8672");
    { const hill = B.MeshBuilder.CreateSphere("hill", { diameter: 34, segments: 6 }, scene); hill.convertToFlatShadedMesh(); hill.scaling.y = .5; hill.position.set(GX + 4, 0, GZ + 18); hill.material = mat("#5f574a"); hill.isPickable = false; hill.checkCollisions = true; }
    [-2.2, 2.2].forEach(o => bx(.7, 3.6, .7, GX + o, 1.8, GZ + 4, "#6b4a2e", true)); bx(5.6, .7, .8, GX, 3.7, GZ + 4, "#6b4a2e"); bx(4, 3.2, .3, GX, 1.6, GZ + 4.4, "#0a0a0a");       // tunnel mouth
    [-.7, .7].forEach(o => bx(.12, .1, 16, GX + o, .12, GZ - 4, "#555")); for (let i = 0; i < 12; i++) bx(2, .08, .25, GX, .08, GZ + 3 - i * 1.4, "#6b4a2e");  // rails
    bx(1.6, .8, 2, GX, .75, GZ - 2, "#3a3a3e", true); bx(1.5, .3, 1.8, GX, 1.3, GZ - 2, "#c9a54a");                  // ore cart
    [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(l => bx(.4, 12, .4, GX + 10 + l[0], 6, GZ - 6 + l[1], "#4a4f56", true)); bx(5, .4, 5, GX + 10, 12.2, GZ - 6, "#4a4f56"); drum(GX + 10, 13.2, GZ - 6, 3, .5, "#2a2a2e", "z");   // headframe + winding wheel
    cone(GX - 10, GZ - 8, 3.4, 3, "#6a6254"); cone(GX - 14, GZ - 4, 2.4, 2.2, "#7a7264");
    [[-8, -2], [-12, 2], [-6, 6], [-14, -6], [-10, 8], [0, -9], [-3, -5]].forEach(p => node("gold", GX + p[0], GZ + p[1], .85 + Math.random() * .3));
    bx(6, 3, 4, GX - 18, 1.5, GZ - 6, "#e8e2d6", true); bx(6.6, .25, 4.6, GX - 18, 3.1, GZ - 6, "#2a3f6a");
    sign("ACCRA GOLD WORKS", GX - 20.4, 5, GZ - 6, -Math.PI / 2);
    bx(48, .06, 6, 178, .06, GZ, "#8a7a5a");

    // ---------- mining ----------
    const best = () => st.tool.jack > 0 ? "jack" : st.tool.pick > 0 ? "pick" : null;
    const label = n => n.back > st.play ? "\u26CF " + NODE[n.kind].name + " (regrowing)" : "\u26CF Mine " + NODE[n.kind].name.toLowerCase();
    function setDepleted(n, on) {
      n.m.scaling.setAll(on ? .35 : 1); if (!on) n.m.scaling.y = .75; else n.m.scaling.y = .3;
      n.m.material = mat(on ? "#6b6a66" : NODE[n.kind].col); n.m.checkCollisions = !on; n.flecks.forEach(f => f.setEnabled(!on));
    }
    function mineNode(n) {
      if (n.back > st.play) return note("This " + NODE[n.kind].name.toLowerCase() + " has been mined out. It will regrow in " + Math.ceil((n.back - st.play) / 60) + " min.");
      const t = best(); if (!t) return note("You need a pickaxe. Buy one from the foreman.");
      if (st.en < 8) return note("Too tired to mine. Rest first."); if (st.hu < 8) return note("Too hungry to work. Eat something.");
      L.busy = true; player.rotation.y = Math.atan2(n.x - player.position.x, n.z - player.position.z); AV.pose = "mine";
      let k = 0; const tick = () => {
        sfx("clang"); if (++k < 5) return setTimeout(tick, 480);
        const power = TOOLS[t][3], loot = NODE[n.kind].loot(power), parts = [];
        Object.keys(loot).forEach(r => { st.res[r] = (st.res[r] || 0) + loot[r]; parts.push("+" + loot[r] + " " + ITEMS[r][0].toLowerCase()); });
        st.tool[t]--; n.hp--; L.vitals({ en: t === "jack" ? -4 : -6, hu: -2, hy: -3 });
        if (n.hp <= 0) { n.back = st.play + NODE[n.kind].back; n.hp = NODE[n.kind].hp; setDepleted(n, true); parts.push("(mined out)"); }
        if (st.tool[t] <= 0) parts.push("\u2014 your " + TOOLS[t][0].toLowerCase() + " broke!");
        AV.pose = null; L.busy = false; save(); note(parts.join(" "));
      };
      setTimeout(tick, 480);
    }
    scene.onBeforeRenderObservable.add(() => { const p = player.position; nodes.forEach(n => { if (n.back && st.play >= n.back && n.m.scaling.x < .9) { n.back = 0; setDepleted(n, false); } }); });
    nodes.forEach(n => points.push({ x: n.x, z: n.z, r: 3, t: () => label(n), ok: () => !L.busy && !L.seated && !L.driving, f: () => mineNode(n) }));

    // ---------- foreman: tools and ore buyer ----------
    function foreman(site) {
      const draw = () => show(ttl(site) + "<small>Cash GH\u00A2" + cash() + "</small>" +
        '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">Tools</div>' +
        Object.keys(TOOLS).map(k => '<button data-t="' + k + '" style="' + BS + '">' + TOOLS[k][0] + " \u00B7 GH\u00A2" + TOOLS[k][1] + " \u00B7 " + (st.tool[k] > 0 ? st.tool[k] + " uses left" : TOOLS[k][2] + " uses") + "</button>").join("") +
        '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">Sell your haul</div>' +
        Object.keys(ITEMS).map(k => '<button data-s="' + k + '" style="' + BS + '">' + ITEMS[k][0] + " \u00D7 " + (st.res[k] || 0) + " \u00B7 GH\u00A2" + ITEMS[k][1] + " each</button>").join("") + CLOSE, d => {
        if (d.x) return hide();
        if (d.t) { const T = TOOLS[d.t]; if (st.tool[d.t] > 0) return note("You still have a " + T[0].toLowerCase() + "."); if (cash() < T[1]) return note("Not enough cash. " + T[0] + " costs GH\u00A2" + T[1]); pay(T[1], T[0]); st.tool[d.t] = T[2]; save(); note(T[0] + " ready to work."); }
        else if (d.s) { const q = st.res[d.s] || 0; if (!q) return note("You have none to sell."); const g = q * ITEMS[d.s][1]; st.res[d.s] = 0; earn(g, "Sold " + ITEMS[d.s][0].toLowerCase()); save(); note("Sold " + q + " for GH\u00A2" + g); }
        draw();
      });
      draw();
    }
    points.push({ x: QX - 17, z: QZ - 10, r: 3, t: "\uD83D\uDC77 Quarry foreman", ok: () => !L.busy && !L.seated, f: () => foreman("Accra Stone Quarry") });
    points.push({ x: GX - 16, z: GZ - 6, r: 3, t: "\uD83D\uDC77 Gold Works foreman", ok: () => !L.busy && !L.seated, f: () => foreman("Accra Gold Works") });

    // ---------- machinery runs while you are within 140 m ----------
    scene.onBeforeRenderObservable.add(() => { const dt = Math.min(engine.getDeltaTime() / 1000, .1), p = player.position;
      spin.forEach(s => { if (Math.hypot(s.x - p.x, s.z - p.z) < 140) { if (s.axis === "x") s.m.rotation.x += dt * 2; else s.m.rotation.y += dt * 2; } }); });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).mining = 1;
    console.log("Accra mining ready: " + nodes.length + " nodes");
  } catch (err) { console.error("accra-mining failed:", err); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("\u26A0 Mining: " + err.message); }
})();
