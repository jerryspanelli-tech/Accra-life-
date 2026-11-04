# Accra Life

Accra Life is a browser-based Babylon.js game. The production entry point is index.html, which opens babylon.html.

## Repository layout

- index.html — public entry page.
- babylon.html — production Babylon.js scene and ordered runtime loader.
- characters/ — player/NPC character runtime, profile and wardrobe code.
- world/region/ — world map, districts, towns, landmarks and weather.
- world/transport/ — roads, airports, traffic, tolls, public transport and road connections.
- world/buildings/ — apartments, estates, markets, mall, civic buildings and interiors.
- interface/ — in-game phone, phone styling, camera and settings.
- gameplay/ — optional crime, pub, mining and gameplay-effect modules.
- systems/online/ — multiplayer and account authentication.
- People/ — locally hosted GLB character models.
- archive/ — historical pages and preserved older implementations.
- docs/ and development scripts — project documentation and validation work.

Core bootstrap files such as accra-start.js, accra-upgrade.js, accra-life.js, and accra-assets.js remain at the root because the startup and dynamic loading chain depends on their current page-relative paths.

Some gameplay modules are loaded dynamically by accra-life.js; update those paths whenever a module moves.

See docs/REPOSITORY-STRUCTURE.md for the folder responsibilities and dependency rules.
