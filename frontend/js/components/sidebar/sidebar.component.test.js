import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../core/auth.service.js', () => ({
  AuthService: {
    canAccessRoute: jest.fn(() => true),
    isAuthenticated: jest.fn(() => true),
    getCurrentUser: jest.fn(() => ({ username: 'testuser' })),
    logout: jest.fn(),
  }
}));

jest.unstable_mockModule('../../core/api.js', () => ({
  apiRequest: jest.fn()
}));

const SIDEBAR_TEMPLATE = '<nav class="px-3 py-4 d-flex flex-column h-100"><div class="flex-grow-1 overflow-auto"><div id="dynamicMenuContainer" class="nav flex-column gap-2"><div class="d-flex justify-content-center py-5" id="menuLoader"><span>Cargando menú...</span></div></div></div></nav>';

const BASE_MENU = [
  { id: 1, nombre: 'Dashboard', ruta: '#/', icono: 'bi bi-speedometer2', padre_id: null },
  { id: 2, nombre: 'Administración', ruta: '#/administracion', icono: 'bi bi-gear', padre_id: null },
  { id: 3, nombre: 'Usuarios', ruta: '#/usuarios', icono: 'bi bi-people', padre_id: 2 },
  { id: 4, nombre: 'Roles', ruta: '#/roles', icono: 'bi bi-shield', padre_id: 2 },
  { id: 5, nombre: 'Incidencias', ruta: '#/incidencias', icono: 'bi bi-exclamation-triangle', padre_id: null },
  { id: 6, nombre: 'Historial', ruta: '#/incidencias/historial', icono: 'bi bi-clock-history', padre_id: 5 },
];

function setupFetch(template) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });
}

