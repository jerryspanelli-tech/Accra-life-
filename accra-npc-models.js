/* Accra Life — cached GLB character/NPC model factory.
 * Safe additive module: not loaded by the production game until explicitly wired in.
 * Usage:
 *   const actor = await AccraNPCModels.create(scene, { model:"male", position:[x,0,z] });
 *   actor.setAnimation("walk"); actor.dispose();
 */
(function (global) {
  "use strict";

  const CATALOG = Object.freeze({
    male: "AccraLife_Male.glb",
    female: "AccraLife_Female.glb",
    maleKente: "AccraLife_Male_Kente.glb",
    maleSuit: "AccraLife_Male_Suit.glb",
    femaleAnkara: "AccraLife_Female_Ankara.glb",
    femaleSuit: "AccraLife_Female_Pantsuit.glb"
  });
  const BASE = "People/AccraLife/";
  const cache = new WeakMap();

  function sceneCache(scene) {
    let map = cache.get(scene);
    if (!map) { map = new Map(); cache.set(scene, map); }
    return map;
  }

  function load(scene, key) {
    const file = CATALOG[key] || CATALOG.male;
    const map = sceneCache(scene);
    if (!map.has(file)) {
      const promise = BABYLON.SceneLoader.LoadAssetContainerAsync(BASE, file, scene)
        .catch(error => { map.delete(file); throw error; });
      map.set(file, promise);
    }
    return map.get(file);
  }

  function pickAnimation(groups, preference) {
    if (!groups || !groups.length) return null;
    const wanted = String(preference || "idle").toLowerCase();
    const named = pattern => groups.find(group => pattern.test(group.name || ""));
    // Never label an idle clip as walking: a missing locomotion clip must be visible.
    if (wanted === "walk" || wanted === "walking") return named(/walk|locomotion/i);
    if (wanted === "run" || wanted === "running") return named(/run/i) || named(/walk|locomotion/i);
    if (wanted === "idle" || wanted === "stand") return named(/idle|stand|breath/i) || groups[0];
    return named(new RegExp(wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\  function pickAnimation(groups, preference) {
    if (!groups || !groups.length) return null;
    const wanted = String(preference || "idle").toLowerCase();
    const exact = groups.find(g => g.name && g.name.toLowerCase().includes(wanted));
    if (exact) return exact;
    if (wanted === "walk") return groups.find(g => /idle/i.test(g.name || "")) || groups[0];
    if (wanted === "idle") return groups.find(g => /idle/i.test(g.name || "")) || groups[0];
    return groups[0];
  }"), "i")) || null;
  }

  async function create(scene, options) {
    options = options || {};
    if (!scene || !global.BABYLON) throw new Error("AccraNPCModels requires a Babylon.js scene");
    const key = options.model || "male";
    if (!CATALOG[key]) throw new Error("Unknown Accra Life character model: " + key);

    const container = await load(scene, key);
    const suffix = "npc_" + key + "_" + Math.random().toString(36).slice(2, 9);
    const instance = container.instantiateModelsToScene(
      name => suffix + "_" + name,
      false
    );
    const root = new BABYLON.TransformNode(suffix + "_root", scene);
    (instance.rootNodes || []).forEach(node => {
      if (node && !node.parent) node.parent = root;
    });

    const bounds = root.getHierarchyBoundingVectors(true);
    const sourceHeight = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(sourceHeight) || sourceHeight < 0.1) {
      root.dispose(false, false);
      (instance.animationGroups || []).forEach(group => group.dispose());
      throw new Error("Invalid character model bounds for " + key);
    }

    const targetHeight = Number.isFinite(options.height) ? options.height : 1.8;
    const scale = targetHeight / sourceHeight;
    root.scaling.setAll(scale);
    root.position.set(
      Array.isArray(options.position) ? (options.position[0] || 0) : 0,
      -bounds.min.y * scale,
      Array.isArray(options.position) ? (options.position[2] || 0) : 0
    );
    if (Array.isArray(options.position) && Number.isFinite(options.position[1])) {
      root.position.y += options.position[1];
    }
    if (Number.isFinite(options.rotationY)) root.rotation.y = options.rotationY;

    const groups = instance.animationGroups || [];
    let active = null;
    let disposed = false;
    const state = sceneCache(scene);
    state._activeActors = (state._activeActors || 0) + 1;
    function setAnimation(name, loop) {
      if (disposed) return null;
      groups.forEach(group => group.stop());
      const selected = pickAnimation(groups, name);
      active = selected;
      if (selected) selected.start(loop !== false);
      return selected ? selected.name : null;
    }

    if (options.autoplay !== false) setAnimation(options.animation || "idle", true);

    return {
      root,
      model: key,
      sourceFile: CATALOG[key],
      sourceHeight,
      animationNames: groups.map(group => group.name),
      get activeAnimation() { return active ? active.name : null; },
      setAnimation,
      setMoving(moving) {
        if (moving) setAnimation("walk", true);
        else setAnimation("idle", true);
      },
      pauseAnimation() { if (active) active.pause(); },
      resumeAnimation() { if (active) active.play(true); },
      dispose() {
        if (disposed) return;
        disposed = true;
        groups.forEach(group => group.dispose());
        root.dispose(false, false);
        state._activeActors = Math.max(0, (state._activeActors || 1) - 1);
      }
    };
  }

  function clear(scene) {
    const map = cache.get(scene);
    if (!map) return;
    // Never dispose shared source assets while spawned actors still use them.
    if (map._activeActors > 0) {
      throw new Error("Cannot clear NPC model cache while " + map._activeActors + " actor(s) are still active");
    }
    map.forEach(promise => promise.then(container => container.dispose()).catch(() => {}));
    map.clear();
    cache.delete(scene);
  }

  global.AccraNPCModels = Object.freeze({
    catalog: CATALOG,
    load,
    create,
    clear,
    cachedModelCount(scene) { return sceneCache(scene).size; }
  });
})(window);
