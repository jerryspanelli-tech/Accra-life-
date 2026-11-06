/* accra-market.js - Makola market, styled like the reference: a dense grid of stalls, each with a coloured
 * umbrella, a table and piled goods, with walkways between them. The old Makola shops and palms are cleared first.
 * The roads, traffic lights, lamps, signs, the Accra Motors dealership and everything outside Makola are left alone.
 * Stalls use thin instances, so the whole market draws with a few draw calls. */
(function () {
  try {
    const B = BABYLON;
    const AREA = { x1: -64, x2: 64, z1: -64, z2: 64 };          // Makola, the central district
    const DEALER = { x1: 14, x2: 56, z1: -50, z2: -20 };        // Accra Motors: kept as it is
    const KEEP = /^(r|road_|zebra|sig_|lamp|lp|lh|hw_|apt_|tl_|tw_|toll|boom_|car|cp|wp|wr|w|fig|ffig|fg|fp|fpv|cart|g|p|ct|cam|sea|highway|tr)/i;
    const UMBRELLA = ["#c8102e", "#fcd116", "#006b3f", "#2456a6", "#ff6b35", "#ffffff"];
    const CRATE = ["#d9822b", "#c9a54a", "#8a5a2b"];

    // 1. clear the old Makola: shops, palms and the generic blocks
    function clearMakola() {
      let removed = 0;
      scene.meshes.slice().forEach(m => {
        if (!m || m.isDisposed() || KEEP.test(m.name || "") || (m.parent && m.parent !== null)) return;
        m.computeWorldMatrix(true);
        const c = m.getBoundingInfo().boundingBox.centerWorld;
        if (c.y > 60) return;
        const inMakola = c.x > AREA.x1 && c.x < AREA.x2 && c.z > AREA.z1 && c.z < AREA.z2;
        const inDealer = c.x > DEALER.x1 && c.x < DEALER.x2 && c.z > DEALER.z1 && c.z < DEALER.z2;
        if (inMakola && !inDealer) { m.dispose(); removed++; }
      });
      return removed;
    }

    // 2. source meshes: one per colour, drawn many times with thin instances
    const mkMat = (name, hex) => { const m = new B.StandardMaterial(name, scene); m.diffuseColor = B.Color3.FromHexString(hex); m.specularColor = new B.Color3(.05, .05, .05); return m; };
    const umbrellaSrc = UMBRELLA.map((hex, i) => {
      const u = B.MeshBuilder.CreateCylinder("mk_umb" + i, { height: .7, diameterTop: 0, diameterBottom: 3.2, tessellation: 8 }, scene);
      u.material = mkMat("mk_umbM" + i, hex); u.isPickable = false; u.checkCollisions = false; return u;
    });
    const poleSrc = B.MeshBuilder.CreateBox("mk_pole", { width: .09, height: 2.6, depth: .09 }, scene);
    poleSrc.material = mkMat("mk_poleM", "#6b7178"); poleSrc.isPickable = false; poleSrc.checkCollisions = false;
    const tableSrc = B.MeshBuilder.CreateBox("mk_table", { width: 2.4, height: .9, depth: 1.4 }, scene);
    tableSrc.material = mkMat("mk_tableM", "#8a5a2b"); tableSrc.isPickable = false; tableSrc.checkCollisions = false;
    const crateSrc = CRATE.map((hex, i) => {
      const c = B.MeshBuilder.CreateBox("mk_crate" + i, { width: .5, height: .4, depth: .5 }, scene);
      c.material = mkMat("mk_crateM" + i, hex); c.isPickable = false; c.checkCollisions = false; return c;
    });

    // 3. place the stalls on a grid, leaving walkways along the roads
    function buildStalls() {
      const step = 6.5, half = 60;
      let stalls = 0;
      let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let x = -half; x <= half; x += step) {
        for (let z = -half; z <= half; z += step) {
          if (Math.abs(x) < 7 || Math.abs(z) < 7) continue;          // walkways along the two main streets
          if (x > DEALER.x1 - 4 && x < DEALER.x2 + 4 && z > DEALER.z1 - 4 && z < DEALER.z2 + 4) continue;
          if (rnd() < .18) continue;                                 // some gaps, so it is not too regular
          const px = x + (rnd() - .5) * 1.2, pz = z + (rnd() - .5) * 1.2;
          const umb = Math.floor(rnd() * UMBRELLA.length);
          const T = (x, y, z) => B.Matrix.Translation(x, y, z);
          tableSrc.thinInstanceAdd(T(px, .45, pz));
          poleSrc.thinInstanceAdd(T(px + 1.0, 1.3, pz + .5));
          umbrellaSrc[umb].thinInstanceAdd(T(px + 1.0, 2.6, pz + .5));
          for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) {
            const cr = Math.floor(rnd() * CRATE.length);
            crateSrc[cr].thinInstanceAdd(T(px - .6 + k * .6, .9 + .2, pz - .2 + (k % 2) * .4));
          }
          stalls++;
        }
      }
      // the sources must be visible for thin instances to draw
      [tableSrc, poleSrc, ...umbrellaSrc, ...crateSrc].forEach(s => { s.isVisible = true; if (s.thinInstanceRefreshBoundingInfo) s.thinInstanceRefreshBoundingInfo(false); });
      return stalls;
    }

    // run after the other scripts have built the city
    setTimeout(() => {
      const removed = clearMakola();
      const stalls = buildStalls();
      console.log("Makola market: removed", removed, "old pieces, built", stalls, "stalls");
    }, 9000);
    window.ACCRA_MARKET = { area: AREA };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).market = 1;
  } catch (err) { console.error("accra-market failed:", err); }
})();
