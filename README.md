# Accra Life

Accra Life is a browser-based Babylon.js game. The production entry point is `index.html`, which opens `babylon.html`.

## Current runtime layout

The production HTML and JavaScript files currently remain at the repository root because the game loads them through relative URLs (for example, `accra-roads.js` and `People/AccraLife/AccraLife_Male.glb`). Moving these files without updating every runtime URL would break GitHub Pages and preview deployments.

- `index.html` — public entry/redirect page.
- `babylon.html` — production Babylon.js scene and ordered script loader.
- `*.js` at the root — game systems loaded by the production page.
- `People/` — player character models and related assets.
- `character-pipeline/` — character-generation parameter files and documentation.
- `supabase/migrations/` — database schema migrations.
- `scripts/` and `.github/workflows/` — automated checks and CI workflows.
- `tests/` — reserved for test pages and test-only assets as they are safely migrated.
- `archive/` — retained historical files that are not part of production startup.

See [docs/REPOSITORY-STRUCTURE.md](docs/REPOSITORY-STRUCTURE.md) for the audit and safe-migration rules.
