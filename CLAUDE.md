# Will It Fit? - Project Instructions

## What This Is

A 3D web app that lets users check if objects fit in a car's trunk. 45 real car models rendered as transparent wireframes, with trunk cavity shapes extracted from the actual 3D model geometry via Blender raycasting.

## Tech Stack

- **Frontend:** React + Vite + React Three Fiber (Three.js) + Zustand
- **3D Models:** GLB (glTF Binary) format, Draco-compressed
- **Trunk Extraction:** Blender MCP (socket on port 9876) — raycasts inside the car model to find the real trunk cavity
- **Trunk Fallback:** Runtime Three.js raycasting for cars without Blender-extracted trunks
- **Model Analysis:** `@gltf-transform/core` + `draco3dgltf` for offline bounding box analysis
- **Model Optimization:** `@gltf-transform/cli` (simplify, resize textures, draco compress)

## Project Structure

```
src/
  components/
    CarModel.jsx       — Loads car + trunk GLBs, applies transforms, renders trunk shape
    DraggableObject.jsx — Placed items with fit detection (Box3-based)
    Scene.jsx          — Three.js canvas, camera presets, grid, environment
    Sidebar.jsx        — Car selector, cargo dims, fold seats, open trunk, item catalog
    ObjectMover.jsx    — Keyboard controls for moving/rotating items
  data/
    cars.js            — 45 car definitions (dimensions, model paths, trunk specs)
    objects.js         — 15 preset objects (suitcases, TVs, skis, etc.)
    trunkPositions.js  — Pre-computed trunk center positions for all cars (from model analysis)
  store/
    useStore.js        — Zustand state (selected car, trunk open/closed, placed objects, fit results)

public/models/
  *_opt.glb            — Optimized car exterior models (Draco-compressed)
  bmw_2018_open_trunk_opt.glb — BMW 3 Series with trunk lid open (70°)
  trunks/
    bmw_3series_trunk_blender.glb — Blender-extracted trunk cavity mesh

scripts/
  blender_helper.py           — Socket helper to send Python code to Blender MCP (port 9876)
  analyze_models_v2.mjs       — Offline model analysis (bounding boxes, orientation, rear detection)
  generate_trunk_positions.mjs — Generates trunkPositions.js from analysis data
  generate_trunks.py           — Legacy Build123D parametric trunk generation
```

## Trunk Extraction System

### Architecture (3 tiers, in priority order)

1. **Blender-extracted trunk** (`blenderTrunkPath` in cars.js) — Best quality. A GLB mesh created by raycasting inside the car model in Blender. Loaded alongside the car GLB with the same scale/offset transform for automatic alignment.

2. **Runtime raycast shape** (`TrunkShape` component) — Fallback. Casts rays from inside the trunk against the car body mesh at render time. Works OK for some cars, unreliable for others (hits wrong surfaces).

3. **Box trunk** (`BoxTrunk` component) — Last resort. Simple box positioned using pre-computed data from `trunkPositions.js`.

### How Blender Trunk Extraction Works

1. Start Blender with MCP addon (port 9876)
2. Load the car GLB: `bpy.ops.import_scene.gltf(filepath='...')`
3. The model has a 0.01 scale factor in the node hierarchy — all coordinates are in model units (real meters ÷ 100)
4. Determine which end is the rear (vertex density: more vertices = front/engine area)
5. Find the trunk lid mesh by searching for meshes at the rear-top of the car
6. Probe the trunk cavity:
   - Cast rays LEFT/RIGHT from center to find wall positions
   - Cast rays DOWN from above the trunk lid to find ceiling
   - Cast rays UP from below to find the floor pan
   - Constrain width/height to manufacturer specs
7. Build a mesh from 14 cross-section profiles (floor + walls + ceiling)
8. Export as GLB
9. Add `blenderTrunkPath` to the car entry in `cars.js`

### Open Trunk Lid

