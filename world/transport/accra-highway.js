/* accra-highway.js - streetlights down the middle of the highway to Kumasi.
 * One pole every 90 m, with a crossbar and two glowing bulbs (one over each carriageway).
 * No real PointLights: they force Safari to rebuild lighting and freeze phones.
 * Lights are grouped in 400 m sections; only sections near the player are shown. */
(function () {
  try {
    const B = BABYLON;
    const DRIFT = -2400;
    const END   = -24500;
    const S = t => t * t * (3 - 2 * t);
    const hx = z => DRIFT * S(Math.min(1, Math.max(0, (-z - 165) / (-END - 165))));

    const SPACING = 90;
    const SECTION = 400;
    const SHOW_RANGE = 480;
    const POLE_H = 9;
    const BULB_OFFSET = 5.5;
    const POOL_D = 16;

    const makeMat = (hex, emissiveHex) => {
      const m = new B.StandardMaterial("hwMat_" + hex, scene);
      if (emissiveHex) {
        m.emissiveColor = B.Color3.FromHexString(emissiveHex);
        m.diffuseColor = B.Color3.Black();
      } else {
        m.diffuseColor = B.Color3.FromHexString(hex);
      }
      m.specularColor = B.Color3.Black();
      return m;
    };

    const pole = B.MeshBuilder.CreateCylinder("hw_pole", { diameter: 0.28, height: POLE_H, tessellation: 6 }, scene);
    pole.material = makeMat("#8c949c");
    pole.isVisible = false; pole.isPickable = false;

    const bar = B.MeshBuilder.CreateBox("hw_bar", { width: BULB_OFFSET * 2 + 0.6, height: 0.18, depth: 0.18 }, scene);
    bar.material = makeMat("#8c949c");
    bar.isVisible = false; bar.isPickable = false;

    const bulb = B.MeshBuilder.CreateSphere("hw_bulb", { diameter: 0.9, segments: 8 }, scene);
    bulb.material = makeMat("#000000", "#ffffe0");
    bulb.isVisible = false; bulb.isPickable = false;

    const poolMat = new B.StandardMaterial("hwPoolMat", scene);
    poolMat.emissiveColor = B.Color3.FromHexString("#ffe9a0");
    poolMat.diffuseColor = B.Color3.Black();
    poolMat.specularColor = B.Color3.Black();
    poolMat.alpha = 0.32;
    poolMat.backFaceCulling = false;
    const pool = B.MeshBuilder.CreateDisc("hw_pool", { radius: POOL_D / 2, tessellation: 20 }, scene);
    // NOTE: no rotation set on the source — each instance gets rotated individually below.
    pool.material = poolMat;
    pool.isVisible = false; pool.isPickable = false;

    const sections = [];
    for (let z0 = -175; z0 > END; z0 -= SECTION) {
      const z1 = Math.max(z0 - SECTION, END);
      const node = new B.TransformNode("hw_section", scene);
      for (let z = z0; z > z1; z -= SPACING) {
        const x = hx(z);
        const p = pole.createInstance("hw_p");
        p.parent = node; p.position.set(x, POLE_H / 2, z); p.isPickable = false;
        const b = bar.createInstance("hw_b");
        b.parent = node; b.position.set(x, POLE_H - 0.18, z); b.isPickable = false;
        const pl = pool.createInstance("hw_pl");
        pl.parent = node;
        pl.position.set(x, 0.07, z);
        pl.rotation.x = Math.PI / 2;   // <-- rotate EACH instance so the disc lies flat
        pl.isPickable = false;
        [-BULB_OFFSET, BULB_OFFSET].forEach(off => {
          const u = bulb.createInstance("hw_u");
          u.parent = node; u.position.set(x + off, POLE_H - 0.55, z); u.isPickable = false;
        });
      }
      node.setEnabled(false);
      sections.push({ node, cz: (z0 + z1) / 2 });
    }

    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      if (++tick % 12) return;
      let z = 0;
      if (typeof camT !== "undefined" && camT && camT.position) z = camT.position.z;
      else if (typeof player !== "undefined" && player) z = player.position.z;
      else return;
      sections.forEach(s => s.node.setEnabled(Math.abs(s.cz - z) < SHOW_RANGE));
    });

    window.ACCRA_HIGHWAY_LIGHTS = { sections: sections.length, spacing: SPACING };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).highwayLights = 1;
    console.log("Highway streetlights ready:", sections.length, "sections");
  } catch (err) {
    console.error("accra-highway failed:", err);
  }
})();
