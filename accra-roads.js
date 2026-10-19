/* accra-roads.js - Pro Ghana Highway, Multi-Lane Grid & Interactive Toll Plaza */
(function () {
  try {
    const B = BABYLON;
    const RR = R; // Grid roads from main file
    const CYCLE = 24, NS_GREEN = 10, YELLOW = 2;
    let clock = 0;

    // --- Traffic Signal Timings ---
    function state(t) {
      const u = ((t % CYCLE) + CYCLE) % CYCLE;
      if (u < NS_GREEN) return { ns: "green", ew: "red" };
      if (u < NS_GREEN + YELLOW) return { ns: "yellow", ew: "red" };
      if (u < NS_GREEN + YELLOW + NS_GREEN) return { ns: "red", ew: "green" };
      return { ns: "red", ew: "yellow" };
    }

    const colours = { red: "#ff3b3b", yellow: "#ffcf3b", green: "#3bff6a" };
    const on = {}, off = {};
    Object.keys(colours).forEach(k => {
      on[k] = new B.StandardMaterial("sig_on_" + k, scene); on[k].emissiveColor = B.Color3.FromHexString(colours[k]); on[k].diffuseColor = B.Color3.Black();
      off[k] = new B.StandardMaterial("sig_off_" + k, scene); off[k].emissiveColor = B.Color3.FromHexString("#1a1a1a"); off[k].diffuseColor = B.Color3.FromHexString("#222222");
    });
    const poleM = mat("#3a3d44"), lampM = new B.StandardMaterial("lamp", scene);
    lampM.emissiveColor = B.Color3.FromHexString("#fff2c4"); lampM.diffuseColor = B.Color3.Black();

    // --- Traffic Lights (Optimized with zero collisions for smooth driving) ---
    const heads = [];
    const sourceLamp = B.MeshBuilder.CreateSphere("sig_src", { diameter: .34, segments: 8 }, scene);
    sourceLamp.isVisible = false;
    RR.forEach((x) => RR.forEach((z) => {
      const px = x + 6.8, pz = z + 6.8;
      const pole = B.MeshBuilder.CreateCylinder("sig_pole", { diameter: .26, height: 5.6, tessellation: 8 }, scene);
      pole.position.set(px, 2.8, pz); pole.material = poleM; pole.checkCollisions = false; pole.isPickable = false;
      const box2 = B.MeshBuilder.CreateBox("sig_box", { width: .5, height: 1.5, depth: .5 }, scene);
      box2.position.set(px, 5.4, pz); box2.material = poleM; box2.isPickable = false; box2.checkCollisions = false;
      const lamps = {};
      ["red", "yellow", "green"].forEach((k, n) => {
        const l = sourceLamp.createInstance("sig_" + k);
        l.position.set(px, 5.85 - n * .45, pz - .3); l.isPickable = false;
        lamps[k] = l;
      });
      heads.push({ lamps, ns: true });
    }));

    function paintLights(t) {
      const s = state(t);
      const nsPhase = s.ns, ewPhase = s.ew;
      heads.forEach((h, n) => {
        const phase = (n % 2 === 0) ? nsPhase : ewPhase;
        ["red", "yellow", "green"].forEach(k => {
          const lit = (phase === "green" && k === "green") || (phase === "yellow" && k === "yellow") || (phase === "red" && k === "red");
          h.lamps[k].material = lit ? on[k] : off[k];
        });
      });
    }

    // --- Flush Pedestrian Crossings ---
    const stripeSrc = B.MeshBuilder.CreateBox("zebra_src", { width: 1, height: .005, depth: 1 }, scene);
    stripeSrc.material = mat("#f2f2f2"); stripeSrc.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      [[0, 9.5], [0, -9.5], [9.5, 0], [-9.5, 0]].forEach(d => {
        const cx = x + d[0], cz = z + d[1];
        for (let k = -1; k <= 1; k++) {
          const s = stripeSrc.createInstance("zebra");
          if (d[0] === 0) { s.scaling.set(6.4, 1, .8); s.position.set(cx, .032, cz + k * 1.6); }
          else { s.scaling.set(.8, 1, 6.4); s.position.set(cx + k * 1.6, .032, cz); }
          s.isPickable = false; s.checkCollisions = false;
        }
      });
    }));

    // --- Professional Multi-Lane Highway & Accra Gate Toll Plaza ---
    const tollX = -300, tollZ = 200; // Positioned along the northern highway corridor
    
    // Highway approach road bed
    const hwyMat = Object.assign(new BABYLON.StandardMaterial("hwyMat", scene), { diffuseColor: BABYLON.Color3.FromHexString("#2b2d31"), specularColor: new BABYLON.Color3(.05,.05,.05) });
    const hwy = B.MeshBuilder.CreateBox("highway_main", { width: 24, height: .04, depth: 300 }, scene);
    hwy.position.set(tollX, .02, tollZ); hwy.material = hwyMat; hwy.receiveShadows = true; hwy.checkCollisions = true;

    // Toll Plaza Overhead Canopy Structure
    const canopy = B.MeshBuilder.CreateBox("toll_canopy", { width: 28, height: 1.2, depth: 12 }, scene);
    canopy.position.set(tollX, 7, tollZ); canopy.material = mat("#1f232a"); canopy.checkCollisions = true;

    // Toll Signage Board Text
    const tollDt = new B.DynamicTexture("toll_dt", { width: 1024, height: 256 }, scene, false);
    const tc = tollDt.getContext();
    tc.fillStyle = "#111318"; tc.fillRect(0, 0, 1024, 256);
    tc.fillStyle = "#ffffff"; tc.font = "bold 58px system-ui"; tc.textAlign = "center"; tc.textBaseline = "middle";
    tc.fillText("ACCRA GATE TOLL", 512, 80);
    tc.fillStyle = "#fcd116"; tc.font = "bold 68px system-ui";
    tc.fillText("GH₵15", 512, 175);
    tollDt.update();

    const signPlane = B.MeshBuilder.CreatePlane("toll_sign", { width: 20, height: 5 }, scene);
    signPlane.position.set(tollX, 7.2, tollZ - 6.05);
    const signMat = new B.StandardMaterial("signMat", scene);
    signMat.diffuseTexture = tollDt; signMat.emissiveTexture = tollDt; signMat.disableLighting = true;
    signPlane.material = signMat;

    // Toll Booths & Interactive Barrier Gates
    [-6, 0, 6].forEach((offset, idx) => {
      // Small booth cabin
      const booth = B.MeshBuilder.CreateBox("booth_" + idx, { width: 3, height: 3, depth: 3 }, scene);
      booth.position.set(tollX + offset, 1.5, tollZ); booth.material = mat("#d6c4a0"); booth.checkCollisions = true;

      // Movable Barrier Gate Bar (Red/White bar that lifts when paid)
      const barrier = B.MeshBuilder.CreateBox("toll_barrier_" + idx, { width: 5, height: .3, depth: .3 }, scene);
      barrier.position.set(tollX + offset + 2.5, 1.5, tollZ + 2); 
      barrier.material = Object.assign(new BABYLON.StandardMaterial("barMat", scene), { emissiveColor: BABYLON.Color3.FromHexString("#ff2a2a") });
      barrier.checkCollisions = true;
      barrier.isTollBarrier = true; // Tag for instant unlocking
    });

    // Global Toll Payment Handler (Linked to your UI / Button)
    window.payToll = function() {
      let money = typeof playerMoney !== 'undefined' ? playerMoney : 1794135;
      if (money >= 15) {
        if (typeof playerMoney !== 'undefined') playerMoney -= 15;
        alert("🎉 Toll Paid! GH₵15 deducted. Gate barriers opening!");
        
        // Instantly lift and disable all toll barriers
        scene.meshes.forEach(m => {
          if (m.isTollBarrier) {
            m.setEnabled(false); // Disables collision and hides the gate immediately
          }
        });
      } else {
        alert("❌ Insufficient funds! Toll costs GH₵15.");
      }
    };

    // --- District & Landmark Registries ---
    window.ACCRA_DISTRICTS = {
      AIRPORT_CITY: { x: -200, z: -100, style: 'modern' },
      OSU: { x: 0, z: -100, style: 'nightlife' },
      MAKOLA: { x: 0, z: 0, style: 'market' },
      EAST_LEGON: { x: 200, z: 200, style: 'villas' },
      CENTRAL_ACCRA: { x: -100, z: 100, style: 'civic' },
      LABADI: { x: 0, z: 300, style: 'beach' },
      AMOAMAH_ESTATE: { x: 300, z: 100, style: 'estate' },
      HIGHWAY_NORTH: { x: tollX, z: tollZ, style: 'highway' }
    };

    window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || [];
    [
      { n: "Kotoka International Airport", x: -420, z: -242 },
      { n: "Accra Gate Toll Plaza", x: tollX, z: tollZ },
      { n: "Accra Mall", x: -150, z: -80 },
      { n: "Accra Sports Stadium", x: -80, z: 120 },
      { n: "Accra Central Hospital", x: -120, z: 80 },
      { n: "Police Headquarters", x: -60, z: 60 }
    ].forEach(l => {
      if (!window.ACCRA_LANDMARKS.some(existing => existing.n === l.n)) {
        window.ACCRA_LANDMARKS.push(l);
      }
    });

    window.ACCRA_TRAFFIC = { state: () => state(clock), clock: () => clock, cycle: CYCLE };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).roads = 1;
    console.log("Accra Pro Highway & Toll Plaza initialized successfully.");
  } catch (err) { console.error("accra-roads failed:", err); }
})();
