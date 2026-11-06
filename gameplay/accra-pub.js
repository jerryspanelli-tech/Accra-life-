/* accra-pub.js - The Accra Vibes Pub: bartender, wine & spirits counter, VIP lounge pass, seats, dance floor, music.
 * Loaded by accra-life.js. Uses the life API for GH cedis, vitals, seats and panels. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api, PL = window.ACCRA_PLACES && window.ACCRA_PLACES.pub;
    if (!L || !PL) { console.log("accra-pub: pub or life API not ready"); return; }
    const { st, clamp, cash, pay, note, show, hide, ttl, BS, CLOSE, points, AV, sit } = L;
    const Z = n => "GH\u00A2" + n;
    const sleepy = () => { if (st.drunk > 12) { st.drunk = 6; L.vitals({ hp: -8, en: -15 }); note("You drank too much and felt sick."); } };

    // [name, price, effects]  effects: m = mood, h = hunger, e = energy, d = drunk
    const DRINKS = [["Accra Lager", 12, { m: 8, d: 1, e: -2 }], ["Club Beer", 12, { m: 8, d: 1, e: -2 }], ["Star Beer", 12, { m: 8, d: 1, e: -2 }], ["Stout", 15, { m: 9, d: 1.2, e: -2 }],
      ["Palm wine", 8, { m: 6, d: 1 }], ["Cocktail", 25, { m: 12, d: 1.5 }], ["Sobolo (soft)", 6, { m: 3, h: 5 }], ["Malta (soft)", 8, { e: 6, m: 2 }], ["Bottled water", 4, { m: 1 }]];
    const FOODS = [["Jollof & grilled chicken", 35, { h: 45, m: 6 }], ["Banku & tilapia", 40, { h: 50, m: 6 }], ["Grilled chicken", 30, { h: 35, m: 4 }], ["Fried yam & pepper", 20, { h: 30, m: 3 }], ["Kelewele", 10, { h: 14, m: 3 }]];
    const WINES = [["Red wine, glass", 30, { m: 10, d: 1 }], ["White wine, glass", 28, { m: 10, d: 1 }], ["Red wine, bottle", 120, { m: 26, d: 3.2 }], ["Whisky, shot", 45, { m: 12, d: 2 }], ["Vodka, shot", 40, { m: 11, d: 2 }], ["Cognac, shot", 60, { m: 14, d: 2 }], ["Champagne, bottle", 250, { m: 38, d: 2.6 }]];

    function buy(item) {
      const p = item[1], f = item[2];
      if (cash() < p) return note("Not enough cash. " + item[0] + " costs " + Z(p));
      pay(p, "Pub: " + item[0]);
      L.vitals({ md: f.m || 0, hu: f.h || 0, en: f.e || 0 });
      if (f.d) { st.drunk = (st.drunk || 0) + f.d; sleepy(); }
      note(item[0] + (f.d ? " \u00B7 cheers!" : " \u00B7 enjoy!"));
      if (window.ACCRA_AUDIO && window.ACCRA_AUDIO.sfx) window.ACCRA_AUDIO.sfx("clink");
    }
    function menu(name, sections) {
      const draw = () => {
        let html = ttl(name) + "<small>Cash " + Z(cash()) + (st.drunk > 3 ? " \u00B7 you are tipsy" : "") + "</small>", n = 0;
        sections.forEach(s => { html += '<div style="margin:6px 0 2px;color:#c9a54a;font-weight:700">' + s[0] + "</div>"; s[1].forEach(it => { html += '<button data-i="' + n + '" style="' + BS + '">' + it[0] + " \u00B7 " + Z(it[1]) + "</button>"; n++; }); });
        show(html + CLOSE, d => { if (d.x) return hide(); const all = [].concat(...sections.map(s => s[1])); buy(all[+d.i]); draw(); });
      };
      draw();
    }
    const A = (x, z, r, t, f, ok) => points.push({ x, z, r, t, f, ok: p => !L.busy && !L.seated && (!ok || ok(p)) });

    // ---- bar and wine counter ----
    A(PL.bar.x, PL.bar.z, 3, "\uD83C\uDF7A Bartender", () => menu("The Accra Vibes Pub", [["Drinks", DRINKS], ["Food", FOODS]]));
    if (PL.wine) A(PL.wine.x, PL.wine.z, 2.8, "\uD83C\uDF77 Wine & spirits", () => menu("Wine & Spirits", [["Wine and spirits", WINES]]));

    // ---- seats ----
    (PL.seats || []).forEach(s => A(s.x, s.z, 1.5, "\uD83E\uDE91 Sit", () => sit(s.x, s.z, s.ry, s.sh || .45, 1)));

    // ---- dance floor ----
    if (PL.dance) A(PL.dance.x, PL.dance.z, 3.4, "\uD83D\uDC83 Dance", () => { sit(PL.dance.x, PL.dance.z, 0, 0, 1); AV.pose = "dance"; note("Dancing \u2014 tap Stand up when you are done"); });

    // ---- VIP lounge: the bouncer sells a 60-minute pass; the rope is solid until you have one ----
    const V = PL.vip, HOUR = 3600, hasPass = () => (st.vip || 0) > st.play;
    if (V) {
      A(V.door.x, V.door.z, 2.6, () => hasPass() ? "\uD83E\uDD42 VIP pass active" : "\uD83D\uDC8E VIP pass", () => {
        const left = Math.max(0, Math.ceil(((st.vip || 0) - st.play) / 60));
        show(ttl("\uD83D\uDC8E VIP Lounge") + "<small>" + (hasPass() ? "Your pass lasts " + left + " more minutes." : "Members only. A pass lasts 60 minutes of play.") + "</small>" +
          (hasPass() ? '<button data-in="1" style="' + BS + ';background:#c9a54a;color:#17191c;font-weight:800">\uD83E\uDD42 Enter the VIP lounge</button>' : "") +
          '<button data-p="1" style="' + BS + '">' + (hasPass() ? "Extend pass" : "Buy VIP pass") + " \u00B7 " + Z(150) + "</button>" + CLOSE, d => {
          if (d.x) return hide();
          if (d.in) { hide(); L.tp(V.in.x, V.in.z - 2.8); note("Welcome to the VIP lounge"); return; }           // always works while the pass is active
          if (cash() < 150) return note("Not enough cash. The pass costs " + Z(150));
          const before = cash(); pay(150, "VIP pass");
          if (cash() > before - 150) return note("Payment did not go through. You were not charged.");        // verification: the balance must drop by the price
          st.vipTx = { id: Date.now().toString(36), amt: 150, at: Math.round(st.play) };                       // receipt
          st.vip = Math.max(st.vip || 0, st.play) + HOUR; L.save(); note("VIP pass active for 60 minutes \u00B7 receipt " + st.vipTx.id); hide();
        });
      });
      A(V.in.x, V.in.z + 3.4, 2.6, "\uD83D\uDEAA Leave VIP", () => L.tp(V.door.x, V.door.z - 1.2));
      const seatsV = [[-10.5, 16.9, Math.PI], [-15.9, 13.6, Math.PI / 2], [-5.1, 13.6, -Math.PI / 2]];
      seatsV.forEach(s => A(PL.ox + s[0], PL.oz + 23 + s[1], 1.9, "\uD83D\uDECB\uFE0F VIP seat", () => sit(PL.ox + s[0], PL.oz + 23 + s[1], s[2], .5, 1), () => hasPass()));
      A(V.in.x, V.in.z, 2.6, "\uD83C\uDF7E Bottle service", () => menu("VIP bottle service", [["Premium", [["Champagne, bottle", 250, { m: 38, d: 2.6 }], ["Cognac, bottle", 320, { m: 40, d: 3.4 }], ["Sparkling water", 20, { m: 4 }]]]]), () => hasPass());
      // ---- VIP zone state machine: none -> active -> inside -> (pass expires) grace -> escorted out ----
      const VS = { state: "none", grace: 0, log: [] }; window.ACCRA_VIP = VS;
      const inVip = p => Math.abs(p.x - V.in.x) < V.in.hw + .4 && Math.abs(p.z - V.in.z) < V.in.hd + .4;
      const go = s => { if (VS.state === s) return; VS.log.push(s + "@" + Math.round(st.play)); VS.log = VS.log.slice(-8); if (s === "grace") note("Your VIP pass expired. Please leave the lounge."); VS.state = s; };
      let t = 0;
      scene.onBeforeRenderObservable.add(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, .1), p = player.position, has = hasPass(), inside = inVip(p);
        if (V.gate) V.gate.checkCollisions = !has && !inside;            // the rope only stops outsiders without a pass; nobody is ever locked in
        const s = inside ? (has ? "inside" : "grace") : (has ? "active" : "none"); go(s);
        if (s === "grace") { VS.grace += dt; if (VS.grace > 12 && !L.busy) { VS.grace = 0; if (L.seated) L.stand(); L.tp(V.door.x, V.door.z - 1.2); note("A bouncer escorted you out."); } } else VS.grace = 0;
        if (++t % 30) return;
        if (s === "inside") st.md = clamp(st.md + .25);
      });
    }

    // ---- pub music: louder as you get closer ----
    const cx = PL.ox, cz = PL.oz + 23;
    let near = false, k = 0;
    scene.onBeforeRenderObservable.add(() => {
      if (++k % 20) return;
      const AU = window.ACCRA_AUDIO; if (!AU) return;
      const d = Math.hypot(player.position.x - cx, player.position.z - cz);
      if (d < 30) { near = true; if (!AU.now() || AU.now() === "afro") { if (AU.now() !== "afro") AU.play("afro"); AU.volume(Math.max(.05, .55 * (1 - d / 30))); } }
      else if (near) { near = false; if (AU.now() === "afro") AU.stop(); }
    });
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).pub = 1;
    console.log("Accra pub ready");
  } catch (err) { console.error("accra-pub failed:", err); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note("\u26A0 Pub: " + err.message); }
})();
