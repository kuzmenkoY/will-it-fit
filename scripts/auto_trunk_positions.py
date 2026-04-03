#!/usr/bin/env python3
"""
Auto-calculate trunk positions based on car type and exterior dimensions.
Uses known automotive proportions to estimate trunk offset positions.

Run: python scripts/auto_trunk_positions.py
Output: JSON with computed trunk offsets for each car
"""
import json
import subprocess
import struct
import os

# Car type classification and proportion rules
# offsetZ: negative = rear trunk, positive = front trunk (frunk)
# offsetY: height of trunk floor above ground
CAR_TYPES = {
    # Sedans: trunk in rear ~33% of car, floor at ~22% height
    'sedan': {'z_pct': -0.34, 'y_pct': 0.22, 'y_min': 0.28},
    # Hatchbacks: trunk in rear ~30%, floor slightly higher
    'hatchback': {'z_pct': -0.30, 'y_pct': 0.22, 'y_min': 0.28},
    # SUV/Crossover: trunk rear ~32%, floor higher
    'suv': {'z_pct': -0.32, 'y_pct': 0.26, 'y_min': 0.35},
    # Sports car with rear trunk
    'sports_rear': {'z_pct': -0.36, 'y_pct': 0.22, 'y_min': 0.25},
    # Mid-engine with front trunk (frunk)
    'mid_engine': {'z_pct': 0.35, 'y_pct': 0.22, 'y_min': 0.22},
    # Pickup truck bed
    'truck': {'z_pct': -0.28, 'y_pct': 0.36, 'y_min': 0.55},
    # Coupe with small rear trunk
    'coupe': {'z_pct': -0.35, 'y_pct': 0.22, 'y_min': 0.26},
}

# Classify each car
CARS = {
    'toyota-supra-mk4': ('sports_rear', 4.520, 1.810, 1.275),
    'toyota-supra-mk5': ('sports_rear', 4.379, 1.854, 1.292),
    'toyota-land-cruiser-300': ('suv', 4.985, 1.980, 1.925),
    'bmw-3-series-2018': ('sedan', 4.633, 1.811, 1.429),
    'bmw-m3-sedan': ('sedan', 4.794, 1.903, 1.433),
    'bmw-m4-2021': ('coupe', 4.794, 1.887, 1.393),
    'bmw-m8-2020': ('coupe', 4.843, 1.906, 1.346),
    'bmw-i8-2015': ('mid_engine', 4.689, 1.942, 1.291),
    'bmw-x6m': ('suv', 4.955, 2.004, 1.696),
    'vw-golf-ii': ('hatchback', 4.020, 1.665, 1.415),
    'tesla-roadster-2020': ('mid_engine', 4.694, 2.024, 1.126),
    'tesla-cybertruck': ('truck', 5.683, 2.201, 1.791),
    'audi-r8': ('mid_engine', 4.426, 1.940, 1.240),
    'audi-rs7-2014': ('sedan', 4.980, 1.911, 1.408),
    'mercedes-amg-gt': ('sports_rear', 4.546, 1.939, 1.288),
    'porsche-cayman-s-2014': ('mid_engine', 4.380, 1.801, 1.295),
    'porsche-panamera-2021': ('sedan', 5.049, 1.937, 1.423),
    'porsche-taycan-turbo-s': ('sedan', 4.963, 1.966, 1.378),
    'ferrari-488-gtb': ('mid_engine', 4.568, 1.952, 1.213),
    'ferrari-599': ('sports_rear', 4.665, 1.962, 1.336),
    'ferrari-f8-tributo': ('mid_engine', 4.611, 1.979, 1.206),
    'lamborghini-aventador-svj': ('mid_engine', 4.943, 2.098, 1.136),
    'lamborghini-huracan-gt': ('mid_engine', 4.520, 1.933, 1.165),
    'honda-civic-type-r-2024': ('hatchback', 4.595, 1.890, 1.405),
    'honda-nsx-1990': ('mid_engine', 4.430, 1.810, 1.170),
    'ford-mustang-gt-1968': ('coupe', 4.614, 1.801, 1.308),
    'ford-f150-raptor-2018': ('truck', 5.890, 2.195, 1.961),
    'ford-gt40': ('mid_engine', 4.140, 1.778, 1.029),
    'dodge-challenger-rt': ('coupe', 5.017, 1.923, 1.448),
    'dodge-challenger-hellcat': ('coupe', 5.017, 1.923, 1.448),
    'chevrolet-camaro-ss-2016': ('coupe', 4.784, 1.897, 1.349),
    'chevrolet-corvette-c8': ('mid_engine', 4.630, 1.934, 1.234),
    'hyundai-sonata-2009': ('sedan', 4.800, 1.832, 1.475),
    'hyundai-tucson-2015': ('suv', 4.475, 1.850, 1.660),
    'hyundai-elantra-n-2022': ('sedan', 4.650, 1.825, 1.400),
    'hyundai-veloster-n': ('hatchback', 4.240, 1.800, 1.400),
    'hyundai-creta-2016': ('suv', 4.270, 1.790, 1.630),
    'subaru-impreza-wrx': ('sedan', 4.465, 1.740, 1.465),
    'mazda-rx7': ('sports_rear', 4.285, 1.760, 1.230),
    'bugatti-bolide-2024': ('mid_engine', 4.755, 1.998, 1.240),
    'aston-martin-vantage': ('sports_rear', 4.465, 1.942, 1.273),
    'mclaren-720s': ('mid_engine', 4.543, 2.059, 1.196),
    'maserati-granturismo': ('sports_rear', 4.881, 1.847, 1.353),
    'nissan-370z': ('sports_rear', 4.250, 1.845, 1.315),
    'nissan-gtr-r35': ('sports_rear', 4.710, 1.895, 1.370),
}

results = {}

for car_id, (car_type, length, width, height) in CARS.items():
    props = CAR_TYPES[car_type]

    # Compute Z offset (front/back position)
    offset_z = length * props['z_pct']

    # Compute Y offset (height from ground)
    offset_y = max(height * props['y_pct'], props['y_min'])

    # X is always centered
    offset_x = 0

    results[car_id] = {
        'type': car_type,
        'offsetX': round(offset_x, 2),
        'offsetY': round(offset_y, 2),
        'offsetZ': round(offset_z, 2),
    }

    print(f"{car_id:40s} {car_type:15s} Z={offset_z:+.2f}  Y={offset_y:.2f}")

# Output as JSON
print("\n=== JSON OUTPUT ===")
print(json.dumps(results, indent=2))

# Write to file
with open('scripts/trunk_positions.json', 'w') as f:
    json.dump(results, f, indent=2)
print(f"\nSaved to scripts/trunk_positions.json")
