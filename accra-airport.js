/* accra-airport.js - Kotoka International Airport (Ultimate Realism Upgrade) */
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

    function aircraft(x, z, rotY = 0, index = 0) {
      const group = new B.TransformNode("plane_" + index, scene);
      group.position.set(X(x), 0, Z(z)); group.rotation.y = rotY;

      const fus = B.MeshBuilder.CreateCylinder("fus", { diameter: 3.4, height: 36, tessellation: 16 }, scene);
      fus.rotation.z = Math.PI / 2; fus.position.set(0, 3, 0); fus.material = mat("#f4f4f2"); fus.parent = group; fus.checkCollisions = true;
      if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

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

      const engL = B.MeshBuilder.CreateCylinder("eng", { diameter: 1.8, height: 5 }, scene);
      engL.rotation.z = Math.PI / 2; engL.position.set(2, 1.8, -6); engL.material = mat("#a0a0a0"); engL.parent = group;
      const engR = B.MeshBuilder.CreateCylinder("eng", { diameter: 1.8, height: 5 }, scene);
      engR.rotation.z = Math.PI / 2; engR.position.set(2, 1.8, 6); engR.material = mat("#a0a0a0"); engR.parent = group;

      part(4, 8, 0.4, -20, 6, 0, "#CE1126", true);
      part(3.5, 0.3, 7, -22, 3.2, 0, "#FCD116", true);

      part(26, 0.5, 3.42, 0, 3.2, 0, "#CE1126");
      part(26, 0.4, 3.42, 0, 2.6, 0, "#FCD116");
      part(26, 0.4, 3.42, 0, 2.2, 0, "#006B3F");

      for (let i = -12; i <= 12; i += 2) { if (i === 0) continue; part(0.4, 0.4, 3.45, i, 3.8, 0, "#111111"); }

      const strut = (px, pz) => {
        part(0.2, 1.5, 0.2, px, 1.4, pz, "#888888");
        const w = B.MeshBuilder.CreateCylinder("wheel", { diameter: 1, height: 0.4 }, scene);
        w.rotation.x = Math.PI / 2; w.position.set(px, 0.5, pz); w.material = mat("#111111"); w.parent = group;
      };
      strut(16, 0); strut(-4, -4); strut(-4, 4);

      const makeLight = (d, px, py, pz, col) => {
        const s = B.MeshBuilder.CreateSphere("nav", { diameter: d }, scene);
        s.position.set(px, py, pz); const m = mat(col); m.emissiveColor = B.Color3.FromHexString(col);
        s.material = m; s.parent = group; return s;
      };
      const lightRed = makeLight(0.4, 6, 2.8, -11.2, "#ff0000");
      const lightGreen = makeLight(0.4, 6, 2.8, 11.2, "#00ff00");

      group.metadata = { engL, engR, lightRed, lightGreen };
      planes.push(group);
      return group;
    }

    // --- Flight Cutscene System ---
    window.playFlightScene = function(destName, destX, destZ, cost) {
      const K = window.ACCRA_KIT;
      if (!K) return;
      if (K.cash() < cost) return K.note("Not enough cash for this flight.");
      K.pay(cost, "Flight to " + destName);
      K.hide();

      const ov = document.createElement('div');
      ov.style.cssText = "position:fixed;inset:0;background:linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff);z-index:99999;color:#fff;font-family:system-ui;overflow:hidden;transition:opacity 1.5s;";
      const st = document.createElement('style');
      st.textContent = `@keyframes fly { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-100vw) translateY(-50px); } } @keyframes cloud { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100vw); } } @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`;
      document.head.appendChild(st);

      let cloudsHTML = "";
      for(let i=0; i<8; i++) {
          const top = Math.random()*60 + 10; const size = Math.random()*100 + 50; const dur = Math.random()*10 + 5; const delay = Math.random()*5;
          cloudsHTML += `<div style="position:absolute;top:${top}%;left:100vw;width:${size}px;height:${size/2}px;background:rgba(255,255,255,0.8);border-radius:50px;filter:blur(5px);animation:cloud ${dur}s linear ${delay}s infinite;"></div>`;
      }

      ov.innerHTML = `
          ${cloudsHTML}
          <div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);text-align:center;background:rgba(0,0,0,0.6);padding:15px 30px;border-radius:15px;border:2px solid #c9a54a;width:80%;max-width:400px;box-shadow:0 10px 20px rgba(0,0,0,0.5);">
              <h1 style="margin:0;font-size:24px;color:#fcd116;">Flight AK-204</h1>
              <p style="margin:5px 0 0;font-size:16px;font-weight:bold;">Destination: ${destName}</p>
              <p style="margin:5px 0 0;font-size:14px;color:#aaa;" id="flightStatus">Boarding...</p>
          </div>
          <div style="position:absolute;top:40%;left:30%;font-size:80px;animation:float 2s ease-in-out infinite; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.3));">✈️</div>
      `;
      document.body.appendChild(ov);

      setTimeout(() => { const el = document.getElementById('flightStatus'); if(el) el.innerText = "Taxiing to runway..."; }, 2000);
      setTimeout(() => { const el = document.getElementById('flightStatus'); if(el) el.innerText = "Taking off..."; }, 4000);
      setTimeout(() => { const el = document.getElementById('flightStatus'); if(el) el.innerText = "Cruising at 30,000 ft..."; }, 6000);
      setTimeout(() => { const el = document.getElementById('flightStatus'); if(el) el.innerText = "Descending..."; }, 10000);
      setTimeout(() => { const el = document.getElementById('flightStatus'); if(el) el.innerText = "Landed safely."; ov.style.opacity = 0; }, 13000);

      setTimeout(() => {
          ov.remove(); st.remove();
          if (typeof player !== "undefined") { player.position.set(destX, 1, destZ); if (typeof camT !== "undefined") camT.position.copyFrom(player.position); }
          K.note("Welcome to " + destName + "!");
      }, 14500);
    };

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
          wire.visibility = 0.3; // See-through fence
        }
      }
    }

    // --- GROUND & TERRAIN ---
    const ground = B.MeshBuilder.CreateGround("apt_ground", { width: 600, height: 500 }, scene);
    ground.position.set(C.x, -0.05, C.z); ground.material = mat("#4a7a3a"); ground.receiveShadows = true; ground.isPickable = false;

    // --- PAVED ROADS ---
    // Access road from the city
    box(30, 0.1, 250, X(0), 0.05, Z(150), "#2b2d31", false);
    // Drop-off road in front of terminal
    box(250, 0.1, 20, X(0), 0.05, Z(40), "#2b2d31", false);
    
    // Road markings
    for (let i = -120; i <= 120; i += 10) box(4, 0.12, 0.5, X(i), 0.08, Z(40), "#f2f2f2", false);

    // --- CAR PARK ---
    box(140, 0.1, 60, X(-80), 0.05, Z(70), "#3a3d44", false);
    // Parking lines
    for (let i = -60; i <= 60; i += 8) {
      box(0.3, 0.12, 12, X(-80 + i), 0.08, Z(70), "#ffffff", false);
      box(0.3, 0.12, 12, X(-80 + i), 0.08, Z(55), "#ffffff", false);
    }

    // --- SECURITY GATE & AKWAABA SIGN ---
    // AKWAABA Sign
    box(2, 8, 2, X(-25), 4, Z(140), "#555", true);
    box(2, 8, 2, X(25), 4, Z(140), "#555", true);
    box(55, 10, 1.5, X(0), 9, Z(140), "#17191c", true);
    text("AKWAABA", X(0), 9, Z(139), 40, 8, "#17191c", "#fcd116", false);
    text("Welcome to Ghana", X(0), 6.5, Z(139), 20, 4, "#17191c", "#c8102e", false);

    // Security Gate
    box(12, 4, 12, X(-12), 2, Z(120), "#e8ecef", true);
    box(14, 0.5, 14, X(-12), 4.2, Z(120), "#2e5a7a", false);
    box(4, 1.5, 0.1, X(-12), 2, Z(126.05), "#111", false); // Window
    
    // Boom Barrier
    box(1, 1.5, 1, X(5), 0.75, Z(120), "#333", true);
    box(0.2, 0.2, 16, X(5), 1.5, Z(128), "#ffffff", false);
    for(let i=0; i<5; i++) box(0.22, 0.22, 2, X(5), 1.5, Z(121 + i*3), "#c8102e", false);

    // Security Cones
    [-4, 0, 4].forEach(ox => {
      const c = B.MeshBuilder.CreateCylinder("cone", { diameterTop: 0, diameterBottom: 0.6, height: 1 }, scene);
      c.position.set(X(ox), 0.5, Z(118)); c.material = mat("#ff6b35");
    });

    // --- PERIMETER FENCE ---
    // Back fence
    buildFence(X(-280), Z(-150), X(280), Z(-150));
    // Left fence
    buildFence(X(-280), Z(-150), X(-280), Z(150));
    // Right fence
    buildFence(X(280), Z(-150), X(280), Z(150));
    // Front fence (leaving gap for entrance)
    buildFence(X(-280), Z(150), X(-30), Z(150));
    buildFence(X(30), Z(150), X(280), Z(150));

    // --- RUNWAY ---
    box(400, 0.12, 40, X(0), 0.06, Z(-120), "#2a2c30", false);
    for (let i = -180; i <= 180; i += 20) box(12, 0.14, 1, X(i), 0.09, Z(-120), "#f2f2f2", false);
    text("09", X(-170), 0.1, Z(-120), 16, 8, "#2a2c30", "#ffffff", true);
    text("27", X(170), 0.1, Z(-120), 16, 8, "#2a2c30", "#ffffff", true);

    // --- TERMINAL BUILDING ---
    // Main structure
    box(200, 15, 40, X(0), 7.5, Z(10), "#e8ecef", true);
    // Glass windows
    box(190, 10, 0.5, X(0), 6, Z(-10.2), "#2e5a7a", false);
    // Roof overhang
    box(220, 1.5, 50, X(0), 15.5, Z(10), "#9aa5ad", false);
    // Text on terminal
    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 12, Z(-10.5), 60, 6, "#17191c", "#fcd116", false);

    // Control Tower
    const tower = B.MeshBuilder.CreateCylinder("tower", { diameter: 8, height: 45, tessellation: 14 }, scene);
    tower.position.set(X(120), 22.5, Z(20)); tower.material = mat("#e9ecef"); tower.checkCollisions = true;
    const cab = B.MeshBuilder.CreateCylinder("cab", { diameter: 16, height: 6, tessellation: 16 }, scene);
    cab.position.set(X(120), 47, Z(20)); cab.material = mat("#2e5a7a"); cab.checkCollisions = true;

    // --- APRON & PLANES ---
    // Concrete area behind terminal
    box(350, 0.1, 80, X(0), 0.05, Z(-60), "#c5cad0", false);

    const gatePositions = [-120, -80, -40, 0, 40, 80, 120];
    gatePositions.forEach((gx, i) => {
      // Jet Bridge
      box(3, 3, 24, X(gx), 3.8, Z(-35), "#8a929a", true);
      box(1.5, 3.8, 1.5, X(gx), 1.9, Z(-25), "#6b7178", true);
      
      // Plane
      aircraft(gx, Z(-55), Math.PI, i);
    });

    // --- BOOKING COUNTER ---
    const counterX = X(0), counterZ = Z(-5);
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
        window.ACCRA_KIT.points.push({ x: counterX, z: counterZ + 3, r: 4, t: "\uD83C\uDFAB Buy Flight Ticket", ok: () => !window.ACCRA_KIT.busy && !window.ACCRA_KIT.seated, f: openFlightMenu });
      }
    }, 5000);

    // --- ANIMATION ---
    scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() * 0.001;
      planes.forEach((p, i) => {
        const m = p.metadata;
        if (!m) return;
        if (m.engL) m.engL.rotation.x += 0.15; if (m.engR) m.engR.rotation.x += 0.15;
        const blink = Math.sin(time * 5 + i) > 0.25;
        if (m.lightRed?.material) m.lightRed.material.emissiveColor = blink ? B.Color3.Red() : B.Color3.Black();
        if (m.lightGreen?.material) m.lightGreen.material.emissiveColor = blink ? B.Color3.Green() : B.Color3.Black();
      });
    });

    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 60 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kotoka International Airport", x: C.x, z: C.z + 60 });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;

    console.log("Kotoka Airport Ultimate Edition loaded");
  } catch (err) { console.error("accra-airport failed:", err); }
})();
