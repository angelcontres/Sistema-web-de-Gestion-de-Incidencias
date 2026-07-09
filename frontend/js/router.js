import { AuthService } from './core/auth.service.js';
import { PermissionsEnum } from './core/permissions.enum.js';

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
  '#/incidencias': 'app-menu-lobby',
  '#/incidencias/form': 'app-incidencia-form',

  '#/incidencias/despacho': 'app-incidencia-supervisor-index',
  '#/instituciones': 'app-institucion-index',
  '#/instituciones/kanban': 'app-kanban-institucion',
  '#/public': 'app-public',
  '#/configuracion': 'app-menu-lobby',

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
      const user = AuthService.getCurrentUser();
      const isSupervisor = user && user.roles && user.roles.some((r) => r.nombre === 'Supervisor');
      if (isSupervisor) {
        window.location.hash = '#/incidencias/despacho';
        return;
      }
    }

    // RBAC: Block non-admins from accessing configuration routes
    const adminRoutes = ['#/opciones-menu', '#/roles', '#/permisos'];
    const basePath = hash.split('?')[0].replace(/\/form$/, '');

    if (adminRoutes.includes(basePath) && !AuthService.isAdmin()) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/ubicaciones based on 'Ver Ubicación' or any sub-resource (País, Territorio, Dirección) permission
    if (
      basePath === '#/ubicaciones' &&
      !AuthService.hasPermission(PermissionsEnum.READ_UBICACIONES) &&
      !AuthService.hasPermission(PermissionsEnum.READ_PAISES) &&
      !AuthService.hasPermission(PermissionsEnum.READ_TERRITORIOS) &&
      !AuthService.hasPermission(PermissionsEnum.READ_DIRECCIONES)
    ) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/categorias based on 'Ver Categoría de Incidencia' permission
    if (basePath === '#/categorias' && !AuthService.hasPermission(PermissionsEnum.READ_CATEGORIAS_INCIDENCIA)) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/incidencias based on 'Ver Incidencia' permission
    if (
      (basePath === '#/incidencias' || basePath === '#/incidencias/despacho') &&
      !AuthService.hasPermission(PermissionsEnum.READ_INCIDENCIAS)
    ) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/tramites based on 'Ver Incidencia' permission
    if (basePath.startsWith('#/tramites') && !AuthService.hasPermission(PermissionsEnum.READ_INCIDENCIAS)) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/instituciones/kanban based on Kanban permissions
    if (basePath === '#/instituciones/kanban' && !AuthService.hasPermission(PermissionsEnum.READ_KANBAN)) {
      window.location.hash = '#/';
      return;
    }

    // Protect #/instituciones based on 'Ver Institución' permission
    if (basePath === '#/instituciones' && !AuthService.hasPermission(PermissionsEnum.READ_INSTITUCIONES)) {
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

  // Refresh user profile details if authenticated on load
  if (AuthService.isAuthenticated()) {
    AuthService.refreshUser().catch((err) => {
      console.error('Error refreshing session from endpoint /me:', err);
    });
  }

  // Trigger initial navigation in case page was loaded with a hash
  navigate();
}
