import { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { cars } from '../data/cars';
import { trunkPositions } from '../data/trunkPositions';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

export default function CarModel() {
  const groupRef = useRef();
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const carOpacity = useStore((s) => s.carOpacity);
  const car = cars[selectedCarId];
  const trunkDims = rearSeatsDown ? car.rearFolded : car.trunk;

  const gltf = useLoader(GLTFLoader, car.modelPath, (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  const { scaledScene, scaleFactor, sceneOffset, autoTrunk } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    const longestAxis = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const sf = car.exterior.length / longestAxis;
    scene.scale.setScalar(sf);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    const scaledMin = scaledBox.min;

    const offset = new THREE.Vector3(-scaledCenter.x, -scaledMin.y, -scaledCenter.z);
    scene.position.copy(offset);

    // Use pre-computed trunk position from model analysis (data-driven, not heuristic)
    const precomputed = trunkPositions[selectedCarId];
    const at = {
      width: trunkDims.width,
      height: trunkDims.height,
      length: trunkDims.length,
      offsetX: precomputed ? precomputed.offsetX : 0,
      offsetY: precomputed ? precomputed.offsetY : 0.3,
      offsetZ: precomputed ? precomputed.offsetZ : 0,
    };

    return { scaledScene: scene, scaleFactor: sf, sceneOffset: offset, autoTrunk: at };
  }, [gltf, car, trunkDims, selectedCarId]);

  // Share computed trunk with other components
  const setComputedTrunk = useStore((s) => s.setComputedTrunk);
  useEffect(() => {
    setComputedTrunk(autoTrunk);
  }, [autoTrunk, setComputedTrunk]);

  return (
    <group ref={groupRef}>
      <primitive object={scaledScene} />
      <TransparentOverride scene={scaledScene} color={car.color} opacity={carOpacity} />

      <TrunkShape carScene={scaledScene} trunk={autoTrunk} />
    </group>
  );
}

// Raycast helper: find nearest hit distance from origin in direction
function raycastDist(raycaster, origin, dir, meshes, maxDist) {
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length > 0 && hits[0].distance < maxDist) {
    return hits[0].distance;
  }
  return maxDist;
}

