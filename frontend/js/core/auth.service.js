import { apiRequest } from './api.js';

export const AuthService = {
  async login(email, password) {
    const response = await apiRequest('/v1/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response && response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  async logout() {
    try {
      await apiRequest('/v1/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth-change'));
      window.location.hash = '#/login';
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

  hasPermission(accion, recurso) {
    if (this.isAdmin()) return true;

    const user = this.getCurrentUser();
    if (!user || !Array.isArray(user.permisos)) return false;

    return user.permisos.some(
      (p) =>
        p &&
        p.accion &&
        p.recurso &&
        p.accion.toUpperCase() === accion.toUpperCase() &&
        p.recurso.toLowerCase() === recurso.toLowerCase()
    );
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user ? !!user.is_admin : false;
  },
};
