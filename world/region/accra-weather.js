/* accra-weather.js - automatic weather for every type: sunny, cloudy, rain, thunderstorm, harmattan haze.
 * It changes by itself every 3 to 7 minutes of play and blends over 40 seconds.
 * Each type sets the sky colour, fog, sunlight and rain. Lightning only flashes the sky, and a fault in this
 * module is caught and reported once, so it can never freeze the rest of the game. */
(function () {
  try {
    const B = BABYLON;
    // sky colour, fog distance, sun brightness, sky-light brightness, rain particles per second
    const T = {
      sunny:  { sky: "#8fc7ec", fog: 900, sun: 1.25, sky2: .75, rain: 0 },
      cloudy: { sky: "#9aa6b0", fog: 620, sun: .95,  sky2: .7,  rain: 0 },
      rain:   { sky: "#6b7884", fog: 380, sun: .7,   sky2: .6,  rain: 420 },
      storm:  { sky: "#3f4a55", fog: 240, sun: .5,   sky2: .5,  rain: 650 },
      haze:   { sky: "#c9b48a", fog: 460, sun: .9,   sky2: .8,  rain: 0 }
    };
    const LABEL = { sunny: "Sunny", cloudy: "Cloudy", rain: "Rain", storm: "Thunderstorm", haze: "Harmattan haze" };
    const KEYS = Object.keys(T);
    const W = { now: "sunny", next: "sunny", clock: 0, changeAt: 0, mix: 1, flash: 0, flashAt: 0, warned: false };
    const pick = () => { const o = KEYS.filter(k => k !== W.now); return o[Math.floor(Math.random() * o.length)]; };
    const plan = () => { W.changeAt = W.clock + 180 + Math.random() * 240; W.next = pick(); W.mix = 0; };
    plan();

    // a small white dot texture so the rain particles actually draw
    const dot = new B.DynamicTexture("raindot", { width: 16, height: 16 }, scene, false);
    const dc = dot.getContext(); dc.fillStyle = "rgba(0,0,0,0)"; dc.fillRect(0, 0, 16, 16);
    dc.fillStyle = "#e8f2ff"; dc.fillRect(6, 0, 4, 16); dot.update(); dot.hasAlpha = true;
    const rain = new B.ParticleSystem("rain", 1400, scene);
    rain.particleTexture = dot;
    rain.emitter = new B.Vector3(0, 16, 0);
    rain.minEmitBox = new B.Vector3(-22, 0, -22); rain.maxEmitBox = new B.Vector3(22, 0, 22);
    rain.color1 = new B.Color4(.8, .88, 1, .28); rain.color2 = new B.Color4(.75, .83, .95, .18);
    rain.minScaleX = .18; rain.maxScaleX = .26; rain.minScaleY = 1.6; rain.maxScaleY = 2.4;
    rain.minLifeTime = .7; rain.maxLifeTime = 1.0;
    rain.direction1 = new B.Vector3(-.5, -22, -.5); rain.direction2 = new B.Vector3(.5, -26, .5);
    rain.minEmitPower = 1; rain.maxEmitPower = 2; rain.emitRate = 0; rain.updateSpeed = .02;
    rain.start();

    const lerp = (a, b, m) => a + (b - a) * m;
    const colLerp = (h1, h2, m) => B.Color3.Lerp(B.Color3.FromHexString(h1), B.Color3.FromHexString(h2), m);

    scene.onBeforeRenderObservable.add(() => {
      try {
        const dt = Math.min(engine.getDeltaTime() / 1000, .1);
        W.clock += dt;
        if (W.clock >= W.changeAt) { W.now = W.next; plan(); }
        W.mix = Math.min(1, W.mix + dt / 40);
        const a = T[W.now], b = T[W.next], m = W.mix;
        // sky and fog: fog start is always 40% of the fog end, so the fog never turns the screen grey
        const sky = colLerp(a.sky, b.sky, m);
        const fogEnd = lerp(a.fog, b.fog, m);
        scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
        scene.fogColor = sky;
        scene.fogEnd = fogEnd;
        scene.fogStart = fogEnd * .4;
        // light: sun and sky-light move within a safe range
        if (typeof sun !== "undefined" && sun) sun.intensity = lerp(a.sun, b.sun, m);
        if (typeof hemi !== "undefined" && hemi) hemi.intensity = lerp(a.sky2, b.sky2, m);
        // rain: particles follow the player
        rain.emitRate = lerp(a.rain, b.rain, m);
        rain.emitter.x = player.position.x; rain.emitter.z = player.position.z;
        rain.emitter.y = 16;
        // thunderstorm lightning: a short sky flash, nothing more
        if (W.now === "storm" && W.clock > W.flashAt) { W.flashAt = W.clock + 14 + Math.random() * 18; W.flash = .25; }
        if (W.flash > 0) { W.flash -= dt; const f = Math.max(0, W.flash) / .25; scene.clearColor = new B.Color4(Math.min(1, sky.r + f * .35), Math.min(1, sky.g + f * .35), Math.min(1, sky.b + f * .4), 1); }
        // the road looks darker when it is wet
        const wet = W.now === "rain" || W.now === "storm" || W.next === "rain" || W.next === "storm";
        if (typeof roadM !== "undefined" && roadM && roadM.diffuseColor) roadM.diffuseColor = wet ? new B.Color3(.72, .74, .78) : new B.Color3(1, 1, 1);
      } catch (err) {
        if (!W.warned) { W.warned = true; console.error("weather update error:", err); }
      }
    });

    // the admin panel can pin the weather; "auto" hands control back to the cycle
    window.ACCRA_WEATHER = {
      label: () => LABEL[W.now] || W.now,
      set(name) { if (!T[name]) return; W.now = name; W.next = name; W.mix = 1; W.changeAt = W.clock + 1e9; },
      auto() { W.changeAt = W.clock + 1; }
    };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).weather = 1;
  } catch (err) { console.error("accra-weather failed to start:", err); }
})();
