/* accra-apartments.js - five apartment tiers from the Accra Life Apartment Agency (Makola).
 * 5 star GH₵25,000+, 4 star GH₵15,000-24,000, 3 star GH₵10,000-14,000, 2 star GH₵6,000-9,000, 1 star GH₵3,000-5,000 a month.
 * You move in by paying a deposit of two months' rent. Rent is taken every game month (10 minutes). If you cannot pay,
 * you get an alert. New players start with no apartment. Works alongside the existing home system. */
(function () {
  try {
    const K = window.ACCRA_KIT;
    const B = BABYLON;
    const box = (w, h, d, x, y, z, col, solid) => {
      const m = B.MeshBuilder.CreateBox("apt", { width: w, height: h, depth: d }, scene);
      m.position.set(x, y, z); m.material = mat(col); m.checkCollisions = !!solid; m.isPickable = false;
      if (h > .1 && typeof sg !== "undefined") sg.addShadowCaster(m);
      return m;
    };
    if (!K) { console.log("accra-apartments: waiting for the game"); return; }
    const MONTH_MS = 10 * 60 * 1000;
    const TIERS = [
      { stars: 1, name: "1 Star Community Apartment", min: 3000, max: 5000, rent: 3000, beds: "1 bedroom", extras: "Living room, basic kitchen, shared balcony, security by day, parking" },
      { stars: 2, name: "2 Star Sunset Apartment", min: 6000, max: 9000, rent: 6000, beds: "1 bedroom", extras: "Living room, kitchen, balcony, security day and night, parking" },
      { stars: 3, name: "3 Star Riverside Apartment", min: 10000, max: 14000, rent: 10000, beds: "2 bedrooms (1 en suite)", extras: "Living room, kitchen, balcony, shared pool, 24/7 security, parking" },
      { stars: 4, name: "4 Star Ocean View Apartment", min: 15000, max: 24000, rent: 15000, beds: "2 bedrooms (1 en suite)", extras: "Living room, modern kitchen, balcony, shared pool and gym, 24/7 security, parking" },
      { stars: 5, name: "5 Star Accra Skyline Apartment", min: 25000, max: null, rent: 25000, beds: "3 bedrooms (all en suite)", extras: "Spacious living room, island kitchen, private balcony with city view, rooftop pool, gym, 24/7 concierge, private parking and lift" }
    ];
    const stars = n => "\u2605".repeat(n) + "\u2606".repeat(5 - n);
    const price = t => t.max ? "GH\u00A2" + t.min.toLocaleString() + " \u2013 " + t.max.toLocaleString() : "GH\u00A2" + t.min.toLocaleString() + "+";
    const load = () => { try { return JSON.parse(localStorage.getItem("accra-apt")) || null; } catch (e) { return null; } };
    const save = v => { try { localStorage.setItem("accra-apt", JSON.stringify(v)); } catch (e) {} };
    let home = load();                          // { stars, paidUntil } or null (no apartment)

    // ----- rent: taken every game month; an alert if there is not enough cash -----
    function rentCheck() {
      if (!home) return;
      const t = TIERS[home.stars - 1];
      while (Date.now() >= home.paidUntil) {
        if (K.cash() >= t.rent) {
          K.pay(t.rent, t.name + " rent");
          home.paidUntil += MONTH_MS;
        } else {
          if (!home.warned || Date.now() - home.warned > MONTH_MS) {
            home.warned = Date.now();
            if (window.ACCRA_NOTIFY) window.ACCRA_NOTIFY("Rent due for your " + t.name + ": GH\u00A2" + t.rent + ". Pay it soon.", "rent");
            K.note("Rent is due for your apartment: GH\u00A2" + t.rent);
          }
          break;
        }
      }
      save(home);
    }
    setInterval(rentCheck, 15000); rentCheck();

    // ----- the agency menu -----
    const CLOSE = '<button data-x="1" style="' + K.BS + ';text-align:center">Close</button>';
    function menu() {
      const cur = home ? TIERS[home.stars - 1] : null;
      const head = K.ttl("\uD83C\uDFE2 Apartment Agency") + "<small>Cash GH\u00A2" + K.cash().toLocaleString() + ". Deposit = two months' rent when you move in.</small>";
      const curLine = cur
        ? '<div style="margin:6px 0;padding:6px 8px;border-radius:10px;background:rgba(201,165,74,.18)"><b>You live at: ' + cur.name + "</b><br><small>Rent GH\u00A2" + cur.rent.toLocaleString() + " each game month. Next rent in " + Math.max(0, Math.ceil((home.paidUntil - Date.now()) / 60000)) + " min.</small></div>" +
          '<button data-lock="1" style="' + K.BS + '">' + (isLocked(home.stars) ? "\uD83D\uDD13 Unlock door" : "\uD83D\uDD12 Lock door") + '</button>' +
          '<button data-leave="1" style="' + K.BS + '">Give up this apartment</button>'
        : "<small>You do not have an apartment yet.</small>";
      const rows = TIERS.map(t => '<button data-tier="' + t.stars + '" style="' + K.BS + '">' + stars(t.stars) + " " + t.name + "<br><small>" + price(t) + " a month \u00B7 " + t.beds + "</small></button>").join("");
      K.show(head + curLine + rows + CLOSE, d => {
        if (d.x) return K.hide();
        if (d.lock) { if (!home) return K.note("You have no apartment."); setLocked(home.stars, !isLocked(home.stars)); K.note(isLocked(home.stars) ? "Door locked" : "Door unlocked"); return menu(); }
        if (d.leave) { if (!home) return K.note("You have no apartment."); home = null; save(null); refreshSigns(); K.note("You gave up your apartment."); return menu(); }
        if (d.tier) return details(+d.tier);
      });
    }
    function details(n) {
      const t = TIERS[n - 1], deposit = t.rent * 2;
      const body = K.ttl(stars(t.stars) + " " + t.name) + "<small>" + price(t) + " a month</small>" +
        "<div style=\"margin:6px 0;font-size:12px;line-height:1.4\"><b>Bedrooms:</b> " + t.beds + "<br><b>Includes:</b> " + t.extras + "</div>" +
        "<small>Move-in deposit: GH\u00A2" + deposit.toLocaleString() + " (paid now) then GH\u00A2" + t.rent.toLocaleString() + " every game month.</small>";
      K.show(body + '<button data-move="' + n + '" style="' + K.GOLD + '">Move in for GH\u00A2' + deposit.toLocaleString() + "</button>" +
        '<button data-back="1" style="' + K.BS + ';text-align:center">Back</button>' + CLOSE, d => {
        if (d.x) return K.hide();
        if (d.back) return menu();
        if (d.move) {
          if (home) return K.note("You already have an apartment. Give it up first.");
          if (K.cash() < deposit) return K.note("Not enough cash. You need GH\u00A2" + deposit.toLocaleString());
          K.pay(deposit, "Deposit: " + t.name);
          home = { stars: n, paidUntil: Date.now() + MONTH_MS, warned: 0 };
          save(home); refreshSigns();
          K.hide();
          K.note("Welcome home to your " + t.name + "!");
          if (window.ACCRA_NOTIFY) window.ACCRA_NOTIFY("You moved into the " + t.name + ". Rent is GH\u00A2" + t.rent + " a month.", "home");
        }
      });
    }

    // ----- the five apartment buildings, built on free land west of the city (x -196, z -120 to -32) -----
    // each building: its own height and colour, a sign with its name, floors, windows, balconies, gate and entrance
    const SITE_X = -196, Z0 = -120, PITCH = 22;
    const BUILD = [
      { tier: 5, h: 24, floors: 6, col: "#d6cfc4", roof: "#3a3f48", sign: "ACCRA SKYLINE", sub: "Luxury Apartments", pool: true },
      { tier: 4, h: 20, floors: 5, col: "#e8e0d0", roof: "#4a4f58", sign: "OCEAN VIEW", sub: "Apartments", pool: false },
      { tier: 3, h: 16, floors: 4, col: "#e0cfb4", roof: "#5a4c3e", sign: "RIVERSIDE", sub: "Apartments", pool: false },
      { tier: 2, h: 12, floors: 3, col: "#c8553d", roof: "#7a3428", sign: "SUNSET", sub: "Apartments", pool: false },
      { tier: 1, h: 8, floors: 2, col: "#7fa6c4", roof: "#5a6b78", sign: "COMMUNITY", sub: "Apartments", pool: false }
    ];
    const signTex = (t, sub) => {
      const dt = new B.DynamicTexture("apt_sign_" + t, { width: 512, height: 160 }, scene, false), c = dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 160);
      c.fillStyle = "#ffffff"; c.font = "bold 58px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, 256, 60, 490);
      c.fillStyle = "#c9a54a"; c.font = "bold 36px system-ui"; c.fillText(sub, 256, 118, 490); dt.update();
      const m = new B.StandardMaterial("apt_signM_" + t, scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false; return m;
    };
    // ----- the compound: five buildings close together, each with its own parking lot and landscaping -----
    const POS = [[-226, -104], [-196, -104], [-226, -62], [-196, -62], [-166, -84]];   // building centres (x, z)
    const BPOS = {}, SIGNS = {}, ac = window.AccraAssets;
    const STATUS = { free: "#2e7d32", yours: "#c9a54a", full: "#8e1b1b" };
    function statusFor(t) {
      if (home && home.stars === t) return ["YOUR HOME", STATUS.yours];
      if (t === 2 || t === 4) return ["FULL", STATUS.full];
      return ["TO RENT", STATUS.free];
    }
    function drawSign(t) {
      const s = SIGNS[t]; if (!s) return;
      const [label, col] = statusFor(t), c = s.dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 160);
      c.fillStyle = "#ffffff"; c.font = "bold 52px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(s.name, 256, 46, 490);
      c.fillStyle = "#c9a54a"; c.font = "bold 28px system-ui"; c.fillText(s.sub + " \u00B7 " + s.floors + " floors", 256, 90, 490);
      c.fillStyle = col; c.fillRect(120, 116, 272, 34);
      c.fillStyle = "#ffffff"; c.font = "bold 26px system-ui"; c.fillText(label, 256, 133);
      s.dt.update();
    }
    const refreshSigns = () => [1, 2, 3, 4, 5].forEach(drawSign);
    BUILD.forEach((b, i) => {
      const [x, z] = POS[i], W = 14, H = b.h, t = b.tier, pz = z + W / 2 + 10;
      BPOS[t] = { x, z };
      // block: floors, windows and balconies
      box(W, H, W, x, H / 2, z, b.col, true);
      box(W + .8, .5, W + .8, x, H + .25, z, b.roof, false);
      for (let f = 1; f < b.floors; f++) box(W + .3, .3, W + .3, x, f * H / b.floors, z, "#f4f1ea", false);
      for (let f = 0; f < b.floors; f++) {
        const y = f * H / b.floors + 1.6;
        [-4.5, -1.5, 1.5, 4.5].forEach(dx => box(1.6, 1.4, .12, x + dx, y, z + W / 2 + .05, "#1d3042", false));
        if (t >= 3 && f > 0) box(W - 1, .12, 1.6, x, y - .8, z + W / 2 + .8, "#6d4c2f", false);
      }
      box(2.6, 2.7, .15, x, 1.35, z + W / 2 + .07, "#3a2a1a", false);        // entrance door
      // landscaping: hedges at the corners, palms at the back
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => box(2.4, 1, 2.4, x + p[0] * (W / 2 + 1.6), .5, z + p[1] * (W / 2 + 1.6), "#3f8f3a", false));
      if (ac && ac.createTree) {
        ac.createTree(scene, { type: "palm", position: [x - W / 2 - 2.6, 0, z - W / 2 - 2.6] });
        ac.createTree(scene, { type: "palm", position: [x + W / 2 + 2.6, 0, z - W / 2 - 2.6] });
      }
      // parking lot in front: painted bays and parked cars
      box(22, .06, 12, x, .03, pz, "#3a3c42", false);
      for (let k = -2; k <= 2; k++) box(.15, .07, 9, x + k * 4, .04, pz, "#f2f2f2", false);
      if (ac && ac.createCar) [-4, 0, 4].forEach((dx, j) => {
        if ((i + j) % 2 !== 0) return;
        const c = ac.createCar(scene, "sedan", { position: [x + dx, 0, pz], rotY: Math.PI / 2, color: ["#f2f2f2", "#2c6e8c", "#3a3d44", "#c0392b"][(i + j) % 4] });
        c.getChildMeshes().forEach(m => m.checkCollisions = false);
      });
      // pool and gate for the larger buildings
      if (b.pool) { box(8, .05, 5, x, .06, z - W / 2 - 4, "#46b6d9", false); box(2, 2.2, .4, x + 9, 1.1, z + 2, "#6d4c2f", false); }
      if (t >= 4) {
        box(16, 1.6, .3, x, .8, z + W / 2 + 3, "#e6e0d0", false);
        [-7.6, 7.6].forEach(dx => box(.8, 2.4, .8, x + dx, 1.2, z + W / 2 + 3, "#c9b79a", false));
      }
      // sign with the floors and status
      const sn = B.MeshBuilder.CreatePlane("apt_sign", { width: 12, height: 3.8 }, scene);
      sn.position.set(x, H - 3, z + W / 2 + .3); sn.rotation.y = Math.PI; sn.isPickable = false;
      const dt = new B.DynamicTexture("apt_sign_" + t, { width: 512, height: 160 }, scene, false);
      const mt = new B.StandardMaterial("apt_signM_" + t, scene); mt.diffuseTexture = dt; mt.emissiveTexture = dt; mt.disableLighting = true; mt.backFaceCulling = false;
      sn.material = mt;
      SIGNS[t] = { dt, name: b.sign, sub: b.sub, floors: b.floors };
      drawSign(t);
      // map entry and the walk-up entrance point, in front of the parking lot
      (window.ACCRA_DEST_EXTRA = window.ACCRA_DEST_EXTRA || []).push({ n: b.sign + " apartments (" + t + " star)", x, z: pz });
      K.points.push({ x, z: z + W / 2 + 4, r: 5, t: "\uD83C\uDFE2 " + b.sign + " \u00B7 " + stars(t) + " (" + price(TIERS[t - 1]) + ")", f: () => doorAt(t) });
    });

    // ----- the lock: your own door can be locked; you need to unlock it to walk in -----
    const lockState = () => { try { return JSON.parse(localStorage.getItem("accra-apt-lock")) || {}; } catch (e) { return {}; } };
    const isLocked = n => !!lockState()[n];
    const setLocked = (n, v) => { const o = lockState(); o[n] = !!v; try { localStorage.setItem("accra-apt-lock", JSON.stringify(o)); } catch (e) {} };

    // ----- the apartments' rooms, built once for each tier, in their own space far to the west -----
    // room size grows with the tier: 1 star 8 m, 2 star 9 m, 3 star 11 m, 4 star 12 m, 5 star 14 m
    const ROOM = { 1: 8, 2: 9, 3: 11, 4: 12, 5: 14 };
    const IX = -720, IZ = -140;                          // interiors sit on their own ground, out of the city
    const interior = {};
    // Layout by star rating (rooms grow with the tier):
    // 1 star: one room with living area, kitchen and a bathroom (studio style)
    // 2 star: living room, kitchen, one bedroom, bathroom
    // 3 star: living room, kitchen, two bedrooms (one en suite), balcony
    // 4 star: living and dining, modern kitchen, two bedrooms (both en suite), office corner
    // 5 star: spacious living, island kitchen, three bedrooms (all en suite), office, lounge
    const BEDS = { 1: 0, 2: 1, 3: 2, 4: 2, 5: 3 };
    function buildRoomMeshes(t) {
      const S = ROOM[t], cx = IX, cz = IZ + (t - 1) * 26, h = 3.2, th = .3, half = S / 2;
      const wall = (x, z, w, d) => box(w, h, d, cx + x, h / 2, cz + z, "#efe9dd", true);
      const it = (id, x, z, ry) => { K.collider(id, cx + x, cz + z, ry, 1); K.item(id, cx + x, cz + z, ry, false, 1); };
      box(S, .1, S, cx, .05, cz, "#c9b79a", false);                       // floor
      box(S, .1, S, cx, h + .05, cz, "#f7f5f0", false);                   // ceiling
      wall(0, -half, S, th); wall(-half, 0, th, S); wall(half, 0, th, S); // back and side walls
      const gap = 2.2;                                                      // front wall with a doorway
      wall(-(half + gap / 2) / 2, half, (S - gap) / 2, th); wall((half + gap / 2) / 2, half, (S - gap) / 2, th);
      box(gap, .02, .3, cx, .05, cz + half, "#8a8a84", false);

      const beds = BEDS[t], bedD = S * .42;                                 // bedrooms run along the back wall
      const frontZ = -half + bedD;                                          // front zone starts here
      // dividing walls between the back rooms
      for (let i = 1; i < beds; i++) wall(-half + S * i / beds, -half + bedD / 2, th, bedD);
      if (t === 1) { wall(-half + S * .72, -half + S * .28, th, S * .56); }  // one bathroom, in the back-right corner
      // bedrooms with a bed and a wardrobe each
      for (let i = 0; i < beds; i++) {
        const x0 = -half + S * (i + .5) / beds;
        it(i === 0 ? "bed2" : "bed1", x0, -half + 2.4, 0);
        it("wardrobe", x0 + (i % 2 ? -.9 : .9), -half + bedD - 1.0, 0);
        if (t >= 3) {                                                       // en suite: a bathroom tucked into each bedroom's corner
          const bx = -half + S * (i + 1) / beds - 1.6;
          it("bath", bx - 0.2, -half + 1.2, 0); it("vanity", bx + 1.2, -half + 1.6, Math.PI);
        }
      }
      // living room: front-left
      it("sofa", -half + 2.8, frontZ + 3.4, 0);
      it("tv", -half + 2.8, frontZ + .6, Math.PI / 2);
      it("coffee", -half + 4.6, frontZ + 2.2, 0);
      // kitchen along the right wall
      const kx = half - 1.2;
      if (t === 5) { it("island", kx - 2.2, frontZ + 4, 0); }
      it("counter", kx, frontZ + 1.2, -Math.PI / 2);
      it("fridge", kx, frontZ - 1.2, -Math.PI / 2);
      if (t >= 2) it("kit2", kx, frontZ + 4.6, -Math.PI / 2);
      // dining (4 and 5 star)
      if (t >= 4) { it("dining", -1, frontZ + 3.8, 0); }
      // bathroom for 1 and 2 star: front-left corner, behind a short wall
      if (t <= 2) {
        wall(-half + 2.2, half - 3.2, 2.2, th);
        it("bath", -half + 1.1, half - 1.6, 0); it("vanity", -half + 1.2, half - 3.6, Math.PI / 2);
      }
      // office corner (4 and 5 star)
      if (t >= 4) { it("desk", half - 2.6, -frontZ + .5 + frontZ - 3.2, Math.PI); it("shelf", half - 1.0, half - 2.4, -Math.PI / 2); }
      // 5 star: lounge fan and a shelf by the entrance
      if (t === 5) it("fan", -half + 1.4, half - 1.4, 0);
      // 3 star and up: balcony strip on the front (decorative)
      if (t >= 3) box(S - 2, .08, 1.4, cx, .04, cz + half + .7, "#8a6a4a", false);
    }
    // the rooms are only planned at startup (cheap). The furniture is built the first time you enter that apartment.
    const built_ = {};
    let currentIn = null;
    [1, 2, 3, 4, 5].forEach(t => {
      const S = ROOM[t], cx = IX, cz = IZ + (t - 1) * 26, exitPt = { x: cx, z: cz + S / 2 - 1.4 };
      interior[t] = { cx, cz, S, exitPt };
      K.points.push({ x: exitPt.x, z: exitPt.z, r: 1.8, t: "\uD83D\uDEAA Leave apartment", ok: () => currentIn === t, f: () => leave(t) });
    });
    function ensureRoom(t) { if (!built_[t]) { built_[t] = true; buildRoomMeshes(t); } }
    function enter(t) {
      if (!home || home.stars !== t) return K.note("This is not your apartment.");
      if (isLocked(t)) return K.note("The door is locked. Unlock it from the apartment menu first.");
      const r = interior[t], L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
      K.hide();
      if (!L) return K.note("Not ready yet.");
      ensureRoom(t);
      L.fade(700, () => { currentIn = t; L.tp(r.exitPt.x, r.exitPt.z - 1.2); }, () => K.note("Welcome home! Lock the door from the menu when you leave."));
    }
    function leave(t) {
      const b = BUILD[t - 1], L = window.ACCRA_LIFE && window.ACCRA_LIFE.api;
      if (!L) return;
      const ox = BPOS[t].x, oz = BPOS[t].z + 14 / 2 + 4;
      L.fade(700, () => { currentIn = null; L.tp(ox, oz); }, () => K.note("You left " + b.sign + ". " + (isLocked(t) ? "The door is locked." : "The door is unlocked.")));
    }
    // the entrance: walk in if it is your apartment, otherwise open the tier details
    function doorAt(t) {
      if (home && home.stars === t) { if (isLocked(t)) return K.note("Your door is locked. Unlock it from the apartment menu, then walk in."); return enter(t); }
      details(t);
    }

    // the agency sits on the Makola road, in front of the mall entrance
    K.points.push({ x: 35, z: -4, r: 5, t: "\uD83C\uDFE2 Apartment Agency", f: () => menu() });

    window.ACCRA_APARTMENTS = { tiers: TIERS, current: () => home ? home.stars : 0 };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).apartments = 1;
    console.log("Apartment agency ready: 5 tiers");
  } catch (err) { console.error("accra-apartments failed:", err); }
})();
