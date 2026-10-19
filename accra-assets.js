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
  // ---------- CARS: six different body shapes, shaped with real side profiles ----------
  // Each car is built along +X (front at +X). Use rotY to turn it. Shape: profile points (x, height) extruded across the width.
  const CAR = {
    sedan:   { w: 1.9, body: [[-2.2,.45],[2.2,.45],[2.25,.85],[1.5,.95],[.8,1.5],[-.7,1.5],[-1.5,.95],[-2.2,.9]], glass: [[-1.45,.95],[-.7,1.44],[.8,1.44],[1.45,.97]], wheelX: 1.45, paint: "#2c6e8c" },
    hatch:   { w: 1.8, body: [[-2.0,.45],[2.0,.45],[2.0,.9],[1.3,1.0],[.5,1.45],[-.9,1.45],[-1.9,.95],[-2.0,.9]], glass: [[-1.85,.98],[-.9,1.42],[.5,1.42],[1.25,1.0]], wheelX: 1.3, paint: "#e6e9ec" },
    suv:     { w: 2.0, body: [[-2.3,.5],[2.3,.5],[2.3,1.0],[2.15,1.85],[-1.3,1.85],[-2.3,1.2]], glass: [[-2.1,1.2],[-1.2,1.78],[2.0,1.78],[2.05,1.2]], wheelX: 1.5, paint: "#3a3d44" },
    sports:  { w: 1.9, body: [[-2.2,.35],[2.3,.35],[2.3,.7],[1.2,.8],[.2,1.12],[-.8,1.12],[-1.8,.82],[-2.2,.75]], glass: [[-.9,.85],[.2,1.08],[.9,1.08],[1.25,.85]], wheelX: 1.4, paint: "#c0392b" },
    pickup:  { w: 2.0, body: [[-2.3,.5],[2.3,.5],[2.3,.95],[.25,.95],[.15,1.45],[-1.0,1.45],[-1.1,.95],[-2.3,.95]], glass: [[-.95,1.0],[-.85,1.4],[.1,1.4],[.2,1.0]], wheelX: 1.5, paint: "#f2c230" },
    trotro:  { w: 2.1, body: [[-2.4,.45],[2.4,.45],[2.4,1.2],[2.1,1.9],[-2.4,1.9]], glass: [[-2.3,1.25],[-2.3,1.82],[1.9,1.82],[2.05,1.25]], wheelX: 1.5, paint: "#f2c230" }
  };
  function createCar(scene, type, o) {
    o = Object.assign({ position: [0, 0, 0], rotY: 0, color: null, stripe: null }, o || {});
    const d = CAR[type] || CAR.sedan, root = new BABYLON.TransformNode("car_" + type, scene);
    root.position = new BABYLON.Vector3(...o.position); root.rotation.y = o.rotY;
    const paint = mat(o.color || d.paint), glass = mat("#1d2a35"), tyre = mat("#161616"), hub = mat("#c9ccd1");
    const pts = d.body.map(p => new BABYLON.Vector3(p[0], p[1], 0));
    const path = [new BABYLON.Vector3(0, 0, -d.w / 2), new BABYLON.Vector3(0, 0, d.w / 2)];
    const body = BABYLON.MeshBuilder.ExtrudeShape("cbody", { shape: pts, path, cap: BABYLON.Mesh.CAP_ALL, closeShape: true }, scene);
    body.material = paint; body.parent = root; body.isPickable = false; body.checkCollisions = true; if (typeof sg !== "undefined") sg.addShadowCaster(body);
    const gl = BABYLON.MeshBuilder.ExtrudeShape("cglass", { shape: d.glass.map(p => new BABYLON.Vector3(p[0], p[1], 0)), path: [new BABYLON.Vector3(0, 0, -d.w / 2 - .02), new BABYLON.Vector3(0, 0, d.w / 2 + .02)], cap: BABYLON.Mesh.CAP_ALL, closeShape: true }, scene);
    gl.material = glass; gl.parent = root; gl.isPickable = false;
    if (type === "trotro") {                                                         // minibus: a row of side windows and a striped band
      const st = mat(o.stripe || "#c8102e");
      const band = BABYLON.MeshBuilder.CreateBox("band", { width: 4.7, height: .22, depth: d.w + .04 }, scene); band.position.y = .75; band.material = st; band.parent = root; band.isPickable = false;
      for (let i = -1; i <= 1; i++) { const w = BABYLON.MeshBuilder.CreateBox("sw", { width: .9, height: .6, depth: d.w + .06 }, scene); w.position.set(i * 1.25 - .2, 1.45, 0); w.material = glass; w.parent = root; w.isPickable = false; }
    }
    if (type === "pickup") { const bed = BABYLON.MeshBuilder.CreateBox("bed", { width: 1.9, height: .12, depth: d.w - .1 }, scene); bed.position.set(-1.25, .95, 0); bed.material = paint; bed.parent = root; bed.isPickable = false; }
    const lights = [[d.body[1][0] - .05, .72, d.w / 2 - .25], [d.body[1][0] - .05, .72, -d.w / 2 + .25]];   // headlights
    lights.forEach(l => { const h = BABYLON.MeshBuilder.CreateBox("hl", { width: .12, height: .18, depth: .3 }, scene); h.position.set(...l); h.material = mat("#fff6d6"); h.parent = root; h.isPickable = false; });
    // bumpers, grille and mirrors make the body easy to read as a real car
    const frontX = d.body[1][0], rearX = d.body[0][0];
    const dark = mat("#1a1a1a"), chrome = mat("#c9ccd1");
    const bump = (x, y) => { const b = BABYLON.MeshBuilder.CreateBox("bump", { width: .22, height: .26, depth: d.w + .08 }, scene); b.position.set(x, y, 0); b.material = dark; b.parent = root; b.isPickable = false; };
    bump(frontX + .05, .42); bump(rearX - .05, .42);
    const grille = BABYLON.MeshBuilder.CreateBox("grille", { width: .08, height: .3, depth: d.w * .5 }, scene); grille.position.set(frontX + .02, .72, 0); grille.material = chrome; grille.parent = root; grille.isPickable = false;
    [-1, 1].forEach(sd => { const m = BABYLON.MeshBuilder.CreateBox("mirror", { width: .18, height: .14, depth: .12 }, scene); m.position.set(frontX - .55, 1.02, sd * (d.w / 2 + .08)); m.material = paint; m.parent = root; m.isPickable = false; });
    [[-d.wheelX, .36, d.w / 2 + .03], [d.wheelX, .36, d.w / 2 + .03], [-d.wheelX, .36, -d.w / 2 - .03], [d.wheelX, .36, -d.w / 2 - .03]].forEach(p => {
      const t = BABYLON.MeshBuilder.CreateCylinder("wh", { diameter: .72, height: .3, tessellation: 12 }, scene); t.rotation.x = Math.PI / 2; t.position.set(...p); t.material = tyre; t.parent = root; t.isPickable = false;
      const hb = BABYLON.MeshBuilder.CreateCylinder("hb", { diameter: .3, height: .32, tessellation: 8 }, scene); hb.rotation.x = Math.PI / 2; hb.position.set(...p); hb.material = hub; hb.parent = root; hb.isPickable = false;
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
