import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionService } from './permissions.service.js';

describe('PermissionService', () => {
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

  it('getAll - debería hacer request a /permisos', async () => {
    await PermissionService.getAll(1);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permisos?page=1'), expect.any(Object));
  });

  it('getById - debería hacer request a /permisos/id', async () => {
    await PermissionService.getById(5);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permisos/5'), expect.any(Object));
  });

  it('create - debería enviar POST', async () => {
    await PermissionService.create({ name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permisos'), expect.objectContaining({ method: 'POST' }));
  });

  it('update - debería enviar PUT', async () => {
    await PermissionService.update(10, { name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permisos/10'), expect.objectContaining({ method: 'PUT' }));
  });

  it('delete - debería enviar DELETE', async () => {
    await PermissionService.delete(7);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permisos/7'), expect.objectContaining({ method: 'DELETE' }));
  });
});
