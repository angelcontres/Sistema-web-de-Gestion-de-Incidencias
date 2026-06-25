import { AuthService } from './core/auth.service.js';

const routes = {
  '#/login': 'app-login',
  '#/': 'app-dashboard',
  '#/opciones-menu': 'app-menu-options-list',
  '#/opciones-menu/form': 'app-menu-options-form',
  '#/roles': 'app-role-index',
  '#/permisos': 'app-permission-index',
  '#/usuarios': 'app-user-index',
  '#/usuarios/form': 'app-user-form',
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
      console.error('Error refreshing session from /v1/me:', err);
    });
  }

  // Trigger initial navigation in case page was loaded with a hash
  navigate();
}
