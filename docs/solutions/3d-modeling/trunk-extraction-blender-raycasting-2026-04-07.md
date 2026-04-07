---
title: "Trunk Geometry Extraction from 3D Car Models via Blender Raycasting"
date: 2026-04-07
problem_type: knowledge
track: knowledge
module: will-it-fit
components:
  - CarModel
  - trunk-extraction
tags:
  - blender
  - 3d-models
  - trunk-extraction
  - raycasting
  - glb
  - mcp
category: 3d-modeling
status: documented
summary: >
  How to extract accurate trunk cavity geometry from 3D car models using
  Blender MCP raycasting. Covers why simpler approaches fail and the
  complete pipeline from loading a model to exporting a trunk mesh.
key_findings:
  - Simple box trunks float in wrong positions due to model coordinate mismatches
  - Runtime Three.js raycasting is unreliable (hits wrong surfaces)
  - Correct approach: Blender MCP raycasting with manufacturer-spec constraints
  - Car models have inconsistent orientations and a 0.01 scale factor
  - Trunk lid can be identified and rotated for an open-trunk variant
related_files:
  - src/components/CarModel.jsx
  - src/data/cars.js
  - src/data/trunkPositions.js
  - scripts/blender_helper.py
  - public/models/trunks/
---

## Context

The "Will It Fit?" app renders 45 car models as transparent wireframes and overlays a green trunk cavity shape so users can see if items fit. Each car GLB has a different orientation, scale, origin point, and mesh structure. We need accurate trunk shapes that align with each model — not guessed boxes.

Three simpler approaches were tried first and all failed for specific reasons:

- **Hardcoded boxes** cannot account for 45 models with different orientations, scales, and origins. The trunk floats in space, clips through wheels, or appears at the wrong end.
- **Runtime auto-detection** (analyzing bounding boxes at load time) improves positioning but still produces rectangular shapes, not real trunk cavities.
- **Runtime Three.js raycasting** hits wrong surfaces (dashboard, undercarriage, interior panels) because the web renderer lacks Blender's full scene graph awareness.

## Guidance

**Use Blender MCP raycasting to probe trunk cavities from within the 3D model itself.**

### Prerequisites

- Blender with MCP addon running on port 9876
- `scripts/blender_helper.py` for sending Python code to Blender via socket
- `.mcp.json` configured with the Blender MCP server

### The Pipeline (4 stages)

#### Stage 1: Load the model and detect the rear end

```python
import bpy

# Clear scene and load the car
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath='public/models/car_opt.glb')

# Count vertex density per half to determine front vs rear
neg_y_verts = 0
pos_y_verts = 0
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    for v in obj.data.vertices:
        wv = obj.matrix_world @ v.co
        if wv[1] < 0:
            neg_y_verts += 1
        else:
            pos_y_verts += 1

# More vertices = front (engine, headlights, grille have more detail)
# Fewer vertices = rear (trunk area)
rear_at_positive_y = neg_y_verts > pos_y_verts
```

**Coordinate system note:** Models carry a 0.01 scale factor in the node hierarchy. All coordinates are in model units where 1 model unit = real meters / 100. Multiply by 10000 to get centimeters.

#### Stage 2: Find the trunk lid mesh

Search for meshes at the rear-top of the car:

```python
from mathutils import Vector

rear_start_y = 0.0140 if rear_at_positive_y else -0.0240

for obj in bpy.data.objects:
    if obj.type != 'MESH' or len(obj.data.vertices) < 10:
        continue
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    min_y = min(v[1] for v in ws)
    max_z = max(v[2] for v in ws)
    width = (max(v[0] for v in ws) - min(v[0] for v in ws)) * 10000  # in cm
    depth = (max(v[1] for v in ws) - min_y) * 10000

    # Trunk lid: at the rear, above midline, reasonably wide and deep
    if min_y > rear_start_y * 0.8 and max_z > 0.007 and width > 30 and depth > 20:
        print(f'Candidate: {obj.name} ({width:.0f}cm x {depth:.0f}cm)')
```

