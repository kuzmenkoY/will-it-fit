import { useEffect } from 'react';
import useStore from '../store/useStore';

export default function ObjectMover() {
  const updateObjectPosition = useStore((s) => s.updateObjectPosition);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = useStore.getState();
      const { placedObjects, selectedPlacedIndex } = state;
      if (placedObjects.length === 0) return;

      // Tab to cycle between objects
      if (e.key === 'Tab') {
        e.preventDefault();
        state.cycleSelectedObject();
        return;
      }

      const idx = selectedPlacedIndex >= 0 && selectedPlacedIndex < placedObjects.length
        ? selectedPlacedIndex
        : placedObjects.length - 1;

      const obj = placedObjects[idx];
      const pos = [...obj.position];
      const step = e.shiftKey ? 0.01 : 0.05; // Shift for fine movement (1cm)

      switch (e.key) {
        case 'ArrowLeft':
          pos[0] -= step;
          break;
        case 'ArrowRight':
          pos[0] += step;
          break;
        case 'ArrowUp':
          pos[2] -= step;
          break;
        case 'ArrowDown':
          pos[2] += step;
          break;
        case 'PageUp':
        case 'w':
          pos[1] += step;
          break;
        case 'PageDown':
        case 's':
          pos[1] -= step;
          break;
        case 'r':
          state.rotateObject(obj.instanceId);
          return;
        default:
          return;
      }
      e.preventDefault();
      updateObjectPosition(obj.instanceId, pos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateObjectPosition]);

  return null;
}
