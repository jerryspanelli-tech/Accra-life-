/* accra-world-layout.js
 * Shared, versioned coordinates for the N6 Accra–Kumasi game corridor.
 * The 1:10 route compression is a gameplay approximation, not a surveyed map.
 * Load before accra-towns.js; accra-world.js is loaded later by accra-life.js.
 */
(function () {
  "use strict";
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const highway = { startZ: -150, endZ: -24500, driftX: -2400, width: 20, chunkLength: 256, scaleRealKmPerGameKm: 10.2 };
  const towns = [
    { name: "Nsawam", label: "NSAWAM", z: -3500, radius: 150, big: 0, offsetX: 220, landmark: "fish", fare: 25 },
    { name: "Suhum", label: "SUHUM", z: -6500, radius: 190, big: 0, offsetX: 220, landmark: "hill", fare: 40 },
    { name: "Bunso", label: "BUNSO", z: -9500, radius: 150, big: 0, offsetX: 220, landmark: "grove", fare: 55 },
    { name: "Anyinam", label: "ANYINAM", z: -11200, radius: 150, big: 0, offsetX: 220, landmark: "market", fare: 60 },
    { name: "Nkawkaw", label: "NKAWKAW", z: -13000, radius: 190, big: 0, offsetX: 220, landmark: "roundabout", fare: 70 },
    { name: "Konongo", label: "KONONGO", z: -19000, radius: 190, big: 0, offsetX: 220, landmark: "gold", fare: 90 },
    { name: "Ejisu", label: "EJISU", z: -22500, radius: 190, big: 1, offsetX: 220, landmark: "gateway", fare: 110 },
    { name: "Kumasi", label: "KUMASI KEJETIA", z: -24500, radius: 340, big: 2, offsetX: 220, landmark: "kejetia", fare: 130 }
  ];
  const highwayX = z => highway.driftX * smooth((-z - Math.abs(highway.startZ)) / (Math.abs(highway.endZ) - Math.abs(highway.startZ)));
  const highwaySlope = z => (highwayX(z - 8) - highwayX(z + 8)) / 16;
  const distanceKm = z => Math.max(0, Math.round((-z - Math.abs(highway.startZ)) / 1000 * highway.scaleRealKmPerGameKm));
  const townX = name => { const t = towns.find(q => q.name.toLowerCase() === String(name).toLowerCase()); return t ? highwayX(t.z) + t.offsetX : null; };
  window.ACCRA_WORLD_LAYOUT = Object.freeze({
    version: 1, scale: "1:10 approximate N6 corridor",
    bounds: Object.freeze({ minX: -6000, maxX: 6000, minZ: -26000, maxZ: 1000 }),
    highway: Object.freeze(highway), towns: Object.freeze(towns.map(t => Object.freeze(t))),
    highwayX, highwaySlope, distanceKm, townX
  });
  (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).worldLayout = 1;
  console.log("Accra world layout ready:", towns.length, "N6 stops");
})();
