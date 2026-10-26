/* accra-people.js - Forces textures and adds manual bone animation */
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
        
        // --- FORCE TEXTURES ---
        // This manually applies the clothes and hair, bypassing the .gltf file
        cont.meshes.forEach(mesh => {
            if (mesh.name.includes("SuperHero_Male") || mesh.name.includes("Sphere.005")) {
                const mat = new B.StandardMaterial("superMat", scene);
                mat.diffuseTexture = new B.Texture(folder + "T_Superhero_Male_Dark.png", scene);
                mat.specularColor = B.Color3.Black();
                mesh.material = mat;
            } else if (mesh.name.includes("Eyebrows") || mesh.name.includes("Face")) {
                const mat = new B.StandardMaterial("hairMat", scene);
                mat.diffuseTexture = new B.Texture(folder + "T_Hair_1_BaseColor.png", scene);
                mat.specularColor = B.Color3.Black();
                mesh.material = mat;
            } else if (mesh.name.includes("Eyes") || mesh.name.includes("Face.001")) {
                const mat = new B.StandardMaterial("eyeMat", scene);
                mat.diffuseTexture = new B.Texture(folder + "T_Eye_Brown.png", scene);
                mat.specularColor = B.Color3.Black();
                mesh.material = mat;
            }
        });

        console.log("People loaded: Superhero model with forced textures.");
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
      
      // Find the bones
      const skel = inst.skeletons[0];
      if (skel) {
        person.thighL = skel.bones.find(b => b.name.toLowerCase().includes("thigh_l"));
        person.thighR = skel.bones.find(b => b.name.toLowerCase().includes("thigh_r"));
        person.armL = skel.bones.find(b => b.name.toLowerCase().includes("upperarm_l"));
        person.armR = skel.bones.find(b => b.name.toLowerCase().includes("upperarm_r"));

        // Save initial T-pose rotations
        if (person.thighL) person.thighL_init = person.thighL.rotationQuaternion ? person.thighL.rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person.thighL.rotation);
        if (person.thighR) person.thighR_init = person.thighR.rotationQuaternion ? person.thighR.rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person.thighR.rotation);
        if (person.armL) person.armL_init = person.armL.rotationQuaternion ? person.armL.rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person.armL.rotation);
        if (person.armR) person.armR_init = person.armR.rotationQuaternion ? person.armR.rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person.armR.rotation);
      }

      people.push(person);
      return person;
    }

    // --- MANUAL WALK ANIMATION ---
    let animTime = 0;
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.max(engine.getDeltaTime() / 1000, .001);
      animTime += dt * 8; 

      people.forEach(p => {
        if (!p.root || p.root.isDisposed()) return;
        const now = p.root.getAbsolutePosition();
        p.speed = Math.hypot(now.x - p.last.x, now.z - p.last.z) / dt;
        p.last = now.clone();

        const moving = p.speed > 0.5;
        const swing = moving ? Math.sin(animTime) * 0.6 : 0;

        if (moving) {
            // Swing legs and arms
            if (p.thighL && p.thighL_init) p.thighL.rotationQuaternion = p.thighL_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, swing));
            if (p.thighR && p.thighR_init) p.thighR.rotationQuaternion = p.thighR_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, -swing));
            if (p.armL && p.armL_init) p.armL.rotationQuaternion = p.armL_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, -swing));
            if (p.armR && p.armR_init) p.armR.rotationQuaternion = p.armR_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, swing));
        } else {
            // Drop arms to the side when standing still
            if (p.armL && p.armL_init) p.armL.rotationQuaternion = p.armL_init.multiply(B.Quaternion.RotationAxis(B.Axis.Z, 1.2));
            if (p.armR && p.armR_init) p.armR.rotationQuaternion = p.armR_init.multiply(B.Quaternion.RotationAxis(B.Axis.Z, -1.2));
            if (p.thighL && p.thighL_init) p.thighL.rotationQuaternion = p.thighL_init;
            if (p.thighR && p.thighR_init) p.thighR.rotationQuaternion = p.thighR_init;
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
