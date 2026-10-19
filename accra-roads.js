/* accra-connect.js - Road connections, flattened driveways, and robust Toll Gate opener */
(function () {
  try {
    const B = BABYLON;
    const asphalt = mat("#2b2d31");

    // Flattened road strips so cars never hit a wall
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
      ["mall", 31, 39, 0, 17],
      ["police", 31, 39, 70, 89],
      ["hospital", 106, 114, 70, 86],
      ["stadium", 74, 88, 31, 39],
      ["dealership", 31, 39, -70, -46],
      ["amoamah", 106, 114, -66, -56],
      ["villa", 106, 114, -105, -74],
      ["beach", -4, 4, 147, 187],
      ["airport-gate", -236, -228, -248, -240]
    ];
    driveways.forEach(d => strip(d[0], d[1], d[2], d[3], d[4]));

    // --- Robust Toll Gate Payment & Automatic Barrier Opener ---
    window.payToll = function() {
      // Check if player has enough money (defaults to checking global playerMoney or window variable)
      let money = typeof playerMoney !== 'undefined' ? playerMoney : 1794000;
      
      if (money >= 15) {
        if (typeof playerMoney !== 'undefined') playerMoney -= 15;
        alert("Toll Paid! GH₵15 deducted. Gate is opening...");
        
        // Find and disable all red toll barrier bars in the scene
        scene.meshes.forEach(m => {
          // Identify toll barriers by checking if their material is red (#ff2a2a or similar) or position
          if (m.material && m.material.emissiveColor) {
            const hex = m.material.emissiveColor.toHexString();
            if (hex.toLowerCase() === "#ff2a2a" || hex.toLowerCase() === "#ff3b3b") {
              m.setEnabled(false); // Instantly opens the gate!
            }
          }
        });

        // Fallback: Disable any mesh explicitly named or tagged as barrier
        if (window.tollBarrierMesh) window.tollBarrierMesh.setEnabled(false);
      } else {
        alert("Not enough money for toll! (Requires GH₵15)");
      }
    };

    window.ACCRA_ROADS = { connected: true, driveways: driveways.map(d => d[0]) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).connect = 1;
    console.log("Accra connect loaded with robust toll opener.");
  } catch (err) { console.error("accra-connect failed:", err); }
})();
