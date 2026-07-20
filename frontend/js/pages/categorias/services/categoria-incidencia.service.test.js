import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CategoriaIncidenciaService } from './categoria-incidencia.service.js';

describe('CategoriaIncidenciaService', () => {
  let lastApiRequestArgs = [];
  const originalFetch = window.fetch;

  beforeEach(() => {
    lastApiRequestArgs = [];
    window.fetch = jest.fn(async (url, options) => {
      let endpoint = url;
      if (url.includes('/api/v1')) {
        endpoint = url.substring(url.indexOf('/api/v1') + 7);
      }
      lastApiRequestArgs = [endpoint, options];
      return { ok: true, json: async () => ({ success: true, data: 'mocked' }) };
    });
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('getAll() - debería llamar al endpoint correcto sin parámetros', async () => {
    await CategoriaIncidenciaService.getAll();
    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia');
  });

  it('getAll(number) - debería llamar al endpoint con paginación si se pasa un número', async () => {
    await CategoriaIncidenciaService.getAll(3);
    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia?page=3');
  });

  it('getAll(object) - debería armar correctamente el query string con múltiples parámetros', async () => {
    await CategoriaIncidenciaService.getAll({ parent_id: 1, page: 2 });
    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia?parent_id=1&page=2');
  });

  it('getById(id) - debería llamar al endpoint del recurso específico', async () => {
    await CategoriaIncidenciaService.getById(15);
    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia/15');
  });

  it('create(payload) - debería enviar una petición POST con el payload', async () => {
    const payload = { nombre: 'Nueva Categoría' };
    await CategoriaIncidenciaService.create(payload);

    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia');
    expect(lastApiRequestArgs[1].method).toBe('POST');
    expect(lastApiRequestArgs[1].body).toBe(JSON.stringify(payload));
  });

  it('update(id, payload) - debería enviar una petición PUT con el payload', async () => {
    const payload = { nombre: 'Categoría Actualizada' };
    await CategoriaIncidenciaService.update(20, payload);

    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia/20');
    expect(lastApiRequestArgs[1].method).toBe('PUT');
    expect(lastApiRequestArgs[1].body).toBe(JSON.stringify(payload));
  });

  it('delete(id) - debería enviar una petición DELETE al recurso', async () => {
    await CategoriaIncidenciaService.delete(25);

    expect(lastApiRequestArgs[0]).toBe('/categorias-incidencia/25');
    expect(lastApiRequestArgs[1].method).toBe('DELETE');
  });
});
