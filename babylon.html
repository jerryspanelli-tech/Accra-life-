/* accra-people.js - Loads 3D models (Ignores missing textures) */
(function () {
  try {
    const B = BABYLON;
    const folder = new URL("./", window.location.href).href + "People/";
    const HEIGHT = 1.8;
    let base = null;
    let clips = { walk: null, idle: null };
    const people = [];
    let idCount = 0;

    // --- MAGIC FIX: Ignore missing textures so the model still loads ---
    B.SceneLoader.OnPluginActivatedObservable.add(function (plugin) {
      if (plugin.name === "gltf") {
        plugin.onError = function (error) {
          console.warn("Ignored missing texture error:", error);
        };
      }
    });

    async function load() {
      try {
        const cont = await B.SceneLoader.LoadAssetContainerAsync(folder, "Superhero_Male_FullBody.gltf", scene);
        base = cont;
        say("People loaded: Superhero model.");
        if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.apply) window.ACCRA_AVATAR.apply();
      } catch (err) {
        const d = document.createElement('div');
        d.style.cssText = "position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#8b1a1a;color:#fff;padding:15px;border-radius:10px;z-index:99999;font:14px system-ui;text-align:center;max-width:90%;border:2px solid #fff;";
        d.innerHTML = "<b>3D Model Failed!</b><br><br>" + err.message + "<br><br>(Tap to dismiss)";
        d.onclick = () => d.remove();
        document.body.appendChild(d);
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
      people.push(person);
      return person;
    }

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
