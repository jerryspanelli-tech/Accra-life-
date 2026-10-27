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
      
      // Find the TransformNodes linked to GLTF skeleton bones
      const skel = inst.skeletons[0];
      if (skel) {
        const getNode = (keywords) => {
          const b = skel.bones.find(b => keywords.some(k => b.name.toLowerCase().includes(k)));
          if (!b) return null;
          return b.getTransformNode ? (b.getTransformNode() || b) : b;
        };
        
        person.pelvis = getNode(["pelvis", "hips", "root_bone"]);
        person.spine = getNode(["spine_01", "spine", "torso"]);
        person.thighL = getNode(["thigh_l", "leftupleg", "left_thigh"]);
        person.thighR = getNode(["thigh_r", "rightupleg", "right_thigh"]);
        person.calfL = getNode(["calf_l", "leftleg", "left_knee"]);
        person.calfR = getNode(["calf_r", "rightleg", "right_knee"]);
        person.armL = getNode(["upperarm_l", "leftarm", "left_arm"]);
        person.armR = getNode(["upperarm_r", "rightarm", "right_arm"]);
        person.forearmL = getNode(["lowerarm_l", "leftforearm", "left_elbow"]);
        person.forearmR = getNode(["lowerarm_r", "rightforearm", "right_elbow"]);

        // Save initial rotations & current quats for smooth slerp interpolation
        ["pelvis", "spine", "thighL", "thighR", "calfL", "calfR", "armL", "armR", "forearmL", "forearmR"].forEach(key => {
          const node = person[key];
          if (node) {
            if (!node.rotationQuaternion) {
              node.rotationQuaternion = B.Quaternion.FromEulerVector(node.rotation);
            }
            const initQ = node.rotationQuaternion.clone();
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

        // Helper for smooth TransformNode quaternion slerp transition
        const applyBoneTarget = (boneKey, targetOffsetQuat) => {
          const node = p[boneKey];
          const initQ = p[boneKey + "_init"];
          const currQ = p[boneKey + "_curr"];
          if (!node || !initQ || !currQ) return;

          const targetQ = initQ.multiply(targetOffsetQuat);
          B.Quaternion.SlerpToRef(currQ, targetQ, Math.min(dt * 14, 1), currQ);
          node.rotationQuaternion = currQ.clone();
        };

        // 1. Thighs (hips forward/back leg swing along local X axis)
        applyBoneTarget("thighL", B.Quaternion.RotationAxis(B.Axis.X, swing));
        applyBoneTarget("thighR", B.Quaternion.RotationAxis(B.Axis.X, -swing));

        // 2. Calves (knee flexion on back swing along local X axis)
        const kneeFlexL = Math.max(0, swing * 0.7);
        const kneeFlexR = Math.max(0, -swing * 0.7);
        applyBoneTarget("calfL", B.Quaternion.RotationAxis(B.Axis.X, kneeFlexL));
        applyBoneTarget("calfR", B.Quaternion.RotationAxis(B.Axis.X, kneeFlexR));

        // 3. Arms & Forearms (Arm drop along local X axis to lower arms from bind T-pose, arm swing along local Z axis)
        const dropArmL = B.Quaternion.RotationAxis(B.Axis.X, 1.25);
        const dropArmR = B.Quaternion.RotationAxis(B.Axis.X, -1.25);
        const swingArmL = B.Quaternion.RotationAxis(B.Axis.Z, -swing * 0.8);
        const swingArmR = B.Quaternion.RotationAxis(B.Axis.Z, swing * 0.8);

        applyBoneTarget("armL", dropArmL.multiply(swingArmL));
        applyBoneTarget("armR", dropArmR.multiply(swingArmR));

        // Subtle forearm elbow bend during movement along local X axis
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

    // Legacy GLTF superhero model override disabled to ensure clean procedural sandbox character system

    load();
    window.ACCRA_PEOPLE = { spawn, ready: () => !!base, count: () => people.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).people = 1;
  } catch (err) { console.error("accra-people failed:", err); }
})();
