import { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { cars } from '../data/cars';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

// Is this car a frunk (front trunk) car?
const FRUNK_CARS = new Set([
  'bmw-i8-2015', 'tesla-roadster-2020', 'audi-r8',
  'porsche-cayman-s-2014', 'ferrari-488-gtb', 'ferrari-f8-tributo',
  'lamborghini-aventador-svj', 'lamborghini-huracan-gt', 'honda-nsx-1990',
  'ford-gt40', 'chevrolet-corvette-c8', 'bugatti-bolide-2024', 'mclaren-720s',
]);

const TRUCK_CARS = new Set(['ford-f150-raptor-2018', 'tesla-cybertruck']);

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

  const { scaledScene, autoTrunk } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    const longestAxis = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const scaleFactor = car.exterior.length / longestAxis;
    scene.scale.setScalar(scaleFactor);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    const scaledMin = scaledBox.min;

    // Center on X/Z, Y=0 at ground
    scene.position.set(-scaledCenter.x, -scaledMin.y, -scaledCenter.z);

    // Get final bounds after centering
    const finalBox = new THREE.Box3().setFromObject(scene);
    const carMin = finalBox.min;
    const carMax = finalBox.max;
    const carHeight = carMax.y - carMin.y;
    const carLength = carMax.z - carMin.z;

    // Simple trunk positioning:
    // After centering, car goes from carMin.z (one end) to carMax.z (other end)
    // Most negative Z = rear, most positive Z = front (for most models)
    // But some models face the other way - we don't know!
    // Solution: use the KNOWN trunk dimensions and just place at the correct end

    let trunkCenterZ, trunkFloorY;
    const isFrunk = FRUNK_CARS.has(selectedCarId);
    const isTruck = TRUCK_CARS.has(selectedCarId);

    if (isFrunk) {
      // Front trunk: near positive Z end
      trunkCenterZ = carMax.z - trunkDims.length / 2 - carLength * 0.05;
    } else {
      // Rear trunk: near negative Z end
      trunkCenterZ = carMin.z + trunkDims.length / 2 + carLength * 0.05;
    }

    if (isTruck) {
      trunkFloorY = carHeight * 0.38;
    } else {
      // Trunk floor is typically at ~20-25% of car height
      trunkFloorY = carHeight * 0.22;
    }

    const autoTrunkPos = {
      width: trunkDims.width,
      height: trunkDims.height,
      length: trunkDims.length,
      offsetX: 0,
      offsetY: trunkFloorY,
      offsetZ: trunkCenterZ,
    };

    return { scaledScene: scene, autoTrunk: autoTrunkPos };
  }, [gltf, car, selectedCarId, trunkDims]);

  // Share computed trunk with other components
  const setComputedTrunk = useStore((s) => s.setComputedTrunk);
  useEffect(() => {
    setComputedTrunk(autoTrunk);
  }, [autoTrunk, setComputedTrunk]);

  return (
    <group ref={groupRef}>
      <primitive object={scaledScene} />
      <TransparentOverride scene={scaledScene} color={car.color} opacity={carOpacity} />
      <BoxTrunk trunk={autoTrunk} />
    </group>
  );
}

function BoxTrunk({ trunk }) {
  return (
    <group>
      {/* Wireframe */}
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]} renderOrder={10}>
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      {/* Fill */}
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]} renderOrder={9}>
        <boxGeometry args={[trunk.width - 0.005, trunk.height - 0.005, trunk.length - 0.005]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Floor */}
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
      color: color,
      transparent: true,
      opacity: opacity,
      roughness: 0.3,
      metalness: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMaterial;
        const toRemove = [];
        child.children.forEach((c) => { if (c.isLineSegments) toRemove.push(c); });
        toRemove.forEach((c) => { child.remove(c); c.geometry.dispose(); });
        const edges = new THREE.EdgesGeometry(child.geometry, 18);
        const line = new THREE.LineSegments(edges, edgeMaterial);
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
  }, [scene, color, opacity]);

  return null;
}
