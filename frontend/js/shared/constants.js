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
    nivel2: 'Cantón',
    nivel3: 'Parroquia'
  },
  'PE': {
    nivel1: 'Departamento',
    nivel2: 'Provincia',
    nivel3: 'Distrito'
  },
  'MX': {
    nivel1: 'Estado',
    nivel2: 'Municipio',
    nivel3: 'Colonia'
  },
  'DEFAULT': {
    nivel1: 'Nivel 1',
    nivel2: 'Nivel 2',
    nivel3: 'Nivel 3'
  }
};
