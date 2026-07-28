import { AuthService } from './core/auth.service.js';

const routes = {
  '#/login': 'app-login',
  '#/signup': 'app-signup',
  '#/activate': 'app-activate-account',
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
  '#/playground/mockup-mobile': 'app-mockup-mobile',
};

const PUBLIC_ROUTES = new Set(['#/login', '#/signup']);
const PUBLIC_PREFIXES = ['#/activate'];

function isPublicRoute(hash) {
  if (PUBLIC_ROUTES.has(hash)) return true;
  return PUBLIC_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

function evaluateRouteGuards(hash, isAuthenticated) {
  if (!isAuthenticated) {
    if (!isPublicRoute(hash)) {
      return '#/login';
    }
  } else {
    if (isPublicRoute(hash)) {
      return '#/';
    }

    // Redirect Operador/Supervisor from general incidents page to their own dispatcher dashboard
    if (hash === '#/incidencias') {
      if (AuthService.hasPermission('READ', 'despacho')) {
        return '#/incidencias/despacho';
      }
    }

    // RBAC check via AuthService
    if (!AuthService.canAccessRoute(hash)) {
      return '#/';
    }
  }
  return null;
}

function resolveComponent(hash) {
  let componentName = routes[hash];
  if (!componentName) {
    const basePath = hash.split('?')[0];
    componentName = routes[basePath];
  }
  return componentName || 'app-dashboard';
}

function renderPage(componentName) {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = `<${componentName}></${componentName}>`;
  }
}

/**
 * Renders the page component matching the current window location hash.
 */
function navigate() {
  const hash = window.location.hash || '#/';
  const isAuthenticated = AuthService.isAuthenticated();

  const redirectPath = evaluateRouteGuards(hash, isAuthenticated);
  if (redirectPath) {
    window.location.hash = redirectPath;
    return;
  }

  const componentName = resolveComponent(hash);
  renderPage(componentName);
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
