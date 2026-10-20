/* accra-traffic.js - NPC drivers on the city roads.
 * Cars drive two loops on the grid: the outer avenues and an inner ring. They keep to the right, stop at red
 * lights using the same signal timer as accra-roads.js (window.ACCRA_TRAFFIC), and keep a gap from the car ahead.
 * Cars only drive on the grid roads, never through buildings. */
(function () {
  try {
    const B = BABYLON;
    const CRUISE = 9, GAP = 9, STOP_ZONE = 14, SIDE = 2.2;   // m/s, following gap, distance to start stopping, lane offset
    const routes = {
      outer: [{ x: -150, z: -150 }, { x: 150, z: -150 }, { x: 150, z: 150 }, { x: -150, z: 150 }],
      inner: [{ x: -70, z: -70 }, { x: 70, z: -70 }, { x: 70, z: 70 }, { x: -70, z: 70 }]
    };
    const JUNCTIONS = [-150, -70, 0, 70, 150];

    // build a closed path with cumulative distances, and the distances of every junction on it
    function makePath(pts) {
      const segs = []; let total = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b.x - a.x, b.z - a.z);
        segs.push({ a, b, len, start: total }); total += len;
      }
      const junctions = [];
      segs.forEach(s => {
        const horizontal = s.a.z === s.b.z;                    // moving along x
        const from = horizontal ? s.a.x : s.a.z, to = horizontal ? s.b.x : s.b.z;
        const lo = Math.min(from, to), hi = Math.max(from, to);
        JUNCTIONS.forEach(j => {
          if (j > lo && j < hi) {
            const t = Math.abs(j - from) / s.len;
            junctions.push({ d: s.start + t * s.len, axis: horizontal ? "ew" : "ns" });
          }
        });
      });
      // the corners are junctions too
      segs.forEach(s => junctions.push({ d: s.start, axis: s.a.z === s.b.z ? "ew" : "ns" }));
      junctions.sort((p, q) => p.d - q.d);
      return { segs, total, junctions };
    }

    // position and travel direction at distance d along the path
    function at(path, d) {
      const dd = ((d % path.total) + path.total) % path.total;
      for (const s of path.segs) {
        if (dd <= s.start + s.len) {
          const t = s.len ? (dd - s.start) / s.len : 0;
          const fx = (s.b.x - s.a.x) / (s.len || 1), fz = (s.b.z - s.a.z) / (s.len || 1);
          return { x: s.a.x + (s.b.x - s.a.x) * t, z: s.a.z + (s.b.z - s.a.z) * t, fx, fz };
        }
      }
      const l = path.segs[path.segs.length - 1];
      return { x: l.b.x, z: l.b.z, fx: 0, fz: 1 };
    }

    // the next junction ahead of distance d (wraps round the loop)
    function nextJunction(path, d) {
      const dd = ((d % path.total) + path.total) % path.total;
      for (const j of path.junctions) if (j.d > dd + .01) return { dist: j.d - dd, axis: j.axis };
      const j0 = path.junctions[0];
      return { dist: path.total - dd + j0.d, axis: j0.axis };
    }

    // ----- the cars -----
    const CARS = [
      { route: "outer", d: 0, kind: "sedan", color: "#2c6e8c" },
      { route: "outer", d: 300, kind: "hatch", color: "#e6e9ec" },
      { route: "outer", d: 620, kind: "suv", color: "#3a3d44" },
      { route: "outer", d: 900, kind: "sedan", color: "#f2c230" },
      { route: "outer", d: 1150, kind: "trotro", color: "#f2c230" },
      { route: "inner", d: 0, kind: "hatch", color: "#c9a54a" },
      { route: "inner", d: 260, kind: "sedan", color: "#8a1c2b" },
      { route: "inner", d: 480, kind: "pickup", color: "#d9822b" }
    ];
    const paths = { outer: makePath(routes.outer), inner: makePath(routes.inner) };
    const live = [];
    CARS.forEach(c => {
      if (!window.AccraAssets || !window.AccraAssets.createCar) return;
      const node = window.AccraAssets.createCar(scene, c.kind, { color: c.color });
      // NPC cars are traffic, not walls: no collisions, so the player can walk and drive past them
      node.getChildMeshes().forEach(m => { m.checkCollisions = false; m.isPickable = false; });
      live.push({ node, route: c.route, d: c.d, v: CRUISE });
    });

    function light(t) { return window.ACCRA_TRAFFIC ? window.ACCRA_TRAFFIC.state() : { ns: "green", ew: "green" }; }

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      const sig = light();
      live.forEach(c => {
        const path = paths[c.route];
        // target speed: cruise, slow for the car ahead, stop for a red light
        let target = CRUISE;
        const nj = nextJunction(path, c.d);
        const signal = nj.axis === "ew" ? sig.ew : sig.ns;
        if (nj.dist < STOP_ZONE && nj.dist > 1 && signal === "red") target = 0;
        if (nj.dist < STOP_ZONE && nj.dist > 1 && signal === "yellow" && c.v < 6) target = 0;
        // gap to the next car on the same loop
        live.forEach(o => {
          if (o === c || o.route !== c.route) return;
          let gap = o.d - c.d; if (gap < 0) gap += path.total;
          if (gap < GAP + 6) target = Math.min(target, o.v * (gap < GAP ? .3 : .8));
        });
        c.v += (target - c.v) * Math.min(1, dt * 2.5);
        c.d += c.v * dt;

        // place the car in its lane: keep to the right of the direction of travel
        const p = at(path, c.d);
        const rx = p.fz, rz = -p.fx;                           // right-hand side of the travel direction
        c.node.position.set(p.x + rx * SIDE, 0, p.z + rz * SIDE);
        c.node.rotation.y = Math.atan2(-p.fz, p.fx);
      });
    });

    window.ACCRA_TRAFFIC_CARS = { count: live.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).traffic = 1;
    console.log("NPC traffic ready:", live.length, "cars");
  } catch (err) { console.error("accra-traffic failed:", err); }
})();
