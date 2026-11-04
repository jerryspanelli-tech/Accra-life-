/* accra-fx.js - sound triggers (footsteps, car engine, sirens via crime), emotes, sector culling, camera pinch lock.
 * Loaded by accra-life.js. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
    if (!L) { console.log("accra-fx: life API not ready"); return; }
    const { note, show, hide, ttl, BS, CLOSE, AV } = L;
    const AUD = () => window.ACCRA_AUDIO || {};

    // ---------- audio unlock: browsers only allow sound after a tap ----------
    const unlock = () => { const a = AUD(); if (a.unlock) a.unlock(); };
    ["pointerdown", "touchstart", "keydown"].forEach(t => document.addEventListener(t, unlock, { passive: true }));

    // ---------- camera: no accidental pinch zoom, zoom range kept sensible ----------
    try { cam.pinchPrecision = 1e6; cam.panningSensibility = 0; cam.wheelPrecision = 30; cam.lowerRadiusLimit = 4; cam.upperRadiusLimit = 16;
      if (cam.inputs && cam.inputs.attached && cam.inputs.attached.pointers) cam.inputs.attached.pointers.multiTouchPanAndZoom = false; } catch (e) {}

    // ---------- footsteps and engine ----------
    let lx = player.position.x, lz = player.position.z, cx = car.position.x, cz = car.position.z, stepT = 0, engT = 0, wasEng = false;
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.max(engine.getDeltaTime() / 1000, .001), a = AUD();
      const ps = Math.hypot(player.position.x - lx, player.position.z - lz) / dt, cs = Math.hypot(car.position.x - cx, car.position.z - cz) / dt;
      lx = player.position.x; lz = player.position.z; cx = car.position.x; cz = car.position.z;
      if (!L.driving && !L.seated && !L.busy && ps > 1.2 && ps < 40 && !(AV.pose && AV.pose !== "sit")) {
        stepT -= dt; if (stepT <= 0) { stepT = ps > 9 ? .24 : .36; if (a.sfx) a.sfx(window.ACCRA_WATER && window.ACCRA_WATER.contains(player.position) ? "splash" : "step"); }
      }
      if (L.driving) { engT -= dt; if (engT <= 0) { engT = .12; if (a.engine) a.engine(true, Math.min(cs, 40)); wasEng = true; } }
      else if (wasEng) { wasEng = false; if (a.engine) a.engine(false, 0); }
    });

    // ---------- emotes ----------
    const EM = { wave: ["\uD83D\uDC4B Wave", 3.5, null], clap: ["\uD83D\uDC4F Clap", 4, "clap"], cheer: ["\uD83C\uDF89 Cheer", 3.5, "cheer"], handsup: ["\uD83D\uDE4C Hands up", 4, null], punch: ["\uD83E\uDD4A Fight stance", 4, "punch"] };
    let emT = 0, emPose = null, emSnd = 0, ex = player.position.x, ez = player.position.z;
    function startEmote(k) {
      hide(); if (L.busy || L.seated || L.driving) return note("You cannot do that right now.");
      emPose = k; emT = EM[k][1]; AV.pose = k; emSnd = 0;
    }
    function dance() { const d = player.position; L.sit(d.x, d.z, player.rotation.y, 0, 1); AV.pose = "dance"; note("Dancing \u2014 tap Stand up when done"); }
    const eb = document.createElement("button"); eb.textContent = "\uD83D\uDE00"; eb.setAttribute("aria-label", "Emotes");
    eb.style.cssText = "position:fixed;right:calc(env(safe-area-inset-right,0px) + 26px);bottom:calc(env(safe-area-inset-bottom,0px) + 154px);width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(28,30,33,.55);color:#fff;font-size:22px;z-index:6;touch-action:none;padding:0";
    document.body.appendChild(eb);
    eb.addEventListener("click", e => {
      e.stopPropagation();
      show(ttl("\uD83D\uDE00 Emotes") + Object.keys(EM).map(k => '<button data-e="' + k + '" style="' + BS + '">' + EM[k][0] + "</button>").join("") + '<button data-e="dance" style="' + BS + '">\uD83D\uDC83 Dance</button>' + CLOSE, d => { if (d.x) return hide(); if (d.e === "dance") { hide(); dance(); } else startEmote(d.e); });
    });
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .1), moved = Math.hypot(player.position.x - ex, player.position.z - ez); ex = player.position.x; ez = player.position.z;
      if (!emPose) return;
      if (AV.pose !== emPose || moved > .06) { if (AV.pose === emPose) AV.pose = null; emPose = null; return; }   // moving cancels the emote
      emT -= dt; if (emT <= 0) { AV.pose = null; emPose = null; return; }
      const snd = EM[emPose][2]; emSnd -= dt;
      if (snd && emSnd <= 0) { emSnd = snd === "punch" ? .55 : .5; const a = AUD(); if (a.sfx) a.sfx(snd);
        const C = window.ACCRA_CRIME; if (snd === "punch" && C && C.nearestCop && C.nearestCop(player.position) < 20 && Math.random() < .3) C.report("assault"); }
    });

    // ---------- sector culling: hide meshes far from the PLAYER. Centre = camT (never the old camera target) ----------
    window.ACCRA_CULL = window.ACCRA_CULL || { on: true };
    const RADIUS = 170, SKIP = /^(ground|road|sea|beach|cloud|cl$|bc$|mallbeam|dr$|player|ct$)/;
    let idx = 0, lcx = 1e9, lcz = 1e9, wasIn = false;
    const centre = () => (typeof camT !== "undefined" && camT ? camT.position : player.position);
    function cullSome(count, off) {
      const ms = scene.meshes, n = ms.length; if (!n) return;
      const t = centre(), r2 = RADIUS * RADIUS;
      for (let k = 0; k < count; k++) {
        if (idx >= n) idx = 0;
        const m = ms[idx++];
        if (!m || m.isDisposed() || SKIP.test(m.name) || m === player || m.parent === car || m.parent === player) continue;
        if (!off) { const bi = m.getBoundingInfo && m.getBoundingInfo(); if (bi && bi.boundingSphere.radiusWorld > 45) continue; }
        const p = m.getAbsolutePosition(), far = !off && ((p.x - t.x) * (p.x - t.x) + (p.z - t.z) * (p.z - t.z) > r2);
        if (far && m.isVisible && !m._cullHid) { m._cullHid = 1; m.isVisible = false; }
        else if (!far && m._cullHid) { m._cullHid = 0; m.isVisible = true; }
      }
    }
    scene.onBeforeRenderObservable.add(() => {
      const t = centre(), jump = Math.hypot(t.x - lcx, t.z - lcz) > 60, nowIn = !!L.inside, entering = nowIn !== wasIn;
      lcx = t.x; lcz = t.z; wasIn = nowIn;
      const C = window.ACCRA_CULL;
      if (!C.on) { if (!C._restored) { cullSome(scene.meshes.length, true); C._restored = true; } return; }
      C._restored = false;
      cullSome(jump || entering ? scene.meshes.length : 450, false);   // a teleport or entering a home refreshes every mesh at once
    });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).fx = 1;
    console.log("Accra fx ready");
  } catch (err) { console.error("accra-fx failed:", err); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("\u26A0 Effects: " + err.message); }
})();
