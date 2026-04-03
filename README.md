# Will It Fit?

A 3D web app that answers: **"Can I fit this object in my car?"**

Select a real car model, add items with real-world dimensions, and see if they fit in the trunk. Uses actual 3D car models rendered as transparent wireframes with parametric trunk shapes generated via CAD.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Features

- **5 real car models** — Toyota Supra MK4, BMW 3 Series, BMW X6 M, VW Golf II, Tesla Roadster
- **Real-world dimensions** — cars and objects scaled to manufacturer specs
- **3D wireframe visualization** — see-through car body with visible trunk area
- **Parametric trunk shapes** — generated with Build123D (Python CAD), includes wheel well cutouts
- **9 preset objects** — carry-on suitcase, large suitcase, 55"/65" TV box, golf bag, stroller, moving box, bicycle, IKEA Kallax
- **Custom objects** — enter any W x H x D in centimeters
- **Fit detection** — real-time: green = fits, red = doesn't fit
- **Object rotation** — try different orientations to make things fit
- **Camera presets** — Overview, Rear/Trunk, Top Down, Side views
- **Fold rear seats** — toggle to expand cargo area

## Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move selected item (5cm steps) |
| Shift + Arrow | Fine movement (1cm steps) |
| W / S | Move item up/down |
| R | Rotate item (cycles through orientations) |
| Tab | Cycle between placed items |
| Mouse drag | Orbit camera |
| Scroll | Zoom |

## Architecture

```
will-it-fit/
├── public/models/           # 3D car models (GLB, Draco-compressed)
│   ├── *_opt.glb            # Optimized car exteriors (~0.3-1.2 MB each)
│   └── trunks/              # Parametric trunk shapes (~3-25 KB each)
├── scripts/
│   └── generate_trunks.py   # Build123D script to regenerate trunk models
├── src/
│   ├── components/
│   │   ├── CarModel.jsx     # Loads car + trunk GLB, applies wireframe style
│   │   ├── DraggableObject.jsx  # Placed items with fit detection
│   │   ├── ObjectMover.jsx  # Keyboard movement handler
│   │   ├── Scene.jsx        # Three.js canvas, camera presets, lighting
│   │   └── Sidebar.jsx      # Car selector, item catalog, controls
│   ├── data/
│   │   ├── cars.js          # Car specs (dimensions, model paths)
│   │   └── objects.js       # Preset object dimensions
│   └── store/
│       └── useStore.js      # Zustand state (car selection, placed objects, fit results)
└── .claude/skills/          # VibeCAD skills for 3D model operations
    ├── build123d/           # Parametric CAD modeling
    ├── gltf-transform/      # Model optimization (simplify, compress)
    ├── render-glb/          # Render GLB to PNG
    └── model-compare/       # Compare 3D models
```

## Tech Stack

- **React** + **Vite** — frontend framework and build tool
- **React Three Fiber** (Three.js) — 3D rendering in the browser
- **@react-three/drei** — Three.js helpers (OrbitControls, Grid, Html, Environment)
- **Zustand** — state management
- **Build123D** (Python) — parametric CAD for generating trunk shapes
- **gltf-transform** — 3D model optimization pipeline

## 3D Model Pipeline

### Car exteriors

Downloaded from open-source repositories as GLB files, then optimized:

1. **Simplify** — reduce to ~10% of original polygon count (`gltf-transform simplify --ratio 0.1`)
2. **Resize textures** — shrink to 64x64 since we render wireframe (`gltf-transform resize --width 64`)
3. **Draco compress** — geometry compression (`gltf-transform draco`)

Result: **87 MB total reduced to 3.5 MB** (96% reduction).

### Trunk shapes

Generated programmatically with Build123D (Python CAD library):

```bash
# Regenerate all trunk models
uvx --from build123d python scripts/generate_trunks.py
```

Each trunk is a parametric solid: box minus wheel well cylinders. Perfectly dimensioned, ~3-25 KB each.

### Adding a new car

1. Find a GLB model (Sketchfab, GitHub repos, etc.)
2. Optimize it: `npx @gltf-transform/cli simplify <in> <out> --ratio 0.1 && npx @gltf-transform/cli resize <out> <out> --width 64 && npx @gltf-transform/cli draco <out> <out>`
3. Add entry in `src/data/cars.js` with real dimensions
4. Add trunk dimensions in `scripts/generate_trunks.py` and regenerate
5. Place optimized GLB in `public/models/` and trunk GLBs in `public/models/trunks/`

## Car Dimensions Reference

| Car | Length | Width | Height | Trunk Volume |
|-----|--------|-------|--------|-------------|
| Toyota Supra MK4 | 4520mm | 1810mm | 1275mm | 295 L |
| BMW 3 Series (2018) | 4633mm | 1811mm | 1429mm | 552 L |
| BMW X6 M | 4955mm | 2004mm | 1696mm | 900 L |
| VW Golf II | 4020mm | 1665mm | 1415mm | 392 L |
| Tesla Roadster | 4694mm | 2024mm | 1126mm | 162 L (frunk) |

## Similar Projects

- [ItemFits.com](https://itemfits.com/fit/vehicle/car) — 2D cargo dimension calculator (no 3D)
- No existing 3D interactive "will it fit" visualizer was found (as of April 2026)

## License

MIT
