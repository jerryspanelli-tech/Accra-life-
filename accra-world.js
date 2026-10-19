/* accra-world.js - THE BIG MAP.
 * World = 12 km wide x 27 km long (about 324 sq km, roughly 4x the land of GTA V).
 * Accra stays exactly where it is. North of it (negative z) a 24.5 km highway runs to Kumasi (scale 1 : 10 of the real 250 km),
 * streamed in 256 m chunks: road, guard rails, trees, farms, signs, toll plazas, and six towns. Loaded by accra-life.js. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
    if (!L) { console.log("accra-world: life API not ready"); return; }
    const B = BABYLON, { st, cash, pay, note, show, hide, ttl, BS, CLOSE, points, fade, tp } = L;
    const END = -24500, DRIFT = -2400, CH = 256;
    const S = t => t * t * (3 - 2 * t);
    const hx = z => DRIFT * S(Math.min(1, Math.max(0, (-z - 165) / (-END - 165))));        // highway centre line x at z
    const slope = z => (hx(z - 8) - hx(z + 8)) / 16;
    const realKm = z => Math.round((-z - 165) / 1000 * 10.2);                               // 1 : 10 scale, so game km x 10.2 = real km
    const rng = seed => { let s = (seed * 2654435761) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
    const hash = (a, b, c) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0;

    // ---------- 1. the world gets big: ground, fog, speed ----------
    ground.scaling.set(20, 1, 45); ground.position.set(0, 0, -12500);                       // x -6000..6000, z -26000..+1000
    gMat.diffuseTexture.uScale = 120 * 20; gMat.diffuseTexture.vScale = 120 * 45;
    scene.fogStart = 260; scene.fogEnd = 950;
    const mwc = car.moveWithCollisions.bind(car);
    let carF = 1, lx = car.position.x, lz = car.position.z;
    car.moveWithCollisions = v => { const onHw = car.position.z < -260 && Math.abs(car.position.x - hx(car.position.z)) < 16; carF += ((onHw ? 2.3 : 1) - carF) * .06; return mwc(new B.Vector3(v.x * carF, v.y, v.z * carF)); };
    scene.onBeforeRenderObservable.add(() => { const dt = Math.max(engine.getDeltaTime() / 1000, .001), sp = Math.hypot(car.position.x - lx, car.position.z - lz) / dt; lx = car.position.x; lz = car.position.z;
      const el = document.getElementById("spd"); if (L.driving && el && sp < 90) el.textContent = Math.round(sp * 3.6) + " km/h"; });

    // ---------- 2. chunk streaming ----------
    const TOWNS = [["Nsawam", -3500, 0], ["Suhum", -6500, 0], ["Nkawkaw", -13000, 0], ["Konongo", -19000, 0], ["Ejisu", -22500, 1], ["Kumasi", -24500, 2]].map(t => ({ n: t[0], z: t[1], big: t[2], x: hx(t[1]) + 220, R: [150, 190, 340][t[2] === 2 ? 2 : t[2]] }));
    const TOLLS = [{ z: -1200, fee: 15, n: "Accra Gate toll" }, { z: -21500, fee: 20, n: "Ejisu toll" }];
    const asphalt = mat("#2f3033"), white = mat("#f2f2f2"), rail = mat("#b8bcc2"), conc = mat("#9a9a96");
    const mk = (w, h, d, x, y, z, m, ry) => { const b = B.MeshBuilder.CreateBox("wb", { width: w, height: h, depth: d }, scene); b.position.set(x, y, z); b.material = typeof m === "string" ? mat(m) : m; if (ry) b.rotation.y = ry; b.isPickable = false; return b; };
    const merge = (arr, solid) => { if (!arr.length) return null; const m = B.Mesh.MergeMeshes(arr, true, true, undefined, false, true); if (m) { m.checkCollisions = !!solid; m.isPickable = false; } return m; };
    const treeSrc = (() => { const t = B.MeshBuilder.CreateCylinder("ts", { height: 4, diameterTop: .3, diameterBottom: .5, tessellation: 5 }, scene); t.position.y = 2; t.material = mat("#7a5230");
      const c = B.MeshBuilder.CreateIcoSphere("tc", { radius: 2, subdivisions: 1 }, scene); c.convertToFlatShadedMesh(); c.position.y = 5; c.material = mat("#3f8f4a"); const m = B.Mesh.MergeMeshes([t, c], true, true, undefined, false, true); m.isVisible = false; return m; })();
    const gantryTex = text => { const dt = new B.DynamicTexture("gt", { width: 512, height: 128 }, scene, false), c = dt.getContext(); c.fillStyle = "#0b6b3a"; c.fillRect(0, 0, 512, 128); c.strokeStyle = "#fff"; c.lineWidth = 6; c.strokeRect(6, 6, 500, 116); c.fillStyle = "#fff"; c.font = "bold 54px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 256, 66, 480); dt.update();
      const m = new B.StandardMaterial("gtm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; return m; };

    function roadTask(z0, list) {
      const surf = [], bars = [];
      for (let z = z0; z > z0 - CH; z -= 64) {
        if (z - 32 > -150) continue;                               // nothing north of the city avenue is skipped; the city core keeps its own roads
        const zm = z - 32, x = hx(zm), th = -Math.atan(slope(zm)), cs = Math.cos(th), sn = Math.sin(th);
        const add = (arr, w, h, d, ox, y, oz, m) => { const b = mk(w, h, d, x + cs * ox + sn * oz, y, zm - sn * ox + cs * oz, m, th); arr.push(b); };
        add(surf, 20, .08, 66, 0, .05, 0, asphalt); add(surf, .25, .09, 66, -9.7, .06, 0, white); add(surf, .25, .09, 66, 9.7, .06, 0, white);
        for (let oz = -28; oz <= 28; oz += 12) { add(surf, .2, .09, 4, -5.1, .07, oz, white); add(surf, .2, .09, 4, 5.1, .07, oz, white); }
        add(bars, 3, .35, 66, 0, .2, 0, conc); add(bars, .15, .7, 66, -10.6, .4, 0, rail); add(bars, .15, .7, 66, 10.6, .4, 0, rail);
      }
      const a = merge(surf, false), b = merge(bars, true); if (a) list.push(a); if (b) list.push(b);
      // distance gantry every 2 km
      const gz = Math.round((z0 - 128) / 2000) * 2000 - 165; if (gz <= z0 && gz > z0 - CH && gz < -300) {
        const x = hx(gz); [-11, 11].forEach(o => list.push(mk(.5, 7.5, .5, x + o, 3.75, gz, "#555")));
        const n = mk(16, 2.4, .2, x, 7, gz, "#555"), s1 = B.MeshBuilder.CreatePlane("gs", { width: 14, height: 2 }, scene), s2 = s1.clone("gs2");
        s1.position.set(x, 7, gz + .15); s1.rotation.y = Math.PI; s1.material = gantryTex("KUMASI " + Math.max(0, 250 - realKm(gz)) + " km"); s2.position.set(x, 7, gz - .15); s2.material = gantryTex("ACCRA " + realKm(gz) + " km");
        s1.isPickable = s2.isPickable = false; list.push(n, s1, s2);
      }
    }
    function propsTask(cx, cz, list) {       // trees, fields and farmhouses beside the road
      const r = rng(hash(cx, cz, 7)), farm = cz * CH < -7000 && cz * CH > -17000;
      for (let i = 0; i < (farm ? 7 : 16); i++) { const z = cz * CH + r() * CH; if (z > -160) continue; const side = r() < .5 ? -1 : 1, x = hx(z) + side * (16 + r() * 70);
        if (TOWNS.some(t => Math.hypot(x - t.x, z - t.z) < t.R + 30)) continue;
        const t = treeSrc.createInstance("tr"); t.position.set(x, 0, z); t.scaling.setAll(.8 + r() * .8); t.isPickable = false; list.push(t); }
      if (farm) for (let i = 0; i < 3; i++) { const z = cz * CH + 30 + r() * (CH - 60), side = r() < .5 ? -1 : 1, x = hx(z) + side * (50 + r() * 60);
        if (TOWNS.some(t => Math.hypot(x - t.x, z - t.z) < t.R + 30)) continue;
        const col = ["#6aa84f", "#c9b458", "#8a6a3a", "#4f8f3a"][Math.floor(r() * 4)]; list.push(mk(60, .15, 40, x, .1, z, col)); for (let k = 0; k < 7; k++) list.push(mk(60, .2, .5, x, .15, z - 17 + k * 5.6, "#3a5a28"));
        if (r() < .3) { list.push(mk(8, 3, 6, x + 36 * side, 1.5, z, "#efe7d2")); if (window.ACCRA_HIP) { const h = window.ACCRA_HIP("#a83232").createInstance("fh"); h.scaling.set(5, 2, 4.6); h.position.set(x + 36 * side, 3, z); list.push(h); } } }
    }
    function townTask(T, cx, cz, list) {
      const x0 = cx * CH, z0 = cz * CH, inC = (x, z) => x >= x0 && x < x0 + CH && z >= z0 && z < z0 + CH, k = Math.round(T.R / 34), P = ["#e3d8c0", "#d6c4a0", "#cfa98b", "#b8c4c0", "#f0c27a", "#c8553d", "#3f8f7a", "#e6e0d4"];
      for (let i = -k; i <= k; i++) for (let j = -k; j <= k; j++) {
        if (i === 0 || j === 0 || Math.hypot(i, j) * 34 > T.R) continue;
        const x = T.x + i * 34 + (i > 0 ? 8 : -8), z = T.z + j * 34 + (j > 0 ? 8 : -8); if (!inC(x, z)) continue;
        const r = rng(hash(i, j, T.z | 0)); if (r() < .15) continue;
        const h = T.big === 2 ? 8 + r() * (Math.hypot(i, j) < 3 ? 40 : 14) : 4 + r() * 8, w = 14 + r() * 8, d = 14 + r() * 8, col = P[Math.floor(r() * P.length)];
        const b = B.MeshBuilder.CreateBox("tb", { width: w, height: h, depth: d }, scene); b.position.set(x, h / 2, z); b.material = facMat(col, Math.max(1, Math.round(h / 6)), Math.max(1, Math.round(w / 7))); b.checkCollisions = true; b.isPickable = false; list.push(b);
        list.push(mk(w + .6, .5, d + .6, x, h + .25, z, "#7b4b33")); }
      const clip = (a0, a1) => [Math.max(a0, 0), Math.min(a1, 0)];
      // town streets: one north-south and one east-west, plus a link road to the highway
      const ns0 = Math.max(T.z - T.R, z0), ns1 = Math.min(T.z + T.R, z0 + CH); if (T.x >= x0 - 6 && T.x < x0 + CH + 6 && ns1 > ns0) list.push(mk(10, .06, ns1 - ns0, T.x, .06, (ns0 + ns1) / 2, asphalt));
      const ew0 = Math.max(T.x - T.R, x0), ew1 = Math.min(T.x + T.R, x0 + CH); if (T.z >= z0 - 6 && T.z < z0 + CH + 6 && ew1 > ew0) list.push(mk(ew1 - ew0, .06, 10, (ew0 + ew1) / 2, .06, T.z, asphalt));
      const lk0 = Math.max(hx(T.z) + 10, x0), lk1 = Math.min(T.x - 5, x0 + CH); if (T.z >= z0 - 6 && T.z < z0 + CH + 6 && lk1 > lk0) list.push(mk(lk1 - lk0, .06, 8, (lk0 + lk1) / 2, .065, T.z + 14, mat("#3a3a3e")));
      if (inC(T.x + 24, T.z + 24)) { list.push(mk(8, 3.2, 5, T.x + 24, 1.6, T.z + 24, "#e8e2d6")); list.push(mk(8.6, .3, 5.6, T.x + 24, 3.3, T.z + 24, "#2a3f6a")); if (window.ACCRA_AUDIO) {} }
      if (T.big === 2 && inC(T.x - 70, T.z + 70)) { list.push(mk(80, 3.4, 56, T.x - 70, 1.7, T.z + 70, "#d9a21a")); for (let a = 0; a < 8; a++) for (let b = 0; b < 5; b++) list.push(mk(7, 1.6, 7, T.x - 104 + a * 9.6, 2.4 + .8, T.z + 52 + b * 9, ["#c8553d", "#2456a6", "#3f8f7a", "#f2c230"][(a + b) % 4])); }   // Kejetia market stalls
    }
    function tollTask(P, list) {
      const x = hx(P.z), th = -Math.atan(slope(P.z)); P.arms = [];
      list.push(mk(30, .8, 16, x, 6.4, P.z, "#e4e6ea", th)); [-15, 15].forEach(o => list.push(mk(1, 6, 1, x + o, 3, P.z, "#9a9a96")));
      [-6.6, -3, 0, 3, 6.6].forEach((o, i) => { if (Math.abs(o) < 1) { list.push(mk(3.2, 1.2, 10, x + o, .6, P.z, "#c9a54a")); return; } if (i % 2 === 0) list.push(mk(1.6, 2.6, 6, x + o + (o < 0 ? -2.3 : 2.3), 1.3, P.z, "#17191c")); });
      [-9, -5.1, 5.1, 9].forEach(o => { const a = mk(3.6, .2, .2, x + o, 1.2, P.z - 8, "#c8102e"); a.checkCollisions = true; P.arms.push(a); list.push(a); });
      const dt = new B.DynamicTexture("tt", { width: 512, height: 128 }, scene, false), c = dt.getContext(); c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#fcd116"; c.font = "bold 48px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(P.n.toUpperCase() + "  GH\u00A2" + P.fee, 256, 66, 490); dt.update();
      const sg = B.MeshBuilder.CreatePlane("tl", { width: 12, height: 3 }, scene); sg.position.set(x, 5.2, P.z + 8.2); sg.rotation.y = Math.PI; const m = new B.StandardMaterial("tlm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; sg.material = m; sg.isPickable = false; list.push(sg);
    }

    const chunks = new Map(), queue = [];
    const near = (cx, cz) => { const zc = cz * CH + CH / 2; if (zc > -120) return false; if (zc < END - 400) return false; const hxc = hx(zc);
      return Math.abs(cx * CH + CH / 2 - hxc) < CH + 120 || TOWNS.some(t => Math.abs(cx * CH + CH / 2 - t.x) < t.R + CH && Math.abs(zc - t.z) < t.R + CH); };
    function request(cx, cz) {
      const k = cx + "," + cz; if (chunks.has(k)) return; const list = []; chunks.set(k, list);
      const z0 = (cz + 1) * CH; const tasks = [];
      if (Math.abs(cx * CH + CH / 2 - hx(cz * CH + CH / 2)) < CH + 10) tasks.push(() => roadTask(z0, list));
      tasks.push(() => propsTask(cx, cz, list));
      TOWNS.forEach(T => { if (Math.abs(cx * CH + CH / 2 - T.x) < T.R + CH && Math.abs(cz * CH + CH / 2 - T.z) < T.R + CH) tasks.push(() => townTask(T, cx, cz, list)); });
      TOLLS.forEach(P => { if (P.z <= z0 && P.z > z0 - CH && !P.arms) tasks.push(() => tollTask(P, list)); });
      tasks.forEach(f => queue.push(f));
    }
    function drop(k) { const l = chunks.get(k); if (!l) return; l.forEach(m => m && m.dispose && m.dispose()); chunks.delete(k); TOLLS.forEach(P => { if (P.arms && P.arms.every(a => a.isDisposed())) P.arms = null; }); }
    let tt = 0;
    scene.onBeforeRenderObservable.add(() => {
      const p = L.driving ? car.position : player.position;
      if (++tt % 10 === 0 && p.z < -150) {
        const cx = Math.floor(p.x / CH), cz = Math.floor(p.z / CH), want = new Set();
        for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 3; z <= cz + 3; z++) if (near(x, z)) { want.add(x + "," + z); request(x, z); }
        for (const k of [...chunks.keys()]) if (!want.has(k)) drop(k);
      }
      const t0 = performance.now(); while (queue.length && performance.now() - t0 < 4) queue.shift()();
      // toll barriers lift when you pay
      if (L.driving) TOLLS.forEach(P => { if (!P.arms) return; const d = Math.abs(car.position.z - (P.z - 8)); const near2 = d < 14 && Math.abs(car.position.x - hx(P.z)) < 14;
        if (near2 && !(P.until > st.play)) { if (cash() >= P.fee) { pay(P.fee, P.n); P.until = st.play + 8; note(P.n + ": GH\u00A2" + P.fee + " paid. Safe travels!"); } else if (!P.warn || P.warn < st.play) { P.warn = st.play + 5; note(P.n + " costs GH\u00A2" + P.fee + ". Not enough cash."); } }
        P.arms.forEach(a => { const up = P.until > st.play; a.position.y += ((up ? 5 : 1.2) - a.position.y) * .12; a.checkCollisions = !up; }); });
    });

    // ---------- 3. intercity buses (fast travel): the stop list and fares ----------
    const STOPS = [["Accra", 14, -185]].concat(TOWNS.map(t => [t.n, t.x + 30, t.z + 30]));
    const FARE = { Accra: 0, Nsawam: 25, Suhum: 40, Nkawkaw: 70, Konongo: 90, Ejisu: 110, Kumasi: 130 };
    function bus(here) {
      const draw = () => show(ttl("\uD83D\uDE8C Intercity buses") + "<small>You are in " + here + " \u00B7 cash GH\u00A2" + cash() + "</small>" + STOPS.filter(s => s[0] !== here).map(s => '<button data-d="' + s[0] + '" style="' + BS + '">' + s[0] + " \u00B7 GH\u00A2" + Math.max(FARE[s[0]], FARE[here]) + "</button>").join("") + CLOSE, d => {
        if (d.x) return hide();
        if (window.ACCRA_CRIME && window.ACCRA_CRIME.wanted >= 2) return note("Police are watching the bus station.");
        const s = STOPS.find(q => q[0] === d.d), f = Math.max(FARE[d.d], FARE[here]);
        if (cash() < f) return note("Not enough cash for the ticket (GH\u00A2" + f + ").");
        hide(); pay(f, "Bus to " + d.d); fade(3000, () => { tp(s[1], s[2]); L.vitals({ hu: -15, hy: -8, en: 15 }); }, () => note("Arrived in " + d.d + ". Long ride, you feel rested but hungry."));
      }); draw();
    }
    // ---------- 3b. Ayalolo: the shared bus between Accra and Kumasi, one bus per direction ----------
    const AYA = { line: "Ayalolo 5 \u00B7 Accra \u2194 Kumasi", fare: 35 };
    const aStops = STOPS.map(s => ({ n: s[0], x: s[1], z: s[2] }));
    const ayaBodies = [];
    for (let i = 0; i < 2; i++) {
      const b = mk(2.6, 2.4, 6, 0, 1.6, 0, "#e1a31a"), st2 = mk(2.62, .4, 6.02, 0, 1.1, 0, "#17191c"), rf = mk(2.4, .2, 5.6, 0, 2.85, 0, "#ffffff");
      const bus = B.Mesh.MergeMeshes([b, st2, rf], true, true, undefined, false, true); bus.isPickable = false;
      ayaBodies.push({ m: bus, dir: i === 0 ? 1 : -1, t: i * .5 });
    }
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .1);
      ayaBodies.forEach(b => { b.t = (b.t + dt / 900) % 1; const u = b.dir > 0 ? b.t : 1 - b.t, z = -165 - u * (24500 - 165), x = hx(z);
        b.m.position.set(x, 0, z); b.m.rotation.y = -Math.atan(slope(z)) + (b.dir > 0 ? 0 : Math.PI); });
    });
    const ayaBoard = s => show(ttl("\uD83D\uDE8C " + AYA.line) + "<small>Fare GH\u00A2" + AYA.fare + " to any stop, a bus about every 5 minutes. You are at " + s.n + ". Cash GH\u00A2" + cash() + "</small>" +
      aStops.filter(q => q.n !== s.n).map(q => '<button data-a="' + q.n + '" style="' + BS + '">' + q.n + " \u00B7 GH\u00A2" + AYA.fare + "</button>").join("") + CLOSE, d => {
        if (d.x) return hide();
        const to = aStops.find(q => q.n === d.a); if (!to) return;
        if (window.ACCRA_CRIME && window.ACCRA_CRIME.wanted >= 2) return note("Police are checking the buses. Lose them first.");
        if (cash() < AYA.fare) return note("Not enough cash for the Ayalolo fare (GH\u00A2" + AYA.fare + ").");
        hide(); pay(AYA.fare, "Ayalolo to " + to.n);
        note("Ayalolo to " + to.n + " (" + realKm(to.z) + " km from Accra).");
        fade(2400, () => { tp(to.x, to.z); L.vitals({ hu: -8, en: 6 }); }, () => note("Arrived at " + to.n + "."));
      });
    aStops.forEach(q => points.push({ x: q.x + 4, z: q.z + 4, r: 4, t: "\uD83D\uDE8C Ayalolo stop", ok: () => !L.busy && !L.seated && !L.driving, f: () => ayaBoard(q) }));
    window.ACCRA_AYALOLO = { line: AYA.line, fare: AYA.fare, stops: aStops };

    STOPS.forEach(s => points.push({ x: s[1], z: s[2], r: 5, t: "\uD83D\uDE8C Bus to other cities", ok: () => !L.busy && !L.seated && !L.driving, f: () => bus(s[0]) }));
    window.ACCRA_DEST_EXTRA = TOWNS.map(t => ({ n: t.n + " (" + realKm(t.z) + " km from Accra)", x: t.x, z: t.z }));
    window.ACCRA_WORLD = { hx, towns: TOWNS, tolls: TOLLS, chunks };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).world = 1;
    console.log("Accra big world ready: 12 x 27 km, " + TOWNS.length + " towns");
  } catch (err) { console.error("accra-world failed:", err); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("\u26A0 World: " + err.message); }
})();
