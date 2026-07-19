import { AuthService } from './core/auth.service.js';

const routes = {
  '#/login': 'app-login',
  '#/': 'app-dashboard',
  '#/opciones-menu': 'app-menu-options-list',
  '#/opciones-menu/form': 'app-menu-options-form',
  '#/roles': 'app-role-index',
  '#/permisos': 'app-permission-index',
  '#/trp-dashboard': 'app-trp-dashboard',
  '#/usuarios': 'app-user-index',
  '#/usuarios/form': 'app-user-form',
  '#/ubicaciones': 'app-ubicaciones-index',
  '#/categorias': 'app-categorias-index',
  '#/incidencias': 'app-menu-lobby',
  '#/incidencias/form': 'app-incidencia-form',

  '#/incidencias/despacho': 'app-incidencia-supervisor-index',
  '#/instituciones': 'app-institucion-index',
  '#/instituciones/kanban': 'app-kanban-institucion',
  '#/public': 'app-public',
  '#/administracion': 'app-menu-lobby',
  '#/mantenimiento': 'app-menu-lobby',

  '#/tramites': 'app-menu-lobby',
  '#/tramites/historial': 'app-historial-index',
  '#/tramites/estado-individual': 'app-estado-individual-incidencia',
};

/**
 * Renders the page component matching the current window location hash.
 */
function navigate() {
  const hash = window.location.hash || '#/';
  const isAuthenticated = AuthService.isAuthenticated();

  // Auth Route Protection
  if (!isAuthenticated) {
    if (hash !== '#/login') {
      window.location.hash = '#/login';
      return;
    }
  } else {
    if (hash === '#/login') {
      window.location.hash = '#/';
      return;
    }

    // Redirect Operador/Supervisor from general incidents page to their own dispatcher dashboard
    if (hash === '#/incidencias') {
      if (AuthService.hasPermission('READ', 'despacho')) {
        window.location.hash = '#/incidencias/despacho';
        return;
      }
    }

    // RBAC check via AuthService
    if (!AuthService.canAccessRoute(hash)) {
      window.location.hash = '#/';
      return;
    }
  }

  // Find component or default to dashboard
  let componentName = routes[hash];
  if (!componentName) {
    const basePath = hash.split('?')[0];
    componentName = routes[basePath];
  }
  if (!componentName) {
    componentName = 'app-dashboard';
  }

  const appContainer = document.getElementById('app');
  if (appContainer) {
    // Clear and render the page component inside the main container
    appContainer.innerHTML = `<${componentName}></${componentName}>`;
  }
}

/**
 * Initializes the routing listeners.
 */
export async function initRouter() {
  // Listen for hash changes
  window.addEventListener('hashchange', navigate);

  // Refresh user profile details if authenticated on load
  if (AuthService.isAuthenticated()) {
    try {
      await AuthService.refreshUser();
    } catch (err) {
      console.error('Error refreshing session from endpoint /me:', err);
    }
  }

  // Trigger initial navigation in case page was loaded with a hash
  navigate();
}
