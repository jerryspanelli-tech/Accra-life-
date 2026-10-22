/* accra-interiors.js - interiors for the new Accra General Hospital, Accra Galleria Mall and Accra Central Police HQ.
 * Each has a ground floor, and the hospital and mall have an upper floor reached by a ramp through a stairwell opening.
 * Rooms have real walls and doorways, furniture is placed for each room's use, and each room has a sign and a light.
 * Built once, the first time the game starts. Uses the shared furniture in ACCRA_KIT. */
(function () {
  const start = () => {
    try {
      const K = window.ACCRA_KIT;
      if (!K) return false;
      const B = BABYLON, WH = 3.2, T = .3, UP = WH + .1;      // UP = height of the upper floor surface
      const lampM = new B.StandardMaterial("ri_lamp", scene); lampM.emissiveColor = B.Color3.FromHexString("#fff3d6"); lampM.diffuseColor = B.Color3.Black();
      const solid = (w, h, d, x, y, z, col) => { const m = B.MeshBuilder.CreateBox("ri", { width: w, height: h, depth: d }, scene); m.position.set(x, y, z); m.material = mat(col); m.checkCollisions = true; m.isPickable = false; return m; };
      const plate = (w, d, x, y, z, col, collide) => { const m = B.MeshBuilder.CreateBox("rf", { width: w, height: .1, depth: d }, scene); m.position.set(x, y - .05, z); m.material = mat(col); m.checkCollisions = !!collide; m.isPickable = false; return m; };

      // a wall from (ax,az) to (bx,bz), standing from height y0, with gaps where doors are
      function wall(cx, cz, y0, ax, az, bx, bz, doors, col) {
        const horiz = az === bz, fixed = horiz ? az : ax;
        const lo = horiz ? Math.min(ax, bx) : Math.min(az, bz), hi = horiz ? Math.max(ax, bx) : Math.max(az, bz);
        const cuts = [];
        (doors || []).forEach(d => {
          const along = horiz ? d.x : d.z, across = horiz ? d.z : d.x;
          if (Math.abs(across - fixed) < .01 && along - d.w / 2 >= lo - .01 && along + d.w / 2 <= hi + .01) cuts.push([along - d.w / 2, along + d.w / 2]);
        });
        cuts.sort((p, q) => p[0] - q[0]);
        const piece = (a, b) => { const len = b - a, mid = (a + b) / 2; const y = y0 + WH / 2;
          if (horiz) solid(len, WH, T, cx + mid, y, cz + fixed, col); else solid(T, WH, len, cx + fixed, y, cz + mid, col); };
        let cur = lo;
        cuts.forEach(c => { if (c[0] > cur + .05) piece(cur, c[0]); cur = Math.max(cur, c[1]); });
        if (hi > cur + .05) piece(cur, hi);
      }
      // the four walls of a rectangle
      const rectWalls = (cx, cz, y0, r, doors, col) => {
        wall(cx, cz, y0, r.x0, r.z0, r.x1, r.z0, doors, col); wall(cx, cz, y0, r.x0, r.z1, r.x1, r.z1, doors, col);
        wall(cx, cz, y0, r.x0, r.z0, r.x0, r.z1, doors, col); wall(cx, cz, y0, r.x1, r.z0, r.x1, r.z1, doors, col);
      };
      // a floor rectangle with a hole cut out of it, so stairs can come through
      function floorPieces(r, hole) {
        if (!hole || hole.x1 <= r.x0 || hole.x0 >= r.x1 || hole.z1 <= r.z0 || hole.z0 >= r.z1) return [r];
        const out = [];
        if (hole.z0 > r.z0) out.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: Math.min(hole.z0, r.z1) });
        if (hole.z1 < r.z1) out.push({ x0: r.x0, x1: r.x1, z0: Math.max(hole.z1, r.z0), z1: r.z1 });
        const mz0 = Math.max(r.z0, hole.z0), mz1 = Math.min(r.z1, hole.z1);
        if (hole.x0 > r.x0) out.push({ x0: r.x0, x1: Math.min(hole.x0, r.x1), z0: mz0, z1: mz1 });
        if (hole.x1 < r.x1) out.push({ x0: Math.max(hole.x1, r.x0), x1: r.x1, z0: mz0, z1: mz1 });
        return out.filter(p => p.x1 > p.x0 + .01 && p.z1 > p.z0 + .01);
      }
      function floorOf(cx, cz, r, hole, y, col, collide) {
        floorPieces(r, hole).forEach(p => plate(p.x1 - p.x0, p.z1 - p.z0, cx + (p.x0 + p.x1) / 2, y, cz + (p.z0 + p.z1) / 2, col, collide));
      }
      function lightAt(cx, cz, r, y) {
        const l = B.MeshBuilder.CreateBox("rl", { width: 1.6, height: .08, depth: 1.6 }, scene);
        l.position.set(cx + (r.x0 + r.x1) / 2, y, cz + (r.z0 + r.z1) / 2); l.material = lampM; l.isPickable = false; l.checkCollisions = false;
      }
      function furnish(cx, cz, list) {
        list.forEach(f => { const x = cx + f[1], z = cz + f[2], ry = f[3] || 0, sc = f[4] || 1; K.collider(f[0], x, z, ry, sc); K.item(f[0], x, z, ry, false, sc); });
      }

      // one floor: its rooms (floor, walls, light, sign), doors and furniture
      function floor(cx, cz, level, def) {
        const y0 = level === 0 ? 0 : UP + .05;
        const lvl = def[level === 0 ? "ground" : "upper"];
        const outer = def.outer;
        rectWalls(cx, cz, y0, outer, lvl.doors, def.wall);
        lvl.rooms.forEach(r => {
          floorOf(cx, cz, r, def.hole, level === 0 ? .05 : UP + .05, r.floor, true);
          rectWalls(cx, cz, y0, r, lvl.doors, def.wall);
          lightAt(cx, cz, r, y0 + WH - .06);
          if (r.name) K.tag(r.name, cx + (r.x0 + r.x1) / 2, y0 + 2.75, cz + r.z0 + 1.1, 4.2);
        });
        if (level === 0) {                                          // ground ceiling, with the stairwell opening cut out
          floorPieces(outer, def.hole).forEach(p => plate(p.x1 - p.x0, p.z1 - p.z0, cx + (p.x0 + p.x1) / 2, UP, cz + (p.z0 + p.z1) / 2, "#eeeae2", false));
        } else {
          floorPieces(outer, def.hole).forEach(p => plate(p.x1 - p.x0, p.z1 - p.z0, cx + (p.x0 + p.x1) / 2, UP + WH + .05, cz + (p.z0 + p.z1) / 2, "#eeeae2", false));
        }
        furnish(cx, cz, lvl.furniture.map(f => [f[0], f[1], f[2], f[3], f[4]]));
      }

      // the ramp: from the ground at (fromX, fromZ) up to the upper floor at (toX, toZ)
      function ramp(cx, cz, fx, fz, tx, tz, width) {
        const lo = new B.Vector3(cx + fx, .05, cz + fz), hi = new B.Vector3(cx + tx, UP + .05, cz + tz);
        const mid = B.Vector3.Center(lo, hi), len = B.Vector3.Distance(lo, hi);
        const node = new B.TransformNode("ramp", scene); node.position.copyFrom(mid); node.lookAt(hi);
        const p = B.MeshBuilder.CreateBox("rampP", { width, height: .25, depth: len }, scene);
        p.parent = node; p.position.set(0, 0, 0); p.material = mat("#b8b2a6"); p.checkCollisions = true; p.isPickable = false;
      }

      function build(cx, cz, def) {
        floor(cx, cz, 0, def);
        if (def.upper) { floor(cx, cz, 1, def); ramp(cx, cz, def.ramp.fx, def.ramp.fz, def.ramp.tx, def.ramp.tz, def.ramp.w); }
        return { inside: { x: cx + def.inside.x, z: cz + def.inside.z }, exit: { x: cx + def.exit.x, z: cz + def.exit.z } };
      }

      // ---------- layouts ----------
      const HOSPITAL = {
        wall: "#f4f7fa", outer: { x0: -20, x1: 20, z0: -15, z1: 15 },
        hole: { x0: -1, x1: 3, z0: 4, z1: 14 },
        ramp: { fx: 1, fz: 14, tx: 1, tz: 4, w: 4 },
        ground: {
          rooms: [
            { x0: -20, x1: -4, z0: 3, z1: 15, floor: "#d9ebf0", name: "WAITING" },
            { x0: -4, x1: 4, z0: 3, z1: 15, floor: "#e6f2f4", name: "RECEPTION" },
            { x0: 4, x1: 20, z0: 3, z1: 15, floor: "#e0f0e8", name: "EMERGENCY ROOM" },
            { x0: -20, x1: 20, z0: -1, z1: 3, floor: "#dfe6ea", name: "CORRIDOR" },
            { x0: -20, x1: -6, z0: -15, z1: -1, floor: "#e6f2f4", name: "OUTPATIENT" },
            { x0: -6, x1: 6, z0: -15, z1: -1, floor: "#e8f5e9", name: "PHARMACY" },
            { x0: 6, x1: 20, z0: -15, z1: -1, floor: "#eef4f7", name: "WARDS" }
          ],
          doors: [{ x: 0, z: 15, w: 4 }, { x: 12, z: 15, w: 3 }, { x: -4, z: 9, w: 2.4 }, { x: 4, z: 9, w: 2.4 },
                  { x: -12, z: 3, w: 2.4 }, { x: 0, z: 3, w: 3 }, { x: 12, z: 3, w: 2.6 },
                  { x: -13, z: -1, w: 2.4 }, { x: 0, z: -1, w: 2.4 }, { x: 13, z: -1, w: 2.4 },
                  { x: -6, z: -8, w: 2.2 }, { x: 6, z: -8, w: 2.2 }],
          furniture: [
            ["counter", -3, 6, 0, .8], ["chair", -16, 6], ["chair", -14, 6], ["chair", -16, 10], ["chair", -14, 10],
            ["desk", -15, -8], ["chair", -15, -6], ["bed1", -10, -12, Math.PI / 2], ["shelf", -19, -12, Math.PI / 2],
            ["counter", 0, -10, 0, .9], ["shelf", -3, -14], ["shelf", 0, -14], ["shelf", 3, -14],
            ["bed1", 9, -12], ["bed1", 13, -12], ["bed1", 17, -12], ["bed1", 9, -7], ["bed1", 13, -7], ["bed1", 17, -7],
            ["bed1", 8, 6], ["bed1", 14, 6], ["bed1", 8, 12], ["bed1", 14, 12], ["tv", 11, 4.5, 0, .6], ["shelf", 18, 10, -Math.PI / 2]
          ]
        },
        upper: {
          rooms: [
            { x0: -20, x1: -4, z0: -15, z1: -1, floor: "#e4eef5", name: "ICU" },
            { x0: -4, x1: 6, z0: -15, z1: -1, floor: "#e9f1f4", name: "OPERATING THEATRE" },
            { x0: 6, x1: 20, z0: -15, z1: -1, floor: "#eef4f7", name: "RECOVERY" },
            { x0: -20, x1: 20, z0: -1, z1: 3, floor: "#dfe6ea", name: "UPPER CORRIDOR" },
            { x0: -20, x1: -4, z0: 3, z1: 15, floor: "#e0f0e8", name: "MATERNITY" },
            { x0: -4, x1: 6, z0: 3, z1: 15, floor: "#e6f2f4", name: "LABORATORY" },
            { x0: 6, x1: 20, z0: 3, z1: 15, floor: "#f0f0ea", name: "X-RAY & SCAN" }
          ],
          doors: [{ x: -12, z: -1, w: 2.4 }, { x: 1, z: -1, w: 2.4 }, { x: 13, z: -1, w: 2.4 },
                  { x: -12, z: 3, w: 2.4 }, { x: 1, z: 3, w: 2.4 }, { x: 13, z: 3, w: 2.4 },
                  { x: -4, z: 9, w: 2.4 }, { x: 6, z: 9, w: 2.4 }],
          furniture: [
            ["bed1", -16, -12], ["bed1", -12, -12], ["bed1", -8, -12], ["bed1", -16, -6], ["bed1", -12, -6], ["bed1", -8, -6],
            ["shelf", -19, -3, Math.PI / 2], ["tv", -6, -13, 0, .6],
            ["bed1", 1, -11, Math.PI / 2], ["shelf", 5, -13, -Math.PI / 2], ["chair", 1, -7],
            ["bed1", 9, -12], ["bed1", 13, -12], ["bed1", 17, -12], ["bed1", 9, -6], ["bed1", 13, -6], ["bed1", 17, -6],
            ["bed1", -16, 6], ["bed1", -12, 6], ["bed1", -16, 12], ["bed1", -12, 12], ["chair", -8, 9],
            ["desk", -2, 6], ["chair", -2, 8], ["shelf", -3, 13], ["shelf", 5, 13, -Math.PI / 2],
            ["bed1", 13, 8], ["tv", 17, 5, 0, .6], ["desk", 9, 12], ["chair", 9, 10]
          ]
        },
        inside: { x: -2, z: 13 }, exit: { x: -2.5, z: 13.5 }
      };

      const MALL = {
        wall: "#efe9dc", outer: { x0: -25, x1: 25, z0: -20, z1: 20 },
        hole: { x0: -3, x1: 1, z0: -8, z1: 2 },
        ramp: { fx: -1, fz: 2, tx: -1, tz: -8, w: 4 },
        ground: {
          rooms: [
            { x0: -25, x1: -10, z0: -20, z1: -4, floor: "#f2e6ea", name: "CLOTHING" },
            { x0: -25, x1: -10, z0: -4, z1: 12, floor: "#e8eef2", name: "APPLIANCES" },
            { x0: -25, x1: -10, z0: 12, z1: 20, floor: "#eef5e8", name: "SUPERMARKET" },
            { x0: -10, x1: 10, z0: -20, z1: 20, floor: "#efe9dc", name: "ATRIUM" },
            { x0: 10, x1: 25, z0: -20, z1: 0, floor: "#f5ede0", name: "FOOD COURT" },
            { x0: 10, x1: 25, z0: 0, z1: 20, floor: "#f0e9e2", name: "FURNITURE" }
          ],
          doors: [{ x: 0, z: 20, w: 6 }, { x: -10, z: -12, w: 3 }, { x: -10, z: 4, w: 3 }, { x: -10, z: 16, w: 3 },
                  { x: 10, z: -10, w: 3 }, { x: 10, z: 10, w: 3 }, { x: -17, z: -4, w: 3 }, { x: -17, z: 12, w: 3 }, { x: 17, z: 0, w: 3 }],
          furniture: [
            ["counter", -17, -17], ["wardrobe", -14, -8, 0, .9], ["shelf", -23, -14, Math.PI / 2], ["shelf", -23, -8, Math.PI / 2],
            ["fridge", -23, -9], ["washer", -19, -9], ["tv", -14, -7], ["micro", -22, 0], ["cooker", -17, 0], ["fan", -13, 8],
            ["shelf", -23, 14, Math.PI / 2], ["shelf", -19, 14, Math.PI / 2], ["shelf", -15, 14, Math.PI / 2], ["counter", -13, 18],
            ["coffee", -6, -12], ["chair", -8, -12], ["chair", -4, -12], ["coffee", 6, -12], ["chair", 4, -12],
            ["coffee", 6, 8], ["chair", 4, 8], ["chair", 8, 8],
            ["dining", 16, -14], ["chair", 14, -14], ["chair", 18, -14], ["dining", 22, -6], ["chair", 20, -6], ["counter", 21, -18],
            ["bed2", 15, 12], ["bed2", 21, 12], ["sofa", 17, 5], ["tv", 22, 4], ["dining", 15, 17]
          ]
        },
        upper: {
          rooms: [
            { x0: -25, x1: -10, z0: -20, z1: 0, floor: "#f4eef0", name: "SHOES & BAGS" },
            { x0: -25, x1: -10, z0: 0, z1: 20, floor: "#eef3f6", name: "OPTICIAN" },
            { x0: -10, x1: 10, z0: -20, z1: 20, floor: "#efe9dc", name: "GALLERY" },
            { x0: 10, x1: 25, z0: -20, z1: 0, floor: "#2b2f36", name: "CINEMA 1" },
            { x0: 10, x1: 25, z0: 0, z1: 20, floor: "#f2ece2", name: "ARCADE" }
          ],
          doors: [{ x: -10, z: -10, w: 3 }, { x: -10, z: 10, w: 3 }, { x: 10, z: -10, w: 3 }, { x: 10, z: 10, w: 3 }],
          furniture: [
            ["shelf", -23, -14, Math.PI / 2], ["shelf", -23, -6, Math.PI / 2], ["counter", -17, -12], ["chair", -17, -9],
            ["desk", -18, 6], ["chair", -18, 9], ["shelf", -23, 12, Math.PI / 2], ["tv", -13, 15, 0, .6],
            ["coffee", -6, -12], ["chair", -8, -12], ["coffee", 6, -12], ["chair", 4, -12], ["chair", 8, -12],
            ["coffee", -6, 8], ["chair", -8, 8], ["coffee", 6, 8], ["chair", 4, 8],
            ["chair", 14, -16], ["chair", 17, -16], ["chair", 20, -16], ["chair", 14, -12], ["chair", 17, -12], ["chair", 20, -12],
            ["chair", 14, -8], ["chair", 17, -8], ["chair", 20, -8], ["tv", 24, -10, -Math.PI / 2, 1.2],
            ["tv", 12, 4], ["tv", 12, 9], ["sofa", 20, 12], ["tv", 24, 12, -Math.PI / 2, 1.2]
          ]
        },
        inside: { x: 0, z: 17 }, exit: { x: 0, z: 18.5 }
      };

      const POLICE = {
        wall: "#dfe6ee", outer: { x0: -20, x1: 20, z0: -15, z1: 15 },
        ground: {
          rooms: [
            { x0: -20, x1: -4, z0: 3, z1: 15, floor: "#dfe7ee", name: "PUBLIC COUNTER" },
            { x0: -4, x1: 4, z0: 3, z1: 15, floor: "#cfd6dc", name: "ARMOURY" },
            { x0: 4, x1: 12, z0: 3, z1: 15, floor: "#e6e1d6", name: "INTERVIEW 1" },
            { x0: 12, x1: 20, z0: 3, z1: 15, floor: "#e6e1d6", name: "INTERVIEW 2" },
            { x0: -20, x1: 20, z0: -1, z1: 3, floor: "#d5dbe2", name: "CORRIDOR" },
            { x0: -20, x1: -4, z0: -15, z1: -1, floor: "#e8edf2", name: "CID OFFICE" },
            { x0: -4, x1: 4, z0: -15, z1: -1, floor: "#c9ccd1", name: "HOLDING CELL 1" },
            { x0: 4, x1: 12, z0: -15, z1: -1, floor: "#c9ccd1", name: "HOLDING CELL 2" },
            { x0: 12, x1: 20, z0: -15, z1: -1, floor: "#e9e4da", name: "COMMANDER" }
          ],
          doors: [{ x: -12, z: 15, w: 4 }, { x: -12, z: 3, w: 3 }, { x: 0, z: 3, w: 2.4 }, { x: 8, z: 3, w: 2.2 }, { x: 16, z: 3, w: 2.2 },
                  { x: -4, z: 9, w: 2.4 }, { x: 4, z: 9, w: 2.4 }, { x: 12, z: 9, w: 2.4 },
                  { x: -12, z: -1, w: 2.4 }, { x: 0, z: -1, w: 2.4 }, { x: 8, z: -1, w: 2.4 }, { x: 16, z: -1, w: 2.4 },
                  { x: -4, z: -8, w: 2.4 }, { x: 4, z: -8, w: 2.4 }, { x: 12, z: -8, w: 2.4 }],
          furniture: [
            ["counter", -10, 6, 0, 1.2], ["chair", -17, 9], ["chair", -15, 9], ["chair", -17, 12], ["chair", -15, 12],
            ["shelf", -2.5, 12], ["shelf", 2.5, 12], ["shelf", 0, 5],
            ["desk", 8, 9], ["chair", 8, 7], ["desk", 16, 9], ["chair", 16, 7],
            ["desk", -16, -12], ["desk", -12, -12], ["desk", -16, -6], ["desk", -12, -6],
            ["chair", -16, -10.5], ["chair", -12, -10.5], ["chair", -16, -4.5], ["chair", -12, -4.5], ["shelf", -19, -9, -Math.PI / 2],
            ["bed1", 0, -12], ["bed1", 0, -6], ["bed1", 8, -12], ["bed1", 8, -6],
            ["desk", 16, -12], ["chair", 16, -10], ["sofa", 16, -5], ["shelf", 19, -9, -Math.PI / 2]
          ]
        },
        inside: { x: -12, z: 12 }, exit: { x: -12, z: 13.5 }
      };

      const DEFS = { police: POLICE, hospital: HOSPITAL, mall: MALL };
      window.ACCRA_INTERIORS = {
        build: (id, cx, cz) => { const d = DEFS[id]; if (!d) return null; return build(cx, cz, d); },
        ready: true
      };
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).interiors = 1;
      console.log("Accra building interiors ready");
      return true;
    } catch (err) { console.error("accra-interiors failed:", err); return true; }
  };
  const timer = setInterval(() => { if (window.ACCRA_KIT && start()) clearInterval(timer); }, 300);
})();
