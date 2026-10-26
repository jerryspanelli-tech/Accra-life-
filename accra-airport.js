/* accra-airport.js - Kotoka International Airport (Fixed Z-Fighting) */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 }; // Airport centre
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const planes = [];

    // --- Helpers ---
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
      
      const nose = B.MeshBuilder.CreateCylinder("nose", { diameterTop: 0.1, diameterBottom: 3.4, height: 6, tessellation: 16 }, scene);
      nose.rotation.z = -Math.PI / 2; nose.position.set(21, 3, 0); nose.material = mat("#f4f4f2"); nose.parent = group;

      const tail = B.MeshBuilder.CreateCylinder("tail", { diameterTop: 0.5, diameterBottom: 3.4, height: 8, tessellation: 16 }, scene);
      tail.rotation.z = Math.PI / 2; tail.position.set(-22, 3, 0); tail.material = mat("#f4f4f2"); tail.parent = group;

      const part = (w, h, d, px, py, pz, col) => {
        const m = B.MeshBuilder.CreateBox("p", { width: w, height: h, depth: d }, scene);
        m.position.set(px, py, pz); m.material = mat(col); m.parent = group; return m;
      };

      part(14, 0.3, 6, -1, 2.8, -8, "#e0e0e0"); part(14, 0.3, 6, -1, 2.8, 8, "#e0e0e0");
      part(4, 8, 0.4, -20, 6, 0, "#CE1126"); part(3.5, 0.3, 7, -22, 3.2, 0, "#FCD116");
      part(26, 0.5, 3.42, 0, 3.2, 0, "#CE1126"); part(26, 0.4, 3.42, 0, 2.6, 0, "#FCD116"); part(26, 0.4, 3.42, 0, 2.2, 0, "#006B3F");

      planes.push(group);
      return group;
    }

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

    // --- GROUND & TARMAC (Z-FIGHTING FIX) ---
    // Grass base sits low
    const grass = B.MeshBuilder.CreateGround("apt_grass", { width: 800, height: 800 }, scene);
    grass.position.set(C.x, -0.1, C.z); grass.material = mat("#4a7a3a"); grass.receiveShadows = true;

    // Tarmac sits slightly ABOVE the main ground to prevent blinking
    const dt = new B.DynamicTexture("tarmac", 1024, scene, true);
    const ctx = dt.getContext();
    ctx.fillStyle = "#3a3d44"; ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = "#fcd116"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(512, 0); ctx.lineTo(512, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(1024, 512); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
    for(let i=100; i<1024; i+=150) {
      ctx.beginPath(); ctx.moveTo(i, 100); ctx.lineTo(i, 300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, 724); ctx.lineTo(i, 924); ctx.stroke();
    }
    dt.update();
    const tarmacMat = new B.StandardMaterial("tarmacMat", scene);
    tarmacMat.diffuseTexture = dt; tarmacMat.specularColor = B.Color3.Black();

    const tarmac = B.MeshBuilder.CreateGround("apt_tarmac", { width: 400, height: 400 }, scene);
    // FIXED: y position raised to 0.05
    tarmac.position.set(C.x, 0.05, C.z); tarmac.material = tarmacMat; tarmac.receiveShadows = true;

    // 3. Access Road (Connecting City to Airport)
    box(20, 0.12, 200, X(0), 0.1, Z(150), "#2b2d31", false); // Road coming from City (Raised slightly)
    box(20, 0.12, 80, X(0), 0.1, Z(60), "#2b2d31", false);  // Drop off road
    for(let i=-90; i<190; i+=15) box(1, 0.14, 6, X(0), 0.15, Z(i), "#f2f2f2", false);

    // 4. Car Park
    box(100, 0.12, 60, X(-80), 0.1, Z(80), "#3a3d44", false);
    for(let i=-45; i<=45; i+=10) box(0.5, 0.14, 15, X(-80+i), 0.15, Z(80), "#ffffff", false);

    // --- TERMINAL BUILDING (Hub) ---
    const floor = B.MeshBuilder.CreateDisc("apt_floor", { radius: 60, tessellation: 64 }, scene);
    floor.rotation.x = Math.PI / 2; floor.position.set(X(0), 0.15, Z(0));
    floor.material = mat("#d9dde3"); floor.checkCollisions = false;

    const glassMat = new B.StandardMaterial("glass", scene);
    glassMat.diffuseColor = B.Color3.FromHexString("#8fc8e8");
    glassMat.alpha = 0.4; glassMat.specularColor = new B.Color3(1, 1, 1);

    const walls = B.MeshBuilder.CreateCylinder("apt_walls", { diameter: 120, height: 15, tessellation: 64 }, scene);
    walls.position.set(X(0), 7.5, Z(0)); walls.material = glassMat; walls.checkCollisions = true;
    
    const roof = B.MeshBuilder.CreateCylinder("apt_roof", { diameter: 130, height: 2, tessellation: 64 }, scene);
    roof.position.set(X(0), 16, Z(0)); roof.material = mat("#e8ecef");
    const roofGold = B.MeshBuilder.CreateCylinder("apt_roofgold", { diameter: 126, height: 2, tessellation: 64 }, scene);
    roofGold.position.set(X(0), 16.5, Z(0)); roofGold.material = mat("#FCD116");
    const roofBlack = B.MeshBuilder.CreateCylinder("apt_roofblack", { diameter: 120, height: 1, tessellation: 64 }, scene);
    roofBlack.position.set(X(0), 17, Z(0)); roofBlack.material = mat("#17191c");

    box(30, 10, 2, X(0), 5, Z(58), "#2e5a7a", false); 
    box(34, 1, 8, X(0), 10, Z(54), "#9aa5ad", true);  
    box(2, 10, 8, X(-16), 5, Z(54), "#e8ecef", true); 
    box(2, 10, 8, X(16), 5, Z(54), "#e8ecef", true);  
    text("KOTOKA INTERNATIONAL AIRPORT", X(0), 13, Z(58), 40, 4, "#17191c", "#fcd116", false);

    const arms = 6;
    for (let i = 0; i < arms; i++) {
      const angle = (i * Math.PI * 2) / arms;
      if (Math.abs(angle - Math.PI/2) < 0.1) continue;

      const armLen = 80;
      const arm = box(25, 12, armLen, 0, 6, 0, "#e8ecef", true);
      arm.position.set(X(Math.cos(angle) * (60 + armLen/2)), 6, Z(Math.sin(angle) * (60 + armLen/2)));
      arm.rotation.y = -angle + Math.PI/2;

      const armRoof = box(27, 1, armLen, 0, 0, 0, "#2e5a7a", false);
      armRoof.position.set(X(Math.cos(angle) * (60 + armLen/2)), 12.5, Z(Math.sin(angle) * (60 + armLen/2)));
      armRoof.rotation.y = -angle + Math.PI/2;

      for (let p = -1; p <= 1; p++) {
        const px = Math.cos(angle) * (60 + armLen + 30) + Math.cos(angle + Math.PI/2) * (p * 20);
        const pz = Math.sin(angle) * (60 + armLen + 30) + Math.sin(angle + Math.PI/2) * (p * 20);
        aircraft(px, pz, -angle + Math.PI/2, i*3+p);
      }
    }

    box(40, 0.15, 400, X(-200), 0.06, Z(0), "#2a2c30", false);
    for(let i=-180; i<180; i+=20) box(8, 0.16, 2, X(-200), 0.09, Z(i), "#f2f2f2", false);
    text("09", X(-200), 0.1, Z(-180), 16, 8, "#2a2c30", "#ffffff", true);

    const counterX = X(0), counterZ = Z(20);
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

    console.log("Realistic Kotoka Airport loaded");
  } catch (err) { console.error("accra-airport failed:", err); }
})();
