#!/usr/bin/env node
/**
 * Compute trunk positions based on actual 3D model bounding boxes.
 * This matches the scaling logic in CarModel.jsx exactly.
 *
 * Run: node scripts/compute_trunk_from_models.js
 */

import { readFile } from 'fs/promises';

// Read cars.js to get the car data
const carsModule = await import('../src/data/cars.js');
const { cars } = carsModule;

// Car type classification for trunk position rules
const CAR_TYPES = {
  'toyota-supra-mk4': 'sports_rear',
  'toyota-supra-mk5': 'sports_rear',
  'toyota-land-cruiser-300': 'suv',
  'bmw-3-series-2018': 'sedan',
  'bmw-m3-sedan': 'sedan',
  'bmw-m4-2021': 'coupe',
  'bmw-m8-2020': 'coupe',
  'bmw-i8-2015': 'mid_engine',
  'bmw-x6m': 'suv',
  'vw-golf-ii': 'hatchback',
  'tesla-roadster-2020': 'mid_engine',
  'tesla-cybertruck': 'truck',
  'audi-r8': 'mid_engine',
  'audi-rs7-2014': 'sedan',
  'mercedes-amg-gt': 'sports_rear',
  'porsche-cayman-s-2014': 'mid_engine',
  'porsche-panamera-2021': 'sedan',
  'porsche-taycan-turbo-s': 'sedan',
  'ferrari-488-gtb': 'mid_engine',
  'ferrari-599': 'sports_rear',
  'ferrari-f8-tributo': 'mid_engine',
  'lamborghini-aventador-svj': 'mid_engine',
  'lamborghini-huracan-gt': 'mid_engine',
  'honda-civic-type-r-2024': 'hatchback',
  'honda-nsx-1990': 'mid_engine',
  'ford-mustang-gt-1968': 'coupe',
  'ford-f150-raptor-2018': 'truck',
  'ford-gt40': 'mid_engine',
  'dodge-challenger-rt': 'coupe',
  'dodge-challenger-hellcat': 'coupe',
  'chevrolet-camaro-ss-2016': 'coupe',
  'chevrolet-corvette-c8': 'mid_engine',
  'hyundai-sonata-2009': 'sedan',
  'hyundai-tucson-2015': 'suv',
  'hyundai-elantra-n-2022': 'sedan',
  'hyundai-veloster-n': 'hatchback',
  'hyundai-creta-2016': 'suv',
  'subaru-impreza-wrx': 'sedan',
  'mazda-rx7': 'sports_rear',
  'bugatti-bolide-2024': 'mid_engine',
  'aston-martin-vantage': 'sports_rear',
  'mclaren-720s': 'mid_engine',
  'maserati-granturismo': 'sports_rear',
  'nissan-370z': 'sports_rear',
  'nissan-gtr-r35': 'sports_rear',
};

// Proportion rules: where trunk sits relative to scaled car center
// After CarModel.jsx scaling, car is centered at (0, _, 0) with Y=0 at ground
const RULES = {
  sedan:       { z_pct: -0.34, y_pct: 0.22, y_min: 0.28 },
  hatchback:   { z_pct: -0.30, y_pct: 0.22, y_min: 0.28 },
  suv:         { z_pct: -0.32, y_pct: 0.26, y_min: 0.35 },
  sports_rear: { z_pct: -0.36, y_pct: 0.22, y_min: 0.25 },
  mid_engine:  { z_pct: 0.35,  y_pct: 0.22, y_min: 0.22 },
  truck:       { z_pct: -0.28, y_pct: 0.36, y_min: 0.55 },
  coupe:       { z_pct: -0.35, y_pct: 0.22, y_min: 0.26 },
};

console.log('Computing trunk positions based on car proportions...\n');

const updates = {};

for (const [carId, car] of Object.entries(cars)) {
  const carType = CAR_TYPES[carId] || 'sedan';
  const rule = RULES[carType];
  const { length, width, height } = car.exterior;

  const offsetX = 0;
  const offsetY = Math.max(height * rule.y_pct, rule.y_min);
  const offsetZ = length * rule.z_pct;

  updates[carId] = {
    offsetX: Math.round(offsetX * 100) / 100,
    offsetY: Math.round(offsetY * 100) / 100,
    offsetZ: Math.round(offsetZ * 100) / 100,
  };

  const current = car.trunk;
  const diff = {
    dY: Math.round((offsetY - current.offsetY) * 100),
    dZ: Math.round((offsetZ - current.offsetZ) * 100),
  };

  console.log(`${carId.padEnd(35)} ${carType.padEnd(14)} Z=${offsetZ.toFixed(2).padStart(6)} Y=${offsetY.toFixed(2)} (dY=${diff.dY}cm dZ=${diff.dZ}cm)`);
}

console.log('\n=== Paste into cars.js trunk.offsetY and trunk.offsetZ ===');
console.log(JSON.stringify(updates, null, 2));
