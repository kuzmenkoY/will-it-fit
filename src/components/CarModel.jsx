import { useEffect, useRef, useMemo, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { cars } from '../data/cars';

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

  // Load Blender-extracted trunk if available
  const trunkPath = car.accurateTrunkPath || null;
  const trunkGltf = trunkPath ? useLoader(GLTFLoader, trunkPath) : null;

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

    // Compute auto trunk from bounding box (fallback when no accurate trunk)
    const finalBox = new THREE.Box3().setFromObject(scene);
    const carMin = finalBox.min;
    const carMax = finalBox.max;
    const carHeight = carMax.y - carMin.y;
    const carLengthZ = carMax.z - carMin.z;

    // Place trunk at the nearest end of the car (5% inset from edge)
    const isFrunk = (car.trunk.offsetZ || 0) > 0;
    const trunkCenterZ = isFrunk
      ? carMax.z - trunkDims.length / 2 - carLengthZ * 0.05
      : carMin.z + trunkDims.length / 2 + carLengthZ * 0.05;
    const trunkFloorY = carHeight * 0.22;

    const at = {
      width: trunkDims.width,
      height: trunkDims.height,
      length: trunkDims.length,
      offsetX: 0,
      offsetY: trunkFloorY,
      offsetZ: trunkCenterZ,
    };

    return { scaledScene: scene, scaleFactor: sf, sceneOffset: offset, autoTrunk: at };
  }, [gltf, car, trunkDims]);

  // If we have a Blender-extracted trunk, apply the SAME transform as the car
  const scaledTrunkScene = useMemo(() => {
    if (!trunkGltf) return null;
    const scene = trunkGltf.scene.clone(true);
    scene.scale.setScalar(scaleFactor);
    scene.position.copy(sceneOffset);
    return scene;
  }, [trunkGltf, scaleFactor, sceneOffset]);

  // Share computed trunk with other components
  const setComputedTrunk = useStore((s) => s.setComputedTrunk);
  useEffect(() => {
    if (scaledTrunkScene) {
      // Get trunk bounds from the actual Blender-extracted mesh
      const trunkBox = new THREE.Box3().setFromObject(scaledTrunkScene);
      const trunkSize = new THREE.Vector3();
      trunkBox.getSize(trunkSize);
      const trunkCenter = new THREE.Vector3();
      trunkBox.getCenter(trunkCenter);

      setComputedTrunk({
        width: trunkSize.x,
        height: trunkSize.y,
        length: trunkSize.z,
        offsetX: trunkCenter.x,
        offsetY: trunkBox.min.y,
        offsetZ: trunkCenter.z,
      });
    } else {
      setComputedTrunk(autoTrunk);
    }
  }, [scaledTrunkScene, autoTrunk, setComputedTrunk]);

  return (
    <group ref={groupRef}>
      <primitive object={scaledScene} />
      <TransparentOverride scene={scaledScene} color={car.color} opacity={carOpacity} />

      {scaledTrunkScene ? (
        <group>
          <primitive object={scaledTrunkScene} />
          <TrunkMeshOverride scene={scaledTrunkScene} />
        </group>
      ) : (
        <BoxTrunk trunk={autoTrunk} />
      )}
    </group>
  );
}

// Green wireframe for Blender-extracted trunk mesh
function TrunkMeshOverride({ scene }) {
  useEffect(() => {
    const edgeMat = new THREE.LineBasicMaterial({ color: '#00ff88', linewidth: 2 });
    const fillMat = new THREE.MeshBasicMaterial({
      color: '#00ff88', transparent: true, opacity: 0.15, side: THREE.DoubleSide
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = fillMat;
        const edges = new THREE.EdgesGeometry(child.geometry, 15);
        const line = new THREE.LineSegments(edges, edgeMat);
        child.add(line);
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
  }, [scene]);
  return null;
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
