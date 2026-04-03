// All dimensions in meters (real-world scale)
// Sources: manufacturer specs, edmunds.com, auto-data.net
// Trunk models generated with Build123D (parametric CAD)

// Helper: cars without dedicated trunk models use simple box trunks (rendered in CarModel.jsx)
// Cars WITH trunkModelPath get the parametric Build123D trunk shape

export const cars = {
  // ── Volkswagen ──────────────────────────────────────────
  'vw-golf-ii': {
    name: 'Volkswagen Golf II (1983)',
    modelPath: '/models/volkswagen_golf_ii_opt.glb',
    trunkModelPath: '/models/trunks/vw_golf_ii_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/vw_golf_ii_trunk_folded.glb',
    exterior: { length: 4.020, width: 1.665, height: 1.415 },
    trunk: { length: 0.75, width: 1.15, height: 0.50, offsetX: 0, offsetY: 0.30, offsetZ: -1.35 },
    rearFolded: { length: 1.45, width: 1.15, height: 0.60, offsetX: 0, offsetY: 0.32, offsetZ: -0.85 },
    color: '#f59e0b',
  },

  // ── BMW ─────────────────────────────────────────────────
  'bmw-3-series-2018': {
    name: 'BMW 3 Series (2018)',
    modelPath: '/models/bmw_2018_opt.glb',
    trunkModelPath: '/models/trunks/bmw_2018_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/bmw_2018_trunk_folded.glb',
    exterior: { length: 4.633, width: 1.811, height: 1.429 },
    trunk: { length: 1.00, width: 1.25, height: 0.48, offsetX: 0, offsetY: 0.30, offsetZ: -1.60 },
    rearFolded: { length: 1.70, width: 1.25, height: 0.52, offsetX: 0, offsetY: 0.32, offsetZ: -1.05 },
    color: '#60a5fa',
  },
  'bmw-m3-sedan': {
    name: 'BMW M3 Sedan (G80)',
    modelPath: '/models/bmw_m3_sedan_opt.glb',
    exterior: { length: 4.794, width: 1.903, height: 1.433 },
    trunk: { length: 1.00, width: 1.30, height: 0.48, offsetX: 0, offsetY: 0.30, offsetZ: -1.65 },
    rearFolded: { length: 1.75, width: 1.30, height: 0.52, offsetX: 0, offsetY: 0.32, offsetZ: -1.05 },
    color: '#3b82f6',
  },
  'bmw-m4-2021': {
    name: 'BMW M4 Competition (2021)',
    modelPath: '/models/bmw_m4_competition_2021_opt.glb',
    exterior: { length: 4.794, width: 1.887, height: 1.393 },
    trunk: { length: 0.90, width: 1.20, height: 0.42, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    rearFolded: { length: 1.50, width: 1.20, height: 0.48, offsetX: 0, offsetY: 0.30, offsetZ: -1.15 },
    color: '#2563eb',
  },
  'bmw-m8-2020': {
    name: 'BMW M8 (2020)',
    modelPath: '/models/2020_bmw_m8_opt.glb',
    exterior: { length: 4.843, width: 1.906, height: 1.346 },
    trunk: { length: 0.85, width: 1.20, height: 0.40, offsetX: 0, offsetY: 0.28, offsetZ: -1.70 },
    rearFolded: { length: 1.40, width: 1.20, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.20 },
    color: '#1e40af',
  },
  'bmw-i8-2015': {
    name: 'BMW i8 (2015)',
    modelPath: '/models/bmw_i8_2015_opt.glb',
    exterior: { length: 4.689, width: 1.942, height: 1.291 },
    trunk: { length: 0.50, width: 0.80, height: 0.30, offsetX: 0, offsetY: 0.25, offsetZ: -1.70 },
    rearFolded: { length: 0.70, width: 0.80, height: 0.35, offsetX: 0, offsetY: 0.27, offsetZ: -1.50 },
    color: '#0ea5e9',
  },
  'bmw-x6m': {
    name: 'BMW X6 M',
    modelPath: '/models/bmw_x6m_opt.glb',
    trunkModelPath: '/models/trunks/bmw_x6m_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/bmw_x6m_trunk_folded.glb',
    exterior: { length: 4.955, width: 2.004, height: 1.696 },
    trunk: { length: 1.05, width: 1.40, height: 0.65, offsetX: 0, offsetY: 0.38, offsetZ: -1.60 },
    rearFolded: { length: 1.85, width: 1.40, height: 0.70, offsetX: 0, offsetY: 0.40, offsetZ: -1.00 },
    color: '#1d4ed8',
  },

  // ── Toyota ──────────────────────────────────────────────
  'toyota-supra-mk4': {
    name: 'Toyota Supra MK4 (A80)',
    modelPath: '/models/toyota_supra_opt.glb',
    trunkModelPath: '/models/trunks/toyota_supra_mk4_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/toyota_supra_mk4_trunk_folded.glb',
    exterior: { length: 4.520, width: 1.810, height: 1.275 },
    trunk: { length: 0.75, width: 1.10, height: 0.40, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    rearFolded: { length: 1.20, width: 1.10, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.30 },
    color: '#3b82f6',
  },
  'toyota-supra-mk5': {
    name: 'Toyota Supra MK5 (A90)',
    modelPath: '/models/toyota_supra_mk5_a90_opt.glb',
    exterior: { length: 4.379, width: 1.854, height: 1.292 },
    trunk: { length: 0.65, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.55 },
    rearFolded: { length: 0.65, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.55 },
    color: '#ef4444',
  },
  'toyota-land-cruiser-300': {
    name: 'Toyota Land Cruiser 300',
    modelPath: '/models/toyota_land_cruiser_300_opt.glb',
    exterior: { length: 4.985, width: 1.980, height: 1.925 },
    trunk: { length: 1.10, width: 1.45, height: 0.80, offsetX: 0, offsetY: 0.45, offsetZ: -1.60 },
    rearFolded: { length: 2.00, width: 1.45, height: 0.85, offsetX: 0, offsetY: 0.47, offsetZ: -0.85 },
    color: '#065f46',
  },

  // ── Tesla ───────────────────────────────────────────────
  'tesla-roadster-2020': {
    name: 'Tesla Roadster (2020)',
    modelPath: '/models/tesla_roadster_2020_opt.glb',
    trunkModelPath: '/models/trunks/tesla_roadster_trunk.glb',
    trunkFoldedModelPath: '/models/trunks/tesla_roadster_trunk_folded.glb',
    exterior: { length: 4.694, width: 2.024, height: 1.126 },
    trunk: { length: 0.60, width: 0.90, height: 0.30, offsetX: 0, offsetY: 0.25, offsetZ: 1.70 },
    rearFolded: { length: 0.85, width: 0.90, height: 0.35, offsetX: 0, offsetY: 0.25, offsetZ: 1.55 },
    color: '#ef4444',
  },

  // ── Audi ────────────────────────────────────────────────
  'audi-r8': {
    name: 'Audi R8',
    modelPath: '/models/audi_r8_opt.glb',
    exterior: { length: 4.426, width: 1.940, height: 1.240 },
    trunk: { length: 0.50, width: 0.80, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.60 },
    rearFolded: { length: 0.50, width: 0.80, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.60 },
    color: '#dc2626',
  },
  'audi-rs7-2014': {
    name: 'Audi RS7 (2014)',
    modelPath: '/models/audi_rs7_2014_opt.glb',
    exterior: { length: 4.980, width: 1.911, height: 1.408 },
    trunk: { length: 1.05, width: 1.35, height: 0.50, offsetX: 0, offsetY: 0.30, offsetZ: -1.70 },
    rearFolded: { length: 1.85, width: 1.35, height: 0.55, offsetX: 0, offsetY: 0.32, offsetZ: -1.05 },
    color: '#6366f1',
  },

  // ── Mercedes ────────────────────────────────────────────
  'mercedes-amg-gt': {
    name: 'Mercedes-AMG GT',
    modelPath: '/models/mercedes_amg_gt_opt.glb',
    exterior: { length: 4.546, width: 1.939, height: 1.288 },
    trunk: { length: 0.65, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.60 },
    rearFolded: { length: 0.65, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.60 },
    color: '#a3a3a3',
  },

  // ── Porsche ─────────────────────────────────────────────
  'porsche-cayman-s-2014': {
    name: 'Porsche Cayman S (2014)',
    modelPath: '/models/porsche_cayman_s_2014_opt.glb',
    exterior: { length: 4.380, width: 1.801, height: 1.295 },
    trunk: { length: 0.55, width: 0.90, height: 0.30, offsetX: 0, offsetY: 0.25, offsetZ: 1.55 },
    rearFolded: { length: 0.75, width: 0.90, height: 0.35, offsetX: 0, offsetY: 0.27, offsetZ: 1.40 },
    color: '#fbbf24',
  },
  'porsche-panamera-2021': {
    name: 'Porsche Panamera Turbo S (2021)',
    modelPath: '/models/porsche_panamera_turbo_s_2021_opt.glb',
    exterior: { length: 5.049, width: 1.937, height: 1.423 },
    trunk: { length: 1.05, width: 1.30, height: 0.50, offsetX: 0, offsetY: 0.30, offsetZ: -1.75 },
    rearFolded: { length: 1.80, width: 1.30, height: 0.55, offsetX: 0, offsetY: 0.32, offsetZ: -1.10 },
    color: '#78716c',
  },
  'porsche-taycan-turbo-s': {
    name: 'Porsche Taycan Turbo S',
    modelPath: '/models/porsche_taycan_turbo_s_opt.glb',
    exterior: { length: 4.963, width: 1.966, height: 1.378 },
    trunk: { length: 0.95, width: 1.25, height: 0.45, offsetX: 0, offsetY: 0.28, offsetZ: -1.70 },
    rearFolded: { length: 1.60, width: 1.25, height: 0.50, offsetX: 0, offsetY: 0.30, offsetZ: -1.15 },
    color: '#0284c7',
  },

  // ── Ferrari ─────────────────────────────────────────────
  'ferrari-488-gtb': {
    name: 'Ferrari 488 GTB (2016)',
    modelPath: '/models/ferrari_488_gtb_2016_opt.glb',
    exterior: { length: 4.568, width: 1.952, height: 1.213 },
    trunk: { length: 0.50, width: 0.85, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.65 },
    rearFolded: { length: 0.50, width: 0.85, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.65 },
    color: '#dc2626',
  },
  'ferrari-599': {
    name: 'Ferrari 599 GTB',
    modelPath: '/models/ferrari_599_opt.glb',
    exterior: { length: 4.665, width: 1.962, height: 1.336 },
    trunk: { length: 0.70, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    rearFolded: { length: 0.70, width: 1.00, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    color: '#b91c1c',
  },
  'ferrari-f8-tributo': {
    name: 'Ferrari F8 Tributo (2020)',
    modelPath: '/models/ferrari_f8_tributo_2020_opt.glb',
    exterior: { length: 4.611, width: 1.979, height: 1.206 },
    trunk: { length: 0.50, width: 0.85, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.65 },
    rearFolded: { length: 0.50, width: 0.85, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.65 },
    color: '#f87171',
  },

  // ── Lamborghini ─────────────────────────────────────────
  'lamborghini-aventador-svj': {
    name: 'Lamborghini Aventador SVJ (2020)',
    modelPath: '/models/lamborghini_aventador_svj_2020_opt.glb',
    exterior: { length: 4.943, width: 2.098, height: 1.136 },
    trunk: { length: 0.40, width: 0.70, height: 0.20, offsetX: 0, offsetY: 0.25, offsetZ: 1.80 },
    rearFolded: { length: 0.40, width: 0.70, height: 0.20, offsetX: 0, offsetY: 0.25, offsetZ: 1.80 },
    color: '#eab308',
  },
  'lamborghini-huracan-gt': {
    name: 'Lamborghini Huracán GT (2019)',
    modelPath: '/models/lamborghini_huracan_gt_2019_opt.glb',
    exterior: { length: 4.520, width: 1.933, height: 1.165 },
    trunk: { length: 0.45, width: 0.80, height: 0.22, offsetX: 0, offsetY: 0.25, offsetZ: 1.60 },
    rearFolded: { length: 0.45, width: 0.80, height: 0.22, offsetX: 0, offsetY: 0.25, offsetZ: 1.60 },
    color: '#22c55e',
  },

  // ── Honda ───────────────────────────────────────────────
  'honda-civic-type-r-2024': {
    name: 'Honda Civic Type R (2024)',
    modelPath: '/models/honda_civic_type_r_2024_opt.glb',
    exterior: { length: 4.595, width: 1.890, height: 1.405 },
    trunk: { length: 0.90, width: 1.20, height: 0.55, offsetX: 0, offsetY: 0.30, offsetZ: -1.55 },
    rearFolded: { length: 1.70, width: 1.20, height: 0.60, offsetX: 0, offsetY: 0.32, offsetZ: -0.95 },
    color: '#dc2626',
  },
  'honda-nsx-1990': {
    name: 'Honda NSX (1990)',
    modelPath: '/models/honda_nsx_1990_opt.glb',
    exterior: { length: 4.430, width: 1.810, height: 1.170 },
    trunk: { length: 0.45, width: 0.80, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.55 },
    rearFolded: { length: 0.45, width: 0.80, height: 0.25, offsetX: 0, offsetY: 0.25, offsetZ: 1.55 },
    color: '#ef4444',
  },

  // ── Ford ────────────────────────────────────────────────
  'ford-mustang-gt-1968': {
    name: 'Ford Mustang GT (1968)',
    modelPath: '/models/ford_mustang_gt_1968_opt.glb',
    exterior: { length: 4.614, width: 1.801, height: 1.308 },
    trunk: { length: 0.85, width: 1.15, height: 0.40, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    rearFolded: { length: 0.85, width: 1.15, height: 0.40, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    color: '#16a34a',
  },
  'ford-f150-raptor-2018': {
    name: 'Ford F-150 Raptor (2018)',
    modelPath: '/models/ford_f150_raptor_2018_opt.glb',
    exterior: { length: 5.890, width: 2.195, height: 1.961 },
    // Truck bed, not trunk
    trunk: { length: 1.68, width: 1.58, height: 0.55, offsetX: 0, offsetY: 0.65, offsetZ: -1.60 },
    rearFolded: { length: 1.68, width: 1.58, height: 0.55, offsetX: 0, offsetY: 0.65, offsetZ: -1.60 },
    color: '#1e3a5f',
  },
  'ford-gt40': {
    name: 'Ford GT40',
    modelPath: '/models/ford_gt40_opt.glb',
    exterior: { length: 4.140, width: 1.778, height: 1.029 },
    trunk: { length: 0.40, width: 0.70, height: 0.20, offsetX: 0, offsetY: 0.22, offsetZ: 1.50 },
    rearFolded: { length: 0.40, width: 0.70, height: 0.20, offsetX: 0, offsetY: 0.22, offsetZ: 1.50 },
    color: '#1e40af',
  },

  // ── Dodge ───────────────────────────────────────────────
  'dodge-challenger-rt': {
    name: 'Dodge Challenger R/T',
    modelPath: '/models/dodge_challenger_rt_opt.glb',
    exterior: { length: 5.017, width: 1.923, height: 1.448 },
    trunk: { length: 1.00, width: 1.25, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.75 },
    rearFolded: { length: 1.00, width: 1.25, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.75 },
    color: '#f97316',
  },
  'dodge-challenger-hellcat': {
    name: 'Dodge Challenger Hellcat (2018)',
    modelPath: '/models/dodge_challenger_hellcat_2018_opt.glb',
    exterior: { length: 5.017, width: 1.923, height: 1.448 },
    trunk: { length: 1.00, width: 1.25, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.75 },
    rearFolded: { length: 1.00, width: 1.25, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.75 },
    color: '#b91c1c',
  },

  // ── Chevrolet ───────────────────────────────────────────
  'chevrolet-camaro-ss-2016': {
    name: 'Chevrolet Camaro SS (2016)',
    modelPath: '/models/chevrolet_camaro_ss_2016_opt.glb',
    exterior: { length: 4.784, width: 1.897, height: 1.349 },
    trunk: { length: 0.85, width: 1.15, height: 0.38, offsetX: 0, offsetY: 0.28, offsetZ: -1.65 },
    rearFolded: { length: 1.40, width: 1.15, height: 0.42, offsetX: 0, offsetY: 0.30, offsetZ: -1.25 },
    color: '#eab308',
  },

  // ── Hyundai ─────────────────────────────────────────────
  'hyundai-sonata-2009': {
    name: 'Hyundai Sonata (2009)',
    modelPath: '/models/hyundai_sonata_2009_opt.glb',
    exterior: { length: 4.800, width: 1.832, height: 1.475 },
    trunk: { length: 1.05, width: 1.30, height: 0.50, offsetX: 0, offsetY: 0.30, offsetZ: -1.65 },
    rearFolded: { length: 1.80, width: 1.30, height: 0.55, offsetX: 0, offsetY: 0.32, offsetZ: -1.05 },
    color: '#94a3b8',
  },
  'hyundai-tucson-2015': {
    name: 'Hyundai Tucson (2015)',
    modelPath: '/models/hyundai_tucson_2015_opt.glb',
    exterior: { length: 4.475, width: 1.850, height: 1.660 },
    trunk: { length: 0.95, width: 1.35, height: 0.65, offsetX: 0, offsetY: 0.38, offsetZ: -1.50 },
    rearFolded: { length: 1.70, width: 1.35, height: 0.70, offsetX: 0, offsetY: 0.40, offsetZ: -0.90 },
    color: '#a855f7',
  },
  'hyundai-elantra-n-2022': {
    name: 'Hyundai Elantra N (2022)',
    modelPath: '/models/hyundai_elantra_n_2022_opt.glb',
    exterior: { length: 4.650, width: 1.825, height: 1.400 },
    trunk: { length: 1.00, width: 1.25, height: 0.48, offsetX: 0, offsetY: 0.30, offsetZ: -1.60 },
    rearFolded: { length: 1.70, width: 1.25, height: 0.52, offsetX: 0, offsetY: 0.32, offsetZ: -1.00 },
    color: '#0ea5e9',
  },
  'hyundai-veloster-n': {
    name: 'Hyundai Veloster N (2021)',
    modelPath: '/models/hyundai_veloster_n_2021_opt.glb',
    exterior: { length: 4.240, width: 1.800, height: 1.400 },
    trunk: { length: 0.75, width: 1.15, height: 0.55, offsetX: 0, offsetY: 0.30, offsetZ: -1.40 },
    rearFolded: { length: 1.40, width: 1.15, height: 0.60, offsetX: 0, offsetY: 0.32, offsetZ: -0.85 },
    color: '#06b6d4',
  },
  'hyundai-creta-2016': {
    name: 'Hyundai Creta (2016)',
    modelPath: '/models/hyundai_creta_2016_opt.glb',
    exterior: { length: 4.270, width: 1.790, height: 1.630 },
    trunk: { length: 0.85, width: 1.25, height: 0.60, offsetX: 0, offsetY: 0.35, offsetZ: -1.45 },
    rearFolded: { length: 1.55, width: 1.25, height: 0.65, offsetX: 0, offsetY: 0.37, offsetZ: -0.90 },
    color: '#f472b6',
  },

  // ── Subaru ──────────────────────────────────────────────
  'subaru-impreza-wrx': {
    name: 'Subaru Impreza WRX',
    modelPath: '/models/subaru_impreza_wrx_opt.glb',
    exterior: { length: 4.465, width: 1.740, height: 1.465 },
    trunk: { length: 0.90, width: 1.20, height: 0.45, offsetX: 0, offsetY: 0.30, offsetZ: -1.55 },
    rearFolded: { length: 1.60, width: 1.20, height: 0.50, offsetX: 0, offsetY: 0.32, offsetZ: -1.00 },
    color: '#2563eb',
  },

  // ── Mazda ───────────────────────────────────────────────
  'mazda-rx7': {
    name: 'Mazda RX-7',
    modelPath: '/models/mazda_rx7_opt.glb',
    exterior: { length: 4.285, width: 1.760, height: 1.230 },
    trunk: { length: 0.65, width: 1.05, height: 0.35, offsetX: 0, offsetY: 0.28, offsetZ: -1.55 },
    rearFolded: { length: 1.10, width: 1.05, height: 0.40, offsetX: 0, offsetY: 0.30, offsetZ: -1.20 },
    color: '#dc2626',
  },

  // ── Bugatti ─────────────────────────────────────────────
  'bugatti-bolide-2024': {
    name: 'Bugatti Bolide (2024)',
    modelPath: '/models/bugatti_bolide_2024_opt.glb',
    exterior: { length: 4.755, width: 1.998, height: 1.240 },
    trunk: { length: 0.30, width: 0.50, height: 0.15, offsetX: 0, offsetY: 0.25, offsetZ: 1.70 },
    rearFolded: { length: 0.30, width: 0.50, height: 0.15, offsetX: 0, offsetY: 0.25, offsetZ: 1.70 },
    color: '#1e3a8a',
  },
};

export const defaultCar = 'toyota-supra-mk4';
