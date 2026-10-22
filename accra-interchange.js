/* accra-interchange.js - the overpass where the highway crosses the city's north avenue (z = -150).
 * The highway deck is raised over the avenue on pillars. Ramps join the deck to the north-south road (x = 0)
 * on both sides and to the east-west avenue on both sides, so the interchange connects several roads.
 * Built once, at startup, with simple solid boxes. */
(function () {
  try {
    const B = BABYLON;
    const AVE_Z = -150;          // east-west avenue
    const NS_X = 0;              // north-south road that the highway continues from
    const DECK_Y = 6.5;          // height of the deck top
    const DECK_W = 20;           // lane width of the deck (2 carriageways)
    const DECK_Z0 = -112, DECK_Z1 = -188;   // deck runs from south of the avenue to north of it
    const RAMP_W = 9;

    const concrete = mat("#9a9a96"), asphalt = mat("#2f3033"), white = mat("#f2f2f2"), rail = mat("#b8bcc2");
    const solid = (m) => { m.checkCollisions = true; m.isPickable = false; return m; };
    const box = (w, h, d, x, y, z, m, rx, ry) => {
      const b = B.MeshBuilder.CreateBox("ic", { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.material = m;
      if (rx) b.rotation.x = rx; if (ry) b.rotation.y = ry;
      return solid(b);
    };

    // ----- the deck (raised highway) -----
    const deckLen = DECK_Z0 - DECK_Z1;               // positive
    const deckMid = (DECK_Z0 + DECK_Z1) / 2;
    box(DECK_W, 0.8, deckLen, NS_X, DECK_Y - 0.4, deckMid, asphalt);
    box(DECK_W + 1.2, 0.5, deckLen, NS_X, DECK_Y - 0.9, deckMid, concrete);       // underside slab
    [-DECK_W / 2 - .3, DECK_W / 2 + .3].forEach(x => box(.5, .9, deckLen, NS_X + x, DECK_Y + .45, deckMid, rail));   // barriers
    // centre line
    box(.25, .05, deckLen, NS_X, DECK_Y + .42, deckMid, white);

    // ----- pillars: clear of the avenue (which is about 8 m wide) -----
    [-8.5, 8.5].forEach(x => [DECK_Z0 - 8, -138, -162, DECK_Z1 + 8].forEach(z => {
      box(2.2, DECK_Y - .5, 2.2, NS_X + x, (DECK_Y - .5) / 2, z, concrete);
    }));

    // ----- ramps: a sloped box from a ground point up to the deck -----
    function ramp(x0, z0, x1, z1, y0, y1, width) {
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), dy = y1 - y0;
      const slope = Math.atan2(dy, len);            // how steep the ramp is
      const yaw = Math.atan2(dx, dz);              // which way it runs
      const m = box(width, .5, len, (x0 + x1) / 2, (y0 + y1) / 2 - .25 / Math.cos(slope), (z0 + z1) / 2, asphalt, 0, yaw);
      m.rotation.x = -slope;
      return m;
    }

    // north-south ramps (on the x = 0 road), south of the avenue and north of it
    ramp(NS_X, DECK_Z0 + 22, NS_X, DECK_Z0, 0, DECK_Y, RAMP_W);      // south: ground rises to the deck
    ramp(NS_X, DECK_Z1, NS_X, DECK_Z1 - 22, DECK_Y, 0, RAMP_W);      // north: deck comes down to the ground

    // east-west ramps: from the avenue at each side up to the deck, so the avenue joins the highway
    ramp(30, AVE_Z - 6, DECK_W / 2 + 1, AVE_Z - 6, 0, DECK_Y - .4, 6);   // east side, rising toward the deck
    ramp(-30, AVE_Z + 6, -DECK_W / 2 - 1, AVE_Z + 6, 0, DECK_Y - .4, 6); // west side, rising toward the deck
    ramp(30, AVE_Z + 6, DECK_W / 2 + 1, AVE_Z + 6, 0, DECK_Y - .4, 6);   // east side, second lane
    ramp(-30, AVE_Z - 6, -DECK_W / 2 - 1, AVE_Z - 6, 0, DECK_Y - .4, 6); // west side, second lane

    window.ACCRA_INTERCHANGE = { deckY: DECK_Y, z0: DECK_Z0, z1: DECK_Z1 };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).interchange = 1;
    console.log("Accra interchange ready");
  } catch (err) { console.error("accra-interchange failed:", err); }
})();
