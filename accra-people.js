/* accra-people.js - Loads 3D models for the player and NPCs.
 * Updated to load the Quaternius Superhero model. */
(function () {
  try {
    const B = BABYLON;
    // Points to the folder where your 18 files are
    const folder = new URL("./", window.location.href).href + "people/";
    const HEIGHT = 1.8;
    let base = null;
    let clips = { walk: null, idle: null };
    const people = [];
    let idCount = 0;

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
      // Load the specific .gltf file you uploaded
      const cont = await B.SceneLoader.LoadAssetContainerAsync(folder, "Superhero_Male_FullBody.gltf", scene);
      base = cont;
      
      // Try to load walk/idle animations if you have them
      clips.walk = await readClips("walk.glb"); 
      clips.idle = await readClips("idle.glb");
      
      say("People loaded: Superhero model.");
      if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
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

    load().catch(e => console.log("accra-people: no character files, using cartoon (" + (e && e.message ? e.message : e) + ")"));
    window.ACCRA_PEOPLE = { spawn, ready: () => !!base, count: () => people.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).people = 1;
  } catch (err) { console.error("accra-people failed:", err); }
})();
