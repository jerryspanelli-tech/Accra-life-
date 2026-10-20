/* accra-highway.js - streetlights down the middle of the highway to Kumasi.
 * One pole every 40 m, with a crossbar and two bulbs: one bulb over each carriageway.
 * The highway centre matches accra-world.js (x = hx(z)). The lights are grouped in 400 m sections, and only
 * the sections near the player are drawn, so the lights do not slow the game down. */
(function () {
  try {
    const B = BABYLON;
    const DRIFT = -2400, END = -24500;
    const S = t => t * t * (3 - 2 * t);
    const hx = z => DRIFT * S(Math.min(1, Math.max(0, (-z - 165) / (-END - 165))));   // highway centre line
    const SPACING = 40, SECTION = 400, LIGHT_RANGE = 450, POLE_H = 9, BULB_OFFSET = 5.5;

    // source meshes; every light is an instance of these, so they are cheap to draw
    const pole = B.MeshBuilder.CreateCylinder("hw_pole", { diameter: .3, height: POLE_H, tessellation: 6 }, scene);
    pole.material = mat("#8c949c"); pole.isVisible = false;
    const bar = B.MeshBuilder.CreateBox("hw_bar", { width: BULB_OFFSET * 2 + .6, height: .2, depth: .2 }, scene);
    bar.material = mat("#8c949c"); bar.isVisible = false;
    const bulb = B.MeshBuilder.CreateSphere("hw_bulb", { diameter: .5, segments: 6 }, scene);
    const bulbM = new B.StandardMaterial("hw_bulbM", scene);
    bulbM.emissiveColor = B.Color3.FromHexString("#fff2c4"); bulbM.diffuseColor = B.Color3.Black();
    bulb.material = bulbM; bulb.isVisible = false;

    // build the lights section by section, going south from the city to Kumasi
    const sections = [];
    for (let z0 = -150; z0 > END; z0 -= SECTION) {
      const z1 = Math.max(z0 - SECTION, END);
      const node = new B.TransformNode("hw_section", scene);
      for (let z = z0; z > z1; z -= SPACING) {
        const x = hx(z);
        const p = pole.createInstance("hw_p"); p.parent = node; p.position.set(x, POLE_H / 2, z); p.isPickable = false;
        const b = bar.createInstance("hw_b"); b.parent = node; b.position.set(x, POLE_H - .2, z); b.isPickable = false;
        [-BULB_OFFSET, BULB_OFFSET].forEach(o => {                         // one bulb for each carriageway
          const u = bulb.createInstance("hw_u"); u.parent = node; u.position.set(x + o, POLE_H - .6, z); u.isPickable = false;
        });
      }
      node.setEnabled(false);
      sections.push({ node, cz: (z0 + z1) / 2 });
    }

    // show only the sections near the camera (which follows the player or the car)
    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      if (++tick % 15) return;
      if (typeof camT === "undefined") return;
      const z = camT.position.z;
      sections.forEach(s => s.node.setEnabled(Math.abs(s.cz - z) < LIGHT_RANGE));
    });

    window.ACCRA_HIGHWAY_LIGHTS = { sections: sections.length, spacing: SPACING };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).highwayLights = 1;
    console.log("Highway streetlights ready:", sections.length, "sections");
  } catch (err) { console.error("accra-highway failed:", err); }
})();
