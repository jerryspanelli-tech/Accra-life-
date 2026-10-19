/* accra-roads.js - Stage 2: traffic lights, flattened pedestrian crossings, streetlights, and district registries for the Accra road grid.
 * Uses the grid from babylon.html (roads at R = -150, -70, 0, 70, 150). Every junction runs the same timer:
 * north-south green 10 s, yellow 2 s, east-west green 10 s, yellow 2 s (24 s cycle).
 * Exposes window.ACCRA_TRAFFIC.state() and global district/landmark data. */
(function () {
  try {
    const B = BABYLON;
    const RR = R;                                         // the road grid positions from babylon.html
    const CYCLE = 24, NS_GREEN = 10, YELLOW = 2;
    let clock = 0;

    // ----- signal timing (one shared clock for every junction) -----
    function state(t) {
      const u = ((t % CYCLE) + CYCLE) % CYCLE;
      if (u < NS_GREEN) return { ns: "green", ew: "red" };
      if (u < NS_GREEN + YELLOW) return { ns: "yellow", ew: "red" };
      if (u < NS_GREEN + YELLOW + NS_GREEN) return { ns: "red", ew: "green" };
      return { ns: "red", ew: "yellow" };
    }

    // ----- shared materials: each colour has a bright (on) and dim (off) version -----
    const colours = { red: "#ff3b3b", yellow: "#ffcf3b", green: "#3bff6a" };
    const on = {}, off = {};
    Object.keys(colours).forEach(k => {
      on[k] = new B.StandardMaterial("sig_on_" + k, scene); on[k].emissiveColor = B.Color3.FromHexString(colours[k]); on[k].diffuseColor = B.Color3.Black();
      off[k] = new B.StandardMaterial("sig_off_" + k, scene); off[k].emissiveColor = B.Color3.FromHexString("#1a1a1a"); off[k].diffuseColor = B.Color3.FromHexString("#222222");
    });
    const poleM = mat("#3a3d44"), lampM = new B.StandardMaterial("lamp", scene);
    lampM.emissiveColor = B.Color3.FromHexString("#fff2c4"); lampM.diffuseColor = B.Color3.Black();

    // ----- traffic lights: one pole and head at each corner of every junction (collisions disabled for smooth driving) -----
    const heads = [];                                        // each head has red, yellow and green lamps
    const sourceLamp = B.MeshBuilder.CreateSphere("sig_src", { diameter: .34, segments: 8 }, scene);
    sourceLamp.isVisible = false;
    RR.forEach((x, i) => RR.forEach((z, j) => {
      const px = x + 6.8, pz = z + 6.8;                      // pole sits on the corner, off the road
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

    // ----- pedestrian crossings: completely flush stripes to prevent car bumps -----
    const stripeSrc = B.MeshBuilder.CreateBox("zebra_src", { width: 1, height: .005, depth: 1 }, scene);
    stripeSrc.material = mat("#f2f2f2"); stripeSrc.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      [[0, 9.5], [0, -9.5], [9.5, 0], [-9.5, 0]].forEach(d => {
        const cx = x + d[0], cz = z + d[1];
        for (let k = -1; k <= 1; k++) {
          const s = stripeSrc.createInstance("zebra");
          if (d[0] === 0) { s.scaling.set(6.4, 1, .8); s.position.set(cx, .032, cz + k * 1.6); }
          else { s.scaling.set(.8, 1, 6.4); s.position.set(cx + k * 1.6, .032, cz); }
          s.isPickable = false;
          s.checkCollisions = false;
        }
      });
    }));

    // ----- streetlights: a pole and lamp on both sides of every road, between junctions -----
    const poleSrc = B.MeshBuilder.CreateCylinder("lamp_pole", { diameter: .22, height: 8, tessellation: 6 }, scene);
    poleSrc.material = poleM; poleSrc.isVisible = false;
    const headSrc = B.MeshBuilder.CreateSphere("lamp_head", { diameter: .6, segments: 6 }, scene);
    headSrc.material = lampM; headSrc.isVisible = false;
    const nearJunction = v => RR.some(r => Math.abs(v - r) < 10);
    function lampAt(x, z) {
      const p = poleSrc.createInstance("lp"); p.position.set(x, 4, z); p.checkCollisions = false; p.isPickable = false;
      const h = headSrc.createInstance("lh"); h.position.set(x, 7.9, z); h.isPickable = false;
    }
    RR.forEach(c => {
      for (let t = -160; t <= 160; t += 25) {
        if (nearJunction(t)) continue;
        lampAt(t, c + 6.4); lampAt(t, c - 6.4);
        lampAt(c + 6.4, t); lampAt(c - 6.4, t);
      }
    });

    // ----- run the signals -----
    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      clock += Math.min(engine.getDeltaTime() / 1000, .05);
      if (++tick % 6 === 0) paintLights(clock);
    });
    paintLights(0);

    // ----- District & Global Landmarks Registry Integration -----
    window.ACCRA_DISTRICTS = {
      AIRPORT_CITY: { x: -200, z: -100, style: 'modern' },
      OSU: { x: 0, z: -100, style: 'nightlife' },
      MAKOLA: { x: 0, z: 0, style: 'market' },
      EAST_LEGON: { x: 200, z: 200, style: 'villas' },
      CENTRAL_ACCRA: { x: -100, z: 100, style: 'civic' },
      LABADI: { x: 0, z: 300, style: 'beach' },
      AMOAMAH_ESTATE: { x: 300, z: 100, style: 'estate' },
      HIGHWAY_NORTH: { x: -300, z: 400, style: 'highway' }
    };

    window.ACCRA_LANDMARKS = window.ACCRA_LANDMARKS || [];
    const landmarks = [
      { n: "Kotoka International Airport", x: -420, z: -242 },
      { n: "Accra Mall", x: -150, z: -80 },
      { n: "Accra Sports Stadium", x: -80, z: 120 },
      { n: "Accra Central Hospital", x: -120, z: 80 },
      { n: "Police Headquarters", x: -60, z: 60 },
      { n: "Accra Motors Showroom", x: -180, z: -40 },
      { n: "Amoamah Car Dealership", x: 280, z: 110 },
      { n: "Accra Vibes Pub & VIP Lounge", x: 20, z: -120 },
      { n: "Labadi Beach & Swimming Zone", x: 0, z: 320 },
      { n: "Accra Stone Quarry", x: 450, z: -300 },
      { n: "Galamsey Mining Area", x: -500, z: 500 }
    ];

    landmarks.forEach(l => {
      if (!window.ACCRA_LANDMARKS.some(existing => existing.n === l.n)) {
        window.ACCRA_LANDMARKS.push(l);
      }
    });

    window.ACCRA_TRAFFIC = { state: () => state(clock), clock: () => clock, cycle: CYCLE };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).roads = 1;
    console.log("Accra roads, smooth streetlights, and district registries initialized successfully.");
  } catch (err) { console.error("accra-roads failed:", err); }
})();
