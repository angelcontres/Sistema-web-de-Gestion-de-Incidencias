/**
 * Application Constants
 */
export const MAP_CONFIG = {
  TILE_LAYER_URL: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  TILE_LAYER_ATTRIBUTION: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
  DEFAULT_CENTER: [-1.8312, -78.1834], // Ecuador
  DEFAULT_ZOOM: 5,
  COUNTRY_CENTERS: {
    'PE': { center: [-9.1900, -75.0152], zoom: 6 },
    'MX': { center: [23.6345, -102.5528], zoom: 5 },
    'EC': { center: [-1.8312, -78.1834], zoom: 6 },
  }
};

export const COUNTRY_LEVELS = {
  'EC': {
    nivel1: 'Provincia',
    nivel1_art: 'la',
    nivel2: 'Cantón',
    nivel2_art: 'el',
    nivel3: 'Parroquia',
    nivel3_art: 'la'
  },
  'PE': {
    nivel1: 'Departamento',
    nivel1_art: 'el',
    nivel2: 'Provincia',
    nivel2_art: 'la',
    nivel3: 'Distrito',
    nivel3_art: 'el'
  },
  'MX': {
    nivel1: 'Estado',
    nivel1_art: 'el',
    nivel2: 'Municipio',
    nivel2_art: 'el',
    nivel3: 'Colonia',
    nivel3_art: 'la'
  },
  'DEFAULT': {
    nivel1: 'Nivel 1',
    nivel1_art: 'el',
    nivel2: 'Nivel 2',
    nivel2_art: 'el',
    nivel3: 'Nivel 3',
    nivel3_art: 'el'
  }
};
