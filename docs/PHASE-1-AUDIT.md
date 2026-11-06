# Accra Life — Phase 1 Audit & Stage 1 Fixes

**Date:** 2026-10-25 · **Repo:** github.com/jerryspanelli-tech/Accra-life- · **Live:** jerryspanelli-tech.github.io/Accra-life-/

The whole repository (56 files) was downloaded byte-for-byte, every JavaScript file was read or scanned, all files pass a syntax check, and the game was booted in a real headless browser (Babylon.js v9.32.0, WebGL2): **8,079 meshes build, all 37 modules report ready, zero page errors.** The game is fundamentally healthy — it walks, drives, streams the 27 km world, runs the phone, saves to localStorage.

---

## 1. Technical architecture

| Layer | What it is |
|---|---|
| Hosting | Static GitHub Pages site. No build step. Cache-busting is manual (`?v=` numbers on each script tag). |
| Engine | Babylon.js from CDN, WebGL2, ACES tone mapping, shadows off on phones. |
| Entry | `index.html` → redirects to `babylon.html` (the whole core game is inline in this file: scene, city grid, player, car, input, game loop). |
| Modules | ~30 `<script>` tags in a strict order + ~12 more loaded dynamically by `accra-upgrade.js` → `accra-life.js`. Every module is an IIFE that talks through shared globals (`scene`, `player`, `car`, `driving`…) and `window.*` namespaces (`AccraAssets`, `ACCRA_KIT`, `ACCRA_LIFE`, `ACCRA_WORLD`…). |
| World | Accra city grid (~330×330 m) + a 12 km × 27 km streamed corridor to Kumasi (1:10 scale), 256 m chunks, 6 towns in real route order, 2 toll plazas. |
| Persistence | localStorage only, ~28 `accra-*` keys. Money: `accra-bb-save` (starts GH₵200). |
| Multiplayer | `online.js` is a socket.io client whose server URL is still the placeholder `PASTE_SERVER_URL_HERE` → the game runs in offline mode. No server code exists in the repo. |

## 2. File responsibility map

| File | Responsibility |
|---|---|
| `babylon.html` | Core: engine, lights, city grid + districts palette, villa interior, player, car physics, joystick/keyboard, game loop |
| `accra-camera.js` | GTA-style chase camera |
| `accra-roads.js` | Traffic lights + zebra crossings + signal timer (`ACCRA_TRAFFIC`) |
| `accra-connect.js` | Driveways joining landmarks to the grid |
| `accra-districts.js` | **Replaces** the generic city blocks with per-district architecture |
| `accra-upgrade.js` | Shops/mall/pub/stadium visuals, wardrobe, kiosks, loads `accra-life.js` + `AccraLocations.js` |
| `accra-life.js` | Vitals (health/energy/hunger/hygiene/mood), food, housing rent/buy; loads 10 more modules |
| `accra-world.js` | The big map: chunk streaming, highway, towns, tolls, intercity + Ayalolo buses |
| `accra-highway.js` | Highway streetlights (instanced, distance-gated) |
| `accra-towns.js` / `accra-toll.js` | Town landmarks and entrance signs / toll plaza with working boom barriers |
| `accra-traffic.js` | NPC cars that obey the signal timer |
| `accra-transport.js` / `accra-shaxi.js` | Rideable trotros / phone-ordered taxis |
| `phone.js` + `accra-phone-skin.js` | In-game smartphone, 13 apps, banking, betting, dating, shopping |
| `online.js` | Multiplayer client (inactive — no server) |
| `accra-figure.js` / `accra-people.js` | Built-in cartoon figure / rigged-GLB loader (falls back to cartoon) |
| `accra-apartments.js` / `accra-estate.js` / `accra-interiors.js` / `accra-entries.js` | Apartments, Amoamah Estate, enterable mall/hospital/police interiors |
| `accra-hq.js` / `accra-hospital.js` / `accra-mall.js` | New landmark buildings |
| `accra-cleanup.js` / `accra-remove-old.js` | Demolish superseded buildings by map area |
| `accra-market.js` / `accra-pub.js` / `accra-crime.js` / `accra-mining.js` / `accra-decor.js` / `accra-fx.js` / `accra-weather.js` / `accra-profile.js` | Makola market, pub, crime/ATMs, mining, décor, effects, weather, player profile |
| `accra-assets.js` | Procedural mesh builders (cars, trotro, kiosk, houses, trees) |
| `AccraLocations.js` | Labadi Beach zone |
| `landmarks.js` | Labadi beach + sea |
| **Dead weight (never loaded):** | `accra-avatar-all.js`, `accra-cloud.js`, `babylon-1.html`, 7× `test-*.html`, `car.glb`, `car_1.glb` (disabled — the GLB stretched into a grey box) |