For cars with an identifiable trunk lid mesh:
1. Find the lid mesh (e.g., Object_85 for BMW 3 Series)
2. Identify the hinge point (front edge where lid meets rear window)
3. Rotate vertices 70° around the hinge (baked into mesh data, not a transform node)
4. Export as separate GLB → `openTrunkModelPath` in cars.js
5. Optimize with Draco compression
6. Toggled via "Open trunk lid" checkbox in sidebar

### Adding a Blender Trunk to a New Car

```bash
# 1. Start Blender with MCP addon on port 9876
# 2. Run the extraction (adapt Y ranges and manufacturer specs per car):
python3 scripts/blender_helper.py "
import bpy
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath='public/models/YOUR_CAR_opt.glb')
# ... raycasting code (see scripts/blender_helper.py usage examples)
"
# 3. Add to cars.js:
#    blenderTrunkPath: '/models/trunks/your_car_trunk_blender.glb',
#    openTrunkModelPath: '/models/your_car_open_trunk_opt.glb',  (optional)
```

## Key Conventions

### Car Data Format (src/data/cars.js)

Each car entry must have:
- `name` — display name
- `modelPath` — path to optimized GLB
- `exterior` — `{ length, width, height }` in meters (manufacturer specs)
- `trunk` — `{ length, width, height, offsetX, offsetY, offsetZ }` in meters
- `rearFolded` — same format as trunk, for seats-folded config
- `color` — hex color for wireframe tint

Optional:
- `blenderTrunkPath` — path to Blender-extracted trunk GLB (best quality)
- `openTrunkModelPath` — path to car model with trunk lid open
- `trunkModelPath` / `trunkFoldedModelPath` — legacy Build123D trunk shapes

### Dimensions

- All dimensions in code are in **meters** (real-world scale)
- Blender model coordinates: real meters ÷ 100 (due to 0.01 scale in node hierarchy)
- Car dimensions sourced from manufacturer specs

### Coordinate Systems

- **Blender:** X = width, Y = length (front at -Y, rear at +Y for most models), Z = height
- **glTF/Three.js:** X = width, Y = height, Z = length (Blender Y→glTF -Z, Blender Z→glTF Y)
- **Car models vary in orientation** — some have length along X, most along Z after glTF import
- `trunkPositions.js` stores pre-computed positions accounting for each model's orientation

### 3D Model Optimization Pipeline

Target: each car model under 1.5 MB after optimization.
```bash
npx @gltf-transform/cli simplify raw.glb out.glb --ratio 0.1 --error 0.01
npx @gltf-transform/cli resize out.glb out.glb --width 64 --height 64
npx @gltf-transform/cli draco out.glb final_opt.glb
```

### Rendering Style

- Car exteriors: transparent body (opacity 0.1) + edge lines (wireframe look)
- Blender trunk: green wireframe + transparent fill (opacity 0.15)
- Runtime raycast trunk: green wireframe mesh following car body contour
- Objects: solid colored boxes with wireframe outline, green/red glow for fit status

## Commands

```bash
npm run dev                                    # Start dev server
npm run build                                  # Production build
npx @gltf-transform/cli inspect <file.glb>     # Inspect 3D model stats
python3 scripts/blender_helper.py "<code>"      # Execute Python in Blender via MCP socket
node scripts/analyze_models_v2.mjs              # Analyze all models (orientation, bounds)
node scripts/generate_trunk_positions.mjs       # Regenerate trunkPositions.js
```

## Git

- Keep optimized models (`*_opt.glb`) in git — they're small (< 1.5 MB each)
- Keep trunk models in git — they're tiny (3-25 KB each)
- Do NOT commit raw/unoptimized models — add to .gitignore
- Binary GLB files: commit directly (no LFS needed at current scale)

## Blender MCP Setup

1. Install the Blender MCP addon: `~/Library/Application Support/Blender/5.1/scripts/addons/blender_mcp_addon/__init__.py`
2. Enable in Blender: Edit > Preferences > Add-ons > search "MCP"
3. Start server: 3D Viewport sidebar (N) > MCP panel > "Start Server"
4. Config in `.mcp.json`: `{"mcpServers": {"blender": {"command": "uvx", "args": ["blender-mcp"]}}}`
5. Socket communicates on port 9876
