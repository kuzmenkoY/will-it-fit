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
  const car = cars[selectedCarId];
  const trunk = rearSeatsDown ? car.rearFolded : car.trunk;

  const [fits, setFits] = useState(null);

  const getEffectiveDims = (w, h, d, rotation) => {
    const [rx, , rz] = rotation;
    if (Math.abs(rx - Math.PI / 2) < 0.1) return { ew: w, eh: d, ed: h };
    if (Math.abs(rz - Math.PI / 2) < 0.1) return { ew: h, eh: w, ed: d };
    return { ew: w, eh: h, ed: d };
  };

  useFrame(() => {
    if (!meshRef.current) return;

    const pos = obj.position;
    const { ew, eh, ed } = getEffectiveDims(obj.width, obj.height, obj.depth, obj.rotation);

    const objMinX = pos[0] - ew / 2;
    const objMaxX = pos[0] + ew / 2;
    const objMinY = pos[1] - eh / 2;
    const objMaxY = pos[1] + eh / 2;
    const objMinZ = pos[2] - ed / 2;
    const objMaxZ = pos[2] + ed / 2;

    const tMinX = trunk.offsetX - trunk.width / 2;
    const tMaxX = trunk.offsetX + trunk.width / 2;
    const tMinY = trunk.offsetY;
    const tMaxY = trunk.offsetY + trunk.height;
    const tMinZ = trunk.offsetZ - trunk.length / 2;
    const tMaxZ = trunk.offsetZ + trunk.length / 2;

    const isInside =
      objMinX >= tMinX - 0.01 &&
      objMaxX <= tMaxX + 0.01 &&
      objMinY >= tMinY - 0.01 &&
      objMaxY <= tMaxY + 0.01 &&
      objMinZ >= tMinZ - 0.01 &&
      objMaxZ <= tMaxZ + 0.01;

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
