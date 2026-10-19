/* accra-figure.js - stylised low-poly avatar builder.
 * Used for you, other players, police and bouncers. Registered as window.AccraFigure (human, walk, MAT).
 * Options (all optional): gender "male"|"female", skinTone, shirtHex, pantsHex, shoeHex, hairStyle
 * ("dreads"|"braids"|"afro"|"fade"|"bald"), hatStyle ("none"|"cap"|"beanie"|"hood"), outfit
 * ("suit"|"tee"|"casual"|"dress"), police (true = Ghana Police uniform). Without an outfit, civilians get a random one. */
(function () {
  try {
    // ---------- materials: one named material per group (skin, hair, shirt, collar, trousers, shoes, ...) ----------
    const matCache = {};
    function MAT(group, hex, extra) {
      const k = group + hex;
      if (!matCache[k]) {
        const m = new BABYLON.StandardMaterial("fig_" + group + "_" + hex.replace("#", ""), scene);
        m.diffuseColor = BABYLON.Color3.FromHexString(hex);
        m.specularColor = new BABYLON.Color3(.12, .12, .12);
        if (extra) Object.assign(m, extra);
        matCache[k] = m;
      }
      return matCache[k];
    }
    let eyeMat = null;
    function EYE() {                                  // eye texture: white, iris, pupil, highlight (drawn once)
      if (!eyeMat) {
        const t = new BABYLON.DynamicTexture("fig_eyeTex", { width: 64, height: 32 }, scene, false);
        const c = t.getContext();
        c.fillStyle = "#f4f4f2"; c.fillRect(0, 0, 64, 32);
        c.fillStyle = "#3a2416"; c.beginPath(); c.arc(32, 16, 10, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#050505"; c.beginPath(); c.arc(32, 16, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#ffffff"; c.beginPath(); c.arc(35, 12, 2, 0, Math.PI * 2); c.fill();
        t.update();
        eyeMat = new BABYLON.StandardMaterial("fig_eyes", scene);
        eyeMat.diffuseTexture = t; eyeMat.backFaceCulling = false; eyeMat.specularColor = new BABYLON.Color3(0, 0, 0);
      }
      return eyeMat;
    }

    // ---------- palettes for civilian clothing ----------
    const TOPS = ["#f2f2f0", "#1f5c3a", "#8a1c2b", "#2e7fd0", "#d9822b", "#2b2f36", "#c9a54a", "#e8e6df"];
    const JEANS = ["#1d3b6b", "#2a3b52", "#15171c", "#4b4f57"];
    const SUITS = ["#1c1f26", "#3a2f2f", "#2b3a55", "#2a2a2e"];
    const TIES = ["#8a1c2b", "#1f5c3a", "#c9a54a", "#2e7fd0"];
    const SHOES = ["#f4f4f2", "#111111", "#5a3a22"];
    const DRESS = ["#8a1c2b", "#2e7fd0", "#1f5c3a", "#d9822b", "#e8e6df"];
    const pick = a => a[Math.floor(Math.random() * a.length)];

    // police colours
    const NAVY = "#1b2a4a", BLACK = "#101216", HIVIS = "#e6e300", REFL = "#f2f2f2", GOLD = "#c9a54a";
    const DEF = { gender: "male", skinTone: "#a8754f", shirtHex: "#f2f2f0", pantsHex: "#f2f2f0", shoeHex: "#f4f4f2",
      hairStyle: "dreads", hatStyle: "cap", outfit: "", police: false };

    // accept the new names and the older ones used by the police and bouncer code
    function norm(o) {
      o = o || {};
      return {
        gender: o.gender, skinTone: o.skinTone || (typeof o.skin === "string" ? o.skin : undefined),
        shirtHex: o.shirtHex || o.shirt, pantsHex: o.pantsHex, shoeHex: o.shoeHex,
        hairStyle: o.hairStyle, hatStyle: o.hatStyle, outfit: o.outfit,
        // officers are recognised by their police shirt colour too, so the uniform always shows
        police: !!o.police || o.shirt === "#1d3b6b" || o.shirtHex === "#1d3b6b"
      };
    }

    const autos = [];

    function human(opt) {
      const cfg = norm(opt), o = {};
      Object.keys(DEF).forEach(k => { o[k] = cfg[k] !== undefined && cfg[k] !== "" ? cfg[k] : DEF[k]; });
      const fem = o.gender === "female";
      const SH = fem ? .23 : .27, HX = fem ? .14 : .12;

      // choose the outfit: police, or a civilian outfit (random when not chosen)
      let outfit = o.police ? "police" : o.outfit;
      if (!outfit) outfit = fem ? pick(["dress", "tee", "casual"]) : pick(["suit", "tee", "casual"]);
      if (!o.police && !cfg.shirtHex) o.shirtHex = pick(TOPS);
      if (!o.police && !cfg.pantsHex) o.pantsHex = pick(JEANS);
      if (outfit === "suit") { o.shirtHex = "#f2f2f0"; o.pantsHex = pick(SUITS); o.shoeHex = "#111111"; }
      if (outfit === "dress") { o.pantsHex = pick(DRESS); }

      // materials, grouped: skin, hair, top, bottom, footwear, collar, accents
      const skin = MAT("skin", o.skinTone);
      const hair = MAT("hair", "#1a1410");
      const top = MAT("top", o.police ? NAVY : o.shirtHex);
      const bottom = MAT("bottom", o.police ? BLACK : o.pantsHex);
      const shoe = MAT("shoe", o.police ? BLACK : (cfg.shoeHex || o.shoeHex || pick(SHOES)));
      const collar = MAT("collar", outfit === "suit" || o.police ? "#f2f2f0" : o.shirtHex);
      const gold = MAT("gold", GOLD);
      const cap = MAT("cap", o.police ? BLACK : "#f4f4f2");
      const vest = MAT("vest", HIVIS), reflect = MAT("reflect", REFL), badge = MAT("badge", GOLD);
      const dark = MAT("dark", "#15171c");
      const suitM = MAT("suit", pick(SUITS));
      const tieM = MAT("tie", pick(TIES));

      const root = new BABYLON.TransformNode("ffig", scene);
      const g = new BABYLON.TransformNode("fg", scene); g.parent = root;
      const P = (kind, opts, x, y, z, mat, par) => {
        const m = BABYLON.MeshBuilder["Create" + kind]("fig", opts, scene);
        m.parent = par || g; m.position.set(x, y, z); m.material = mat; m.isPickable = false; m.checkCollisions = false;
        return m;
      };
      const piv = (x, y) => { const t = new BABYLON.TransformNode("fig_pivot", scene); t.parent = g; t.position.set(x, y, 0); return t; };

      // ----- body core: torso, hips, neck -----
      P("Capsule", { height: fem ? .66 : .72, radius: fem ? .18 : .2, tessellation: 12 }, 0, 1.3, 0, top);
      P("Capsule", { height: .3, radius: fem ? .19 : .17, tessellation: 10 }, 0, .98, 0, bottom);
      P("Cylinder", { height: .14, diameter: .13, tessellation: 10 }, 0, 1.6, 0, skin);

      // ----- layered clothing on top -----
      if (outfit === "suit") {
        P("Capsule", { height: .7, radius: .23, tessellation: 12 }, 0, 1.3, .01, suitM);      // jacket
        P("Cylinder", { height: .05, diameter: .26, tessellation: 12 }, 0, 1.58, 0, collar);  // shirt collar
        P("Box", { width: .05, height: .3, depth: .02 }, 0, 1.3, .24, tieM);                  // tie
        P("Box", { width: .06, height: .05, depth: .03 }, 0, 1.44, .24, tieM);                // tie knot
        P("Box", { width: .03, height: .32, depth: .02 }, -.12, 1.33, .22, suitM);            // lapels
        P("Box", { width: .03, height: .32, depth: .02 }, .12, 1.33, .22, suitM);
      } else if (outfit === "casual" || outfit === "tee") {
        P("Cylinder", { height: .05, diameter: .25, tessellation: 12 }, 0, 1.58, 0, collar);  // neck rib
        if (outfit === "casual") P("Capsule", { height: .4, radius: .215, tessellation: 12 }, 0, 1.22, .01, top);   // hoodie layer
      } else if (outfit === "dress") {
        P("Cylinder", { height: .62, diameterTop: .38, diameterBottom: .56, tessellation: 14 }, 0, .72, 0, bottom); // skirt
      }

      if (o.police) {
        P("Box", { width: .4, height: .42, depth: .3 }, 0, 1.3, .02, vest);                  // hi-vis tactical vest
        P("Box", { width: .41, height: .04, depth: .31 }, 0, 1.2, .02, reflect);            // reflective band
        P("Box", { width: .41, height: .04, depth: .31 }, 0, 1.44, .02, reflect);
        P("Box", { width: .06, height: .06, depth: .02 }, -.1, 1.38, .2, badge);            // chest badge
        P("Box", { width: .42, height: .05, depth: .3 }, 0, .96, 0, dark);                  // tactical belt
        P("Cylinder", { height: .05, diameter: .25, tessellation: 12 }, 0, 1.58, 0, collar);
      }

      // gold chain for civilians
      if (!o.police) for (let i = 0; i < 5; i++) P("Sphere", { diameter: .035, segments: 6 }, -.1 + i * .05, 1.5 - Math.abs(i - 2) * .02, .19, gold);

      // ----- head: skull, jaw, ears, eyes, nose, mouth, brows -----
      const head = P("Sphere", { diameter: .3, segments: 14 }, 0, 1.74, .01, skin);
      head.scaling.set(1, 1.08, .98);
      P("Sphere", { diameter: .2, segments: 10 }, 0, 1.63, .03, skin).scaling.set(1, .6, .9);  // jaw
      [-1, 1].forEach(s => P("Sphere", { diameter: .06, segments: 8 }, s * .155, 1.75, 0, skin));   // ears
      [-1, 1].forEach(s => {                                                                     // eyes: textured planes
        const e = P("Plane", { width: .075, height: .05 }, s * .06, 1.77, .155, EYE());
        e.rotation.y = Math.PI;
      });
      P("Cylinder", { height: .07, diameterTop: 0, diameterBottom: .05, tessellation: 4 }, 0, 1.72, .16, skin).rotation.x = Math.PI / 2;  // nose
      P("Box", { width: .06, height: .015, depth: .02 }, 0, 1.66, .155, MAT("mouth", "#5a2a2a"));  // mouth
      [-1, 1].forEach(s => P("Box", { width: .06, height: .014, depth: .02 }, s * .06, 1.82, .15, hair));  // eyebrows

      // ----- hair -----
      if (o.hairStyle === "dreads") {
        for (let i = -4; i <= 4; i++) P("Cylinder", { height: .5, diameter: .05, tessellation: 8 }, i * .04, 1.56, -.14 - Math.abs(i) * .01, hair);
      } else if (o.hairStyle === "braids") {
        for (let i = -3; i <= 3; i++) P("Cylinder", { height: fem ? .62 : .46, diameter: .034, tessellation: 8 }, i * .06, 1.56, -.15, hair);
      } else if (o.hairStyle === "afro") {
        P("Sphere", { diameter: .44, segments: 12 }, 0, 1.84, -.03, hair);
      } else if (o.hairStyle === "fade") {
        P("Sphere", { diameter: .3, segments: 12 }, 0, 1.83, -.01, hair).scaling.set(1, .5, 1);
      }

      // ----- hats and hoods -----
      if (o.hatStyle === "cap" || o.police) {
        P("Cylinder", { height: .09, diameterTop: .24, diameterBottom: .28, tessellation: 16 }, 0, 1.92, 0, cap);   // crown
        P("Box", { width: .22, height: .02, depth: .13 }, 0, 1.87, .2, cap);                                       // brim
        if (o.police) P("Box", { width: .07, height: .06, depth: .02 }, 0, 1.94, .135, badge);                  // cap badge
      } else if (o.hatStyle === "beanie") {
        P("Sphere", { diameter: .3, segments: 12 }, 0, 1.86, 0, MAT("beanie", "#c9d13a")).scaling.set(1, .6, 1);
      } else if (o.hatStyle === "hood") {
        P("Sphere", { diameter: .36, segments: 12 }, 0, 1.82, -.1, top).scaling.set(1, .9, .9);
      }

      // ----- arms: each shoulder has a joint cap so the arm is always attached -----
      const arms = [-1, 1].map(s => {
        const a = piv(s * SH, 1.5);
        P("Sphere", { diameter: .18, segments: 12 }, 0, 0, 0, top, a);                                      // shoulder cap
        P("Capsule", { height: .42, radius: .085, tessellation: 10 }, 0, -.22, 0, top, a);                  // sleeve
        P("Sphere", { diameter: .16, segments: 10 }, 0, -.44, 0, skin, a);                                  // elbow cap
        P("Capsule", { height: .34, radius: .07, tessellation: 10 }, 0, -.6, 0, skin, a);                   // forearm
        P("Sphere", { diameter: .12, segments: 8 }, 0, -.8, 0, skin, a);                                    // hand
        return a;
      });

      // ----- legs: each hip and knee has a joint cap -----
      const legs = [-1, 1].map(s => {
        const q = piv(s * HX, 1.0);
        P("Sphere", { diameter: .17, segments: 12 }, 0, 0, 0, bottom, q);                                   // hip cap
        if (o.police) {
          P("Cylinder", { height: .8, diameterTop: .26, diameterBottom: .21, tessellation: 12 }, 0, -.45, 0, bottom, q);
          P("Sphere", { diameter: .16, segments: 10 }, 0, -.44, 0, bottom, q);                             // knee cap
          P("Box", { width: .2, height: .13, depth: .34 }, 0, -.93, .06, shoe, q);                         // boots
        } else if (outfit === "dress") {
          P("Capsule", { height: .42, radius: .085, tessellation: 10 }, 0, -.6, 0, skin, q);
          P("Box", { width: .2, height: .12, depth: .34 }, 0, -.94, .06, shoe, q);
        } else {
          P("Cylinder", { height: .8, diameterTop: .27, diameterBottom: .22, tessellation: 12 }, 0, -.45, 0, bottom, q);  // trousers
          P("Sphere", { diameter: .16, segments: 10 }, 0, -.44, 0, bottom, q);                             // knee cap
          P("Box", { width: .2, height: .12, depth: .34 }, 0, -.94, .06, shoe, q);                         // shoe
        }
        return q;
      });

      return { root, g, al: arms[0], ar: arms[1], ll: legs[0], lr: legs[1], pk: [], ph: 0, sp: 0, outfit };
    }

    // swing the arms and legs while walking
    function walk(h, sp, dt) {
      h.ph += dt * (2 + sp * 1.1);
      const k = Math.min(1, sp / 3), s = Math.sin(h.ph) * .85 * k;
      h.ll.rotation.x = s; h.lr.rotation.x = -s;
      h.al.rotation.x = -s; h.ar.rotation.x = s;
      h.g.position.y = Math.abs(Math.cos(h.ph)) * .05 * k;
    }

    // police and bouncers are walked here
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      autos.forEach(h => { if (!h.root.isDisposed()) walk(h, h.sp || 0, dt); });
    });

    window.AccraFigure = { human, walk, MAT };

    // replace the old box people used by the police and bouncers
    if (window.AccraAssets) {
      window.AccraAssets.createCharacter = (scn, o) => {
        const h = human(o);
        autos.push(h);
        return { root: h.root, setMoving: v => { h.sp = v ? 3 : 0; } };
      };
    }

    // rebuild the player's figure with the chosen look
    if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();

    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).figure = 1;
    console.log("Accra figure ready");
  } catch (err) { console.error("accra-figure failed:", err); }
})();
