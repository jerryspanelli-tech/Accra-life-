/* accra-toll.js - the Accra Gate toll plaza with proper boom barriers.
 * accra-world.js calls window.AccraToll.build(P, list, mk, x, th) when a toll chunk streams in. Each lane has one
 * boom barrier: it hinges at one end, is striped red and white, and rises as a single piece. P.until (set by the
 * payment code in accra-world.js) opens every barrier at the same time for 8 seconds. Everything is added to the
 * chunk list so it is cleaned up when the chunk leaves. */
(function () {
  try {
    const B = BABYLON;
    const LANES = [-7.5, -2.5, 2.5, 7.5];
    const ARM_LEN = 3.4, UP = -1.45, OPEN_MS = 8000;
    let texCache = null;

    // textures are made once and reused by every toll
    function textures() {
      if (texCache) return texCache;
      const sign = (t, sub) => {
        const dt = new B.DynamicTexture("toll_" + t, { width: 1024, height: 256 }, scene, false), c = dt.getContext();
        c.fillStyle = "#15171c"; c.fillRect(0, 0, 1024, 256);
        c.fillStyle = "#ffffff"; c.font = "bold 92px system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(t, 512, sub ? 92 : 128, 980);
        if (sub) { c.font = "bold 70px system-ui"; c.fillStyle = "#fcd116"; c.fillText(sub, 512, 190, 980); }
        dt.update(); return dt;
      };
      const flagDt = new B.DynamicTexture("toll_flag", { width: 256, height: 170 }, scene, false), fc = flagDt.getContext();
      fc.fillStyle = "#c8102e"; fc.fillRect(0, 0, 256, 57);
      fc.fillStyle = "#fcd116"; fc.fillRect(0, 57, 256, 56);
      fc.fillStyle = "#006b3f"; fc.fillRect(0, 113, 256, 57);
      fc.fillStyle = "#000000"; fc.beginPath(); fc.arc(128, 85, 16, 0, Math.PI * 2); fc.fill();
      flagDt.update();
      const billDt = new B.DynamicTexture("toll_bill", { width: 512, height: 220 }, scene, false), bc = billDt.getContext();
      bc.fillStyle = "#2456a6"; bc.fillRect(0, 0, 512, 220);
      bc.fillStyle = "#ffffff"; bc.font = "bold 70px system-ui"; bc.textAlign = "center"; bc.textBaseline = "middle";
      bc.fillText("Visit Accra", 256, 80);
      bc.fillStyle = "#fcd116"; bc.font = "bold 40px system-ui"; bc.fillText("Safer roads. Better Ghana.", 256, 165);
      billDt.update();
      texCache = {
        gate: (p) => sign("ACCRA GATE TOLL", "GH\u00A2" + p.fee),
        highways: sign("GHANA HIGHWAYS", "AUTHORITY"),
        safer: sign("Safer Roads", "Better Ghana"),
        flag: flagDt, bill: billDt
      };
      return texCache;
    }

    function plane(name, dt, w, h, x, y, z, rotY, list) {
      const p = B.MeshBuilder.CreatePlane(name, { width: w, height: h }, scene);
      p.position.set(x, y, z); p.rotation.y = rotY; p.isPickable = false;
      const m = new B.StandardMaterial(name + "_m", scene);
      m.diffuseTexture = dt; m.emissiveTexture = dt; m.disableLighting = true; m.backFaceCulling = false;
      p.material = m; list.push(p); return p;
    }

    // one boom barrier: a hinge pivot with three striped segments (red, white, red) that rise together
    function boom(x, y, z, list, mk, th) {
      const pivot = new B.TransformNode("boom_pivot", scene);
      pivot.position.set(x, y, z);
      list.push(pivot);
      const seg = ARM_LEN / 3, cols = ["#c8102e", "#f2f2f0", "#c8102e"];
      const parts = [];
      cols.forEach((c, i) => {
        const b = mk(seg, .22, .22, 0, 0, 0, c, th);      // built at the origin, then placed on the pivot
        b.parent = pivot;
        b.position.set(seg * (i + .5), 0, 0);
        b.checkCollisions = true;
        parts.push(b); list.push(b);
      });
      return { pivot, parts };
    }

    function build(P, list, mk, x, th) {
      const T = textures();
      const z = P.z, front = z + 8.2;
      P.arms = [];                                            // the payment code and this module both use P.arms
      const booms = [];

      // overhead canopy and columns (only the columns stand beside the lanes; nothing overhead blocks the road)
      const above = (m) => { m.checkCollisions = false; list.push(m); };
      above(mk(30, .8, 16, x, 6.4, z, "#e4e6ea", th));
      above(mk(30.4, 1.4, .5, x, 6.2, z + 8, "#1f232a", th));
      above(mk(30.4, 1.4, .5, x, 6.2, z - 8, "#1f232a", th));
      [-14, 14].forEach(o => [-6, 6].forEach(dz => { const c = mk(1.2, 6.4, 1.2, x + o, 3.2, z + dz, "#9a9a96", th); c.checkCollisions = true; list.push(c); }));

      // signs on the front fascia
      list.push(plane("tl_gate", T.gate(P), 16, 4, x, 5.6, front, Math.PI, list));
      list.push(plane("tl_hwy", T.highways, 8, 3, x - 14, 5.6, front, Math.PI, list));
      list.push(plane("tl_safe", T.safer, 8, 3, x + 14, 5.6, front, Math.PI, list));

      // lane lights: green for open lanes, red for the closed one
      LANES.forEach((lx, i) => above(mk(1.2, .5, .25, x + lx, 5.7, z - 2, i === 3 ? "#e02424" : "#20c24a", th)));

      // one boom barrier per lane, hinged at the kerb side of the lane
      LANES.forEach(lx => {
        const b = boom(x + lx - ARM_LEN / 2, 1.2, z - 8, list, mk, th);
        booms.push(b); P.arms.push(b.pivot);
      });

      // open all barriers together for 8 seconds after each payment (P.until changes when the fee is paid)
      const gate = { last: P.until, openAt: 0, obs: null };
      gate.obs = scene.onBeforeRenderObservable.add(() => {
        if (booms.every(b => b.pivot.isDisposed())) { scene.onBeforeRenderObservable.remove(gate.obs); return; }
        if (P.until !== gate.last) { gate.last = P.until; if (P.until) gate.openAt = performance.now() + OPEN_MS; }
        const open = performance.now() < gate.openAt;
        booms.forEach(b => {
          if (b.pivot.isDisposed()) return;
          b.pivot.rotation.z += ((open ? UP : 0) - b.pivot.rotation.z) * .12;   // rise to vertical, or fall back
          b.parts.forEach(p => { p.checkCollisions = !open; });
        });
      });

      // Ghana flags on poles at each side of the plaza, and a billboard
      [-19, 19].forEach(o => {
        list.push(mk(.18, 9, .18, x + o, 4.5, z - 8, "#9a9a96", th));
        plane("tl_flag", T.flag, 2.6, 1.7, x + o + 1.4, 7.4, z - 8, 0, list);
      });
      list.push(mk(.3, 5, .3, x - 24, 2.5, z + 4, "#6b7178", th));
      plane("tl_bill", T.bill, 12, 5, x - 24, 5.2, z + 4, Math.PI / 2, list);
    }

    window.AccraToll = { build };
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).toll = 1;
    console.log("Accra toll boom barriers ready");
  } catch (err) { console.error("accra-toll failed:", err); }
})();
