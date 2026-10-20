/* accra-assets.js — Enhanced modern-style Accra assets for Babylon.js */
(function (global) {
  const B = BABYLON;

  function getMat(scene, hex) {
    scene._accraMats = scene._accraMats || {};
    if (!scene._accraMats[hex]) {
      const m = new B.StandardMaterial("acc_" + hex, scene);
      m.diffuseColor = B.Color3.FromHexString(hex);
      m.specularColor = new B.Color3(0.15, 0.15, 0.15);
      scene._accraMats[hex] = m;
    }
    return scene._accraMats[hex];
  }

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
    m.material = getMat(scene, hex); m.parent = parent; m.position.set(x, y, z);
    return m;
  }

  function placeRoot(scene, name, o) {
    const r = new B.TransformNode(name, scene);
    r.position = new B.Vector3(...(o.position || [0, 0, 0]));
    r.rotation.y = o.rotY || 0;
    return r;
  }

  // ---------- ENHANCED CHARACTER MODEL ----------
  function createCharacter(scene, o) {
    o = Object.assign({
      skin: "#8d5a3b", hair: "#1b1b1b", shirt: "#006b3f",
      pants: "#1a2a40", shoes: "#111111", kente: true, scale: 1
    }, o);
    const root = new B.TransformNode("character", scene);
    root.scaling.setAll(o.scale);
    const body = node(scene, root, 0, 0, 0);

    // Smoother torso using rounded cylinders/capsules for realistic proportion
    const torso = B.MeshBuilder.CreateCapsule("torso", { height: 0.8, radius: 0.28 }, scene);
    torso.material = getMat(scene, o.shirt); torso.parent = body; torso.position.set(0, 1.35, 0);
    
    if (o.kente) {
      box(scene, body, 0.6, 0.08, 0.38, "#c8102e", 0, 1.45, 0);
      box(scene, body, 0.6, 0.08, 0.38, "#ffd23f", 0, 1.25, 0);
    }

    // Detailed Head & Face
    const head = B.MeshBuilder.CreateSphere("head", { diameter: 0.5, segments: 12 }, scene);
    head.material = getMat(scene, o.skin); head.parent = body;
    head.position.set(0, 1.9, 0); head.scaling.y = 1.1;

    const hair = B.MeshBuilder.CreateSphere("hair", { diameter: 0.52, segments: 10 }, scene);
    hair.material = getMat(scene, o.hair); hair.parent = body;
    hair.position.set(0, 2.05, -0.02); hair.scaling.set(1.02, 0.6, 1.02);

    // Eyes
    [-0.1, 0.1 සඳහා].forEach(x => box(scene, body, 0.06, 0.05, 0.04, "#111111", x, 1.92, 0.23));

    // Articulated Arms & Legs
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const a = node(scene, body, s * 0.38, 1.65, 0);
      const armMesh = B.MeshBuilder.CreateCapsule("arm", { height: 0.6, radius: 0.11 }, scene);
      armMesh.material = getMat(scene, o.skin); armMesh.parent = a; armMesh.position.set(0, -0.3, 0);
      arms.push(a);

      const l = node(scene, root, s * 0.16, 0.9, 0);
      const legMesh = B.MeshBuilder.CreateCapsule("leg", { height: 0.7, radius: 0.13 }, scene);
      legMesh.material = getMat(scene, o.pants); legMesh.parent = l; legMesh.position.set(0, -0.35, 0);
      
      const shoe = B.MeshBuilder.CreateBox("shoe", { width: 0.22, height: 0.15, depth: 0.35 }, scene);
      shoe.material = getMat(scene, o.shoes); shoe.parent = l; shoe.position.set(0, -0.72, 0.06);
      legs.push(l);
    });

    // Walk cycle animation
    const state = { moving: false };
    let phase = 0, amp = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      amp += ((state.moving ? 1 : 0) - amp) * Math.min(1, dt * 10);
      if (state.moving) phase += dt * 12;
      const sw = Math.sin(phase) * 0.8 * amp;
      legs[0].rotation.x = sw;  legs[1].rotation.x = -sw;
      arms[0].rotation.x = -sw; arms[1].rotation.x = sw;
      body.position.y = Math.abs(Math.cos(phase)) * 0.08 * amp;
    });
    return { root, setMoving: v => { state.moving = !!v; } };
  }

  // ---------- HOUSE ----------
  function createHouse(scene, o) {
    o = Object.assign({
      w: 8, d: 7, h: 3.2, wall: "#f2c14e", trim: "#ffffff", roof: "#b5472c",
      roofStyle: "pitched", door: "#6b3f1e", porch: true, position: [0, 0, 0], rotY: 0
    }, o);
    const root = placeRoot(scene, "house", o);
    const { w, d, h } = o;
    box(scene, root, w, h, d, o.wall, 0, h / 2, 0);
    box(scene, root, w + 0.2, 0.5, d + 0.2, "#7a7468", 0, 0.25, 0);
    return root;
  }

  function createKiosk(scene, o) {
    o = Object.assign({ color: "#d9382c", awning: "#ffd23f", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "kiosk", o);
    box(scene, root, 2.8, 2.4, 2.4, o.color, 0, 1.2, 0);
    return root;
  }

  // ---------- ENHANCED CAR MODELS (Sleeker & Modern) ----------
  const CAR = {
    sedan:   { w: 1.9, body: [[-2.2,.45],[2.2,.45],[2.3,.85],[1.4,.98],[.7,1.45],[-.7,1.45],[-1.5,.98],[-2.2,.85]], glass: [[-1.3,.98],[-.6,1.4],[.6,1.4],[1.3,0.98]], wheelX: 1.45, paint: "#2c6e8c" },
    hatch:   { w: 1.8, body: [[-2.0,.45],[2.0,.45],[2.1,.9],[1.2,1.0],[.4,1.42],[-.9,1.42],[-1.8,.95],[-2.0,.9]], glass: [[-1.7,0.95],[-.8,1.38],[.4,1.38],[1.1,0.95]], wheelX: 1.3, paint: "#e6e9ec" },
    suv:     { w: 2.0, body: [[-2.3,.5],[2.3,.5],[2.4,1.0],[2.2,1.8],[-1.4,1.8],[-2.3,1.2]], glass: [[-2.0,1.2],[-1.2,1.72],[2.0,1.72],[2.1,1.2]], wheelX: 1.5, paint: "#3a3d44" },
    sports:  { w: 1.9, body: [[-2.2,.35],[2.3,.35],[2.4,.65],[1.1,.78],[.1,1.08],[-.9,1.08],[-1.7,.78],[-2.2,.7]], glass: [[-.8,.82],[.1,1.04],[.8,1.04],[1.1,.82]], wheelX: 1.4, paint: "#c0392b" },
    pickup:  { w: 2.0, body: [[-2.3,.5],[2.3,.5],[2.4,.95],[.25,.95],[.15,1.4],[-1.0,1.4],[-1.1,.95],[-2.3,.95]], glass: [[-.9,0.98],[-.8,1.35],[.1,1.35],[.2,0.98]], wheelX: 1.5, paint: "#f2c230" },
    trotro:  { w: 2.1, body: [[-2.4,.45],[2.4,.45],[2.5,1.2],[2.2,1.85],[-2.4,1.85]], glass: [[-2.3,1.2],[-2.3,1.78],[2.0,1.78],[2.1,1.2]], wheelX: 1.5, paint: "#f2c230" }
  };

  function createCar(scene, type, o) {
    o = Object.assign({ position: [0, 0, 0], rotY: 0, color: null, stripe: null }, o || {});
    const d = CAR[type] || CAR.sedan, root = new BABYLON.TransformNode("car_" + type, scene);
    root.position = new BABYLON.Vector3(...o.position); root.rotation.y = o.rotY;

    const paint = getMat(scene, o.color || d.paint);
    const glassMat = getMat(scene, "#10202c");
    const tyreMat = getMat(scene, "#161616");
    const hubMat = getMat(scene, "#e0e0e0");

    // Extrude main body profile for smooth, modern vehicle styling
    const pts = d.body.map(p => new BABYLON.Vector3(p[0], p[1], 0));
    const path = [new BABYLON.Vector3(0, 0, -d.w / 2), new BABYLON.Vector3(0, 0, d.w / 2)];
    const body = BABYLON.MeshBuilder.ExtrudeShape("cbody", { shape: pts, path, cap: BABYLON.Mesh.CAP_ALL, closeShape: true }, scene);
    body.material = paint; body.parent = root; body.checkCollisions = true;

    // Windshields & windows
    const gl = BABYLON.MeshBuilder.ExtrudeShape("cglass", { shape: d.glass.map(p => new BABYLON.Vector3(p[0], p[1], 0)), path: [new BABYLON.Vector3(0, 0, -d.w / 2 - .02), new BABYLON.Vector3(0, 0, d.w / 2 + .02)], cap: BABYLON.Mesh.CAP_ALL, closeShape: true }, scene);
    gl.material = glassMat; gl.parent = root;

    if (type === "trotro") {
      const st = getMat(scene, o.stripe || "#c8102e");
      const band = BABYLON.MeshBuilder.CreateBox("band", { width: 4.8, height: .24, depth: d.w + .04 }, scene);
      band.position.y = .75; band.material = st; band.parent = root;
    }

    // Modern bright headlights and red taillights
    const frontX = d.body[1][0], rearX = d.body[0][0];
    [-0.65, 0.65].forEach(z => {
      const hl = BABYLON.MeshBuilder.CreateBox("hl", { width: 0.1, height: 0.18, depth: 0.35 }, scene);
      hl.position.set(frontX - 0.02, 0.65, z); hl.material = getMat(scene, "#fff8e7"); hl.parent = root;

      const tl = BABYLON.MeshBuilder.CreateBox("tl", { width: 0.1, height: 0.18, depth: 0.35 }, scene);
      tl.position.set(rearX + 0.02, 0.65, z); tl.material = getMat(scene, "#ff2a2a"); tl.parent = root;
    });

    // Detailed Wheels & Rims
    [[-d.wheelX, .36, d.w / 2 + .03], [d.wheelX, .36, d.w / 2 + .03], [-d.wheelX, .36, -d.w / 2 - .03], [d.wheelX, .36, -d.w / 2 - .03]].forEach(p => {
      const t = BABYLON.MeshBuilder.CreateCylinder("wh", { diameter: .72, height: .3, tessellation: 16 }, scene);
      t.rotation.x = Math.PI / 2; t.position.set(...p); t.material = tyreMat; t.parent = root;
      
      const rim = BABYLON.MeshBuilder.CreateCylinder("rim", { diameter: .4, height: .32, tessellation: 10 }, scene);
      rim.rotation.x = Math.PI / 2; rim.position.set(...p); rim.material = hubMat; rim.parent = root;
    });

    return root;
  }

  function createTrotro(scene, o) { return createCar(scene, "trotro", o); }

  function createTree(scene, o) {
    o = Object.assign({ type: "palm", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "tree", o);
    cyl(scene, root, 0.25, 0.42, 5, 6, "#7a5230", 0, 2.5, 0);
    return root;
  }

  global.AccraAssets = { createCharacter, createHouse, createKiosk, createTrotro, createTree, createCar };
})(window);
