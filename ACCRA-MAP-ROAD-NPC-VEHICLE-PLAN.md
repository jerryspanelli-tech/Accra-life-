# Accra Life — Stage 2B District and Road-Graph Plan

Status: planning specification only. This document does not change the live map or move any existing landmark.

## 1. Current source facts

The playable Accra core is a compact 330 m square grid:
- Main grid coordinates: X/Z = -150, -70, 0, 70, 150.
- Five north-south and five east-west road lines are generated from that grid.
- District labels are assigned to sixteen small cells: Airport City in the north-west; Osu and Makola across the west/centre; East Legon in the north-east; Amoamah Estate in the east/centre; Central Accra in the east/south; and Labadi in the south-west.
- Existing anchors include Kotoka Airport around (-420, -300), stadium, police HQ, hospital, mall/Galleria, dealership, villa, pub, beach and Amoamah Estate.
- City NPC traffic currently follows two loops (outer and inner) using procedural low-detail vehicle meshes. Trotro/bus routes are also loop-based. The current airport aircraft is assembled from primitive shapes.

The district labels therefore do not yet represent realistically sized, separated neighbourhoods. The current city is a small grid with district-themed building decoration.

## 2. Non-negotiable coordinate rules

1. Keep player spawn/save coordinates and existing interaction anchors stable during the first map rebuild.
2. Keep the N6 shared route in accra-world-layout.js as the single source for highway towns and highway geometry.
3. Connect new city roads to the existing highway entrance and airport access without gaps or broken collisions.
4. Use one shared road/district layout definition for roads, junctions, landmark entrances, traffic routes and minimap destinations. Do not keep separate coordinate lists in individual modules.
5. Build the replacement beside the old map or behind a feature switch first. Do not delete the old map until walking, driving, collision, route and mobile-performance checks pass.
6. Keep streamed N6 chunks; do not render the entire Accra–Kumasi corridor at once.
7. Treat proposed city positions as game-design coordinates, not surveyed real-world coordinates.

## 3. Target district structure

The city should feel like connected Accra neighbourhoods rather than sixteen tiny square blocks. Exact boundaries will be tuned against existing landmark anchors before implementation.

| District / zone | Character and road design | Landmarks / activity |
|---|---|---|
| Airport City | Modern business district, wider divided avenues, office towers and hotel access | Kotoka Airport, hotels, offices, airport traffic |
| Central Accra | Civic and commercial core, busy arterials and public spaces | Civic buildings, hospital and police access |
| Makola | Dense market streets, pedestrian priority, loading bays and controlled vehicle access | Market stalls, traders, delivery vehicles, market workers |
| Osu | Mixed-use nightlife and shopping streets, narrower side roads and parking | Shops, restaurants, pubs, bars and bar attendants |
| East Legon | Larger plots, gated homes, landscaped streets and roundabouts | Villas, apartments, shops and residential NPCs |
| Amoamah Estate | Planned residential estate with local access roads and quieter traffic | Homes, estate services and residents |
| Labadi | Coastal district with beach access and visitor roads | Beach, hotels, restaurants and tourism activity |
| Accra Mall / commercial zone | Retail access roads, parking aisles, taxi and ride-hailing pickup | Mall, shops, taxis, shoppers and security |
| Stadium / civic sports zone | Event access, pedestrian crossings, drop-off and parking | Stadium, event crowds, police and vendors |
| Industrial / logistics edge | Heavy-vehicle routes kept away from narrow residential streets | Warehouses, workshops, quarry and freight activity |

## 4. Road hierarchy and graph

The rebuilt network has four road classes:

- **Class A — primary arterials:** main city spine and major links between Airport City, Central Accra, Osu, East Legon, Labadi and the N6/highway connection. Designed for buses, taxis, emergency vehicles and heavier traffic.
- **Class B — district connectors:** connect each district to at least two primary roads, with junctions and turning lanes where needed.
- **Class C — local streets:** provide access to homes, shops, apartments and services. Lower speeds and more pedestrian crossings.
- **Class D — access lanes / driveways:** connect individual landmarks, parking areas, estates, the airport terminal and businesses to the graph.

