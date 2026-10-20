/* accra-shaxi.js - order a Shaxi (shared taxi) or a taxi from the phone, like a ride app.
 * You choose a destination and a ride type on the Shaxi app. You pay the fare up front. A yellow taxi drives to
 * where you are on the city roads, you get in, it drives you to the destination, and you get out there.
 * Shaxi is cheaper and slower; a taxi is faster and more expensive. The taxis have no collisions. */
(function () {
  try {
    const B = BABYLON;
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
    if (!L || !window.AccraAssets || !window.AccraAssets.createCar) { console.log("accra-shaxi: waiting for the game"); return; }

    // the city loop (the same as the trotros), and the places you can go to
    const CORNERS = [{ x: -150, z: -150 }, { x: 150, z: -150 }, { x: 150, z: 150 }, { x: -150, z: 150 }];
    const TOTAL = 1200, SEG = 300, LANE = 2.2;
    const at = d => {
      const dd = ((d % TOTAL) + TOTAL) % TOTAL, s = Math.floor(dd / SEG), t = (dd - s * SEG) / SEG;
      const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, fx: (b.x - a.x) / SEG, fz: (b.z - a.z) / SEG };
    };
    const beside = (p, off) => ({ x: p.x + p.fz * off, z: p.z - p.fx * off });
    const forward = (from, to) => ((to - from) % TOTAL + TOTAL) % TOTAL;   // distance going round the loop
    const DEST = [
      { n: "Circle", d: 50 }, { n: "Makola", d: 250 }, { n: "Osu", d: 350 }, { n: "Labadi", d: 650 }, { n: "Central", d: 950 }
    ];
    const MODES = {
      shaxi: { name: "Shaxi (shared)", base: 2, mult: 1, speed: 8, colour: "#2e7d32" },
      taxi:  { name: "Taxi (private)", base: 4, mult: 1.8, speed: 14, colour: "#fcd116" }
    };

    // the nearest point on the loop to a position, as a distance along the loop
    function nearestD(x, z) {
      let best = 0, bestDist = 1e9;
      for (let s = 0; s < 4; s++) {
        const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
        const vx = b.x - a.x, vz = b.z - a.z, len2 = vx * vx + vz * vz;
        const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / len2));
        const px = a.x + vx * t, pz = a.z + vz * t, dd = Math.hypot(x - px, z - pz);
        if (dd < bestDist) { bestDist = dd; best = s * SEG + t * SEG; }
      }
      return best;
    }
    const fareFor = (mode, from, to) => Math.round((MODES[mode].base + forward(from, to) / 120) * MODES[mode].mult);

    let order = null;   // { mode, car, d, pick, dest, fare, phase }
    let status = "";

    function setStatus(t) { status = t; const el = document.getElementById("rideStatus"); if (el) el.textContent = t; }

    // ----- the phone's Shaxi screen -----
    window.ACCRA_RIDE_HTML = function () {
      const here = nearestD(player.position.x, player.position.z);
      const rows = DEST.map((s, i) => ["shaxi", "taxi"].map(m =>
        '<button data-ride-dest="' + i + '" data-ride-mode="' + m + '" style="display:block;width:100%;margin:6px 0;padding:10px;border:none;border-radius:12px;background:' + MODES[m].colour + ';color:' + (m === "taxi" ? "#17191c" : "#fff") + ';font:700 13px system-ui">' +
        s.n + " \u00B7 " + MODES[m].name + " \u00B7 GH\u00A2" + fareFor(m, here, s.d) + "</button>").join("")).join("");
      return '<div class="cd"><b>Where to?</b><br><small>Pick a destination and a ride. Your pickup is where you are standing.</small></div>' +
        rows + '<div class="cd" id="rideStatus" style="margin-top:8px"><small>' + (status || "No ride on the way.") + "</small></div>";
    };

    // ----- ordering -----
    function order_(mode, destIndex) {
      if (order) return L.note("You already have a ride on the way.");
      const pick = nearestD(player.position.x, player.position.z), dest = DEST[destIndex];
      const fare = fareFor(mode, pick, dest.d);
      if (L.cash() < fare) return L.note("Not enough cash for this ride (GH\u00A2" + fare + ").");
      L.pay(fare, MODES[mode].name + " to " + dest.n);
      const car = window.AccraAssets.createCar(scene, "sedan", { color: MODES[mode].colour });
      car.getChildMeshes().forEach(m => { m.checkCollisions = false; m.isPickable = false; });
      order = { mode, car, d: pick - 300, pick, dest, fare, phase: "toPick" };       // the car starts 300 m behind you
      setStatus(MODES[mode].name + " to " + dest.n + " is on the way. Please wait at your pickup point.");
      L.note(MODES[mode].name + " ordered to " + dest.n + " \u00B7 GH\u00A2" + fare + ". Please wait.");
    }
    document.addEventListener("click", e => {
      const b = e.target && e.target.closest && e.target.closest("[data-ride-dest]");
      if (b) order_(b.dataset.rideMode, Number(b.dataset.rideDest));
    });

    // ----- driving: the taxi comes to you, then takes you to the destination -----
    scene.onBeforeRenderObservable.add(() => {
      if (!order) return;
      const dt = Math.min(engine.getDeltaTime() / 1000, .05), spd = MODES[order.mode].speed;
      const o = order;
      if (o.phase === "toPick") {
        o.d += spd * dt;
        const gap = forward(o.d, o.pick);
        if (gap < 2 || gap > TOTAL - 2) { o.d = o.pick; o.phase = "waiting"; setStatus("Your ride is here. Get in to go to " + o.dest.n + "."); }
        else if (gap < 30) setStatus("Your ride is arriving: " + Math.round(gap) + " m away.");
        const p = at(o.d), q = beside(p, LANE);
        o.car.position.set(q.x, 0, q.z); o.car.rotation.y = Math.atan2(-p.fz, p.fx);
      } else if (o.phase === "waiting") {
        const p = at(o.d), q = beside(p, LANE);
        o.car.position.set(q.x, 0, q.z); o.car.rotation.y = Math.atan2(-p.fz, p.fx);
        // getting in: when you are next to the car, you ride
        const dx = player.position.x - q.x, dz = player.position.z - q.z;
        if (Math.hypot(dx, dz) < 8) { o.phase = "ride"; player.setEnabled(false); setStatus("On the way to " + o.dest.n + "."); }
      } else if (o.phase === "ride") {
        o.d += spd * dt;
        const p = at(o.d), q = beside(p, LANE);
        o.car.position.set(q.x, 0, q.z); o.car.rotation.y = Math.atan2(-p.fz, p.fx);
        player.position.set(q.x, .91, q.z);
        if (forward(o.d, o.dest.d) < 2 || forward(o.d, o.dest.d) > TOTAL - 2) {
          const s = beside(at(o.dest.d), 3.5);
          player.position.set(s.x, .91, s.z); player.setEnabled(true);
          o.car.dispose(); order = null;
          setStatus("You arrived at " + o.dest.n + ". Fare paid: GH\u00A2" + o.fare + ".");
          L.note("Arrived at " + o.dest.n + ".");
        }
      }
    });

    window.ACCRA_SHAXI = { order: () => !!order, destinations: DEST.map(d => d.n) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).shaxi = 1;
    console.log("Shaxi and taxi ordering ready");
  } catch (err) { console.error("accra-shaxi failed:", err); }
})();
