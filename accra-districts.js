/* accra-districts.js - Stage 3: each district has its own architecture and character.
 * Airport City: modern glass towers. Osu: mixed-use shophouses with signs and balconies.
 * Makola: dense market stalls with striped canopies and crates. East Legon: walled villas with pools and hip roofs.
 * Central Accra: civic blocks with colonnades. Labadi: coastal houses with palms. Amoamah Estate: walled compounds.
 * It replaces only the generic city blocks, and builds only on lots that are free, so it never overlaps the
 * mall, police, hospital, stadium, dealership, villa, pub or the roads. */
(function () {
  try {
    const B = BABYLON;
    const RR = R;                                     // road grid from babylon.html
    const blockName = (i, j) => DG[i][j];

    // ----- 1. remove the generic blocks inside the city grid -----
    const inCity = (x, z) => x > RR[0] && x < RR[RR.length - 1] && z > RR[0] && z < RR[RR.length - 1];
    scene.meshes.filter(m => (m.name === "bd" || m.name === "rf") && inCity(m.position.x, m.position.z))
      .forEach(m => m.dispose());

    // ----- 2. free-lot test: a lot is free only if nothing solid is already there -----
    const skip = /^(road_|zebra|sig_|lamp_|lp|lh|apt_|fig|ffig|ghanaian|g$|sea|sand|ground)/;
    // measure every solid mesh once (not once per lot), then test lots against those saved boxes
    let OBS = null;
    function obstacles() {
      if (OBS) return OBS;
      OBS = [];
      for (const m of scene.meshes) {
        if (!m || m.isDisposed() || skip.test(m.name || "") || !m.getBoundingInfo) continue;
        m.computeWorldMatrix(true);
        const bb = m.getBoundingInfo().boundingBox;
        const a = bb.minimumWorld, c = bb.maximumWorld;
        if (c.y < .2) continue;                       // flat ground marks do not block a lot
        OBS.push([a.x, c.x, a.z, c.z]);
      }
      return OBS;
    }
    function taken(x1, x2, z1, z2) {
      const list = obstacles();
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        if (o[1] < x1 || o[0] > x2 || o[3] < z1 || o[2] > z2) continue;
        return true;
      }
      return false;
    }

    // ----- 3. building styles -----
    const hip = (hex) => (window.ACCRA_HIP ? window.ACCRA_HIP(hex) : null);
    function roofOn(cx, cz, w, d, y, hex) {
      const h = hip(hex);
      if (h) { const r = h.createInstance("dr"); r.scaling.set(w + 1, 2.2, d + 1); r.position.set(cx, y, cz); r.isPickable = false; }
      else box(w + .6, .4, d + .6, cx, y + .2, cz, hex, false);
    }
    function tower(cx, cz, w, d, rnd) {
      const h = 28 + rnd() * 22;
      box(w, h, d, cx, h / 2, cz, rnd() < .5 ? "#5f8aa8" : "#8fb3c9", true);
      for (let f = 3; f < h; f += 4) box(w + .3, .25, d + .3, cx, f, cz, "#dfe8ef", false);   // floor bands
      box(w + .6, .5, d + .6, cx, h + .25, cz, "#4a5a66", false);
    }
    function shophouse(cx, cz, w, d, rnd, col) {
      const floors = 2 + Math.floor(rnd() * 3), h = floors * 3.6;
      box(w, h, d, cx, h / 2, cz, col, true);
      box(w, 1.1, .3, cx, 1.8, cz + d / 2 + .05, ["#ff6b35", "#2ec4b6", "#ffbe0b", "#8338ec"][Math.floor(rnd() * 4)], false);   // shop sign band
      for (let f = 1; f < floors; f++) box(w + .6, .25, 1.4, cx, f * 3.6 + .1, cz + d / 2 + .6, "#e8e2d0", false);   // balconies
      roofOn(cx, cz, w, d, h, "#7b4b33");
    }
    function stall(cx, cz, rnd) {
      const cols = ["#c8102e", "#fcd116", "#006b3f", "#ffffff", "#2456a6"];
      const c1 = cols[Math.floor(rnd() * cols.length)], c2 = cols[Math.floor(rnd() * cols.length)];
      box(6, .15, 3.4, cx, 2.6, cz, c1, false);
      for (let k = -2; k <= 2; k++) box(.5, .15, 3.4, cx + k * 1.4, 2.6, cz, c2, false);       // striped canopy
      [[-2.6, -1.4], [2.6, -1.4], [-2.6, 1.4], [2.6, 1.4]].forEach(p => box(.15, 2.6, .15, cx + p[0], 1.3, cz + p[1], "#5a3a22", false));
      box(5, .9, 1.4, cx, .45, cz + 2.6, "#8a5a2b", true);                                    // counter
      for (let k = 0; k < 3; k++) box(.9, .6, .9, cx - 1.6 + k * 1.6, .3, cz - 3.2, ["#d9822b", "#c9a54a", "#8a1c2b"][k], false);   // crates
    }
    function villa(cx, cz, rnd) {
      const w = 16, d = 14, h = 6.4;
      box(w, h, d, cx, h / 2, cz, rnd() < .5 ? "#f4f1ea" : "#e9e3d3", true);
      roofOn(cx, cz, w, d, h, "#8c3b2b");
      for (let k = -1; k <= 1; k++) box(2.4, 1.9, .2, cx + k * 4.8, 4.6, cz + d / 2 + .05, "#2b2f36", false);    // windows
      [[-w / 2 - 1, 0, 2, d + 2], [w / 2 + 1, 0, 2, d + 2]].forEach(p => box(.5, 2.2, p[3], cx + p[0], 1.1, cz, "#e9e3d3", true));
      box(w + 2, 2.2, .5, cx, 1.1, cz - d / 2 - 1, "#e9e3d3", true);                          // back wall
      box(w + 2, 2.2, .5, cx - 4, 1.1, cz + d / 2 + 1, "#e9e3d3", true);                      // front wall, gate gap
      box(w + 2, 2.2, .5, cx + 9, 1.1, cz + d / 2 + 1, "#e9e3d3", true);
      box(4, .05, 6, cx + 4, .07, cz - d / 2 - 4, "#3ab8e0", false);                          // pool
    }
    function civic(cx, cz, w, d) {
      box(w, 10, d, cx, 5, cz, "#eee9dc", true);
      for (let k = -w / 2 + 2; k <= w / 2 - 2; k += 3) { const c = B.MeshBuilder.CreateCylinder("col", { diameter: .8, height: 9, tessellation: 10 }, scene); c.position.set(cx + k, 4.5, cz + d / 2 + 1); c.material = mat("#f4f1ea"); c.checkCollisions = true; }
      box(w + 2, .6, d + 2, cx, 10.3, cz, "#c9c2b0", false);
    }
    function beachhouse(cx, cz, w, d, rnd) {
      const h = 3.4;
      box(w, h, d, cx, h / 2, cz, ["#f5f0e6", "#f0d9a0", "#bfe3e8"][Math.floor(rnd() * 3)], true);
      roofOn(cx, cz, w, d, h, "#c9a54a");
    }
    function compound(cx, cz, w, d, rnd) {
      box(w, 2.2, .4, cx, 1.1, cz - d / 2, "#b9a890", true);
      box(w, 2.2, .4, cx, 1.1, cz + d / 2, "#b9a890", true);
      box(.4, 2.2, d, cx - w / 2, 1.1, cz, "#b9a890", true);
      box(.4, 2.2, d, cx + w / 2, 1.1, cz, "#b9a890", true);
      const h = 5 + rnd() * 2;
      box(w * .6, h, d * .55, cx, h / 2, cz, ["#e2b07a", "#9fc5a8", "#f0c9a8"][Math.floor(rnd() * 3)], true);
      box(w * .7, .3, d * .65, cx, h + .15, cz, "#8f9296", false);                           // tin roof
    }

    // ----- landmark areas: the districts must not build inside them (they have their own buildings) -----
    const LANDMARK_ZONES = [
      { n: "mall", x1: 4, x2: 66, z1: 4, z2: 66 },            // Accra Mall (Makola)
      { n: "pub", x1: -142, x2: -74, z1: -70, z2: -22 },      // The Accra Vibes Pub, its VIP lodge and car park
      { n: "police", x1: 14, x2: 56, z1: 80, z2: 116 },       // Police Department
      { n: "hospital", x1: 82, x2: 140, z1: 78, z2: 124 },    // Accra Hospital
      { n: "stadium", x1: 78, x2: 142, z1: 2, z2: 68 },       // Sports Stadium
      { n: "dealership", x1: 12, x2: 58, z1: -54, z2: -16 },  // Accra Motors
      { n: "amoamah", x1: 78, x2: 142, z1: -64, z2: -6 },     // Amoamah Estate plots (own houses)
      { n: "villa", x1: VX - 26, x2: VX + 26, z1: VZ - 26, z2: VZ + 26 }
    ];
    const inLandmark = (x, z) => LANDMARK_ZONES.some(a => x > a.x1 && x < a.x2 && z > a.z1 && z < a.z2);

    // ----- 4. build each district -----
    const pitch = { "Airport City": 26, "Osu": 16, "Makola": 10, "East Legon": 28, "Central Accra": 30, "Labadi": 16, "Amoamah Estate": 24 };
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let built = 0;
    for (let i = 0; i < RR.length - 1; i++) for (let j = 0; j < RR.length - 1; j++) {
      const name = blockName(i, j); if (!name || !pitch[name]) continue;
      const x0 = RR[i] + 12, x1 = RR[i + 1] - 12, z0 = RR[j] + 12, z1 = RR[j + 1] - 12, p = pitch[name];
      for (let x = x0 + p / 2; x <= x1 - p / 2; x += p) for (let z = z0 + p / 2; z <= z1 - p / 2; z += p) {
        const lx1 = x - p / 2 + 1, lx2 = x + p / 2 - 1, lz1 = z - p / 2 + 1, lz2 = z + p / 2 - 1;
        if (Math.hypot(x - VX, z - VZ) < 26) continue;                          // keep the villa plot free
        if (inLandmark(x, z)) continue;                                         // landmarks build their own buildings
        if (taken(lx1, lx2, lz1, lz2)) continue;
        const cx = x, cz = z;
        if (name === "Airport City") tower(cx, cz, p * .6, p * .6, rnd);
        else if (name === "Osu") shophouse(cx, cz, p * .7, p * .6, rnd, ["#e3d8c0", "#d6c4a0", "#c9b79a", "#b8c4c0"][Math.floor(rnd() * 4)]);
        else if (name === "Makola") { if (rnd() < .6) stall(cx, cz, rnd); else shophouse(cx, cz, p * .8, p * .6, rnd, "#f0c27a"); }
        else if (name === "East Legon") { if (rnd() < .75) villa(cx, cz, rnd); else palm(cx, cz); }
        else if (name === "Central Accra") civic(cx, cz, p * .8, p * .5);
        else if (name === "Labadi") { if (rnd() < .7) beachhouse(cx, cz, p * .6, p * .6, rnd); else palm(cx, cz); }
        else if (name === "Amoamah Estate") compound(cx, cz, p * .8, p * .8, rnd);
        built++;
      }
    }

    window.ACCRA_DISTRICTS = { built, styles: Object.keys(pitch) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).districts = 1;
    console.log("Accra districts built:", built, "lots");
  } catch (err) { console.error("accra-districts failed:", err); }
})();
