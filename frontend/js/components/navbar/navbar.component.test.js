import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../core/auth.service.js', () => ({
  AuthService: {
    isAuthenticated: jest.fn(() => true),
    getCurrentUser: jest.fn(() => ({ username: 'testuser' })),
    logout: jest.fn(() => Promise.resolve()),
  }
}));

const NAVBAR_TEMPLATE = '<nav id="navbarContainer" class="navbar d-none"><div class="container-fluid"><button id="sidebarToggleBtn" class="btn"></button><button id="logoutBtn" class="dropdown-item"></button><span id="navUserName">Usuario</span><a class="nav-link" href="#/dashboard">Dashboard</a></div></nav>';
const EMPTY_TEMPLATE = '<div></div>';

function setupFetch(template) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });
}

describe('NavbarComponent', () => {
  let AuthService, NavbarComponent;

  beforeAll(async () => {
    const authMod = await import('../../core/auth.service.js');
    AuthService = authMod.AuthService;
    const mod = await import('./navbar.component.js');
    NavbarComponent = mod.NavbarComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.isAuthenticated.mockImplementation(() => true);
    AuthService.getCurrentUser.mockImplementation(() => ({ username: 'testuser', name: 'Test User' }));
    AuthService.logout.mockImplementation(() => Promise.resolve());
    window.location.hash = '#/dashboard';
    document.body.innerHTML = '';
    delete window.localStorage;
    const store = {};
    window.localStorage = {
      getItem: jest.fn((key) => store[key] ?? null),
      setItem: jest.fn((key, val) => { store[key] = String(val); }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { for (const k in store) delete store[k]; }),
      length: 0,
    };
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-navbar', () => {
    expect(customElements.get('app-navbar')).toBe(NavbarComponent);
  });

  it('renderiza template en connectedCallback', async () => {
    setupFetch(NAVBAR_TEMPLATE);
    const el = document.createElement('app-navbar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#navbarContainer')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('registra event listeners en onInit', async () => {
    setupFetch(NAVBAR_TEMPLATE);
    const addSpy = jest.spyOn(window, 'addEventListener');
    const el = document.createElement('app-navbar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(addSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    addSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('desregistra event listeners en disconnectedCallback', async () => {
    setupFetch(NAVBAR_TEMPLATE);
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const el = document.createElement('app-navbar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    document.body.removeChild(el);
    expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    removeSpy.mockRestore();
  });

  describe('renderNavbar', () => {
    it('retorna temprano si no hay navbarContainer', async () => {
      setupFetch(EMPTY_TEMPLATE);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      document.body.removeChild(el);
    });

    it('oculta navbar si no autenticado', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      AuthService.isAuthenticated.mockReturnValue(false);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#navbarContainer').classList.contains('d-none')).toBe(true);
      document.body.removeChild(el);
    });

    it('oculta navbar si hash es #/login', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      window.location.hash = '#/login';
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#navbarContainer').classList.contains('d-none')).toBe(true);
      document.body.removeChild(el);
    });

    it('muestra navbar y setea user name', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const nav = el.querySelector('#navbarContainer');
      expect(nav.classList.contains('d-none')).toBe(false);
      expect(el.querySelector('#navUserName').textContent).toBe('testuser');
      document.body.removeChild(el);
    });

    it('usa name si username no existe', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      AuthService.getCurrentUser.mockReturnValue({ name: 'OnlyName' });
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#navUserName').textContent).toBe('OnlyName');
      document.body.removeChild(el);
    });

    it('muestra Usuario por defecto si no hay user data', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      AuthService.getCurrentUser.mockReturnValue(null);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#navUserName').textContent).toBe('Usuario');
      document.body.removeChild(el);
    });
  });

  describe('sidebarToggleBtn', () => {
    it('dispara toggle-sidebar al hacer click', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      el.querySelector('#sidebarToggleBtn').click();
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
      dispatchSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('no registra listener duplicado en toggleBtn', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const btn = el.querySelector('#sidebarToggleBtn');
      const addSpy = jest.spyOn(btn, 'addEventListener');
      window.dispatchEvent(new Event('auth-change'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      // Should not re-register since dataset.hasListener already set
      expect(addSpy).not.toHaveBeenCalled();
      addSpy.mockRestore();
      document.body.removeChild(el);
    });
  });

  describe('logoutBtn', () => {
    it('llama AuthService.logout al hacer click', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const btn = el.querySelector('#logoutBtn');
      btn.click();
      expect(AuthService.logout).toHaveBeenCalled();
      document.body.removeChild(el);
    });

    it('deshabilita boton durante logout y rehabilita despues', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      let resolveLogout;
      AuthService.logout.mockReturnValue(new Promise((r) => { resolveLogout = r; }));
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const btn = el.querySelector('#logoutBtn');
      btn.click();
      expect(btn.disabled).toBe(true);
      resolveLogout();
      await new Promise(process.nextTick);
      expect(btn.disabled).toBe(false);
      document.body.removeChild(el);
    });

    it('rehabilita boton si logout falla', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      let rejectLogout;
      AuthService.logout.mockReturnValue(new Promise((_, reject) => { rejectLogout = reject; }));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const btn = el.querySelector('#logoutBtn');
      btn.click();
      rejectLogout(new Error('fail'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(btn.disabled).toBe(false);
      errSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('no registra listener duplicado en logoutBtn', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const btn = el.querySelector('#logoutBtn');
      const addSpy = jest.spyOn(btn, 'addEventListener');
      window.dispatchEvent(new Event('auth-change'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(addSpy).not.toHaveBeenCalled();
      addSpy.mockRestore();
      document.body.removeChild(el);
    });
  });

  describe('updateActiveLink', () => {
    it('marca link activo segun hash actual', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      window.location.hash = '#/dashboard';
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const link = el.querySelector('.nav-link[href="#/dashboard"]');
      expect(link.classList.contains('active')).toBe(true);
      expect(link.getAttribute('aria-current')).toBe('page');
      document.body.removeChild(el);
    });

    it('limpia link activo cuando hash no coincide', async () => {
      setupFetch(NAVBAR_TEMPLATE);
      window.location.hash = '#/other';
      const el = document.createElement('app-navbar');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const link = el.querySelector('.nav-link[href="#/dashboard"]');
      expect(link.classList.contains('active')).toBe(false);
      expect(link.hasAttribute('aria-current')).toBe(false);
      document.body.removeChild(el);
    });
  });

  it('re-renderiza en hashchange', async () => {
    setupFetch(NAVBAR_TEMPLATE);
    const el = document.createElement('app-navbar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const spy = jest.spyOn(el, 'renderNavbar');
    window.dispatchEvent(new Event('hashchange'));
    await new Promise(process.nextTick);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    document.body.removeChild(el);
  });

  it('re-renderiza en auth-change', async () => {
    setupFetch(NAVBAR_TEMPLATE);
    const el = document.createElement('app-navbar');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const spy = jest.spyOn(el, 'renderNavbar');
    window.dispatchEvent(new Event('auth-change'));
    await new Promise(process.nextTick);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    document.body.removeChild(el);
  });
});
