/* accra-assets.js — Stylized 3D Character & Asset System for Accra Life */
(function (global) {
  const B = BABYLON;

  function getMat(scene, hex) {
    scene._accraMats = scene._accraMats || {};
    if (!scene._accraMats[hex]) {
      const m = new B.StandardMaterial("acc_" + hex, scene);
      m.diffuseColor = B.Color3.FromHexString(hex);
      m.specularColor = new B.Color3(0.1, 0.1, 0.1);
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

  function placeRoot(scene, name, o) {
    const r = new B.TransformNode(name, scene);
    r.position = new B.Vector3(...(o.position || [0, 0, 0]));
    r.rotation.y = o.rotY || 0;
    return r;
  }

  // ---------- STYLIZED AVATAR MODEL ----------
  function createCharacter(scene, o) {
    o = Object.assign({
      skin: "#c68b59", hair: "#111111", shirt: "#ffffff",
      pants: "#ffffff", shoes: "#d0c4b4", headband: "#ffffff", chain: true, scale: 1
    }, o);

    const root = new B.TransformNode("character", scene);
    root.scaling.setAll(o.scale);
    const body = node(scene, root, 0, 0, 0);

    // Torso & Outfit
    const torso = B.MeshBuilder.CreateCapsule("torso", { height: 0.75, radius: 0.27 }, scene);
    torso.material = getMat(scene, o.shirt); torso.parent = body; torso.position.set(0, 1.35, 0);

    // Gold chain necklace option
    if (o.chain) {
      const chain = B.MeshBuilder.CreateTorus("chain", { diameter: 0.32, thickness: 0.04, tessellation: 12 }, scene);
      chain.material = getMat(scene, "#ffd700"); chain.parent = body; chain.position.set(0, 1.62, 0.02); chain.rotation.x = Math.PI / 2;
    }

    // Head & Facial Structure
    const head = B.MeshBuilder.CreateSphere("head", { diameter: 0.48, segments: 12 }, scene);
    head.material = getMat(scene, o.skin); head.parent = body;
    head.position.set(0, 1.9, 0); head.scaling.y = 1.12;

    // Headband
    const hband = B.MeshBuilder.CreateBox("hband", { width: 0.5, height: 0.08, depth: 0.5 }, scene);
    hband.material = getMat(scene, o.headband); hband.parent = body; hband.position.set(0, 2.02, 0);

    // Stylized Dreads / Locs hanging down
    for (let i = 0; i < 6; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2;
      const loc = B.MeshBuilder.CreateCylinder("loc", { diameter: 0.06, height: 0.55 }, scene);
      loc.material = getMat(scene, o.hair); loc.parent = body;
      loc.position.set(Math.sin(angle) * 0.22, 1.82, Math.cos(angle) * 0.18 - 0.05);
      loc.rotation.z = Math.sin(angle) * 0.3;
    }

    // Eyes
    [-0.09, 0.09].forEach(x => box(scene, body, 0.05, 0.04, 0.03, "#111111", x, 1.92, 0.23));

    // Arms & Pants
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const a = node(scene, body, s * 0.36, 1.65, 0);
      const armMesh = B.MeshBuilder.CreateCapsule("arm", { height: 0.58, radius: 0.1 }, scene);
      armMesh.material = getMat(scene, o.shirt); armMesh.parent = a; armMesh.position.set(0, -0.28, 0);
      arms.push(a);

      const l = node(scene, root, s * 0.15, 0.9, 0);
      const legMesh = B.MeshBuilder.CreateCapsule("leg", { height: 0.68, radius: 0.12 }, scene);
      legMesh.material = getMat(scene, o.pants); legMesh.parent = l; legMesh.position.set(0, -0.34, 0);
      
      const shoe = B.MeshBuilder.CreateBox("shoe", { width: 0.2, height: 0.14, depth: 0.34 }, scene);
      shoe.material = getMat(scene, o.shoes); shoe.parent = l; shoe.position.set(0, -0.7, 0.05);
      legs.push(l);
    });

    // Walk animation cycle
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

  // ---------- STANDARD ASSETS ----------
  function createHouse(scene, o) {
    o = Object.assign({ w: 8, d: 7, h: 3.2, wall: "#f2c14e", roof: "#b5472c", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "house", o);
    box(scene, root, o.w, o.h, o.d, o.wall, 0, o.h / 2, 0);
    return root;
  }

  function createKiosk(scene, o) {
    o = Object.assign({ color: "#d9382c", position: [0, 0, 0], rotY: 0 }, o);
    const root = placeRoot(scene, "kiosk", o);
    box(scene, root, 2.8, 2.4, 2.4, o.color, 0, 1.2, 0);
    return root;
  }

  function createCar(scene, type, o) {
    o = Object.assign({ position: [0, 0, 0], rotY: 0, color: "#2c6e8c" }, o || {});
    const root = placeRoot(scene, "car", o);
    box(scene, root, 4.4, 1.1, 1.9, o.color, 0, 0.55, 0);
    return root;
  }

  function createTrotro(scene, o) { return createCar(scene, "trotro", o); }
  function createTree(scene, o) { return placeRoot(scene, "tree", o); }

  global.AccraAssets = { createCharacter, createHouse, createKiosk, createTrotro, createTree, createCar };
})(window);
