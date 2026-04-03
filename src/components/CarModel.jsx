import { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { cars } from '../data/cars';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

// Car type -> trunk position rules (proportion of car dimensions)
const TRUNK_RULES = {
  sedan:       { zStart: 0.62, zEnd: 0.92, yStart: 0.18, yEnd: 0.50 },
  hatchback:   { zStart: 0.58, zEnd: 0.90, yStart: 0.18, yEnd: 0.55 },
  suv:         { zStart: 0.58, zEnd: 0.90, yStart: 0.22, yEnd: 0.58 },
  sports_rear: { zStart: 0.65, zEnd: 0.95, yStart: 0.18, yEnd: 0.48 },
  mid_engine:  { zStart: 0.05, zEnd: 0.30, yStart: 0.18, yEnd: 0.45 },  // frunk
  truck:       { zStart: 0.50, zEnd: 0.88, yStart: 0.32, yEnd: 0.55 },
  coupe:       { zStart: 0.63, zEnd: 0.93, yStart: 0.18, yEnd: 0.48 },
};

// Classify each car
const CAR_TYPE_MAP = {
  'toyota-supra-mk4': 'sports_rear', 'toyota-supra-mk5': 'sports_rear',
  'toyota-land-cruiser-300': 'suv',
  'bmw-3-series-2018': 'sedan', 'bmw-m3-sedan': 'sedan',
  'bmw-m4-2021': 'coupe', 'bmw-m8-2020': 'coupe',
  'bmw-i8-2015': 'mid_engine', 'bmw-x6m': 'suv',
  'vw-golf-ii': 'hatchback',
  'tesla-roadster-2020': 'mid_engine', 'tesla-cybertruck': 'truck',
  'audi-r8': 'mid_engine', 'audi-rs7-2014': 'sedan',
  'mercedes-amg-gt': 'sports_rear',
  'porsche-cayman-s-2014': 'mid_engine', 'porsche-panamera-2021': 'sedan',
  'porsche-taycan-turbo-s': 'sedan',
  'ferrari-488-gtb': 'mid_engine', 'ferrari-599': 'sports_rear',
  'ferrari-f8-tributo': 'mid_engine',
  'lamborghini-aventador-svj': 'mid_engine', 'lamborghini-huracan-gt': 'mid_engine',
  'honda-civic-type-r-2024': 'hatchback', 'honda-nsx-1990': 'mid_engine',
  'ford-mustang-gt-1968': 'coupe', 'ford-f150-raptor-2018': 'truck',
  'ford-gt40': 'mid_engine',
  'dodge-challenger-rt': 'coupe', 'dodge-challenger-hellcat': 'coupe',
  'chevrolet-camaro-ss-2016': 'coupe', 'chevrolet-corvette-c8': 'mid_engine',
  'hyundai-sonata-2009': 'sedan', 'hyundai-tucson-2015': 'suv',
  'hyundai-elantra-n-2022': 'sedan', 'hyundai-veloster-n': 'hatchback',
  'hyundai-creta-2016': 'suv', 'subaru-impreza-wrx': 'sedan',
  'mazda-rx7': 'sports_rear', 'bugatti-bolide-2024': 'mid_engine',
  'aston-martin-vantage': 'sports_rear', 'mclaren-720s': 'mid_engine',
  'maserati-granturismo': 'sports_rear', 'nissan-370z': 'sports_rear',
  'nissan-gtr-r35': 'sports_rear',
};

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

  // Scale scene and compute auto trunk position from the model's actual bounding box
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
    const scaledMax = scaledBox.max;

    // Center on X/Z, sit on ground (Y=0)
    scene.position.set(-scaledCenter.x, -scaledMin.y, -scaledCenter.z);

    // Now compute the actual car bounds after positioning
    const finalBox = new THREE.Box3().setFromObject(scene);
    const carMin = finalBox.min; // rear-bottom-left of car
    const carMax = finalBox.max; // front-top-right of car
    const carSize = new THREE.Vector3();
    finalBox.getSize(carSize);

    // Get trunk rules for this car type
    const carType = CAR_TYPE_MAP[selectedCarId] || 'sedan';
    const rule = TRUNK_RULES[carType];

    // Compute trunk position from the model's actual bounding box
    // Z axis: 0 = rear of car, 1 = front of car (negative Z = rear in Three.js)
    const rearZ = carMin.z;
    const frontZ = carMax.z;
    const zRange = frontZ - rearZ;

    // For rear-trunk cars, zStart/zEnd are measured from the rear
    // For mid-engine/frunk cars, zStart/zEnd are measured from the front
    let trunkMinZ, trunkMaxZ;
    if (rule.zStart < 0.5) {
      // Frunk: measured from front
      trunkMinZ = frontZ - rule.zEnd * zRange;
      trunkMaxZ = frontZ - rule.zStart * zRange;
    } else {
      // Rear trunk: measured from rear
      trunkMinZ = rearZ + (1 - rule.zEnd) * zRange;
      trunkMaxZ = rearZ + (1 - rule.zStart) * zRange;
    }

    const trunkMinY = carSize.y * rule.yStart;
    const trunkMaxY = carSize.y * rule.yEnd;

    // Use actual trunk dimensions from car data, but AUTO position
    const autoTrunkPos = {
      width: trunkDims.width,
      height: trunkDims.height,
      length: trunkDims.length,
      offsetX: 0,
      offsetY: (trunkMinY + trunkMaxY) / 2 - trunkDims.height / 2,
      offsetZ: (trunkMinZ + trunkMaxZ) / 2,
    };

    return { scaledScene: scene, autoTrunk: autoTrunkPos };
  }, [gltf, car, selectedCarId, trunkDims]);

  // Store the computed trunk for other components (fit detection etc)
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
      {/* Bright wireframe - always on top */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}
        renderOrder={10}
      >
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>

      {/* Green fill */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}
        renderOrder={9}
      >
        <boxGeometry args={[trunk.width - 0.005, trunk.height - 0.005, trunk.length - 0.005]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + 0.005, trunk.offsetZ]}
        renderOrder={11}
      >
        <boxGeometry args={[trunk.width - 0.01, 0.01, trunk.length - 0.01]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>

      {/* Corner posts */}
      {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[
            trunk.offsetX + sx * (trunk.width / 2),
            trunk.offsetY + trunk.height / 2,
            trunk.offsetZ + sz * (trunk.length / 2),
          ]}
          renderOrder={12}
        >
          <boxGeometry args={[0.01, trunk.height, 0.01]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>
      ))}
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
        child.children.forEach((c) => {
          if (c.isLineSegments) toRemove.push(c);
        });
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
          child.children.forEach((c) => {
            if (c.isLineSegments) toRemove.push(c);
          });
          toRemove.forEach((c) => { child.remove(c); c.geometry.dispose(); });
        }
      });
    };
  }, [scene, color, opacity]);

  return null;
}
