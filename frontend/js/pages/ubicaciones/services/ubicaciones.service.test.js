import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesService } from './ubicaciones.service.js';

describe('UbicacionesService', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mockData' })
      })
    );
    if (!window.localStorage) {
      window.localStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
    }
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('Países', () => {
    it('getPaises - debería hacer request a /paises', async () => {
      await UbicacionesService.getPaises();
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/countries'), expect.any(Object));
    });

    it('getPaisById - debería hacer request a /paises/id', async () => {
      await UbicacionesService.getPaisById(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/countries/1'), expect.any(Object));
    });

    it('createPais - debería enviar POST', async () => {
      await UbicacionesService.createPais({ nombre: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/countries'), expect.objectContaining({ method: 'POST' }));
    });

    it('updatePais - debería enviar PUT', async () => {
      await UbicacionesService.updatePais(1, { nombre: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/countries/1'), expect.objectContaining({ method: 'PUT' }));
    });

    it('deletePais - debería enviar DELETE', async () => {
      await UbicacionesService.deletePais(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/countries/1'), expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Territorios', () => {
    it('getTerritorios - debería hacer request con query params', async () => {
      await UbicacionesService.getTerritorios({ pais_id: 1, parent_id: 2 });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('pais_id=1&parent_id=2'), expect.any(Object));
    });

    it('getTerritorioById - debería hacer request a /territorios/id', async () => {
      await UbicacionesService.getTerritorioById(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/territories/1'), expect.any(Object));
    });

    it('createTerritorio - debería enviar POST', async () => {
      await UbicacionesService.createTerritorio({ nombre: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/territories'), expect.objectContaining({ method: 'POST' }));
    });

    it('updateTerritorio - debería enviar PUT', async () => {
      await UbicacionesService.updateTerritorio(1, { nombre: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/territories/1'), expect.objectContaining({ method: 'PUT' }));
    });

    it('deleteTerritorio - debería enviar DELETE', async () => {
      await UbicacionesService.deleteTerritorio(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/territories/1'), expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Direcciones', () => {
    it('getDirecciones - debería hacer request con query params', async () => {
      await UbicacionesService.getDirecciones({ territorio_id: 1 });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('territorio_id=1'), expect.any(Object));
    });

    it('getDireccionById - debería hacer request a /direcciones/id', async () => {
      await UbicacionesService.getDireccionById(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/addresses/1'), expect.any(Object));
    });

    it('createDireccion - debería enviar POST', async () => {
      await UbicacionesService.createDireccion({ direccion: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/addresses'), expect.objectContaining({ method: 'POST' }));
    });

    it('updateDireccion - debería enviar PUT', async () => {
      await UbicacionesService.updateDireccion(1, { direccion: 'Test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/addresses/1'), expect.objectContaining({ method: 'PUT' }));
    });

    it('deleteDireccion - debería enviar DELETE', async () => {
      await UbicacionesService.deleteDireccion(1);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/addresses/1'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('reverseGeocode - debería hacer request a /geocodificacion/reversa', async () => {
      await UbicacionesService.reverseGeocode(10, -10);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/geocoding/reverse?lat=10&lng=-10'), expect.any(Object));
    });
  });
});
