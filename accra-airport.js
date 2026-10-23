/* accra-airport.js - Kotoka International Airport (Full Rewrite)
 * Designed to look closer to a real modern airport with jet bridges and many planes.
 * Compatible with mat(), box(), palm(), sg, AccraAssets.createCar
 */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 };          // Airport centre
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const cars = [];
    const planes = [];

    // ---------- Helpers ----------
    function text(t, x, y, z, w, h, bg, fg, onGround) {
      const dt = new B.DynamicTexture("apt_t" + t, { width: 512, height: 128 }, scene, false);
      const c = dt.getContext();
      c.fillStyle = bg;
      c.fillRect(0, 0, 512, 128);
      c.fillStyle = fg;
      c.font = "bold 58px system-ui";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490);
      dt.update();

      const p = B.MeshBuilder.CreatePlane("apt_txt", { width: w, height: h }, scene);
      p.position.set(x, y, z);
      p.isPickable = false;
      if (onGround) p.rotation.x = Math.PI / 2;

      const m = new B.StandardMaterial("apt_tm" + t, scene);
      m.diffuseTexture = dt;
      m.emissiveTexture = dt;
      m.disableLighting = true;
      m.backFaceCulling = false;
      p.material = m;
    }

    // Realistic plane with Ghana colours
    function aircraft(x, z, rotY = 0, index = 0) {
      const group = new B.TransformNode("plane_" + index, scene);
      group.position.set(X(x), 0, Z(z));
      group.rotation.y = rotY;

      // Fuselage
      const fus = B.MeshBuilder.CreateCylinder("fus", {
        diameter: 3.1, height: 32, tessellation: 12
      }, scene);
      fus.rotation.z = Math.PI / 2;
      fus.position.set(0, 2.6, 0);
      fus.material = mat("#f4f4f2");
      fus.parent = group;
      fus.checkCollisions = true;
      if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

      // Nose
      const nose = B.MeshBuilder.CreateCylinder("nose", {
        diameterTop: 0.15, diameterBottom: 3.1, height: 5, tessellation: 12
      }, scene);
      nose.rotation.z = Math.PI / 2;
      nose.position.set(17.5, 2.6, 0);
      nose.material = mat("#f4f4f2");
      nose.parent = group;

      // Helper for parts
      const part = (w, h, d, px, py, pz, col, solid = false) => {
        const m = box(w, h, d, 0, 0, 0, col, solid);
        m.position.set(px, py, pz);
        m.parent = group;
        return m;
      };

      // Wings
      part(22, 0.25, 5.2, -2, 2.2, 0, "#1a1a1a", true);
      part(7, 0.2, 2.4, -9, 2.35, -10.5, "#1a1a1a", true);
      part(7, 0.2, 2.4, -9, 2.35, 10.5, "#1a1a1a", true);

      // Engines
      const engL = part(1.4, 1.4, 4.8, -3, 1.45, -7, "#c9cdd1");
      const engR = part(1.4, 1.4, 4.8, -3, 1.45, 7, "#c9cdd1");

      // Tail (Ghana red)
      part(0.4, 6.5, 4.8, -15.5, 5.6, 0, "#CE1126", true);

      // Horizontal stabilisers (Ghana gold)
      part(6.5, 0.2, 2.6, -15, 4.3, 0, "#FCD116", true);

      // Ghana stripes
      part(20, 0.4, 3.15, 0, 3.0, 0, "#006B3F");
      part(20, 0.2, 3.15, 0, 3.3, 0, "#FCD116");

      // Navigation lights
      const makeLight = (d, px, py, pz, col) => {
        const s = B.MeshBuilder.CreateSphere("nav", { diameter: d }, scene);
        s.position.set(px, py, pz);
        const m = mat(col);
        m.emissiveColor = B.Color3.FromHexString(col);
        s.material = m;
        s.parent = group;
        return s;
      };

      const lightRed = makeLight(0.35, -9, 2.5, -12.2, "#ff0000");
      const lightGreen = makeLight(0.35, -9, 2.5, 12.2, "#00ff00");
      const lightWhite = makeLight(0.28, 18.5, 2.9, 0, "#ffffff");

      group.metadata = { engL, engR, lightRed, lightGreen, lightWhite };
      planes.push(group);
      return group;
    }

    // Jet bridge
    function jetBridge(x, z, length = 18) {
      // Main tunnel
      box(2.2, 2.4, length, X(x), 3.8, Z(z), "#8a929a", true);
      // Support
      box(1.2, 3.2, 1.2, X(x), 1.6, Z(z + length * 0.3), "#6b7178", true);
      // Connection to terminal
      box(3.5, 2.6, 2.5, X(x), 3.9, Z(z - length * 0.45), "#9aa3ad", true);
    }

    // ========== GROUND ==========
    const ground = B.MeshBuilder.CreateGround("apt_ground", { width: 520, height: 380 }, scene);
    ground.position.set(C.x, -0.04, C.z);
    ground.material = mat("#4a7a3a");
    ground.receiveShadows = true;
    ground.isPickable = false;

    // ========== RUNWAY ==========
    box(320, 0.12, 36, X(0), 0.06, Z(-95), "#2a2c30", false);

    // Centre line
    for (let i = -140; i <= 140; i += 18) {
      box(9, 0.14, 0.7, X(i), 0.09, Z(-95), "#f2f2f2", false);
    }

    // Threshold markings
    for (let i = -148; i <= -132; i += 4) {
      box(0.6, 0.14, 28, X(i), 0.09, Z(-95), "#f2f2f2", false);
    }
    for (let i = 132; i <= 148; i += 4) {
      box(0.6, 0.14, 28, X(i), 0.09, Z(-95), "#f2f2f2", false);
    }

    text("09", X(-130), 0.1, Z(-95), 14, 7, "#2a2c30", "#ffffff", true);
    text("27", X(130), 0.1, Z(-95), 14, 7, "#2a2c30", "#ffffff", true);

    // Edge lights
    for (let i = -150; i <= 150; i += 16) {
      box(0.5, 0.25, 0.5, X(i), 0.2, Z(-113), "#ffe27a", false);
      box(0.5, 0.25, 0.5, X(i), 0.2, Z(-77), "#ffe27a", false);
    }

    // ========== TAXIWAYS ==========
    box(320, 0.1, 16, X(0), 0.05, Z(-65), "#3a3c42", false);
    box(16, 0.1, 40, X(-90), 0.05, Z(-45), "#3a3c42", false);
    box(16, 0.1, 40, X(90), 0.05, Z(-45), "#3a3c42", false);

    // Yellow lines
    box(320, 0.12, 0.4, X(0), 0.08, Z(-72), "#e6c700", false);
    box(320, 0.12, 0.4, X(0), 0.08, Z(-58), "#e6c700", false);

    // ========== MAIN APRON ==========
    box(340, 0.1, 70, X(0), 0.05, Z(-15), "#c5cad0", false);

    // ========== TERMINAL BUILDING ==========
    // Main long terminal
    box(280, 12, 28, X(0), 6, Z(28), "#e8ecef", true);

    // Glass front
    box(270, 8, 0.5, X(0), 5, Z(14.2), "#2e5a7a", false);

    // Roof
    box(290, 1.2, 32, X(0), 12.4, Z(28), "#9aa5ad", false);

    // Higher central section
    box(80, 16, 28, X(0), 8, Z(28), "#dfe5ea", true);
    box(76, 10, 0.5, X(0), 6, Z(14.2), "#2e5a7a", false);

    // Columns
    for (let i = -120; i <= 120; i += 24) {
      box(1.1, 12, 1.1, X(i), 6, Z(15), "#c9ced4", false);
    }

    // Entrance canopy
    box(90, 0.7, 12, X(0), 7.2, Z(42), "#9aa5ad", true);
    [-35, 0, 35].forEach(x => {
      box(0.8, 7, 0.8, X(x), 3.5, Z(47), "#6b7178", true);
    });

    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 15.5, Z(14.5), 52, 6, "#17191c", "#fcd116", false);

    // ========== JET BRIDGES + PLANES AT GATES ==========
    const gatePositions = [-110, -80, -50, -20, 10, 40, 70, 100];

    gatePositions.forEach((gx, i) => {
      // Jet bridge
      jetBridge(gx, 8, 16);

      // Plane parked at gate (facing the terminal)
      aircraft(gx, -6, Math.PI, i);
    });

    // Extra planes on the apron / taxiway
    aircraft(-130, -40, Math.PI * 0.5, 20);
    aircraft(130, -40, -Math.PI * 0.5, 21);
    aircraft(0, -40, Math.PI, 22);

    // ========== CONTROL TOWER ==========
    const tower = B.MeshBuilder.CreateCylinder("tower", {
      diameter: 5, height: 32, tessellation: 14
    }, scene);
    tower.position.set(X(160), 16, Z(45));
    tower.material = mat("#e9ecef");
    tower.checkCollisions = true;

    const cab = B.MeshBuilder.CreateCylinder("cab", {
      diameter: 11, height: 4, tessellation: 16
    }, scene);
    cab.position.set(X(160), 34, Z(45));
    cab.material = mat("#2e5a7a");
    cab.checkCollisions = true;

    const beacon = B.MeshBuilder.CreateSphere("beacon", { diameter: 1.6 }, scene);
    beacon.position.set(X(160), 37, Z(45));
    beacon.material = mat("#ff3b3b");

    // ========== HELIPADS ==========
    [-170, -145].forEach(x => {
      const ring = B.MeshBuilder.CreateTorus("helipad", {
        diameter: 14, thickness: 0.7, tessellation: 24
      }, scene);
      ring.position.set(X(x), 0.15, Z(25));
      ring.scaling.y = 0.06;
      ring.material = mat("#fcd116");
      box(0.4, 0.12, 6, X(x), 0.13, Z(25), "#f2f2f2", false);
    });

    // ========== FUEL TANKS ==========
    [[-165, -10], [-165, -28], [-165, -46]].forEach(p => {
      const t = B.MeshBuilder.CreateCylinder("tank", {
        diameter: 8, height: 7, tessellation: 16
      }, scene);
      t.position.set(X(p[0]), 3.5, Z(p[1]));
      t.material = mat("#dfe3e8");
      t.checkCollisions = true;
    });

    // Cargo
    box(36, 9, 22, X(160), 4.5, Z(-25), "#cfd6dc", true);

    // ========== CAR PARKS ==========
    box(140, 0.1, 28, X(-70), 0.05, Z(85), "#3a3d44", false);
    box(140, 0.1, 28, X(70), 0.05, Z(85), "#3a3d44", false);

    for (let i = -60; i <= 60; i += 9) {
      box(0.25, 0.12, 11, X(-70 + i), 0.08, Z(85), "#f2f2f2", false);
      box(0.25, 0.12, 11, X(70 + i), 0.08, Z(85), "#f2f2f2", false);
    }

    // Drop-off road
    box(300, 0.1, 14, X(0), 0.05, Z(58), "#2b2d31", false);
    box(300, 0.2, 0.7, X(0), 0.15, Z(65), "#9aa5ad", false);

    // Billboards
    [["WELCOME TO GHANA", "#7a2d4a", -100],
     ["FLY SAFE", "#d9822b", -40],
     ["ACCRA", "#2456a6", 20],
     ["KOTOKA", "#2e7d32", 80]].forEach(b => {
      box(0.5, 7, 0.5, X(b[2]), 3.5, Z(105), "#555a63", false);
      text(b[0], X(b[2]), 6.5, Z(105.4), 13, 4.5, b[1], "#ffffff", false);
    });

    // Palms
    [-150, -110, -70, 70, 110, 150].forEach(x => palm(X(x), Z(110)));

    // ========== ACCESS ROAD ==========
    box(10, 0.08, 110, -170, 0.04, -210, "#2b2d31", false);
    box(80, 0.08, 10, -210, 0.04, -260, "#2b2d31", false);

    // ========== FENCE ==========
    const FX = 210, FZ = 130;
    function fenceRun(x1, z1, x2, z2) {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const ang = Math.atan2(z2 - z1, x2 - x1);
      const n = Math.max(2, Math.round(len / 12));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const px = X(x1 + (x2 - x1) * t);
        const pz = Z(z1 + (z2 - z1) * t);
        const p = B.MeshBuilder.CreateCylinder("post", {
          diameter: 0.2, height: 2.8, tessellation: 6
        }, scene);
        p.position.set(px, 1.4, pz);
        p.material = mat("#4a4f57");
        p.checkCollisions = true;
      }
      const rail = box(len, 0.12, 0.12, X((x1 + x2) / 2), 2.3, Z((z1 + z2) / 2), "#8c949c", true);
      rail.rotation.y = -ang;
    }

    fenceRun(-FX, -FZ, FX, -FZ);
    fenceRun(-FX, FZ, FX, FZ);
    fenceRun(-FX, -FZ, -FX, FZ);
    fenceRun(FX, -FZ, FX, 40);
    fenceRun(FX, 70, FX, FZ);

    // Gate pillars
    box(4, 5, 1.5, X(FX + 2), 2.5, Z(45), "#3a3d44", true);
    box(4, 5, 1.5, X(FX + 2), 2.5, Z(65), "#3a3d44", true);
    text("KOTOKA", X(FX + 3), 5.2, Z(55), 9, 2.8, "#17191c", "#fcd116", false);

    // ========== MOVING VEHICLES ==========
    function makePath(pts, closed) {
      const segs = [];
      let total = 0;
      const all = closed ? pts.concat([pts[0]]) : pts;
      for (let i = 0; i < all.length - 1; i++) {
        const a = all[i], b = all[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        segs.push({ a, b, len, start: total });
        total += len;
      }
      return { segs, total, closed };
    }

    function at(path, d) {
      const dd = path.closed ? ((d % path.total) + path.total) % path.total : Math.min(Math.max(d, 0), path.total);
      for (const s of path.segs) {
        if (dd <= s.start + s.len + 1e-6) {
          const t = s.len ? (dd - s.start) / s.len : 0;
          return {
            x: s.a.x + (s.b.x - s.a.x) * t,
            z: s.a.z + (s.b.z - s.a.z) * t,
            dx: s.b.x - s.a.x,
            dz: s.b.z - s.a.z
          };
        }
      }
      const l = path.segs[path.segs.length - 1];
      return { x: l.b.x, z: l.b.z, dx: l.b.x - l.a.x, dz: l.b.z - l.a.z };
    }

    const loop = makePath([
      { x: X(-120), z: Z(55) },
      { x: X(120), z: Z(55) },
      { x: X(120), z: Z(62) },
      { x: X(-120), z: Z(62) }
    ], true);

    const access = makePath([
      { x: -170, z: -150 },
      { x: -170, z: -260 },
      { x: -240, z: -260 }
    ], false);

    function addVehicle(kind, color, path, offset, speed, pingPong) {
      if (!window.AccraAssets || !window.AccraAssets.createCar) return;
      try {
        const v = window.AccraAssets.createCar(scene, kind, { color });
        if (!v) return;
        cars.push({ node: v, path, d: offset, speed, dir: 1, pingPong });
      } catch (e) {}
    }

    addVehicle("trotro", "#f2c230", loop, 0, 7, false);
    addVehicle("sedan", "#a3172b", loop, loop.total * 0.3, 9, false);
    addVehicle("suv", "#333", loop, loop.total * 0.6, 8, false);
    addVehicle("sedan", "#f2c230", access, 0, 8, true);

    // ========== ANIMATION ==========
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
      const time = performance.now() * 0.001;

      // Vehicles
      cars.forEach(c => {
        if (c.pingPong) {
          c.d += c.dir * c.speed * dt;
          if (c.d >= c.path.total) { c.d = c.path.total; c.dir = -1; }
          if (c.d <= 0) { c.d = 0; c.dir = 1; }
        } else {
          c.d += c.speed * dt;
        }
        const p = at(c.path, c.d);
        const s = c.dir < 0 ? -1 : 1;
        c.node.position.set(p.x, Math.sin(time * 8 + c.d) * 0.025, p.z);
        c.node.rotation.y = Math.atan2(-p.dz * s, p.dx * s);
      });

      // Planes
      planes.forEach((p, i) => {
        const m = p.metadata;
        if (!m) return;
        if (m.engL) m.engL.rotation.x += 0.35;
        if (m.engR) m.engR.rotation.x += 0.35;

        const blink = Math.sin(time * 5 + i) > 0.25;
        if (m.lightRed?.material) m.lightRed.material.emissiveColor = blink ? B.Color3.Red() : B.Color3.Black();
        if (m.lightGreen?.material) m.lightGreen.material.emissiveColor = blink ? B.Color3.Green() : B.Color3.Black();
        if (m.lightWhite?.material) m.lightWhite.material.emissiveColor = Math.sin(time * 6 + i) > 0 ? B.Color3.White() : B.Color3.Black();
      });
    });

    // Register
    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 60 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({
      n: "Kotoka International Airport", x: C.x, z: C.z + 60
    });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;

    console.log("Kotoka Airport ready –", planes.length, "planes,", cars.length, "vehicles");
  } catch (err) {
    console.error("accra-airport failed:", err);
  }
})();
