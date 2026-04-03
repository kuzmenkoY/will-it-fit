import { create } from 'zustand';
import { cars, defaultCar } from '../data/cars';
import { objects } from '../data/objects';

const useStore = create((set, get) => ({
  // Car state
  selectedCarId: defaultCar,
  rearSeatsDown: false,
  carOpacity: 0.1,

  // Computed trunk position (set by CarModel after loading the 3D model)
  computedTrunk: null,

  // Placed objects in the scene
  placedObjects: [],
  selectedObjectId: null,
  selectedPlacedIndex: -1,
  fitResults: {},

  get selectedCar() {
    return cars[get().selectedCarId];
  },

  setSelectedCar: (carId) => set({ selectedCarId: carId, fitResults: {}, computedTrunk: null }),
  setSelectedPlacedIndex: (i) => set({ selectedPlacedIndex: i }),
  cycleSelectedObject: () => set((s) => {
    if (s.placedObjects.length === 0) return {};
    const next = (s.selectedPlacedIndex + 1) % s.placedObjects.length;
    return { selectedPlacedIndex: next };
  }),
  toggleRearSeats: () => set((s) => ({ rearSeatsDown: !s.rearSeatsDown })),
  setCarOpacity: (v) => set({ carOpacity: v }),
  setComputedTrunk: (trunk) => set({ computedTrunk: trunk }),

  setSelectedObject: (objectId) => set({ selectedObjectId: objectId }),

  addObject: (objectId, customDims) => {
    const template = objects.find((o) => o.id === objectId);
    if (!template) return;

    const dims = objectId === 'custom' && customDims ? customDims : template;
    const state = get();
    // Use the auto-computed trunk position from the 3D model
    const trunk = state.computedTrunk || (state.rearSeatsDown
      ? cars[state.selectedCarId].rearFolded
      : cars[state.selectedCarId].trunk);

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
      selectedPlacedIndex: s.placedObjects.length,
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
        const [rx, ry, rz] = o.rotation;
        let newRotation;
        if (rx === 0 && rz === 0) {
          newRotation = [Math.PI / 2, ry, 0];
        } else if (Math.abs(rx - Math.PI / 2) < 0.01) {
          newRotation = [0, ry, Math.PI / 2];
        } else {
          newRotation = [0, ry, 0];
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

export default useStore;
