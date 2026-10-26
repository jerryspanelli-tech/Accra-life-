/* accra-people.js - Loads 3D models for the player and NPCs. (Debug Version) */
(function () {
  try {
    const B = BABYLON;
    const folder = new URL("./", window.location.href).href + "People/";
    const HEIGHT = 1.8;
    let base = null;
    let clips = { walk: null, idle: null };
    const people = [];
    let idCount = 0;

    // --- DEBUG HELPER ---
    function showError(msg) {
      console.error(msg);
      const d = document.createElement('div');
      d.style.cssText = "position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#8b1a1a;color:#fff;padding:15px;border-radius:10px;z-index:99999;font:14px system-ui;text-align:center;max-width:90%;border:2px solid #fff;box-shadow:0 10px 30px rgba(0,0,0,0.8)";
      d.innerHTML = "<b>3D Model Failed to Load!</b><br><br>" + msg + "<br><br>(Tap to dismiss)";
      d.onclick = () => d.remove();
      document.body.appendChild(d);
    }

    async function readClips(file) {
      try {
        const c = await B.SceneLoader.LoadAssetContainerAsync(folder, file, scene);
        const g = c.animationGroups && c.animationGroups[0];
        if (!g) return null;
        const tracks = g.targetedAnimations.map(t => ({ bone: t.target.name, animation: t.animation }));
        c.dispose();
        return tracks;
      } catch (e) { return null; }
    }

    function findBone(nodes, boneName) {
      return nodes.find(n => n.name === boneName)
          || nodes.find(n => n.name.startsWith(boneName + "_"))
          || nodes.find(n => n.name.includes(boneName));
    }

    function groupFor(tracks, root, name) {
      const grp = new B.AnimationGroup(name, scene);
      const nodes = root.getDescendants(false, n => n instanceof B.TransformNode);
      tracks.forEach(t => {
        const target = findBone(nodes, t.bone);
        if (target) grp.addTargetedAnimation(t.animation, target);
      });
      grp.loopAnimation = true;
      return grp;
    }

    async function load() {
      try {
        // Attempt to load the exact file name
        const cont = await B.SceneLoader.LoadAssetContainerAsync(folder, "Superhero_Male_FullBody.gltf", scene);
        base = cont;
        clips.walk = await readClips("walk.glb"); 
        clips.idle = await readClips("idle.glb");
        
        say("People loaded: Superhero model.");
        if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
      } catch (err) {
        showError("Could not find or load 'Superhero_Male_FullBody.gltf'.<br>Make sure the file name matches exactly and is inside the People folder.<br><br>Error: " + err.message);
      }
    }

    const say = m => { console.log(m); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note(m); };

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

      const person = { root, walk: null, idle: null, last: root.getAbsolutePosition().clone(), speed: 0, playing: null, sp: 0, outfit: "glb" };
      if (clips.walk) person.walk = groupFor(clips.walk, inst.rootNodes[0], "walk" + id);
      if (clips.idle) person.idle = groupFor(clips.idle, inst.rootNodes[0], "idle" + id);
      if (person.idle) person.idle.start(true, 1);
      people.push(person);
      return person;
    }

    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.max(engine.getDeltaTime() / 1000, .001);
      people.forEach(p => {
        if (!p.root || p.root.isDisposed()) return;
        const now = p.root.getAbsolutePosition();
        p.speed = Math.hypot(now.x - p.last.x, now.z - p.last.z) / dt;
        p.last = now.clone();
        const moving = p.speed > .5;
        const want = moving ? p.walk : p.idle;
        if (want && p.playing !== want) {
          if (p.playing) p.playing.stop();
          want.start(true, 1);
          p.playing = want;
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
