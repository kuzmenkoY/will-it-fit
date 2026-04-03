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
  const trunkOpen = useStore((s) => s.trunkOpen);
  const carOpacity = useStore((s) => s.carOpacity);
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
      <TransparentOverride
        scene={scaledScene}
        color={car.color}
        opacity={carOpacity}
        trunkOpen={trunkOpen}
        trunkZ={trunk.offsetZ}
        carLength={car.exterior.length}
      />

      {/* Trunk cargo area */}
      {hasTrunkModel ? (
        <Suspense fallback={<BoxTrunk trunk={trunk} />}>
          <ParametricTrunk car={car} rearSeatsDown={rearSeatsDown} trunk={trunk} />
        </Suspense>
      ) : (
        <BoxTrunk trunk={trunk} />
      )}

      {/* Trunk opening indicator when open */}
      {trunkOpen && (
        <TrunkOpenIndicator trunk={trunk} />
      )}
    </group>
  );
}

// Visual indicator that trunk is "open" - an arc showing the lid
function TrunkOpenIndicator({ trunk }) {
  const points = useMemo(() => {
    const pts = [];
    // Draw an arc from trunk top edge going up and back
    const startY = trunk.offsetY + trunk.height;
    const startZ = trunk.offsetZ - trunk.length / 2;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const angle = t * Math.PI * 0.45; // 80 degree arc
      pts.push(new THREE.Vector3(
        0,
        startY + Math.sin(angle) * trunk.length * 0.8,
        startZ - Math.cos(angle) * trunk.length * 0.3 + trunk.length * 0.3
      ));
    }
    return pts;
  }, [trunk]);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(points.flatMap(p => [p.x - trunk.width / 2, p.y, p.z]))}
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff88" transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(points.flatMap(p => [p.x + trunk.width / 2, p.y, p.z]))}
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff88" transparent opacity={0.5} />
      </line>
    </group>
  );
}

function ParametricTrunk({ car, rearSeatsDown, trunk }) {
  const trunkPath = rearSeatsDown ? car.trunkFoldedModelPath : car.trunkModelPath;
  const trunkGltf = useLoader(GLTFLoader, trunkPath);

  const scaledTrunk = useMemo(() => {
    const scene = trunkGltf.scene.clone(true);
    scene.scale.setScalar(0.001);
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

function BoxTrunk({ trunk }) {
  return (
    <group>
      {/* Wireframe outline */}
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}>
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.9} />
      </mesh>
      {/* Semi-transparent fill */}
      <mesh position={[trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ]}>
        <boxGeometry args={[trunk.width, trunk.height, trunk.length]} />
        <meshStandardMaterial color="#00ff88" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Floor */}
      <mesh position={[trunk.offsetX, trunk.offsetY + 0.005, trunk.offsetZ]}>
        <boxGeometry args={[trunk.width - 0.01, 0.01, trunk.length - 0.01]} />
        <meshStandardMaterial color="#00ff88" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function TransparentOverride({ scene, color, opacity, trunkOpen, trunkZ, carLength }) {
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

    // When trunk is open, use clipping plane to cut away the rear
    const clippingPlane = trunkOpen
      ? new THREE.Plane(new THREE.Vector3(0, 0, 1), -trunkZ + 0.1)
      : null;

    if (clippingPlane) {
      bodyMaterial.clippingPlanes = [clippingPlane];
      bodyMaterial.clipShadows = true;
    } else {
      bodyMaterial.clippingPlanes = [];
    }

    const edgeMaterialClipped = trunkOpen
      ? new THREE.LineBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(1.5),
          transparent: true,
          opacity: Math.min(opacity * 6, 0.7),
          clippingPlanes: [clippingPlane],
        })
      : edgeMaterial;

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
        const line = new THREE.LineSegments(edges, edgeMaterialClipped);
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
  }, [scene, color, opacity, trunkOpen, trunkZ, carLength]);

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
