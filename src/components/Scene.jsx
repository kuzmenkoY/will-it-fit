import { Suspense, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Html } from '@react-three/drei';
import CarModel from './CarModel';
import DraggableObject from './DraggableObject';
import ObjectMover from './ObjectMover';
import useStore from '../store/useStore';
import { cars } from '../data/cars';

function ScaleReference() {
  return (
    <group position={[3.5, 0.5, 0]}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#666" wireframe />
      </mesh>
      <Html position={[0, 0.7, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          whiteSpace: 'nowrap',
        }}>
          1m cube
        </div>
      </Html>
    </group>
  );
}

function TrunkLabel() {
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const car = cars[selectedCarId];
  const trunk = rearSeatsDown ? car.rearFolded : car.trunk;

  return (
    <Html
      position={[trunk.offsetX, trunk.offsetY + trunk.height + 0.15, trunk.offsetZ]}
      center
    >
      <div style={{
        background: 'rgba(0,255,136,0.15)',
        border: '1px solid #00ff88',
        color: '#00ff88',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        whiteSpace: 'nowrap',
        fontFamily: 'monospace',
      }}>
        {rearSeatsDown ? 'Cargo (seats down)' : 'Trunk'}: {(trunk.width * 100).toFixed(0)} x {(trunk.length * 100).toFixed(0)} x {(trunk.height * 100).toFixed(0)} cm
      </div>
    </Html>
  );
}

// Camera controller that responds to external commands
function CameraController({ controlsRef }) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      maxPolarAngle={Math.PI / 2.05}
      minDistance={1.5}
      maxDistance={14}
      enableDamping
      dampingFactor={0.1}
    />
  );
}

export default function Scene() {
  const placedObjects = useStore((s) => s.placedObjects);
  const selectedPlacedIndex = useStore((s) => s.selectedPlacedIndex);
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const car = cars[selectedCarId];
  const trunk = rearSeatsDown ? car.rearFolded : car.trunk;
  const controlsRef = useRef();
  const cameraRef = useRef();

  const setCameraView = useCallback((view) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;

    // Target the trunk area
    const target = { x: trunk.offsetX, y: trunk.offsetY + trunk.height / 2, z: trunk.offsetZ };

    switch (view) {
      case 'rear':
        camera.position.set(0, 1.5, trunk.offsetZ - 3);
        controls.target.set(target.x, target.y, target.z);
        break;
      case 'top':
        camera.position.set(0, 4, trunk.offsetZ);
        controls.target.set(target.x, 0, target.z);
        break;
      case 'side':
        camera.position.set(3, 1.2, trunk.offsetZ);
        controls.target.set(target.x, target.y, target.z);
        break;
      case 'overview':
        camera.position.set(4, 3, 4);
        controls.target.set(0, 0.5, 0);
        break;
      default:
        break;
    }
    controls.update();
  }, [trunk]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Camera view buttons */}
      <div style={viewBtnStyles.container}>
        <button style={viewBtnStyles.btn} onClick={() => setCameraView('overview')}>Overview</button>
        <button style={{ ...viewBtnStyles.btn, ...viewBtnStyles.highlight }} onClick={() => setCameraView('rear')}>Rear / Trunk</button>
        <button style={viewBtnStyles.btn} onClick={() => setCameraView('top')}>Top Down</button>
        <button style={viewBtnStyles.btn} onClick={() => setCameraView('side')}>Side</button>
      </div>

      <Canvas
        camera={{ position: [4, 3, 4], fov: 50 }}
        style={{ background: '#1a1a2e' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-3, 5, -3]} intensity={0.4} />
        <pointLight position={[0, 2, trunk.offsetZ]} intensity={0.5} color="#ffffff" />

        <CameraController controlsRef={controlsRef} />

        <Suspense fallback={
          <Html center>
            <div style={{ color: '#888', fontSize: 18 }}>Loading 3D model...</div>
          </Html>
        }>
          <CarModel />
          <TrunkLabel />
        </Suspense>

        <ScaleReference />

        {placedObjects.map((obj, i) => (
          <DraggableObject
            key={obj.instanceId}
            obj={obj}
            isSelected={i === selectedPlacedIndex}
          />
        ))}

        <ObjectMover />

        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#404060"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#606090"
          fadeDistance={15}
          infiniteGrid
        />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

const viewBtnStyles = {
  container: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
    display: 'flex',
    gap: 6,
  },
  btn: {
    padding: '6px 14px',
    background: 'rgba(30,30,50,0.85)',
    border: '1px solid #444',
    borderRadius: 6,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    backdropFilter: 'blur(8px)',
  },
  highlight: {
    background: 'rgba(0,255,136,0.15)',
    borderColor: '#00ff88',
    color: '#00ff88',
  },
};
