/* accra-decor.js - interior style engine. Called by accra-life.js every time a home is built.
 * Tier 1 Basic -> Tier 2 Comfort -> Tier 3 Premium -> Tier 4 Luxury. Higher tiers get better floors, dark accent walls,
 * windows with curtains, patterned rugs, art, lamps, bookshelves, speakers, pool table, piano, chandelier, cinema,
 * wine rack, fireplace and an attached garage with cars. Every home also gets its own colour palette. */
(function () {
  const B = BABYLON, P = Math.PI, TIER_NAME = ["", "Basic", "Comfort", "Premium", "Luxury"];
  const PAL = [
    { sofa: "#d9822b", sofa2: "#b86a1f", bed: "#6b3fa0", rug: ["#8a1c2b", "#c9a54a", "#5a0f1b"], acc: "#2b2f36", cur: "#c9a54a" },
    { sofa: "#5f7f9a", sofa2: "#4a667d", bed: "#2f5d8a", rug: ["#1f2f55", "#e8dcc2", "#16224a"], acc: "#27323d", cur: "#e8dcc2" },
    { sofa: "#2f8f7a", sofa2: "#23705f", bed: "#e0d6c2", rug: ["#2f4f3f", "#d9c48a", "#1f3a2d"], acc: "#2a3a33", cur: "#d9c48a" },
    { sofa: "#cfc3ad", sofa2: "#b3a68e", bed: "#7a1f2b", rug: ["#3a3a40", "#c9a54a", "#26262b"], acc: "#3a2f2f", cur: "#8a1c2b" },
    { sofa: "#1d1d20", sofa2: "#2c2c31", bed: "#c9a54a", rug: ["#17171a", "#c9a54a", "#0d0d0f"], acc: "#18181c", cur: "#c9a54a" }
  ];
  const texCache = {};
  function tex(kind, ru, rv) {
    const sc = scene, t = new B.DynamicTexture("dec" + kind, { width: 256, height: 256 }, sc, true), c = t.getContext();
    if (kind === "parquet") { c.fillStyle = "#a8713f"; c.fillRect(0, 0, 256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? "#b27a45" : "#9a6537"; c.fillRect(x * 64 + (y % 2) * 32 - 32, y * 32, 62, 30); } }
    else if (kind === "wood") { c.fillStyle = "#a9764a"; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#b8824f" : "#9a6a40"; c.fillRect(0, i * 32, 256, 30); } }
    else if (kind === "marble") { c.fillStyle = "#f3f0ea"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "rgba(120,120,135,.35)"; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(Math.random() * 256, 0); c.bezierCurveTo(Math.random() * 256, 80, Math.random() * 256, 160, Math.random() * 256, 256); c.stroke(); } c.strokeStyle = "#c9a54a"; c.lineWidth = 3; c.strokeRect(0, 0, 256, 256); }
    else if (kind === "tile") { c.fillStyle = "#e9edf0"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#c3ccd3"; c.fillRect(0, 0, 128, 128); c.fillRect(128, 128, 128, 128); }
    else { c.fillStyle = "#c9c3b4"; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { c.fillStyle = i % 2 ? "#bdb7a8" : "#d3cdbf"; c.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); } }
    t.update(); t.uScale = ru; t.vScale = rv; t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE;
    const m = new B.StandardMaterial("decm" + kind, sc); m.diffuseTexture = t; m.specularColor = kind === "marble" ? new B.Color3(.35, .35, .35) : new B.Color3(.05, .05, .05); return m;
  }

  function apply(c) {
    const { u, T, s, sx, sz, W, D, H, hsh, walls, floorM, nds, F, tier, box, mat, item, ITEMS } = c;
    const pal = PAL[hsh % PAL.length], rnd = (() => { let a = hsh || 1; return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const G = (w, h, d, x, y, z, col) => box(w, h, d, sx + x, y, sz + z, col, false);          // decor box, no collision
    const GS = (w, h, d, x, y, z, col) => box(w, h, d, sx + x, y, sz + z, col, true);           // decor box with collision
    const parts = T.p.map(p => [p[0] * s, p[1] * s, (p[2] === .3 ? .3 : p[2] * s) / 2 + .6, (p[3] === .3 ? .3 : p[3] * s) / 2 + .6]);
    const RAD = { bed1: 1.7, bed2: 2.1, sofa: 1.9, wardrobe: 1.2, tv: 1.2, dining: 1.7, desk: 1.5, kit2: 1.5, counter: 1.5, fridge: 1, bath: 1.3, chair: 1, shelf: 1, vanity: 1 };
    const free = (x, z, r) => {
      if (Math.abs(x) > W / 2 - .7 || Math.abs(z) > D / 2 - .7) return false;
      if (Math.abs(x) < 1.5 && z < -D / 2 + 2.4) return false;                                   // keep the front door clear
      for (const f of F) if (Math.hypot(f[0] - x, f[1] - z) < (RAD[f[2]] || 1.2) + r) return false;
      for (const p of parts) if (Math.abs(x - p[0]) < p[2] + r * .6 && Math.abs(z - p[1]) < p[3] + r * .6) return false;
      return true;
    };
    const spot = (r, anchors) => { for (const a of anchors) if (free(a[0], a[1], r)) return a; for (let i = 0; i < 80; i++) { const x = (rnd() - .5) * (W - 2), z = (rnd() - .5) * (D - 2); if (free(x, z, r)) return [x, z]; } return null; };
    const corners = [[-W / 2 + .8, D / 2 - .8], [W / 2 - .8, D / 2 - .8], [W / 2 - .8, -D / 2 + 1.2], [-W / 2 + .8, -D / 2 + 1.2]];

    // ---- 1. walls, floor, trim ----
    const light = ["#f1ebdd", "#ece3d2", "#e9eef0"][hsh % 3];
    if (tier === 1) { walls.forEach(m => { m.material = mat("#efe9dc"); }); floorM.material = tex("vinyl", W / 3, D / 3); }
    else if (tier === 2) { walls.forEach((m, i) => { m.material = mat(i === 0 ? pal.acc : light); }); floorM.material = tex("wood", W / 3, D / 3); }
    else { walls.forEach(m => { m.material = mat(pal.acc); }); floorM.material = tex(tier === 4 ? "marble" : "parquet", W / (tier === 4 ? 4 : 3), D / (tier === 4 ? 4 : 3)); }
    if (tier >= 2) { G(W, .16, .08, 0, .08, D / 2 - .18, "#f4f1ea"); G(.08, .16, D, -W / 2 + .18, .08, 0, "#f4f1ea"); G(.08, .16, D, W / 2 - .18, .08, 0, "#f4f1ea"); }
    if (tier === 4) { G(W, .1, .1, 0, H - .08, D / 2 - .2, "#c9a54a"); G(.1, .1, D, -W / 2 + .2, H - .08, 0, "#c9a54a"); G(.1, .1, D, W / 2 - .2, H - .08, 0, "#c9a54a"); }

    // ---- 2. recolour the furniture so every home has its own palette ----
    const recolor = (nd, map) => nd && nd.getChildMeshes && nd.getChildMeshes().forEach(m => { const n = m.material && m.material.name; if (map[n]) m.material = mat(map[n]); });
    nds.forEach((nd, i) => { const id = F[i][2];
      if (id === "sofa") recolor(nd, { "m#7a3b3b": pal.sofa, "m#6a2f2f": pal.sofa2 });
      if (id === "bed2" || id === "bed1") recolor(nd, { "m#d9cbb6": pal.bed, "m#e9e6df": pal.bed, "m#6d4c2f": tier >= 3 ? "#2a1d14" : "#6d4c2f" });
      if (id === "chair") recolor(nd, { "m#3a3a40": pal.sofa2, "m#2f2f34": pal.sofa });
    });

    // ---- 3. windows with curtains (more and wider in better homes) ----
    const nw = tier === 1 ? 0 : tier === 2 ? 1 : tier === 3 ? 2 : 3, ww = tier === 4 ? 2.6 : 1.7;
    for (let i = 0; i < nw; i++) { const x = (i - (nw - 1) / 2) * (W / (nw + .4)); if (!free(x, D / 2 - 1, .3) && F.some(f => Math.abs(f[0] - x) < 1.5 && f[1] > D / 2 - 1.6)) continue;
      G(ww + .2, 1.6, .06, x, 1.85, D / 2 - .2, "#f4f1ea"); G(ww, 1.4, .08, x, 1.85, D / 2 - .22, tier === 4 ? "#9fd0f0" : "#7fb6e0");
      G(.5, 2.2, .1, x - ww / 2 - .25, 1.6, D / 2 - .3, pal.cur); G(.5, 2.2, .1, x + ww / 2 + .25, 1.6, D / 2 - .3, pal.cur); }

    // ---- 4. rugs where people sit and sleep ----
    const rug = (x, z, w, d, ry) => { if (tier === 1) return; const [a, b, k] = pal.rug; const sw = ry && Math.abs(Math.sin(ry)) > .7;
      const W2 = sw ? d : w, D2 = sw ? w : d; G(W2, .03, D2, x, .035, z, a); G(W2 - .35, .035, D2 - .35, x, .04, z, b); G(W2 - .6, .04, D2 - .6, x, .045, z, tier >= 3 ? k : a); };
    F.forEach(f => { const fx = Math.sin(f[3]), fz = Math.cos(f[3]);
      if (f[2] === "sofa") rug(f[0] + fx * 1.9, f[1] + fz * 1.9, 3.6, 2.4, f[3]);
      if (f[2] === "bed2" || f[2] === "bed1") rug(f[0] + fx * 1.6, f[1] + fz * 1.6, 2.6, 1.6, f[3]);
      if (f[2] === "dining" && tier >= 3) rug(f[0], f[1], 3.4, 2.6, 0); });
    if (tier === 4) { const a = spot(2.5, [[0, 0]]); if (a) rug(a[0], a[1], 5, 3.4, 0); }

    // ---- 5. plants, lamps, art, AC, speakers ----
    const plant = (x, z, big) => { G(.5, .45, .5, x, .22, z, "#3a3a3e"); const sp = B.MeshBuilder.CreateSphere("pl", { diameter: big ? 1.4 : .9, segments: 5 }, scene); sp.convertToFlatShadedMesh(); sp.position.set(sx + x, big ? 1.2 : .9, sz + z); sp.material = mat("#3f8f4a"); sp.isPickable = false; };
    const lamp = (x, z) => { G(.06, 1.6, .06, x, .8, z, "#222"); G(.45, .35, .45, x, 1.7, z, "#fff2c0"); G(.3, .06, .3, x, .03, z, "#222"); };
    const nPlants = [1, 2, 4, 6][tier - 1]; let pc = 0;
    for (const a of corners) if (pc < nPlants && free(a[0], a[1], .5)) { plant(a[0], a[1], tier === 4); pc++; }
    for (let i = pc; i < nPlants; i++) { const a = spot(.8, []); if (a) plant(a[0], a[1], tier >= 3); }
    if (tier >= 2) F.filter(f => f[2] === "sofa").slice(0, tier - 1).forEach(f => { const lx = Math.cos(f[3]), lz = -Math.sin(f[3]); [[2.1, 1], [-2.1, -1]].forEach(o => { const x = f[0] + lx * o[0], z = f[1] + lz * o[0]; if (free(x, z, .2)) lamp(x, z); }); });
    const art = (x, y, z, ry, w, h) => { const cs = ["#c8553d", "#2456a6", "#c9a54a", "#2f8f7a", "#6b3fa0"]; const a = G(w + .12, h + .12, .06, x, y, z, "#14141a"); a.rotation.y = ry; const b = G(w, h, .08, x, y, z, cs[Math.floor(rnd() * 5)]); b.rotation.y = ry; const c2 = G(w * .5, h * .5, .09, x, y, z, cs[Math.floor(rnd() * 5)]); c2.rotation.y = ry; };
    const nArt = [0, 2, 4, 6][tier - 1];
    for (let i = 0; i < nArt; i++) { const side = i % 3, x = side === 0 ? (rnd() - .5) * (W - 4) : side === 1 ? -W / 2 + .22 : W / 2 - .22, z = side === 0 ? D / 2 - .2 : (rnd() - .5) * (D - 4); if (F.some(f => Math.hypot(f[0] - x, f[1] - z) < 1.3)) continue; art(x, 1.9, z, side === 0 ? 0 : P / 2, tier === 4 ? 1.5 : 1, tier === 4 ? 1 : .7); }
    if (tier >= 2) { const x = W / 2 - .3, z = (rnd() - .5) * (D - 3); G(.3, .3, 1, x - .1, 2.7, z, "#f4f4f4"); G(.05, .06, .8, x - .27, 2.62, z, "#999"); }          // wall air-conditioner
    if (tier >= 3) F.filter(f => f[2] === "tv").forEach(f => { const lx = Math.cos(f[3]), lz = -Math.sin(f[3]); [-1.7, 1.7].forEach(o => G(.4, 1.5, .4, f[0] + lx * o, .75, f[1] + lz * o, "#1b1b1f")); });

    // ---- 6. bathroom tiles ----
    F.filter(f => f[2] === "bath").forEach(f => { if (tier < 2) return; const t = G(3.2, .02, 3.4, f[0], .06, f[1] + (f[1] > 0 ? -.6 : .6), "#ffffff"); t.material = tex("tile", 2, 2); });

    // ---- 7. premium extras ----
    if (tier >= 3) {
      const sh = spot(1.2, [[W / 2 - .8, -D / 4], [-W / 2 + .8, D / 4]]); if (sh) { const n = item("shelf", sx + sh[0], sz + sh[1], sh[0] > 0 ? -P / 2 : P / 2, false, 1); }
      if (W >= 12) { const a = spot(2.4, [[W / 4, -D / 6], [W / 4, D / 6]]); if (a) { GS(2.6, .85, 1.4, a[0], .43, a[1], "#5a3a22"); G(2.3, .06, 1.1, a[0], .88, a[1], "#1f7a3a"); [[-1, -.5], [1, -.5], [-1, .5], [1, .5]].forEach(q => G(.2, .85, .2, a[0] + q[0] * 1.2, .43, a[1] + q[1] * .6, "#3a2414"));
        [0, 1, 2, 3].forEach(i => { const bl = B.MeshBuilder.CreateSphere("ball", { diameter: .12, segments: 4 }, scene); bl.position.set(sx + a[0] - .3 + i * .22, .95, sz + a[1] + (i % 2) * .15); bl.material = mat(["#c8102e", "#fcd116", "#111", "#fff"][i]); bl.isPickable = false; }); G(.05, .05, 1.5, a[0] + 1.6, 1.2, a[1] + .4, "#c9a54a"); } }
    }

    // ---- 8. luxury extras: chandelier, columns, piano, fireplace, wine rack, cinema ----
    if (tier === 4) {
      const cl = (x, z) => { G(.06, .8, .06, x, H - .4, z, "#c9a54a"); G(1.4, .1, 1.4, x, H - .85, z, "#c9a54a"); for (let i = 0; i < 8; i++) { const a = i / 8 * P * 2; const bu = G(.14, .22, .14, x + Math.cos(a) * .65, H - .75, z + Math.sin(a) * .65, "#fff2c0"); bu.material = (() => { const m = new B.StandardMaterial("chl", scene); m.emissiveColor = new B.Color3(1, .9, .6); m.disableLighting = true; return m; })(); } };
      cl(0, 0); if (W > 15) cl(W / 4, D / 4);
      [[-W / 2 + 1.2, D / 2 - 1.2], [W / 2 - 1.2, D / 2 - 1.2]].forEach(a => { const col = B.MeshBuilder.CreateCylinder("col", { diameter: .6, height: H, tessellation: 10 }, scene); col.position.set(sx + a[0], H / 2, sz + a[1]); col.material = mat("#efece4"); col.isPickable = false; });
      const pi = spot(2.2, [[-W / 4, D / 4], [W / 4, D / 3]]); if (pi) { GS(1.6, .9, 2.2, pi[0], .5, pi[1], "#101012"); G(1.5, .08, 2.1, pi[0], 1.0, pi[1], "#16161a"); G(1.4, .12, .5, pi[0], .96, pi[1] - 1.0, "#f4f4f4"); [[-.6, -.9], [.6, -.9], [0, .9]].forEach(q => G(.14, .5, .14, pi[0] + q[0], .25, pi[1] + q[1], "#101012")); }
      const fp = spot(1.6, [[-W / 2 + 1, -D / 6], [-W / 2 + 1, D / 5]]); if (fp) { GS(.9, 1.3, 2.4, -W / 2 + .8, .65, fp[1], "#2a2a2f"); const fl = G(.1, .6, 1.4, -W / 2 + 1.28, .6, fp[1], "#ff8a1a"); fl.material = (() => { const m = new B.StandardMaterial("flame", scene); m.emissiveColor = new B.Color3(1, .5, .1); m.disableLighting = true; return m; })(); }
      const wr = spot(1.4, [[-W / 2 + .8, D / 3], [-W / 2 + .8, -D / 3]]); if (wr) { GS(.7, 2.2, 2.2, -W / 2 + .6, 1.1, wr[1], "#3a2210"); for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) G(.2, .12, .12, -W / 2 + .98, .35 + r * .38, wr[1] - .85 + q * .34, ["#5a1224", "#2d5a2a", "#c8a02a"][(r + q) % 3]); }
      if (W >= 16) { const sc = G(.2, 2.4, 5, W / 2 - .3, 2, -D / 4 - 1.5, "#050508"); sc.material = (() => { const m = new B.StandardMaterial("cin", scene); m.emissiveColor = new B.Color3(.05, .12, .3); m.disableLighting = true; return m; })();
        [-1.6, 0, 1.6].forEach(o => item("chair", sx + W / 2 - 4.5, sz - D / 4 - 1.5 + o, -P / 2, false, 1.05)); }
      // attached garage with two cars (through the 2.6 m door in the east wall)
      { const gz = D / 4, gx = W / 2 + 3.5, WL = (w, dd, x, z) => GS(w, H, dd, x, H / 2, z, "#2b2f36");
        WL(7, .3, gx, gz + 3.5); WL(7, .3, gx, gz - 3.5); WL(.3, 7, W / 2 + 7, gz);
        G(7, .05, 7, gx, .03, gz, "#3b3b40"); G(.2, 2.7, 6, W / 2 + 6.8, 1.35, gz, "#6a6f78"); for (let i = 0; i < 4; i++) G(.12, .05, 5.6, gx - 2.4 + i * 1.6, H - .08, gz, "#fff6d6");
        const cr = (x, z, t, c) => { const n = window.AccraAssets.createCar(scene, t, { color: c }); n.position.set(sx + x, 0, sz + z); n.rotation.y = -Math.PI / 2; };
        cr(gx - .4, gz - 1.7, "sedan", "#14213d"); cr(gx - .4, gz + 1.7, "suv", "#2b2b2b"); }
      const sa = spot(1.2, [[0, D / 2 - 1.3]]); if (sa) { G(.7, .25, .7, sa[0], .12, sa[1], "#2a2a2f"); G(.4, 1.4, .3, sa[0], .95, sa[1], "#e8e6df"); G(.3, .3, .3, sa[0], 1.8, sa[1], "#e8e6df"); }
    }
  }
  window.ACCRA_DECOR = { apply, TIER_NAME };
  (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).decor = 1;
})();
