// Analyze car models using Three.js to get real bounding boxes after all node transforms
// This matches exactly what CarModel.jsx computes at runtime

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { readFileSync, readdirSync } from 'fs';

const MODELS_DIR = 'public/models';

// Polyfill for Node.js — GLTFLoader needs TextDecoder
import { TextDecoder as TD } from 'util';
globalThis.TextDecoder = globalThis.TextDecoder || TD;

// Polyfill self for three.js
globalThis.self = globalThis;

async function loadModel(filePath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

    // For Node.js, decode Draco using the JS decoder
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

    const buffer = readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    loader.parse(arrayBuffer, '', (gltf) => {
      resolve(gltf);
    }, (error) => {
      reject(error);
    });
  });
}

async function analyzeModel(filePath, carData) {
  try {
    const gltf = await loadModel(filePath);
    const scene = gltf.scene;

    // Compute bounding box same as CarModel.jsx
    const box = new THREE.Box3().setFromObject(scene);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    const longestAxis = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const sf = carData.exterior.length / longestAxis;
    scene.scale.setScalar(sf);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    const scaledMin = scaledBox.min;

    const offset = new THREE.Vector3(-scaledCenter.x, -scaledMin.y, -scaledCenter.z);
    scene.position.copy(offset);

    // Get final bounding box (same as runtime)
    const finalBox = new THREE.Box3().setFromObject(scene);
    const carMin = finalBox.min;
    const carMax = finalBox.max;
    const carSizeX = carMax.x - carMin.x;
    const carSizeY = carMax.y - carMin.y;
    const carSizeZ = carMax.z - carMin.z;

    // Determine which axis is the car's length
    const lengthAxis = carSizeX > carSizeZ ? 'X' : 'Z';

    // Analyze vertex density at each end to determine front vs rear
    // Front of car (engine, grille, headlights) typically has more vertices
    const halfLength = lengthAxis === 'X' ? carSizeX / 2 : carSizeZ / 2;

    let negEndVertices = 0;
    let posEndVertices = 0;

    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const posAttr = child.geometry.getAttribute('position');
        if (!posAttr) return;

        // Get world matrix for this mesh
        child.updateWorldMatrix(true, false);
        const worldMatrix = child.matrixWorld;

        const v = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
          v.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
          v.applyMatrix4(worldMatrix);

          if (lengthAxis === 'X') {
            if (v.x < 0) negEndVertices++;
            else posEndVertices++;
          } else {
            if (v.z < 0) negEndVertices++;
            else posEndVertices++;
          }
        }
      }
    });

    // The end with MORE vertices is likely the front (engine, headlights, grille = more detail)
    const frontAtNeg = negEndVertices > posEndVertices;
    const rearEnd = frontAtNeg ? 'positive' : 'negative';

    // Collect mesh names for reference
    const meshNames = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        meshNames.push(child.name || '(unnamed)');
      }
    });

    return {
      finalBBox: {
        min: [+carMin.x.toFixed(3), +carMin.y.toFixed(3), +carMin.z.toFixed(3)],
        max: [+carMax.x.toFixed(3), +carMax.y.toFixed(3), +carMax.z.toFixed(3)],
      },
      size: {
        x: +carSizeX.toFixed(3),
        y: +carSizeY.toFixed(3),
        z: +carSizeZ.toFixed(3),
      },
      lengthAxis,
      rearEnd,
      vertexBalance: { negEnd: negEndVertices, posEnd: posEndVertices },
      scaleFactor: +sf.toFixed(6),
      meshCount: meshNames.length,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// Import car data
const carsModule = await import('../src/data/cars.js');
const cars = carsModule.cars;

const files = readdirSync(MODELS_DIR)
  .filter(f => f.endsWith('_opt.glb'))
  .sort();

const results = {};

for (const [carId, carData] of Object.entries(cars)) {
  const modelFile = carData.modelPath.replace('/models/', '');
  const filePath = `${MODELS_DIR}/${modelFile}`;

  try {
    readFileSync(filePath); // verify file exists
  } catch {
    results[carId] = { error: `File not found: ${modelFile}` };
    continue;
  }

  process.stderr.write(`Analyzing ${carId}...`);
  const info = await analyzeModel(filePath, carData);
  results[carId] = info;
  process.stderr.write(` ${info.lengthAxis || 'ERR'} rear@${info.rearEnd || '?'}\n`);
}

console.log(JSON.stringify(results, null, 2));
