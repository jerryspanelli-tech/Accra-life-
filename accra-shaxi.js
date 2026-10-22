/* accra-shaxi.js - Shaxi, a ride app like Uber, on the phone.
 * 1. Pick a destination and a ride type (Shaxi shared, or Taxi private). The screen shows the price and wait.
 * 2. Confirm the ride. A driver is assigned (name and plate) and the car drives to your pickup point.
 * 3. When the car arrives, get in. The car drives you to the destination and you pay the fare when you arrive.
 * 4. You can cancel before the car reaches you (no charge), or after it arrives (fare kept).
 * The module waits for the game's life system to load, so it works whatever order the scripts load in. */
(function () {
  const start = () => {
    try {
      const B = BABYLON, L = window.ACCRA_LIFE.api;
      if (!window.AccraAssets || !window.AccraAssets.createCar) return false;

      // the city loop (the same as the trotros) and the places you can go to
      const CORNERS = [{ x: -150, z: -150 }, { x: 150, z: -150 }, { x: 150, z: 150 }, { x: -150, z: 150 }];
      const TOTAL = 1200, SEG = 300, LANE = 2.2;
      const at = d => {
        const dd = ((d % TOTAL) + TOTAL) % TOTAL, s = Math.floor(dd / SEG), t = (dd - s * SEG) / SEG;
        const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
        return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, fx: (b.x - a.x) / SEG, fz: (b.z - a.z) / SEG };
      };
      const beside = (p, off) => ({ x: p.x + p.fz * off, z: p.z - p.fx * off });
      const forward = (from, to) => ((to - from) % TOTAL + TOTAL) % TOTAL;
      const DEST = [
        { n: "Circle", d: 50 }, { n: "Makola", d: 250 }, { n: "Osu", d: 350 }, { n: "Labadi", d: 650 }, { n: "Central", d: 950 }
      ];
      const MODES = {
        shaxi: { name: "Shaxi (shared)", base: 2, mult: 1, speed: 8, colour: "#2e7d32", wait: 6 },
        taxi:  { name: "Taxi (private)", base: 4, mult: 1.8, speed: 14, colour: "#fcd116", wait: 3 }
      };
      const DRIVERS = [["Kojo", "GR 4521-22"], ["Ama", "GT 1187-23"], ["Yaw", "AS 9034-21"], ["Efua", "GW 6612-22"], ["Kwesi", "GE 2290-23"]];

      // the nearest point on the loop to a position, as a distance along the loop
      function nearestD(x, z) {
        let best = 0, bestDist = 1e9;
        for (let s = 0; s < 4; s++) {
          const a = CORNERS[s], b = CORNERS[(s + 1) % 4];
          const vx = b.x - a.x, vz = b.z - a.z, len2 = vx * vx + vz * vz;
          const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / len2));
          const dd = Math.hypot(x - (a.x + vx * t), z - (a.z + vz * t));
          if (dd < bestDist) { bestDist = dd; best = s * SEG + t * SEG; }
        }
        return best;
      }
      const fareFor = (mode, from, to) => Math.round((MODES[mode].base + forward(from, to) / 120) * MODES[mode].mult);
      const etaFor = (mode, from) => Math.max(1, Math.round(forward(from, nearestD(player.position.x, player.position.z)) / MODES[mode].speed / 60) + MODES[mode].wait);

      // ride state: pending (choosing), then one active ride
      let pending = null;       // { mode, pick, dest, fare, eta }
      let ride = null;          // { mode, car, d, pick, dest, fare, phase, driver, plate }
      let log = "";

      // the box on the phone is redrawn in place, so it always shows the latest state
      function paint() {
        const box = document.getElementById("rideBox");
        if (!box) return;
        box.innerHTML = body();
      }
      function body() {
        if (ride) {
          const r = ride, m = MODES[r.mode];
          const next = r.phase === "toPick" ? "Your driver is on the way to your pickup point." :
                       r.phase === "waiting" ? "Your driver is here. Get in to go." :
                       "On the way to " + r.dest.n + ".";
          return '<div class="cd"><b>' + m.name + ' \u00B7 ' + r.driver + '</b><br><small>Plate ' + r.plate + " \u00B7 Fare GH\u00A2" + r.fare + "</small>" +
            '<br><small>' + next + "</small></div>" +
            (r.phase === "ride" ? "" : '<button data-ride-cancel="1" style="display:block;width:100%;margin:6px 0;padding:10px;border:none;border-radius:12px;background:#555;color:#fff;font:700 13px system-ui">Cancel ride</button>');
        }
        if (pending) {
          const m = MODES[pending.mode];
          return '<div class="cd"><b>Confirm your ride</b><br><small>Pickup: where you are now</small><br><small>Going to: ' + pending.dest.n + "</small>" +
            "<br><small>" + m.name + " \u00B7 about " + pending.eta + " min wait \u00B7 Fare GH\u00A2" + pending.fare + "</small></div>" +
            '<button data-ride-confirm="1" style="display:block;width:100%;margin:6px 0;padding:12px;border:none;border-radius:12px;background:' + m.colour + ';color:' + (pending.mode === "taxi" ? "#17191c" : "#fff") + ';font:800 14px system-ui">Request ' + m.name + "</button>" +
            '<button data-ride-back="1" style="display:block;width:100%;margin:6px 0;padding:10px;border:none;border-radius:12px;background:#555;color:#fff;font:700 13px system-ui">Back</button>';
        }
        return '<div class="cd"><b>Where to?</b><br><small>Pick a destination and a ride type. Your pickup is where you are standing.</small></div>' +
          DEST.map((s, i) => ["shaxi", "taxi"].map(m =>
            '<button data-ride-pick="' + i + '" data-ride-mode="' + m + '" style="display:block;width:100%;margin:6px 0;padding:10px;border:none;border-radius:12px;background:' + MODES[m].colour + ';color:' + (m === "taxi" ? "#17191c" : "#fff") + ';font:700 13px system-ui">' +
            s.n + " \u00B7 " + MODES[m].name + " \u00B7 GH\u00A2" + fareFor(m, nearestD(player.position.x, player.position.z), s.d) + "</button>").join("")).join("") +
          (log ? '<div class="cd"><small>' + log + "</small></div>" : "");
      }
      window.ACCRA_RIDE_HTML = function () { return '<div id="rideBox">' + body() + "</div>"; };

      function say(t) { log = t; paint(); L.note(t); }

      // ----- the Shaxi screen actions -----
      document.addEventListener("click", e => {
        const t = e.target && e.target.closest && e.target.closest("[data-ride-pick],[data-ride-confirm],[data-ride-cancel],[data-ride-back]");
        if (!t) return;
        const d = t.dataset;
        if (d.ridePick !== undefined) {
          if (ride) return say("You already have a ride on the way.");
          const mode = d.rideMode, pick = nearestD(player.position.x, player.position.z), dest = DEST[+d.ridePick];
          pending = { mode, pick, dest, fare: fareFor(mode, pick, dest.d), eta: etaFor(mode, pick) };
          log = ""; paint();
        } else if (d.rideBack !== undefined) { pending = null; paint(); }
        else if (d.rideConfirm !== undefined && pending) {
          if (L.cash() < pending.fare) return say("Not enough cash for this ride (GH\u00A2" + pending.fare + ").");
          const p = pending; pending = null;
          L.pay(p.fare, MODES[p.mode].name + " to " + p.dest.n);     // you pay when the ride is booked
          if (window.ACCRA_AUDIO) { ACCRA_AUDIO.unlock(); ACCRA_AUDIO.play(p.mode === "taxi" ? "afro" : "highlife", .45); ACCRA_AUDIO.sfx("clink"); }
          const car = window.AccraAssets.createCar(scene, "sedan", { color: MODES[p.mode].colour });
          car.getChildMeshes().forEach(m => { m.checkCollisions = false; m.isPickable = false; });
          const di = Math.floor(Math.random() * DRIVERS.length);
          ride = { mode: p.mode, car, d: p.pick - 300, pick: p.pick, dest: p.dest, fare: p.fare, phase: "toPick", driver: DRIVERS[di][0], plate: DRIVERS[di][1] };
          say(MODES[p.mode].name + " booked. Driver " + ride.driver + " is on the way.");
        } else if (d.rideCancel !== undefined && ride) {
          if (ride.phase === "toPick") { L.pay(-ride.fare, "Refund: cancelled ride"); say("Ride cancelled. Fare refunded."); }
          else if (ride.phase === "waiting") { L.pay(-Math.round(ride.fare / 2), "Refund: cancelled ride"); say("Ride cancelled. Half the fare refunded."); }
          else return say("You are already in the car. The fare is kept.");
          ride.car.dispose(); ride = null; player.setEnabled(true); paint();
          if (window.ACCRA_AUDIO) { ACCRA_AUDIO.stop(); ACCRA_AUDIO.engine(false); }
        }
      });

      // ----- driving: the car comes to you, then takes you to the destination -----
      scene.onBeforeRenderObservable.add(() => {
        if (!ride) return;
        const dt = Math.min(engine.getDeltaTime() / 1000, .05), spd = MODES[ride.mode].speed, r = ride;
        if (r.phase === "toPick") {
          r.d += spd * dt;
          const gap = forward(r.d, r.pick);
          if (gap < 2 || gap > TOTAL - 2) { r.d = r.pick; r.phase = "waiting"; say("Your driver is here. Get in to go to " + r.dest.n + "."); }
          const p = at(r.d), q = beside(p, LANE);
          r.car.position.set(q.x, 0, q.z); r.car.rotation.y = Math.atan2(-p.fz, p.fx);
        } else if (r.phase === "waiting") {
          const p = at(r.d), q = beside(p, LANE);
          r.car.position.set(q.x, 0, q.z); r.car.rotation.y = Math.atan2(-p.fz, p.fx);
          const dx = player.position.x - q.x, dz = player.position.z - q.z;
          if (Math.hypot(dx, dz) < 8) { r.phase = "ride"; player.setEnabled(false); say("On the way to " + r.dest.n + "."); }
        } else if (r.phase === "ride") {
          r.d += spd * dt;
          const p = at(r.d), q = beside(p, LANE);
          r.car.position.set(q.x, 0, q.z); r.car.rotation.y = Math.atan2(-p.fz, p.fx);
          player.position.set(q.x, .91, q.z);
          if (window.ACCRA_AUDIO) ACCRA_AUDIO.engine(true, spd);
          const left = forward(r.d, r.dest.d);
          if (left < 2 || left > TOTAL - 2) {
            const s = beside(at(r.dest.d), 3.5);
            player.position.set(s.x, .91, s.z); player.setEnabled(true);
            r.car.dispose(); ride = null;
            if (window.ACCRA_AUDIO) { ACCRA_AUDIO.engine(false); ACCRA_AUDIO.stop(); ACCRA_AUDIO.sfx("cheer"); }
            say("You arrived at " + r.dest.n + ". Fare paid: GH\u00A2" + r.fare + ".");
          }
        }
      });

      window.ACCRA_SHAXI = { riding: () => !!ride, destinations: DEST.map(d => d.n) };
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).shaxi = 1;
      console.log("Shaxi ordering ready");
      return true;
    } catch (err) { console.error("accra-shaxi failed:", err); return true; }
  };
  const timer = setInterval(() => {
    if (window.ACCRA_LIFE && window.ACCRA_LIFE.api && window.AccraAssets && window.AccraAssets.createCar) {
      if (start()) clearInterval(timer);
    }
  }, 400);
})();
