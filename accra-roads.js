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

    // ----- signal timing -----
    function state(t) {
      const u = ((t % CYCLE) + CYCLE) % CYCLE;
      if (u < NS_GREEN) return { ns: "green", ew: "red" };
      if (u < NS_GREEN + YELLOW) return { ns: "yellow", ew: "red" };
      if (u < NS_GREEN + YELLOW + NS_GREEN) return { ns: "red", ew: "green" };
      return { ns: "red", ew: "yellow" };
    }

    // ----- shared materials: bright (on) and dim (off) for each colour -----
    const colours = { red: "#ff3b3b", yellow: "#ffcf3b", green: "#3bff6a" };
    const on = {}, off = {};
    Object.keys(colours).forEach(k => {
      on[k] = new B.StandardMaterial("sig_on_" + k, scene); on[k].emissiveColor = B.Color3.FromHexString(colours[k]); on[k].diffuseColor = B.Color3.Black();
      off[k] = new B.StandardMaterial("sig_off_" + k, scene); off[k].emissiveColor = B.Color3.FromHexString("#1a1a1a"); off[k].diffuseColor = B.Color3.FromHexString("#222222");
    });
    const poleM = mat("#3a3d44");

    // ----- traffic lights: one pole and head at each corner of every junction (no collisions) -----
    const heads = [];
    const sourceLamp = B.MeshBuilder.CreateSphere("sig_src", { diameter: .34, segments: 8 }, scene);
    sourceLamp.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      const px = x + 6.8, pz = z + 6.8;
      const pole = B.MeshBuilder.CreateCylinder("sig_pole", { diameter: .26, height: 5.6, tessellation: 8 }, scene);
      pole.position.set(px, 2.8, pz); pole.material = poleM; pole.checkCollisions = false; pole.isPickable = false;
      const head = B.MeshBuilder.CreateBox("sig_box", { width: .5, height: 1.5, depth: .5 }, scene);
      head.position.set(px, 5.4, pz); head.material = poleM; head.isPickable = false; head.checkCollisions = false;
      const lamps = {};
      ["red", "yellow", "green"].forEach((k, n) => {
        const l = sourceLamp.createInstance("sig_" + k);
        l.position.set(px, 5.85 - n * .45, pz - .3); l.isPickable = false;
        lamps[k] = l;
      });
      heads.push({ lamps });
    }));

    function paintLights(t) {
      const s = state(t);
      heads.forEach((h, n) => {
        const phase = (n % 2 === 0) ? s.ns : s.ew;
        ["red", "yellow", "green"].forEach(k => {
          const lit = (phase === "green" && k === "green") || (phase === "yellow" && k === "yellow") || (phase === "red" && k === "red");
          h.lamps[k].material = lit ? on[k] : off[k];
        });
      });
    }

    // ----- pedestrian crossings: three flat stripes across each road, on all four approaches -----
    const stripeSrc = B.MeshBuilder.CreateBox("zebra_src", { width: 1, height: .002, depth: 1 }, scene);
    stripeSrc.material = mat("#f2f2f2"); stripeSrc.isVisible = false;
    RR.forEach(x => RR.forEach(z => {
      [[0, 9.5], [0, -9.5], [9.5, 0], [-9.5, 0]].forEach(d => {
        const cx = x + d[0], cz = z + d[1];
        for (let k = -1; k <= 1; k++) {
          const s = stripeSrc.createInstance("zebra");
          if (d[0] === 0) { s.scaling.set(6.4, 1, .8); s.position.set(cx, .012, cz + k * 1.6); }
          else { s.scaling.set(.8, 1, 6.4); s.position.set(cx + k * 1.6, .012, cz); }
          s.isPickable = false; s.checkCollisions = false;
        }
      });
    }));

    // ----- run the signals -----
    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      clock += Math.min(engine.getDeltaTime() / 1000, .05);
      if (++tick % 6 === 0) paintLights(clock);
    });
    paintLights(0);

    window.ACCRA_TRAFFIC = { state: () => state(clock), clock: () => clock, cycle: CYCLE };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).roads = 1;
    console.log("Accra roads ready:", heads.length, "signals");
  } catch (err) { console.error("accra-roads failed:", err); }
})();
