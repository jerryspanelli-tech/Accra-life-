/* accra-people.js - real rigged people for the player and the other people in the game.
 * Files (put them in a folder called "people" next to babylon.html):
 *   people/character.glb  the body with its skeleton (the T-pose model)
 *   people/walk.glb       the walking animation (same skeleton)
 *   people/idle.glb       the standing animation (same skeleton, optional)
 * The animation bones are matched to the character's bones by name. The character is scaled to about 1.8 m.
 * If the character file is missing, the cartoon figure from accra-figure.js is used. */
(function () {
  try {
    const B = BABYLON;
    const folder = new URL("./", window.location.href).href + "people/";
    const HEIGHT = 1.8;
    let base = null;                    // the loaded character (mesh, skeleton, bone transforms)
    let clips = { walk: null, idle: null }; // animation tracks: [{ bone, animation }]
    const people = [];                  // every spawned person, with its last position and its animation groups
    let idCount = 0;

    // read the tracks of an animation file (the bone name and the animation for each bone)
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

    // turn a list of tracks into an animation group for one person
    function groupFor(tracks, root, name) {
      const grp = new B.AnimationGroup(name, scene);
      const nodes = root.getDescendants(false, n => n instanceof B.TransformNode);
      tracks.forEach(t => {
        const target = nodes.find(n => n.name === t.bone);
        if (target) grp.addTargetedAnimation(t.animation, target);
      });
      grp.loopAnimation = true;
      return grp;
    }

    async function load() {
      const cont = await B.SceneLoader.LoadAssetContainerAsync(folder, "character.glb", scene);
      base = cont;
      clips.walk = await readClips("walk.glb");
      clips.idle = await readClips("idle.glb");
      say("People loaded: humanoid character, walking" + (clips.idle ? " and standing" : "") + ".");
      // the player and anyone built from now on use the new character
      if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
    }

    const say = m => { console.log(m); if (window.ACCRA_LIFE && window.ACCRA_LIFE.api) window.ACCRA_LIFE.api.note(m); };

    // make one person from the loaded character
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
      const person = { root, walk: null, idle: null, last: root.getAbsolutePosition().clone(), speed: 0, playing: null, sp: 0, outfit: "model" };
      if (clips.walk) person.walk = groupFor(clips.walk, inst.rootNodes[0], "walk" + id);
      if (clips.idle) person.idle = groupFor(clips.idle, inst.rootNodes[0], "idle" + id);
      person.idle && person.idle.start(true, 1);
      people.push(person);
      return person;
    }

    // the people's walk and idle: play the walk while they move, the idle when they stop
    scene.onBeforeRenderObservable.add(() => {
      const dt = Math.max(engine.getDeltaTime() / 1000, .001);
      people.forEach(p => {
        if (p.root.isDisposed()) return;
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

    // replace the people built by accra-figure.js: the character is shown for the player and the other people
    if (window.AccraFigure) {
      const cartoon = window.AccraFigure.human;
      window.AccraFigure.human = function (opt) {
        const c = cartoon(opt);
        if (!base) return c;                        // not loaded yet: keep the cartoon figure
        const s = spawn(c.root);
        // the figure's own walk code moves c.al, c.ar, c.ll, c.lr; the real people use their clips instead
        c.root.getChildMeshes().forEach(m => m.dispose());
        return Object.assign(c, { root: s.root, sp: 0, person: s });
      };
    }

    load().catch(e => console.log("accra-people: no character files, using the cartoon figure (" + (e && e.message ? e.message : e) + ")"));
    window.ACCRA_PEOPLE = { spawn, ready: () => !!base, count: () => people.length };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).people = 1;
  } catch (err) { console.error("accra-people failed:", err); }
})();
