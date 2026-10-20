/* accra-figure.js - cartoon-style character for you, other players, police and bouncers.
 * Big round head with textured eyes, short chunky body, thick limbs and bright clothing. Registered as
 * window.AccraFigure (human, walk, MAT). Options: gender, skinTone, shirtHex, pantsHex, shoeHex, hairStyle
 * ("dreads"|"braids"|"afro"|"fade"|"bald"), hatStyle ("none"|"cap"|"beanie"|"hood"), outfit
 * ("suit"|"tee"|"casual"|"dress"), police (true = police uniform). */
(function () {
  try {
    // ----- materials: one named material per group -----
    const matCache = {};
    function MAT(group, hex) {
      const k = group + hex;
      if (!matCache[k]) {
        const m = new BABYLON.StandardMaterial("cart_" + group + "_" + hex.replace("#", ""), scene);
        m.diffuseColor = BABYLON.Color3.FromHexString(hex);
        m.specularColor = new BABYLON.Color3(.05, .05, .05);   // soft, cartoon look
        matCache[k] = m;
      }
      return matCache[k];
    }
    let eyeMat = null;
    function EYE() {                                 // big cartoon eye: white, large dark iris, shine
      if (!eyeMat) {
        const t = new BABYLON.DynamicTexture("cart_eyeTex", { width: 64, height: 64 }, scene, false);
        const c = t.getContext();
        c.fillStyle = "#ffffff"; c.beginPath(); c.arc(32, 32, 30, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#1a1410"; c.beginPath(); c.arc(32, 36, 19, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#ffffff"; c.beginPath(); c.arc(40, 27, 6, 0, Math.PI * 2); c.fill();
        t.update();
        eyeMat = new BABYLON.StandardMaterial("cart_eyes", scene);
        eyeMat.diffuseTexture = t; eyeMat.backFaceCulling = false; eyeMat.specularColor = new BABYLON.Color3(0, 0, 0);
      }
      return eyeMat;
    }

    // ----- palettes -----
    const TOPS = ["#ff6b35", "#2ec4b6", "#ffbe0b", "#8338ec", "#3a86ff", "#ef476f", "#06d6a0", "#ffffff"];
    const JEANS = ["#3a86ff", "#1d3557", "#2b2d42", "#5c677d"];
    const SUITS = ["#2b2d42", "#3d405b", "#1d3557", "#333333"];
    const TIES = ["#ef476f", "#06d6a0", "#ffbe0b", "#3a86ff"];
    const SHOES = ["#ffffff", "#222222", "#ff6b35"];
    const DRESS = ["#ef476f", "#3a86ff", "#06d6a0", "#ffbe0b", "#ffffff"];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const NAVY = "#1b2a4a", BLACK = "#1a1a1f", HIVIS = "#e6e300", REFL = "#f2f2f2", GOLD = "#ffc83d";
    const DEF = { gender: "male", skinTone: "#c68a5e", shirtHex: "#ff6b35", pantsHex: "#3a86ff", shoeHex: "#ffffff",
      hairStyle: "dreads", hatStyle: "cap", outfit: "", police: false };

    function norm(o) {
      o = o || {};
      return {
        gender: o.gender, skinTone: o.skinTone || (typeof o.skin === "string" ? o.skin : undefined),
        shirtHex: o.shirtHex || o.shirt, pantsHex: o.pantsHex, shoeHex: o.shoeHex,
        hairStyle: o.hairStyle, hatStyle: o.hatStyle, outfit: o.outfit,
        police: !!o.police || o.shirt === "#1d3b6b" || o.shirtHex === "#1d3b6b"
      };
    }

    const autos = [];

    function human(opt) {
      const cfg = norm(opt), o = {};
      Object.keys(DEF).forEach(k => { o[k] = cfg[k] !== undefined && cfg[k] !== "" ? cfg[k] : DEF[k]; });
      const fem = o.gender === "female";
      const SH = fem ? .24 : .27, HX = fem ? .1 : .12;   // shoulder and hip offsets (chunky, so small)

      let outfit = o.police ? "police" : o.outfit;
      if (!outfit) outfit = fem ? pick(["dress", "tee", "casual"]) : pick(["suit", "tee", "casual"]);
      if (!o.police && !cfg.shirtHex) o.shirtHex = pick(TOPS);
      if (!o.police && !cfg.pantsHex) o.pantsHex = pick(JEANS);
      if (outfit === "suit") { o.shirtHex = "#ffffff"; o.pantsHex = pick(SUITS); o.shoeHex = "#222222"; }
      if (outfit === "dress") o.pantsHex = pick(DRESS);

      const skin = MAT("skin", o.skinTone);
      const hair = MAT("hair", "#1a1410");
      const top = MAT("top", o.police ? NAVY : o.shirtHex);
      const bottom = MAT("bottom", o.police ? BLACK : o.pantsHex);
      const shoe = MAT("shoe", o.police ? BLACK : (cfg.shoeHex || o.shoeHex || pick(SHOES)));
      const collar = MAT("collar", outfit === "suit" || o.police ? "#ffffff" : o.shirtHex);
      const gold = MAT("gold", GOLD);
      const cap = MAT("cap", o.police ? BLACK : "#ffffff");
      const vest = MAT("vest", HIVIS), reflect = MAT("reflect", REFL), badge = MAT("badge", GOLD);
      const dark = MAT("dark", "#1a1a1f");
      const suitM = MAT("suit", pick(SUITS));
      const tieM = MAT("tie", pick(TIES));
      const mouthM = MAT("mouth", "#7a2e2e");

      const root = new BABYLON.TransformNode("ffig", scene);
      root.scaling.setAll(1.16);   // about 1.8 m tall, the same height for the player, police and other people
      const g = new BABYLON.TransformNode("fg", scene); g.parent = root;
      const P = (kind, opts, x, y, z, mtl, par) => {
        const m = BABYLON.MeshBuilder["Create" + kind]("cart", opts, scene);
        m.parent = par || g; m.position.set(x, y, z); m.material = mtl; m.isPickable = false; m.checkCollisions = false;
        return m;
      };
      const piv = (x, y) => { const t = new BABYLON.TransformNode("cart_pivot", scene); t.parent = g; t.position.set(x, y, 0); return t; };

      // ----- body: short and chunky -----
      P("Capsule", { height: fem ? .5 : .54, radius: fem ? .2 : .23, tessellation: 14 }, 0, .72, 0, top);     // torso
      P("Capsule", { height: .24, radius: fem ? .21 : .2, tessellation: 12 }, 0, .44, 0, bottom);            // hips
      P("Box", { width: .3, height: .06, depth: .2 }, 0, .9, 0, dark);                                       // belt line
      if (outfit === "suit") {
        P("Capsule", { height: .52, radius: .25, tessellation: 14 }, 0, .72, .01, suitM);                    // jacket
        P("Box", { width: .05, height: .24, depth: .03 }, 0, .72, .26, tieM);                               // tie
      } else if (outfit === "casual") {
        P("Capsule", { height: .3, radius: .25, tessellation: 14 }, 0, .78, .01, top);                       // hoodie layer
      } else if (outfit === "dress") {
        P("Cylinder", { height: .4, diameterTop: .36, diameterBottom: .62, tessellation: 16 }, 0, .3, 0, bottom); // skirt
      }
      if (o.police) {
        P("Box", { width: .46, height: .4, depth: .3 }, 0, .74, .03, vest);                                  // hi-vis vest
        P("Box", { width: .47, height: .05, depth: .31 }, 0, .66, .03, reflect);                             // reflective bands
        P("Box", { width: .47, height: .05, depth: .31 }, 0, .82, .03, reflect);
        P("Box", { width: .08, height: .08, depth: .02 }, -.12, .8, .24, badge);                             // badge
      }
      P("Box", { width: .08, height: .08, depth: .04 }, 0, .96, .2, collar);                                  // collar
      [-1, 1].forEach(s => P("Sphere", { diameter: .1, segments: 8 }, s * .04, .96, .22, gold));              // chain beads
      P("Sphere", { diameter: .13, segments: 8 }, 0, .95, .22, gold);

      // ----- big round head -----
      const headN = new BABYLON.TransformNode("cart_head", scene); headN.parent = g; headN.position.set(0, 1.2, 0);
      const hp = (kind, opts, x, y, z, mtl) => { const m = BABYLON.MeshBuilder["Create" + kind]("cart_h", opts, scene); m.parent = headN; m.position.set(x, y, z); m.material = mtl; m.isPickable = false; m.checkCollisions = false; return m; };
      const skull = hp("Sphere", { diameter: .56, segments: 18 }, 0, 0, 0, skin);
      skull.scaling.set(1, 1.02, .98);
      [-1, 1].forEach(s => hp("Sphere", { diameter: .12, segments: 8 }, s * .29, -.02, 0, skin));           // ears
      [-1, 1].forEach(s => {                                                                               // big eyes
        const e = hp("Plane", { width: .15, height: .15 }, s * .12, .04, .285, EYE());
        e.rotation.y = Math.PI; e.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
      });
      hp("Box", { width: .11, height: .03, depth: .02 }, 0, -.1, .28, mouthM);                              // smile
      hp("Box", { width: .09, height: .02, depth: .02 }, 0, -.07, .28, mouthM);
      [-1, 1].forEach(s => hp("Box", { width: .11, height: .03, depth: .02 }, s * .13, .15, .27, hair));     // brows

      // hair
      if (o.hairStyle === "dreads") {
        for (let i = -4; i <= 4; i++) hp("Cylinder", { height: .34, diameter: .055, tessellation: 8 }, i * .06, .02, -.27 - Math.abs(i) * .01, hair);
        for (let i = -4; i <= 4; i++) hp("Cylinder", { height: .3, diameter: .055, tessellation: 8 }, i * .06, .18, -.25, hair);
      } else if (o.hairStyle === "braids") {
        for (let i = -3; i <= 3; i++) hp("Cylinder", { height: .34, diameter: .045, tessellation: 8 }, i * .08, .02, -.27, hair);
      } else if (o.hairStyle === "afro") {
        hp("Sphere", { diameter: .74, segments: 16 }, 0, .12, -.05, hair);
      } else if (o.hairStyle === "fade") {
        hp("Sphere", { diameter: .58, segments: 16 }, 0, .05, -.02, hair).scaling.set(1, .5, 1);
      }

      // hats and hoods
      if (o.hatStyle === "cap" || o.police) {
        hp("Cylinder", { height: .16, diameterTop: .46, diameterBottom: .56, tessellation: 18 }, 0, .3, 0, cap);   // crown
        hp("Box", { width: .42, height: .05, depth: .24 }, 0, .24, .26, cap);                                    // brim
        if (o.police) hp("Box", { width: .11, height: .09, depth: .03 }, 0, .34, .29, badge);                   // badge
      } else if (o.hatStyle === "beanie") {
        hp("Sphere", { diameter: .6, segments: 16 }, 0, .26, 0, MAT("beanie", "#ffbe0b")).scaling.set(1, .6, 1);
      } else if (o.hatStyle === "hood") {
        hp("Sphere", { diameter: .66, segments: 16 }, 0, .05, -.1, top).scaling.set(1, .95, .95);
      }

      // ----- arms: thick and short, with round hands -----
      const sleeve = o.police ? NAVY : o.shirtHex;
      const arms = [-1, 1].map(s => {
        const a = piv(s * SH, .9);
        P("Sphere", { diameter: .2, segments: 12 }, 0, 0, 0, top, a);                                      // shoulder ball
        P("Capsule", { height: .2, radius: .1, tessellation: 12 }, 0, -.14, 0, top, a);                     // sleeve
        P("Capsule", { height: .18, radius: .09, tessellation: 12 }, 0, -.36, 0, skin, a);                  // forearm
        P("Sphere", { diameter: .2, segments: 12 }, 0, -.5, 0, skin, a);                                    // hand
        return a;
      });

      // ----- legs: short and thick, with chunky shoes -----
      const legs = [-1, 1].map(s => {
        const q = piv(s * HX, .5);
        P("Sphere", { diameter: .2, segments: 12 }, 0, 0, 0, bottom, q);                                    // hip joint
        if (o.police) {
          P("Cylinder", { height: .4, diameterTop: .24, diameterBottom: .2, tessellation: 14 }, 0, -.2, 0, bottom, q);
          P("Box", { width: .22, height: .14, depth: .34 }, 0, -.46, .05, shoe, q);
        } else if (outfit === "dress") {
          P("Capsule", { height: .26, radius: .09, tessellation: 12 }, 0, -.2, 0, skin, q);
          P("Box", { width: .22, height: .14, depth: .34 }, 0, -.46, .05, shoe, q);
        } else {
          P("Capsule", { height: .3, radius: .11, tessellation: 12 }, 0, -.2, 0, bottom, q);               // trousers
          P("Box", { width: .22, height: .14, depth: .34 }, 0, -.46, .05, shoe, q);
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
      h.g.position.y = Math.abs(Math.cos(h.ph)) * .04 * k;
    }

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(engine.getDeltaTime() / 1000, .05);
      autos.forEach(h => { if (!h.root.isDisposed()) walk(h, h.sp || 0, dt); });
    });

    window.AccraFigure = { human, walk, MAT };

    if (window.AccraAssets) {
      window.AccraAssets.createCharacter = (scn, o) => {
        const h = human(o);
        autos.push(h);
        return { root: h.root, setMoving: v => { h.sp = v ? 3 : 0; } };
      };
    }

    if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();

    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).figure = 1;
    console.log("Accra cartoon figure ready");
  } catch (err) { console.error("accra-figure failed:", err); }
})();
