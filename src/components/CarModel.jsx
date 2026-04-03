import { useEffect, useRef, useMemo, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import useStore, { getTrunkWithOverrides } from '../store/useStore';
import { cars } from '../data/cars';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

export default function CarModel() {
  const groupRef = useRef();
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const carOpacity = useStore((s) => s.carOpacity);
  const trunkOverrides = useStore((s) => s.trunkOverrides);
  const car = cars[selectedCarId];
  const trunk = getTrunkWithOverrides(car, selectedCarId, rearSeatsDown, trunkOverrides);

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

  return (
    <group ref={groupRef}>
      {/* Car body - rendered first so trunk renders on top */}
      <primitive object={scaledScene} />
      <TransparentOverride scene={scaledScene} color={car.color} opacity={carOpacity} />

      {/* Trunk cargo area - always use the simple visible box */}
      <BoxTrunk trunk={trunk} />
    </group>
  );
}

// Bright, clearly visible trunk box
function BoxTrunk({ trunk }) {
  return (
    <group>
      {/* Bright wireframe outline - always visible */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}
        renderOrder={10}
      >
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>

      {/* Visible green fill */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}
        renderOrder={9}
      >
        <boxGeometry args={[trunk.width - 0.005, trunk.height - 0.005, trunk.length - 0.005]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bright floor */}
      <mesh
        position={[trunk.offsetX, trunk.offsetY + 0.005, trunk.offsetZ]}
        renderOrder={11}
      >
        <boxGeometry args={[trunk.width - 0.01, 0.01, trunk.length - 0.01]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>

      {/* Corner posts for depth perception */}
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

        // Remove old edge lines
        const toRemove = [];
        child.children.forEach((c) => {
          if (c.isLineSegments) toRemove.push(c);
        });
        toRemove.forEach((c) => {
          child.remove(c);
          c.geometry.dispose();
        });

        // Add new edge lines
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
  }, [scene, color, opacity]);

  return null;
}
