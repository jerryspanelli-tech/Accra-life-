/* accra-transport.js - Public Transport, Trotros, VIP Coaches, Shaxi & Ride App */
(function () {
  try {
    const B = BABYLON;
    const transportVehicles = [];

    // Helper for creating paths
    function makePath(pts, closed) {
      const segs = []; let total = 0;
      const all = closed ? pts.concat([pts[0]]) : pts;
      for (let i = 0; i < all.length - 1; i++) {
        const a = all[i], b = all[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
        segs.push({ a, b, len, start: total }); total += len;
      }
      return { segs, total, closed };
    }

    function getPointOnPath(path, d) {
      const dd = path.closed ? ((d % path.total) + path.total) % path.total : Math.min(Math.max(d, 0), path.total);
      for (const s of path.segs) {
        if (dd <= s.start + s.len + 1e-6) {
          const t = s.len ? (dd - s.start) / s.len : 0;
          return { x: s.a.x + (s.b.x - s.a.x) * t, z: s.a.z + (s.b.z - s.a.z) * t, dx: s.b.x - s.a.x, dz: s.b.z - s.a.z };
        }
      }
      const l = path.segs[path.segs.length - 1];
      return { x: l.b.x, z: l.b.z, dx: l.b.x - l.a.x, dz: l.b.z - l.a.z };
    }

    // Main Corridor Route (Accra through Highway toward Kumasi)
    const highwayRoute = makePath([
      { x: 0, z: -150 },
      { x: 0, z: -70 },
      { x: -150, z: -70 },
      { x: -300, z: 200 },
      { x: -300, z: 400 }
    ], true);

    function spawnTransportVehicle(kind, color, path, offset, speed) {
      if (!window.AccraAssets || !window.AccraAssets.createCar) return;
      const v = window.AccraAssets.createCar(scene, kind, { color });
      transportVehicles.push({ node: v, path, d: offset, speed });
    }

    // Spawn Trotros and VIP Coaches on the highway loop
    spawnTransportVehicle("trotro", "#f2c230", highwayRoute, 0, 8);
    spawnTransportVehicle("vip_bus", "#ffffff", highwayRoute, 120, 10);
    spawnTransportVehicle("shaxi", "#e63946", highwayRoute, 240, 12);

    // Animation Loop for Transport
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      transportVehicles.forEach(tv => {
        tv.d += tv.speed * dt;
        const p = getPointOnPath(tv.path, tv.d);
        tv.node.position.set(p.x, 0, p.z);
        tv.node.rotation.y = Math.atan2(-p.dz, p.dx);
      });
    });

    // Shaxi App Integration for In-Game Phone
    window.ACCRA_SHAXI = {
      callRide: (destinationName) => {
        console.log("Shaxi booked to: " + destinationName);
        alert("🚗 Shaxi Ride Booked! Your driver is arriving shortly.");
      }
    };

    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).transport = 1;
    console.log("Accra Transport & Shaxi system initialized.");
  } catch (err) {
    console.error("accra-transport failed:", err);
  }
})();
