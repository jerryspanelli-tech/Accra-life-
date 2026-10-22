/* accra-hq.js - Accra Central Police Headquarters, on its own site east of the city (x 220..300, z -20..50).
 * Perimeter wall with dark blue trim, a guarded gate with an arch and a boom, a three-level admin block with
 * glass bands, rooftop solar panels and a sign, a police car park and an armoured truck bay, and palm trees.
 * Built with simple solid boxes, once, at startup. */
(function () {
  try {
    const B = BABYLON;
    const CX = 260, CZ = 15;                 // centre of the compound
    const X0 = CX - 40, X1 = CX + 40, Z0 = CZ - 35, Z1 = CZ + 35;   // compound bounds
    const WALL_H = 3.2;
    const navy = mat("#1f2f5a"), white = mat("#e8ecf0"), glass = mat("#24384f"), grey = mat("#8d949c");
    const solar = mat("#1b2a4a"), dark = mat("#15171c"), gold = mat("#c9a54a");

    const box = (w, h, d, x, y, z, m, ry) => {
      const b = B.MeshBuilder.CreateBox("hq", { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.material = m; if (ry) b.rotation.y = ry;
      b.checkCollisions = true; b.isPickable = false; return b;
    };
    const plain = (w, h, d, x, y, z, m, ry) => {                // same box, but drivable / no collisions
      const b = box(w, h, d, x, y, z, m, ry); b.checkCollisions = false; return b;
    };
    const sign = (text, w, h, x, y, z, ry, bg, fg) => {
      const dt = new B.DynamicTexture("hqs", { width: 1024, height: 200 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 1024, 200);
      c.fillStyle = fg; c.font = "bold 78px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 512, 102, 980);
      dt.update();
      const p = B.MeshBuilder.CreatePlane("hqsign", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.rotation.y = ry || 0; p.isPickable = false;
      const m = new B.StandardMaterial("hqsm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m; return p;
    };

    // ----- perimeter wall with a gate gap on the north side -----
    const GATE_W = 14, GX = CX;
    plain(80, .2, 70, CX, .05, CZ, mat("#c9ccd1"));                         // compound forecourt (paved)
    box(X1 - X0, WALL_H, .8, CX, WALL_H / 2, Z1, navy);                     // south wall
    box(.8, WALL_H, Z1 - Z0, X1, WALL_H / 2, CZ, navy);                     // east wall
    box(.8, WALL_H, Z1 - Z0, X0, WALL_H / 2, CZ, navy);                     // west wall
    box((X1 - X0 - GATE_W) / 2, WALL_H, .8, X0 + (X1 - X0 - GATE_W) / 4, WALL_H / 2, Z0, navy);   // north wall, left of gate
    box((X1 - X0 - GATE_W) / 2, WALL_H, .8, X1 - (X1 - X0 - GATE_W) / 4, WALL_H / 2, Z0, navy);   // north wall, right of gate
    [X0, X1].forEach(x => box(1.2, WALL_H + .6, 1.2, x, (WALL_H + .6) / 2, Z0, white));            // corner posts
    // dark blue privacy trim along the top of the wall
    [[CX, Z1, X1 - X0, 0], [X1, CZ, Z1 - Z0, Math.PI / 2], [X0, CZ, Z1 - Z0, Math.PI / 2]].forEach(w => plain(w[2], .3, .9, w[0], WALL_H + .15, w[1], navy, w[3]));

    // ----- gate arch, sentry box and boom -----
    box(GATE_W + 4, 1.2, 2.4, GX, 6.2, Z0 - .6, navy);                                 // arch beam
    box(1.2, 6.2, 2.4, GX - GATE_W / 2 - 2, 3.1, Z0 - .6, white);                      // arch pillars
    box(1.2, 6.2, 2.4, GX + GATE_W / 2 + 2, 3.1, Z0 - .6, white);
    sign("ACCRA CENTRAL POLICE HEADQUARTERS", 16, 3.2, GX, 6.6, Z0 - 1.9, Math.PI, navy, "#ffffff");
    sign("ACCRA CENTRAL POLICE HEADQUARTERS", 16, 3.2, GX, 6.6, Z0 - 1.7, 0, navy, "#ffffff");
    box(3, 2.6, 3, GX - 6, 1.3, Z0 + 4, navy);                                          // sentry box
    box(2.4, .6, 2.6, GX - 6, 2.9, Z0 + 4, dark);                                       // sentry roof
    box(.25, .25, 8, GX + 6, 1.0, Z0 + 4, white);                                       // boom barrier arm (raised by the post)
    [-1, 1].forEach(s => { const p = box(.6, 1.3, .6, GX + 6 + s * 0, .65, Z0 + 4 + s * 4, grey); p.checkCollisions = false; });

    // ----- main administration building: three levels, glass bands, solar roof -----
    const BW = 44, BD = 20, BZ = CZ + 8, BH = 12;
    box(BW, BH, BD, CX, BH / 2, BZ, white);                                             // main block
    [3.2, 6.8, 10.4].forEach(y => plain(BW + .3, .25, BD + .3, CX, y, BZ, grey));     // floor bands
    plain(BW - 2, 1.2, .3, CX, 1.6, BZ + BD / 2 + .15, glass);
    for (let f = 0; f < 3; f++) plain(BW - 6, 2.6, .25, CX, 2.2 + f * 3.6 + .9, BZ + BD / 2 + .15, glass);   // glass bands on the front
    plain(12, 2.8, 1.4, CX, 1.4, BZ + BD / 2 + .9, dark);                                 // main entrance
    plain(14, .4, 3, CX, 3.0, BZ + BD / 2 + 1.6, navy);                                   // entrance canopy
    sign("ACCRA CENTRAL POLICE HEADQUARTERS", 26, 4.2, CX, BH - 1.8, BZ + BD / 2 + .2, 0, navy, "#ffffff");
    [[-12, 0], [12, 0]].forEach(p => {                                                   // solar panels, each on a tilted rack
      const r = plain(18, .15, 8, CX + p[0], BH + .55, BZ - 3, solar); r.rotation.x = -.35;
    });
    plain(BW - 4, .4, BD - 4, CX, BH + .2, BZ, grey);                                    // roof slab
    // a smaller block for the CID and the custody suite, behind the main building
    box(22, 8, 12, CX + 4, 4, BZ - BD / 2 - 9, white);
    plain(22.4, .2, 12.4, CX + 4, 8.1, BZ - BD / 2 - 9, grey);

    // ----- armoured truck bay and police car park -----
    const PARK_Z = Z1 - 12;
    for (let i = 0; i < 4; i++) box(3.2, 2.6, 6.2, CX - 16 + i * 4, 1.3, PARK_Z - 4, dark);   // armoured trucks
    const ac = window.AccraAssets;
    for (let i = 0; i < 8; i++) {
      const x = CX + 8 + (i % 4) * 4.2, z = PARK_Z + (i < 4 ? -2 : 2.4);
      if (ac && ac.createCar) { const c = ac.createCar(scene, "sedan", { color: "#f2f2f2", position: [x, 0, z], rotY: Math.PI / 2 }); c.getChildMeshes().forEach(m => m.checkCollisions = false); }
      else plain(2, 1.2, 4.2, x, .6, z, white);
    }
    // driveway and lane lines
    plain(6, .05, Z1 - Z0 - 8, CX - 30, .04, CZ, mat("#3a3c42"));
    [CX - 30 - 1.5, CX - 30 + 1.5].forEach(x => plain(.2, .06, Z1 - Z0 - 10, x, .06, CZ, white));

    // ----- palms and planting -----
    if (window.AccraAssets && window.AccraAssets.createTree) {
      [[X0 + 4, Z1 - 4], [X1 - 4, Z1 - 4], [X0 + 4, Z0 + 6], [X1 - 4, Z0 + 6], [CX + 26, Z0 + 4], [CX - 26, Z0 + 4]].forEach(p =>
        window.AccraAssets.createTree(scene, { type: "palm", position: [p[0], 0, p[1]] }));
    }

    window.ACCRA_HQ = { x: CX, z: CZ, gate: { x: GX, z: Z0 }, bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1 } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).hq = 1;
    console.log("Accra Central Police HQ ready at", CX, CZ);
  } catch (err) { console.error("accra-hq failed:", err); }
})();
