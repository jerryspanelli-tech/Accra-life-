/* accra-highway.js - streetlights down the middle of the highway to Kumasi.
 * One pole every 40 m, with a crossbar and two bulbs (one over each carriageway).
 * Highway centre matches accra-world.js (x = hx(z)).
 * Lights are grouped in 400 m sections. Only nearby sections (and their real lights)
 * are enabled so performance stays high. */
(function () {
  try {
    const B = BABYLON;
    const DRIFT = -2400;
    const END   = -24500;
    const S = t => t * t * (3 - 2 * t);
    const hx = z => DRIFT * S(Math.min(1, Math.max(0, (-z - 165) / (-END - 165))));

    const SPACING     = 40;
    const SECTION     = 400;
    const LIGHT_RANGE = 480;          // how far ahead/behind we keep sections alive
    const POLE_H      = 9;
    const BULB_OFFSET = 5.5;
    const LIGHT_INTENSITY = 1.8;      // PointLight intensity
    const LIGHT_RANGE_M   = 28;       // how far each lamp actually illuminates

    // ---------- helpers ----------
    const makeMat = (hex, emissiveHex) => {
      const m = new B.StandardMaterial("hwMat_" + hex, scene);
      if (emissiveHex) {
        m.emissiveColor = B.Color3.FromHexString(emissiveHex);
        m.diffuseColor  = B.Color3.Black();
      } else {
        m.diffuseColor = B.Color3.FromHexString(hex);
      }
      m.specularColor = B.Color3.Black();
      return m;
    };

    // ---------- source meshes (instances only) ----------
    const pole = B.MeshBuilder.CreateCylinder("hw_pole", {
      diameter: 0.28, height: POLE_H, tessellation: 6
    }, scene);
    pole.material = makeMat("#8c949c");
    pole.isVisible = false;
    pole.isPickable = false;

    const bar = B.MeshBuilder.CreateBox("hw_bar", {
      width: BULB_OFFSET * 2 + 0.6, height: 0.18, depth: 0.18
    }, scene);
    bar.material = makeMat("#8c949c");
    bar.isVisible = false;
    bar.isPickable = false;

    const bulb = B.MeshBuilder.CreateSphere("hw_bulb", {
      diameter: 0.48, segments: 6
    }, scene);
    bulb.material = makeMat("#000000", "#fff4c8");
    bulb.isVisible = false;
    bulb.isPickable = false;

    // ---------- build sections ----------
    const sections = [];
    for (let z0 = -150; z0 > END; z0 -= SECTION) {
      const z1 = Math.max(z0 - SECTION, END);
      const node = new B.TransformNode("hw_section", scene);
      const lights = [];                     // real PointLights for this section

      for (let z = z0; z > z1; z -= SPACING) {
        const x = hx(z);

        // Pole
        const p = pole.createInstance("hw_p");
        p.parent = node;
        p.position.set(x, POLE_H / 2, z);
        p.isPickable = false;

        // Crossbar
        const b = bar.createInstance("hw_b");
        b.parent = node;
        b.position.set(x, POLE_H - 0.18, z);
        b.isPickable = false;

        // Two bulbs + one PointLight each
        [-BULB_OFFSET, BULB_OFFSET].forEach(offset => {
          const u = bulb.createInstance("hw_u");
          u.parent = node;
          u.position.set(x + offset, POLE_H - 0.55, z);
          u.isPickable = false;

          // Real light (starts disabled)
          const light = new B.PointLight("hw_l", new B.Vector3(x + offset, POLE_H - 0.7, z), scene);
          light.diffuse  = B.Color3.FromHexString("#fff2c4");
          light.specular = B.Color3.FromHexString("#fff8e0");
          light.intensity = LIGHT_INTENSITY;
          light.range = LIGHT_RANGE_M;
          light.setEnabled(false);
          light.parent = node;               // so it moves with the section
          lights.push(light);
        });
      }

      node.setEnabled(false);
      sections.push({
        node,
        lights,
        cz: (z0 + z1) / 2
      });
    }

    // ---------- enable only nearby sections + their lights ----------
    let tick = 0;
    scene.onBeforeRenderObservable.add(() => {
      if (++tick % 12) return;               // ~5 times per second is enough

      // Safe position source
      let z = 0;
      if (typeof camT !== "undefined" && camT && camT.position) {
        z = camT.position.z;
      } else if (typeof player !== "undefined" && player) {
        z = player.position.z;
      } else {
        return;
      }

      sections.forEach(s => {
        const near = Math.abs(s.cz - z) < LIGHT_RANGE;
        s.node.setEnabled(near);

        // Only turn real lights on when the section is active
        s.lights.forEach(l => l.setEnabled(near));
      });
    });

    // Public info
    window.ACCRA_HIGHWAY_LIGHTS = {
      sections: sections.length,
      spacing: SPACING,
      totalPoles: sections.reduce((n, s) => n + s.lights.length / 2, 0)
    };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).highwayLights = 1;

    console.log(
      "Highway streetlights ready:",
      sections.length, "sections •",
      window.ACCRA_HIGHWAY_LIGHTS.totalPoles, "poles"
    );
  } catch (err) {
    console.error("accra-highway failed:", err);
  }
})();
