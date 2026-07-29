import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserService } from './user.service.js';

describe('UserService', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
    window.fetch = global.fetch;
    Storage.prototype.getItem = jest.fn(() => 'token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
    delete window.fetch;
  });

  it('getAll debería usar el parámetro por defecto (page = 1) si no se le pasa argumento', async () => {
    // Llamamos a la función sin pasarle parámetros para forzar el valor por defecto
    await UserService.getAll();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users?page=1'),
      expect.any(Object)
    );
  });

  it('getAll debería llamar al endpoint correcto', async () => {
    await UserService.getAll(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users?page=1'),
      expect.any(Object)
    );
  });

  it('getById debería llamar al endpoint correcto', async () => {
    await UserService.getById(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/5'),
      expect.any(Object)
    );
  });

  it('create debería hacer POST con payload', async () => {
    const payload = { username: 'test' };
    await UserService.create(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('update debería hacer PUT con payload', async () => {
    const payload = { username: 'test' };
    await UserService.update(5, payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/5'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  });

  it('delete debería hacer DELETE', async () => {
    await UserService.delete(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/5'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('getAll debería usar cursor cuando se proporciona uno', async () => {
    await UserService.getAll(1, 15, 'cursor123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('cursor=cursor123'),
      expect.any(Object)
    );
  });
});