For BMW 3 Series, this identifies **Object_85** (134cm wide, 59cm deep, 248 vertices). Use the trunk lid's Z range as a ceiling cap for raycasting.

#### Stage 3: Probe the trunk cavity

**Critical: delete any previously created trunk meshes before probing, or they'll block the rays.**

```python
scene = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()

# Manufacturer constraints (example: BMW 3 Series)
MAX_WIDTH = 0.0112    # 112cm between wheel arches
FLOOR_Z = 0.0030      # 30cm from ground (floor pan level)
LID_MAX_Z = 0.0115    # trunk lid top

profiles = []
for i in range(14):
    y = y_start + (y_end - y_start) * i / 13

    # Find walls at multiple heights, take widest within manufacturer limit
    center = Vector((0, y, 0.0050))
    res = scene.ray_cast(depsgraph, center, Vector((-1, 0, 0)), distance=0.015)
    left_x = max(res[1][0] if res[0] else -MAX_WIDTH/2, -MAX_WIDTH/2)

    res = scene.ray_cast(depsgraph, center, Vector((1, 0, 0)), distance=0.015)
    right_x = min(res[1][0] if res[0] else MAX_WIDTH/2, MAX_WIDTH/2)

    # Ceiling: cast DOWN from just above trunk lid
    ceiling_points = []
    for ix in range(9):
        x = left_x + (right_x - left_x) * ix / 8
        probe = Vector((x, y, LID_MAX_Z + 0.001))
        res = scene.ray_cast(depsgraph, probe, Vector((0, 0, -1)), distance=0.010)
        cz = min(res[1][2], LID_MAX_Z) if res[0] else LID_MAX_Z * 0.8
        ceiling_points.append((x, cz))

    # Floor: cast UP from below to find actual floor pan
    probe = Vector((0, y, 0.0005))
    res = scene.ray_cast(depsgraph, probe, Vector((0, 0, 1)), distance=0.008)
    floor_z = max(res[1][2], FLOOR_Z) if res[0] else FLOOR_Z

    profiles.append({'y': y, 'left': left_x, 'right': right_x,
                     'floor': floor_z, 'ceil': ceiling_points})
```

#### Stage 4: Build mesh and export

```python
import bmesh

bm = bmesh.new()
all_slices = []

for p in profiles:
    verts = []
    # Floor (5 points left to right)
    for i in range(5):
        x = p['left'] + (p['right'] - p['left']) * i / 4
        verts.append(bm.verts.new((x, p['y'], p['floor'])))
    # Right wall up to ceiling
    verts.append(bm.verts.new((p['right'], p['y'], p['ceil'][-1][1])))
    # Ceiling right to left
    for x, cz in reversed(p['ceil'][1:-1]):
        verts.append(bm.verts.new((x, p['y'], cz)))
    # Left wall down from ceiling
    verts.append(bm.verts.new((p['left'], p['y'], p['ceil'][0][1])))
    all_slices.append(verts)

# Connect adjacent cross-sections with quad faces
bm.verts.ensure_lookup_table()
for si in range(len(all_slices) - 1):
    s1, s2 = all_slices[si], all_slices[si + 1]
    for vi in range(len(s1)):
        vn = (vi + 1) % len(s1)
        try:
            bm.faces.new([s1[vi], s1[vn], s2[vn], s2[vi]])
        except:
            pass

# Create object and export
mesh = bpy.data.meshes.new('TrunkCavity')
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new('TrunkCavity', mesh)
bpy.context.collection.objects.link(obj)

bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath='public/models/trunks/car_trunk_blender.glb',
    use_selection=True, export_format='GLB'
)
```

### Web app alignment

Both car GLB and trunk GLB originate from the same Blender coordinate space. In `CarModel.jsx`, apply the same scale and offset to both:

