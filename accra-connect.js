/* accra-connect.js - joins every road in the city into one network.
 * Adds driveways from the grid roads to landmarks, sets them completely flat,
 * and includes the Accra Gate Toll payment and opening system. */
(function () {
  try {
    const B = BABYLON;
    const asphalt = mat("#2b2d31");

    // one road strip, given by its edges (x1..x2, z1..z2) - flattened to sit flush with the grid
    function strip(name, x1, x2, z1, z2) {
      const w = x2 - x1, d = z2 - z1;
      const m = B.MeshBuilder.CreateBox("road_" + name, { width: w, height: .03, depth: d }, scene);
      m.position.set((x1 + x2) / 2, .015, (z1 + z2) / 2);
      m.material = asphalt;
      m.receiveShadows = true;
      m.isPickable = false;
      m.checkCollisions = true;
      return m;
    }

    const driveways = [
      ["mall", 31, 39, 0, 17],               // mall front (35, 17) to the street at z 0
      ["police", 31, 39, 70, 89],            // police front (35, 89) to the avenue at z 70
      ["hospital", 106, 114, 70, 86],        // hospital front (110, 86) to the avenue at z 70
      ["stadium", 74, 88, 31, 39],           // stadium west side (110, 35) to the street at x 70
      ["dealership", 31, 39, -70, -46],      // Accra Motors (35, -46) to the avenue at z -70
      ["amoamah", 106, 114, -66, -56],       // Amoamah lots (110, -56) to the avenue at z -70
      ["villa", 106, 114, -105, -74],        // villa (110, -95) to the avenue at z -70
      ["beach", -4, 4, 147, 187],            // from the avenue at z 150 down to the beach sand
      ["airport-gate", -236, -228, -248, -240] // joins the airport gate road and the drop-off road
    ];
    driveways.forEach(d => strip(d[0], d[1], d[2], d[3], d[4]));

    // --- Accra Gate Toll Payment & Gate Opening System ---
    window.payToll = function() {
      if (typeof playerMoney !== 'undefined' && playerMoney >= 15) {
        playerMoney -= 15;
        alert("Toll Paid! GH₵15 deducted. Have a safe journey.");
        
        // Open the gate barrier by disabling its collision and visibility
        if (window.tollBarrierMesh) {
          window.tollBarrierMesh.setEnabled(false);
        }
        const barrier = scene.getMeshByName("toll_barrier");
        if (barrier) {
          barrier.setEnabled(false);
        }
      } else {
        alert("Not enough money for toll! (Requires GH₵15)");
      }
    };

    window.ACCRA_ROADS = { connected: true, driveways: driveways.map(d => d[0]) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).connect = 1;
    console.log("Accra roads connected:", driveways.length, "driveways added & toll system ready");
  } catch (err) { console.error("accra-connect failed:", err); }
})();
