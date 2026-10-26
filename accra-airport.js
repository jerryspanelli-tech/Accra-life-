/* accra-airport.js - Kotoka International Airport (Futuristic Star Design) */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 }; // Airport centre
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const planes = [];

    function text(t, x, y, z, w, h, bg, fg, onGround) {
      const dt = new B.DynamicTexture("apt_t" + t, { width: 512, height: 128 }, scene, false);
      const c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
      c.fillStyle = fg; c.font = "bold 58px system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490); dt.update();
      const p = B.MeshBuilder.CreatePlane("apt_txt", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.isPickable = false;
      if (onGround) p.rotation.x = Math.PI / 2;
      const m = new B.StandardMaterial("apt_tm" + t, scene);
      m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m;
    }

    // --- Realistic Plane Model ---
    function aircraft(x, z, rotY = 0, index = 0) {
      const group = new B.TransformNode("plane_" + index, scene);
      group.position.set(X(x), 0, Z(z)); group.rotation.y = rotY;

      const fus = B.MeshBuilder.CreateCylinder("fus", { diameter: 3.4, height: 36, tessellation: 16 }, scene);
      fus.rotation.z = Math.PI / 2; fus.position.set(0, 3, 0); fus.material = mat("#f4f4f2"); fus.parent = group; fus.checkCollisions = true;
      
      const nose = B.MeshBuilder.CreateCylinder("nose", { diameterTop: 0.1, diameterBottom: 3.4, height: 6, tessellation: 16 }, scene);
      nose.rotation.z = -Math.PI / 2; nose.position.set(21, 3, 0); nose.material = mat("#f4f4f2"); nose.parent = group;

      const tail = B.MeshBuilder.CreateCylinder("tail", { diameterTop: 0.5, diameterBottom: 3.4, height: 8, tessellation: 16 }, scene);
      tail.rotation.z = Math.PI / 2; tail.position.set(-22, 3, 0); tail.material = mat("#f4f4f2"); tail.parent = group;

      const part = (w, h, d, px, py, pz, col, solid = false, rotZ = 0, rotX = 0) => {
        const m = B.MeshBuilder.CreateBox("p", { width: w, height: h, depth: d }, scene);
        m.position.set(px, py, pz); m.material = mat(col); m.rotation.z = rotZ; m.rotation.x = rotX; m.parent = group;
        if (solid) m.checkCollisions = true; return m;
      };

      part(14, 0.3, 6, -1, 2.8, -8, "#e0e0e0", true, 0, -0.15);
      part(14, 0.3, 6, -1, 2.8, 8, "#e0e0e0", true, 0, 0.15);

      part(4, 8, 0.4, -20, 6, 0, "#CE1126", true);
      part(3.5, 0.3, 7, -22, 3.2, 0, "#FCD116", true);

      part(26, 0.5, 3.42, 0, 3.2, 0, "#CE1126");
      part(26, 0.4, 3.42, 0, 2.6, 0, "#FCD116");
      part(26, 0.4, 3.42, 0, 2.2, 0, "#006B3F");

      planes.push(group);
      return group;
    }

    // --- The Star-Shaped Terminal ---
    // 1. Central Hub
    const hub = B.MeshBuilder.CreateCylinder("hub", { diameter: 120, height: 16, tessellation: 64 }, scene);
    hub.position.set(X(0), 8, Z(0)); hub.material = mat("#e8ecef"); hub.checkCollisions = true;
    
    // Gold and Black Roof Accents
    const hubRoof = B.MeshBuilder.CreateCylinder("hubroof", { diameter: 130, height: 2, tessellation: 64 }, scene);
    hubRoof.position.set(X(0), 17, Z(0)); hubRoof.material = mat("#FCD116");
    const hubRoof2 = B.MeshBuilder.CreateCylinder("hubroof2", { diameter: 100, height: 2, tessellation: 64 }, scene);
    hubRoof2.position.set(X(0), 18.5, Z(0)); hubRoof2.material = mat("#17191c");

    // 2. Six Radiating Arms
    const arms = 6;
    for (let i = 0; i < arms; i++) {
      const angle = (i * Math.PI * 2) / arms;
      const armLen = 120;
      const arm = B.MeshBuilder.CreateBox("arm", { width: 30, height: 12, depth: armLen }, scene);
      
      // Position arm so it connects to the hub
      const ax = Math.cos(angle) * (60 + armLen/2);
      const az = Math.sin(angle) * (60 + armLen/2);
      
      arm.position.set(X(ax), 6, Z(az));
      arm.rotation.y = -angle + Math.PI/2; // Point outward
      arm.material = mat("#e8ecef");
      arm.checkCollisions = true;

      // Arm roof (Glass)
      const armRoof = B.MeshBuilder.CreateBox("armroof", { width: 28, height: 2, depth: armLen }, scene);
      armRoof.position.set(X(ax), 13, Z(az));
      armRoof.rotation.y = -angle + Math.PI/2;
      armRoof.material = mat("#2e5a7a");

      // Park 3 Planes at the end of each arm
      for (let p = -1; p <= 1; p++) {
        // Offset planes slightly left/right of the arm
        const px = Math.cos(angle) * (60 + armLen + 25) + Math.cos(angle + Math.PI/2) * (p * 20);
        const pz = Math.sin(angle) * (60 + armLen + 25) + Math.sin(angle + Math.PI/2) * (p * 20);
        aircraft(px, pz, -angle + Math.PI/2, i*3+p);
      }
    }

    // --- Ground & Tarmac ---
    const tarmac = B.MeshBuilder.CreateGround("tarmac", { width: 600, height: 600 }, scene);
    tarmac.position.set(C.x, 0.02, C.z); tarmac.material = mat("#9aa5ad"); tarmac.receiveShadows = true;

    // --- Runways ---
    // Runway 1
    box(40, 0.1, 450, X(-220), 0.06, Z(0), "#2a2c30", false);
    for (let i = -200; i <= 200; i += 20) box(1, 0.12, 10, X(-220), 0.09, Z(i), "#f2f2f2", false);
    // Runway 2
    box(40, 0.1, 450, X(220), 0.06, Z(0), "#2a2c30", false);
    for (let i = -200; i <= 200; i += 20) box(1, 0.12, 10, X(220), 0.09, Z(i), "#f2f2f2", false);

    // --- Ring Road ---
    const ring = B.MeshBuilder.CreateTorus("ring", { diameter: 500, thickness: 20, tessellation: 64 }, scene);
    ring.position.set(X(0), 0.05, Z(0)); ring.scaling.y = 0.1; ring.material = mat("#2b2d31");

    // --- Surrounding Futuristic City (Using existing buildings) ---
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 350 + Math.random() * 200;
      const bx = Math.cos(a) * r;
      const bz = Math.sin(a) * r;
      if (typeof bldg === "function") {
        bldg(X(bx), Z(bz), 20 + Math.random()*20, 20 + Math.random()*20, 40 + Math.random()*60, "#5b8aa8");
      }
    }

    // --- Booking Counter ---
    const counterX = X(0), counterZ = Z(20); // Inside the hub
    box(16, 1.2, 3, counterX, 0.6, counterZ, "#c9a54a", true);
    box(17, 0.2, 4, counterX, 1.3, counterZ, "#17191c", false);
    text("TICKETS", counterX, 3, counterZ - 0.6, 8, 2, "#17191c", "#fcd116", false);

    function openFlightMenu() {
      if (!window.ACCRA_KIT) return;
      const K = window.ACCRA_KIT; const cash = K.cash();
      const FLIGHTS = [{ dest: "Kumasi", x: -2000, z: -24000, cost: 250 }, { dest: "Takoradi", x: -1500, z: 1200, cost: 300 }, { dest: "Tamale", x: 800, z: -8000, cost: 400 }];
      const draw = () => K.show(K.ttl("\u2708\uFE0F Kotoka Departures") + `<small>Cash: GH\u00A2${cash}</small><br><br>` + FLIGHTS.map((f, i) => `<button data-f="${i}" style="${K.BS}">Fly to ${f.dest} \u00B7 GH\u00A2${f.cost}</button>`).join("") + K.CLOSE,
        d => {
          if (d.x) return K.hide();
          if (d.f !== undefined) { const flight = FLIGHTS[+d.f]; window.playFlightScene(flight.dest, flight.x, flight.z, flight.cost); }
        }
      );
    }

    setTimeout(() => {
      if (window.ACCRA_KIT && window.ACCRA_KIT.points) {
        window.ACCRA_KIT.points.push({ x: counterX, z: counterZ + 3, r: 6, t: "\uD83C\uDFAB Buy Flight Ticket", ok: () => !window.ACCRA_KIT.busy && !window.ACCRA_KIT.seated, f: openFlightMenu });
      }
    }, 5000);

    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 60 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kotoka International Airport", x: C.x, z: C.z + 60 });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;

    console.log("Kotoka Airport Star Masterplan loaded");
  } catch (err) { console.error("accra-airport failed:", err); }
})();
