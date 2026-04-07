// Generate precise trunk positions based on model analysis + real manufacturer trunk dimensions
// Output: a modelOrientations map for CarModel.jsx to use

import { readFileSync } from 'fs';

const analysis = JSON.parse(readFileSync('/tmp/car_v2_analysis.json', 'utf-8'));
const carsModule = await import('../src/data/cars.js');
const cars = carsModule.cars;

const orientations = {};

for (const [carId, carData] of Object.entries(cars)) {
  const info = analysis[carId];
  if (!info || info.error) {
    console.error(`SKIP ${carId}: ${info?.error || 'no analysis'}`);
    continue;
  }

  const bb = info.finalBBox;
  const axis = info.lengthAxis;
  const rearEnd = info.rearEnd;
  const trunkDims = carData.trunk;

  // Car dimensions after transform
  const carHeight = bb.max[1] - bb.min[1];

  // Trunk floor height: roughly top of rear wheel arch
  // Sedans: ~25% of car height, SUVs: ~35%, sports cars: ~22%
  const carHeightReal = carData.exterior.height;
  const isHighCar = carHeightReal > 1.6; // SUVs, trucks
  const isLowCar = carHeightReal < 1.35; // sports cars
  const floorRatio = isHighCar ? 0.32 : isLowCar ? 0.20 : 0.25;
  const trunkFloorY = carHeight * floorRatio;

  // Position along length axis
  let trunkCenterLength;
  const isFrunk = (trunkDims.offsetZ || 0) > 0;

  if (axis === 'X') {
    const carLength = bb.max[0] - bb.min[0];
    const inset = carLength * 0.05;
    if (rearEnd === 'negative') {
      trunkCenterLength = isFrunk
        ? bb.max[0] - trunkDims.length / 2 - inset
        : bb.min[0] + trunkDims.length / 2 + inset;
    } else {
      trunkCenterLength = isFrunk
        ? bb.min[0] + trunkDims.length / 2 + inset
        : bb.max[0] - trunkDims.length / 2 - inset;
    }
    orientations[carId] = {
      offsetX: +trunkCenterLength.toFixed(3),
      offsetY: +trunkFloorY.toFixed(3),
      offsetZ: 0,
    };
  } else {
    const carLength = bb.max[2] - bb.min[2];
    const inset = carLength * 0.05;
    if (rearEnd === 'negative') {
      trunkCenterLength = isFrunk
        ? bb.max[2] - trunkDims.length / 2 - inset
        : bb.min[2] + trunkDims.length / 2 + inset;
    } else {
      trunkCenterLength = isFrunk
        ? bb.min[2] + trunkDims.length / 2 + inset
        : bb.max[2] - trunkDims.length / 2 - inset;
    }
    orientations[carId] = {
      offsetX: 0,
      offsetY: +trunkFloorY.toFixed(3),
      offsetZ: +trunkCenterLength.toFixed(3),
    };
  }
}

// Output as JS module
console.log(`// Auto-generated trunk positions based on 3D model analysis
// Each entry: { offsetX, offsetY, offsetZ } — center of trunk floor in world coords
// offsetY = trunk floor height, offsetX/Z = center of trunk along length axis

export const trunkPositions = ${JSON.stringify(orientations, null, 2)};
`);
