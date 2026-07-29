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

  it('getAll - debería hacer request a /permissions with page', async () => {
    await PermissionService.getAll(1);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions?page=1'), expect.any(Object));
  });

  it('getAll - sin argumentos debería ir a /permissions sin query', async () => {
    await PermissionService.getAll();
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions'), expect.any(Object));
  });

  it('getAll - debería incluir filters sin page', async () => {
    await PermissionService.getAll(null, 'name=test');
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('?name=test'), expect.any(Object));
  });

  it('getAll - debería concatenar page y filters', async () => {
    await PermissionService.getAll(2, 'status=active');
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('?page=2&status=active'), expect.any(Object));
  });

  it('getById - debería hacer request a /permissions/id', async () => {
    await PermissionService.getById(5);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions/5'), expect.any(Object));
  });

  it('create - debería enviar POST', async () => {
    await PermissionService.create({ name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions'), expect.objectContaining({ method: 'POST' }));
  });

  it('update - debería enviar PUT', async () => {
    await PermissionService.update(10, { name: 'test' });
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions/10'), expect.objectContaining({ method: 'PUT' }));
  });

  it('delete - debería enviar DELETE', async () => {
    await PermissionService.delete(7);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions/7'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('getAllList - debería hacer request a /permissions?all=true', async () => {
    await PermissionService.getAllList();
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/permissions?all=true'), expect.any(Object));
  });
});
