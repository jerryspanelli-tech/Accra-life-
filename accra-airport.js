/* accra-airport.js - Kotoka International Airport
 * Solid perimeter wall + security fence, boom barriers, gate control panel,
 * runway, terminal, control tower, aircraft, helipads, fuel tanks,
 * car parks, and moving cars + trucks.
 */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 };
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const cars = [];

    // ---------- Helpers ----------
    const makeMat = (hex, emissive) => {
      if (typeof mat === "function") return mat(hex);
      const m = new B.StandardMaterial("aptMat_" + hex, scene);
      m.diffuseColor = B.Color3.FromHexString(hex);
      if (emissive) {
        m.emissiveColor = B.Color3.FromHexString(emissive);
        m.diffuseColor = B.Color3.Black();
      }
      m.specularColor = B.Color3.Black();
      return m;
    };

    const safeBox = (w, h, d, x, y, z, color, collide) => {
      if (typeof box === "function") return box(w, h, d, x, y, z, color, collide);
      const m = B.MeshBuilder.CreateBox("apt_box", { width: w, height: h, depth: d }, scene);
      m.position.set(x, y, z);
      m.material = makeMat(color);
      if (collide) m.checkCollisions = true;
      return m;
    };

    const safePalm = (x, z) => {
      if (typeof palm === "function") return palm(x, z);
    };

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
      return p;
    }

    function aircraft(x, z) {
      const fus = B.MeshBuilder.CreateCylinder("apt_fus", {
        diameter: 3.4, height: 26, tessellation: 10
      }, scene);
      fus.rotation.z = Math.PI / 2;
      fus.position.set(X(x), 2.4, Z(z));
      fus.material = makeMat("#f4f4f2");
      fus.checkCollisions = true;
      if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

      safeBox(0.4, 4.2, 3.4, X(x - 11), 4.4, Z(z), "#1d3b6b", true);
      safeBox(5.4, 0.25, 26, X(x + 1), 1.9, Z(z), "#e4e7ea", true);
      safeBox(1.1, 1.1, 3.2, X(x + 2), 1.3, Z(z - 6.5), "#c8ccd0", false);
      safeBox(1.1, 1.1, 3.2, X(x + 2), 1.3, Z(z + 6.5), "#c8ccd0", false);
    }

    // ========== PERIMETER WALL + FENCE ==========
    const FX = 190, FZ = 105;
    const GATE = [48, 64];
    const WALL_H = 3.2;
    const FENCE_H = 1.8;

    function wallRun(x1, z1, x2, z2) {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const ang = Math.atan2(z2 - z1, x2 - x1);
      const cx = X((x1 + x2) / 2);
      const cz = Z((z1 + z2) / 2);

      const wall = safeBox(len, WALL_H, 0.55, cx, WALL_H / 2, cz, "#9aa3ad", true);
      wall.rotation.y = -ang;

      const coping = safeBox(len + 0.2, 0.18, 0.7, cx, WALL_H + 0.09, cz, "#5a6068", true);
      coping.rotation.y = -ang;

      const n = Math.max(2, Math.round(len / 8));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const px = X(x1 + (x2 - x1) * t);
        const pz = Z(z1 + (z2 - z1) * t);
        const post = B.MeshBuilder.CreateCylinder("apt_fpost", {
          diameter: 0.12, height: FENCE_H, tessellation: 6
        }, scene);
        post.position.set(px, WALL_H + FENCE_H / 2, pz);
        post.material = makeMat("#3a3f47");
        post.checkCollisions = true;
      }

      const railY1 = WALL_H + FENCE_H - 0.15;
      const railY2 = WALL_H + FENCE_H * 0.45;
      const rail1 = safeBox(len, 0.08, 0.08, cx, railY1, cz, "#3a3f47", false);
      rail1.rotation.y = -ang;
      const rail2 = safeBox(len, 0.08, 0.08, cx, railY2, cz, "#3a3f47", false);
      rail2.rotation.y = -ang;
    }

    wallRun(-FX, -FZ,  FX, -FZ);
    wallRun(-FX,  FZ,  FX,  FZ);
    wallRun(-FX, -FZ, -FX,  FZ);
    wallRun( FX, -FZ,  FX, GATE[0]);
    wallRun( FX, GATE[1], FX, FZ);

    // Gate pillars + beam
    safeBox(3.2, 5.8, 2.2, X(FX + 1.8), 2.9, Z(GATE[0] - 1.5), "#4a5058", true);
    safeBox(3.2, 5.8, 2.2, X(FX + 1.8), 2.9, Z(GATE[1] + 1.5), "#4a5058", true);
    safeBox(3.5, 0.7, GATE[1] - GATE[0] + 4, X(FX + 1.8), 5.6, Z((GATE[0] + GATE[1]) / 2), "#3a4048", true);
    text("KOTOKA", X(FX + 3.2), 6.6, Z((GATE[0] + GATE[1]) / 2), 11, 2.8, "#17191c", "#fcd116", false);

    // Security booth
    safeBox(4.5, 3.2, 4.5, X(FX + 7), 1.6, Z(GATE[0] - 6), "#dce1e6", true);
    safeBox(4.7, 0.25, 4.7, X(FX + 7), 3.3, Z(GATE[0] - 6), "#8a929a", true);

    // ========== SECURITY GATE (BOOM BARRIERS) ==========
    safeBox(1.4, 1.1, 1.4, X(FX + 4.5), 0.55, Z(GATE[0] + 3), "#3a3f47", true);
    safeBox(1.4, 1.1, 1.4, X(FX + 4.5), 0.55, Z(GATE[1] - 3), "#3a3f47", true);

    safeBox(0.18, 0.18, 9, X(FX + 4.5), 1.15, Z(GATE[0] + 7.5), "#f2c200", true);
    safeBox(0.18, 0.18, 9, X(FX + 4.5), 1.15, Z(GATE[1] - 7.5), "#f2c200", true);

    for (let i = 0; i < 5; i++) {
      safeBox(0.2, 0.22, 1.4, X(FX + 4.5), 1.15, Z(GATE[0] + 4.2 + i * 1.6), "#c41e3a", false);
      safeBox(0.2, 0.22, 1.4, X(FX + 4.5), 1.15, Z(GATE[1] - 4.2 - i * 1.6), "#c41e3a", false);
    }

    // Flashing lights
    const light1 = B.MeshBuilder.CreateSphere("gateLight1", { diameter: 0.35 }, scene);
    light1.position.set(X(FX + 4.5), 2.1, Z(GATE[0] + 3));
    light1.material = makeMat("#ff2222", "#ff2222");

    const light2 = B.MeshBuilder.CreateSphere("gateLight2", { diameter: 0.35 }, scene);
    light2.position.set(X(FX + 4.5), 2.1, Z(GATE[1] - 3));
    light2.material = makeMat("#ff2222", "#ff2222");

    let gateFlash = 0;
    scene.onBeforeRenderObservable.add(() => {
      gateFlash += 0.08;
      const on = Math.sin(gateFlash) > 0;
      if (light1.material) light1.material.emissiveColor = on ? B.Color3.FromHexString("#ff3333") : B.Color3.Black();
      if (light2.material) light2.material.emissiveColor = on ? B.Color3.FromHexString("#ff3333") : B.Color3.Black();
    });

    // Cameras
    safeBox(0.35, 0.25, 0.5, X(FX + 1.8), 5.0, Z(GATE[0] - 1.5), "#222", false);
    safeBox(0.35, 0.25, 0.5, X(FX + 1.8), 5.0, Z(GATE[1] + 1.5), "#222", false);

    // Stop lines
    safeBox(6, 0.05, 0.4, X(FX + 6), 0.06, Z(GATE[0] + 2), "#ffffff", false);
    safeBox(6, 0.05, 0.4, X(FX + 6), 0.06, Z(GATE[1] - 2), "#ffffff", false);

    // ========== GATE CONTROL PANEL ==========
    const panelX = X(FX + 7.8);
    const panelZ = Z(GATE[0] - 6);

    safeBox(1.6, 1.8, 0.7, panelX, 1.5, panelZ + 2.8, "#2c3036", true);

    const topPanel = safeBox(1.7, 0.12, 0.9, panelX, 2.45, panelZ + 2.8, "#1a1d22", true);
    topPanel.rotation.x = -0.35;

    const screen = safeBox(1.1, 0.7, 0.08, panelX, 2.15, panelZ + 2.55, "#0a1520", false);
    if (screen.material) screen.material.emissiveColor = B.Color3.FromHexString("#1a3a5c");

    const btnOpen = B.MeshBuilder.CreateCylinder("gateBtnOpen", {
      diameter: 0.28, height: 0.08, tessellation: 12
    }, scene);
    btnOpen.position.set(panelX - 0.35, 2.42, panelZ + 2.95);
    btnOpen.material = makeMat("#00c853", "#00e676");
    btnOpen.rotation.x = Math.PI / 2;

    const btnClose = B.MeshBuilder.CreateCylinder("gateBtnClose", {
      diameter: 0.28, height: 0.08, tessellation: 12
    }, scene);
    btnClose.position.set(panelX + 0.35, 2.42, panelZ + 2.95);
    btnClose.material = makeMat("#d50000", "#ff1744");
    btnClose.rotation.x = Math.PI / 2;

    const statusGreen = B.MeshBuilder.CreateSphere("gateStatusG", { diameter: 0.12 }, scene);
    statusGreen.position.set(panelX - 0.45, 2.55, panelZ + 2.55);
    statusGreen.material = makeMat("#00c853", "#00e676");

    const statusRed = B.MeshBuilder.CreateSphere("gateStatusR", { diameter: 0.12 }, scene);
    statusRed.position.set(panelX + 0.45, 2.55, panelZ + 2.55);
    statusRed.material = makeMat("#d50000", "#ff1744");

    text("GATE CONTROL", panelX, 2.85, panelZ + 2.9, 1.6, 0.35, "#111", "#fcd116", false);

    // ========== RUNWAY ==========
    safeBox(260, 0.1, 30, X(0), 0.06, Z(-70), "#2b2d31", false);
    for (let i = -120; i <= 120; i += 16) {
      safeBox(6, 0.12, 0.6, X(i), 0.08, Z(-70), "#f2f2f2", false);
    }
    for (let i = -124; i <= -112; i += 3) {
      safeBox(0.5, 0.12, 22, X(i), 0.08, Z(-70), "#f2f2f2", false);
    }
    for (let i = 112; i <= 124; i += 3) {
      safeBox(0.5, 0.12, 22, X(i), 0.08, Z(-70), "#f2f2f2", false);
    }

    text("09", X(-112), 0.09, Z(-70), 12, 6, "#2b2d31", "#ffffff", true);
    text("27", X(112),  0.09, Z(-70), 12, 6, "#2b2d31", "#ffffff", true);

    for (let i = -125; i <= 125; i += 18) {
      const l1 = safeBox(0.5, 0.2, 0.5, X(i), 0.2, Z(-85.5), "#ffe27a", false);
      const l2 = safeBox(0.5, 0.2, 0.5, X(i), 0.2, Z(-54.5), "#ffe27a", false);
      if (l1.material) l1.material.emissiveColor = B.Color3.FromHexString("#ffe27a");
      if (l2.material) l2.material.emissiveColor = B.Color3.FromHexString("#ffe27a");
    }

    // ========== TAXIWAY + APRON ==========
    safeBox(260, 0.1, 14, X(0), 0.05, Z(-50), "#3a3c42", false);
    safeBox(260, 0.12, 0.4, X(0), 0.07, Z(-57.2), "#e6c700", false);
    safeBox(260, 0.12, 0.4, X(0), 0.07, Z(-42.8), "#e6c700", false);
    safeBox(300, 0.1, 50, X(0), 0.05, Z(-18), "#c9ced4", false);

    [-96, -60, -24, 12, 48, 84].forEach(x => {
      aircraft(x, -18);
      safeBox(3, 3.2, 12, X(x), 1.6, Z(4), "#b8bec6", false);
    });

    // ========== TERMINAL ==========
    safeBox(230, 11, 22, X(0), 5.5, Z(27), "#e9ecef", true);
    safeBox(70, 17, 22, X(0), 8.5, Z(27), "#dfe5ea", true);
    safeBox(66, 9, 0.4, X(0), 5.2, Z(16.2), "#2e5a7a", false);
    safeBox(226, 6.4, 0.4, X(0), 3.6, Z(16.2), "#2e5a7a", false);
    safeBox(236, 0.8, 26, X(0), 11.4, Z(27), "#9aa5ad", false);

    for (let i = -105; i <= 105; i += 21) {
      safeBox(0.8, 11, 0.8, X(i), 5.5, Z(15.8), "#c9ced4", false);
    }

    [-30, -10, 10, 30].forEach(x => {
      safeBox(5, 2.8, 0.2, X(x), 1.4, Z(16.3), "#5a3a22", false);
    });

    safeBox(120, 0.5, 9, X(-30), 6.4, Z(43), "#9aa5ad", true);
    [-80, -20, 40].forEach(x => {
      safeBox(0.6, 6.2, 0.6, X(x), 3.1, Z(47.5), "#6b7178", true);
    });

    safeBox(26, 1, 1.6, X(0), 1.1, Z(15.6), "#4a4f57", false);
    safeBox(40, 2.4, 0.3, X(-70), 8, Z(16.1), "#101216", false);
    safeBox(40, 2.4, 0.3, X(70), 8, Z(16.1), "#101216", false);

    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 14.6, Z(16.4), 48, 6, "#17191c", "#fcd116", false);

    // ========== CONTROL TOWER ==========
    const tw = B.MeshBuilder.CreateCylinder("apt_tower", {
      diameter: 4, height: 26, tessellation: 14
    }, scene);
    tw.position.set(X(150), 13, Z(40));
    tw.material = makeMat("#e9ecef");
    tw.checkCollisions = true;

    const cab = B.MeshBuilder.CreateCylinder("apt_cab", {
      diameter: 9, height: 3.2, tessellation: 16
    }, scene);
    cab.position.set(X(150), 27.5, Z(40));
    cab.material = makeMat("#2e5a7a");
    cab.checkCollisions = true;

    const beacon = B.MeshBuilder.CreateSphere("apt_beacon", { diameter: 1.4 }, scene);
    beacon.position.set(X(150), 30.4, Z(40));
    beacon.material = makeMat("#ff3b3b", "#ff3b3b");

    const beaconLight = new B.PointLight("apt_beaconL", new B.Vector3(X(150), 30.8, Z(40)), scene);
    beaconLight.diffuse = new B.Color3(1, 0.25, 0.25);
    beaconLight.intensity = 4;
    beaconLight.range = 80;

    scene.onBeforeRenderObservable.add(() => {
      beacon.rotation.y += 0.04;
    });

    // ========== HELIPADS ==========
    [-172, -144].forEach(x => {
      const ring = B.MeshBuilder.CreateTorus("apt_hp", {
        diameter: 12, thickness: 0.6, tessellation: 24
      }, scene);
      ring.position.set(X(x), 0.14, Z(20));
      ring.scaling.y = 0.05;
      ring.material = makeMat("#fcd116");
      ring.isPickable = false;
      safeBox(0.3, 0.1, 5, X(x), 0.12, Z(20), "#f2f2f2", false);
    });

    // ========== FUEL TANKS ==========
    [[-158, -4], [-158, -18], [-158, -32]].forEach(p => {
      const t = B.MeshBuilder.CreateCylinder("apt_tank", {
        diameter: 7, height: 6, tessellation: 18
      }, scene);
      t.position.set(X(p[0]), 3, Z(p[1]));
      t.material = makeMat("#dfe3e8");
      t.checkCollisions = true;
    });

    safeBox(30, 8, 20, X(150), 4, Z(-22), "#cfd6dc", true);

    // ========== CAR PARKS ==========
    safeBox(120, 0.1, 22, X(-60), 0.05, Z(80), "#3a3d44", false);
    safeBox(120, 0.1, 22, X(60),  0.05, Z(80), "#3a3d44", false);
    for (let i = -56; i <= 56; i += 8) {
      safeBox(0.2, 0.12, 9, X(-60 + i), 0.08, Z(80), "#f2f2f2", false);
      safeBox(0.2, 0.12, 9, X(60 + i),  0.08, Z(80), "#f2f2f2", false);
    }

    safeBox(290, 0.1, 12, X(45), 0.05, Z(56), "#2b2d31", false);
    safeBox(290, 0.2, 0.6, X(45), 0.15, Z(62.4), "#9aa5ad", false);

    // Billboards
    [["WELCOME TO GHANA", "#7a2d4a", -90],
     ["FLY SAFE", "#d9822b", -30],
     ["ACCRA", "#2456a6", 30],
     ["KOTOKA", "#2e7d32", 90]].forEach(b => {
      safeBox(0.4, 6, 0.4, X(b[2]), 3, Z(98), "#555a63", false);
      text(b[0], X(b[2]), 5.8, Z(98.3), 12, 4, b[1], "#ffffff", false);
    });

    [-130, -100, 100, 130].forEach(x => {
      safePalm(X(x), Z(102));
    });

    // ========== ACCESS ROAD ==========
    safeBox(8, 0.06, 94, -165, 0.04, -197, "#2b2d31", false);
    safeBox(70, 0.06, 8, -197.5, 0.04, -244, "#2b2d31", false);

    // ========== MOVING VEHICLES (cars + trucks) ==========
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
      const dd = path.closed
        ? ((d % path.total) + path.total) % path.total
        : Math.min(Math.max(d, 0), path.total);

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
      { x: X(-100), z: Z(53) },
      { x: X(170),  z: Z(53) },
      { x: X(170),  z: Z(59) },
      { x: X(-100), z: Z(59) }
    ], true);

    const access = makePath([
      { x: -165, z: -150 },
      { x: -165, z: -244 },
      { x: -230, z: -244 }
    ], false);

    const service = makePath([
      { x: X(-110), z: Z(-5) },
      { x: X(110),  z: Z(-5) },
      { x: X(110),  z: Z(10) },
      { x: X(-110), z: Z(10) }
    ], true);

    function addVehicle(kind, color, path, offset, speed, pingPong) {
      if (!window.AccraAssets || !window.AccraAssets.createCar) return;
      try {
        const v = window.AccraAssets.createCar(scene, kind, { color });
        if (!v) return;
        cars.push({ node: v, path, d: offset, speed, dir: 1, pingPong });
      } catch (e) {
        console.warn("Airport vehicle failed:", kind, e);
      }
    }

    // Drop-off loop
    addVehicle("trotro", "#f2c230", loop, 0,                  7.5, false);
    addVehicle("sedan",  "#a3172b", loop, loop.total * 0.20,  9.0, false);
    addVehicle("hatch",  "#e6e9ec", loop, loop.total * 0.40,  8.5, false);
    addVehicle("suv",    "#3a3d44", loop, loop.total * 0.60,  8.0, false);
    addVehicle("sedan",  "#1f4fa3", loop, loop.total * 0.80,  9.5, false);

    // Access road
    addVehicle("sedan",  "#f2c230", access, 0,                  8.0, true);
    addVehicle("suv",    "#222222", access, access.total * 0.4, 7.5, true);

    // Service road (trucks)
    addVehicle("truck",  "#c41e3a", service, 0,                    6.0, false);
    addVehicle("truck",  "#f2c200", service, service.total * 0.33, 5.5, false);
    addVehicle("trotro", "#4a4f57", service, service.total * 0.66, 6.5, false);

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
      cars.forEach(c => {
        if (c.pingPong) {
          c.d += c.dir * c.speed * dt;
          if (c.d >= c.path.total) { c.d = c.path.total; c.dir = -1; }
          if (c.d <= 0)            { c.d = 0;            c.dir = 1; }
        } else {
          c.d += c.speed * dt;
        }
        const p = at(c.path, c.d);
        const s = c.dir < 0 ? -1 : 1;
        c.node.position.set(p.x, 0, p.z);
        c.node.rotation.y = Math.atan2(-p.dz * s, p.dx * s);
      });
    });

    // Public registration
    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 58 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({
      n: "Kotoka International Airport", x: C.x, z: C.z + 58
    });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;

    console.log("Kotoka airport ready:", cars.length, "vehicles");
  } catch (err) {
    console.error("accra-airport failed:", err);
  }
})();
