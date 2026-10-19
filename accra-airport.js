/* accra-airport.js - Kotoka International Airport: fenced site with a gate, runway, taxiway, apron with aircraft,
 * a fuller terminal (columns, canopy, lobby, check-in counters), control tower, helipads, fuel tanks, cargo shed,
 * car parks, a drop-off loop road with moving cars and an airport shuttle bus, an access road from the city
 * with a taxi, and billboards. Uses the game's helpers: box(), mat(), palm(), sg and window.AccraAssets.createCar. */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 };                         // airport centre, west of the city
    const X = x => C.x + x, Z = z => C.z + z;
    const cars = [];                                         // moving vehicles, updated every frame

    function text(t, x, y, z, w, h, bg, fg, onGround) {
      const dt = new B.DynamicTexture("apt_t" + t, { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
      c.fillStyle = fg; c.font = "bold 60px system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490); dt.update();
      const p = B.MeshBuilder.CreatePlane("apt_txt", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.isPickable = false;
      if (onGround) p.rotation.x = Math.PI / 2;
      const m = new B.StandardMaterial("apt_tm" + t, scene);
      m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m;
    }
    function aircraft(x, z) {                                // parked passenger jet, nose towards the terminal
      const fus = B.MeshBuilder.CreateCylinder("apt_fus", { diameter: 3.4, height: 26, tessellation: 10 }, scene);
      fus.rotation.z = Math.PI / 2; fus.position.set(X(x), 2.4, Z(z)); fus.material = mat("#f4f4f2"); fus.checkCollisions = true;
      sg.addShadowCaster(fus);
      box(.4, 4.2, 3.4, X(x - 11), 4.4, Z(z), "#1d3b6b", true);          // tail fin
      box(5.4, .25, 26, X(x + 1), 1.9, Z(z), "#e4e7ea", true);           // wings
    }

    // ----- fence around the whole site, with a gate on the east side -----
    const FX = 190, FZ = 105, GATE = [50, 62];                 // local fence extent; gate opening at z 50..62
    const fenceH = 2.4;
    function fenceRun(x1, z1, x2, z2) {
      const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1), n = Math.max(1, Math.round(len / 10));
      for (let i = 0; i <= n; i++) {
        const t = i / n, px = X(x1 + (x2 - x1) * t), pz = Z(z1 + (z2 - z1) * t);
        const p = B.MeshBuilder.CreateCylinder("apt_post", { diameter: .18, height: fenceH + .4, tessellation: 6 }, scene);
        p.position.set(px, (fenceH + .4) / 2, pz); p.material = mat("#4a4f57"); p.checkCollisions = true;
      }
      const r1 = box(len, .12, .12, X((x1 + x2) / 2), fenceH - .3, Z((z1 + z2) / 2), "#8c949c", true);
      r1.rotation.y = -ang;
      const r2 = box(len, .12, .12, X((x1 + x2) / 2), .9, Z((z1 + z2) / 2), "#8c949c", true);
      r2.rotation.y = -ang;
    }
    fenceRun(-FX, -FZ, FX, -FZ);                              // north
    fenceRun(-FX, FZ, FX, FZ);                                // south
    fenceRun(-FX, -FZ, -FX, FZ);                              // west
    fenceRun(FX, -FZ, FX, GATE[0]);                           // east, upper part
    fenceRun(FX, GATE[1], FX, FZ);                            // east, lower part (gate between them)
    box(4, 4.6, 1.2, X(FX + 2), 2.3, Z(GATE[0] - 1), "#3a3d44", true);   // gate pillars
    box(4, 4.6, 1.2, X(FX + 2), 2.3, Z(GATE[1] + 1), "#3a3d44", true);
    text("KOTOKA", X(FX + 2.7), 4.8, Z(GATE[0] - 1), 8, 2.5, "#17191c", "#fcd116", false);

    // ----- runway, numbers, thresholds, edge lights -----
    box(260, .1, 30, X(0), .06, Z(-70), "#2b2d31", false);
    for (let i = -120; i <= 120; i += 16) box(6, .12, .6, X(i), .08, Z(-70), "#f2f2f2", false);
    for (let i = -124; i <= -112; i += 3) box(.5, .12, 22, X(i), .08, Z(-70), "#f2f2f2", false);
    for (let i = 112; i <= 124; i += 3) box(.5, .12, 22, X(i), .08, Z(-70), "#f2f2f2", false);
    text("09", X(-112), .09, Z(-70), 12, 6, "#2b2d31", "#ffffff", true);
    text("27", X(112), .09, Z(-70), 12, 6, "#2b2d31", "#ffffff", true);
    for (let i = -125; i <= 125; i += 18) { box(.5, .2, .5, X(i), .2, Z(-85.5), "#ffe27a", false); box(.5, .2, .5, X(i), .2, Z(-54.5), "#ffe27a", false); }

    // ----- taxiway and apron -----
    box(260, .1, 14, X(0), .05, Z(-50), "#3a3c42", false);
    box(260, .12, .4, X(0), .07, Z(-57.2), "#e6c700", false);
    box(260, .12, .4, X(0), .07, Z(-42.8), "#e6c700", false);
    box(300, .1, 50, X(0), .05, Z(-18), "#c9ced4", false);
    [-96, -60, -24, 12, 48, 84].forEach(x => { aircraft(x, -18); box(3, 3.2, 12, X(x), 1.6, Z(4), "#b8bec6", false); });

    // ----- terminal: main hall, taller glass lobby, columns, canopy, counters, doors -----
    box(230, 11, 22, X(0), 5.5, Z(27), "#e9ecef", true);                                   // main hall
    box(70, 17, 22, X(0), 8.5, Z(27), "#dfe5ea", true);                                    // lobby, taller
    box(66, 9, .4, X(0), 5.2, Z(16.2), "#2e5a7a", false);                                   // lobby glass
    box(226, 6.4, .4, X(0), 3.6, Z(16.2), "#2e5a7a", false);                               // main glass front
    box(236, .8, 26, X(0), 11.4, Z(27), "#9aa5ad", false);                                  // roof
    for (let i = -105; i <= 105; i += 21) box(.8, 11, .8, X(i), 5.5, Z(15.8), "#c9ced4", false);   // columns
    [-30, -10, 10, 30].forEach(x => box(5, 2.8, .2, X(x), 1.4, Z(16.3), "#5a3a22", false));  // door frames
    box(120, .5, 9, X(-30), 6.4, Z(43), "#9aa5ad", true);                                   // drop-off canopy
    [-80, -20, 40].forEach(x => box(.6, 6.2, .6, X(x), 3.1, Z(47.5), "#6b7178", true));       // canopy posts
    box(26, 1, 1.6, X(0), 1.1, Z(15.6), "#4a4f57", false);                                  // check-in counters
    box(40, 2.4, .3, X(-70), 8, Z(16.1), "#101216", false);                                  // departures board
    box(40, 2.4, .3, X(70), 8, Z(16.1), "#101216", false);
    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 14.6, Z(16.4), 48, 6, "#17191c", "#fcd116", false);

    // ----- control tower -----
    const tw = B.MeshBuilder.CreateCylinder("apt_tower", { diameter: 4, height: 26, tessellation: 14 }, scene);
    tw.position.set(X(150), 13, Z(40)); tw.material = mat("#e9ecef"); tw.checkCollisions = true;
    const cab = B.MeshBuilder.CreateCylinder("apt_cab", { diameter: 9, height: 3.2, tessellation: 16 }, scene);
    cab.position.set(X(150), 27.5, Z(40)); cab.material = mat("#2e5a7a"); cab.checkCollisions = true;
    const beacon = B.MeshBuilder.CreateSphere("apt_beacon", { diameter: 1.4 }, scene);
    beacon.position.set(X(150), 30.4, Z(40)); beacon.material = mat("#ff3b3b");

    // ----- helipads, fuel tanks, cargo shed -----
    [-172, -144].forEach(x => {
      const ring = B.MeshBuilder.CreateTorus("apt_hp", { diameter: 12, thickness: .6, tessellation: 24 }, scene);
      ring.position.set(X(x), .14, Z(20)); ring.scaling.y = .05; ring.material = mat("#fcd116"); ring.isPickable = false;
      box(.3, .1, 5, X(x), .12, Z(20), "#f2f2f2", false);
    });
    [[-158, -4], [-158, -18], [-158, -32]].forEach(p => {
      const t = B.MeshBuilder.CreateCylinder("apt_tank", { diameter: 7, height: 6, tessellation: 18 }, scene);
      t.position.set(X(p[0]), 3, Z(p[1])); t.material = mat("#dfe3e8"); t.checkCollisions = true;
    });
    box(30, 8, 20, X(150), 4, Z(-22), "#cfd6dc", true);

    // ----- car parks, drop-off loop road, kerb, billboards -----
    box(120, .1, 22, X(-60), .05, Z(80), "#3a3d44", false);
    box(120, .1, 22, X(60), .05, Z(80), "#3a3d44", false);
    for (let i = -56; i <= 56; i += 8) { box(.2, .12, 9, X(-60 + i), .08, Z(80), "#f2f2f2", false); box(.2, .12, 9, X(60 + i), .08, Z(80), "#f2f2f2", false); }
    box(290, .1, 12, X(45), .05, Z(56), "#2b2d31", false);                                    // drop-off road
    box(290, .2, .6, X(45), .15, Z(62.4), "#9aa5ad", false);                                  // kerb
    [["WELCOME TO GHANA", "#7a2d4a", -90], ["FLY SAFE", "#d9822b", -30], ["ACCRA", "#2456a6", 30], ["KOTOKA", "#2e7d32", 90]].forEach(b => {
      box(.4, 6, .4, X(b[2]), 3, Z(98), "#555a63", false);
      text(b[0], X(b[2]), 5.8, Z(98.3), 12, 4, b[1], "#ffffff", false);
    });
    [-130, -100, 100, 130].forEach(x => palm(X(x), Z(102)));

    // ----- access road: the city avenue (z -150) south to the airport gate -----
    box(8, .06, 94, -165, .04, -197, "#2b2d31", false);                                       // x -165, z -244..-150
    box(70, .06, 8, -197.5, .04, -244, "#2b2d31", false);                                     // z -244, x -230..-165

    // ----- moving traffic -----
    // closed loop along the drop-off road: east on one lane, west on the other, so nothing drives head-on
    function makePath(pts, closed) {
      const segs = []; let total = 0;
      const all = closed ? pts.concat([pts[0]]) : pts;
      for (let i = 0; i < all.length - 1; i++) {
        const a = all[i], b = all[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
        segs.push({ a, b, len, start: total }); total += len;
      }
      return { segs, total, closed };
    }
    function at(path, d) {
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
    const loop = makePath([{ x: X(-100), z: Z(53) }, { x: X(170), z: Z(53) }, { x: X(170), z: Z(59) }, { x: X(-100), z: Z(59) }], true);
    const access = makePath([{ x: -165, z: -150 }, { x: -165, z: -244 }, { x: -230, z: -244 }], false);

    function addVehicle(kind, color, path, offset, speed, pingPong) {
      if (!window.AccraAssets || !window.AccraAssets.createCar) return;
      const v = window.AccraAssets.createCar(scene, kind, { color });
      cars.push({ node: v, path, d: offset, speed, dir: 1, pingPong });
    }
    addVehicle("trotro", "#f2c230", loop, 0, 7, false);                                       // airport shuttle bus
    addVehicle("sedan", "#a3172b", loop, loop.total * .35, 9, false);
    addVehicle("hatch", "#e6e9ec", loop, loop.total * .7, 8, false);
    addVehicle("suv", "#3a3d44", loop, loop.total * .15, 10, false);
    addVehicle("sedan", "#f2c230", access, 0, 8, true);                                       // taxi from the city

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
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
        c.node.position.set(p.x, 0, p.z);
        c.node.rotation.y = Math.atan2(-p.dz * s, p.dx * s);   // the car's nose follows its direction of travel
      });
    });

    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 58 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kotoka International Airport", x: C.x, z: C.z + 58 });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;
    console.log("Kotoka airport ready:", cars.length, "vehicles");
  } catch (err) { console.error("accra-airport failed:", err); }
})();