```jsx
// Car transform
const sf = car.exterior.length / longestAxis;
scene.scale.setScalar(sf);
scene.position.copy(offset);

// Trunk gets SAME transform → automatic alignment
const trunkScene = trunkGltf.scene.clone(true);
trunkScene.scale.setScalar(sf);
trunkScene.position.copy(offset);
```

### Open trunk lid variant

Bake the rotation directly into vertex data (do NOT use `rotation_euler`):

```python
import math
from mathutils import Vector, Matrix

trunk_lid = bpy.data.objects.get('Object_85')
ws = [trunk_lid.matrix_world @ v.co for v in trunk_lid.data.vertices]
hinge = Vector((0, min(v[1] for v in ws), max(v[2] for v in ws)))

rot_matrix = Matrix.Rotation(math.radians(70), 4, 'X')
for v in trunk_lid.data.vertices:
    world_co = trunk_lid.matrix_world @ v.co
    v.co = trunk_lid.matrix_world.inverted() @ (rot_matrix @ (world_co - hinge) + hinge)
trunk_lid.data.update()

# Export entire car (trunk lid is now baked open)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath='car_open_trunk.glb', use_selection=True, export_format='GLB')
```

### Wiring it up in cars.js

```javascript
'bmw-3-series-2018': {
    name: 'BMW 3 Series (2018)',
    modelPath: '/models/bmw_2018_opt.glb',
    blenderTrunkPath: '/models/trunks/bmw_3series_trunk_blender.glb',  // Blender-extracted
    openTrunkModelPath: '/models/bmw_2018_open_trunk_opt.glb',         // Open lid variant
    exterior: { length: 4.633, width: 1.811, height: 1.429 },
    trunk: { length: 1.00, width: 1.12, height: 0.48 },
    // ...
},
```

## Why This Matters

Blender MCP raycasting works where other approaches fail because Blender has the complete, correctly-parsed scene graph. Rays interact with the full evaluated depsgraph — the same geometry the modeler created — not a simplified web export with material overrides that confuse intersection tests.

The result: a contoured mesh that hugs the inner surfaces of the trunk cavity, narrower near wheel wells, lower where the floor pan curves, and capped at the trunk lid's actual height. Users see a realistic trunk shape instead of a floating box.

## When to Apply

- When adding any new car model to the project (run the pipeline once per car)
- When extracting any interior cavity (trunk, frunk, cargo area, truck bed) from a vehicle GLB
- When you need a fitted sub-volume from a complex 3D model where the cavity is defined by surrounding surfaces rather than explicit geometry

Do NOT use this when:
- The model already ships with a separate trunk/interior mesh
- A bounding-box approximation is sufficient (the hardcoded box approach works for rough estimates)
- The car model doesn't have enough mesh detail for meaningful raycasting (very low-poly models)

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Trunk at wrong end of car | Verify vertex density heuristic. Mid-engine cars may fool it. |
| Coordinates make no sense | Remember the 0.01 scale: multiply by 10000 to get cm |
| Rays hit your own trunk mesh | Delete any trunk objects from scene before re-probing |
| Open trunk doesn't export | Bake rotation into vertices with matrix math, don't use `rotation_euler` |
| Ceiling too high | Use trunk lid Z range as cap, not the rear window glass |
| Floor too high | Cast UP from below the car to find the actual floor pan (~30cm) |
| Trunk too wide | Clamp wall positions to manufacturer width specs |

## Related Files

- `src/components/CarModel.jsx` — loads car + trunk GLBs, 3-tier trunk system
- `src/data/cars.js` — car definitions with `blenderTrunkPath` and `openTrunkModelPath`
- `src/data/trunkPositions.js` — pre-computed fallback positions
- `scripts/blender_helper.py` — socket helper for Blender MCP communication
- `CLAUDE.md` — full project documentation including Blender MCP setup
