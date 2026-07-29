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
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/menu-options'), expect.any(Object));
  });

  it('create - debería enviar POST', async () => {
    await MenuOptionService.create({ name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/menu-options'), expect.objectContaining({ method: 'POST' }));
  });

  it('update - debería enviar PUT', async () => {
    await MenuOptionService.update(10, { name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/menu-options/10'), expect.objectContaining({ method: 'PUT' }));
  });

  it('delete - debería enviar DELETE', async () => {
    await MenuOptionService.delete(7);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/menu-options/7'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('getById - debería hacer request a /menu-options/id', async () => {
    await MenuOptionService.getById(5);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/menu-options/5'), expect.any(Object));
  });

  it('getAll - debería incluir all=true cuando params.all es true', async () => {
    await MenuOptionService.getAll(1, 15, null, { all: true });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('all=true'), expect.any(Object));
  });

  it('getAll - debería usar cursor cuando se proporciona uno', async () => {
    await MenuOptionService.getAll(1, 15, 'cursorXYZ');
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('cursor=cursorXYZ'), expect.any(Object));
  });
});