## 3. Bugs found — fixed in Stage 1 (patched files attached)

1. **Traffic lights never changed colour.** The red/yellow/green lamps were *instances*, and Babylon silently ignores material changes on instances ("Setting material on an instanced mesh has no effect" — logged 75× per repaint, forever). NPC cars obeyed an invisible timer while players saw grey blobs. **Fix:** lamps are now clones (own material, shared geometry). Warning spam eliminated, lights visibly cycle. *Verified headlessly: 0 warnings, materials change.*
2. **No GLB loader plugin.** `babylon.html` loads only Babylon core, so `people/character.glb` etc. could never load even if uploaded ("Unable to find a plugin to load .glb files"). **Fix:** added `babylonjs.loaders.min.js` from the CDN. This unblocks Stage 2 (real characters) and Stage 3 (real vehicles).
3. **Dead roof/awning pass.** `accra-upgrade.js` looked for generic `bd` buildings to re-roof, but `accra-districts.js` had already replaced them all → it logged "0 roofs" and did nothing, every load. **Fix:** pass is skipped (with an honest log line) when the districts module is active — district buildings already carry their own roofs.
4. **Driveways were solid.** `accra-connect.js` set `checkCollisions = true` on 3 cm-high flat strips — the player's capsule (bottom at y≈0.01) could snag on them. **Fix:** driveways are non-solid; they sit flush and are purely visual.
5. **Kumasi built houses on the highway.** Town lots only avoided the town's own streets, not the highway corridor, so the final stretch into Kumasi ran straight into solid buildings (verified: car boxed in, 1.8 m of travel in 5 s). **Fix:** town lots within 24 m of the highway centreline are skipped. *Verified: corridor is clear, car accelerates smoothly into Kumasi.*

**Upload these 5 files over the existing ones (same names, same folder):**
`babylon.html`, `accra-roads.js`, `accra-connect.js`, `accra-upgrade.js`, `accra-world.js`
(Version numbers were already bumped inside `babylon.html`/`accra-upgrade.js`, so browsers will fetch the new copies.)

## 4. Bugs & limitations found — NOT yet fixed (by design of Stage 1)

| # | Issue | Severity | Plan |
|---|---|---|---|
| A | `people/character.glb`, `walk.glb`, `idle.glb` missing from repo → everyone is the cartoon figure. (Now loadable thanks to fix 2.) | High (visual) | Stage 2: real characters |
| B | Multiplayer dead: no server, placeholder URL. Money is client-side localStorage — trivially cheatable once online. | High (long-term) | Stage 7: Node + socket.io backend, server-authoritative economy |
| C | Admin code `ACCRA-ADMIN-2026` hardcoded in client source | Medium (security) | Remove when backend auth lands |
| D | Kumasi is a procedural box-town, not a real city layout (Kejetia is a slab + stalls) | Medium | Stage 6 |
| E | Highway light-pool discs glow in daylight; streetlight poles sit on the median (fine, but my test teleports kept landing on it) | Low | Stage 4 (roads polish) |
| F | Repo clutter: dead files listed above; manual `?v=` versioning is error-prone (index.html still redirects to `?v=74`) | Low | Repo hygiene pass |
| G | Everything is procedural boxes — the "toy-like" look | High (visual) | Stages 2–5 |

## 5. What to test after uploading (5 minutes)

1. Stand at any junction: the traffic lights now visibly cycle red → green, and NPC cars stop on red.
2. Walk/drive from the avenue into the mall or villa driveway: no more invisible snag at the kerb.
3. Drive the highway all the way into Kumasi: no buildings on the road at the end. (Stay in a lane — the concrete median with light poles is solid, as it should be.)
4. Console (F12): no more "instanced mesh" warnings; the upgrade log no longer says "0 roofs".

## 6. Recommended next stages (unchanged)

- **Stage 2 — Real characters:** rigged GLB(s) + walk/idle animations into a new `people/` folder. The loader code (`accra-people.js`) already exists and now has its plugin; it needs properly licensed models (rigged humanoid, Mixamo-compatible bone names, GLB, ~1.8 m tall).
- **Stage 3 — Real vehicles** (sedan/trotro/taxi GLBs replacing the extruded boxes).
- **Stage 4 — Roads/interchange visual pass** (your truncated §6: continuous drivable surfaces, markings, guardrails, toll gantry polish).
- **Stage 6 — Kumasi as a real city**; **Stage 7 — multiplayer backend** (Node + socket.io + a small DB; money and ownership move server-side).
