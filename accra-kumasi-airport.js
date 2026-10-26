/* accra-kumasi-airport.js - Regional airport for Kumasi (Redesigned with Fences and Security Gates) */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -2000, z: -24000 };
    const X = x => C.x + x;
    const Z = z => C.z + z;

    function text(t, x, y, z, w, h, bg, fg, onGround) {
      const dt = new B.DynamicTexture("ks_t" + t, { width: 512, height: 128 }, scene, false);
      const c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
      c.fillStyle = fg; c.font = "bold 58px system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490); dt.update();
      const p = B.MeshBuilder.CreatePlane("ks_txt", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.isPickable = false;
      if (onGround) p.rotation.x = Math.PI / 2;
      const m = new B.StandardMaterial("ks_tm" + t, scene);
      m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m;
    }

    // --- Fence and Security Gate Builder ---
    function buildFenceAndGate(x1, z1, x2, z2, gateX, gateZ) {
      const isHoriz = Math.abs(x2 - x1) > Math.abs(z2 - z1);
      const len = isHoriz ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
      const steps = Math.floor(len / 5);
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const pz = z1 + (z2 - z1) * t;
        if (Math.abs(px - gateX) < 8 && Math.abs(pz - gateZ) < 8) continue;

        const p = B.MeshBuilder.CreateCylinder("post", { diameter: 0.3, height: 2.5, tessellation: 6 }, scene);
        p.position.set(px, 1.25, pz); p.material = mat("#7b7b7b"); p.checkCollisions = true;
        
        if (i < steps) {
          const nx = x1 + (x2 - x1) * ((i+1) / steps);
          const nz = z1 + (z2 - z1) * ((i+1) / steps);
          const w = isHoriz ? 5 : 0.05;
          const d = isHoriz ? 0.05 : 5;
          const wire = box(w, 2.2, d, (px+nx)/2, 1.1, (pz+nz)/2, "#aaaaaa", true);
          wire.visibility = 0.4;
        }
      }
    }

    function buildSecurityGate(x, z) {
      box(4, 3, 4, x - 5, 1.5, z, "#e8ecef", true);
      box(5, 0.2, 5, x - 5, 3.1, z, "#2e5a7a", false);
      box(2, 1, 0.1, x - 5, 1.8, z + 2.05, "#111", false);

      box(0.5, 1.2, 0.5, x + 3, 0.6, z, "#333", true);
      const arm = box(0.2, 0.2, 8, x + 3, 1.2, z - 3.8, "#ffffff", false);
      for (let i = 0; i < 4; i++) { box(0.22, 0.22, 1, x + 3, 1.2, z - 1 - (i * 2), "#c8102e", false); }
      [-2, 0, 2].forEach(oz => { const c = B.MeshBuilder.CreateCylinder("cone", { diameterTop: 0, diameterBottom: 0.5, height: 1 }, scene); c.position.set(x - 1, 0.5, z + oz); c.material = mat("#ff6b35"); });
      text("STOP", x, 0.1, z + 6, 6, 3, "rgba(0,0,0,0)", "#ff0000", true);
    }

    // --- Ground & Runway ---
    const ground = B.MeshBuilder.CreateGround("ks_ground", { width: 400, height: 300 }, scene);
    ground.position.set(C.x, -0.04, C.z); ground.material = mat("#4a7a3a"); ground.receiveShadows = true; ground.isPickable = false;

    box(240, 0.12, 30, X(0), 0.06, Z(-60), "#2a2c30", false);
    for (let i = -100; i <= 100; i += 15) box(8, 0.14, 0.6, X(i), 0.09, Z(-60), "#f2f2f2", false);
    text("KUMASI", X(0), 0.1, Z(-60), 30, 6, "#2a2c30", "#ffffff", true);

    box(200, 0.1, 50, X(0), 0.05, Z(-15), "#c5cad0", false);

    // --- Terminal ---
    box(100, 8, 20, X(0), 4, Z(20), "#e8ecef", true);
    box(95, 5, 0.5, X(0), 3, Z(10), "#2e5a7a", false);
    box(105, 0.8, 24, X(0), 8.4, Z(20), "#9aa5ad", false);
    text("KUMASI INTERNATIONAL AIRPORT", X(0), 10.5, Z(10.5), 40, 4, "#17191c", "#fcd116", false);

    // --- Parked Plane ---
    const planeGroup = new B.TransformNode("ks_plane", scene);
    planeGroup.position.set(X(20), 0, Z(-10)); planeGroup.rotation.y = Math.PI;
    const fus = B.MeshBuilder.CreateCylinder("ks_fus", { diameter: 3.4, height: 30, tessellation: 12 }, scene);
    fus.rotation.z = Math.PI / 2; fus.position.set(0, 3, 0); fus.material = mat("#f4f4f2"); fus.parent = planeGroup;
    const nose = B.MeshBuilder.CreateCylinder("ks_nose", { diameterTop: 0.1, diameterBottom: 3.4, height: 5, tessellation: 12 }, scene);
    nose.rotation.z = -Math.PI / 2; nose.position.set(17.5, 3, 0); nose.material = mat("#f4f4f2"); nose.parent = planeGroup;
    const wing = (pz) => { const w = box(10, 0.2, 5, 0, 0, 0, "#e0e0e0"); w.position.set(-1, 2.8, pz); w.rotation.x = pz > 0 ? 0.15 : -0.15; w.parent = planeGroup; };
    wing(-7); wing(7);
    const tail = box(3, 6, 0.4, -14, 5, 0, "#CE1126"); tail.parent = planeGroup;

    // --- NEW: Access Road & Fencing ---
    box(16, 0.05, 70, X(0), 0.05, Z(85), "#2b2d31", false);
    text("WELCOME TO KUMASI", X(0), 8, Z(120), 40, 8, "#17191c", "#fcd116", false);
    box(2, 8, 2, X(-18), 4, Z(120), "#555", true);
    box(2, 8, 2, X(18), 4, Z(120), "#555", true);

    buildFenceAndGate(X(-160), Z(60), X(160), Z(60), X(0), Z(60));
    buildSecurityGate(X(0), Z(60));

    // --- Booking Counter ---
    const counterX = X(0), counterZ = Z(14);
    box(8, 1.2, 2, counterX, 0.6, counterZ, "#c9a54a", true);
    box(9, 0.2, 3, counterX, 1.3, counterZ, "#17191c", false);
    text("TICKETS", counterX, 3, counterZ + 0.6, 5, 1.5, "#17191c", "#fcd116", false);

    function openFlightMenu() {
      if (!window.ACCRA_KIT) return;
      const K = window.ACCRA_KIT; const cash = K.cash();
      const FLIGHTS = [{ dest: "Accra (Kotoka)", x: -420, z: -240, cost: 250 }];
      const draw = () => K.show(K.ttl("\u2708\uFE0F Kumasi Departures") + `<small>Cash: GH\u00A2${cash}</small><br><br>` + FLIGHTS.map((f, i) => `<button data-f="${i}" style="${K.BS}">Fly to ${f.dest} \u00B7 GH\u00A2${f.cost}</button>`).join("") + K.CLOSE,
        d => {
          if (d.x) return K.hide();
          if (d.f !== undefined) { const flight = FLIGHTS[+d.f]; window.playFlightScene(flight.dest, flight.x, flight.z, flight.cost); }
        }
      );
    }

    setTimeout(() => {
      if (window.ACCRA_KIT && window.ACCRA_KIT.points) {
        window.ACCRA_KIT.points.push({ x: counterX, z: counterZ + 2, r: 4, t: "\uD83C\uDFAB Buy Flight Ticket", ok: () => !window.ACCRA_KIT.busy && !window.ACCRA_KIT.seated, f: openFlightMenu });
      }
    }, 5000);

    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kumasi Airport", x: C.x, z: C.z + 20 });
  } catch (err) { console.error("accra-kumasi-airport failed:", err); }
})();