// Compute trunk shape by raycasting against the actual car body mesh
// Approach: for each cross-section along trunk length, find the real walls/ceiling
// Floor is kept flat (real trunk floors are flat), walls and ceiling follow the body
function computeTrunkGeometry(carScene, trunk) {
  const raycaster = new THREE.Raycaster();
  raycaster.near = 0.001;
  raycaster.far = 5;

  const carMeshes = [];
  carScene.traverse((child) => {
    if (child.isMesh) carMeshes.push(child);
  });
  if (carMeshes.length === 0) return null;

  // Trunk axis detection
  const lengthAlongX = Math.abs(trunk.offsetX) > Math.abs(trunk.offsetZ);

  // Sampling resolution
  const numSlices = 12;       // cross-sections along length
  const numWidthSamples = 10; // samples across the width for ceiling height
  const numHeightSamples = 8; // samples up the wall for width detection

  const floorY = trunk.offsetY;
  const maxCeilingY = trunk.offsetY + trunk.height;
  const halfW = trunk.width / 2;
  const halfL = trunk.length / 2;

  // For each slice: find the profile as a set of (widthPos, floorY, ceilingY) pairs
  // Then also find left/right wall positions at different heights
  const sliceData = [];

  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  const LEFT = lengthAlongX ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(-1, 0, 0);
  const RIGHT = lengthAlongX ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);

  for (let si = 0; si <= numSlices; si++) {
    const t = si / numSlices;
    // Position along trunk length axis
    let lengthPos;
    if (lengthAlongX) {
      lengthPos = trunk.offsetX - halfL + t * trunk.length;
    } else {
      lengthPos = trunk.offsetZ - halfL + t * trunk.length;
    }

    // Find ceiling height at different width positions
    const ceilingProfile = [];
    for (let wi = 0; wi <= numWidthSamples; wi++) {
      const wt = wi / numWidthSamples;
      const widthOffset = -halfW + wt * trunk.width;

      let origin;
      if (lengthAlongX) {
        origin = new THREE.Vector3(lengthPos, maxCeilingY + 0.5, trunk.offsetZ + widthOffset);
      } else {
        origin = new THREE.Vector3(trunk.offsetX + widthOffset, maxCeilingY + 0.5, lengthPos);
      }

      // Cast ray downward from above to find ceiling
      const downDist = raycastDist(raycaster, origin, DOWN, carMeshes, 2.0);
      let ceilingY = origin.y - downDist;

      // Clamp: ceiling must be between floor and max ceiling
      ceilingY = Math.max(floorY + 0.05, Math.min(ceilingY, maxCeilingY));

      // Also verify there IS something above (the car body) — if ray didn't hit, use max
      if (downDist >= 2.0) ceilingY = maxCeilingY;

      ceilingProfile.push({ widthOffset, ceilingY });
    }

    // Find wall positions at different heights
    const leftWall = [];
    const rightWall = [];
    for (let hi = 0; hi <= numHeightSamples; hi++) {
      const ht = hi / numHeightSamples;
      const y = floorY + ht * trunk.height;

      let originCenter;
      if (lengthAlongX) {
        originCenter = new THREE.Vector3(lengthPos, y, trunk.offsetZ);
      } else {
        originCenter = new THREE.Vector3(trunk.offsetX, y, lengthPos);
      }

      // Cast left
      const leftDist = raycastDist(raycaster, originCenter, LEFT, carMeshes, halfW + 0.3);
      const leftPos = Math.min(leftDist, halfW);

      // Cast right
      const rightDist = raycastDist(raycaster, originCenter, RIGHT, carMeshes, halfW + 0.3);
      const rightPos = Math.min(rightDist, halfW);

      leftWall.push({ y, dist: leftPos });
      rightWall.push({ y, dist: rightPos });
    }

    sliceData.push({ lengthPos, ceilingProfile, leftWall, rightWall });
  }

  // Build geometry: for each slice, create a rectangular-ish cross-section profile
  // Profile points go: bottom-left → bottom-right → up right wall → ceiling right-to-left → down left wall
  const numProfilePoints = 2 + numHeightSamples + numWidthSamples + numHeightSamples;
  const vertices = [];
  const indices = [];

  for (let si = 0; si <= numSlices; si++) {
    const sd = sliceData[si];
    const profile = [];

    // Bottom edge: left to right (flat floor)
    const floorLeft = -Math.min(sd.leftWall[0].dist, halfW);
    const floorRight = Math.min(sd.rightWall[0].dist, halfW);

    if (lengthAlongX) {
      // Floor left corner
      profile.push(new THREE.Vector3(sd.lengthPos, floorY, trunk.offsetZ + floorLeft));
      // Floor right corner
      profile.push(new THREE.Vector3(sd.lengthPos, floorY, trunk.offsetZ + floorRight));
    } else {
      profile.push(new THREE.Vector3(trunk.offsetX + floorLeft, floorY, sd.lengthPos));
      profile.push(new THREE.Vector3(trunk.offsetX + floorRight, floorY, sd.lengthPos));
    }

    // Right wall going up
    for (let hi = 1; hi <= numHeightSamples; hi++) {
      const rw = sd.rightWall[hi];
      const wallX = Math.min(rw.dist, halfW);
      if (lengthAlongX) {
        profile.push(new THREE.Vector3(sd.lengthPos, rw.y, trunk.offsetZ + wallX));
      } else {
        profile.push(new THREE.Vector3(trunk.offsetX + wallX, rw.y, sd.lengthPos));
      }
    }

    // Ceiling right to left
    for (let wi = numWidthSamples; wi >= 0; wi--) {
      const cp = sd.ceilingProfile[wi];
      if (lengthAlongX) {
        profile.push(new THREE.Vector3(sd.lengthPos, cp.ceilingY, trunk.offsetZ + cp.widthOffset));
      } else {
        profile.push(new THREE.Vector3(trunk.offsetX + cp.widthOffset, cp.ceilingY, sd.lengthPos));
      }
    }

    // Left wall going down
    for (let hi = numHeightSamples - 1; hi >= 1; hi--) {
      const lw = sd.leftWall[hi];
      const wallX = -Math.min(lw.dist, halfW);
      if (lengthAlongX) {
        profile.push(new THREE.Vector3(sd.lengthPos, lw.y, trunk.offsetZ + wallX));
      } else {
        profile.push(new THREE.Vector3(trunk.offsetX + wallX, lw.y, sd.lengthPos));
      }
    }

    // Add profile vertices
    for (const p of profile) {
      vertices.push(p.x, p.y, p.z);
    }
  }

  const ptsPerSlice = vertices.length / 3 / (numSlices + 1);

  // Connect adjacent slices with triangles
  for (let si = 0; si < numSlices; si++) {
    for (let pi = 0; pi < ptsPerSlice; pi++) {
      const nextPi = (pi + 1) % ptsPerSlice;
      const curr = si * ptsPerSlice + pi;
      const currNext = si * ptsPerSlice + nextPi;
      const next = (si + 1) * ptsPerSlice + pi;
      const nextNext = (si + 1) * ptsPerSlice + nextPi;

      indices.push(curr, next, currNext);
      indices.push(currNext, next, nextNext);
    }
  }

  // Cap front and back ends with fan triangulation
  for (const si of [0, numSlices]) {
    const baseIdx = si * ptsPerSlice;
    const centerIdx = vertices.length / 3;
    // Compute center of this slice
    let cx = 0, cy = 0, cz = 0;
    for (let pi = 0; pi < ptsPerSlice; pi++) {
      cx += vertices[(baseIdx + pi) * 3];
      cy += vertices[(baseIdx + pi) * 3 + 1];
      cz += vertices[(baseIdx + pi) * 3 + 2];
    }
    vertices.push(cx / ptsPerSlice, cy / ptsPerSlice, cz / ptsPerSlice);

    for (let pi = 0; pi < ptsPerSlice; pi++) {
      const nextPi = (pi + 1) % ptsPerSlice;
      if (si === 0) {
        indices.push(centerIdx, baseIdx + nextPi, baseIdx + pi);
      } else {
        indices.push(centerIdx, baseIdx + pi, baseIdx + nextPi);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function TrunkShape({ carScene, trunk }) {
  const geometry = useMemo(() => {
    if (!carScene || !trunk) return null;
    return computeTrunkGeometry(carScene, trunk);
  }, [carScene, trunk]);

  if (!geometry) return null;

  return (
    <group>
      {/* Wireframe outline */}
      <mesh geometry={geometry} renderOrder={10}>
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.8} />
      </mesh>
      {/* Semi-transparent fill */}
      <mesh geometry={geometry} renderOrder={9}>
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function BoxTrunk({ trunk }) {
  return (
    <group>
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]} renderOrder={10}>
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]} renderOrder={9}>
        <boxGeometry args={[trunk.width - 0.005, trunk.height - 0.005, trunk.length - 0.005]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[trunk.offsetX, trunk.offsetY + 0.005, trunk.offsetZ]} renderOrder={11}>
        <boxGeometry args={[trunk.width - 0.01, 0.01, trunk.length - 0.01]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function TransparentOverride({ scene, color, opacity }) {
  useEffect(() => {
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(1.5),
      transparent: true,
      opacity: Math.min(opacity * 6, 0.7),
    });
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color, transparent: true, opacity,
      roughness: 0.3, metalness: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMaterial;
        const toRemove = [];
        child.children.forEach((c) => { if (c.isLineSegments) toRemove.push(c); });
        toRemove.forEach((c) => { child.remove(c); c.geometry.dispose(); });
        const edges = new THREE.EdgesGeometry(child.geometry, 18);
        child.add(new THREE.LineSegments(edges, edgeMaterial));
      }
    });
    return () => {
      scene.traverse((child) => {
        if (child.isMesh) {
          const toRemove = [];
          child.children.forEach((c) => { if (c.isLineSegments) toRemove.push(c); });
          toRemove.forEach((c) => { child.remove(c); c.geometry.dispose(); });
        }
      });
    };
  }, [scene, color, opacity]);
  return null;
}
