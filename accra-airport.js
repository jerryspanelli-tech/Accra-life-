/* accra-airport.js - Kotoka International Airport
 * Fixed version – works with mat(), box(), palm(), sg
 * Realistic planes with Ghana colours + spinning engines + blinking lights
 * Smoother vehicle movement
 */
(function () {
  try {
    const B = BABYLON;
    const C = { x: -420, z: -300 };
    const X = x => C.x + x;
    const Z = z => C.z + z;
    const cars = [];
    const planes = [];

    function text(t, x, y, z, w, h, bg, fg, onGround) {
      const dt = new B.DynamicTexture("apt_t" + t, { width: 512, height: 128 }, scene, false);
      const c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
      c.fillStyle = fg;
      c.font = "bold 60px system-ui";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(t, 256, 66, 490);
      dt.update();

      const p = B.MeshBuilder.CreatePlane("apt_txt", { width: w, height: h }, scene);
      p.position.set(x, y, z);
      p.isPickable = false;
      if (onGround) p.rotation.x = Math.PI / 2;

      const m = new B.StandardMaterial("apt_tm" + t, scene);
      m.diffuseTexture = dt;
      m.emissiveTexture = dt;
      m.disableLighting = true;
      m.backFaceCulling = false;
      p.material = m;
    }

    // ========== REALISTIC PLANE ==========
    function aircraft(x, z, index = 0) {
      const group = new B.TransformNode("plane_" + index, scene);
      group.position.set(X(x), 0, Z(z));

      // Fuselage
      const fus = B.MeshBuilder.CreateCylinder("apt_fus", {
        diameter: 3.2, height: 28, tessellation: 12
      }, scene);
      fus.rotation.z = Math.PI / 2;
      fus.position.set(0, 2.5, 0);
      fus.material = mat("#f8f8f6");
      fus.parent = group;
      fus.checkCollisions = true;
      if (typeof sg !== "undefined" && sg) sg.addShadowCaster(fus);

      // Nose
      const nose = B.MeshBuilder.CreateCylinder("apt_nose", {
        diameterTop: 0.2, diameterBottom: 3.2, height: 4.5, tessellation: 12
      }, scene);
      nose.rotation.z = Math.PI / 2;
      nose.position.set(15.5, 2.5, 0);
      nose.material = mat("#f8f8f6");
      nose.parent = group;

      // Helper to create parts relative to the plane
      const part = (w, h, d, x0, y0, z0, col, solid) => {
        const m = box(w, h, d, 0, 0, 0, col, solid);
