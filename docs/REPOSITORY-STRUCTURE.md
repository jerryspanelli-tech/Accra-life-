# Repository structure and dependency audit

## Production startup chain

1. `index.html` opens `babylon.html`.
2. `babylon.html` creates the Babylon.js scene and loads core runtime modules in order.
3. Character runtime code is kept in `characters/`.
4. Character GLB assets remain in `People/AccraLife/`; the player and NPC loaders resolve this path from the game page URL.
5. `accra-life.js` dynamically loads optional gameplay modules. Their script paths are relative to the page, so update those paths whenever a module moves.

## Character code organization

| Path | Responsibility |
|---|---|
| `characters/accra-figure.js` | Stylized fallback human figure API |
| `characters/accra-people.js` | Rigged GLB pipeline for NPCs, police, pedestrians and remote players |
| `characters/accra-profile.js` | Player profile, appearance and wardrobe interface |
| `characters/legacy/accra-avatar-all.js` | Preserved procedural avatar implementation |
| `characters/legacy/accra-model.js` | Preserved older player model/animation loader |
| `People/AccraLife/` | Active male/female GLB character models and outfit variants |

## Changes in this organization branch

- Grouped character runtime scripts into `characters/` and `characters/legacy/`.
- Updated the production loader, NPC preview page and add-on test page to load moved character scripts.
- Updated `accra-life.js` dynamic paths for the profile interface and legacy model loader.
- Moved the superseded `babylon-1.html` copy into `archive/`; its contents are preserved.
- Includes the startup/authentication work from PR #47 as the base for these changes.

## Remaining organization work

Root-level modules still need to be grouped by actual responsibility:
- world, districts and landmarks;
- roads, highways, airports and transport;
- buildings and interiors;
- phone and other interface code;
- online, account and gameplay systems.

Move each group only after checking direct HTML references, dynamic script loaders, asset URLs, CI workflows and test pages.

## Safety rules

1. Do not delete a file merely because it is absent from the production HTML script list; dynamic loaders and tests may use it.
2. Before moving a runtime file, search all source files for its path/name and inspect dynamic loading, `import()`, `fetch()`, Babylon `SceneLoader`, and URL construction.
3. Update every affected reference in the same commit and preserve case-sensitive paths.
4. Keep tests outside the production startup chain.
5. Preserve old experiments in `archive/` until their dependencies and value are understood.
6. A successful commit or deployment build is not proof of successful desktop/mobile runtime behavior.
