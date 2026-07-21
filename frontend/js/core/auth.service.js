import { apiRequest } from './api.js';
import { CircuitBreaker } from './circuit-breaker.js';

const loginBreaker = new CircuitBreaker(4, 30000); // 4 failures max, 30s lockout

export const AuthService = {
  async login(email, password) {
    return loginBreaker.fire(async () => {
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
    });
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
        const menuList = Array.isArray(menuResp) ? menuResp : (menuResp.data || []);
        localStorage.setItem('user_menu', JSON.stringify(menuList));
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
    if (!user || !Array.isArray(user.permisos)) {
      // console.warn('[AuthService] hasPermission failed: User or user.permisos is missing/invalid.', user);
      return false;
    }

    if (resource) {
      const key = `${action.toUpperCase()}_${resource.toUpperCase()}`;

      // 2. Verificación dinámica
      if (user.permisos.includes(key)) {
        return true;
      }

      // console.warn(`[AuthService] hasPermission failed: User lacks permission ${key}.`, user.permisos);
      return false;
    }

    // console.warn('[AuthService] hasPermission failed: No resource provided.');
    return false;
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
      '#/opciones-menu': { action: 'READ', resource: 'opciones' },
      '#/roles': { action: 'READ', resource: 'roles' },
      '#/permisos': { action: 'READ', resource: 'permisos' },
      '#/trp-dashboard': { action: 'READ', resource: 'trp' },
      '#/usuarios': { action: 'READ', resource: 'usuarios' },
      '#/ubicaciones': { action: 'READ', resource: 'ubicaciones' },
      '#/categorias': { action: 'READ', resource: 'categorias' },
      '#/incidencias': { action: 'READ', resource: 'incidencias' },
      '#/incidencias/despacho': { action: 'READ', resource: 'despacho' },
      '#/instituciones': { action: 'READ', resource: 'instituciones' },
      '#/instituciones/kanban': { action: 'READ', resource: 'kanban' },
      '#/mantenimiento': { action: 'READ', resource: 'mantenimiento' },
      '#/tramites/historial': { action: 'READ', resource: 'historial' },
      '#/administracion': { action: 'READ', resource: 'roles' },
    };

    const basePath = hashWithoutQuery
      .replace(/\/form$/, '')
      .replace(/\/historial$/, '')
      .replace(/\/despacho$/, '')
      .replace(/\/kanban$/, '')
      .replace(/\/estado-individual$/, '');
    const requiredPermission = routePermissions[hashWithoutQuery] || routePermissions[basePath];

    console.log(
      `[AuthService] canAccessRoute: hash=${hash}, hashWithoutQuery=${hashWithoutQuery}, basePath=${basePath}`
    );
    console.log(`[AuthService] requiredPermission=`, requiredPermission);

    if (requiredPermission) {
      const hasPerm = this.hasPermission(requiredPermission.action, requiredPermission.resource);
      console.log(`[AuthService] hasPermission result:`, hasPerm);
      return hasPerm;
    }

    console.log(`[AuthService] canAccessRoute: No route permissions matched, allowing by default.`);
    // Por defecto permitimos si no hay un mapeo estricto, ya que el backend lo protegerá.
    return true;
  },
};
