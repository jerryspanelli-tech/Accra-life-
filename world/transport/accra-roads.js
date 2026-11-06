/* accra-roads.js - traffic lights and pedestrian crossings for the city grid.
 * Every junction runs the same timer: north-south green 10 s, yellow 2 s, east-west green 10 s, yellow 2 s.
 * The second toll plaza that was here has been removed. The only toll is the one in accra-world.js and
 * accra-toll.js, at the highway. Exposes window.ACCRA_TRAFFIC for other systems. */
(function () {
  try {
    const B = BABYLON;
    const RR = typeof R !== "undefined" ? R : [-150, -70, 0, 70, 150];
    const CYCLE = 24, NS_GREEN = 10, YELLOW = 2;
    let clock = 0;

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
    const poleM = mat("#3a3d44");

    const heads = [];
    const sourceLamp = B.MeshBuilder.CreateSphere("sig_src", { diameter: .34, segments: 8 }, scene);
    sourceLamp.isVisible = false;
    function makeHead(px, pz, tag) {
      const pole = B.MeshBuilder.CreateCylinder("sig_pole_" + tag, { diameter: .26, height: 5.6, tessellation: 8 }, scene);
      pole.position.set(px, 2.8, pz); pole.material = poleM; pole.checkCollisions = false; pole.isPickable = false;
      const head = B.MeshBuilder.CreateBox("sig_box_" + tag, { width: .5, height: 1.5, depth: .5 }, scene);
      head.position.set(px, 5.4, pz); head.material = poleM; head.isPickable = false; head.checkCollisions = false;
      const lamps = {};
      ["red", "yellow", "green"].forEach((k, n) => {
        const l = sourceLamp.clone("sig_" + tag + "_" + k);
        l.isVisible = true;
        l.position.set(px, 5.85 - n * .45, pz - .3); l.isPickable = false;
        lamps[k] = l;
      });
      return lamps;
    }
    RR.forEach(x => RR.forEach(z => {
      // Separate signal heads represent the two crossing directions at each junction.
      heads.push({
        ns: makeHead(x + 6.8, z + 6.8, "ns"),
        ew: makeHead(x - 6.8, z - 6.8, "ew")
      });
    }));

    function paintLights(t) {
      const s = state(t);
      heads.forEach(h => {
        ["red", "yellow", "green"].forEach(k => {
          h.ns[k].material = s.ns === k ? on[k] : off[k];
          h.ew[k].material = s.ew === k ? on[k] : off[k];
        });
      });
    }

    // Pedestrian crossings on each approach. Y raised from .012 to .09 because
    // the road mesh tops sit at y = .055 (east-west) and y = .065 (north-south);
    // the old .012 was buried under the asphalt and completely invisible.
    const CROSS_Y = .09;
    const stripeSrc = B.MeshBuilder.CreateBox("zebra_src", { width: 1, height: .002, depth: 1 }, scene);
    stripeSrc.material = mat("#f2f2f2"); stripeSrc.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      [[0, 9.5], [0, -9.5], [9.5, 0], [-9.5, 0]].forEach(d => {
        const cx = x + d[0], cz = z + d[1];
        for (let k = -1; k <= 1; k++) {
          const s = stripeSrc.createInstance("zebra");
          if (d[0] === 0) { s.scaling.set(6.4, 1, .8); s.position.set(cx, CROSS_Y, cz + k * 1.6); }
          else { s.scaling.set(.8, 1, 6.4); s.position.set(cx + k * 1.6, CROSS_Y, cz); }
          s.isPickable = false; s.checkCollisions = false;
        }
      });
    }));

    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      clock += Math.min(engine.getDeltaTime() / 1000, .05);
      if (++tick % 6 === 0) paintLights(clock);
    });
    paintLights(0);

    window.ACCRA_TRAFFIC = { state: () => state(clock), clock: () => clock, cycle: CYCLE };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).roads = 1;
    console.log("Accra roads ready:", heads.length * 2, "directional signal heads");
  } catch (err) { console.error("accra-roads failed:", err); }
})();
