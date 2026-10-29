/* accra-figure.js - compatibility stub ensuring no blocky character primitives spawn */
(function () {
  try {
    function MAT(group, hex) {
      if (typeof scene !== "undefined" && window.BABYLON) {
        const m = new BABYLON.StandardMaterial("cart_" + group + "_" + (hex || "#fff").replace("#", ""), scene);
        m.diffuseColor = BABYLON.Color3.FromHexString(hex || "#ffffff");
        return m;
      }
      return null;
    }

    function human(opt) {
      if (window.AccraAssets && window.AccraAssets.createCharacter && typeof scene !== "undefined") {
        const c = window.AccraAssets.createCharacter(scene, opt || {});
        return { root: c.root, g: c.root, al: c.root, ar: c.root, ll: c.root, lr: c.root, pk: [], ph: 0, sp: 0 };
      }
      const root = (typeof scene !== "undefined" && window.BABYLON) ? new BABYLON.TransformNode("fig_stub", scene) : null;
      return { root, g: root, al: root, ar: root, ll: root, lr: root, pk: [], ph: 0, sp: 0 };
    }

    function walk(h, sp, dt) {}

    window.AccraFigure = { human, walk, MAT };
  } catch (err) {
    console.error("accra-figure stub error:", err);
  }
})();
