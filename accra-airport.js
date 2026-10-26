/* accra-airport.js - Kotoka International Airport (Full Rewrite)
 * Better looking planes, landing gear, windows, and a working flight booking system.
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

    // ========== BETTER AIRCRAFT MODEL ==========
    function aircraft(x, z, rotY = 0, index = 0) {
      const group = new B.TransformNode("plane_" + index, scene);
      group.position.set(X(x), 0, Z(z));
      group.rotation.y = rotY;

      // 1. Fuselage (Main Body)
      const fus = B.MeshBuilder.CreateCylinder("fus", { diameter: 3.4, height: 36, tessellation: 16 }, scene);
      fus.rotation.z = Math.PI / 2;
      fus.position.set(0, 3, 0);
      fus.material = mat("#f4f4f2");
      fus.parent = group;
      fus.checkCollisions = true;
      if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

      // 2. Nose (Cockpit)
      const nose = B.MeshBuilder.CreateCylinder("nose", { diameterTop: 0.1, diameterBottom: 3.4, height: 6, tessellation: 16 }, scene);
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(21, 3, 0);
      nose.material = mat("#f4f4f2");
      nose.parent = group;

      // 3. Tail Cone
      const tail = B.MeshBuilder.CreateCylinder("tail", { diameterTop: 0.5, diameterBottom: 3.4, height: 8, tessellation: 16 }, scene);
      tail.rotation.z = Math.PI / 2;
      tail.position.set(-22, 3, 0);
      tail.material = mat("#f4f4f2");
      tail.parent = group;

      const part = (w, h, d, px, py, pz, col, solid = false, rotZ = 0, rotX = 0) => {
        const m = B.MeshBuilder.CreateBox("p", { width: w, height: h, depth: d }, scene);
        m.position.set(px, py, pz);
        m.material = mat(col);
        m.rotation.z = rotZ; m.rotation.x = rotX;
        m.parent = group;
        if (solid) m.checkCollisions = true;
        return m;
      };

      // 4. Swept Wings
      part(14, 0.3, 6, -1, 2.8, -8, "#e0e0e0", true, 0, -0.15); // Left Wing
      part(14, 0.3, 6, -1, 2.8, 8, "#e0e0e0", true, 0, 0.15);   // Right Wing

      // 5. Engines
      const engL = B.MeshBuilder.CreateCylinder("eng", { diameter: 1.8, height: 5 }, scene);
      engL.rotation.z = Math.PI / 2; engL.position.set(2, 1.8, -6); engL.material = mat("#a0a0a0"); engL.parent = group;
      
      const engR = B.MeshBuilder.CreateCylinder("eng", { diameter: 1.8, height: 5 }, scene);
      engR.rotation.z = Math.PI / 2; engR.position.set(2, 1.8, 6); engR.material = mat("#a0a0a0"); engR.parent = group;

      // 6. Tail Fins
      part(4, 8, 0.4, -20, 6, 0, "#CE1126", true); // Vertical tail (Red)
      part(3.5, 0.3, 7, -22, 3.2, 0, "#FCD116", true); // Horizontal stabilizers (Gold)

      // 7. Ghana Flag Stripes on Fuselage
      part(26, 0.5, 3.42, 0, 3.2, 0, "#CE1126"); // Red
      part(26, 0.4, 3.42, 0, 2.6, 0, "#FCD116"); // Gold
      part(26, 0.4, 3.42, 0, 2.2, 0, "#006B3F"); // Green

      // 8. Passenger Windows (Little black boxes)
      for (let i = -12; i <= 12; i += 2) {
        if (i === 0) continue;
        part(0.4, 0.4, 3.45, i, 3.8, 0, "#111111");
      }

      // 9. Landing Gear
      const strut = (px, pz) => {
        part(0.2, 1.5, 0.2, px, 1.4, pz, "#888888");
        const w = B.MeshBuilder.CreateCylinder("wheel", { diameter: 1, height: 0.4 }, scene);
        w.rotation.x = Math.PI / 2;
        w.position.set(px, 0.5, pz); w.material = mat("#111111"); w.parent = group;
      };
      strut(16, 0);   // Front gear
      strut(-4, -4);  // Left gear
      strut(-4, 4);   // Right gear

      // Navigation Lights
      const makeLight = (d, px, py, pz, col) => {
        const s = B.MeshBuilder.CreateSphere("nav", { diameter: d }, scene);
        s.position.set(px, py, pz);
        const m = mat(col); m.emissiveColor = B.Color3.FromHexString(col);
        s.material = m; s.parent = group;
        return s;
      };
      const lightRed = makeLight(0.4, 6, 2.8, -11.2, "#ff0000");
      const lightGreen = makeLight(0.4, 6, 2.8, 11.2, "#00ff00");

      group.metadata = { engL, engR, lightRed, lightGreen };
      planes.push(group);
      return group;
    }

    function jetBridge(x, z, length = 16) {
      box(2.2, 2.4, length, X(x), 3.8, Z(z), "#8a929a", true);
      box(1.2, 3.2, 1.2, X(x), 1.6, Z(z + length * 0.3), "#6b7178", true);
      box(3.5, 2.6, 2.5, X(x), 3.9, Z(z - length * 0.45), "#9aa3ad", true);
    }

    // ========== GROUND & RUNWAY ==========
    const ground = B.MeshBuilder.CreateGround("apt_ground", { width: 520, height: 380 }, scene);
    ground.position.set(C.x, -0.04, C.z);
    ground.material = mat("#4a7a3a");
    ground.receiveShadows = true; ground.isPickable = false;

    box(320, 0.12, 36, X(0), 0.06, Z(-95), "#2a2c30", false);
    for (let i = -140; i <= 140; i += 18) box(9, 0.14, 0.7, X(i), 0.09, Z(-95), "#f2f2f2", false);
    
    // Runway text
    text("09", X(-130), 0.1, Z(-95), 14, 7, "#2a2c30", "#ffffff", true);
    text("27", X(130), 0.1, Z(-95), 14, 7, "#2a2c30", "#ffffff", true);

    // ========== TERMINAL & JET BRIDGES ==========
    box(280, 12, 28, X(0), 6, Z(28), "#e8ecef", true);
    box(270, 8, 0.5, X(0), 5, Z(14.2), "#2e5a7a", false);
    box(290, 1.2, 32, X(0), 12.4, Z(28), "#9aa5ad", false);
    box(80, 16, 28, X(0), 8, Z(28), "#dfe5ea", true);
    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 15.5, Z(14.5), 52, 6, "#17191c", "#fcd116", false);

    const gatePositions = [-100, -70, -40, -10, 20, 50, 80];
    gatePositions.forEach((gx, i) => {
      jetBridge(gx, 8, 16);
      aircraft(gx, -6, Math.PI, i);
    });

    // Extra planes
    aircraft(-130, -40, Math.PI * 0.5, 20);
    aircraft(130, -40, -Math.PI * 0.5, 21);
    aircraft(0, -40, Math.PI, 22);

    // Control Tower
    const tower = B.MeshBuilder.CreateCylinder("tower", { diameter: 5, height: 32, tessellation: 14 }, scene);
    tower.position.set(X(160), 16, Z(45)); tower.material = mat("#e9ecef"); tower.checkCollisions = true;

    // ========== FLIGHT BOOKING SYSTEM ==========
    // 1. Build a Ticket Counter inside the terminal
    const counterX = X(0), counterY = 1.5, counterZ = Z(22);
    box(10, 1.2, 2, counterX, 0.6, counterZ, "#c9a54a", true);
    box(11, 0.2, 3, counterX, 1.3, counterZ, "#17191c", false);
    text("TICKETS", counterX, 3, counterZ + 0.6, 6, 1.5, "#17191c", "#fcd116", false);

    // 2. Add the interaction point
    function openFlightMenu() {
      if (!window.ACCRA_KIT) return;
      const K = window.ACCRA_KIT;
      const cash = K.cash();

      const FLIGHTS = [
        { dest: "Kumasi", x: -2400, z: -24470, cost: 250 },
        { dest: "Takoradi", x: -1500, z: 1200, cost: 300 },
        { dest: "Tamale", x: 800, z: -8000, cost: 400 }
      ];

      const draw = () => K.show(
        K.ttl("\u2708\uFE0F Kotoka Departures") + 
        `<small>Cash: GH\u00A2${cash}</small><br><br>` +
        FLIGHTS.map((f, i) => 
          `<button data-f="${i}" style="${K.BS}">Fly to ${f.dest} \u00B7 GH\u00A2${f.cost}</button>`
        ).join("") + K.CLOSE,
        d => {
          if (d.x) return K.hide();
          if (d.f !== undefined) {
            const flight = FLIGHTS[+d.f];
            if (cash < flight.cost) return K.note("Not enough cash for this flight.");
            K.pay(flight.cost, "Flight to " + flight.dest);
            K.hide();
            
            // Fade out, move player, fade in
            K.fade(3000, () => {
              if (typeof player !== "undefined") {
                player.position.set(flight.x, 1, flight.z);
                if (typeof camT !== "undefined") camT.position.copyFrom(player.position);
              }
            }, () => {
              K.note("Welcome to " + flight.dest + "!");
            });
          }
        }
      );
    }

    // Wait for the game to load before registering the point
    setTimeout(() => {
      if (window.ACCRA_KIT && window.ACCRA_KIT.points) {
        window.ACCRA_KIT.points.push({
          x: counterX, z: counterZ + 2, r: 4,
          t: "\uD83C\uDFAB Buy Flight Ticket",
          ok: () => !window.ACCRA_KIT.busy && !window.ACCRA_KIT.seated,
          f: openFlightMenu
        });
        console.log("Flight booking system registered.");
      }
    }, 5000);

    // ========== ANIMATION LOOP ==========
    scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() * 0.001;
      planes.forEach((p, i) => {
        const m = p.metadata;
        if (!m) return;
        // Spin engines
        if (m.engL) m.engL.rotation.x += 0.15;
        if (m.engR) m.engR.rotation.x += 0.15;
        // Blink lights
        const blink = Math.sin(time * 5 + i) > 0.25;
        if (m.lightRed?.material) m.lightRed.material.emissiveColor = blink ? B.Color3.Red() : B.Color3.Black();
        if (m.lightGreen?.material) m.lightGreen.material.emissiveColor = blink ? B.Color3.Green() : B.Color3.Black();
      });
    });

    // Register
    window.ACCRA_AIRPORT = { name: "Kotoka International Airport", x: C.x, z: C.z + 60 };
    (window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || []).push({ n: "Kotoka International Airport", x: C.x, z: C.z + 60 });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).airport = 1;

    console.log("Kotoka Airport ready with booking system");
  } catch (err) {
    console.error("accra-airport failed:", err);
  }
})();
