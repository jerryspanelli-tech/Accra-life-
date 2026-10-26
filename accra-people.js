/* accra-people.js - Loads 3D models and procedurally animates the bones */
(function () {
  try {
    const B = BABYLON;
    const folder = new URL("./", window.location.href).href + "People/";
    const HEIGHT = 1.8;
    let base = null;
    const people = [];
    let idCount = 0;

    async function load() {
      try {
        const cont = await B.SceneLoader.LoadAssetContainerAsync(folder, "Superhero_Male_FullBody.gltf", scene);
        base = cont;
        console.log("People loaded: Superhero model.");
        if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
      } catch (err) {
        console.error("3D Model Failed:", err);
      }
    }

    function spawn(parent) {
      const id = ++idCount;
      const inst = base.instantiateModelsToScene(n => n + "_person" + id, true);
      const root = new B.TransformNode("person_root" + id, scene);
      root.parent = parent;
      inst.rootNodes[0].parent = root;
      
      const bb = inst.rootNodes[0].getHierarchyBoundingVectors ? inst.rootNodes[0].getHierarchyBoundingVectors(true) : null;
      const s = bb ? HEIGHT / Math.max(bb.max.y - bb.min.y, .001) : .01;
      inst.rootNodes[0].scaling.setAll(s);
      inst.rootNodes[0].position.set(0, bb ? -bb.min.y * s : 0, 0);

      const person = { root, last: root.getAbsolutePosition().clone(), speed: 0, sp: 0 };
      
      // Find the bones for animation
      const skel = inst.skeletons[0];
      if (skel) {
        person.thighL = skel.bones.find(b => b.name.toLowerCase() === "thigh_l");
        person.thighR = skel.bones.find(b => b.name.toLowerCase() === "thigh_r");
        person.armL = skel.bones.find(b => b.name.toLowerCase() === "upperarm_l");
        person.armR = skel.bones.find(b => b.name.toLowerCase() === "upperarm_r");
      }

      people.push(person);
      return person;
    }

    // --- PROCEDURAL WALK ANIMATION ---
    let animTime = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.max(engine.getDeltaTime() / 1000, .001);
      animTime += dt * 8; // Speed of the walk cycle

      people.forEach(p => {
        if (!p.root || p.root.isDisposed()) return;
        const now = p.root.getAbsolutePosition();
        p.speed = Math.hypot(now.x - p.last.x, now.z - p.last.z) / dt;
        p.last = now.clone();

        const moving = p.speed > 0.5;
        const swing = moving ? Math.sin(animTime) * 0.5 : 0;

        // Rotate the bones if they exist
        if (p.thighL && p.thighR) {
          p.thighL.rotationQuaternion = B.Quaternion.RotationYawPitchRoll(swing, 0, 0);
          p.thighR.rotationQuaternion = B.Quaternion.RotationYawPitchRoll(-swing, 0, 0);
        }
        if (p.armL && p.armR) {
          p.armL.rotationQuaternion = B.Quaternion.RotationYawPitchRoll(-swing, 0, 0);
          p.armR.rotationQuaternion = B.Quaternion.RotationYawPitchRoll(swing, 0, 0);
        }
      });
    });

    if (window.AccraFigure) {
      const cartoon = window.AccraFigure.human;
      window.AccraFigure.human = function (opt) {
        const c = cartoon(opt);
        if (!base) return c;
        const cartoonMeshes = c.root.getChildMeshes(false).slice();
        const s = spawn(c.root);
        cartoonMeshes.forEach(m => { if (m && !m.isDisposed()) m.dispose(); });
        return Object.assign(c, { root: s.root, sp: 0, person: s, outfit: "glb" });
      };
    }

    load();
    window.ACCRA_PEOPLE = { spawn, ready: () => !!base, count: () => people.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).people = 1;
  } catch (err) { console.error("accra-people failed:", err); }
})();
