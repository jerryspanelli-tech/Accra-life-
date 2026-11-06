/* accra-kumasi-airport.js - Prempeh I International Airport (Realism Upgrade) */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -2000, z: -24000 }; // Positioned west of the Kumasi highway
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const planes = [];

    // --- Helpers ---
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

    // --- Aircraft Model (Simplified for Kumasi) ---
    function aircraft(x, z, rotY = 0, index = 0) {
      const group = new B.TransformNode("ks_plane_" + index, scene);
      group.position.set(X(x), 0, Z(z)); group.rotation.y = rotY;

      const fus = B.MeshBuilder.CreateCylinder("ks_fus", { diameter: 3.4, height: 30, tessellation: 12 }, scene);
      fus.rotation.z = Math.PI / 2; fus.position.set(0, 3, 0); fus.material = mat("#f4f4f2"); fus.parent = group; fus.checkCollisions = true;
      
      const nose = B.MeshBuilder.CreateCylinder("ks_nose", { diameterTop: 0.1, diameterBottom: 3.4, height: 5, tessellation: 12 }, scene);
      nose.rotation.z = -Math.PI / 2; nose.position.set(17.5, 3, 0); nose.material = mat("#f4f4f2"); nose.parent = group;

      const part = (w, h, d, px, py, pz, col) => {
        const m = B.MeshBuilder.CreateBox("p", { width: w, height: h, depth: d }, scene);
        m.position.set(px, py, pz); m.material = mat(col); m.parent = group; return m;
      };
      
      part(10, 0.2, 5, -1, 2.8, -7, "#e0e0e0"); // Left Wing
      part(10, 0.2, 5, -1, 2.8, 7, "#e0e0e0");  // Right Wing
      
      part(3, 6, 0.4, -14, 5, 0, "#CE1126"); // Tail (Red)
      part(26, 0.4, 3.42, 0, 3.2, 0, "#FCD116"); // Gold Stripe
      part(26, 0.4, 3.42, 0, 2.6, 0, "#006B3F"); // Green Stripe
      
      planes.push(group);
      return group;
    }

    // --- Architecture Helpers ---
    function buildFence(x1, z1, x2, z2) {
      const isHoriz = Math.abs(x2 - x1) > Math.abs(z2 - z1);
      const len = isHoriz ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
      const steps = Math.floor(len / 6);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const pz = z1 + (z2 - z1) * t;
        const p = B.MeshBuilder.CreateCylinder("post", { diameter: 0.4, height: 3, tessellation: 6 }, scene);
        p.position.set(px, 1.5, pz); p.material = mat("#7b7b7b"); p.checkCollisions = true;
        if (i < steps) {
          const nx = x1 + (x2 - x1) * ((i+1) / steps);
          const nz = z1 + (z2 - z1) * ((i+1) / steps);
          const w = isHoriz ? 6 : 0.1;
          const d = isHoriz ? 0.1 : 6;
          const wire = box(w, 2.8, d, (px+nx)/2, 1.4, (pz+nz)/2, "#888888", true);
          wire.visibility = 0.3;
        }
      }
    }

    // --- GROUND & TERRAIN ---
    const ground = B.MeshBuilder.CreateGround("ks_ground", { width: 500, height: 400 }, scene);
    ground.position.set(C.x, -0.05, C.z); ground.material = mat("#4a7a3a"); ground.receiveShadows = true; ground.isPickable = false;

    // --- PAVED ROADS ---
    box(24, 0.1, 200, X(0), 0.05, Z(110), "#2b2d31", false);
    box(150, 0.1, 16, X(0), 0.05, Z(30), "#2b2d31", false);
    for (let i = -70; i <= 70; i += 10) box(4, 0.12, 0.5, X(i), 0.08, Z(30), "#f2f2f2", false);

    // --- CAR PARK ---
    box(100, 0.1, 40, X(-70), 0.05, Z(50), "#3a3d44", false);
    for (let i = -45; i <= 45; i += 8) {
      box(0.3, 0.12, 10, X(-70 + i), 0.08, Z(50), "#ffffff", false);
    }

    // --- SECURITY GATE & AKWAABA SIGN ---
    box(1.5, 7, 1.5, X(-22), 3.5, Z(100), "#555", true);
    box(1.5, 7, 1.5, X(22), 3.5, Z(100), "#555", true);
    box(48, 8, 1, X(0), 8, Z(100), "#17191c", true);
    text("AKWAABA", X(0), 8, Z(99.4), 35, 6, "#17191c", "#fcd116", false);
    text("Welcome to Kumasi", X(0), 5.5, Z(99.4), 20, 3.5, "#17191c", "#c8102e", false);

    // Security Gate
    box(10, 3.5, 10, X(-10), 1.75, Z(85), "#e8ecef", true);
    box(12, 0.4, 12, X(-10), 3.7, Z(85), "#2e5a7a", false);
    box(3, 1.2, 0.1, X(-10), 1.8, Z(90.05), "#111", false);
    
    // Boom Barrier
    box(0.8, 1.2, 0.8, X(4), 0.6, Z(85), "#333", true);
    box(0.2, 0.2, 14, X(4), 1.2, Z(92), "#ffffff", false);
    for(let i=0; i<4; i++) box(0.22, 0.22, 1.5, X(4), 1.2, Z(86 + i*3), "#c8102e", false);

    // --- PERIMETER FENCE ---
    buildFence(X(-220), Z(-120), X(220), Z(-120));
    buildFence(X(-220), Z(-120), X(-220), Z(110));
    buildFence(X(220), Z(-120), X(220), Z(110));
    buildFence(X(-220), Z(110), X(-25), Z(110));
    buildFence(X(25), Z(110), X(220), Z(110));

    // --- RUNWAY ---
    box(300, 0.12, 30, X(0), 0.06, Z(-100), "#2a2c30", false);
    for (let i = -130; i <= 130; i += 18) box(8, 0.14, 0.8, X(i), 0.09, Z(-100), "#f2f2f2", false);
    text("KUMASI", X(0), 0.1, Z(-100), 30, 6, "#2a2c30", "#ffffff", true);

    // --- TERMINAL BUILDING ---
    box(140, 12, 30, X(0), 6, Z(5), "#e8ecef", true);
    box(130, 8, 0.5, X(0), 5, Z(-10.2), "#2e5a7a", false);
    box(150, 1.2, 38, X(0), 12.4, Z(5), "#9aa5ad", false);
    text("PREMPEH I INTERNATIONAL AIRPORT", X(0), 10, Z(-10.5), 45, 5, "#17191c", "#fcd116", false);

    // --- APRON & PLANES ---
    box(250, 0.1, 60, X(0), 0.05, Z(-40), "#c5cad0", false);

    aircraft(-40, -35, Math.PI, 0);
    aircraft(0, -35, Math.PI, 1);
    aircraft(40, -35, Math.PI, 2);

    // --- BOOKING COUNTER ---
    const counterX = X(0), counterZ = Z(-5);
    box(12, 1.2, 2.5, counterX, 0.6, counterZ, "#c9a54a", true);
    box(13, 0.2, 3.5, counterX, 1.3, counterZ, "#17191c", false);
    text("TICKETS", counterX, 3, counterZ - 0.6, 6, 1.5, "#17191c", "#fcd116", false);

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
        window.ACCRA_KIT.points.push({ x: counterX, z: counterZ + 3, r: 4, t: "\uD83C\uDFAB Buy Flight Ticket", ok: () => !window.ACCRA_KIT.busy && !window.ACCRA_KIT.seated, f: openFlightMenu });
      }
    }, 5000);

    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kumasi Airport", x: C.x, z: C.z + 20 });
    console.log("Prempeh I Airport loaded");
  } catch (err) { console.error("accra-kumasi-airport failed:", err); }
})();
