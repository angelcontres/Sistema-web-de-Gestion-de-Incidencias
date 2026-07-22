import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidenciaService } from './incidencia.service.js';

describe('IncidenciaService', () => {
  let originalFetch;
  let originalLocalStorage;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mockData' }),
      })
    );

    // Set dummy localstorage to avoid api.js issues
    originalLocalStorage = window.localStorage;
    window.localStorage = {
      getItem: jest.fn(() => 'dummy_token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
  });

  afterEach(() => {
    window.fetch = originalFetch;
    window.localStorage = originalLocalStorage;
  });

  it('getAll - debería hacer request a /incidencias?page=X', async () => {
    await IncidenciaService.getAll(2);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents?per_page=15&page=2'),
      expect.any(Object)
    );
  });

  it('getById - debería hacer request a /incidencias/id', async () => {
    await IncidenciaService.getById(5);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/5'),
      expect.any(Object)
    );
  });

  it('create - debería enviar POST a /incidencias', async () => {
    const payload = { test: 1 };
    await IncidenciaService.create(payload);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('update - debería enviar PUT a /incidencias/id', async () => {
    const payload = { test: 2 };
    await IncidenciaService.update(10, payload);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/10'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  });

  it('delete - debería enviar DELETE a /incidencias/id', async () => {
    await IncidenciaService.delete(7);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/7'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('getHistorial - debería enviar request a /incidencias/id/historial?page=X', async () => {
    await IncidenciaService.getHistorial(3, 1);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/3/historial?page=1&per_page=15'),
      expect.any(Object)
    );
  });

  it('addComment - debería enviar POST a /incidencias/id/comentarios', async () => {
    await IncidenciaService.addComment(4, 'Mi comentario');
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/4/comentarios'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ comentario: 'Mi comentario' }),
      })
    );
  });
});
