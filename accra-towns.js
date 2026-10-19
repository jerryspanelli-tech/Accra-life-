/* accra-towns.js - Stage 4: the towns on the highway to Kumasi, each with its own landmarks.
 * Positions match accra-world.js: the highway runs along x = hx(z), and each town centre is 220 m east of it.
 * Every town gets an entrance sign across the highway, a roadside market, a fuel station, and its own landmark. */
(function () {
  try {
    const B = BABYLON;
    const DRIFT = -2400, END = -24500;
    const S = t => t * t * (3 - 2 * t);
    const hx = z => DRIFT * S(Math.min(1, Math.max(0, (-z - 165) / (-END - 165))));   // highway centre line
    const TOWNS = [
      { n: "NSAWAM", z: -3500, landmark: "fish" },
      { n: "SUHUM", z: -6500, landmark: "hill" },
      { n: "NKAWKAW", z: -13000, landmark: "roundabout" },
      { n: "KONONGO", z: -19000, landmark: "gold" },
      { n: "EJISU", z: -22500, landmark: "gateway" },
      { n: "KUMASI KEJETIA", z: -24500, landmark: "kejetia" }
    ];

    const sign = (t, x, y, z, w, h, bg, fg) => {
      const dt = new B.DynamicTexture("tw_" + t, { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128); c.fillStyle = fg; c.font = "bold 56px system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490); dt.update();
      const p = B.MeshBuilder.CreatePlane("tw_sign", { width: w, height: h }, scene); p.position.set(x, y, z); p.isPickable = false;
      const m = new B.StandardMaterial("tw_m" + t, scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; p.material = m;
    };
    const cyl = (d, h, x, y, z, hex, solid, tess) => { const c = B.MeshBuilder.CreateCylinder("tw_cyl", { diameter: d, height: h, tessellation: tess || 10 }, scene); c.position.set(x, y, z); c.material = mat(hex); c.checkCollisions = !!solid; return c; };

    TOWNS.forEach(t => {
      const rx = hx(t.z), cx = rx + 220, cz = t.z;

      // entrance sign: two posts and a board across the highway, on the approach
      const ez = cz + 70;
      [-11, 11].forEach(o => cyl(.5, 8, rx + o, 4, ez, "#4a4f57", true));
      box(24, .7, .4, rx, 7.2, ez, "#17191c", false);
      sign(t.n, rx, 7.2, ez - .3, 20, 3.4, "#17191c", "#fcd116");

      // roadside market: a long open shed with striped canopy and stalls
      const mx = cx - 60, mz = cz + 25;
      box(40, .4, 14, mx, 4.2, mz, "#c8102e", false);
      [-18, -6, 6, 18].forEach(o => box(.25, 4, .25, mx + o, 2, mz - 6.5, "#5a3a22", true));
      for (let k = -2; k <= 2; k++) box(4, 1.2, 1.6, mx + k * 7, .6, mz + 5, ["#d9822b", "#2e7fd0", "#1f5c3a", "#f2f2f0", "#fcd116"][(k + 2) % 5], false);

      // fuel station: two pump islands under a canopy
      const fx = cx + 55, fz = cz - 45;
      box(26, .4, 14, fx, 6.2, fz, "#e6e9ec", false);
      [-8, 8].forEach(o => box(2.4, 2.4, 1.6, fx + o, 1.2, fz, "#d62828", true));
      [-10, 10].forEach(o => { box(.4, 6, .4, fx + o, 3, fz - 5, "#8c949c", true); box(.4, 6, .4, fx + o, 3, fz + 5, "#8c949c", true); });
      sign("FUEL", fx, 4.8, fz + 6.6, 6, 1.6, "#d62828", "#ffffff");

      // the town's own landmark
      if (t.landmark === "fish") {
        // Nsawam: a fish market hall with drying racks and a water tower
        box(44, 7, 22, cx + 10, 3.5, cz - 70, "#2e7fd0", true);
        for (let k = -18; k <= 18; k += 6) box(.3, 3, 8, cx + 10 + k, 1.5, cz - 80, "#8c949c", false);
        cyl(5, 14, cx + 52, 7, cz - 70, "#d9dde2", true, 14);
      } else if (t.landmark === "hill") {
        // Suhum: a grassy hill with a white church and steeple
        const hill = B.MeshBuilder.CreateSphere("tw_hill", { diameter: 60, segments: 10 }, scene);
        hill.scaling.y = .18; hill.position.set(cx + 10, 0, cz - 80); hill.material = mat("#5f8a3f"); hill.isPickable = false;
        box(16, 8, 10, cx + 10, 4, cz - 80, "#f4f1ea", true);
        box(4, 14, 4, cx + 10, 7, cz - 80, "#f4f1ea", true);
        const sp = B.MeshBuilder.CreateCylinder("tw_spire", { diameterTop: 0, diameterBottom: 4, height: 5, tessellation: 4 }, scene);
        sp.position.set(cx + 10, 16.5, cz - 80); sp.material = mat("#8a1c2b");
      } else if (t.landmark === "roundabout") {
        // Nkawkaw: a roundabout with a central monument column
        const ring = B.MeshBuilder.CreateTorus("tw_round", { diameter: 40, thickness: 6, tessellation: 40 }, scene);
        ring.position.set(cx + 10, .3, cz - 80); ring.scaling.y = .1; ring.material = mat("#4a4f57"); ring.isPickable = false;
        cyl(3, 14, cx + 10, 7, cz - 80, "#c9a54a", true, 12);
      } else if (t.landmark === "gold") {
        // Konongo: a gold arch over the road
        [-16, 16].forEach(o => box(2.5, 9, 2.5, cx + 10 + o, 4.5, cz - 80, "#c9a54a", true));
        box(36, 2, 2.5, cx + 10, 9.8, cz - 80, "#c9a54a", false);
        sign("KONONGO GOLD", cx + 10, 13, cz - 80, 18, 3.4, "#17191c", "#fcd116");
      } else if (t.landmark === "gateway") {
        // Ejisu: a twin-arch gateway over the highway with toll-style booths
        [-14, 14].forEach(o => box(3, 12, 3, rx + o, 6, cz - 60, "#5a6068", true));
        box(34, 2.4, 3, rx, 12.6, cz - 60, "#2e5a7a", false);
        [-12, 12].forEach(o => box(3.6, 3.2, 3.6, rx + o * 1.6, 1.6, cz - 92, "#e6c700", true));
      } else if (t.landmark === "kejetia") {
        // Kumasi Kejetia: a large covered market hall with a central tower
        box(120, 9, 56, cx, 4.5, cz - 20, "#9a8c76", true);
        for (let k = -54; k <= 54; k += 9) box(6, 1.2, 6, cx + k, 3.8, cz - 20, ["#c8102e", "#fcd116", "#006b3f", "#2456a6"][Math.abs(Math.round(k / 9)) % 4], false);
        box(12, 26, 12, cx + 70, 13, cz - 40, "#b8a58a", true);
        sign("KEJETIA MARKET", cx, 11, cz - 49, 40, 6, "#17191c", "#fcd116");
      }
      palm(cx - 80, cz + 40); palm(cx + 90, cz + 40);
    });

    window.ACCRA_TOWNS = TOWNS.map(t => ({ n: t.n, z: t.z, x: hx(t.z) + 220 }));
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push(...TOWNS.map(t => ({ n: t.n, x: hx(t.z) + 220, z: t.z })));
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).towns = 1;
    console.log("Accra towns built:", TOWNS.length);
  } catch (err) { console.error("accra-towns failed:", err); }
})();
