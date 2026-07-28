import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../core/api.js', () => ({
  apiRequest: jest.fn()
}));

const LOBBY_TEMPLATE = '<div class="page-fade-in"><div class="page-header-container"><h1 class="page-title" id="lobby-title">Cargando...</h1></div><div class="row g-4" id="lobby-cards-container"></div></div>';

const BASE_MENU = [
  { id: 1, nombre: 'Administración', ruta: '#/administracion', icono: 'bi bi-gear', padre_id: null },
  { id: 2, nombre: 'Usuarios', ruta: '#/usuarios', icono: 'bi bi-people', padre_id: 1 },
  { id: 3, nombre: 'Roles', ruta: '#/roles', icono: 'bi bi-shield', padre_id: 1 },
  { id: 4, nombre: 'Dashboard', ruta: '#/', icono: 'bi bi-speedometer2', padre_id: null },
  { id: 5, nombre: 'Mantenimiento', ruta: '#/mantenimiento', icono: 'bi bi-tools', padre_id: null },
  { id: 6, nombre: 'Categorías', ruta: '#/categorias', icono: 'bi bi-tag', padre_id: 5 },
];

function setupFetch(template) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });
}

describe('MenuLobbyComponent', () => {
  let apiRequest, MenuLobbyComponent, store;

  beforeAll(async () => {
    const apiMod = await import('../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const mod = await import('./menu-lobby.component.js');
    MenuLobbyComponent = mod.MenuLobbyComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    apiRequest.mockResolvedValue(BASE_MENU);
    window.location.hash = '#/administracion';
    document.body.innerHTML = '';
    delete window.localStorage;
    store = {};
    window.localStorage = {
      getItem: jest.fn((key) => store[key] ?? null),
      setItem: jest.fn((key, val) => { store[key] = String(val); }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { for (const k in store) delete store[k]; }),
    };
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-menu-lobby', () => {
    expect(customElements.get('app-menu-lobby')).toBe(MenuLobbyComponent);
  });

  it('renderiza template', async () => {
    setupFetch(LOBBY_TEMPLATE);
    const el = document.createElement('app-menu-lobby');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#lobby-title')).not.toBeNull();
    expect(el.querySelector('#lobby-cards-container')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('registra event listener hashchange en onInit', async () => {
    setupFetch(LOBBY_TEMPLATE);
    const addSpy = jest.spyOn(window, 'addEventListener');
    const el = document.createElement('app-menu-lobby');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(addSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    addSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('desregistra event listener en disconnectedCallback', async () => {
    setupFetch(LOBBY_TEMPLATE);
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const el = document.createElement('app-menu-lobby');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    document.body.removeChild(el);
    expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    removeSpy.mockRestore();
  });

  describe('renderLobby', () => {
    it('retorna temprano si faltan elementos del DOM', async () => {
      setupFetch('<div></div>');
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      document.body.removeChild(el);
    });

    it('carga menu desde localStorage si existe', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.setItem('user_menu', JSON.stringify(BASE_MENU));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const cards = el.querySelectorAll('.menu-lobby-card');
      expect(cards.length).toBe(2);
      expect(el.querySelector('#lobby-title').textContent).toContain('Administración');
      document.body.removeChild(el);
    });

    it('carga menu desde API si no hay localStorage', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.getItem.mockReturnValue(null);
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(apiRequest).toHaveBeenCalledWith('/me/menu', { method: 'GET' });
      expect(localStorage.setItem).toHaveBeenCalled();
      document.body.removeChild(el);
    });

    it('carga menu desde API si localStorage tiene JSON invalido', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.getItem.mockReturnValue('{invalid}');
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(apiRequest).toHaveBeenCalled();
      errSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('carga menu desde API si localStorage tiene array vacio', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.getItem.mockReturnValue(JSON.stringify([]));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(apiRequest).toHaveBeenCalled();
      document.body.removeChild(el);
    });

    it('muestra Menú no encontrado si no hay parentMenu', async () => {
      setupFetch(LOBBY_TEMPLATE);
      window.location.hash = '#/ruta-inexistente';
      localStorage.setItem('user_menu', JSON.stringify(BASE_MENU));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#lobby-title').textContent).toBe('Menú no encontrado');
      document.body.removeChild(el);
    });

    it('muestra mensaje si no hay children', async () => {
      setupFetch(LOBBY_TEMPLATE);
      const singleMenu = [
        { id: 1, nombre: 'Solo', ruta: '#/solo', icono: 'bi bi-dot', padre_id: null },
      ];
      localStorage.setItem('user_menu', JSON.stringify(singleMenu));
      window.location.hash = '#/solo';
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#lobby-cards-container').textContent).toContain('No hay submenús');
      document.body.removeChild(el);
    });

    it('renderiza cards con iconos y enlaces', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.setItem('user_menu', JSON.stringify(BASE_MENU));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const cards = el.querySelectorAll('.menu-lobby-card');
      expect(cards.length).toBe(2);
      const links = el.querySelectorAll('a');
      expect(links[0].getAttribute('href')).toBe('#/usuarios');
      expect(links[1].getAttribute('href')).toBe('#/roles');
      document.body.removeChild(el);
    });

    it('usa bi-dot como icono por defecto cuando child no tiene icono', async () => {
      setupFetch(LOBBY_TEMPLATE);
      const customMenu = [
        { id: 1, nombre: 'Admin', ruta: '#/admin', icono: 'bi bi-gear', padre_id: null },
        { id: 2, nombre: 'SinIcono', ruta: '#/sin-icono', icono: null, padre_id: 1 },
      ];
      localStorage.setItem('user_menu', JSON.stringify(customMenu));
      window.location.hash = '#/admin';
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.innerHTML).toContain('bi-dot');
      document.body.removeChild(el);
    });

    it('convierte ruta sin # a #/', async () => {
      setupFetch(LOBBY_TEMPLATE);
      const customMenu = [
        { id: 1, nombre: 'Admin', ruta: '#/admin', icono: 'bi bi-gear', padre_id: null },
        { id: 2, nombre: 'BadRoute', ruta: 'http://evil.com', icono: 'bi bi-dot', padre_id: 1 },
      ];
      localStorage.setItem('user_menu', JSON.stringify(customMenu));
      window.location.hash = '#/admin';
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const link = el.querySelector('a');
      expect(link.getAttribute('href')).toBe('#/');
      document.body.removeChild(el);
    });

    it('retorna temprano si menuList sigue null despues de fetch', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.getItem.mockReturnValue(null);
      apiRequest.mockResolvedValue(null);
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#lobby-title').textContent).toBe('Cargando...');
      document.body.removeChild(el);
    });

    it('maneja error en fetch de menu', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.getItem.mockReturnValue(null);
      apiRequest.mockRejectedValue(new Error('Network error'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('agrega hover effects a las cards', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.setItem('user_menu', JSON.stringify(BASE_MENU));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const card = el.querySelector('.menu-lobby-card');
      card.dispatchEvent(new Event('mouseenter'));
      expect(card.classList.contains('shadow')).toBe(true);
      expect(card.style.transform).toBe('translateY(-5px)');
      card.dispatchEvent(new Event('mouseleave'));
      expect(card.classList.contains('shadow')).toBe(false);
      expect(card.style.transform).toBe('translateY(0)');
      document.body.removeChild(el);
    });

    it('re-renderiza en hashchange', async () => {
      setupFetch(LOBBY_TEMPLATE);
      localStorage.setItem('user_menu', JSON.stringify(BASE_MENU));
      const el = document.createElement('app-menu-lobby');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      window.location.hash = '#/mantenimiento';
      window.dispatchEvent(new Event('hashchange'));
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      expect(el.querySelector('#lobby-title').textContent).toContain('Mantenimiento');
      const cards = el.querySelectorAll('.menu-lobby-card');
      expect(cards.length).toBe(1);
      document.body.removeChild(el);
    });
  });
});
