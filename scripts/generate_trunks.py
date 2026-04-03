#!/usr/bin/env python3
"""
Generate parametric trunk/cargo area 3D models for each car.
These are dimensionally accurate shapes that can be loaded alongside
the exterior wireframe models.

All dimensions in mm (Build123D convention), exported as GLB in meters.
"""
from build123d import Box, Cylinder, Pos, Rot, export_gltf

OUTPUT_DIR = "./public/models/trunks"

import os
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_sedan_trunk(width_mm, height_mm, depth_mm, wheel_well_radius=160, wheel_well_depth=200):
    """Sedan trunk: box with wheel well intrusions on both sides."""
    trunk = Box(width_mm, height_mm, depth_mm)

    # Wheel wells intrude from the sides near the rear
    if wheel_well_radius > 0:
        ww_x = width_mm / 2 - wheel_well_radius * 0.3
        ww_z = -depth_mm / 2 + wheel_well_depth
        ww_left = Pos(-ww_x, -height_mm * 0.1, ww_z) * Rot(90, 0, 0) * Cylinder(radius=wheel_well_radius, height=height_mm * 0.8)
        ww_right = Pos(ww_x, -height_mm * 0.1, ww_z) * Rot(90, 0, 0) * Cylinder(radius=wheel_well_radius, height=height_mm * 0.8)
        trunk = trunk - ww_left - ww_right

    return trunk


def make_suv_cargo(width_mm, height_mm, depth_mm, wheel_well_radius=180):
    """SUV cargo area: taller box with wheel well intrusions."""
    cargo = Box(width_mm, height_mm, depth_mm)

    if wheel_well_radius > 0:
        ww_x = width_mm / 2 - wheel_well_radius * 0.2
        ww_z = -depth_mm / 2 + wheel_well_radius
        ww_left = Pos(-ww_x, -height_mm * 0.2, ww_z) * Rot(90, 0, 0) * Cylinder(radius=wheel_well_radius, height=height_mm * 0.6)
        ww_right = Pos(ww_x, -height_mm * 0.2, ww_z) * Rot(90, 0, 0) * Cylinder(radius=wheel_well_radius, height=height_mm * 0.6)
        cargo = cargo - ww_left - ww_right

    return cargo


def make_hatchback_trunk(width_mm, height_mm, depth_mm, wheel_well_radius=150):
    """Hatchback trunk: similar to sedan but wider opening."""
    return make_sedan_trunk(width_mm, height_mm, depth_mm, wheel_well_radius)


def make_sports_frunk(width_mm, height_mm, depth_mm):
    """Sports car front trunk (frunk): simple shaped box, no wheel wells."""
    return Box(width_mm, height_mm, depth_mm)


# Car trunk definitions: (width, height, depth) in mm
# These match the trunk dimensions in cars.js
cars = {
    "toyota_supra_mk4": {
        "name": "Toyota Supra MK4",
        "type": "sedan",
        "trunk": (1100, 400, 750),
        "trunk_folded": (1100, 450, 1200),
        "wheel_well": 160,
    },
    "bmw_2018": {
        "name": "BMW 3 Series 2018",
        "type": "sedan",
        "trunk": (1250, 480, 1000),
        "trunk_folded": (1250, 520, 1700),
        "wheel_well": 170,
    },
    "bmw_x6m": {
        "name": "BMW X6 M",
        "type": "suv",
        "trunk": (1400, 650, 1050),
        "trunk_folded": (1400, 700, 1850),
        "wheel_well": 190,
    },
    "vw_golf_ii": {
        "name": "VW Golf II",
        "type": "hatchback",
        "trunk": (1150, 500, 750),
        "trunk_folded": (1150, 600, 1450),
        "wheel_well": 150,
    },
    "tesla_roadster": {
        "name": "Tesla Roadster",
        "type": "frunk",
        "trunk": (900, 300, 600),
        "trunk_folded": (900, 350, 850),
        "wheel_well": 0,
    },
}

for car_id, car in cars.items():
    print(f"\n=== {car['name']} ===")

    w, h, d = car["trunk"]
    ww = car["wheel_well"]

    if car["type"] == "sedan":
        trunk = make_sedan_trunk(w, h, d, ww)
    elif car["type"] == "suv":
        trunk = make_suv_cargo(w, h, d, ww)
    elif car["type"] == "hatchback":
        trunk = make_hatchback_trunk(w, h, d, ww)
    elif car["type"] == "frunk":
        trunk = make_sports_frunk(w, h, d)

    bbox = trunk.bounding_box()
    vol = trunk.volume / 1e6  # mm³ to liters
    print(f"  Trunk: {w}x{h}x{d}mm = {vol:.0f} liters")
    print(f"  Faces: {len(trunk.faces())}, Edges: {len(trunk.edges())}")

    path = f"{OUTPUT_DIR}/{car_id}_trunk.glb"
    export_gltf(trunk, path, binary=True)
    print(f"  -> {path}")

    # Also generate folded version
    wf, hf, df = car["trunk_folded"]
    if car["type"] == "sedan":
        trunk_f = make_sedan_trunk(wf, hf, df, ww)
    elif car["type"] == "suv":
        trunk_f = make_suv_cargo(wf, hf, df, ww)
    elif car["type"] == "hatchback":
        trunk_f = make_hatchback_trunk(wf, hf, df, ww)
    elif car["type"] == "frunk":
        trunk_f = make_sports_frunk(wf, hf, df)

    vol_f = trunk_f.volume / 1e6
    print(f"  Folded: {wf}x{hf}x{df}mm = {vol_f:.0f} liters")

    path_f = f"{OUTPUT_DIR}/{car_id}_trunk_folded.glb"
    export_gltf(trunk_f, path_f, binary=True)
    print(f"  -> {path_f}")

print("\nDone! All trunk models generated.")
