import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../environment/environment.js', () => ({
  environment: { apiBaseUrl: 'http://test/api' }
}));

const { apiRequest, API_BASE_URL } = await import('./api.js');

describe('API_BASE_URL', () => {
  it('se construye desde environment.apiBaseUrl', () => {
    expect(API_BASE_URL).toBe('http://test/api/v1');
  });
});

describe('apiRequest', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.localStorage;
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('hace fetch a la URL correcta y retorna JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' })
    });
    const result = await apiRequest('/test');
    expect(global.fetch).toHaveBeenCalledWith('http://test/api/v1/test', expect.any(Object));
    expect(result).toEqual({ data: 'ok' });
  });

  it('incluye Authorization header cuando hay token', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'my-token';
      return null;
    });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' })
    });
    await apiRequest('/secure');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Authorization']).toBe('Bearer my-token');
  });

  it('no incluye Authorization cuando no hay token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    await apiRequest('/public');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Authorization']).toBeUndefined();
  });

  it('incluye Content-Type y Accept por defecto', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    await apiRequest('/test');
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Content-Type']).toBe('application/json');
    expect(callArgs.headers['Accept']).toBe('application/json');
  });

  it('combina opciones pasadas con headers por defecto', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    await apiRequest('/test', { method: 'POST', headers: { 'X-Custom': 'val' } });
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.headers['X-Custom']).toBe('val');
  });

  it('maneja 401 en endpoint no-login: limpia token y redirige', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'expired';
      return null;
    });
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthenticated' })
    });
    const originalHash = window.location.hash;
    window.location.hash = '#/dashboard';

    await apiRequest('/me');

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.hash).toBe('#/login');
    window.location.hash = originalHash;
  });

  it('no redirige a login si el endpoint es /login aunque sea 401', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' })
    });
    window.location.hash = '#/login';
    await apiRequest('/login');
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/login');
  });

  it('dispara evento api-forbidden en 403', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden' })
    });
    await apiRequest('/admin');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'api-forbidden',
        detail: { message: 'Forbidden' }
      })
    );
  });

  it('extrae el primer error de validacion en 422', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: 'Validation failed',
        errors: { email: ['El email ya existe'], password: ['Muy corto'] }
      })
    });
    const result = await apiRequest('/register');
    expect(result.message).toBe('Validation failed');
    expect(console.error).toHaveBeenCalledWith('El email ya existe');
  });

  it('transforma SQLSTATE 23505 a mensaje amigable', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message: 'SQLSTATE[23505]: unique constraint violation'
      })
    });
    await apiRequest('/create');
    expect(console.error).toHaveBeenCalledWith(
      'Error de integridad: Ya existe un registro con esa información única (ej. email duplicado).'
    );
  });

  it('transforma SQLSTATE generico a mensaje de seguridad', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message: 'SQLSTATE[22001]: some other database error'
      })
    });
    await apiRequest('/create');
    expect(console.error).toHaveBeenCalledWith(
      'Ocurrió un error en el servidor al intentar procesar los datos (Operación abortada por seguridad).'
    );
  });

  it('retorna undefined si JSON falla al parsear', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new Error('parse error'); }
    });
    const result = await apiRequest('/bad-json');
    expect(result).toBeUndefined();
  });
});
