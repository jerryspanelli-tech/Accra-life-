/* accra-interiors.js - realistic ground-floor interiors for the new Accra Central Police HQ, Accra General Hospital
 * and Accra Galleria Mall. Each interior is a set of rooms with real walls and doorways, furniture placed for its use,
 * room signs and ceiling lights. Built once, the first time the game starts. Uses the shared furniture in ACCRA_KIT. */
(function () {
  const start = () => {
    try {
      const K = window.ACCRA_KIT;
      if (!K) return false;
      const B = BABYLON, WH = 3.2, T = .3;
      const lampM = new B.StandardMaterial("ri_lamp", scene); lampM.emissiveColor = B.Color3.FromHexString("#fff3d6"); lampM.diffuseColor = B.Color3.Black();

      const solidBox = (w, h, d, x, y, z, col) => { const m = B.MeshBuilder.CreateBox("ri", { width: w, height: h, depth: d }, scene); m.position.set(x, y, z); m.material = mat(col); m.checkCollisions = true; m.isPickable = false; return m; };
      const floor = (w, d, x, z, col) => { const m = B.MeshBuilder.CreateBox("rf", { width: w, height: .05, depth: d }, scene); m.position.set(x, .03, z); m.material = mat(col); m.checkCollisions = false; m.isPickable = false; return m; };

      // a wall from (ax,az) to (bx,bz), with gaps where doors are
      function wallWithDoors(cx, cz, ax, az, bx, bz, doors, col) {
        const horiz = az === bz, fixed = horiz ? az : ax;
        const lo = horiz ? Math.min(ax, bx) : Math.min(az, bz), hi = horiz ? Math.max(ax, bx) : Math.max(az, bz);
        const cuts = [];
        doors.forEach(d => {
          const along = horiz ? d.x : d.z, across = horiz ? d.z : d.x;
          if (Math.abs(across - fixed) < .01 && along - d.w / 2 >= lo - .01 && along + d.w / 2 <= hi + .01) cuts.push([along - d.w / 2, along + d.w / 2]);
        });
        cuts.sort((p, q) => p[0] - q[0]);
        const piece = (a, b) => { const len = b - a, mid = (a + b) / 2; if (horiz) solidBox(len, WH, T, cx + mid, WH / 2, cz + fixed, col); else solidBox(T, WH, len, cx + fixed, WH / 2, cz + mid, col); };
        let cur = lo;
        cuts.forEach(c => { if (c[0] > cur + .05) piece(cur, c[0]); cur = Math.max(cur, c[1]); });
        if (hi > cur + .05) piece(cur, hi);
      }

      // build one interior: def = { outer, rooms, doors, furniture, inside, exit, wall }
      function build(cx, cz, def) {
        const col = def.wall, o = def.outer;
        // outer walls
        wallWithDoors(cx, cz, o.x0, o.z0, o.x1, o.z0, def.doors, col);
        wallWithDoors(cx, cz, o.x0, o.z1, o.x1, o.z1, def.doors, col);
        wallWithDoors(cx, cz, o.x0, o.z0, o.x0, o.z1, def.doors, col);
        wallWithDoors(cx, cz, o.x1, o.z0, o.x1, o.z1, def.doors, col);
        // rooms: floor, the room's walls (shared walls are simply built twice, which is harmless), a ceiling light, a sign
        def.rooms.forEach(r => {
          floor(r.x1 - r.x0, r.z1 - r.z0, cx + (r.x0 + r.x1) / 2, cz + (r.z0 + r.z1) / 2, r.floor);
          wallWithDoors(cx, cz, r.x0, r.z0, r.x1, r.z0, def.doors, col);
          wallWithDoors(cx, cz, r.x0, r.z1, r.x1, r.z1, def.doors, col);
          wallWithDoors(cx, cz, r.x0, r.z0, r.x0, r.z1, def.doors, col);
          wallWithDoors(cx, cz, r.x1, r.z0, r.x1, r.z1, def.doors, col);
          const lamp = B.MeshBuilder.CreateBox("rl", { width: 1.6, height: .08, depth: 1.6 }, scene);
          lamp.position.set(cx + (r.x0 + r.x1) / 2, WH - .06, cz + (r.z0 + r.z1) / 2); lamp.material = lampM; lamp.isPickable = false; lamp.checkCollisions = false;
          if (r.name) K.tag(r.name, cx + (r.x0 + r.x1) / 2, 2.75, cz + r.z0 + 1.1, 4.2);
        });
        // ceiling over the whole interior
        const ceil = B.MeshBuilder.CreateBox("rc", { width: o.x1 - o.x0, height: .1, depth: o.z1 - o.z0 }, scene);
        ceil.position.set(cx + (o.x0 + o.x1) / 2, WH + .05, cz + (o.z0 + o.z1) / 2); ceil.material = mat("#f3f1ec"); ceil.isPickable = false; ceil.checkCollisions = false;
        // furniture: [id, x, z, rotY, scale]
        def.furniture.forEach(f => {
          const id = f[0], x = cx + f[1], z = cz + f[2], ry = f[3] || 0, sc = f[4] || 1;
          K.collider(id, x, z, ry, sc);
          K.item(id, x, z, ry, false, sc);
        });
        return { inside: { x: cx + def.inside.x, z: cz + def.inside.z }, exit: { x: cx + def.exit.x, z: cz + def.exit.z } };
      }

      // ---------- layouts ----------
      const HOSPITAL = {
        wall: "#f4f7fa", outer: { x0: -20, x1: 20, z0: -15, z1: 15 },
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
          ["counter", 0, 7, 0, .8], ["chair", -16, 6], ["chair", -14, 6], ["chair", -16, 10], ["chair", -14, 10],
          ["desk", -15, -8], ["chair", -15, -6], ["bed1", -10, -12, Math.PI / 2], ["shelf", -19, -12, Math.PI / 2],
          ["counter", 0, -10, 0, .9], ["shelf", -3, -14], ["shelf", 0, -14], ["shelf", 3, -14],
          ["bed1", 9, -12], ["bed1", 13, -12], ["bed1", 17, -12], ["bed1", 9, -7], ["bed1", 13, -7], ["bed1", 17, -7],
          ["bed1", 8, 6], ["bed1", 14, 6], ["bed1", 8, 12], ["bed1", 14, 12], ["tv", 11, 4.5, 0, .6], ["shelf", 18, 10, -Math.PI / 2]
        ],
        inside: { x: 0, z: 12 }, exit: { x: 0, z: 13.5 }
      };
      const POLICE = {
        wall: "#dfe6ee", outer: { x0: -20, x1: 20, z0: -15, z1: 15 },
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
        ],
        inside: { x: -12, z: 12 }, exit: { x: -12, z: 13.5 }
      };
      const MALL = {
        wall: "#efe9dc", outer: { x0: -25, x1: 25, z0: -20, z1: 20 },
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
          ["coffee", -2, -12], ["chair", -4, -12], ["chair", 0, -12], ["coffee", 2, 8], ["chair", 0, 8], ["chair", 4, 8],
          ["dining", 16, -14], ["chair", 14, -14], ["chair", 18, -14], ["dining", 22, -6], ["chair", 20, -6], ["counter", 21, -18],
          ["bed2", 15, 12], ["bed2", 21, 12], ["sofa", 17, 5], ["tv", 22, 4], ["dining", 15, 17]
        ],
        inside: { x: 0, z: 17 }, exit: { x: 0, z: 18.5 }
      };

      window.ACCRA_INTERIORS = {
        build: (id, cx, cz) => build(cx, cz, id === "police" ? POLICE : id === "hospital" ? HOSPITAL : MALL),
        ready: true
      };
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).interiors = 1;
      console.log("Accra building interiors ready");
      return true;
    } catch (err) { console.error("accra-interiors failed:", err); return true; }
  };
  const timer = setInterval(() => { if (window.ACCRA_KIT && start()) clearInterval(timer); }, 300);
})();
