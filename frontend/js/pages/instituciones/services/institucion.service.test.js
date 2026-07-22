import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { InstitucionService } from './institucion.service.js';

describe('InstitucionService', () => {
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
      window.localStorage = { getItem: jest.fn(() => 'fake-token'), setItem: jest.fn(), removeItem: jest.fn() };
    }
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('getAll', () => {
    it('debería hacer petición a /instituciones sin parámetros', async () => {
      await InstitucionService.getAll();
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions'), expect.any(Object));
    });

    it('debería convertir el parámetro numérico a un objeto con {page}', async () => {
      await InstitucionService.getAll(2);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions?per_page=15&page=2'), expect.any(Object));
    });

    it('debería serializar un objeto de parámetros correctamente', async () => {
      await InstitucionService.getAll(1, 15, null, { search: 'test' });
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions?search=test&per_page=15&page=1'), expect.any(Object));
    });
  });

  describe('getById', () => {
    it('debería hacer petición a /instituciones/:id', async () => {
      await InstitucionService.getById(5);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions/5'), expect.any(Object));
    });
  });

  describe('create', () => {
    it('debería enviar POST con el payload', async () => {
      const payload = { nombre: 'Nueva Institucion' };
      await InstitucionService.create(payload);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions'), expect.objectContaining({ 
        method: 'POST',
        body: JSON.stringify(payload) 
      }));
    });
  });

  describe('update', () => {
    it('debería enviar PUT con el payload y el id', async () => {
      const payload = { nombre: 'Institucion Editada' };
      await InstitucionService.update(10, payload);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions/10'), expect.objectContaining({ 
        method: 'PUT',
        body: JSON.stringify(payload)
      }));
    });
  });

  describe('delete', () => {
    it('debería enviar DELETE al id correcto', async () => {
      await InstitucionService.delete(7);
      expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/institutions/7'), expect.objectContaining({ 
        method: 'DELETE'
      }));
    });
  });
});
