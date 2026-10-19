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

    // ----- traffic lights: one pole and head at each corner of every junction -----
    const heads = [];                                        // each head has red, yellow and green lamps
    const sourceLamp = B.MeshBuilder.CreateSphere("sig_src", { diameter: .34, segments: 8 }, scene);
    sourceLamp.isVisible = false;
    RR.forEach((x, i) => RR.forEach((z, j) => {
      const px = x + 6.8, pz = z + 6.8;                      // pole sits on the corner, off the road
      const pole = B.MeshBuilder.CreateCylinder("sig_pole", { diameter: .26, height: 5.6, tessellation: 8 }, scene);
      pole.position.set(px, 2.8, pz); pole.material = poleM; pole.checkCollisions = true;
      const box2 = B.MeshBuilder.CreateBox("sig_box", { width: .5, height: 1.5, depth: .5 }, scene);
      box2.position.set(px, 5.4, pz); box2.material = poleM; box2.isPickable = false;
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

    // ----- pedestrian crossings: flattened stripes flush with road surface -----
    const stripeSrc = B.MeshBuilder.CreateBox("zebra_src", { width: 1, height: .01, depth: 1 }, scene);
    stripeSrc.material = mat("#f2f2f2"); stripeSrc.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      [[0, 9.5], [0, -9.5], [9.5, 0], [-9.5, 0]].forEach(d => {
        const cx = x + d[0], cz = z + d[1];
        for (let k = -1; k <= 1; k++) {
          const s = stripeSrc.createInstance("zebra");
          if (d[0] === 0) { s.scaling.set(6.4, 1, .8); s.position.set(cx, .035, cz + k * 1.6); }
          else { s.scaling.set(.8, 1, 6.4); s.position.set(cx + k * 1.6, .035, cz); }
          s.isPickable = false;
          s.checkCollisions = false;
        }
      });
    }));

    // ----- streetlights: a pole and lamp on both sides of every road, between junctions -----
    const poleSrc = B.MeshBuilder.CreateCylinder("lamp_pole", { diameter: .22, height: 8, tessellation: 6 }, scene);
    poleSrc.material = poleM; poleSrc