describe('SideBarComponent', () => {
  let AuthService, apiRequest, SideBarComponent, store;

  beforeAll(async () => {
    const authMod = await import('../../core/auth.service.js');
    AuthService = authMod.AuthService;
    const apiMod = await import('../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const mod = await import('./sidebar.component.js');
    SideBarComponent = mod.SideBarComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.canAccessRoute.mockImplementation(() => true);
    AuthService.isAuthenticated.mockImplementation(() => true);
    AuthService.getCurrentUser.mockImplementation(() => ({ username: 'testuser', permisos: [] }));
    apiRequest.mockResolvedValue(BASE_MENU);
    window.location.hash = '#/dashboard';
    delete window.localStorage;
    store = { access_token: 'fake-token' };
    window.localStorage = {
      getItem: jest.fn((key) => store[key] ?? null),
      setItem: jest.fn((key, val) => { store[key] = String(val); }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { for (const k in store) delete store[k]; store.access_token = 'fake-token'; }),
    };
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-sidebar', () => {
    expect(customElements.get('app-sidebar')).toBe(SideBarComponent);
  });

  it('renderiza template en connectedCallback', async () => {
    setupFetch(SIDEBAR_TEMPLATE);
    const el = document.createElement('app-sidebar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#dynamicMenuContainer')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('registra event listeners en onInit', async () => {
    setupFetch(SIDEBAR_TEMPLATE);
    const addSpy = jest.spyOn(window, 'addEventListener');
    const el = document.createElement('app-sidebar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(addSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('toggle-sidebar', expect.any(Function));
    addSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('desregistra event listeners en disconnectedCallback', async () => {
    setupFetch(SIDEBAR_TEMPLATE);
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const el = document.createElement('app-sidebar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    document.body.removeChild(el);
    expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('toggle-sidebar', expect.any(Function));
    removeSpy.mockRestore();
  });

  describe('renderSidebar', () => {
    it('retorna temprano si no hay sidebarContainer', async () => {
      setupFetch('solo texto sin elementos');
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.firstElementChild).toBeNull();
      document.body.removeChild(el);
    });

    it('agrega d-none si no hay token', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      delete store.access_token;
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.classList.contains('d-none')).toBe(true);
      document.body.removeChild(el);
    });

    it('agrega d-none si hash es #/login', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      window.location.hash = '#/login';
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.classList.contains('d-none')).toBe(true);
      document.body.removeChild(el);
    });

    it('agrega collapsed si userHidden es true', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const el = document.createElement('app-sidebar');
      el.dataset.userHidden = 'true';
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.classList.contains('collapsed')).toBe(true);
      expect(el.classList.contains('d-none')).toBe(false);
      document.body.removeChild(el);
    });

    it('carga menu cuando no hay menuLoaded', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue(BASE_MENU);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(apiRequest).toHaveBeenCalledWith('/me/menu', { method: 'GET' });
      expect(el.menuLoaded).toBe(true);
      document.body.removeChild(el);
    });
  });

  describe('loadMenuData', () => {
    it('muestra spinner mientras carga', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockImplementation(() => new Promise(() => {}));
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const loader = el.querySelector('#menuLoader');
      expect(loader).not.toBeNull();
      document.body.removeChild(el);
    });

    it('guarda menu en localStorage y renderiza', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(localStorage.setItem).toHaveBeenCalledWith('user_menu', JSON.stringify(BASE_MENU));
      expect(el.querySelectorAll('.sidebar-link').length).toBeGreaterThan(0);
      document.body.removeChild(el);
    });

    it('maneja error en loadMenuData', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockRejectedValue(new Error('Network error'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('soporta response sin data como array directo', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([{ id: 1, nombre: 'Solo', ruta: '#/solo', icono: 'bi bi-dot', padre_id: null }]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(el.querySelectorAll('.sidebar-link').length).toBe(1);
      document.body.removeChild(el);
    });
  });

  describe('buildMenuTree', () => {
    it('construye jerarquia padre-hijo', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const items = el.querySelectorAll('.sidebar-link');
      expect(items.length).toBeGreaterThanOrEqual(3);
      document.body.removeChild(el);
    });

    it('escapa caracteres HTML en nombre', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'Test & Co <3', ruta: '#/test', icono: 'bi bi-dot', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).toContain('Test &amp; Co &lt;3');
      document.body.removeChild(el);
    });

    it('filtra items segun AuthService.canAccessRoute', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      AuthService.canAccessRoute.mockImplementation((ruta) => ruta === '#/');
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).toContain('Dashboard');
      expect(el.innerHTML).not.toContain('Administración');
      document.body.removeChild(el);
    });

    it('filtra padre si todos sus hijos fueron filtrados', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      AuthService.canAccessRoute.mockImplementation((ruta) => ruta === '#/');
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).not.toContain('administracion');
      document.body.removeChild(el);
    });

    it('ruta invalida se convierte en #/', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'NoRoute', ruta: null, icono: 'bi bi-dot', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).toContain('#/');
      document.body.removeChild(el);
    });

    it('icono invalido se sanitiza a string vacio', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'BadIcon', ruta: '#/bad', icono: '<script>evil</script>', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).not.toContain('script');
      document.body.removeChild(el);
    });
  });

  describe('renderMenuItems', () => {
    it('renderiza items como links directos si no tienen hijos', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'Directo', ruta: '#/directo', icono: 'bi bi-link', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const link = el.querySelector('.sidebar-link');
      expect(link.getAttribute('href')).toBe('#/directo');
      document.body.removeChild(el);
    });

    it('renderiza items con hijos como dropdown con collapse', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const toggles = el.querySelectorAll('[data-bs-toggle="collapse"]');
      expect(toggles.length).toBeGreaterThan(0);
      document.body.removeChild(el);
    });

    it('sidebar-link click expande sidebar si estaba collapsed', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'Solo', ruta: '#/solo', icono: 'bi bi-dot', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
      el.classList.add('collapsed');
      el.dataset.userHidden = 'true';
      el.querySelector('.sidebar-link').click();
      expect(el.dataset.userHidden).toBe('false');
      expect(el.classList.contains('collapsed')).toBe(false);
      document.body.removeChild(el);
    });

    it('sidebar-link click dispara toggle-sidebar en mobile cuando no collapsed', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      apiRequest.mockResolvedValue([
        { id: 1, nombre: 'Solo', ruta: '#/solo', icono: 'bi bi-dot', padre_id: null }
      ]);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
      el.classList.remove('collapsed');
      Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      el.querySelector('.sidebar-link').click();
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'toggle-sidebar' }));
      dispatchSpy.mockRestore();
      document.body.removeChild(el);
    });
  });

  describe('updateActiveLink', () => {
    it('marca link activo segun hash actual', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      window.location.hash = '#/';
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const activeLinks = el.querySelectorAll('.sidebar-link.active');
      expect(activeLinks.length).toBeGreaterThan(0);
      document.body.removeChild(el);
    });

    it('limpia activo cuando hash cambia', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      window.location.hash = '#/';
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      window.location.hash = '#/other';
      window.dispatchEvent(new Event('hashchange'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const activeLinks = el.querySelectorAll('.sidebar-link.active');
      expect(activeLinks.length).toBe(0);
      document.body.removeChild(el);
    });

    it('activa parent collapse y pone text-primary en link padre cuando el hijo esta activo', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      window.location.hash = '#/usuarios';
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 10; i++) await new Promise(process.nextTick);
      const childLink = el.querySelector('[href="#/usuarios"]');
      expect(childLink).not.toBeNull();
      const parentCollapse = childLink.closest('.collapse');
      expect(parentCollapse).not.toBeNull();
      expect(parentCollapse.classList.contains('show')).toBe(true);
      const parentBtn = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
      expect(parentBtn).not.toBeNull();
      const parentLink = parentBtn.closest('.sidebar-link');
      expect(parentLink).not.toBeNull();
      expect(parentLink.classList.contains('text-primary')).toBe(true);
      expect(parentLink.classList.contains('text-dark')).toBe(false);
      document.body.removeChild(el);
    });
  });

  describe('toggle-sidebar event', () => {
    it('alterna collapsed class y backdrop', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const backdrop = document.createElement('div');
      backdrop.id = 'sidebarBackdrop';
      backdrop.classList.add('d-none');
      document.body.appendChild(backdrop);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      expect(el.classList.contains('collapsed')).toBe(true);
      expect(backdrop.classList.contains('d-none')).toBe(true);
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      expect(el.classList.contains('collapsed')).toBe(false);
      expect(backdrop.classList.contains('d-none')).toBe(false);
      document.body.removeChild(el);
      document.body.removeChild(backdrop);
    });

    it('backdrop click dispara toggle-sidebar', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const backdrop = document.createElement('div');
      backdrop.id = 'sidebarBackdrop';
      document.body.appendChild(backdrop);
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      backdrop.click();
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
      dispatchSpy.mockRestore();
      document.body.removeChild(el);
      document.body.removeChild(backdrop);
    });
  });

  describe('auth-change event', () => {
    it('recarga menu en auth-change reseteando menuLoaded', async () => {
      setupFetch(SIDEBAR_TEMPLATE);
      const el = document.createElement('app-sidebar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      apiRequest.mockClear();
      window.dispatchEvent(new Event('auth-change'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(apiRequest).toHaveBeenCalledWith('/me/menu', { method: 'GET' });
      document.body.removeChild(el);
    });
  });
});
