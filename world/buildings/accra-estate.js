/* accra-estate.js - Amoamah Estate, rebuilt in the reference style: a walled, gated estate with an ornate gate and
 * sign, flat-roofed modern houses with solar panels and water tanks, carports with parked cars, palms, flower beds
 * and street lights. It clears the old Amoamah houses first (after the other scripts have built the city). The
 * roads, the traffic lights and the other districts are left alone. */
(function () {
  try {
    const B = BABYLON, A = window.AccraAssets;
    if (!A) { console.log("accra-estate: waiting for assets"); return; }
    const X1 = 80, X2 = 140, Z1 = -64, Z2 = -6, GX = 110, GZ = -64;   // the estate: x 80..140, z -64..-6; gate on the north side
    const KEEP = /^(road_|zebra|sig_|lamp|lp|lh|hw_|apt_|tl_|tw_|toll|boom_|car|cp|wp|wr|fig|ffig|fg|fp|fpv|cart|g$|ct|cam|sea|highway|tr)/i;

    // 1. clear the old Amoamah pieces (the roads and the driveways are kept)
    function clear() {
      let n = 0;
      scene.meshes.slice().forEach(m => {
        if (!m || m.isDisposed() || KEEP.test(m.name || "") || (m.parent && m.parent !== null)) return;
        m.computeWorldMatrix(true);
        const c = m.getBoundingInfo().boundingBox.centerWorld;
        if (c.y > 40) return;
        if (c.x > X1 - 2 && c.x < X2 + 2 && c.z > Z1 - 2 && c.z < Z2 + 2) { m.dispose(); n++; }
      });
      return n;
    }

    // 2. the parts of the estate
    const wall = (x, z, w, d) => box(w, 2.2, d, x, 1.1, z, "#e6dcc8", true);
    function house(cx, cz, front) {                          // front = +1 faces +z, -1 faces -z
      const W = 10, D = 8, H = 3.6, fz = cz + front * (D / 2);
      box(W, H, D, cx, H / 2, cz, "#efe9dc", true);          // main block
      box(W + .6, .4, D + .6, cx, H + .2, cz, "#d9d3c6", false);   // flat roof
      box(W + .6, .5, .25, cx, H + .45, cz + front * (D / 2), "#c9c2b2", false);   // parapet
      [-3, 0, 3].forEach(dx => box(1.4, 1.5, .12, cx + dx, 1.9, fz + front * .05, "#1d3042", false));   // windows
      box(1.3, 2.4, .12, cx + 4.2, 1.2, fz + front * .05, "#5a3a22", false);       // front door
      [-2.4, 2.4].forEach(dx => {                              // solar panels, tilted
        const p = box(3.6, .08, 2.6, cx + dx, H + .6, cz + .5, "#1b2a4a", false); p.rotation.x = front * .4;
      });
      [-3.6, 3.6].forEach(dx => {                               // water tanks on the roof
        const t = B.MeshBuilder.CreateCylinder("tank", { diameter: 1.6, height: 1.8, tessellation: 12 }, scene);
        t.position.set(cx + dx, H + 1.4, cz - 2); t.material = mat("#1f2a33"); t.checkCollisions = false;
      });
    }
    function carport(cx, cz, front) {                          // a roofed carport in front of a house
      const W = 9, D = 5, zc = cz + front * (4 + D / 2);
      [-W / 2 + .3, W / 2 - .3].forEach(dx => [-D / 2 + .3, D / 2 - .3].forEach(dz => box(.25, 2.8, .25, cx + dx, 1.4, zc + dz, "#f2f2f2", true)));
      box(W + .4, .25, D + .4, cx, 2.9, zc, "#e6e6e6", false);
      box(W + .4, .08, D + .4, cx, 3.05, zc, "#cfd6dc", false);
      return zc;
    }
    function lamp(x, z) {
      box(.15, 5, .15, x, 2.5, z, "#4a4f57", false);
      const s = B.MeshBuilder.CreateSphere("lampHead", { diameter: .7, segments: 6 }, scene);
      s.position.set(x, 5.2, z); s.material = Object.assign(new B.StandardMaterial("estLamp", scene), { emissiveColor: B.Color3.FromHexString("#fff2c4"), disableLighting: true }); s.isPickable = false;
    }
    function flowers(x1, x2, z) {
      box(x2 - x1, .2, 1.6, (x1 + x2) / 2, .1, z, "#4a7a35", false);
      const cols = ["#ff6b6b", "#ffd166", "#ef476f", "#ffffff", "#c77dff"];
      for (let x = x1 + 1; x < x2 - 1; x += 1.6) {
        const f = B.MeshBuilder.CreateSphere("flw", { diameter: .45, segments: 5 }, scene);
        f.position.set(x, .35, z + (Math.random() - .5) * .6); f.material = mat(cols[Math.floor(Math.random() * cols.length)]); f.isPickable = false;
      }
    }

    // 3. build the estate
    function build() {
      // walls with the gate gap on the north side
      wall(X1, (Z1 + Z2) / 2, .6, Z2 - Z1);                 // west
      wall(X2, (Z1 + Z2) / 2, .6, Z2 - Z1);                 // east
      wall((X1 + X2) / 2, Z2, X2 - X1, .6);                 // south
      wall(X1 + (GX - 7 - X1) / 2, Z1, GX - 7 - X1, .6);    // north, west of the gate
      wall(GX + 7 + (X2 - GX - 7) / 2, Z1, X2 - GX - 7, .6); // north, east of the gate
      // gate: two stone pillars, an arch with the estate sign, and iron bars
      [-7, 7].forEach(dx => box(1.6, 4, 1.6, GX + dx, 2, GZ, "#d8c9a8", true));
      box(16, 1, 1.2, GX, 4.3, GZ, "#c9a54a", false);
      for (let x = -5.6; x <= 5.6; x += 1.4) box(.15, 3, .15, GX + x, 1.5, GZ, "#2b2d31", false);
      const dt = new B.DynamicTexture("estSign", { width: 512, height: 128 }, scene, false), c = dt.getContext();
      c.fillStyle = "#17191c"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#c9a54a"; c.font = "bold 58px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ACCRA ESTATE", 256, 66, 490); dt.update();
      const sn = B.MeshBuilder.CreatePlane("estSn", { width: 9, height: 2.2 }, scene); sn.position.set(GX, 5.6, GZ + .8); sn.isPickable = false;
      const sm = new B.StandardMaterial("estSm", scene); sm.diffuseTexture = dt; sm.emissiveTexture = dt; sm.disableLighting = true; sm.backFaceCulling = false; sn.material = sm;
      // inside roads: from the gate north to a ring road, then a road along the estate
      box(6, .05, 30, GX, .04, -49, "#2b2d31", false);
      box(60, .05, 6, (X1 + X2) / 2, .04, -34, "#2b2d31", false);
      // rows of houses, each with a carport and a parked car
      const xs = [87, 103, 119, 135];
      const kinds = [["suv", "#8f959d"], ["sports", "#c0392b"], ["sedan", "#17191c"], ["suv", "#f2f2f2"]];
      xs.forEach((x, i) => {
        house(x, -48, +1); const zc = carport(x, -48, +1);
        const car = A.createCar(scene, kinds[i][0], { color: kinds[i][1], position: [x, 0, zc], rotY: Math.PI / 2 });
        car.getChildMeshes().forEach(m => m.checkCollisions = false);
      });
      xs.forEach((x, i) => {
        house(x, -22, -1); const zc = carport(x, -22, -1);
        const car = A.createCar(scene, kinds[(i + 1) % 4][0], { color: kinds[(i + 1) % 4][1], position: [x, 0, zc], rotY: Math.PI / 2 });
        car.getChildMeshes().forEach(m => m.checkCollisions = false);
      });
      // palms, flower beds and lights
      [[84, -60], [136, -60], [84, -12], [136, -12], [123, -36]].forEach(p => A.createTree(scene, { type: "palm", position: [p[0], 0, p[1]] }));
      flowers(82, 99, -60); flowers(121, 138, -60); flowers(82, 138, -9);
      [[92, -34], [128, -34], [GX - 8, -58], [GX + 8, -58]].forEach(p => lamp(p[0], p[1]));
    }

    // run after the city and the other scripts have finished building
    setTimeout(() => {
      const removed = clear();
      build();
      console.log("Amoamah Estate rebuilt; removed", removed, "old pieces");
    }, 9500);
    window.ACCRA_ESTATE = { x1: X1, x2: X2, z1: Z1, z2: Z2, gate: { x: GX, z: GZ } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).estate = 1;
  } catch (err) { console.error("accra-estate failed:", err); }
})();
