import { describe, it, expect } from '@jest/globals';
import { MAP_CONFIG, COUNTRY_LEVELS } from './constants.js';

describe('MAP_CONFIG', () => {
  it('tiene TILE_LAYER_URL definido', () => {
    expect(MAP_CONFIG.TILE_LAYER_URL).toBeTruthy();
  });

  it('tiene TILE_LAYER_ATTRIBUTION definido', () => {
    expect(MAP_CONFIG.TILE_LAYER_ATTRIBUTION).toBeTruthy();
  });

  it('tiene DEFAULT_CENTER con latitud y longitud', () => {
    expect(MAP_CONFIG.DEFAULT_CENTER).toHaveLength(2);
    expect(typeof MAP_CONFIG.DEFAULT_CENTER[0]).toBe('number');
    expect(typeof MAP_CONFIG.DEFAULT_CENTER[1]).toBe('number');
  });

  it('tiene DEFAULT_ZOOM como numero', () => {
    expect(typeof MAP_CONFIG.DEFAULT_ZOOM).toBe('number');
  });

  it('tiene COUNTRY_CENTERS con PE, MX, EC', () => {
    expect(MAP_CONFIG.COUNTRY_CENTERS).toHaveProperty('PE');
    expect(MAP_CONFIG.COUNTRY_CENTERS).toHaveProperty('MX');
    expect(MAP_CONFIG.COUNTRY_CENTERS).toHaveProperty('EC');
  });

  it('cada COUNTRY_CENTER tiene center y zoom', () => {
    for (const code of Object.keys(MAP_CONFIG.COUNTRY_CENTERS)) {
      expect(MAP_CONFIG.COUNTRY_CENTERS[code].center).toHaveLength(2);
      expect(typeof MAP_CONFIG.COUNTRY_CENTERS[code].zoom).toBe('number');
    }
  });
});

describe('COUNTRY_LEVELS', () => {
  it('tiene EC, PE, MX y DEFAULT', () => {
    expect(COUNTRY_LEVELS).toHaveProperty('EC');
    expect(COUNTRY_LEVELS).toHaveProperty('PE');
    expect(COUNTRY_LEVELS).toHaveProperty('MX');
    expect(COUNTRY_LEVELS).toHaveProperty('DEFAULT');
  });

  it('cada pais tiene las claves nivel1, nivel2, nivel3 con sus articulos', () => {
    for (const code of Object.keys(COUNTRY_LEVELS)) {
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel1');
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel1_art');
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel2');
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel2_art');
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel3');
      expect(COUNTRY_LEVELS[code]).toHaveProperty('nivel3_art');
    }
  });
});
