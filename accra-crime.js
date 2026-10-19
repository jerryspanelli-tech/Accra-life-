/* accra-crime.js - wanted level (1 to 5 stars), breakable ATMs, police patrols and chases,
 * contraband checks, raids and arrests. Loaded by accra-life.js. All of this is fictional game play. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api, PLc = window.ACCRA_PLACES || {};
    if (!L) { console.log("accra-crime: life API not ready"); return; }
    const B = BABYLON, { st, cash, pay, earn, note, notify, fade, tp, show, hide, ttl, BS, CLOSE, points } = L;
    const AUD = () => window.ACCRA_AUDIO || {};
    const sfx = n => { const a = AUD(); if (a.sfx) a.sfx(n); };
    const W = { level: 0, calm: 0, arrests: 0, sirenOn: false, shotT: 0, rideT: 0, scanT: 0, raidT: 0 };

    // ---------- wanted HUD ----------
    const hud = document.createElement("div");
    hud.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 46px);z-index:6;background:rgba(28,30,33,.78);border-radius:12px;padding:3px 12px;font:800 17px system-ui;letter-spacing:2px;color:#ff5a5a;display:none;pointer-events:none";
    document.body.appendChild(hud);
    const paintHud = () => { hud.style.display = W.level ? "block" : "none"; hud.textContent = "\u2605".repeat(W.level) + "\u2606".repeat(5 - W.level); hud.style.color = W.level >= 3 && (Date.now() / 400 | 0) % 2 ? "#5aa0ff" : "#ff5a5a"; };
    const setWanted = n => { n = Math.max(0, Math.min(5, n)); if (n > W.level) notify("Wanted level " + n + " \u2605", "msg"); W.level = n; W.calm = 0; paintHud(); };
    const raise = (n, why) => { const was = W.level; setWanted(W.level + n); if (why && W.level > was) note("\u2605 " + why); };
    const hasContraband = () => Object.keys(st.inv || {}).some(k => st.inv[k] > 0);

    // ---------- police officers ----------
    const A = window.AccraAssets, cops = [], gridPts = [];
    R.forEach(x => R.forEach(z => gridPts.push([x + 6, z + 6])));
    const mkCop = (x, z) => {
      const c = A.createCharacter(scene, { police: true, shirt: "#1d3b6b", pants: "#14213d", skin: "#6b4028", hair: "#0d0d0d", kente: false, scale: .9 });
      const cap = B.MeshBuilder.CreateBox("cap", { width: .6, height: .14, depth: .62 }, scene); cap.parent = c.root; cap.position.set(0, 2.18, 0); cap.material = mat("#14213d"); cap.isPickable = false;
      c.root.position.set(x, 0, z);
      return { c, root: c.root, state: "patrol", target: gridPts[Math.floor(Math.random() * gridPts.length)], hold: 0, scan: 0 };
    };
    const start = PLc.pd ? [PLc.pd.ox, PLc.pd.oz] : [35, 84];
    for (let i = 0; i < 4; i++) cops.push(mkCop(start[0] + (Math.random() - .5) * 30, start[1] + (Math.random() - .5) * 8));
    const copDist = (cp, p) => Math.hypot(cp.root.position.x - p.x, cp.root.position.z - p.z);
    const nearestCop = p => cops.reduce((b, c) => Math.min(b, copDist(c, p)), 1e9);
    const face = (cp, tx, tz) => { cp.root.rotation.y = Math.atan2(tx - cp.root.position.x, tz - cp.root.position.z); };

    // ---------- arrest ----------
    function arrest(why) {
      if (L.busy) return;
      L.busy = true; W.arrests++;
      note("\uD83D\uDE94 BUSTED! " + why); sfx("siren-stop");
      const fine = Math.min(cash(), 50 + 100 * Math.max(1, W.level));
      const found = Object.keys(st.inv || {}).filter(k => st.inv[k] > 0).map(k => k + " \u00D7 " + st.inv[k]);
      fade(2200, () => {
        if (L.seated) L.stand(); if (L.inside) L.leaveHome();
        if (fine) pay(fine, "Police fine");
        st.inv = {}; window.playerInventory.items = st.inv; L.vitals({ md: -15 });
        W.level = 0; paintHud();
        const d = PLc.pd ? { x: PLc.pd.ox, z: PLc.pd.oz } : { x: 35, z: 84 }; tp(d.x, d.z);
        cops.forEach(c => { c.state = "patrol"; });
      }, () => { L.busy = false; note("Released. Fine " + "GH\u00A2" + fine + (found.length ? ". Confiscated: " + found.join(", ") : ".")); notify("You were arrested: " + why + " Fine GH\u20B5" + fine + ".", "msg"); });
    }

    // ---------- main loop ----------
    let t = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .1), p = L.driving ? car.position : player.position;
      let chasing = 0, minD = 1e9;
      cops.forEach(cp => {
        const d = copDist(cp, p); minD = Math.min(minD, d);
        const sees = d < 40;
        if (cp.state === "patrol") {
          if (W.level >= 1 && sees) cp.state = "chase";
          else if (hasContraband() && d < 9 && !L.inside) {            // stop and search
            cp.scan += dt; if (cp.scan > 3.5) { cp.scan = 0; if (Math.random() < .55) { raise(2, "Officer found illegal items on you!"); cp.state = "chase"; } else note("\uD83D\uDE93 Officer looks you over..."); }
          }
          const tg = cp.target; const dx = tg[0] - cp.root.position.x, dz = tg[1] - cp.root.position.z, dd = Math.hypot(dx, dz);
          if (cp.hold > 0) { cp.hold -= dt; cp.c.setMoving(false); }
          else if (dd < 1.2) { cp.hold = 2 + Math.random() * 3; const nb = gridPts.filter(q => { const k = Math.hypot(q[0] - tg[0], q[1] - tg[1]); return k > 1 && k < 100; }); cp.target = nb[Math.floor(Math.random() * nb.length)] || tg; }
          else { cp.root.position.x += dx / dd * 2 * dt; cp.root.position.z += dz / dd * 2 * dt; face(cp, tg[0], tg[1]); cp.c.setMoving(true); }
        } else if (cp.state === "chase") {
          chasing++;
          if (W.level < 1 && !hasContraband()) { cp.state = "patrol"; return; }
          const sp = 3.4 + W.level * .9, dx = p.x - cp.root.position.x, dz = p.z - cp.root.position.z, dd = Math.hypot(dx, dz);
          if (dd > 90 && W.level < 3) { cp.state = "patrol"; return; }
          if (dd > 1.6) { cp.root.position.x += dx / dd * sp * dt; cp.root.position.z += dz / dd * sp * dt; face(cp, p.x, p.z); cp.c.setMoving(true); }
          else {
            cp.c.setMoving(false); cp.hold += dt;
            if (cp.hold > .9) { cp.hold = 0; if (W.level >= 2 || hasContraband()) arrest(W.level >= 2 ? "Wanted by police." : "Possession of illegal items."); else { W.level = 0; paintHud(); note("Officer warns you and lets you go."); cp.state = "patrol"; } }
          }
        }
      });
      // roadblock: if you are in a car and a chasing officer is close and you slow down
      if (L.driving && chasing && minD < 8 && W.level >= 2) { W.rideT += dt; if (W.rideT > 1.5) { W.rideT = 0; arrest("Stopped at a police roadblock."); } } else W.rideT = 0;
      // raids: hiding at home while at 3+ stars
      if (L.inside && W.level >= 3) { W.raidT += dt; if (W.raidT > 14) { W.raidT = 0; note("\uD83D\uDE94 Police raid!"); sfx("siren"); arrest("Police raided your home."); } } else W.raidT = 0;
      // backup and warning shots at high wanted levels
      if (W.level >= 4 && chasing && minD < 50) { W.shotT += dt; if (W.shotT > 6) { W.shotT = 0; sfx("gunshot"); note("Warning shots!"); } }
      // sirens
      const wantSiren = W.level >= 2 && minD < 70; if (wantSiren !== W.sirenOn) { W.sirenOn = wantSiren; sfx(wantSiren ? "siren" : "siren-stop"); }
      // wanted level cools down when no officer is watching
      if (W.level > 0) { W.calm += (minD > 45 ? 1 : 0) * dt * (L.inside ? 2 : 1); if (W.calm > 25) { W.calm = 0; setWanted(W.level - 1); } }
      if (++t % 15 === 0) paintHud();
    });

    // ---------- ATMs ----------
    const ATMS = [[-6.9, -30, Math.PI / 2], [6.9, 78, -Math.PI / 2], [63.1, -30, Math.PI / 2], [76.9, 100, -Math.PI / 2], [-63.1, 60, -Math.PI / 2], [-76.9, -30, Math.PI / 2],
      [-30, 6.9, Math.PI], [30, -6.9, 0], [44, 15.6, Math.PI], [-120, -52.5, Math.PI]];
    const scr = new B.StandardMaterial("atmscr", scene); scr.emissiveColor = B.Color3.FromHexString("#47d7ff"); scr.disableLighting = true;
    const dark = new B.StandardMaterial("atmdark", scene); dark.diffuseColor = B.Color3.FromHexString("#0a0a0a");
    const atms = ATMS.map(a => {
      const body = box(.95, 1.9, .6, a[0], .95, a[1], "#1d3b6b"); body.rotation.y = a[2];
      const f = [Math.sin(a[2]), Math.cos(a[2])];
      const screen = B.MeshBuilder.CreateBox("atms", { width: .6, height: .4, depth: .05 }, scene); screen.position.set(a[0] + f[0] * .31, 1.45, a[1] + f[1] * .31); screen.rotation.y = a[2]; screen.material = scr; screen.isPickable = false;
      const pad = box(.5, .12, .08, a[0] + f[0] * .31, 1.0, a[1] + f[1] * .31, "#9aa3ad", false); pad.rotation.y = a[2];
      const top = box(1.05, .22, .66, a[0], 1.95, a[1], "#c9a54a", false); top.rotation.y = a[2];
      return { x: a[0] + f[0] * 1, z: a[1] + f[1] * 1, screen, broken: 0 };
    });
    const brokenNow = a => a.broken > st.play;
    scene.onBeforeRenderObservable.add(() => { atms.forEach(a => { const b = brokenNow(a); a.screen.material = b ? dark : scr; }); });
    function atmMenu(a) {
      const S = window.ACCRA_STATE;
      const draw = () => show(ttl("\uD83D\uDCB3 ATM") + "<small>Cash GH\u00A2" + cash() + " \u00B7 savings GH\u00A2" + (S ? S.sav : 0) + "</small>" +
        (brokenNow(a) ? '<div style="padding:8px 0">This ATM is out of order.</div>' : '<button data-w="50" style="' + BS + '">Withdraw GH\u00A250 from savings</button><button data-w="100" style="' + BS + '">Withdraw GH\u00A2100 from savings</button><button data-b="1" style="' + BS + ';background:#5a1f1f">\uD83D\uDD28 Break into ATM (crime)</button>') + CLOSE, d => {
        if (d.x) return hide();
        if (d.w) { const n = +d.w; if (!S || S.sav < n) return note("Not enough in your savings."); S.sav -= n; window.ACCRA_ADD(n, "ATM withdrawal"); note("Withdrew GH\u00A2" + n); draw(); }
        else if (d.b) {
          hide(); L.busy = true; note("Smashing the ATM\u2026"); let hits = 0, iv = null;
          iv = setInterval(() => { sfx("clang"); if (++hits >= 6) { clearInterval(iv); L.busy = false; loot(a); } }, 650);
        }
      });
      draw();
    }
    function loot(a) {
      const seen = nearestCop(player.position) < 25, g = 200 + Math.floor(Math.random() * 401);
      earn(g, "ATM robbery"); a.broken = st.play + 480; note("\uD83D\uDCB0 You grabbed GH\u00A2" + g + "!");
      sfx("alarm"); raise(seen ? 3 : 2, seen ? "An officer saw you!" : "Alarm triggered! Police are coming.");
      cops.forEach(c => { if (copDist(c, a) < 90 && c.state === "patrol") c.target = [a.x, a.z]; });   // nearby patrols head to the scene
    }
    atms.forEach(a => points.push({ x: a.x, z: a.z, r: 2.3, t: () => brokenNow(a) ? "\uD83D\uDCB3 ATM (broken)" : "\uD83D\uDCB3 ATM", ok: () => !L.busy && !L.seated && !L.driving, f: () => atmMenu(a) }));

    window.ACCRA_CRIME = { get wanted() { return W.level; }, setWanted, raise, get arrests() { return W.arrests; }, nearestCop: p => nearestCop(p), report: (kind) => { if (kind === "assault") raise(1, "Assault reported."); } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).crime = 1;
    console.log("Accra crime ready: " + atms.length + " ATMs, " + cops.length + " officers");
  } catch (err) { console.error("accra-crime failed:", err); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("\u26A0 Crime: " + err.message); }
})();
