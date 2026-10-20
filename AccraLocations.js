// AccraLocations.js - normal browser script (no import / export).
// Builds the Labadi Beach swimming zone and beach area. Independence Square has been removed.
// Old Accra Mall, Accra Vibes Pub and Sports Stadium blocks are kept but switched OFF by default,
// because the enterable versions already live in accra-upgrade.js.
(function () {
  class AccraLocations {
    constructor(scene, opts) {
      this.scene = scene; this.landmarks = []; this.waterZones = []; this.mats = {};
      this.opts = Object.assign({ oldMall: false, oldPub: false, oldStadium: false }, opts);
    }
    mat(hex, extra) {
      const k = hex + (extra ? "x" : "");
      if (!this.mats[k]) { const m = new BABYLON.StandardMaterial("loc" + k, this.scene); m.diffuseColor = BABYLON.Color3.FromHexString(hex); m.specularColor = new BABYLON.Color3(.05, .05, .05); if (extra) Object.assign(m, extra); this.mats[k] = m; }
      return this.mats[k];
    }
    box(w, h, d, x, y, z, hex, solid) {
      const m = BABYLON.MeshBuilder.CreateBox("loc", { width: w, height: h, depth: d }, this.scene);
      m.position.set(x, y, z); m.material = this.mat(hex); m.checkCollisions = !!solid;
      if (typeof sg !== "undefined" && h > .2) sg.addShadowCaster(m);
      return m;
    }

    buildFullAccraMap() {
      if (this.opts.oldMall) this.buildAccraMall();
      if (this.opts.oldPub) this.buildSocialPubsAndNightlife();
      if (this.opts.oldStadium) this.buildAccraSportsStadium();
      this.buildLabadiBeachAndSwimming();
    }

    // Labadi Beach: uses the sea already in the game (z 203 to 332) instead of a second ocean.
    buildLabadiBeachAndSwimming() {
      this.waterZones.push({ minX: -278, maxX: 278, minZ: 203.5, maxZ: 332 });
      const wall = this.box(600, 6, 2, 0, 3, 335, "#000000", true); wall.isVisible = false;   // keeps swimmers inside the sea
      for (let i = 0; i < 28; i++) { const b = BABYLON.MeshBuilder.CreateSphere("buoy", { diameter: .9, segments: 4 }, this.scene); b.position.set(-270 + i * 20, .3, 330); b.material = this.mat(i % 2 ? "#ff7a1a" : "#ffffff"); b.isPickable = false; }
      [-120, -90, 44, 80, 120].forEach((x, i) => {                                            // beach umbrellas and loungers
        this.box(.12, 3, .12, x, 1.5, 190, "#dddddd");
        const u = BABYLON.MeshBuilder.CreateCylinder("umb", { diameterTop: .2, diameterBottom: 4, height: 1, tessellation: 8 }, this.scene);
        u.position.set(x, 3.3, 190); u.material = this.mat(["#c8102e", "#fcd116", "#006b3f"][i % 3]); u.isPickable = false;
        this.box(.9, .25, 2, x + 1.6, .2, 191, "#f3e8c8");
      });
      const LX = -62;                                                                         // lifeguard tower
      this.box(2.6, .25, 2.6, LX, 3.2, 196, "#ffffff");
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => this.box(.2, 3.2, .2, LX + c[0], 1.6, 196 + c[1], "#c8102e"));
      this.box(.1, 1.4, .1, LX, 4.2, 196, "#cccccc"); this.box(1, .6, .05, LX + .5, 4.6, 196, "#c8102e");
      window.ACCRA_WATER = { contains: p => this.checkSwimming(p) };
      this.landmarks.push({ name: "Labadi Beach Swimming Zone", pos: new BABYLON.Vector3(0, 0, 190) });
    }
    checkSwimming(p) {
      for (const z of this.waterZones) if (p.x > z.minX && p.x < z.maxX && p.z > z.minZ && p.z < z.maxZ) return true;
      return false;
    }

    // OLD blocks, switched off by default.
    buildAccraMall() { const m = BABYLON.MeshBuilder.CreateBox("accraMallOld", { width: 140, height: 24, depth: 90 }, this.scene); m.position.set(-80, 12, 180); }
    buildSocialPubsAndNightlife() { const m = BABYLON.MeshBuilder.CreateBox("accraVibesPubOld", { width: 55, height: 18, depth: 40 }, this.scene); m.position.set(120, 9, -60); }
    buildAccraSportsStadium() { const s = BABYLON.MeshBuilder.CreateCylinder("accraStadiumOld", { diameter: 160, height: 28 }, this.scene); s.scaling.z = 220 / 160; s.position.set(180, 14, -200); }
  }
  AccraLocations.VERSION = 7;
  window.AccraLocations = AccraLocations;
  (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).locations = 1;
})();
