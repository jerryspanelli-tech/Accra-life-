/* accra-transport.js - city transport: Ghanaian trotros and buses (red, gold and green) on a loop round the city.
 * Stops have signs in the Ghana colours. Stand at a stop where a vehicle is waiting, choose where to go, pay the
 * fare, and ride. You get off at your stop. The vehicles stop at every stop and carry passengers.
 * Uses the game's own money and messages (window.ACCRA_LIFE.api). The vehicles have no collisions, so they never block you. */
(function () {
  try {
    const B = BABYLON;
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
    if (!L || !window.AccraAssets || !window.AccraAssets.createCar) { console.log("accra-transport: waiting for the game"); return; }

    // the loop round the city: the four avenues at x and z = -150 and 150 (1200 m in all)
    const CORNERS = [{ x: -150, z: -150 }, { x: 150, z: -150 }, { x: 150, z: 150 }, { x: -150, z: 150 }];
    const TOTAL = 1200, SEG = 300, SPEED = 8, DWELL = 7, LANE = 2.2, CURB = 6;
    const at = d => {
      const dd = ((d % TOTAL) + TOTAL) % TOTAL, s = Math.floor(dd / SEG), t = (dd - s * SEG) / SEG;
      const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, fx: (b.x - a.x) / SEG, fz: (b.z - a.z) / SEG };
    };
    const beside = (p, off) => ({ x: p.x + p.fz * off, z: p.z - p.fx * off });   // right-hand side of the road

    // the stops, in order round the loop
    const STOPS = [
      { n: "Circle", d: 50 }, { n: "Makola", d: 250 }, { n: "Osu", d: 350 }, { n: "Labadi", d: 650 }, { n: "Central", d: 950 }
    ];
    const fare = (i, j) => 2 + ((j - i + STOPS.length) % STOPS.length);

    // Ghana colours: red, gold and green, used for the signs, the flags and the vehicles
    const GH = { red: "#c8102e", gold: "#fcd116", green: "#006b3f" };
    const flagTex = (() => {
      const dt = new B.DynamicTexture("tr_flag", { width: 256, height: 170 }, scene, false), c = dt.getContext();
      c.fillStyle = GH.red; c.fillRect(0, 0, 256, 57); c.fillStyle = GH.gold; c.fillRect(0, 57, 256, 56); c.fillStyle = GH.green; c.fillRect(0, 113, 256, 57);
      c.fillStyle = "#000"; c.beginPath(); c.arc(128, 85, 16, 0, Math.PI * 2); c.fill(); dt.update(); return dt;
    })();
    const flagMat = new B.StandardMaterial("tr_flagM", scene); flagMat.diffuseTexture = flagTex; flagMat.emissiveTexture = flagTex; flagMat.disableLighting = true; flagMat.backFaceCulling = false;

    // stop signs: a pole and a board in the Ghana colours with the stop's name
    const signTex = name => {
      const dt = new B.DynamicTexture("tr_sign_" + name, { width: 512, height: 200 }, scene, false), c = dt.getContext();
      c.fillStyle = GH.red; c.fillRect(0, 0, 512, 60); c.fillStyle = GH.gold; c.fillRect(0, 60, 512, 80); c.fillStyle = GH.green; c.fillRect(0, 140, 512, 60);
      c.fillStyle = "#17191c"; c.font = "bold 58px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("TROTRO " + name.toUpperCase(), 256, 100, 480); dt.update();
      const m = new B.StandardMaterial("tr_signM_" + name, scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; return m;
    };
    STOPS.forEach((s, i) => {
      const p = beside(at(s.d), CURB);
      const pole = B.MeshBuilder.CreateCylinder("tr_pole" + i, { diameter: .18, height: 3.2, tessellation: 6 }, scene);
      pole.position.set(p.x, 1.6, p.z); pole.material = new B.StandardMaterial("tr_poleM", scene); pole.material.diffuseColor = B.Color3.FromHexString("#6b7178"); pole.checkCollisions = false;
      const board = B.MeshBuilder.CreatePlane("tr_board" + i, { width: 4, height: 1.6 }, scene);
      board.position.set(p.x, 3.4, p.z); board.rotation.y = Math.atan2(-p.fz, p.fx) + Math.PI / 2; board.material = signTex(s.n); board.isPickable = false;
      s.p = p;
    });

    // the vehicles: four in total, mostly trotros, one bus; all in the Ghana colours
    const VEH = [];
    const SPECS = [
      { start: 0, color: GH.gold, stripe: GH.red, scale: 1, name: "trotro" },
      { start: 300, color: GH.green, stripe: GH.gold, scale: 1, name: "trotro" },
      { start: 600, color: GH.gold, stripe: GH.green, scale: 1, name: "bus" },
      { start: 900, color: GH.red, stripe: GH.gold, scale: 1, name: "trotro" }
    ];
    SPECS.forEach(sp => {
      const node = window.AccraAssets.createCar(scene, "trotro", { color: sp.color, stripe: sp.stripe });
      node.getChildMeshes().forEach(m => { m.checkCollisions = false; m.isPickable = false; });
      if (sp.name === "bus") node.scaling.setAll(1.2);
      [-1, 1].forEach(side => {                                  // a Ghana flag on each side
        const f = B.MeshBuilder.CreatePlane("tr_flagP", { width: 1.2, height: .8 }, scene);
        f.parent = node; f.position.set(.2, 1.6, side * 1.12); f.rotation.y = side > 0 ? 0 : Math.PI; f.material = flagMat; f.isPickable = false;
      });
      VEH.push({ node, d: sp.start, dwell: 0, atStop: -1, lastStop: -1 });
    });

    // ----- the trip: the vehicles move, stop at each stop, and carry the passenger -----
    let ride = null;                                             // { veh, to, from }
    let lastT = performance.now();
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      VEH.forEach(v => {
        if (v.dwell > 0) { v.dwell -= dt; if (v.dwell <= 0) { v.dwell = 0; v.atStop = -1; } }
        else v.d += SPEED * dt;
        STOPS.forEach((s, i) => {
          const gap = ((s.d - v.d) % TOTAL + TOTAL) % TOTAL;
          if (gap < 1.2 && v.lastStop !== i && v.dwell === 0) { v.lastStop = i; v.atStop = i; v.dwell = DWELL; }
          if (gap > 20) { if (v.lastStop === i) v.lastStop = -1; }
        });
        const p = at(v.d), q = beside(p, LANE);
        v.node.position.set(q.x, 0, q.z);
        v.node.rotation.y = Math.atan2(-p.fz, p.fx);
      });
      // a passenger on a vehicle stays with it, and gets off at their stop
      if (ride) {
        const v = ride.veh;
        player.setEnabled(false);
        player.position.set(v.node.position.x, v.node.position.y + .91, v.node.position.z);
        if (v.atStop === ride.to) {
          const s = STOPS[ride.to];
          player.setEnabled(true);
          player.position.set(s.p.x, .91, s.p.z);
          L.note("You got off at " + s.n + ".");
          ride = null;
        }
      }
    });

    // ----- boarding at a stop -----
    function boardMenu(i) {
      if (ride) return L.note("You are already on a trotro.");
      const waiting = VEH.find(v => v.atStop === i);
      if (!waiting) return L.note("No trotro at " + STOPS[i].n + " right now. Wait for the next one.");
      const rows = STOPS.map((s, j) => j).filter(j => j !== i).map(j =>
        '<button data-j="' + j + '" style="' + L.BS + '">' + STOPS[j].n + " \u00B7 GH\u00A2" + fare(i, j) + "</button>").join("");
      L.show(L.ttl("\uD83D\uDE8C Trotro from " + STOPS[i].n) + "<small>Cash GH\u00A2" + L.cash() + ". Pick where you want to get off.</small>" + rows + L.CLOSE, d => {
        if (d.x) return L.hide();
        const j = Number(d.j), f = fare(i, j);
        if (L.cash() < f) return L.note("Not enough cash for the fare (GH\u00A2" + f + ").");
        L.hide();
        L.pay(f, "Trotro to " + STOPS[j].n);
        ride = { veh: waiting, from: i, to: j };
        L.note("On the trotro to " + STOPS[j].n + " \u00B7 fare GH\u00A2" + f + ".");
      });
    }
    STOPS.forEach((s, i) => L.points.push({
      x: s.p.x, z: s.p.z, r: 6, t: "\uD83D\uDE8C Trotro stop: " + s.n,
      ok: () => !L.busy && !L.seated && !L.driving, f: () => boardMenu(i)
    }));

    window.ACCRA_TRANSPORT = { stops: STOPS.map(s => s.n), vehicles: VEH.length, riding: () => !!ride };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).transport = 1;
    console.log("City transport ready:", VEH.length, "vehicles,", STOPS.length, "stops");
  } catch (err) { console.error("accra-transport failed:", err); }
})();
