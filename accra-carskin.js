/* accra-carskin.js - the car you drive. If car.glb is in the repo (next to babylon.html), it is loaded and used.
 * It is scaled to a real car length (4.6 m) and sits on the road. If the file is missing, the built-in sedan stays.
 * CAR_YAW: turn the model by 180 degrees here if it drives backwards. */
(function () {
  const CAR_YAW = Math.PI / 2;   // this model is long along X; the game drives along Z
  const LENGTH = 4.6;
  const ensureLoader = () => new Promise((res, rej) => {
    if (BABYLON.SceneLoader && BABYLON.SceneLoader.IsPluginForExtensionAvailable && BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) return res();
    const s = document.createElement("script");
    s.src = "https://cdn.babylonjs.com/loaders/babylon.glTF2FileLoader.min.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  (async function () {
    try {
      if (typeof car === "undefined" || !window.AccraAssets || !window.AccraAssets.createCar) { console.log("accra-carskin: waiting"); return; }
      car.getChildMeshes().forEach(m => { m.isVisible = false; });
      const fallback = window.AccraAssets.createCar(scene, "sedan", { color: "#a3172b" });
      fallback.parent = car; fallback.rotation.y = -Math.PI / 2; fallback.position.set(0, -.4, 0);
      try {
        await ensureLoader();
        const r = await BABYLON.SceneLoader.ImportMeshAsync("", "./", "car.glb", scene);
        const root = r.meshes[0];
        const bb = root.getHierarchyBoundingVectors(true);
        const len = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
        const s = LENGTH / Math.max(len, .001);
        const holder = new BABYLON.TransformNode("carmodel", scene);
        holder.parent = car; holder.rotation.y = CAR_YAW;
        root.parent = holder;
        root.scaling.setAll(s);
        root.position.set(-(bb.min.x + bb.max.x) / 2 * s, -.8 - bb.min.y * s, -(bb.min.z + bb.max.z) / 2 * s);
        fallback.dispose();
        window.ACCRA_CARSKIN = holder;
        if (window.ACCRA_LIFE) window.ACCRA_LIFE.api.note("Car model loaded");
        console.log("Accra car model ready");
      } catch (e) {
        console.log("accra-carskin: car.glb not found, keeping the built-in car");
      }
      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).carskin = 1;
    } catch (err) { console.error("accra-carskin failed:", err); }
  })();
})();
