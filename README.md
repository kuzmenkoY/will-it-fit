# Will It Fit?

A 3D web app that answers: **"Can I fit this object in my car?"**

Select from 45 real car models, add items with real-world dimensions, and see if they fit in the trunk. Uses actual 3D car models rendered as transparent wireframes with trunk shapes extracted from the car body geometry via Blender raycasting.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Features

- **45 real car models** — BMW, Toyota, Hyundai, Tesla, Porsche, Ferrari, and more
- **Real trunk geometry** — extracted from 3D models via Blender raycasting, not a guessed box
- **Open trunk lid** — toggle to see the trunk lid swing open (BMW 3 Series, more coming)
- **Fold rear seats** — extends the cargo area forward through the cabin
- **15 preset objects** — suitcases, TV boxes, skis, snowboard, surfboard, golf bag, IKEA furniture, etc.
- **Custom objects** — enter any W x H x D in centimeters
- **Fit detection** — real-time: green = fits, red = doesn't fit
- **Object manipulation** — move, rotate, flip, spin, tilt items to find the best arrangement
- **Camera presets** — Overview, Rear/Trunk, Top Down, Side views
- **3D wireframe visualization** — see-through car body with visible trunk cavity

## Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move selected item (5cm steps) |
| Shift + Arrow | Fine movement (1cm steps) |
| W / S | Move item up/down |
| R | Flip orientation (cycles through upright/back/side) |
| Q | Spin (rotate on Y axis, 15° steps) |
| E | Tilt (angle for diagonal loading) |
| Tab | Cycle between placed items |
| Mouse drag | Orbit camera |
| Scroll | Zoom |

## How Trunk Extraction Works

The key innovation is extracting real trunk shapes from the 3D car models:

1. **Load the car model into Blender** via MCP socket (port 9876)
2. **Determine the rear end** by analyzing vertex density (engine/grille area has more detail)
3. **Find the trunk lid mesh** by locating panels at the rear-top of the car
4. **Raycast the trunk cavity** — cast rays from inside the trunk outward in all directions:
   - LEFT/RIGHT rays → find the side walls (constrained to manufacturer width specs)
   - DOWN rays from above trunk lid → find the ceiling slope
   - UP rays from below → find the floor pan level
5. **Build a mesh** from 14 cross-section profiles, each with floor, walls, and ceiling
6. **Export as GLB** — a lightweight mesh (~20KB) that aligns with the car automatically

For the **open trunk lid**: the trunk lid mesh is identified, its vertices are rotated 70° around the hinge edge (where the lid meets the rear window), and the whole car is re-exported as a separate GLB variant.

## Architecture

```
will-it-fit/
├── public/models/
│   ├── *_opt.glb                        # 45 optimized car exteriors (~0.3-1.2 MB each)
│   ├── bmw_2018_open_trunk_opt.glb      # BMW 3 Series with trunk lid open
│   └── trunks/
│       └── bmw_3series_trunk_blender.glb # Blender-extracted trunk cavity mesh
├── scripts/
│   ├── blender_helper.py                # Socket helper for Blender MCP
│   ├── analyze_models_v2.mjs            # Offline model analysis (orientation, bounds)
│   └── generate_trunk_positions.mjs     # Generates trunk position data
├── src/
│   ├── components/
│   │   ├── CarModel.jsx      # Loads car + trunk, 3-tier trunk system, open trunk toggle
│   │   ├── DraggableObject.jsx  # Placed items with Box3 fit detection
│   │   ├── ObjectMover.jsx   # Keyboard movement/rotation handler
│   │   ├── Scene.jsx         # Three.js canvas, camera presets, lighting
│   │   └── Sidebar.jsx       # Car selector, cargo info, item catalog
│   ├── data/
│   │   ├── cars.js           # 45 car specs (dimensions, model paths, trunk paths)
│   │   ├── objects.js        # 15 preset object dimensions
│   │   └── trunkPositions.js # Pre-computed trunk positions from model analysis
│   └── store/
│       └── useStore.js       # Zustand state management
└── .mcp.json                 # Blender MCP server configuration
```

### Trunk Rendering Priority

CarModel.jsx uses a 3-tier system:

1. **Blender trunk** (best) — if `blenderTrunkPath` exists, loads the extracted mesh with green wireframe
2. **Runtime raycast** (fallback) — casts rays against the car body at render time, builds a custom geometry
3. **Box trunk** (last resort) — simple box positioned using pre-computed data

## Tech Stack

- **React** + **Vite** — frontend framework and build tool
- **React Three Fiber** (Three.js) — 3D rendering in the browser
- **@react-three/drei** — Three.js helpers (OrbitControls, Grid, Html, Environment)
- **Zustand** — state management
- **Blender MCP** — 3D model analysis and trunk extraction via socket
- **gltf-transform** — 3D model optimization and analysis

## 3D Model Pipeline

### Car exteriors

Downloaded from open-source repositories as GLB files, then optimized:

1. **Simplify** — reduce to ~10% of original polygon count
2. **Resize textures** — shrink to 64x64 since we render wireframe
3. **Draco compress** — geometry compression

Result: **87 MB total reduced to 3.5 MB** (96% reduction).

### Adding a new car

1. Find a GLB model (Sketchfab, GitHub repos, etc.)
2. Optimize: `npx @gltf-transform/cli simplify <in> <out> --ratio 0.1 && npx @gltf-transform/cli resize <out> <out> --width 64 && npx @gltf-transform/cli draco <out> <out>`
3. Add entry in `src/data/cars.js` with real manufacturer dimensions
4. Run model analysis: `node scripts/analyze_models_v2.mjs` and `node scripts/generate_trunk_positions.mjs > src/data/trunkPositions.js`
5. (Optional) Extract trunk in Blender via MCP for best quality

## Cars Available

BMW (3 Series, M3, M4, M8, i8, X6 M), Toyota (Supra MK4/MK5, Land Cruiser 300), Tesla (Roadster, Cybertruck), Audi (R8, RS7), Mercedes-AMG GT, Porsche (Cayman S, Panamera, Taycan), Ferrari (488 GTB, 599, F8 Tributo), Lamborghini (Aventador SVJ, Huracan GT), Honda (Civic Type R, NSX), Ford (Mustang GT '68, F-150 Raptor, GT40), Dodge (Challenger R/T, Hellcat), Chevrolet (Camaro SS, Corvette C8), Hyundai (Sonata, Tucson, Elantra N, Veloster N, Creta), Subaru Impreza WRX, Mazda RX-7, Bugatti Bolide, Aston Martin Vantage, McLaren 720S, Maserati GranTurismo, Nissan (370Z, GT-R R35), VW Golf II

## License

MIT
