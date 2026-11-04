# Repository structure and cleanup audit

## Production startup chain

1. `index.html` is the public entry page.
2. It navigates to `babylon.html`.
3. `babylon.html` creates the Babylon.js scene and loads the game scripts in a specific order.
4. Player models are loaded from `People/AccraLife/`.
5. Authentication/profile startup is handled by `accra-auth.js` and `accra-start.js`.

The root-level JavaScript files are not necessarily misplaced: the production page currently requests them by root-relative filenames. A bulk move would cause 404s unless every script URL, dynamic import, asset URL, test page, and deployment configuration were updated together.

## Changes in this audit branch

- Moved the superseded `babylon-1.html` copy to `archive/babylon-1.html`.
- Preserved its contents; this is an archive, not a deletion.
- Confirmed the production page does not load `babylon-1.html` as a script or entry point.
- Added this document and the root README to explain the live dependency layout.

## Current directory responsibilities

| Path | Responsibility | Production relevance |
|---|---|---|
| `index.html` | Public entry point | Required |
| `babylon.html` | Main game page and ordered runtime loader | Required |
| Root `accra-*.js`, `phone.js`, `online.js`, `landmarks.js` | Game systems | Some are loaded directly; verify before moving |
| `People/` | GLB character assets | Required by character/player code |
| `character-pipeline/` | Character generation parameters | Build-time/tooling |
| `supabase/` | Database migrations | Backend |
| `scripts/`, `.github/workflows/` | Automated checks | Development/CI |
| Root `test-*.html` | Standalone test and diagnostic pages | Not part of normal entry flow; may be opened directly |
| `archive/` | Historical files retained for reference | Not part of production startup |

## Cleanup rules

1. Do not delete a file solely because it is absent from the static `<script src>` list. It may be loaded dynamically, fetched as an asset, used by a test, or referenced by a workflow.
2. Before moving a runtime file, search all source files for its path/name and inspect dynamic loading patterns such as `import()`, `fetch()`, Babylon `SceneLoader`, and URL construction.
3. When moving a file, update all affected references in the same commit and preserve case-sensitive paths.
4. Keep one production entry point. Test pages must never be included in the production startup chain.
5. Keep historical experiments in an archive until their dependencies and value are understood; do not destroy recoverable work.
6. Verify syntax, local asset/script responses, production startup, authentication, and mobile/desktop browser behavior separately. A successful GitHub commit or deployment is not proof that the game runs.

## Next audit targets

- Build a complete dependency map for every script loaded by `babylon.html`.
- Identify root JavaScript files that are not used by production, tests, CI, or dynamic asset loading.
- Separate test pages into `tests/` only after updating their relative asset/script URLs and checking any external links.
- Review the startup/authentication sequence and the hosting-specific redirects before making further gameplay changes.
