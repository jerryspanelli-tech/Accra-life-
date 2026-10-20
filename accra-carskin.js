/* accra-carskin.js - Custom car model loader
 * Loads car.glb if available, scales it to a realistic size (4.6 m long),
 * and places it correctly on the road. Falls back to the built-in sedan if the file is missing.
 */
(function () {
  const CAR_YAW = Math.PI / 2;   // Adjust if the model faces the wrong way
  const LENGTH = 4.6;            // Real car length in meters
  const TARGET_HEIGHT = 1.45;    // Approximate real car height

  const ensureLoader = () => new Promise((resolve, reject) => {
    if (BABYLON.SceneLoader && 
        BABYLON.SceneLoader.IsPluginForExtensionAvailable && 
        BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://cdn.babylonjs.com/loaders/babylon.glTF2FileLoader.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  (async function () {
    try {
      // Wait until the main car and assets are ready
      if (typeof car === "undefined" || !window.AccraAssets || !window.AccraAssets.createCar) {
        console.log("accra-carskin: waiting for car / AccraAssets...");
        return;
      }

      // Hide original simple car meshes
      car.getChildMeshes().forEach(m => {
        m.isVisible = false;
      });

      // Create a temporary fallback car
      const fallback = window.AccraAssets.createCar(scene, "sedan", { color: "#a3172b" });
      fallback.parent = car;
      fallback.rotation.y = -Math.PI / 2;
      fallback.position.set(0, -0.4, 0);

      try {
        await ensureLoader();

        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./", "car.glb", scene);
        const root = result.meshes[0];

        // Calculate original size
        const bb = root.getHierarchyBoundingVectors(true);
        const sizeX = bb.max.x - bb.min.x;
        const sizeY = bb.max.y - bb.min.y;
        const sizeZ = bb.max.z - bb.min.z;
        const length = Math.max(sizeX, sizeZ);

        // Scale to real car length
        const scale = LENGTH / Math.max(length, 0.001);
        // Keep height realistic
        const heightScale = Math.min(scale, TARGET_HEIGHT / Math.max(sizeY, 0.001));

        // Create a holder node so we can rotate and position cleanly
        const holder = new BABYLON.TransformNode("carmodel", scene);
        holder.parent = car;
        holder.rotation.y = CAR_YAW;

        root.parent = holder;
        root.scaling.set(scale, heightScale, scale);

        // Center the model and place it on the ground
        root.position.set(
          -(bb.min.x + bb.max.x) / 2 * scale,
          -0.75 - bb.min.y * heightScale,
          -(bb.min.z + bb.max.z) / 2 * scale
        );

        // Apply a proper car colour
        root.getChildMeshes().forEach(m => {
          if (m.material) {
            m.material.diffuseColor = BABYLON.Color3.FromHexString("#b3202e");
            m.material.specularColor = new BABYLON.Color3(0.35, 0.35, 0.35);
          }
        });

        // Remove the temporary fallback
        fallback.dispose();

        window.ACCRA_CARSKIN = holder;

        if (window.ACCRA_LIFE && window.ACCRA_LIFE.api && window.ACCRA_LIFE.api.note) {
          window.ACCRA_LIFE.api.note("Custom car model loaded");
        }

        console.log("Accra car model ready");
      } catch (e) {
        console.log("accra-carskin: car.glb not found → keeping built-in car");
        // Keep the fallback car visible
      }

      (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).carskin = 1;

    } catch (err) {
      console.error("accra-carskin failed:", err);
    }
  })();
})();
