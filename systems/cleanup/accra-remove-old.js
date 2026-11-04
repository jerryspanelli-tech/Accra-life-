/* accra-remove-old.js - removes the OLD police station and hospital that accra-upgrade.js builds,
 * and their shop and kiosk points, then points the game's police, hospital and job positions at the NEW buildings.
 * Runs after accra-upgrade.js and before accra-hq.js. The pub, dealership, stadium and Amoamah estate are kept. */
(function () {
  try {
    // old footprints (x0..x1, z0..z1) from accra-upgrade.js
    const OLD = [
      { n: "police",   x0: 17, x1: 54,  z0: 76, z1: 111 },
      { n: "hospital", x0: 85, x1: 136, z0: 76, z1: 113 }
    ];
    const inOld = (x, z) => OLD.some(f => x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
    const keepName = /^(g|ground|road|sea|sand|sg)/;

    // 1. remove every old building mesh (and its signs, roofs, furniture and parked cars) inside the old footprints
    let gone = 0;
    scene.meshes.slice().forEach(m => {
      if (!m || m.isDisposed() || keepName.test(m.name || "")) return;
      m.computeWorldMatrix(true);
      const c = m.getBoundingInfo().boundingBox.centerWorld;
      if (inOld(c.x, c.z)) { m.dispose(); gone++; }
    });

    // 2. the game's police, hospital and job positions now point at the new buildings
    const old = window.ACCRA_PLACES || {};
    window.ACCRA_PLACES = Object.assign({}, old, {
      pd: { x: -100, z: 114.4, ox: -100, oz: 60, depot: { x: -100, z: 60, h: Math.PI } }, // Police HQ
      hp: { x: 92, z: 110.4, ox: 110, oz: 131, depot: { x: 110, z: 131, h: Math.PI } } // Accra General Hospital
    });

    // 3. remove any legacy shop points still located inside the retired police/hospital footprints
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

    window.ACCRA_REMOVED_OLD = { meshes: gone, kitPoints: kitRemoved };
    console.log("Old police, hospital and mall removed:", gone, "meshes");
  } catch (err) { console.error("accra-remove-old failed:", err); }
})();
