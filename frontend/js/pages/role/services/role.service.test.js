import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RoleService } from './role.service.js';

describe('RoleService', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] })
      })
    );
    if (!window.localStorage) {
      window.localStorage = { getItem: jest.fn(() => 'fake-token'), setItem: jest.fn(), removeItem: jest.fn() };
    }
  });

  afterEach(() => {
    window.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('getAll - hace una llamada GET a /roles', async () => {
    await RoleService.getAll();
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles'),
      expect.any(Object)
    );
  });

  it('getById - hace una llamada GET a /roles/id', async () => {
    await RoleService.getById(5);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/5'),
      expect.any(Object)
    );
  });

  it('create - hace una llamada POST a /roles', async () => {
    const payload = { nombre: 'Test' };
    await RoleService.create(payload);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    );
  });

  it('update - hace una llamada PUT a /roles/id', async () => {
    const payload = { nombre: 'Updated' };
    await RoleService.update(5, payload);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/5'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) })
    );
  });

  it('delete - hace una llamada DELETE a /roles/id', async () => {
    await RoleService.delete(5);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/5'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('assignPermissions - hace POST a /roles/id/permissions', async () => {
    const payload = { permisos: [1, 2] };
    await RoleService.assignPermissions(5, payload);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/5/permissions'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    );
  });
});
