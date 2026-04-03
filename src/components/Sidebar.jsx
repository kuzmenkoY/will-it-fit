import useStore, { getTrunkWithOverrides } from '../store/useStore';
import { objects } from '../data/objects';
import { cars } from '../data/cars';
import { useState } from 'react';

function TrunkPositionTuner() {
  const [expanded, setExpanded] = useState(false);
  const selectedCarId = useStore((s) => s.selectedCarId);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const trunkOverrides = useStore((s) => s.trunkOverrides);
  const setTrunkOverride = useStore((s) => s.setTrunkOverride);
  const resetTrunkOverride = useStore((s) => s.resetTrunkOverride);
  const exportTrunkOverrides = useStore((s) => s.exportTrunkOverrides);

  const car = cars[selectedCarId];
  const trunk = getTrunkWithOverrides(car, selectedCarId, rearSeatsDown, trunkOverrides);
  const baseTrunk = rearSeatsDown ? car.rearFolded : car.trunk;
  const hasOverrides = !!trunkOverrides[selectedCarId];

  const makeSlider = (label, field, min, max, step) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color: '#fff' }}>{trunk[field].toFixed(2)}m</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={trunk[field]}
        onChange={(e) => setTrunkOverride(selectedCarId, field, parseFloat(e.target.value))}
        style={{ width: '100%', cursor: 'pointer', accentColor: '#00ff88' }}
      />
    </div>
  );

  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #2a2a40' }}>
      <div
        style={{
          fontWeight: 600, fontSize: 13, color: '#aaa', textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: 8, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        Trunk Position {hasOverrides && <span style={{ color: '#00ff88', fontSize: 10 }}>MODIFIED</span>}
        <span style={{ fontSize: 10, color: '#666' }}>{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div>
          {makeSlider('Left/Right (X)', 'offsetX', -1.0, 1.0, 0.02)}
          {makeSlider('Up/Down (Y)', 'offsetY', 0, 1.5, 0.02)}
          {makeSlider('Front/Back (Z)', 'offsetZ', -3.0, 3.0, 0.02)}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {hasOverrides && (
              <button
                onClick={() => resetTrunkOverride(selectedCarId)}
                style={{
                  flex: 1, padding: '6px', background: '#ff444422', border: '1px solid #ff444466',
                  borderRadius: 4, color: '#ff8888', cursor: 'pointer', fontSize: 11,
                }}
              >
                Reset
              </button>
            )}
            <button
              onClick={() => {
                const data = exportTrunkOverrides();
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              }}
              style={{
                flex: 1, padding: '6px', background: '#3b82f622', border: '1px solid #3b82f666',
                borderRadius: 4, color: '#93c5fd', cursor: 'pointer', fontSize: 11,
              }}
            >
              Copy All Overrides
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 6 }}>
            Adjust sliders to align trunk box with the car model. Changes are saved in your browser.
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const placedObjects = useStore((s) => s.placedObjects);
  const fitResults = useStore((s) => s.fitResults);
  const addObject = useStore((s) => s.addObject);
  const removeObject = useStore((s) => s.removeObject);
  const clearObjects = useStore((s) => s.clearObjects);
  const rotateObject = useStore((s) => s.rotateObject);
  const rearSeatsDown = useStore((s) => s.rearSeatsDown);
  const toggleRearSeats = useStore((s) => s.toggleRearSeats);
  const selectedCarId = useStore((s) => s.selectedCarId);
  const setSelectedCar = useStore((s) => s.setSelectedCar);
  const selectedPlacedIndex = useStore((s) => s.selectedPlacedIndex);
  const setSelectedPlacedIndex = useStore((s) => s.setSelectedPlacedIndex);
  const trunkOpen = useStore((s) => s.trunkOpen);
  const toggleTrunkOpen = useStore((s) => s.toggleTrunkOpen);
  const carOpacity = useStore((s) => s.carOpacity);
  const setCarOpacity = useStore((s) => s.setCarOpacity);

  const [customW, setCustomW] = useState(50);
  const [customH, setCustomH] = useState(50);
  const [customD, setCustomD] = useState(50);

  const trunkOverrides = useStore((s) => s.trunkOverrides);
  const car = cars[selectedCarId];
  const trunk = getTrunkWithOverrides(car, selectedCarId, rearSeatsDown, trunkOverrides);
  const carList = Object.entries(cars);

  const allFit = placedObjects.length > 0 && placedObjects.every((o) => fitResults[o.instanceId] === true);
  const anyNotFit = placedObjects.some((o) => fitResults[o.instanceId] === false);

  return (
    <div style={styles.sidebar}>
      <h1 style={styles.title}>Will It Fit?</h1>

      {/* Car selector */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Select Car</div>
        <select
          value={selectedCarId}
          onChange={(e) => { setSelectedCar(e.target.value); clearObjects(); }}
          style={styles.select}
        >
          {carList.map(([id, c]) => (
            <option key={id} value={id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Trunk info */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Cargo Space</div>
        <div style={styles.dims}>
          {(trunk.width * 100).toFixed(0)} x {(trunk.length * 100).toFixed(0)} x {(trunk.height * 100).toFixed(0)} cm
        </div>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={rearSeatsDown}
            onChange={toggleRearSeats}
          />
          Fold rear seats (larger cargo area)
        </label>
      </div>

      {/* Trunk position tuning */}
      <TrunkPositionTuner />

      {/* Visibility */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Car Visibility</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#666', minWidth: 45 }}>Ghost</span>
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.02"
            value={carOpacity}
            onChange={(e) => setCarOpacity(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={{ fontSize: 11, color: '#666', minWidth: 45 }}>Solid</span>
        </div>
      </div>

      {/* Object catalog */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Add Items</div>
        <div style={styles.objectGrid}>
          {objects.filter(o => o.id !== 'custom').map((obj) => (
            <button
              key={obj.id}
              style={{ ...styles.objectBtn, borderLeft: `4px solid ${obj.color}` }}
              onClick={() => addObject(obj.id)}
            >
              <span style={styles.objName}>{obj.name}</span>
              <span style={styles.objDims}>
                {(obj.width * 100).toFixed(0)}x{(obj.height * 100).toFixed(0)}x{(obj.depth * 100).toFixed(0)}cm
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom object */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Custom Object (cm)</div>
        <div style={styles.customInputs}>
          <label style={styles.inputLabel}>
            W
            <input type="number" value={customW} onChange={(e) => setCustomW(+e.target.value)} style={styles.input} />
          </label>
          <label style={styles.inputLabel}>
            H
            <input type="number" value={customH} onChange={(e) => setCustomH(+e.target.value)} style={styles.input} />
          </label>
          <label style={styles.inputLabel}>
            D
            <input type="number" value={customD} onChange={(e) => setCustomD(+e.target.value)} style={styles.input} />
          </label>
        </div>
        <button
          style={styles.addCustomBtn}
          onClick={() =>
            addObject('custom', {
              width: customW / 100,
              height: customH / 100,
              depth: customD / 100,
            })
          }
        >
          Add Custom Item
        </button>
      </div>

      {/* Placed objects */}
      {placedObjects.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            Placed Items
            <button style={styles.clearBtn} onClick={clearObjects}>Clear All</button>
          </div>
          {placedObjects.map((obj, i) => {
            const fit = fitResults[obj.instanceId];
            const isSel = i === selectedPlacedIndex;
            return (
              <div
                key={obj.instanceId}
                onClick={() => setSelectedPlacedIndex(i)}
                style={{
                  ...styles.placedItem,
                  borderLeft: `4px solid ${fit === true ? '#00ff88' : fit === false ? '#ff4444' : '#888'}`,
                  outline: isSel ? '1px solid #ffff00' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={styles.placedItemInfo}>
                  <span style={{ color: obj.color, fontWeight: 600 }}>{obj.name}</span>
                  <span style={styles.fitStatus}>
                    {fit === true ? 'FITS' : fit === false ? 'NO FIT' : '...'}
                  </span>
                </div>
                <div style={styles.placedItemActions}>
                  <button style={styles.smallBtn} onClick={() => rotateObject(obj.instanceId)} title="Rotate">
                    Rotate
                  </button>
                  <button style={styles.smallBtn} onClick={() => removeObject(obj.instanceId)} title="Remove">
                    X
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verdict */}
      {placedObjects.length > 0 && (
        <div
          style={{
            ...styles.verdict,
            background: allFit ? '#00ff8822' : anyNotFit ? '#ff444422' : '#88888822',
            borderColor: allFit ? '#00ff88' : anyNotFit ? '#ff4444' : '#888',
          }}
        >
          {allFit
            ? 'Everything fits!'
            : anyNotFit
            ? 'Some items do not fit. Try rotating or removing items.'
            : 'Checking fit...'}
        </div>
      )}

      {/* Controls help */}
      <div style={styles.help}>
        <div style={styles.sectionHeader}>Controls</div>
        <div>Arrow keys: move item (5cm)</div>
        <div>Shift+Arrow: fine move (1cm)</div>
        <div>W/S: move up/down</div>
        <div>R: rotate item</div>
        <div>Tab: cycle selected item</div>
        <div>Mouse: orbit camera</div>
        <div>Scroll: zoom</div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 320,
    height: '100vh',
    overflowY: 'auto',
    background: '#12121f',
    color: '#e0e0e0',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 13,
    zIndex: 10,
    borderRight: '1px solid #333',
  },
  title: {
    margin: '0 0 2px',
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    margin: '0 0 16px',
    color: '#888',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #2a2a40',
  },
  sectionHeader: {
    fontWeight: 600,
    fontSize: 13,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    background: '#1e1e35',
    border: '1px solid #444',
    borderRadius: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M6 8L1 3h10z\' fill=\'%23888\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },
  slider: {
    flex: 1,
    cursor: 'pointer',
    accentColor: '#3b82f6',
  },
  dims: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 8,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 13,
  },
  objectGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  objectBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: '#1e1e35',
    border: 'none',
    borderRadius: 6,
    color: '#e0e0e0',
    cursor: 'pointer',
    fontSize: 12,
    textAlign: 'left',
  },
  objName: {
    fontWeight: 500,
  },
  objDims: {
    fontFamily: 'monospace',
    color: '#888',
    fontSize: 11,
  },
  customInputs: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    color: '#888',
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    background: '#1e1e35',
    border: '1px solid #333',
    borderRadius: 4,
    color: '#fff',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  addCustomBtn: {
    width: '100%',
    padding: '8px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
  placedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    background: '#1e1e35',
    borderRadius: 6,
    marginBottom: 4,
  },
  placedItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  fitStatus: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  placedItemActions: {
    display: 'flex',
    gap: 4,
  },
  smallBtn: {
    padding: '4px 8px',
    background: '#333',
    border: 'none',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 11,
  },
  clearBtn: {
    padding: '2px 8px',
    background: '#ff444444',
    border: '1px solid #ff444488',
    borderRadius: 4,
    color: '#ff8888',
    cursor: 'pointer',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  verdict: {
    padding: 16,
    borderRadius: 8,
    border: '2px solid',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
  },
  help: {
    fontSize: 11,
    color: '#666',
    lineHeight: 1.8,
  },
};
