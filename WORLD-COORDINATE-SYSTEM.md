# Accra Life world coordinate system — Stage 2 foundation

## Scope
This document defines a shared coordinate contract for the existing Babylon.js world. It does not claim that the entire expanded map is already built.

## Existing engine facts
- Babylon.js scene coordinates use X/Z on the ground plane and Y for height.
- Existing playable Accra core is centred around the origin and its original city road grid uses X/Z coordinates around -150 to +150 metres.
- The existing highway module expands the ground to approximately X -6,000..+6,000 and Z -26,000..+1,000.
- The N6 corridor is represented at approximately 1:10 scale: 24.5 km in game for about 250 km in the real-world route.
- Highway streaming uses 256 m chunks.

## Shared N6 corridor order
Accra → Nsawam → Suhum → Bunso → Anyinam → Nkawkaw → Konongo → Ejisu → Kumasi.

| Stop | Game Z | Approx. real distance from Accra |
|---|---:|---:|
| Accra | -150 | 0 km |
| Nsawam | -3,500 | 34 km |
| Suhum | -6,500 | 65 km |
| Bunso | -9,500 | 95 km |
| Anyinam | -11,200 | 113 km |
| Nkawkaw | -13,000 | 131 km |
| Konongo | -19,000 | 192 km |
| Ejisu | -22,500 | 228 km |
| Kumasi | -24,500 | 248 km |

Distances are game-scale approximations, not exact surveyed coordinates. The route bends gradually westward from X=0 to X=-2,400.

## Engineering rules
1. accra-world-layout.js is the shared source for highway geometry, town positions, stop order, fare metadata and route distance calculations.
2. World streaming, town decoration and fast-travel destinations must consume this shared data rather than keeping separate town arrays.
3. Keep the current Accra city centre and existing player save coordinates stable while the larger city is redesigned.
4. Do not enlarge the main city footprint until district coordinates and road connections are planned and collision-tested.
5. Keep streamed highway chunks deterministic; generated scenery must not change each time a player revisits a chunk.
6. Avoid rendering the entire 25 km corridor at once. Continue using chunk streaming and instancing for repeated roadside objects.
7. Do not claim accurate geography; this is a compressed gameplay world.

## Next map stages
- Stage 2B: publish a top-down district/road layout and road graph.
- Stage 2C: replace the five-by-five placeholder city grid with a connected primary/secondary/local road plan, retaining stable landmark entrances.
- Stage 2D: validate highway continuity, town connectors, collisions, minimap coordinates and mobile performance before replacing any more map assets.