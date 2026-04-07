// Analyze car models using gltf-transform with proper node transform handling
import { NodeIO, getBounds } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { readdirSync, readFileSync } from 'fs';

async function analyzeModel(io, filePath, carData) {
  try {
    const doc = await io.read(filePath);
    const scene = doc.getRoot().listScenes()[0];
    if (!scene) return { error: 'No scene' };

    // getBounds applies full node hierarchy transforms
    const bounds = getBounds(scene);
    const min = bounds.min;
    const max = bounds.max;

    const sizeX = max[0] - min[0];
    const sizeY = max[1] - min[1];
    const sizeZ = max[2] - min[2];

    // Simulate CarModel.jsx transform:
    // 1. Scale so longest axis = car.exterior.length
    const longestAxis = Math.max(sizeX, sizeY, sizeZ);
    const sf = carData.exterior.length / longestAxis;

    const scaledMinX = min[0] * sf, scaledMaxX = max[0] * sf;
    const scaledMinY = min[1] * sf, scaledMaxY = max[1] * sf;
    const scaledMinZ = min[2] * sf, scaledMaxZ = max[2] * sf;

    // 2. Center on X/Z, Y=0 at ground
    const centerX = (scaledMinX + scaledMaxX) / 2;
    const centerZ = (scaledMinZ + scaledMaxZ) / 2;

    const finalMinX = scaledMinX - centerX;
    const finalMaxX = scaledMaxX - centerX;
    const finalMinY = scaledMinY - scaledMinY; // = 0
    const finalMaxY = scaledMaxY - scaledMinY;
    const finalMinZ = scaledMinZ - centerZ;
    const finalMaxZ = scaledMaxZ - centerZ;

    const finalSizeX = finalMaxX - finalMinX;
    const finalSizeY = finalMaxY - finalMinY;
    const finalSizeZ = finalMaxZ - finalMinZ;

    const lengthAxis = finalSizeX > finalSizeZ ? 'X' : 'Z';

    // Vertex density analysis for front/rear detection
    // Count vertices in each half of the car along the length axis
    let negCount = 0, posCount = 0;
    const nodes = doc.getRoot().listNodes();

    for (const node of nodes) {
      const mesh = node.getMesh();
      if (!mesh) continue;

      // Get world transform
      const t = node.getWorldTranslation();
      const s = node.getWorldScale();

      for (const prim of mesh.listPrimitives()) {
        const posAccessor = prim.getAttribute('POSITION');
        if (!posAccessor) continue;
        const arr = posAccessor.getArray();
        if (!arr) continue;

        for (let i = 0; i < arr.length; i += 3) {
          // Apply node transform (simplified: just translation + scale)
          const wx = arr[i] * s[0] + t[0];
          const wy = arr[i+1] * s[1] + t[1];
          const wz = arr[i+2] * s[2] + t[2];

          // Apply car transform (scale + offset)
          const fx = wx * sf - centerX;
          const fz = wz * sf - centerZ;

          if (lengthAxis === 'X') {
            if (fx < 0) negCount++; else posCount++;
          } else {
            if (fz < 0) negCount++; else posCount++;
          }
        }
      }
    }

    // More vertices = more detail = likely front (engine/grille area)
    const frontAtNeg = negCount > posCount;
    const rearEnd = frontAtNeg ? 'positive' : 'negative';

    return {
      rawSize: [+sizeX.toFixed(2), +sizeY.toFixed(2), +sizeZ.toFixed(2)],
      finalBBox: {
        min: [+finalMinX.toFixed(3), +finalMinY.toFixed(3), +finalMinZ.toFixed(3)],
        max: [+finalMaxX.toFixed(3), +finalMaxY.toFixed(3), +finalMaxZ.toFixed(3)],
      },
      finalSize: [+finalSizeX.toFixed(3), +finalSizeY.toFixed(3), +finalSizeZ.toFixed(3)],
      lengthAxis,
      rearEnd,
      vertexRatio: `neg=${negCount} pos=${posCount}`,
      scaleFactor: +sf.toFixed(6),
    };
  } catch (e) {
    return { error: e.message };
  }
}

const decoderModule = await draco3d.createDecoderModule();
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ 'draco3d.decoder': decoderModule });

const carsModule = await import('../src/data/cars.js');
const cars = carsModule.cars;

const results = {};

for (const [carId, carData] of Object.entries(cars)) {
  const modelFile = carData.modelPath.replace('/models/', '');
  const filePath = `public/models/${modelFile}`;

  try {
    readFileSync(filePath);
  } catch {
    results[carId] = { error: `File not found: ${modelFile}` };
    continue;
  }

  process.stderr.write(`${carId}...`);
  const info = await analyzeModel(io, filePath, carData);
  results[carId] = info;
  process.stderr.write(` ${info.lengthAxis || 'ERR'} rear@${info.rearEnd || '?'}\n`);
}

console.log(JSON.stringify(results, null, 2));
