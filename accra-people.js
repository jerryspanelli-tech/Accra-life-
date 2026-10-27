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

      const modelNode = inst.rootNodes[0];
      const basePosY = bb ? -bb.min.y * s : 0;
      const person = {
        root,
        modelNode,
        basePosY,
        last: root.getAbsolutePosition().clone(),
        speed: 0,
        sp: 0,
        moving: false,
        moveWeight: 0,
        walkCycle: 0
      };
      
      // Find the bones (More robust matching for Mixamo/Blender naming)
      const skel = inst.skeletons[0];
      if (skel) {
        const findBone = (keywords) => skel.bones.find(b => keywords.some(k => b.name.toLowerCase().includes(k)));
        
        person.pelvis = findBone(["pelvis", "hips", "root_bone"]);
        person.spine = findBone(["spine_01", "spine", "torso"]);
        person.thighL = findBone(["thigh_l", "leftupleg", "left_thigh"]);
        person.thighR = findBone(["thigh_r", "rightupleg", "right_thigh"]);
        person.calfL = findBone(["calf_l", "leftleg", "left_knee"]);
        person.calfR = findBone(["calf_r", "rightleg", "right_knee"]);
        person.armL = findBone(["upperarm_l", "leftarm", "left_arm"]);
        person.armR = findBone(["upperarm_r", "rightarm", "right_arm"]);
        person.forearmL = findBone(["lowerarm_l", "leftforearm", "left_elbow"]);
        person.forearmR = findBone(["lowerarm_r", "rightforearm", "right_elbow"]);

        // Save initial rotations & current quats for smooth slerp interpolation
        ["pelvis", "spine", "thighL", "thighR", "calfL", "calfR", "armL", "armR", "forearmL", "forearmR"].forEach(key => {
          if (person[key]) {
            const initQ = person[key].rotationQuaternion ? person[key].rotationQuaternion.clone() : B.Quaternion.FromEulerVector(person[key].rotation);
            person[key + "_init"] = initQ;
            person[key + "_curr"] = initQ.clone();
          }
        });
      }

      people.push(person);
      return person;
    }

    // --- PROCEDURAL GAIT & ANIMATION LOOP ---
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(Math.max(engine.getDeltaTime() / 1000, .001), 0.1);

      people.forEach(p => {
        if (!p.root || p.root.isDisposed()) return;
        const now = p.root.getAbsolutePosition();
        
        // Smoothly compute ground movement speed, incorporating external avatar sp if provided
        const dist = Math.hypot(now.x - p.last.x, now.z - p.last.z);
        const instantSpeed = Math.max(dist / dt, p.sp || 0);
        p.speed = B.Scalar.Lerp(p.speed, instantSpeed, Math.min(dt * 12, 1));
        p.last.copyFrom(now);

        // Smooth weight transition between idle (0) and walking (1) to prevent pose popping
        p.moving = p.speed > 0.15;
        const targetWeight = p.moving ? 1 : 0;
        p.moveWeight = B.Scalar.Lerp(p.moveWeight, targetWeight, Math.min(dt * 8, 1));

        // Advance walk cycle based on ground speed to match footstep cadence
        if (p.moveWeight > 0.01) {
          p.walkCycle += dt * Math.min(Math.max(p.speed * 2.8, 3.5), 14.0);
        }

        const moveWeight = p.moveWeight;
        const speedRatio = Math.min(p.speed / 4.0, 1.2);
        const swing = Math.sin(p.walkCycle) * 0.55 * Math.max(0.4, speedRatio) * moveWeight;

        // Vertical root bounce linked to gait phase
        if (p.modelNode) {
          const bounce = Math.abs(Math.sin(p.walkCycle * 2)) * 0.035 * moveWeight;
          p.modelNode.position.y = p.basePosY + bounce;
        }

        // Helper for smooth bone slerp transition
        const applyBoneTarget = (boneKey, targetOffsetQuat) => {
          const bone = p[boneKey];
          const initQ = p[boneKey + "_init"];
          const currQ = p[boneKey + "_curr"];
          if (!bone || !initQ || !currQ) return;

          const targetQ = initQ.multiply(targetOffsetQuat);
          B.Quaternion.SlerpToRef(currQ, targetQ, Math.min(dt * 14, 1), currQ);
          bone.rotationQuaternion = currQ.clone();
        };

        // 1. Thighs (hips forward/back leg swing along Z axis of thigh local space)
        applyBoneTarget("thighL", B.Quaternion.RotationAxis(B.Axis.Z, -swing));
        applyBoneTarget("thighR", B.Quaternion.RotationAxis(B.Axis.Z, swing));

        // 2. Calves (knee flexion on back swing along Z axis)
        const kneeFlexL = Math.max(0, -swing * 0.7);
        const kneeFlexR = Math.max(0, swing * 0.7);
        applyBoneTarget("calfL", B.Quaternion.RotationAxis(B.Axis.Z, kneeFlexL));
        applyBoneTarget("calfR", B.Quaternion.RotationAxis(B.Axis.Z, kneeFlexR));

        // 3. Arms & Forearms (Arm swing along Y axis counter to legs, with resting idle drop pose along Z axis)
        const idleArmL = B.Quaternion.RotationAxis(B.Axis.Z, -1.2);
        const idleArmR = B.Quaternion.RotationAxis(B.Axis.Z, 1.2);
        const walkArmL = idleArmL.multiply(B.Quaternion.RotationAxis(B.Axis.Y, swing * 0.8));
        const walkArmR = idleArmR.multiply(B.Quaternion.RotationAxis(B.Axis.Y, -swing * 0.8));

        const targetArmL = B.Quaternion.Slerp(idleArmL, walkArmL, moveWeight);
        const targetArmR = B.Quaternion.Slerp(idleArmR, walkArmR, moveWeight);

        applyBoneTarget("armL", targetArmL);
        applyBoneTarget("armR", targetArmR);

        // Subtle forearm elbow bend during movement along X axis
        const elbowFlex = (0.2 + Math.abs(swing) * 0.35) * moveWeight;
        applyBoneTarget("forearmL", B.Quaternion.RotationAxis(B.Axis.X, elbowFlex));
        applyBoneTarget("forearmR", B.Quaternion.RotationAxis(B.Axis.X, elbowFlex));

        // 4. Pelvis Yaw Twist & Spine Lean
        if (p.pelvis && p.pelvis_init) {
          const pelvisYaw = Math.sin(p.walkCycle) * 0.08 * moveWeight;
          applyBoneTarget("pelvis", B.Quaternion.RotationAxis(B.Axis.Y, pelvisYaw));
        }
        if (p.spine && p.spine_init) {
          const spineLean = speedRatio * 0.1 * moveWeight;
          applyBoneTarget("spine", B.Quaternion.RotationAxis(B.Axis.X, spineLean));
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
        let _sp = 0;
        const wrapper = Object.assign(c, { root: s.root, person: s, outfit: "glb" });
        Object.defineProperty(wrapper, "sp", {
          get() { return _sp; },
          set(v) { _sp = v; if (s) s.sp = v; },
          configurable: true,
          enumerable: true
        });
        return wrapper;
      };
    }

    load();
    window.ACCRA_PEOPLE = { spawn, ready: () => !!base, count: () => people.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).people = 1;
  } catch (err) { console.error("accra-people failed:", err); }
})();
