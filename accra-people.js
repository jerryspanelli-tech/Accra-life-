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
        cont.meshes.forEach(mesh => {
            // Note: If you still see a black bar/bikini, your texture map might be missing or mapped wrong.
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

      const person = { root, last: root.getAbsolutePosition().clone(), speed: 0, sp: 0, moving: false };
      
      // Find the bones (More robust matching for Mixamo/Blender naming)
      const skel = inst.skeletons[0];
      if (skel) {
        const findBone = (keywords) => skel.bones.find(b => keywords.some(k => b.name.toLowerCase().includes(k)));
        
        person.thighL = findBone(["thigh_l", "leftupleg", "left_thigh"]);
        person.thighR = findBone(["thigh_r", "rightupleg", "right_thigh"]);
        person.calfL = findBone(["calf_l", "leftleg", "left_knee"]);
        person.calfR = findBone(["calf_r", "rightleg", "right_knee"]);
        person.armL = findBone(["upperarm_l", "leftarm", "left_arm"]);
        person.armR = findBone(["upperarm_r", "rightarm", "right_arm"]);
        person.forearmL = findBone(["lowerarm_l", "leftforearm", "left_elbow"]);
        person.forearmR = findBone(["lowerarm_r", "rightforearm", "right_elbow"]);

        // Debug: Log if primary bones are missing
        if (!person.armL) console.warn("Left Arm bone not found!");
        if (!person.armR) console.warn("Right Arm bone not found!");

        // Save initial rotations
        ["thighL", "thighR", "calfL", "calfR", "armL", "armR", "forearmL", "forearmR"].forEach(key => {
          if (person[key]) {
            person[key + "_init"] = person[key].rotationQuaternion ? person[key].rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person[key].rotation);
          }
        });
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
        
        // Calculate speed safely
        const dist = Math.hypot(now.x - p.last.x, now.z - p.last.z);
        p.speed = dist / dt;
        p.last = now.clone();

        // Use a threshold to determine if moving (prevent stuttering idle)
        p.moving = p.speed > 0.2; 
        const swing = p.moving ? Math.sin(animTime) * 0.6 : 0;

        if (p.moving) {
            // Swing legs and arms with knee flex
            if (p.thighL && p.thighL_init) p.thighL.rotationQuaternion = p.thighL_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, swing));
            if (p.thighR && p.thighR_init) p.thighR.rotationQuaternion = p.thighR_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, -swing));
            if (p.calfL && p.calfL_init) p.calfL.rotationQuaternion = p.calfL_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, Math.max(0, swing * 0.5)));
            if (p.calfR && p.calfR_init) p.calfR.rotationQuaternion = p.calfR_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, Math.max(0, -swing * 0.5)));
            if (p.armL && p.armL_init) p.armL.rotationQuaternion = p.armL_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, -swing));
            if (p.armR && p.armR_init) p.armR.rotationQuaternion = p.armR_init.multiply(B.Quaternion.RotationAxis(B.Axis.X, swing));
        } else {
            // Natural standing idle with relaxed arms
            if (p.armL && p.armL_init) p.armL.rotationQuaternion = p.armL_init.multiply(B.Quaternion.RotationAxis(B.Axis.Z, 1.3));
            if (p.armR && p.armR_init) p.armR.rotationQuaternion = p.armR_init.multiply(B.Quaternion.RotationAxis(B.Axis.Z, -1.3));
            if (p.thighL && p.thighL_init) p.thighL.rotationQuaternion = p.thighL_init;
            if (p.thighR && p.thighR_init) p.thighR.rotationQuaternion = p.thighR_init;
            if (p.calfL && p.calfL_init) p.calfL.rotationQuaternion = p.calfL_init;
            if (p.calfR && p.calfR_init) p.calfR.rotationQuaternion = p.calfR_init;
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
