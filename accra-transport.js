/* accra-transport.js - city trotros and a bus on a loop round the city avenues.
 * Trotros are white minibuses with green and gold stripes, a roof rack, a sliding door and a destination board.
 * Stand at a trotro stop where one is waiting, choose where to get off, pay the fare, and ride.
 * The module waits for the game's life system to load, so it works whatever order the scripts load in. */
(function () {
  const start = () => {
    try {
      const B = BABYLON, L = window.ACCRA_LIFE.api;
      if (!window.AccraAssets || !window.AccraAssets.createCar) return false;

      // the loop round the city: the four avenues at x and z = -150 and 150
      const CORNERS = [{ x: -150, z: -150 }, { x: 150, z: -150 }, { x: 150, z: 150 }, { x: -150, z: 150 }];
      const TOTAL = 1200, SEG = 300, SPEED = 9, DWELL = 8, LANE = 2.4, CURB = 6;
      const at = d => {
        const dd = ((d % TOTAL) + TOTAL) % TOTAL, s = Math.floor(dd / SEG), t = (dd - s * SEG) / SEG;
        const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
        return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, fx: (b.x - a.x) / SEG, fz: (b.z - a.z) / SEG };
      };
      const beside = (p, off) => ({ x: p.x + p.fz * off, z: p.z - p.fx * off });   // kerb side of the road

      // stops in order round the loop (distance along the loop)
      const STOPS = [
        { n: "Circle", d: 50 }, { n: "Makola", d: 250 }, { n: "Osu", d: 350 }, { n: "Labadi", d: 650 }, { n: "Central", d: 950 }
      ];
      const fare = (i, j) => 2 + ((j - i + STOPS.length) % STOPS.length);      // GH¢ 2 to 6 by distance round the loop

      const GH = { red: "#c8102e", gold: "#fcd116", green: "#006b3f", white: "#f4f4f0" };

      // a flat texture for a board: text on the Ghana colours
      const board = (w, h, lines, name) => {
        const dt = new B.DynamicTexture("tr_" + name, { width: 512, height: 256 }, scene, false), c = dt.getContext();
        c.fillStyle = GH.green; c.fillRect(0, 0, 512, 256); c.fillStyle = GH.gold; c.fillRect(0, 0, 512, 22); c.fillRect(0, 234, 512, 22);
        c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
        lines.forEach(l => { c.font = "bold " + l[1] + "px system-ui"; c.fillText(l[0], 256, l[2], 490); });
        dt.update();
        const m = new B.StandardMaterial("tr_m_" + name, scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
        const p = B.MeshBuilder.CreatePlane("tr_p_" + name, { width: w, height: h }, scene); p.material = m; p.isPickable = false; return p;
      };

      // stop signs: a pole and a board, like the trotro stops in Accra
      STOPS.forEach((s, i) => {
        const p = beside(at(s.d), CURB);
        const pole = B.MeshBuilder.CreateCylinder("tr_pole" + i, { diameter: .16, height: 3.2, tessellation: 6 }, scene);
        pole.position.set(p.x, 1.6, p.z); pole.material = new B.StandardMaterial("tr_poleM" + i, scene); pole.material.diffuseColor = B.Color3.FromHexString("#6b7178"); pole.isPickable = false;
        const sb = board(4, 1.8, [["TROTRO STOP", 46, 60], [s.n.toUpperCase(), 62, 150]], "stop" + i);
        sb.position.set(p.x, 3.5, p.z); sb.rotation.y = Math.atan2(-p.fz, p.fx) + Math.PI / 2;
        s.p = p;
      });

      // the vehicles: built from the game's car builder, then given trotro details
      const VEH = [];
      const SPECS = [
        { start: 0,   body: GH.white, stripe: GH.green, bus: false },
        { start: 300, body: GH.gold,  stripe: GH.green, bus: false },
        { start: 600, body: GH.white, stripe: GH.gold,  bus: true },
        { start: 900, body: GH.green, stripe: GH.gold,  bus: false }
      ];
      SPECS.forEach((sp, k) => {
        const root = new B.TransformNode("trotro_" + k, scene);
        const car = window.AccraAssets.createCar(scene, "trotro", { color: sp.body, stripe: sp.stripe });
        car.parent = root;
        if (sp.bus) root.scaling.setAll(1.25);
        // roof rack and luggage on top, as on real trotros
        const rack = B.MeshBuilder.CreateBox("rack", { width: 3.6, height: .12, depth: 1.8 }, scene);
        rack.parent = root; rack.position.set(0, 2.2, 0); rack.material = new B.StandardMaterial("rackM", scene); rack.material.diffuseColor = B.Color3.FromHexString("#2b2f36");
        // destination board on the front, and a Ghana flag on each side
        const dest = board(1.8, .7, [["ACCRA", 36, 92], ["CIRCLE LOOP", 30, 170]], "dest" + k);
        dest.parent = root; dest.position.set(2.5, 2.0, 0); dest.rotation.y = Math.PI / 2;
        [-1, 1].forEach(side => {
          const f = board(1.1, .7, [["", 10, 128]], "flag" + k + side);
          f.parent = root; f.position.set(.2, 1.7, side * 1.2); f.rotation.y = side > 0 ? 0 : Math.PI;
        });
        root.getChildMeshes().forEach(m => { m.checkCollisions = false; m.isPickable = false; });
        VEH.push({ node: root, d: sp.start, dwell: 0, atStop: -1, lastStop: -1 });
      });

      // the trip: vehicles keep moving, stop at each stop for a moment, and go on
      let ride = null;
      scene.onBeforeRenderObservable.add(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, .05);
        VEH.forEach(v => {
          if (v.dwell > 0) { v.dwell -= dt; if (v.dwell <= 0) { v.dwell = 0; v.atStop = -1; } }
          else v.d += SPEED * dt;
          STOPS.forEach((s, i) => {
            const gap = ((s.d - v.d) % TOTAL + TOTAL) % TOTAL;
            if (gap < 1.5 && v.lastStop !== i && v.dwell === 0) { v.lastStop = i; v.atStop = i; v.dwell = DWELL; }
            if (gap > 20 && v.lastStop === i) v.lastStop = -1;
          });
          const p = at(v.d), q = beside(p, LANE);
          v.node.position.set(q.x, 0, q.z);
          v.node.rotation.y = Math.atan2(-p.fz, p.fx);
        });
        // a passenger rides with the trotro and gets off at the chosen stop
        if (ride) {
          const v = ride.veh;
          if (v.atStop === ride.to) {
            const s = STOPS[ride.to];
            player.setEnabled(true);
            player.position.set(s.p.x, .91, s.p.z);
            L.note("You got off at " + s.n + ".");
            ride = null;
          } else {
            player.setEnabled(false);
            player.position.set(v.node.position.x, v.node.position.y + .91, v.node.position.z);
          }
        }
      });

      // boarding: stand at a stop where a trotro is waiting
      function boardMenu(i) {
        if (ride) return L.note("You are already on a trotro.");
        const waiting = VEH.find(v => v.atStop === i);
        if (!waiting) return L.note("No trotro at " + STOPS[i].n + " right now. Wait for the next one.");
        const rows = STOPS.map((s, j) => j).filter(j => j !== i).map(j =>
          '<button data-j="' + j + '" style="' + L.BS + '">' + STOPS[j].n + " \u00B7 GH\u00A2" + fare(i, j) + "</button>").join("");
        L.show(L.ttl("\uD83D\uDE8C Trotro from " + STOPS[i].n) + "<small>Cash GH\u00A2" + L.cash() + ". Where do you want to get off?</small>" + rows + L.CLOSE, d => {
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
      console.log("City transport ready:", VEH.length, "trotros,", STOPS.length, "stops");
      return true;
    } catch (err) { console.error("accra-transport failed:", err); return true; }
  };
  // wait until the game's life system is loaded, then start (it loads after this file)
  const timer = setInterval(() => {
    if (window.ACCRA_LIFE && window.ACCRA_LIFE.api && window.AccraAssets && window.AccraAssets.createCar) {
      if (start()) clearInterval(timer);
    }
  }, 400);
})();
