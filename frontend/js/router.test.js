import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';

const mockIsAuthenticated = jest.fn();
const mockHasPermission = jest.fn();
const mockCanAccessRoute = jest.fn();
const mockRefreshUser = jest.fn();

jest.unstable_mockModule('./core/auth.service.js', () => ({
  AuthService: {
    isAuthenticated: mockIsAuthenticated,
    hasPermission: mockHasPermission,
    canAccessRoute: mockCanAccessRoute,
    refreshUser: mockRefreshUser,
  },
}));

describe('router', () => {
  let initRouter;

  beforeAll(async () => {
    const mod = await import('./router.js');
    initRouter = mod.initRouter;
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.location.hash = '';
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    window.location.hash = '';
  });

  describe('isPublicRoute', () => {
    it.each([
      { hash: '#/login', componente: 'app-login' },
      { hash: '#/signup', componente: 'app-signup' },
      { hash: '#/activate', componente: 'app-activate-account' },
      { hash: '#/activate?token=abc123', componente: 'app-activate-account' },
    ])('returns true for $hash allowing unauthenticated access', async ({ hash, componente }) => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = hash;

      await initRouter();

      expect(document.getElementById('app').innerHTML).toContain(componente);
    });

    it('returns false for private route #/dashboard, redirects to login', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = '#/dashboard';
      await initRouter();
      expect(window.location.hash).toBe('#/login');
    });

    it('returns false for private route #/usuarios, redirects to login', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = '#/usuarios';
      await initRouter();
      expect(window.location.hash).toBe('#/login');
    });
  });

  describe('evaluateRouteGuards', () => {
    it('returns null for unauthenticated user on public route (no redirect)', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = '#/signup';
      await initRouter();
      expect(window.location.hash).toBe('#/signup');
      expect(document.getElementById('app').innerHTML).toContain('app-signup');
    });

    it('redirects unauthenticated user on private route to #/login', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = '#/opciones-menu';
      await initRouter();
      expect(window.location.hash).toBe('#/login');
    });

    it('redirects authenticated user on public route to #/', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/login';
      await initRouter();
      expect(window.location.hash).toBe('#/');
    });

    it('returns null for authenticated user on accessible private route', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/roles';
      await initRouter();
      expect(document.getElementById('app').innerHTML).toContain('app-role-index');
    });

    it('redirects authenticated user from #/incidencias to #/incidencias/despacho when has READ despacho permission', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockHasPermission.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/incidencias';
      await initRouter();
      expect(window.location.hash).toBe('#/incidencias/despacho');
    });

    it('does not redirect from #/incidencias when user lacks dispatch permission (goes through canAccessRoute)', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockHasPermission.mockReturnValue(false);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/incidencias';
      await initRouter();
      expect(document.getElementById('app').innerHTML).toContain('app-menu-lobby');
    });

    it('redirects to #/ when canAccessRoute returns false', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(false);
      window.location.hash = '#/roles';
      await initRouter();
      expect(window.location.hash).toBe('#/');
    });
  });

  describe('resolveComponent', () => {
    it.each([
      {
        hash: '#/permisos',
        componente: 'app-permission-index',
        descripcion: 'returns component name for exact route match',
      },
      {
        hash: '#/usuarios?page=1&limit=10',
        componente: 'app-user-index',
        descripcion: 'strips query string from hash to resolve route',
      },
      {
        hash: '#/non-existent-route',
        componente: 'app-dashboard',
        descripcion: 'falls back to app-dashboard for unknown route hash',
      },
    ])('$descripcion', async ({ hash, componente }) => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = hash;

      await initRouter();

      expect(document.getElementById('app').innerHTML).toContain(componente);
    });
  });

  describe('renderPage', () => {
    it('sets #app innerHTML with the custom element tag for the given component name', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/';
      await initRouter();
      expect(document.getElementById('app').innerHTML).toBe('<app-dashboard></app-dashboard>');
    });
  });

  describe('navigate', () => {
    it('renders component matching the initial hash', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/categorias';
      await initRouter();
      expect(document.getElementById('app').innerHTML).toContain('app-categorias-index');
    });

    it('renders new component when hashchange triggers navigate', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/';
      await initRouter();
      window.location.hash = '#/tramites/historial';
      window.dispatchEvent(new Event('hashchange'));
      await new Promise(process.nextTick);
      expect(document.getElementById('app').innerHTML).toContain('app-historial-index');
    });

    it('redirects to guard target when guards require it', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/';
      await initRouter();
      window.location.hash = '#/login';
      window.dispatchEvent(new Event('hashchange'));
      await new Promise(process.nextTick);
      expect(window.location.hash).toBe('#/');
    });
  });

  describe('initRouter', () => {
    it('adds hashchange event listener that triggers navigate', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      mockRefreshUser.mockResolvedValue(undefined);
      window.location.hash = '#/';
      await initRouter();
      window.location.hash = '#/ubicaciones';
      window.dispatchEvent(new Event('hashchange'));
      await new Promise(process.nextTick);
      expect(document.getElementById('app').innerHTML).toContain('app-ubicaciones-index');
    });

    it('calls refreshUser when authenticated on init', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRefreshUser.mockResolvedValue({});
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/';
      await initRouter();
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });

    it('skips refreshUser when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      window.location.hash = '#/login';
      await initRouter();
      expect(mockRefreshUser).not.toHaveBeenCalled();
    });

    it('logs error to console when refreshUser fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockIsAuthenticated.mockReturnValue(true);
      mockRefreshUser.mockRejectedValue(new Error('Network error'));
      mockCanAccessRoute.mockReturnValue(true);
      window.location.hash = '#/';
      await initRouter();
      expect(console.error).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('calls navigate on init to render the initial route', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockCanAccessRoute.mockReturnValue(true);
      mockRefreshUser.mockResolvedValue(undefined);
      window.location.hash = '#/permisos';
      await initRouter();
      expect(document.getElementById('app').innerHTML).toContain('app-permission-index');
    });
  });
});
