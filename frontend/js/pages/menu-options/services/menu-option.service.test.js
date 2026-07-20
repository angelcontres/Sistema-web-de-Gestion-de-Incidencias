import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MenuOptionService } from './menu-option.service.js';

describe('MenuOptionService', () => {
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

  it('getAll - debería hacer request a /opciones-menu', async () => {
    await MenuOptionService.getAll(1);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/opciones-menu'), expect.any(Object));
  });

  it('create - debería enviar POST', async () => {
    await MenuOptionService.create({ name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/opciones-menu'), expect.objectContaining({ method: 'POST' }));
  });

  it('update - debería enviar PUT', async () => {
    await MenuOptionService.update(10, { name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/opciones-menu/10'), expect.objectContaining({ method: 'PUT' }));
  });

  it('delete - debería enviar DELETE', async () => {
    await MenuOptionService.delete(7);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/opciones-menu/7'), expect.objectContaining({ method: 'DELETE' }));
  });
});
