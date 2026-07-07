import { apiRequest } from './api.js';

export const AuthService = {
  async login(email, password) {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response && response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      // Fetch user profile and permissions from /me
      await this.refreshUser();
    }
    return response;
  },

  async logout() {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth-change'));
      window.location.hash = '#/login';
    }
  },

  async refreshUser() {
    try {
      const response = await apiRequest('/me');
      if (response && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        window.dispatchEvent(new CustomEvent('auth-change'));
      }
      return response.user;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  },

  async refreshToken() {
    try {
      const response = await apiRequest('v1/refresh', { method: 'POST' });
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      }
      return response.access_token;
    } catch (error) {
      console.error('Error rotating token:', error);
      this.logout();
      throw error;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  hasPermission(action, resource = null) {
    if (this.isAdmin()) return true;

    const user = this.getCurrentUser();
    if (!user || !Array.isArray(user.permisos)) return false;

    if (resource) {
      const actionMap = {
        'CREATE': 'Crear',
        'READ': 'Ver',
        'UPDATE': 'Actualizar',
        'DELETE': 'Eliminar'
      };
      const resourceMap = {
        'roles': 'Rol',
        'permisos': 'Permiso',
        'opciones_menu': 'Opción de Menú',
        'usuarios': 'Usuario',
        'categorias_incidencia': 'Categoría de Incidencia',
        'incidencias': 'Incidencia',
        'instituciones': 'Institución',
        'sqa': 'SQA',
        'ubicaciones': 'Ubicación'
      };

      const spanishAction = actionMap[action.toUpperCase()] || action;
      const spanishResource = resourceMap[resource.toLowerCase()] || resource;
      const permissionName = `${spanishAction} ${spanishResource}`;

      return user.permisos.some(
        (p) => p && typeof p === 'string' && p.toLowerCase() === permissionName.toLowerCase()
      );
    }

    return user.permisos.some(
      (p) => p && typeof p === 'string' && p.toLowerCase() === action.toLowerCase()
    );
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user ? !!user.is_admin : false;
  },

  getPaisId() {
    const user = this.getCurrentUser();
    return user ? user.pais_id : null;
  },
};
