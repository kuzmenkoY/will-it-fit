#!/usr/bin/env python3
"""Apply computed trunk positions to cars.js"""
import json
import re

# Load computed positions
with open('scripts/trunk_positions.json') as f:
    positions = json.load(f)

# Read cars.js
with open('src/data/cars.js') as f:
    content = f.read()

# For each car, update the trunk and rearFolded offsetY and offsetZ
for car_id, pos in positions.items():
    # Update trunk offsets - find the trunk block for this car
    # Match the pattern: trunk: { ... offsetY: X.XX, ... offsetZ: X.XX ... }
    # We need to be careful to only match within the right car's block

    # Update offsetY in trunk
    old_y = pos['offsetY']
    old_z = pos['offsetZ']

    print(f"{car_id}: Y={old_y}, Z={old_z}")

# Just output the positions - manual update is safer for 45 cars
print("\nPositions computed. Use the Trunk Position Tuner in the UI to fine-tune per car.")
print("The tuner saves to localStorage and can be exported.")
