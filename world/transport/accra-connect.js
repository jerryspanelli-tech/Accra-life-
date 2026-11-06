/* accra-connect.js - joins every road in the city into one network.
 * Adds driveways from the grid roads to the mall, police, hospital, stadium, dealership, Amoamah, the villa,
 * the beach and the Kotoka airport access road. The driveways are flat strips that sit flush with the grid; they are not solid,
 * so walking and driving over them is smooth. Toll payment is handled only by accra-world.js and accra-toll.js. */
(function () {
  try {
    const B = BABYLON;
    const asphalt = mat("#2b2d31");

    // one road strip, given by its edges (x1..x2, z1..z2), flat and flush with the grid
    function strip(name, x1, x2, z1, z2) {
      const w = x2 - x1, d = z2 - z1;
      const m = B.MeshBuilder.CreateBox("road_" + name, { width: w, height: .03, depth: d }, scene);
      m.position.set((x1 + x2) / 2, .015, (z1 + z2) / 2);
      m.material = asphalt;
      m.receiveShadows = true;
      m.isPickable = false;
      m.checkCollisions = false;   // a 3 cm strip must not trip the player or stop a car: it is flush with the road
      return m;
    }

    const driveways = [
      ["police-hq", -107, -93, 60, 70],      // western HQ gate to the z=70 city avenue
      ["hospital", 80, 140, 131, 150],       // hospital forecourt to the z=150 city avenue
      ["galleria-link", 150, 260, 66, 74],   // eastbound road from the x=150 city road
      ["galleria-gate", 256, 264, 70, 90],   // northbound approach to the Galleria gate
      ["stadium", 70, 110, 31, 39],          // stadium west side (110, 35) to the street at x 70
      ["dealership", 31, 39, -70, -46],      // Accra Motors (35, -46) to the avenue at z -70
      ["amoamah", 106, 114, -66, -56],       // Amoamah lots (110, -56) to the avenue at z -70
      ["villa", 106, 114, -105, -74],        // villa (110, -95) to the avenue at z -70
      ["beach", -4, 4, 147, 187],            // from the avenue at z 150 down to the beach sand
      ["airport-access", -430, -150, -160, -140] // westbound link from the city avenue to Kotoka airport road at x=-420
    ];
    driveways.forEach(d => strip(d[0], d[1], d[2], d[3], d[4]));

    window.ACCRA_ROADS = { connected: true, driveways: driveways.map(d => d[0]) };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).connect = 1;
    console.log("Accra roads connected:", driveways.length, "driveways added");
  } catch (err) { console.error("accra-connect failed:", err); }
})();