Road graph requirements:
- Every major district has at least two useful connections to the wider network.
- Every major landmark keeps a named entrance connected to a road node.
- Junctions have clear right-hand traffic lanes, turning geometry, traffic-light logic where appropriate, crossings and collision-safe kerbs.
- Trotro stops, taxi pickup points, Shaxi pickup/drop-off points and bus stops attach to actual road nodes.
- Emergency routes to the police station and hospital remain traversable.
- The N6 route and highway towns remain reachable from the Accra road graph.

## 5. NPC and transport replacement scope

These are part of the rebuild, implemented after the road graph is stable.

### NPCs to replace
- Police officers and other law-enforcement NPCs.
- Bar attendants, restaurant staff and shop attendants.
- Market traders, customers, delivery workers and security staff.
- Pedestrians, residents, passengers, drivers and airport staff.
- Other existing human NPCs that currently use placeholder/procedural figures.

NPC requirements:
- Proper rigged 3D human models, not box-built bodies.
- Distinct Ghanaian clothing and occupations; police uniforms must be recognisable.
- Suitable idle, walk, run, work, talk, sit and vehicle-entry/exit animations where relevant.
- Pedestrian paths and safe crossing behaviour tied to the road graph.
- LOD and spawn/despawn distance controls for ordinary phones.

### Vehicles to replace or introduce
- Replace placeholder NPC traffic cars with detailed 3D saloons, SUVs, pickups, taxis, tro-tros, minibuses, buses, delivery vans and emergency vehicles.
- Introduce 3D motorcycles for NPC traffic and player use.
- Introduce 3D aircraft for airport parking, taxiing and later flight gameplay.
- Reuse a shared asset/vehicle definition system for player-owned and NPC vehicles where practical.
- Vehicle models need wheels, lights, glass, visible interiors where appropriate, sensible scale, collision proxies and mobile-friendly LODs.
- Do not represent every vehicle type with one generic mesh and a colour change.

Aircraft and motorcycles follow after the city road graph and vehicle-controller foundation are stable; they are not part of the first road replacement.

## 6. Staged implementation order

### Stage 2B — this document
Record current map facts, district intent, road hierarchy, graph rules and future NPC/vehicle scope.

### Stage 2C — coordinate and road-graph prototype
Create one versioned accra-city-layout.js containing district boundaries, primary/secondary road centre-lines, junction nodes and edges, landmark anchors, access-road connections, transport stops and stable IDs for map, minimap, NPC navigation and vehicle navigation. Produce a top-down debug map before replacing existing roads.

### Stage 2D — road replacement prototype
Build new roads in a separate preview layer/branch. Verify continuous surfaces, junctions, driveways, crossings, collisions and navigation. Keep the old map as fallback.

### Stage 2E — district blockout and landmarks
Expand district footprints and spacing, then replace placeholder buildings in controlled groups. Preserve gameplay interactions while each building is replaced.

### Stage 3 — NPC and traffic foundation
Introduce rigged NPC archetypes and a road-graph traffic controller. Replace the existing two-loop traffic only after new routes work. Then add pedestrians and occupation-specific behaviour.

### Stage 4 — 3D vehicle fleet
Add detailed 3D cars, taxis, tro-tros, buses, pickups, vans and emergency vehicles; then motorcycles. Test player control, NPC driving, traffic lights, collisions, boarding and mobile performance.

### Stage 5 — aircraft
Upgrade airport aircraft assets and add taxiing/flight systems as a separate transport feature after ground transport is reliable.

## 7. Acceptance checks before the old map is removed

- Player can walk through every district without falling through the ground or getting trapped.
- Player can drive from the city core to the airport, beach, mall, stadium and N6 entrance without road gaps.
- Every landmark interaction and entrance still works.
- Minimap and destination markers match the physical road layout.
- NPC pedestrians use sidewalks/crossings and do not walk through buildings.
- NPC cars obey road direction, junctions and traffic lights; they do not spawn inside buildings or overlap.
- Police and emergency routes to key facilities remain open.
- Trotro, taxi and Shaxi pickup/drop-off points are reachable.
- Mobile frame rate, memory use and loading remain acceptable on ordinary phones.
- Preview is visually checked on a phone-sized screen and desktop before merging.

## 8. Current boundary

No NPCs, vehicles, motorcycles, aircraft, buildings, roads or production map assets have been replaced by this planning document. It records the agreed scope and engineering order so later work can be tested in safe, reviewable stages.
