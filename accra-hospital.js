/* accra-hospital.js - Accra General Hospital, on its own site north-east of the city (x 230..290, z -135..-85).
 * Exterior: a three-storey main block with a central red-cross tower and sign, an emergency entrance, an ambulance
 * bay, outpatient and maternity entrances, a rooftop helipad, a car park with ambulances, and palm trees.
 * The interior departments (triage, ER, ICU, theatres, labs, maternity, wards, pharmacy) are planned for a later step.
 * Built with simple solid boxes, once, at startup. */
(function () {
  try {
    const B = BABYLON;
    const CX = 260, CZ = -110;                       // centre of the hospital site
    const X0 = CX - 30, X1 = CX + 30, Z0 = CZ - 25, Z1 = CZ + 25;
    const cream = mat("#f3f0e8"), blue = mat("#7fa3c4"), glass = mat("#2a4a6a"), red = mat("#d62828");
    const grey = mat("#9aa0a6"), dark = mat("#2b2f36"), white = mat("#ffffff"), green = mat("#3f8f4a");

    const box = (w, h, d, x, y, z, m, ry) => {
      const b = B.MeshBuilder.CreateBox("hosp", { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.material = m; if (ry) b.rotation.y = ry;
      b.checkCollisions = true; b.isPickable = false; return b;
    };
    const plain = (w, h, d, x, y, z, m, ry) => { const b = box(w, h, d, x, y, z, m, ry); b.checkCollisions = false; return b; };
    const sign = (text, w, h, x, y, z, ry, bg, fg) => {
      const dt = new B.DynamicTexture("hsg", { width: 1024, height: 256 }, scene, false), c = dt.getContext();
      c.fillStyle = bg; c.fillRect(0, 0, 1024, 256);
      c.fillStyle = fg; c.font = "bold 92px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 512, 128, 990);
      dt.update();
      const p = B.MeshBuilder.CreatePlane("hsign", { width: w, height: h }, scene);
      p.position.set(x, y, z); p.rotation.y = ry || 0; p.isPickable = false;
      const m = new B.StandardMaterial("hsm", scene); m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m; return p;
    };

    // ----- ground: forecourt and car park -----
    plain(X1 - X0 + 8, .15, Z1 - Z0 + 8, CX, .08, CZ, mat("#c9ccd1"));
    plain(X1 - X0, .05, 16, CX, .1, Z1 + 6, mat("#3a3c42"));                          // driveway, south side

    // ----- main block: three storeys, glass bands, central tower -----
    const MW = 44, MD = 16, MH = 11;
    box(MW, MH, MD, CX, MH / 2, CZ - 2, cream);                                          // main wing
    [3.6, 7.2].forEach(y => plain(MW + .3, .25, MD + .3, CX, y, CZ - 2, grey));          // floor bands
    for (let f = 0; f < 3; f++) for (let k = -3; k <= 3; k++)
      plain(2.2, 2.2, .25, CX + k * 6, 1.8 + f * 3.6 + 1.2, CZ - 2 + MD / 2 + .15, glass);   // windows, front
    box(12, MH + 6, MD + 4, CX, (MH + 6) / 2, CZ + 2, cream);                             // central tower
    plain(12.3, .4, MD + 4.3, CX, MH + 6.2, CZ + 2, grey);                                // tower roof slab
    sign("ACCRA GENERAL HOSPITAL", 18, 2.6, CX, MH + 3, CZ + 2 + MD / 2 + 2.2, 0, "#ffffff", "#b71c1c");
    // red cross on the tower
    plain(5.2, 1.4, .4, CX, MH + 3, CZ + 2 + MD / 2 + 2.4, red);
    plain(1.4, 5.2, .4, CX, MH + 3, CZ + 2 + MD / 2 + 2.4, red);

    // ----- entrances: emergency, outpatient, maternity -----
    plain(12, 2.8, 2.4, X0 + 12, 1.4, CZ + MD / 2 + 2.4, dark);                          // emergency doors
    plain(12.6, .5, 4.4, X0 + 12, 3.2, CZ + MD / 2 + 3.2, red);                          // emergency canopy
    sign("EMERGENCY", 9, 1.6, X0 + 12, 4.5, CZ + MD / 2 + 3.5, 0, "#b71c1c", "#ffffff");
    plain(8, 2.8, 2.4, CX - 8, 1.4, CZ + MD / 2 + 2.4, dark);                            // outpatient
    sign("OUTPATIENT", 8, 1.6, CX - 8, 4.5, CZ + MD / 2 + 3.5, 0, "#2b5f8a", "#ffffff");
    plain(8, 2.8, 2.4, X1 - 12, 1.4, CZ + MD / 2 + 2.4, dark);                           // maternity
    sign("MATERNITY", 8, 1.6, X1 - 12, 4.5, CZ + MD / 2 + 3.5, 0, "#c2185b", "#ffffff");

    // ----- ambulance bay on the east side, with a covered drop-off -----
    box(14, 4.4, 12, X1 - 7, 2.2, CZ - 6, cream);
    plain(16, .4, 14, X1 - 7, 4.6, CZ - 6, grey);
    sign("AMBULANCE BAY", 12, 1.8, X1 - 7, 5.6, CZ - 6 + 7.1, 0, "#b71c1c", "#ffffff");
    for (let i = 0; i < 2; i++) {                                                         // ambulances parked in the bay
      const z = CZ - 12 + i * 5;
      if (window.AccraAssets && window.AccraAssets.createCar) window.AccraAssets.createCar(scene, "minibus", { color: "#ffffff", stripe: "#c8102e", position: [X1 - 7, 0, z], rotY: Math.PI / 2 });
      else { box(2.6, 2.2, 5.4, X1 - 7, 1.1 + .6, z, white); plain(2.7, .5, 5.5, X1 - 7, 2.2, z, red); }
    }

    // ----- rooftop helipad -----
    const HP = B.MeshBuilder.CreateTorus("heli", { diameter: 8, thickness: .4, tessellation: 24 }, scene);
    HP.position.set(CX - 4, MH + 6.5, CZ + 2); HP.rotation.x = Math.PI / 2; HP.material = white; HP.isPickable = false;
    plain(1.2, .05, 1.2, CX - 4, MH + 6.5, CZ + 2, red);

    // ----- car park and palms -----
    for (let i = 0; i < 6; i++) plain(2.4, 1.4, 4.6, X0 + 4 + i * 4.4, .7, Z1 + 3, grey);
    const ac = window.AccraAssets;
    if (ac && ac.createTree) {
      [[X0 + 2, Z0 + 2], [X0 + 2, Z1 - 2], [X1 - 2, Z0 + 2], [CX - 26, Z1 + 8], [CX + 26, Z1 + 8]].forEach(p =>
        ac.createTree(scene, { type: "palm", position: [p[0], 0, p[1]] }));
    }

    // ----- planned interior (next step) -----
    // Ground: triage and reception, ER bays, outpatient rooms. First: ICU, theatres, labs, radiology.
    // Second: maternity and NICU, recovery wards, pharmacy.

    window.ACCRA_HOSPITAL = { x: CX, z: CZ, entrance: { x: X0 + 12, z: CZ + MD / 2 + 2.4 }, bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1 } };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).hospital = 1;
    console.log("Accra General Hospital ready at", CX, CZ);
  } catch (err) { console.error("accra-hospital failed:", err); }
})();
