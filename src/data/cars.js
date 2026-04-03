// All dimensions in meters (real-world scale)
// Sources: manufacturer specs, edmunds.com, auto-data.net
// Trunk models generated with Build123D (parametric CAD)

export const cars = {
  'toyota-supra-mk4': {
    name: 'Toyota Supra MK4 (A80)',
    modelPath: '/models/toyota_supra_opt.glb',
    trunkModelPath: '/models/trunks/toyota_supra_mk4_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/toyota_supra_mk4_trunk_folded.glb',
    exterior: { length: 4.520, width: 1.810, height: 1.275 },
    trunk: {
      length: 0.75, width: 1.10, height: 0.40,
      offsetX: 0, offsetY: 0.28, offsetZ: -1.65,
    },
    rearFolded: {
      length: 1.20, width: 1.10, height: 0.45,
      offsetX: 0, offsetY: 0.30, offsetZ: -1.30,
    },
    color: '#3b82f6',
  },
  'bmw-2018': {
    name: 'BMW 3 Series (2018)',
    modelPath: '/models/bmw_2018_opt.glb',
    trunkModelPath: '/models/trunks/bmw_2018_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/bmw_2018_trunk_folded.glb',
    exterior: { length: 4.633, width: 1.811, height: 1.429 },
    trunk: {
      length: 1.00, width: 1.25, height: 0.48,
      offsetX: 0, offsetY: 0.30, offsetZ: -1.60,
    },
    rearFolded: {
      length: 1.70, width: 1.25, height: 0.52,
      offsetX: 0, offsetY: 0.32, offsetZ: -1.05,
    },
    color: '#60a5fa',
  },
  'bmw-x6m': {
    name: 'BMW X6 M',
    modelPath: '/models/bmw_x6m_opt.glb',
    trunkModelPath: '/models/trunks/bmw_x6m_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/bmw_x6m_trunk_folded.glb',
    exterior: { length: 4.955, width: 2.004, height: 1.696 },
    trunk: {
      length: 1.05, width: 1.40, height: 0.65,
      offsetX: 0, offsetY: 0.38, offsetZ: -1.60,
    },
    rearFolded: {
      length: 1.85, width: 1.40, height: 0.70,
      offsetX: 0, offsetY: 0.40, offsetZ: -1.00,
    },
    color: '#1d4ed8',
  },
  'vw-golf-ii': {
    name: 'Volkswagen Golf II',
    modelPath: '/models/volkswagen_golf_ii_opt.glb',
    trunkModelPath: '/models/trunks/vw_golf_ii_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/vw_golf_ii_trunk_folded.glb',
    exterior: { length: 4.020, width: 1.665, height: 1.415 },
    trunk: {
      length: 0.75, width: 1.15, height: 0.50,
      offsetX: 0, offsetY: 0.30, offsetZ: -1.35,
    },
    rearFolded: {
      length: 1.45, width: 1.15, height: 0.60,
      offsetX: 0, offsetY: 0.32, offsetZ: -0.85,
    },
    color: '#f59e0b',
  },
  'tesla-roadster-2020': {
    name: 'Tesla Roadster (2020)',
    modelPath: '/models/tesla_roadster_2020_opt.glb',
    trunkModelPath: '/models/trunks/tesla_roadster_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/tesla_roadster_trunk_folded.glb',
    exterior: { length: 4.694, width: 2.024, height: 1.126 },
    trunk: {
      length: 0.60, width: 0.90, height: 0.30,
      offsetX: 0, offsetY: 0.25, offsetZ: 1.70,
    },
    rearFolded: {
      length: 0.85, width: 0.90, height: 0.35,
      offsetX: 0, offsetY: 0.25, offsetZ: 1.55,
    },
    color: '#ef4444',
  },
};

export const defaultCar = 'toyota-supra-mk4';
