/* accra-remove-old.js - retires legacy police/hospital/mall plot content and stale interaction points.
 * Runs after the city districts and accra-upgrade.js, before the dedicated civic buildings are built.
 * The footprint sweep is retained for the reserved old sites; an AABB audit reports any intersecting
 * meshes left behind without deleting them automatically. */
(function () {
  try {
    // old footprints (x0..x1, z0..z1) from accra-upgrade.js
    const OLD = [
      { n: "police",   x0: 17, x1: 54,  z0: 76, z1: 111 },
      { n: "hospital", x0: 85, x1: 136, z0: 76, z1: 113 },
      { n: "mall",     x0: 228, x1: 292, z0: 88, z1: 152 }
    ];
    const inOld = (x, z) => OLD.some(f => x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
    const keepName = /^(g|ground|road|sea|sand|sg)/;

    // 1. Retire content centred inside the reserved legacy footprints.
    //    Do not expand deletion to every intersecting mesh: that could cut into neighbouring lots.
    let gone = 0;
    scene.meshes.slice().forEach(m => {
      if (!m || m.isDisposed() || keepName.test(m.name || "")) return;
      m.computeWorldMatrix(true);
      const c = m.getBoundingInfo().boundingBox.centerWorld;
      if (inOld(c.x, c.z)) { m.dispose(); gone++; }
    });

    // 1b. Audit any non-road mesh whose world bounds still intersect a retired footprint.
    //     These are candidates for visual inspection, not automatic deletion.
    const remainingIntersecting = [];
    scene.meshes.forEach(m => {
      if (!m || m.isDisposed() || keepName.test(m.name || "") || !m.getBoundingInfo) return;
      m.computeWorldMatrix(true);
      const bb = m.getBoundingInfo().boundingBox, lo = bb.minimumWorld, hi = bb.maximumWorld;
      const hit = OLD.some(f => hi.x > f.x0 && lo.x < f.x1 && hi.z > f.z0 && lo.z < f.z1);
      if (hit) {
        const c = bb.centerWorld;
        remainingIntersecting.push({
          name: m.name || "(unnamed)",
          center: [Number(c.x.toFixed(2)), Number(c.y.toFixed(2)), Number(c.z.toFixed(2))],
          bounds: [Number(lo.x.toFixed(2)), Number(hi.x.toFixed(2)), Number(lo.z.toFixed(2)), Number(hi.z.toFixed(2))]
        });
      }
    });

    // 2. the game's police, hospital and job positions now point at the new buildings
    const old = window.ACCRA_PLACES || {};
    window.ACCRA_PLACES = Object.assign({}, old, {
      pd: { x: -100, z: 114.4, ox: -100, oz: 60, depot: { x: -100, z: 60, h: Math.PI } }, // Police HQ
      hp: { x: 92, z: 110.4, ox: 110, oz: 131, depot: { x: 110, z: 131, h: Math.PI } } // Accra General Hospital
    });

    // 3. remove any legacy interaction points still located inside the retired police/hospital/mall footprints
    const removePoints = arr => {
      if (!arr) return 0;
      let n = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        if (p && typeof p.x === "number" && inOld(p.x, p.z)) { arr.splice(i, 1); n++; }
      }
      return n;
    };
    const kitRemoved = removePoints(window.ACCRA_KIT && window.ACCRA_KIT.points);
    const wait = setInterval(() => {
      const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
      if (!L || !L.points) return;
      clearInterval(wait);
      removePoints(L.points);
    }, 300);

    window.ACCRA_REMOVED_OLD = { meshes: gone, kitPoints: kitRemoved, remainingIntersecting };
    console.log("Legacy police/hospital/mall plot cleanup:", gone, "meshes removed;", remainingIntersecting.length, "intersecting meshes need visual review");
  } catch (err) { console.error("accra-remove-old failed:", err); }
})();
