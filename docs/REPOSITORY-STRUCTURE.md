# Repository structure and dependency audit

## Production startup chain

1. index.html opens babylon.html.
2. babylon.html creates the Babylon.js scene and loads core runtime modules in order.
3. Character code lives in characters/; character GLB assets remain in People/AccraLife/.
4. World, building, interface, online and other runtime modules are grouped by responsibility.
5. accra-life.js dynamically loads optional gameplay and decoration modules. These paths are relative to the game page, so update them whenever a module moves.
6. accra-upgrade.js dynamically loads accra-life.js and AccraLocations.js; these bootstrap/data files remain at the repository root intentionally.

## Folder responsibilities

| Path | Responsibility |
|---|---|
| characters/ | Character figure, rigged people/NPC pipeline and player profile |
| characters/legacy/ | Older character implementations preserved for reference |
| world/region/ | Main world map, districts, highway towns, landmarks and weather |
| world/transport/ | Airports, roads, traffic, tolls, highway lighting, taxis, trotros and road connections |
| world/buildings/ | Apartments, estate, market, mall, civic models, hospital, police HQ and interiors |
| interface/ | Phone apps, phone visual skin, third-person camera and settings |
| gameplay/ | Crime, pub, mining, effects and disabled custom car-skin toggle |
| systems/online/ | Multiplayer and Supabase account authentication |
| systems/cleanup/ | Startup cleanup compatibility and obsolete-building removal |
| People/AccraLife/ | Active male/female GLB player models and outfit variants |
| archive/ | Historical game pages and preserved older implementations |

## Bootstrap files intentionally kept at root

- babylon.html — production page and ordered script loader.
- accra-start.js — authentication-gated character selection/startup.
- accra-upgrade.js — game upgrade/bootstrap loader.
- accra-life.js — core life system and optional module loader.
- accra-assets.js — shared asset and model API.
- world/region/AccraLocations.js — Labadi Beach swimming zone and regional location API, dynamically loaded by the upgrade loader.
- systems/cleanup/accra-cleanup.js and systems/cleanup/accra-remove-old.js — startup cleanup compatibility and legacy-object removal.

## Changes in this organization branch

- Grouped character runtime scripts into characters/ and characters/legacy/.
- Grouped world, transport, buildings, interface, gameplay and online systems by responsibility.
- Updated production, archived and relevant test-page script references.
- Updated dynamic module paths in accra-life.js.
- Moved the superseded babylon-1.html copy into archive/; its contents are preserved.
- Removed the unreferenced accra-cloud.js and Accra-Perf legacy scripts after checking production, archived and test HTML pages and core runtime files for references.
- Includes the startup/authentication work from the earlier startup-fix branch as the base for this PR.

## Dependency and cleanup rules

1. Do not delete a file merely because it is absent from the production HTML script list; dynamic loaders and tests may use it.
2. Before moving a runtime file, inspect direct HTML references, dynamic loaders, asset URLs, import(), fetch(), Babylon SceneLoader, and URL construction.
3. Update every affected reference in the same commit and preserve case-sensitive paths.
4. Keep test and experiment pages outside the production startup chain.
5. Preserve old experiments until their dependencies and value are understood.
6. A successful commit or deployment build is not proof of successful desktop/mobile runtime behavior.

## Verification limits

Source-level path checks and Vercel deployment status have been checked during this work. The game has not yet been confirmed running end-to-end in a real desktop or mobile browser; the sign-in/refresh/black-page issue remains a separate outstanding investigation.
