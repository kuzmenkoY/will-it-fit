# Will It Fit? - Project Instructions

## What This Is

A 3D web app that lets users check if objects fit in a car's trunk. Real car models rendered as transparent wireframes, with parametric trunk shapes showing the cargo area.

## Tech Stack

- **Frontend:** React + Vite + React Three Fiber (Three.js) + Zustand
- **3D Models:** GLB (glTF Binary) format, Draco-compressed
- **Trunk Generation:** Build123D (Python CAD) via `uvx --from build123d python`
- **Model Optimization:** `@gltf-transform/cli` (simplify, resize textures, draco compress)

## Project Structure

- `src/components/` — React components (Scene, CarModel, DraggableObject, Sidebar, ObjectMover)
- `src/data/cars.js` — Car definitions (dimensions, model paths, trunk specs)
- `src/data/objects.js` — Preset object definitions (suitcases, TV boxes, etc.)
- `src/store/useStore.js` — Zustand state management
- `public/models/*_opt.glb` — Optimized car exterior models
- `public/models/trunks/` — Parametric trunk shapes (Build123D generated)
- `scripts/generate_trunks.py` — Build123D script for trunk model generation
- `.claude/skills/` — VibeCAD skills (build123d, gltf-transform, render-glb, model-compare)

## Key Conventions

### Adding a New Car

1. Place raw GLB in `public/models/raw/`
2. Optimize: `npx @gltf-transform/cli simplify raw.glb out.glb --ratio 0.1 --error 0.01 && npx @gltf-transform/cli resize out.glb out.glb --width 64 --height 64 && npx @gltf-transform/cli draco out.glb final_opt.glb`
3. Move optimized file to `public/models/`
4. Add car entry in `src/data/cars.js` with real manufacturer dimensions
5. Add trunk dimensions in `scripts/generate_trunks.py`
6. Regenerate trunks: `uvx --from build123d python scripts/generate_trunks.py`

### Car Data Format (src/data/cars.js)

Each car entry must have:
- `name` — display name
- `modelPath` — path to optimized GLB
- `trunkModelPath` — path to trunk GLB
- `trunkFoldedModelPath` — path to folded-seat trunk GLB
- `exterior` — `{ length, width, height }` in meters (manufacturer specs)
- `trunk` — `{ length, width, height, offsetX, offsetY, offsetZ }` in meters
- `rearFolded` — same format as trunk, for seats-folded config
- `color` — hex color for wireframe tint

### Dimensions

- All dimensions in code are in **meters** (real-world scale)
- Build123D scripts use **millimeters** (CAD convention), converted to meters on export
- Car dimensions sourced from manufacturer specs

### 3D Model Optimization Pipeline

Target: each car model should be under 1.5 MB after optimization.
- `simplify --ratio 0.1` — reduce polygons to 10%
- `resize --width 64 --height 64` — minimize textures (we render wireframe)
- `draco` — geometry compression

### Rendering Style

- Car exteriors: transparent body (opacity 0.1) + edge lines (wireframe look)
- Trunk shapes: green wireframe + slight fill (opacity 0.08)
- Objects: solid colored boxes with wireframe outline, green/red glow for fit status

## Commands

```bash
npm run dev                    # Start dev server
npm run build                  # Production build
uvx --from build123d python scripts/generate_trunks.py   # Regenerate trunk models
npx @gltf-transform/cli inspect <file.glb>               # Inspect 3D model stats
```

## Git

- Keep optimized models (`*_opt.glb`) in git — they're small (< 1.5 MB each)
- Keep trunk models in git — they're tiny (3-25 KB each)
- Do NOT commit raw/unoptimized models — add to .gitignore
- Binary GLB files: commit directly (no LFS needed at current scale)
