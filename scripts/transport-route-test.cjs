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

const connectors = fs.readFileSync("world/transport/accra-connect.js", "utf8");
const traffic = fs.readFileSync("world/transport/accra-roads.js", "utf8");
assert.ok(connectors.includes('["airport-access", -430, -150, -160, -140]'), "Kotoka airport access road must connect the city avenue to the airport road");
assert.ok(!connectors.includes('"airport-gate"'), "Stale disconnected airport-gate strip must be removed");
assert.ok(traffic.includes("ns: makeHead(") && traffic.includes("ew: makeHead("), "Each junction must have separate north-south and east-west signal heads");
assert.ok(traffic.includes("h.ns[k].material = s.ns === k") && traffic.includes("h.ew[k].material = s.ew === k"), "Traffic lights must display the correct phase for both directions");
console.log("Transport access-road and directional-signal contracts passed.");

const kotoka = fs.readFileSync("world/transport/accra-airport.js", "utf8");
const kumasiAirport = fs.readFileSync("world/transport/accra-kumasi-airport.js", "utf8");
assert.ok(kotoka.includes('{ dest: "Kumasi (Prempeh I)", x: -2000, z: -24000'), "Kotoka must route flights to the built Kumasi airport");
assert.ok(!kotoka.includes('dest: "Takoradi"') && !kotoka.includes('dest: "Tamale"'), "Do not sell flights to airports that are not built yet");
assert.ok(kumasiAirport.includes('dest: "Accra (Kotoka)"') && kumasiAirport.includes('x: -420, z: -240'), "Kumasi airport return flight must route to Kotoka's terminal approach");
console.log("Airport route endpoint contracts passed.");

const shaxi = fs.readFileSync("world/transport/accra-shaxi.js", "utf8");
assert.ok(shaxi.includes('const pickup = { x: player.position.x, z: player.position.z }'), "Shaxi must save the player's exact pickup position");
assert.ok(shaxi.includes('o.phase = "approachPick"') && shaxi.includes('o.phase = "toRoad"'), "Shaxi must approach the player, board, then rejoin the road");
assert.ok(shaxi.includes("operate within central Accra only"), "Shaxi must not dispatch across the distant intercity map");
console.log("Shaxi exact-pickup contract passed.");

const trafficCars = fs.readFileSync("world/transport/accra-traffic.js", "utf8");
assert.ok(trafficCars.includes("const stopForSignal = inSignalZone"), "NPC traffic must identify red/yellow stop phases");
assert.ok(trafficCars.includes("Math.max(0, nj.dist - 2.5)"), "NPC cars must clamp movement before the signal stop line");
console.log("NPC traffic signal stop-line contract passed.");

const worldTransit = fs.readFileSync("world/region/accra-world.js", "utf8");
assert.ok(worldTransit.includes("a bus about every 15 minutes"), "Ayalolo timetable must match the 15-minute route loop");
assert.ok(!worldTransit.includes("a bus about every 5 minutes"), "Do not advertise an unsupported 5-minute Ayalolo frequency");
console.log("Ayalolo timetable contract passed.");

const fareMatch = worldTransit.match(/const FARE = \{([^}]+)\};/);
assert.ok(fareMatch, "Intercity fare schedule must exist");
const fares = Object.fromEntries([...fareMatch[1].matchAll(/([A-Za-z]+):\s*(\d+)/g)].map(m => [m[1], Number(m[2])]));
const tripFare = (from, to) => Math.abs(fares[to] - fares[from]);
assert.equal(tripFare("Suhum", "Bunso"), 15, "Short Suhum-to-Bunso trip must charge only the fare difference");
assert.equal(tripFare("Accra", "Kumasi"), 130, "Accra-to-Kumasi fare must remain GH¢130");
assert.equal(tripFare("Kumasi", "Accra"), 130, "Return journey fare must be symmetric");
assert.ok(worldTransit.includes("Math.abs(FARE[d.d] - FARE[here])"), "Bus booking must charge the difference between cumulative stop fares");
assert.ok(world.includes("Math.abs(FARE[s[0]] - FARE[here])"), "Intercity ticket buttons must display the actual fare difference, not the destination total");
assert.ok(!world.includes("Math.max(FARE[s[0]], FARE[here])"), "Intercity ticket buttons must not overstate fares for shorter trips");
console.log("Intercity distance-based fare contracts passed.");

const cityTransport = fs.readFileSync("world/transport/accra-transport.js", "utf8");
assert.ok(cityTransport.includes("const routePoint = at(s.d)"), "Trotro stop signage must retain the route direction vector");
assert.ok(cityTransport.includes("Math.atan2(-routePoint.fz, routePoint.fx)"), "Trotro stop signs must use finite route direction values");
assert.ok(!cityTransport.includes("Math.atan2(-p.fz, p.fx) + Math.PI / 2"), "Do not read direction fields from the offset curb position");
console.log("Trotro stop-sign orientation contract passed.");
