import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';

const MODELS_DIR = 'public/models';

async function analyzeModel(io, filePath) {
  try {
    const doc = await io.read(filePath);
    const scenes = doc.getRoot().listScenes();

    // Collect all mesh nodes with positions
    const nodes = doc.getRoot().listNodes();
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    const meshNames = [];

    for (const node of nodes) {
      const name = node.getName();
      const mesh = node.getMesh();
      if (mesh) {
        meshNames.push(name || mesh.getName() || '(unnamed)');
      }

      // Get node translation for rough positioning
      const t = node.getWorldTranslation();
      const s = node.getWorldScale();
    }

    // Get all accessors to find actual geometry bounds
    const meshes = doc.getRoot().listMeshes();
    for (const mesh of meshes) {
      for (const prim of mesh.listPrimitives()) {
        const posAccessor = prim.getAttribute('POSITION');
        if (!posAccessor) continue;
        const posArray = posAccessor.getArray();
        if (!posArray) continue;

        for (let i = 0; i < posArray.length; i += 3) {
          const x = posArray[i], y = posArray[i+1], z = posArray[i+2];
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (z < minZ) minZ = z;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (z > maxZ) maxZ = z;
        }
      }
    }

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;

    // Find trunk-related mesh names
    const trunkKeywords = ['trunk', 'boot', 'cargo', 'luggage', 'tailgate', 'hatch', 'rear', 'kofferraum', 'coffre'];
    const trunkMeshes = meshNames.filter(n =>
      trunkKeywords.some(kw => n.toLowerCase().includes(kw))
    );

    return {
      bbox: { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
      size: [sizeX, sizeY, sizeZ],
      lengthAxis: sizeX > sizeZ ? 'X' : 'Z',
      longestDim: Math.max(sizeX, sizeY, sizeZ),
      meshCount: meshNames.length,
      trunkMeshes,
      allMeshNames: meshNames.slice(0, 20), // first 20 for reference
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const decoderModule = await draco3d.createDecoderModule();
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({ 'draco3d.decoder': decoderModule });

  const files = (await readdir(MODELS_DIR))
    .filter(f => f.endsWith('_opt.glb'))
    .sort();

  const results = {};

  for (const file of files) {
    const name = basename(file, '_opt.glb');
    process.stderr.write(`Analyzing ${name}...`);
    const info = await analyzeModel(io, join(MODELS_DIR, file));
    results[name] = info;
    process.stderr.write(` ${info.lengthAxis || 'ERR'}\n`);
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
