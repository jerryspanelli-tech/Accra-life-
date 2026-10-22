/* accra-mall.js - Accra Galleria Mall, on its own site south-east of the city (x 230..290, z 90..150).
 * Exterior: a compound wall with a gate and sign board, a glass-roofed entrance arch with the mall name,
 * a fountain court, shop fronts (food court, supermarket, designer and luxury retail), a cinema block,
 * a multi-level parking garage, a rooftop garden, and palm trees.
 * The shop interiors and the game links are planned for later steps. Built with simple solid boxes, once. */
(function () {
  try {
    const B = BABYLON;
    const CX = 260, CZ = 120;
    const X0 = CX - 30, X1 = CX + 30, Z0 = CZ - 30, Z1 = CZ + 30;
    const stone = mat("#c9bfa9"), wood = mat("#8a5a2b"), gold = mat("#c9a54a"), glass = mat("#9fc4d6");
    const dark = mat("#2b2f36"), white = mat("#f3f0e8"), green = mat("#3f8f4a"), water = mat("#3f8fb0");
    const grey = mat("#9aa0a6"), teal = mat("#2e6f73");

    const box = (w, h, d, x, y, z, m, ry) => {
      const b = B.MeshBuilder.CreateBox("mall", { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.material = m; if (ry) b.rotation.y = ry;
      b.checkCollisions = true; b.isPickable = false; return b;
    };
    const plain = (w, h, d, x, y, z, m, ry) => { const b = box(w, h, d, x, y, z, m, ry); b.checkCollisions = false; return b; };
    const sign = (text, w, h, x, y, z, ry, bg, fg, size) => {
      const dt = new B.DynamicTexture("msg", { width: 1024, height: 256 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 1024, 256);
      c.fillStyle = fg; c.font = "bold " + (size || 80) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 512, 128, 980);
      dt.update();
      const p = B.MeshBuilder.CreatePlane("msign", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.rotation.y = ry || 0; p.isPickable = false;
      const m = new B.StandardMaterial("msm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m; return p;
    };

    // ----- compound wall, with the gate on the north side -----
    plain(X1 - X0 + 4, .15, Z1 - Z0 + 4, CX, .08, CZ, stone);
    const GATE = 16;
    box(X1 - X0, 3.6, .8, CX, 1.8, Z1, grey);                                        // south wall
    box(.8, 3.6, Z1 - Z0, X1, 1.8, CZ, grey);                                        // east wall
    box(.8, 3.6, Z1 - Z0, X0, 1.8, CZ, grey);                                        // west wall
    box((X1 - X0 - GATE) / 2, 3.6, .8, X0 + (X1 - X0 - GATE) / 4, 1.8, Z0, grey);    // north wall, left of gate
    box((X1 - X0 - GATE) / 2, 3.6, .8, X1 - (X1 - X0 - GATE) / 4, 1.8, Z0, grey);    // north wall, right of gate
    sign("ACCRA GALLERIA MALL COMPOUND GATE", 22, 2.4, CX, 4.6, Z0 - .6, Math.PI, gold, "#17191c", 64);

    // ----- main entrance: glass arch, mall name, the fountain court in front of it -----
    const AZ = CZ - 6;
    box(20, 16, 14, CX, 8, AZ, stone);                                                // entrance block
    plain(22, .6, 16, CX, 16.4, AZ, wood);                                            // arch sign board
    sign("ACCRA GALLERIA MALL", 18, 3.2, CX, 13.6, AZ - 8.2, 0, wood, "#f2d27a", 72);
    for (let i = -4; i <= 4; i++) plain(.5, 10, .5, CX + i * 2.2, 10.6, AZ - 7.2, gold);   // arch ribs in front
    plain(16, 10, .3, CX, 8, AZ - 7.2, glass);                                        // glass arch face
    plain(10, .4, 10, CX, 14, AZ - 2, glass);                                         // glass roof panel
    // fountain court
    plain(18, .4, 12, CX, .3, AZ - 15, mat("#d8d2c4"));
    plain(10, .8, 6, CX, .5, AZ - 16, mat("#b9c2c8"));
    plain(8, .3, 4, CX, 1.1, AZ - 16, water);
    plain(1.2, 2.6, 1.2, CX, 1.9, AZ - 16, stone);

    // ----- shop fronts on the west side: food court, supermarket, cinema -----
    const SX = X0 + 14;
    box(22, 8, 14, SX, 4, Z1 - 12, stone);                                             // food court block
    sign("FOOD COURT", 14, 2.4, SX, 6.2, Z1 - 12 + 7.2, 0, dark, "#f2d27a", 80);
    box(22, 7, 14, SX, 3.5, Z0 + 12, stone);                                           // supermarket block
    sign("SUPERMARKET & FRESH FOOD", 18, 2.2, SX, 5.6, Z0 + 12 + 7.2, 0, dark, "#ffffff", 64);

    // ----- east side: designer and luxury retail -----
    const EX = X1 - 12;
    box(14, 7, 16, EX, 3.5, Z0 + 16, stone);
    sign("DESIGNER & LUXURY RETAIL", 12, 2.2, EX, 5.6, Z0 + 16 + 8.2, 0, dark, "#e6c677", 56);
    box(14, 7, 16, EX, 3.5, CZ + 6, stone);
    sign("LUXURY RETAIL", 10, 2.2, EX, 5.6, CZ + 6 + 8.2, 0, dark, "#ffffff", 64);

    // ----- cinema block (rear, north-east) -----
    box(18, 10, 12, X1 - 9, 5, Z0 + 2, white);
    sign("CINEMA (6 SCREENS)", 14, 2.2, X1 - 9, 8.2, Z0 + 2 + 6.2, 0, dark, "#ffffff", 58);

    // ----- parking garage (rear, south-west), three levels -----
    const GX = X0 + 12, GZ = Z1 - 6;
    box(20, 10.5, 12, GX, 5.25, GZ, grey);
    [3.4, 6.8].forEach(y => plain(20.3, .15, 12.3, GX, y, GZ, dark));                 // level floors
    sign("PARKING", 12, 2.4, GX, 9.2, GZ + 6.2, 0, teal, "#ffffff", 72);
    [["L1", 2.5], ["L2", 5.9], ["L3", 9.3]].forEach(l => plain(2.6, .8, .2, GX - 8, l[1], GZ + 6.2, dark));

    // ----- rooftop garden on the entrance block -----
    plain(20, .4, 14, CX, 16.2, AZ, green);
    for (let i = -3; i <= 3; i++) plain(1.4, 1.4, 1.4, CX + i * 2.6, 17, AZ + 2, mat("#4f8f3a"));

    // ----- palms, cars and planting -----
    const ac = window.AccraAssets;
    if (ac && ac.createTree) {
      [[X0 + 3, Z0 + 3], [X0 + 3, Z1 - 3], [X1 - 3, Z1 - 3], [CX - 16, Z0 + 4], [CX + 16, Z0 + 4]].forEach(p =>
        ac.createTree(scene, { type: "palm", position: [p[0], 0, p[1]] }));
    }

    // ----- planned, next steps -----
    // Interior: the food court, supermarket and shop units become walkable, with doors, stock and tills.
    // Game links: the mall entrance becomes the mall door; the shop and phone links point here; the old mall is removed.

    window.ACCRA_MALL = { x: CX, z: CZ, door: { x: CX, z: AZ - 8 }, bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1 } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).mall = 1;
    console.log("Accra Galleria Mall exterior ready at", CX, CZ);
  } catch (err) { console.error("accra-mall failed:", err); }
})();
