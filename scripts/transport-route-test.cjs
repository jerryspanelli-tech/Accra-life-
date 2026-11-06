const fs = require("node:fs");
const assert = require("node:assert/strict");

const world = fs.readFileSync("world/region/accra-world.js", "utf8");
const towns = fs.readFileSync("world/region/accra-towns.js", "utf8");
const life = fs.readFileSync("accra-life.js", "utf8");

const route = [
  ["Nsawam", -3500, 25],
  ["Suhum", -6500, 40],
  ["Bunso", -9500, 55],
  ["Anyinam", -11000, 62],
  ["Nkawkaw", -13000, 70],
  ["Konongo", -19000, 90],
  ["Ejisu", -22500, 110],
  ["Kumasi", -24500, 130]
];

for (const [name, z, fare] of route) {
  assert.ok(world.includes(`["${name}", ${z},`), `World stream is missing ${name} at z=${z}`);
  assert.ok(world.includes(`${name}: ${fare}`), `Intercity fare is missing or changed for ${name}`);
  assert.ok(life.includes(`"${name === "Kumasi" ? "Kumasi (Kejetia)" : name}": highwayTown(${z})`), `Admin teleport is missing or misaligned for ${name}`);
  assert.ok(towns.includes(`{ n: "${name === "Kumasi" ? "KUMASI KEJETIA" : name.toUpperCase()}", z: ${z},`), `Town landmark module is missing ${name} at z=${z}`);
}

const expectedOrder = route.map(([name]) => name);
const worldOrder = route.map(([name, z]) => world.indexOf(`["${name}", ${z},`));
const landmarkOrder = route.map(([name, z]) => {
  const label = name === "Kumasi" ? "KUMASI KEJETIA" : name.toUpperCase();
  return towns.indexOf(`{ n: "${label}", z: ${z},`);
});
assert.ok(worldOrder.every((at, i) => at >= 0 && (i === 0 || at > worldOrder[i - 1])), "World towns are missing or out of Accra-to-Kumasi order");
assert.ok(landmarkOrder.every((at, i) => at >= 0 && (i === 0 || at > landmarkOrder[i - 1])), "Town landmarks are missing or out of Accra-to-Kumasi order");

assert.ok(towns.includes('sign("BUNSO FOREST RESERVE"'), "Bunso Forest Reserve entrance landmark is missing");
console.log(`Transport route contract passed: Accra -> ${expectedOrder.join(" -> ")}`);
