# Accra Life

Accra Life is a browser-based Babylon.js game. The production entry point is `index.html`, which opens `babylon.html`.

## Repository layout

- `index.html` — public entry page.
- `babylon.html` — production Babylon.js scene and ordered script loader.
- `characters/` — character runtime code: player/NPC loaders, fallback figure, and player profile/wardrobe UI.
- `characters/legacy/` — older character implementations retained for reference and compatibility.
- `People/` — locally hosted GLB character models used by player and NPC systems.
- `character-pipeline/` — character-generation parameters and tooling documentation.
- `supabase/migrations/` — database schema migrations.
- `scripts/` and `.github/workflows/` — development tools and automated checks.
- `archive/` — historical pages retained outside production startup.
- Other root-level JavaScript modules are still being dependency-audited before grouping them by world, transport, buildings, interface, and gameplay responsibilities.

Some optional gameplay modules are loaded dynamically by `accra-life.js`; update those paths whenever a module is moved.

See [docs/REPOSITORY-STRUCTURE.md](docs/REPOSITORY-STRUCTURE.md) for the dependency and migration rules.
