# Accra Life: vehicle designs (text for review)

All vehicles are built by one shared builder: `AccraAssets.createCar(scene, type, options)` in accra-assets.js.
Each design is a side outline (body), a dark tinted glass panel, wheels, and small details.

## Car types
| Type | Shape | Default colour | Where it is used |
|---|---|---|---|
| sedan | Saloon, sloped windscreen, lower rear slope | Blue (#2c6e8c) | Your car, Shaxi taxi, apartment car park, police car park |
| taxi | Same as sedan, with a yellow body and a roof sign | Yellow (#fcd116) | Taxis on the roads |
| hatch | Short hatchback, sloped rear | White (#e6e9ec) | NPC traffic, dealership |
| sports | Low, wide sports car | Red (#c0392b) | Apartment car park, dealership |
| bugatti | Low wedge, horseshoe grille, rear wing | Deep blue (#0b3d91) | Dealership |
| suv | Tall boxy SUV | Dark grey (#3a3d44) | NPC traffic, police armoured trucks (navy) |
| jeep | Boxy 4x4, square grille, roof rack, spare wheel | Olive (#4f6b3a) | Dealership (jeep) |
| landcruiser | Longer boxy 4x4, roof rack, spare wheel | White (#f2f2f0) | Dealership |
| pickup | Pickup with open bed | Yellow (#f2c230) | NPC traffic |
| minibus | Tall boxy van, stripe along the side | White (#f2f2f0) | Hospital ambulances |
| bus | Long bus, side windows, destination board | Blue (#1f5c9a) | Available, not yet on a route |
| trotro | Minibus with a green-and-gold stripe | Gold (#f2c230) | Trotros on the city loop, police and hospital |

## Shared details (every car)
- Dark tinted glass panel following the cabin outline, flush with the paint
- Small dark side mirrors
- White number plates, front and back
- Bright white headlights, red tail lights
- Dark bumpers
- Dark tyres with silver hubs, set just outside the body

## Text on the vehicles
- Taxi: a yellow roof sign.
- Trotro and bus: a destination board, and a stripe in the chosen colour.
- Police and hospital vehicles: stripes in navy, gold, or red.

## Known gaps
- No doors, interior seats, or open windows.
- The Jeep and Land Cruiser shapes are generic 4x4s, not copies of any brand's design.
- The screenshot of a yellow car with an open roll cage and interior is NOT from this code. If it's a design from another tool, send it or describe it, and we can match it.
