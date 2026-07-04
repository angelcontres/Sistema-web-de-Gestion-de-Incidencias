import { AuthService } from './core/auth.service.js';

const routes = {
  '#/login': 'app-login',
  '#/': 'app-dashboard',
  '#/opciones-menu': 'app-menu-options-list',
  '#/opciones-menu/form': 'app-menu-options-form',
  '#/roles': 'app-role-index',
  '#/permisos': 'app-permission-index',
  '#/sqa-dashboard': 'app-sqa-dashboard',
  '#/usuarios': 'app-user-index',
  '#/usuarios/form': 'app-user-form',
  '#/ubicaciones': 'app-ubicaciones-index',
  '#/categorias': 'app-categorias-index',
  '#/incidencias': 'app-incidencia-index',
  '#/incidencias/form': 'app-incidencia-form',
  '#/instituciones': 'app-institucion-index',
  '#/public': 'app-public',
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

    // RBAC: Block non-admins from accessing configuration routes
    const adminRoutes = ['#/opciones-menu', '#/roles', '#/permisos'];
    const basePath = hash.split('?')[0].replace(/\/form$/, '');

    if (adminRoutes.includes(basePath) && !AuthService.isAdmin()) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/ubicaciones based on 'Ver Ubicación' permission
    if (basePath === '#/ubicaciones' && !AuthService.hasPermission('Ver Ubicación')) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/categorias based on 'Ver Categoría de Incidencia' permission
    if (basePath === '#/categorias' && !AuthService.hasPermission('Ver Categoría de Incidencia')) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/incidencias based on 'Ver Incidencia' permission
    if (basePath === '#/incidencias' && !AuthService.hasPermission('Ver Incidencia')) {
    // Protect #/instituciones based on 'Ver Institución' permission (si existiese)
    if (basePath === '#/instituciones' && !AuthService.hasPermission('Ver Institución')) {
      // Asumimos que tienen un permiso equivalente, o simplemente lo dejamos libre para usuarios logueados si no hay permiso específico aún.
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
export function initRouter() {
  // Listen for hash changes
  window.addEventListener('hashchange', navigate);

  // Handle initial page load
  window.addEventListener('load', navigate);

  // Refresh user profile details if authenticated on load
  if (AuthService.isAuthenticated()) {
    AuthService.refreshUser().catch((err) => {
      console.error('Error refreshing session from endpoint /me:', err);
    });
  }

  // Trigger initial navigation in case page was loaded with a hash
  navigate();
}
