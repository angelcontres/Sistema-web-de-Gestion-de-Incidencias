import { apiRequest } from './api.js';
// PermissionsEnum ha sido eliminado para tener verificación completamente dinámica

export const AuthService = {
  async login(email, password) {
    localStorage.removeItem('user_menu');
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
      localStorage.removeItem('user_menu');
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
      
      // Always fetch the menu tree globally on login/refresh
      try {
        const menuResp = await apiRequest('/me/menu', { method: 'GET' });
        const menuList = menuResp.data || menuResp;
        if (menuList) {
          localStorage.setItem('user_menu', JSON.stringify(menuList));
        }
      } catch (err) {
        console.error('Error fetching menu profile:', err);
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
    } catch (e) {
      return null;
    }
  },

  hasPermission(action, resource = null) {
    const user = this.getCurrentUser();
    if (!user || !Array.isArray(user.permisos)) return false;

    if (resource) {
      const key = `${action.toUpperCase()}_${resource.toUpperCase()}`;
      
      // 2. Verificación dinámica
      if (user.permisos.includes(key)) {
        return true;
      }

      return false;
    }

    // Direct permission string check
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

  canAccessRoute(hash) {
    if (!hash || hash === '#/' || hash === '#/login' || hash === '#/public') return true;

    const hashWithoutQuery = hash.split('?')[0];

    const routePermissions = {
      '#/opciones-menu': 'READ_OPCIONES_MENU',
      '#/roles': 'READ_ROLES',
      '#/permisos': 'READ_PERMISOS',
      '#/trp-dashboard': 'READ_TRP',
      '#/usuarios': 'READ_USUARIOS',
      '#/ubicaciones': 'READ_UBICACIONES',
      '#/categorias': 'READ_CATEGORIAS_INCIDENCIA',
      '#/incidencias/despacho': 'READ_DESPACHO_INCIDENCIAS',
      '#/instituciones': 'READ_INSTITUCIONES',
      '#/instituciones/kanban': 'READ_KANBAN',
      '#/tramites/historial': 'READ_HISTORIAL',
    };

    const basePath = hashWithoutQuery.replace(/\/form$/, '').replace(/\/historial$/, '').replace(/\/despacho$/, '').replace(/\/kanban$/, '').replace(/\/estado-individual$/, '');
    const requiredPermission = routePermissions[hashWithoutQuery] || routePermissions[basePath];

    if (requiredPermission) {
      return this.hasPermission(requiredPermission);
    }

    // Por defecto permitimos si no hay un mapeo estricto, ya que el backend lo protegerá.
    return true;
  }
};
