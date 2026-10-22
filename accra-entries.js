/* accra-entries.js - makes the new police HQ, hospital and mall enterable, and adds them to the phone map.
 * Each building has a lobby room built far to the east (x 600..), so it never overlaps the city.
 * Walking up to the entrance enters the lobby automatically; walking up to the lobby door leaves.
 * Buildings are added to the phone map through window.ACCRA_DEST_EXTRA. */
(function () {
  try {
    const B = BABYLON;
    const LOBBY_W = 20, LOBBY_D = 14, LOBBY_H = 4.5;

    // name, outside entrance (x, z), and which way the door faces (-1 = the lobby door is on the south wall)
    const BUILDINGS = [
      { n: "Accra Central Police HQ", door: { x: 260, z: 34 },  lx: 600, lz: 0 },
      { n: "Accra General Hospital",  door: { x: 248, z: -100 }, lx: 600, lz: -90 },
      { n: "Accra Galleria Mall",     door: { x: 260, z: 106 }, lx: 600, lz: 90 }
    ];

    // ----- phone map: add the new buildings -----
    window.ACCRA_DEST_EXTRA = (window.ACCRA_DEST_EXTRA || []).concat(BUILDINGS.map(b => ({ n: b.n, x: b.door.x, z: b.door.z })));

    // ----- build a lobby for each building -----
    const floor = mat("#d8d2c4"), wall = mat("#efe7d2"), desk = mat("#8a5a2b"), chair = mat("#2b2f36");
    const box = (w, h, d, x, y, z, m) => {
      const b = B.MeshBuilder.CreateBox("lob", { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.material = m; b.checkCollisions = true; b.isPickable = false; return b;
    };
    BUILDINGS.forEach(b => {
      const x0 = b.lx, z0 = b.lz, hw = LOBBY_W / 2, hd = LOBBY_D / 2;
      // floor and ceiling
      const f = box(LOBBY_W, .1, LOBBY_D, x0, .05, z0, floor); f.checkCollisions = false;
      box(LOBBY_W, .2, LOBBY_D, x0, LOBBY_H, z0, wall).checkCollisions = false;
      // four walls, with a doorway gap of 4 m in the south wall
      box(LOBBY_W, LOBBY_H, .4, x0, LOBBY_H / 2, z0 - hd, wall);                  // north
      box(.4, LOBBY_H, LOBBY_D, x0 - hw, LOBBY_H / 2, z0, wall);                  // west
      box(.4, LOBBY_H, LOBBY_D, x0 + hw, LOBBY_H / 2, z0, wall);                  // east
      box((LOBBY_W - 4) / 2, LOBBY_H, .4, x0 - (LOBBY_W + 4) / 4, LOBBY_H / 2, z0 + hd, wall);   // south, left of door
      box((LOBBY_W - 4) / 2, LOBBY_H, .4, x0 + (LOBBY_W + 4) / 4, LOBBY_H / 2, z0 + hd, wall);   // south, right of door
      // reception desk and waiting chairs
      box(8, 1.1, 1.6, x0, .55, z0 - 3, desk);
      [-5, -2.5, 2.5, 5].forEach(dx => box(1.4, .9, 1.4, x0 + dx, .45, z0 + 3, chair));
      // the lobby's own door position, just inside the south wall
      b.inside = { x: x0, z: z0 + hd - 2 };
      b.outside = { x: b.door.x, z: b.door.z + 2.5 };
    });

    // ----- game links: enter and leave, once the life system is ready -----
    const wait = setInterval(() => {
      const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
      if (!L || !L.points) return;
      clearInterval(wait);
      BUILDINGS.forEach(b => {
        // walking up to the entrance takes you in, automatically
        L.points.push({
          x: b.door.x, z: b.door.z, r: 2.6, t: "\uD83D\uDEAA Enter " + b.n,
          ok: () => !L.busy && !L.seated && !L.driving && !L.inside,
          f: () => L.fade(700, () => L.tp(b.inside.x, b.inside.z), () => L.note("Welcome to " + b.n))
        });
        // walking up to the lobby door takes you back out
        L.points.push({
          x: b.inside.x, z: b.inside.z, r: 2.4, t: "\uD83D\uDEAA Leave " + b.n,
          ok: () => !L.busy && !L.seated && !L.driving && !!L.inside,
          f: () => L.fade(700, () => L.tp(b.outside.x, b.outside.z), () => L.note("You left " + b.n))
        });
      });
    }, 300);

    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).entries = 1;
    console.log("New buildings: entrances and phone map ready");
  } catch (err) { console.error("accra-entries failed:", err); }
})();
