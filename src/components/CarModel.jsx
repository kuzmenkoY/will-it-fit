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
  const car = cars[selectedCarId];
  const trunk = rearSeatsDown ? car.rearFolded : car.trunk;

  const gltf = useLoader(GLTFLoader, car.modelPath, (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  const scaledScene = useMemo(() => {
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

    scene.position.set(-scaledCenter.x, -scaledMin.y, -scaledCenter.z);
    return scene;
  }, [gltf, car]);

  const hasTrunkModel = !!(rearSeatsDown ? car.trunkFoldedModelPath : car.trunkModelPath);

  return (
    <group ref={groupRef}>
      <primitive object={scaledScene} />
      <TransparentOverride scene={scaledScene} color={car.color} />

      {/* Parametric trunk model if available, otherwise simple wireframe box */}
      {hasTrunkModel ? (
        <Suspense fallback={<BoxTrunk trunk={trunk} />}>
          <ParametricTrunk car={car} rearSeatsDown={rearSeatsDown} trunk={trunk} />
        </Suspense>
      ) : (
        <BoxTrunk trunk={trunk} />
      )}
    </group>
  );
}

// Parametric trunk loaded from Build123D GLB
function ParametricTrunk({ car, rearSeatsDown, trunk }) {
  const trunkPath = rearSeatsDown ? car.trunkFoldedModelPath : car.trunkModelPath;
  const trunkGltf = useLoader(GLTFLoader, trunkPath);

  const scaledTrunk = useMemo(() => {
    const scene = trunkGltf.scene.clone(true);
    scene.scale.setScalar(0.001); // mm to meters
    scene.position.set(trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ);
    return scene;
  }, [trunkGltf, trunk]);

  return (
    <group>
      <primitive object={scaledTrunk} />
      <TrunkOverride scene={scaledTrunk} />
    </group>
  );
}

// Simple wireframe box trunk (fallback)
function BoxTrunk({ trunk }) {
  return (
    <group>
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}>
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.8} />
      </mesh>
      <mesh position={[trunk.offsetX, trunk.offsetY + 0.005, trunk.offsetZ]}>
        <boxGeometry args={[trunk.width - 0.01, 0.01, trunk.length - 0.01]} />
        <meshStandardMaterial color="#00ff88" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function TransparentOverride({ scene, color }) {
  useEffect(() => {
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(1.5),
      transparent: true,
      opacity: 0.6,
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.1,
      roughness: 0.3,
      metalness: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMaterial;
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
          toRemove.forEach((c) => {
            child.remove(c);
            c.geometry.dispose();
          });
        }
      });
    };
  }, [scene, color]);

  return null;
}

function TrunkOverride({ scene }) {
  useEffect(() => {
    const trunkEdgeMaterial = new THREE.LineBasicMaterial({
      color: '#00ff88',
      transparent: true,
      opacity: 0.9,
    });

    const trunkFillMaterial = new THREE.MeshStandardMaterial({
      color: '#00ff88',
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = trunkFillMaterial;
        const edges = new THREE.EdgesGeometry(child.geometry, 15);
        const line = new THREE.LineSegments(edges, trunkEdgeMaterial);
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
          toRemove.forEach((c) => {
            child.remove(c);
            c.geometry.dispose();
          });
        }
      });
    };
  }, [scene]);

  return null;
}
