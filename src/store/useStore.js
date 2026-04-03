import { create } from 'zustand';
import { cars, defaultCar } from '../data/cars';
import { objects } from '../data/objects';

const useStore = create((set, get) => ({
  // Car state
  selectedCarId: defaultCar,
  rearSeatsDown: false,
  trunkOpen: false,
  carOpacity: 0.1, // 0 = invisible, 1 = solid

  // Placed objects in the scene
  placedObjects: [],

  // Currently selected object template to add
  selectedObjectId: null,

  // Index of currently selected placed object (for movement)
  selectedPlacedIndex: -1,

  // Fit status
  fitResults: {},

  get selectedCar() {
    return cars[get().selectedCarId];
  },

  setSelectedCar: (carId) => set({ selectedCarId: carId, fitResults: {} }),
  setSelectedPlacedIndex: (i) => set({ selectedPlacedIndex: i }),
  cycleSelectedObject: () => set((s) => {
    if (s.placedObjects.length === 0) return {};
    const next = (s.selectedPlacedIndex + 1) % s.placedObjects.length;
    return { selectedPlacedIndex: next };
  }),
  toggleRearSeats: () => set((s) => ({ rearSeatsDown: !s.rearSeatsDown })),
  toggleTrunkOpen: () => set((s) => ({ trunkOpen: !s.trunkOpen })),
  setCarOpacity: (v) => set({ carOpacity: v }),

  // Per-car trunk offset overrides (persisted in localStorage)
  trunkOverrides: JSON.parse(localStorage.getItem('trunkOverrides') || '{}'),
  setTrunkOverride: (carId, field, value) => set((s) => {
    const overrides = { ...s.trunkOverrides };
    if (!overrides[carId]) overrides[carId] = {};
    overrides[carId][field] = value;
    localStorage.setItem('trunkOverrides', JSON.stringify(overrides));
    return { trunkOverrides: overrides };
  }),
  resetTrunkOverride: (carId) => set((s) => {
    const overrides = { ...s.trunkOverrides };
    delete overrides[carId];
    localStorage.setItem('trunkOverrides', JSON.stringify(overrides));
    return { trunkOverrides: overrides };
  }),
  exportTrunkOverrides: () => {
    const overrides = useStore.getState().trunkOverrides;
    console.log('=== TRUNK OVERRIDES (paste into cars.js) ===');
    console.log(JSON.stringify(overrides, null, 2));
    return overrides;
  },

  setSelectedObject: (objectId) => set({ selectedObjectId: objectId }),

  addObject: (objectId, customDims) => {
    const template = objects.find((o) => o.id === objectId);
    if (!template) return;

    const dims = objectId === 'custom' && customDims ? customDims : template;
    const state = get();
    const car = cars[state.selectedCarId];
    const trunk = state.rearSeatsDown ? car.rearFolded : car.trunk;

    set((s) => ({
      placedObjects: [
        ...s.placedObjects,
        {
          instanceId: `${objectId}-${Date.now()}`,
          templateId: objectId,
          name: template.name,
          width: dims.width,
          height: dims.height,
          depth: dims.depth,
          color: template.color,
          position: [trunk.offsetX, trunk.offsetY + trunk.height / 2, trunk.offsetZ],
          rotation: [0, 0, 0],
        },
      ],
      selectedPlacedIndex: s.placedObjects.length, // select the new one
    }));
  },

  updateObjectPosition: (instanceId, position) => {
    set((s) => ({
      placedObjects: s.placedObjects.map((o) =>
        o.instanceId === instanceId ? { ...o, position } : o
      ),
    }));
  },

  rotateObject: (instanceId) => {
    set((s) => ({
      placedObjects: s.placedObjects.map((o) => {
        if (o.instanceId !== instanceId) return o;
        // Cycle through rotations: upright -> on side -> on back
        const [rx, ry, rz] = o.rotation;
        let newRotation;
        if (rx === 0 && rz === 0) {
          newRotation = [Math.PI / 2, ry, 0]; // lay on back
        } else if (Math.abs(rx - Math.PI / 2) < 0.01) {
          newRotation = [0, ry, Math.PI / 2]; // lay on side
        } else {
          newRotation = [0, ry, 0]; // upright
        }
        return { ...o, rotation: newRotation };
      }),
    }));
  },

  removeObject: (instanceId) => {
    set((s) => ({
      placedObjects: s.placedObjects.filter((o) => o.instanceId !== instanceId),
    }));
  },

  clearObjects: () => set({ placedObjects: [] }),

  setFitResult: (instanceId, fits) => {
    set((s) => ({
      fitResults: { ...s.fitResults, [instanceId]: fits },
    }));
  },
}));

// Helper to get trunk with overrides applied
export function getTrunkWithOverrides(car, carId, rearSeatsDown, overrides) {
  const baseTrunk = rearSeatsDown ? car.rearFolded : car.trunk;
  const ov = overrides[carId];
  if (!ov) return baseTrunk;
  return {
    ...baseTrunk,
    offsetX: ov.offsetX ?? baseTrunk.offsetX,
    offsetY: ov.offsetY ?? baseTrunk.offsetY,
    offsetZ: ov.offsetZ ?? baseTrunk.offsetZ,
  };
}

export default useStore;
