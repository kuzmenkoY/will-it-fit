import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { cars } from '../data/cars';

export default function DraggableObject({ obj, isSelected }) {
  const meshRef = useRef();
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const setFitResult = useStore((s) => s.setFitResult);
  const computedTrunk = useStore((s) => s.computedTrunk);
  const car = cars[selectedCarId];
  const trunk = computedTrunk || (rearSeatsDown ? car.rearFolded : car.trunk);

  const [fits, setFits] = useState(null);

  // Use Three.js bounding box for proper rotated-object fit detection
  useFrame(() => {
    if (!meshRef.current) return;

    // Get the world-space AABB of the rotated mesh
    const objBox = new THREE.Box3().setFromObject(meshRef.current);

    // Trunk bounding box
    const tMinX = trunk.offsetX - trunk.width / 2;
    const tMaxX = trunk.offsetX + trunk.width / 2;
    const tMinY = trunk.offsetY;
    const tMaxY = trunk.offsetY + trunk.height;
    const tMinZ = trunk.offsetZ - trunk.length / 2;
    const tMaxZ = trunk.offsetZ + trunk.length / 2;

    const tolerance = 0.02; // 2cm tolerance
    const isInside =
      objBox.min.x >= tMinX - tolerance &&
      objBox.max.x <= tMaxX + tolerance &&
      objBox.min.y >= tMinY - tolerance &&
      objBox.max.y <= tMaxY + tolerance &&
      objBox.min.z >= tMinZ - tolerance &&
      objBox.max.z <= tMaxZ + tolerance;

    if (fits !== isInside) {
      setFits(isInside);
      setFitResult(obj.instanceId, isInside);
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: obj.color,
      transparent: true,
      opacity: 0.92,
      roughness: 0.3,
      metalness: 0.1,
    });
  }, [obj.color]);

  useEffect(() => {
    if (fits === true) {
      material.emissive = new THREE.Color('#00ff00');
      material.emissiveIntensity = 0.25;
    } else if (fits === false) {
      material.emissive = new THREE.Color('#ff0000');
      material.emissiveIntensity = 0.4;
    } else {
      material.emissiveIntensity = 0;
    }
  }, [fits, material]);

  const { ew, eh, ed } = getEffectiveDims(obj.width, obj.height, obj.depth, obj.rotation);

  return (
    <group>
      {/* Solid object */}
      <mesh
        ref={meshRef}
        position={obj.position}
        rotation={obj.rotation}
        material={material}
      >
        <boxGeometry args={[obj.width, obj.height, obj.depth]} />
      </mesh>

      {/* Bright wireframe outline for visibility */}
      <mesh position={obj.position} rotation={obj.rotation}>
        <boxGeometry args={[obj.width + 0.005, obj.height + 0.005, obj.depth + 0.005]} />
        <meshBasicMaterial
          color={fits === true ? '#00ff88' : fits === false ? '#ff4444' : '#ffffff'}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={obj.position} rotation={obj.rotation}>
          <boxGeometry args={[obj.width + 0.02, obj.height + 0.02, obj.depth + 0.02]} />
          <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label above object */}
      <Html
        position={[obj.position[0], obj.position[1] + eh / 2 + 0.1, obj.position[2]]}
        center
      >
        <div style={{
          background: fits === true ? 'rgba(0,255,136,0.2)' : fits === false ? 'rgba(255,68,68,0.2)' : 'rgba(100,100,100,0.3)',
          border: `1px solid ${fits === true ? '#00ff88' : fits === false ? '#ff4444' : '#888'}`,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          whiteSpace: 'nowrap',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          {obj.name} {fits === true ? 'OK' : fits === false ? 'NO FIT' : ''}
        </div>
      </Html>
    </group>
  );
}
