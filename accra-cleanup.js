/* accra-cleanup.js - removes the mall, the hospital and the stadium from the map.
 * Anything whose centre is inside one of their areas is removed. Roads, the police station, the pub and the
 * villa are not in these areas and are left alone. Runs after the city is built, and once more later to catch
 * parts that were built after the first pass. */
(function () {
  try {
    const AREAS = [
      { name: "mall", x1: 8, x2: 62, z1: 8, z2: 62 },          // mall, centre (35, 35)
      { name: "stadium", x1: 80, x2: 142, z1: 4, z2: 66 },     // stadium, centre (110, 35)
      { name: "hospital", x1: 80, x2: 142, z1: 78, z2: 122 }   // hospital, centre (110, 98)
    ];
    // never remove the road surface, the lights, the crossings, the highway, the airport or the toll
    const KEEP = /^(r|road_|zebra|sig_|lamp|lp|lh|hw_|apt_|tl_|tw_|toll|boom_|car|cp|wp|wr|w|fig|ffig|fg|fp|fpv|g|p|ct|cam|sea|highway)/i;

    function run() {
      let removed = 0;
      scene.meshes.slice().forEach(m => {
        if (!m || m.isDisposed() || KEEP.test(m.name || "")) return;
        if (m.parent && m.parent !== null) return;             // only remove top-level pieces
        m.computeWorldMatrix(true);
        const bb = m.getBoundingInfo().boundingBox, c = bb.centerWorld;
        if (c.y > 60) return;                                   // keep the far city skyline
        for (const a of AREAS) {
          if (c.x > a.x1 && c.x < a.x2 && c.z > a.z1 && c.z < a.z2) { m.dispose(); removed++; return; }
        }
      });
      console.log("accra-cleanup: removed", removed, "pieces (mall, stadium, hospital)");
      return removed;
    }

    // the city is built by several scripts, so run the clean-up after they have finished
    setTimeout(run, 6000);
    setTimeout(run, 20000);
    window.ACCRA_CLEANUP = { run, areas: AREAS.map(a => a.name) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).cleanup = 1;
  } catch (err) { console.error("accra-cleanup failed:", err); }
})();
