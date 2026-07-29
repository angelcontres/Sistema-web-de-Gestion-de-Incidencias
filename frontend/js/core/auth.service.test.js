import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('./api.js', () => ({
  apiRequest: jest.fn(),
  API_BASE_URL: 'http://test/api'
}));

const { AuthService } = await import('./auth.service.js');
const { apiRequest } = await import('./api.js');

describe('AuthService', () => {
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
    apiRequest.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.localStorage;
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const userData = { name: 'Test', email: 'test@test.com', password: '123456' };

    it('registra y guarda token si response tiene access_token', async () => {
      apiRequest.mockResolvedValue({ access_token: 'new-token', user: { id: 1 } });
      apiRequest.mockResolvedValueOnce({ access_token: 'new-token' });
      apiRequest.mockResolvedValueOnce({ user: { id: 1, name: 'Test' } });
      await AuthService.register(userData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
    });

    it('lanza error si response no tiene access_token', async () => {
      apiRequest.mockResolvedValue({ message: 'Error' });
      await expect(AuthService.register(userData)).rejects.toThrow('Error');
    });

    it('lanza error con status 422 si response tiene errors', async () => {
      apiRequest.mockResolvedValue({ message: 'Validation failed', errors: { email: ['Ya existe'] } });
      try {
        await AuthService.register(userData);
      } catch (e) {
        expect(e.status).toBe(422);
      }
    });
  });

  describe('login', () => {
    it('guarda token y hace refresh en login exitoso', async () => {
      apiRequest.mockResolvedValue({ access_token: 'login-token' });
      apiRequest.mockResolvedValueOnce({ access_token: 'login-token' });
      apiRequest.mockResolvedValueOnce({ user: { id: 1 } });
      await AuthService.login('user', 'pass');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'login-token');
    });

    it('almacena el token y llama apiRequest', async () => {
      apiRequest.mockResolvedValue({ access_token: 'login-token' });
      apiRequest.mockResolvedValueOnce({ access_token: 'login-token' });
      apiRequest.mockResolvedValueOnce({ user: { id: 1 } });
      await AuthService.login('user', 'pass');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'login-token');
      expect(apiRequest).toHaveBeenCalled();
    });

    it('lanza error si login falla', async () => {
      apiRequest.mockRejectedValue(new Error('Credenciales invalidas'));
      await expect(AuthService.login('bad', 'creds')).rejects.toThrow('Credenciales invalidas');
    });

    it('response sin access_token lanza error estructurado', async () => {
      apiRequest.mockResolvedValue({ message: 'Invalid credentials' });
      await expect(AuthService.login('user', 'pass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('llama apiRequest y limpia localStorage', async () => {
      apiRequest.mockResolvedValue({});
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      await AuthService.logout();
      expect(apiRequest).toHaveBeenCalledWith('/logout', { method: 'POST' });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_menu');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-change' }));
    });

    it('limpia localStorage aunque apiRequest falle', async () => {
      apiRequest.mockRejectedValue(new Error('Network error'));
      await AuthService.logout();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
    });
  });

  describe('refreshUser', () => {
    it('guarda usuario y dispatches evento si response tiene user', async () => {
      apiRequest.mockResolvedValue({ user: { id: 1, name: 'Test' } });
      apiRequest.mockResolvedValueOnce({ user: { id: 1, name: 'Test' } });
      apiRequest.mockResolvedValueOnce([]);
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      const result = await AuthService.refreshUser();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, name: 'Test' }));
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-change' }));
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('lanza error si apiRequest falla', async () => {
      apiRequest.mockRejectedValue(new Error('Network'));
      await expect(AuthService.refreshUser()).rejects.toThrow('Network');
    });

    it('menu fetch falla y el error se registra', async () => {
      apiRequest.mockResolvedValueOnce({ user: { id: 1 } });
      apiRequest.mockRejectedValueOnce(new Error('Menu error'));
      const result = await AuthService.refreshUser();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1 }));
      expect(console.error).toHaveBeenCalledWith('Error fetching menu profile:', expect.any(Error));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('isAuthenticated', () => {
    it('retorna true si existe access_token', () => {
      mockLocalStorage.getItem.mockReturnValue('some-token');
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('retorna false si no existe token', () => {
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('retorna el usuario parseado desde localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: 5, name: 'Juan' }));
      expect(AuthService.getCurrentUser()).toEqual({ id: 5, name: 'Juan' });
    });

    it('retorna null si no hay usuario', () => {
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    it('retorna null si el JSON es invalido', () => {
      mockLocalStorage.getItem.mockReturnValue('not-json');
      expect(AuthService.getCurrentUser()).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('retorna true si el permiso existe en user.permisos', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        permisos: ['READ_INCIDENCIAS', 'WRITE_ROLES']
      }));
      expect(AuthService.hasPermission('READ', 'incidencias')).toBe(true);
    });

    it('retorna false si el permiso no existe', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ permisos: ['READ_INCIDENCIAS'] }));
      expect(AuthService.hasPermission('WRITE', 'incidencias')).toBe(false);
    });

    it('retorna false si no hay user', () => {
      expect(AuthService.hasPermission('READ', 'test')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('retorna true si user.is_admin es true', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ is_admin: true }));
      expect(AuthService.isAdmin()).toBe(true);
    });

    it('retorna false si user.is_admin es false', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ is_admin: false }));
      expect(AuthService.isAdmin()).toBe(false);
    });
  });

  describe('getPaisId', () => {
    it('retorna pais_id del usuario', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ pais_id: 2 }));
      expect(AuthService.getPaisId()).toBe(2);
    });

    it('retorna null si no hay usuario', () => {
      expect(AuthService.getPaisId()).toBeNull();
    });
  });

  describe('getUserId', () => {
    it('retorna id del usuario', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: 10 }));
      expect(AuthService.getUserId()).toBe(10);
    });

    it('retorna null si no hay usuario', () => {
      expect(AuthService.getUserId()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('retorna el token desde localStorage cuando existe', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(AuthService.getToken()).toBe('test-token');
    });

    it('retorna null cuando no hay token', () => {
      expect(AuthService.getToken()).toBeNull();
    });
  });

  describe('setUser', () => {
    it('guarda el usuario en localStorage como JSON', () => {
      const user = { id: 1, name: 'Test' };
      AuthService.setUser(user);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });
  });

  describe('getUserRole', () => {
    it('retorna el rol del usuario cuando existe', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ rol: 'admin' }));
      expect(AuthService.getUserRole()).toBe('admin');
    });

    it('retorna null si no hay usuario', () => {
      expect(AuthService.getUserRole()).toBeNull();
    });
  });

  describe('handleAuthError', () => {
    it('elimina token, usuario y dispatches evento', () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      AuthService.handleAuthError();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_menu');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-change' }));
    });
  });

  describe('getPermissions', () => {
    it('retorna los permisos del usuario cuando existen', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ permisos: ['READ', 'WRITE'] }));
      expect(AuthService.getPermissions()).toEqual(['READ', 'WRITE']);
    });

    it('retorna array vacio si no hay permisos en el usuario', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));
      expect(AuthService.getPermissions()).toEqual([]);
    });

    it('retorna array vacio si no hay usuario', () => {
      expect(AuthService.getPermissions()).toEqual([]);
    });
  });

  describe('hasPermission with single argument', () => {
    it('retorna true si el permiso existe en el array', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ permisos: ['READ_INCIDENCIAS', 'WRITE_ROLES'] }));
      expect(AuthService.hasPermission('READ_INCIDENCIAS')).toBe(true);
    });

    it('retorna false si el permiso no existe', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ permisos: ['READ_INCIDENCIAS'] }));
      expect(AuthService.hasPermission('WRITE_ROLES')).toBe(false);
    });

    it('retorna false si el argumento no es un string', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ permisos: ['READ_INCIDENCIAS', 'WRITE_ROLES'] }));
      expect(AuthService.hasPermission(123)).toBe(false);
    });
  });

  describe('canAccessRoute', () => {
    it('permite acceso a rutas publicas', () => {
      expect(AuthService.canAccessRoute('#/')).toBe(true);
      expect(AuthService.canAccessRoute('#/login')).toBe(true);
      expect(AuthService.canAccessRoute('#/public')).toBe(true);
    });

    it('permite acceso si el hash esta en user_menu', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'user_menu') return JSON.stringify([{ ruta: '#/roles' }]);
        if (key === 'user') return JSON.stringify({ permisos: ['READ_ROLES'] });
        return null;
      });
      expect(AuthService.canAccessRoute('#/roles')).toBe(true);
    });

    it('chequea permisos para rutas protegidas si no esta en menu', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'user_menu') return JSON.stringify([]);
        if (key === 'user') return JSON.stringify({ permisos: ['READ_ROLES'] });
        return null;
      });
      expect(AuthService.canAccessRoute('#/roles')).toBe(true);
    });

    it('JSON parse error en user_menu falls through', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'user_menu') return 'invalid json';
        if (key === 'user') return JSON.stringify({ permisos: ['READ_ROLES'] });
        return null;
      });
      expect(AuthService.canAccessRoute('#/roles')).toBe(true);
    });

    it('base path normalization removes /form suffix', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify({ permisos: [] });
        return null;
      });
      expect(AuthService.canAccessRoute('#/roles/form')).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('success', async () => {
      apiRequest.mockResolvedValue({ access_token: 'new-token' });
      const result = await AuthService.refreshToken();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
      expect(result).toBe('new-token');
    });

    it('error', async () => {
      apiRequest.mockRejectedValue(new Error('fail'));
      jest.spyOn(AuthService, 'logout').mockImplementation(() => {});
      await expect(AuthService.refreshToken()).rejects.toThrow('fail');
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });
});
