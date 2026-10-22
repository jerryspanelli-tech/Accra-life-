/* accra-entries.js - the new police HQ, hospital and mall: map entries, and walking in and out of their interiors.
 * The interiors are built by accra-interiors.js. Walk up to a building's door to go in; walk to the inside exit to come out. */
(function () {
  try {
    const BUILDINGS = [
      { n: "Accra Central Police HQ", door: { x: 260, z: 34 }, id: "police", cx: 600, cz: 0 },
      { n: "Accra General Hospital", door: { x: 252, z: -100 }, id: "hospital", cx: 600, cz: -90 },
      { n: "Accra Galleria Mall", door: { x: 260, z: 106 }, id: "mall", cx: 600, cz: 90 }
    ];
    window.ACCRA_DEST_EXTRA = (window.ACCRA_DEST_EXTRA || []).concat(BUILDINGS.map(b => ({ n: b.n, x: b.door.x, z: b.door.z })));

    let inside = null;     // which building the player is in, or null
    const start = () => {
      const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api, I = window.ACCRA_INTERIORS;
      if (!L || !I || !I.ready) return false;
      BUILDINGS.forEach(b => {
        const r = I.build(b.id, b.cx, b.cz);
        L.points.push({
          x: b.door.x, z: b.door.z, r: 2.6, t: "\uD83D\uDEAA Enter " + b.n,
          ok: () => inside === null && !L.busy && !L.seated && !L.driving,
          f: () => L.fade(700, () => { inside = b.id; L.tp(r.inside.x, r.inside.z); }, () => L.note("Welcome to " + b.n))
        });
        L.points.push({
          x: r.exit.x, z: r.exit.z, r: 2.4, t: "\uD83D\uDEAA Leave " + b.n,
          ok: () => inside === b.id && !L.busy && !L.seated && !L.driving,
          f: () => L.fade(700, () => { inside = null; L.tp(b.door.x, b.door.z + 2.5); }, () => L.note("You left " + b.n))
        });
      });
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).entries = 1;
      return true;
    };
    const timer = setInterval(() => { if (start()) clearInterval(timer); }, 300);
  } catch (err) { console.error("accra-entries failed:", err); }
})();
