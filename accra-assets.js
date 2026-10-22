/* accra-assets.js — low-poly Accra-style assets for Babylon.js
 *
 * const hero = AccraAssets.createCharacter(scene, { shirt: "#e8b923" });
 * hero.root.position.set(0, 0, 0);   // move this
 * hero.setMoving(true);              // walk animation on/off
 *
 * AccraAssets.createHouse(scene, { position: [10,0,5], wall: "#f2c14e" });
 * AccraAssets.createKiosk(scene, { position: [4,0,2] });
 * AccraAssets.createTrotro(scene, { position: [0,0,0] });
 * AccraAssets.createTree(scene, { type: "palm", position: [3,0,3] });
 *
 * Everything faces +Z. Rotate with rotY (radians) in options.
 */
(function (global) {
  const B = BABYLON;

  // ---------- helpers ----------
  function getMat(scene, hex) {
    scene._accraMats = scene._accraMats || {};
    if (!scene._accraMats[hex]) {
      const m = new B.StandardMaterial("acc_" + hex, scene);
      m.diffuseColor = B.Color3.FromHexString(hex);
      m.specularColor = B.Color3.Black();
      scene._accraMats[hex] = m;
    }
    return scene._accraMats[hex];
  }
  function flat(mesh) { mesh.convertToFlatShadedMesh(); return mesh; }
  function node(scene, parent, x, y, z, ry) {
    const n = new B.TransformNode("n", scene);
    n.parent = parent; n.position.set(x || 0, y || 0, z || 0); n.rotation.y = ry || 0;
    return n;
  }
  function box(scene, parent, w, h, d, hex, x, y, z) {
    const m = B.MeshBuilder.CreateBox("b", { width: w, height: h, depth: d }, scene);
    m.material = getMat(scene, hex); m.parent = parent; m.position.set(x, y, z);
    return m;
  }
  function cyl(scene, parent, dTop, dBot, h, tess, hex, x, y, z) {
    const m = B.MeshBuilder.CreateCylinder("c", { diameterTop: dTop, diameterBottom: dBot, height: h, tessellation: tess }, scene);
    flat(m); m.material = getMat(scene, hex); m.parent = parent; m.position.set(x, y, z);
    return m;
  }
  function placeRoot(scene, name, o) {
    const r = new B.TransformNode(name, scene);
    r.position = new B.Vector3(...(o.position || [0, 0, 0]));
    r.rotation.y = o.rotY || 0;
    return r;
  }

  // ---------- CHARACTER ----------
  function createCharacter(scene, o) {
    o = Object.assign({
      skin: "#8d5a3b", hair: "#1b1b1b", shirt: "#e8b923",
      pants: "#2d4a7a", shoes: "#222222", kente: true, scale: 1
    }, o);
    const root = new B.TransformNode("character", scene);
    root.scaling.setAll(o.scale);
    const body = node(scene, root, 0, 0, 0);

    // torso + Ghana-colour sash
    box(scene, body, 0.72, 0.78, 0.4, o.shirt, 0, 1.3, 0);
    if (o.kente) {
      box(scene, body, 0.74, 0.1, 0.42, "#c8102e", 0, 1.02, 0);
      box(scene, body, 0.74, 0.1, 0.42, "#006b3f", 0, 0.92, 0);
    }
    // head, hair, eyes
    const head = B.MeshBuilder.CreateSphere("head", { diameter: 0.52, segments: 6 }, scene);
    flat(head); head.material = getMat(scene, o.skin); head.parent = body;
    head.position.set(0, 1.9, 0); head.scaling.y = 1.05;
    const hair = B.MeshBuilder.CreateSphere("hair", { diameter: 0.56, segments: 6 }, scene);
    flat(hair); hair.material = getMat(scene, o.hair); hair.parent = body;
    hair.position.set(0, 2.03, -0.02); hair.scaling.y = 0.55;
    box(scene, body, 0.07, 0.07, 0.05, "#111111", -0.11, 1.92, 0.24);
    box(scene, body, 0.07, 0.07, 0.05, "#111111", 0.11, 1.92, 0.24);

    // arms (pivot at shoulder) and legs (pivot at hip)
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const a = node(scene, body, s * 0.49, 1.62, 0);
      box(scene, a, 0.2, 0.32, 0.22, o.shirt, 0, -0.16, 0);
      box(scene, a, 0.17, 0.4, 0.2, o.skin, 0, -0.52, 0);
      arms.push(a);
      const l = node(scene, root, s * 0.18, 0.88, 0);
      box(scene, l, 0.28, 0.62, 0.3, o.pants, 0, -0.31, 0);
      box(scene, l, 0.3, 0.2, 0.42, o.shoes, 0, -0.78, 0.06);
      legs.push(l);
    });

    // walk cycle
    const state = { moving: false };
    let phase = 0, amp = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      amp += ((state.moving ? 1 : 0) - amp) * Math.min(1, dt * 10);
      if (state.moving) phase += dt * 11;
      const sw = Math.sin(phase) * 0.75 * amp;
      legs[0].rotation.x = sw;  legs[1].rotation.x = -sw;
      arms[0].rotation.x = -sw; arms[1].rotation.x = sw;
      body.position.y = Math.abs(Math.cos(phase)) * 0.06 * amp;
    });
    return { root, setMoving: v => { state.moving = !!v; } };
  }

  // ---------- HOUSE ----------
  function createHouse(scene, o) {
    o = Object.assign({
      w: 8, d: 7, h: 3.2, wall: "#f2c14e", trim: "#ffffff", roof: "#b5472c",
      roofStyle: "pitched", // "pitched" (tin roof) or "flat" (concrete + water tank)
      door: "#6b3f1e", porch: true, position: [0, 0, 0], rotY: 0
    }, o);
    const root = placeRoot(scene, "house", o);
    const { w, d, h } = o;

    box(scene, root, w, h, d, o.wall, 0, h / 2, 0);
    box(scene, root, w + 0.2, 0.5, d + 0.2, "#7a7468", 0, 0.25, 0); // plinth

    function win(x, y, z, ry) {
      const n = node(scene, root, x, y, z, ry);
      box(scene, n, 1.4, 1.2, 0.1, o.trim, 0, 0, 0.02);
      box(scene, n, 1.15, 0.95, 0.12, "#3b6a8f", 0, 0, 0.04);
      box(scene, n, 1.15, 0.08, 0.14, o.trim, 0, 0, 0.05);
    }
    win(-w * 0.3, h * 0.6, d / 2, 0);
    win(w * 0.3, h * 0.6, d / 2, 0);
    win(w / 2, h * 0.6, 0, Math.PI / 2);
    win(-w / 2, h * 0.6, 0, -Math.PI / 2);
    win(0, h * 0.6, -d / 2, Math.PI);

    // door
    const dn = node(scene, root, 0, 0, d / 2);
    box(scene, dn, 1.4, 2.4, 0.1, o.trim, 0, 1.2, 0.02);
    box(scene, dn, 1.15, 2.25, 0.12, o.door, 0, 1.13, 0.04);
    box(scene, dn, 0.1, 0.1, 0.16, "#e0b030", 0.4, 1.1, 0.06);

    if (o.porch) {
      box(scene, root, 3, 0.2, 1.8, "#bdb7aa", 0, 0.1, d / 2 + 0.9);
      box(scene, root, 3.2, 0.12, 1.9, o.roof, 0, h - 0.3, d / 2 + 0.95);
      box(scene, root, 0.14, h - 0.5, 0.14, o.trim, -1.4, (h - 0.5) / 2 + 0.2, d / 2 + 1.7);
      box(scene, root, 0.14, h - 0.5, 0.14, o.trim, 1.4, (h - 0.5) / 2 + 0.2, d / 2 + 1.7);
    }

    if (o.roofStyle === "pitched") {
      // triangular prism = 3-sided cylinder, rotated so the apex points up
      const rh = w * 0.22, sx = rh / 1.5, sy = (w + 1.2) / Math.sqrt(3);
      const gp = new B.TransformNode("roof", scene);
      gp.parent = root; gp.rotation.z = Math.PI / 2; gp.scaling.set(sx, sy, 1);
      gp.position.y = h + 0.5 * sx;
      const prism = flat(B.MeshBuilder.CreateCylinder("rp", { diameter: 2, tessellation: 3, height: d + 1.2 }, scene));
      prism.rotation.x = Math.PI / 2; prism.parent = gp; prism.material = getMat(scene, o.roof);
    } else {
      box(scene, root, w + 0.3, 0.3, d + 0.3, "#9a9a94", 0, h + 0.15, 0);
      box(scene, root, 1.4, 0.8, 1.4, "#6e6a60", w * 0.25, h + 0.7, -d * 0.2); // stand
      cyl(scene, root, 1.2, 1.2, 1.1, 10, "#1f2a33", w * 0.25, h + 1.65, -d * 0.2); // water tank
    }
    return root;
  }

  // ---------- KIOSK / CONTAINER SHOP ----------
  function createKiosk(scene, o) {
    o = Object.assign({ color: "#d9382c", awning: "#ffd23f", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "kiosk", o);
    box(scene, root, 2.8, 2.4, 2.4, o.color, 0, 1.2, 0);
    box(scene, root, 1.8, 0.9, 0.1, "#1d2733", 0, 1.55, 1.2);       // serving window
    box(scene, root, 2.2, 0.12, 0.6, "#8a5a2b", 0, 1.05, 1.5);       // counter
    ["#e8453c", "#4caf50", "#ffd23f"].forEach((c, i) => box(scene, root, 0.3, 0.3, 0.3, c, -0.6 + i * 0.6, 1.26, 1.5));
    const aw = node(scene, root, 0, 2.45, 1.7);
    aw.rotation.x = 0.35;
    for (let i = 0; i < 6; i++) box(scene, aw, 0.5, 0.08, 1.5, i % 2 ? "#ffffff" : o.awning, -1.25 + i * 0.5, 0, 0);
    return root;
  }

  // ---------- TROTRO (minibus) ----------
  // ---------- CARS: body shapes from real side profiles, with details that make each one read as its real kind ----------
  // Each car is built along +X (front at +X). rotY turns it. body = side profile [x, height] extruded across the width.
  const CAR = {
    sedan:       { w: 1.9, wheelX: 1.45, wheelDia: .72, paint: "#2c6e8c", body: [[-2.2,.5],[2.2,.5],[2.3,.85],[1.9,.95],[1.1,1.55],[-.9,1.55],[-1.6,1.0],[-2.2,.95]], glass: [[-1.5,1.02],[-.9,1.48],[1.0,1.48],[1.6,1.02]] },
    taxi:        { w: 1.9, wheelX: 1.45, wheelDia: .72, paint: "#fcd116", taxi: true, body: [[-2.2,.5],[2.2,.5],[2.3,.85],[1.9,.95],[1.1,1.55],[-.9,1.55],[-1.6,1.0],[-2.2,.95]], glass: [[-1.5,1.02],[-.9,1.48],[1.0,1.48],[1.6,1.02]] },
    hatch:       { w: 1.8, wheelX: 1.3, wheelDia: .72, paint: "#e6e9ec", body: [[-2.0,.45],[2.0,.45],[2.0,.9],[1.3,1.0],[.5,1.45],[-.9,1.45],[-1.9,.95],[-2.0,.9]], glass: [[-1.85,.98],[-.9,1.42],[.5,1.42],[1.25,1.0]] },
    sports:      { w: 1.9, wheelX: 1.4, wheelDia: .72, paint: "#c0392b", body: [[-2.2,.35],[2.3,.35],[2.3,.7],[1.2,.8],[.2,1.12],[-.8,1.12],[-1.8,.82],[-2.2,.75]], glass: [[-.9,.85],[.2,1.08],[.9,1.08],[1.25,.85]] },
    bugatti:     { w: 2.1, wheelX: 1.5, wheelDia: .8, paint: "#0b3d91", wedge: true, body: [[-2.4,.35],[2.4,.35],[2.4,.6],[1.2,.75],[.3,1.05],[-1.2,1.0],[-2.4,.7]], glass: [[-.8,.8],[.2,1.0],[.9,1.0],[1.0,.8]] },
    suv:         { w: 2.0, wheelX: 1.5, wheelDia: .8, paint: "#3a3d44", body: [[-2.3,.5],[2.3,.5],[2.3,1.0],[2.15,1.85],[-1.3,1.85],[-2.3,1.2]], glass: [[-2.1,1.2],[-1.2,1.78],[2.0,1.78],[2.05,1.2]] },
    jeep:        { w: 2.0, wheelX: 1.5, wheelDia: .9, paint: "#4f6b3a", boxy: true, roofRack: true, spare: true, body: [[-2.3,.7],[2.3,.7],[2.3,1.4],[2.0,2.1],[-1.6,2.1],[-2.3,1.4]], glass: [[-2.1,1.45],[-1.5,2.0],[1.8,2.0],[2.05,1.45]] },
    landcruiser: { w: 2.1, wheelX: 1.6, wheelDia: .95, paint: "#f2f2f0", boxy: true, roofRack: true, spare: true, body: [[-2.6,.7],[2.6,.7],[2.6,1.5],[2.3,2.3],[-1.9,2.3],[-2.6,1.5]], glass: [[-2.4,1.55],[-1.8,2.2],[2.1,2.2],[2.35,1.55]] },
    pickup:      { w: 2.0, wheelX: 1.5, wheelDia: .8, paint: "#f2c230", body: [[-2.3,.5],[2.3,.5],[2.3,.95],[.25,.95],[.15,1.45],[-1.0,1.45],[-1.1,.95],[-2.3,.95]], glass: [[-.95,1.0],[-.85,1.4],[.1,1.4],[.2,1.0]] },
    minibus:     { w: 2.0, wheelX: 1.9, wheelDia: .8, paint: "#f2f2f0", minibus: true, body: [[-2.6,.5],[2.6,.5],[2.6,1.5],[2.4,2.5],[-2.4,2.5],[-2.6,1.5]], glass: [[-2.4,1.6],[2.2,1.6],[2.2,2.35],[-2.4,2.35]] },
    bus:         { w: 2.5, wheelX: 2.9, wheelDia: .9, paint: "#1f5c9a", bus: true, body: [[-4.6,.6],[4.6,.6],[4.6,2.9],[4.3,3.4],[-4.3,3.4],[-4.6,2.9]], glass: [[-4.4,2.0],[4.4,2.0],[4.4,3.0],[-4.4,3.0]] },
    trotro:      { w: 2.1, wheelX: 1.5, wheelDia: .72, paint: "#f2c230", minibus: true, body: [[-2.4,.45],[2.4,.45],[2.4,1.2],[2.1,1.9],[-2.4,1.9]], glass: [[-2.3,1.25],[-2.3,1.82],[1.9,1.82],[2.05,1.25]] }
  };

  function createCar(scene, type, o) {
    o = Object.assign({ position: [0, 0, 0], rotY: 0, color: null, stripe: null }, o || {});
    const d = CAR[type] || CAR.sedan;
    const root = new B.TransformNode("car_" + type, scene);
    root.position = new B.Vector3(...o.position); root.rotation.y = o.rotY;
    const paint = mat(o.color || d.paint);
    const glass = mat("#14202a"), tyre = mat("#121212"), hub = mat("#c9ccd1");
    const dark = mat("#1a1a1a"), chrome = mat("#d6dade"), stripeM = mat(o.stripe || "#c8102e"), plate = mat("#f7f7f2");
    const lit = hex => { const m = new B.StandardMaterial("lit" + hex + Math.random(), scene); m.diffuseColor = B.Color3.FromHexString(hex); m.emissiveColor = B.Color3.FromHexString(hex); return m; };
    const lampW = lit("#fff6d6"), lampR = lit("#ff2a2a");
    const half = d.w / 2;
    const frontX = Math.max(...d.body.map(p => p[0])), rearX = Math.min(...d.body.map(p => p[0]));
    const topY = Math.max(...d.body.map(p => p[1]));
    const put = (w, h, dd, x, y, z, m, rz) => {
      const b = B.MeshBuilder.CreateBox("cp", { width: w, height: h, depth: dd }, scene);
      b.position.set(x, y, z); b.material = m; b.parent = root; b.isPickable = false; if (rz) b.rotation.z = rz; return b;
    };
    const ext = (shape, path, m) => {
      const x = B.MeshBuilder.ExtrudeShape("cx", { shape, path, cap: B.Mesh.CAP_ALL, closeShape: true }, scene);
      x.material = m; x.parent = root; x.isPickable = false; return x;
    };

    // body
    const body = ext(d.body.map(p => new B.Vector3(p[0], p[1], 0)), [new B.Vector3(0, 0, -half), new B.Vector3(0, 0, half)], paint);
    body.checkCollisions = true; if (typeof sg !== "undefined") sg.addShadowCaster(body);

    // glass: one dark tinted skin that follows the cabin outline and sits flush with the paint
    const G = d.glass;
    ext(G.map(p => new B.Vector3(p[0], p[1], 0)), [new B.Vector3(0, 0, -half - .012), new B.Vector3(0, 0, half + .012)], glass);

    // stripes and type details
    if (d.bus) {
      put(9, .22, half + .04, 0, 1.25, 0, stripeM);
      put(.1, 1.2, 1.9, frontX + .02, 2.6, 0, dark);                                   // destination board
      put(.2, .5, 2.0, frontX + .02, 1.6, 0, chrome);                                  // grille
    } else if (d.minibus) {
      put(d.body[1][0] * 2 - 1, .2, half + .04, 0, 1.0, 0, stripeM);
      put(.1, .4, 1.4, frontX + .02, 1.3, 0, dark);                                    // grille
      if (type === "trotro") put(.1, .3, 1.4, frontX + .02, 2.2, 0, mat(o.stripe || "#006b3f"));
    } else if (d.wedge) {
      put(.1, .42, 1.6, frontX + .03, .8, 0, dark);                                    // horseshoe grille
      put(.25, .12, 1.9, rearX + .1, 1.25, 0, dark);                                   // rear wing
      [-1, 1].forEach(s => put(.1, .3, .1, rearX + .2, 1.05, s * .8, dark));
    } else if (d.boxy) {
      put(.12, .65, 1.5, frontX + .02, 1.1, 0, chrome);                                // square grille
      if (d.roofRack) { put(3.2, .1, 1.7, 0, topY + .05, 0, dark); [-1, 1].forEach(s => put(.1, .12, 3.2, 0, topY - .05, s * .8, dark)); }
      if (d.spare) { const sp = B.MeshBuilder.CreateCylinder("spare", { diameter: d.wheelDia, height: .3, tessellation: 12 }, scene); sp.rotation.x = Math.PI / 2; sp.position.set(rearX - .25, 1.2, 0); sp.material = tyre; sp.parent = root; sp.isPickable = false; }
    } else {
      put(.1, .32, half * .6, frontX + .03, .72, 0, chrome);                           // grille
    }
    if (o.taxi || d.taxi) { put(.9, .3, .9, 0, topY + .3, 0, mat("#fcd116")); put(.9, .08, .9, 0, topY + .47, 0, dark); }

    // number plates (white, so they read at a distance), mirrors (dark), headlights and tail lights (bright)
    put(.04, .22, .5, frontX + .03, .55, 0, plate);
    put(.04, .22, .5, rearX - .03, .55, 0, plate);
    const mirrorX = G[G.length - 1][0] - .15, mirrorY = G[G.length - 1][1] - .25;
    [-1, 1].forEach(s => {
      put(.2, .16, .14, mirrorX, mirrorY, s * (half + .14), dark);                       // side mirrors
      put(.1, .22, .34, frontX - .02, .8, s * (half - .3), lampW);                       // headlights
      put(.1, .22, .34, rearX + .02, .8, s * (half - .3), lampR);                        // tail lights
      put(.18, .16, .3, frontX + .06, .42, s * (half - .3), dark);                       // front bumper corners
    });
    put(.22, .26, half * 2 + .08, frontX + .05, .42, 0, dark);                          // bumpers
    put(.22, .26, half * 2 + .08, rearX - .05, .42, 0, dark);

    // wheels: dark tyres with silver hubs, set just outside the body
    const wd = d.wheelDia || .72;
    [[-d.wheelX, .36, half + .03], [d.wheelX, .36, half + .03], [-d.wheelX, .36, -half - .03], [d.wheelX, .36, -half - .03]].forEach(p => {
      const t = B.MeshBuilder.CreateCylinder("wh", { diameter: wd, height: .3, tessellation: 12 }, scene);
      t.rotation.x = Math.PI / 2; t.position.set(...p); t.material = tyre; t.parent = root; t.isPickable = false;
      const h = B.MeshBuilder.CreateCylinder("hb", { diameter: wd * .45, height: .32, tessellation: 8 }, scene);
      h.rotation.x = Math.PI / 2; h.position.set(...p); h.material = hub; h.parent = root; h.isPickable = false;
    });
    return root;
  }
  function createTrotro(scene, o) { return createCar(scene, "trotro", o); }

  // ---------- TREES ----------
  function createTree(scene, o) {
    o = Object.assign({ type: "palm", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "tree", o);
    if (o.type === "palm") {
      cyl(scene, root, 0.25, 0.42, 5, 6, "#7a5230", 0, 2.5, 0);
      const top = node(scene, root, 0, 5, 0);
      for (let i = 0; i < 7; i++) {
        const p = node(scene, top, 0, 0, 0, (i / 7) * Math.PI * 2);
        const t = node(scene, p, 0, 0, 0); t.rotation.x = 0.55;
        box(scene, t, 0.5, 0.06, 2.6, i % 2 ? "#2f8f3a" : "#3aa046", 0, 0, 1.3);
      }
      box(scene, top, 0.3, 0.3, 0.3, "#5a3a1a", 0, -0.1, 0); // coconuts
    } else { // neem / shade tree
      cyl(scene, root, 0.35, 0.55, 2.6, 6, "#6b4a2b", 0, 1.3, 0);
      [[0, 3.6, 0, 3.4], [1.2, 3.2, 0.4, 2.2], [-1.1, 3.3, -0.5, 2.4]].forEach(c => {
        const s = flat(B.MeshBuilder.CreateIcoSphere("crown", { radius: c[3] / 2, subdivisions: 1 }, scene));
        s.material = getMat(scene, "#3f9a45"); s.parent = root; s.position.set(c[0], c[1], c[2]);
      });
    }
    return root;
  }

  global.AccraAssets = { createCharacter, createHouse, createKiosk, createTrotro, createTree, createCar };
})(window);
