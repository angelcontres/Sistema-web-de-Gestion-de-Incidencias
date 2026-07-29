import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';

const mockApiRequest = jest.fn();
const mockInitEcho = jest.fn();
const mockGetUserId = jest.fn();

jest.unstable_mockModule('../../../core/api.js', () => ({
  apiRequest: mockApiRequest,
}));

jest.unstable_mockModule('../../../core/echo.js', () => ({
  initEcho: mockInitEcho,
}));

jest.unstable_mockModule('../../../core/auth.service.js', () => ({
  AuthService: {
    getUserId: mockGetUserId,
  },
}));

const TEMPLATE = `
  <div>
    <span id="notificationBadge" class="d-none">0</span>
    <div id="dynamicNotificationsContainer"></div>
    <a href="#" id="btnReadAll">Marcar todas leídas</a>
  </div>
`;

describe('NotificationTrayComponent', () => {
  let NotificationTrayComponent;

  beforeAll(async () => {
    if (!customElements.get('app-notification-card')) {
      customElements.define('app-notification-card', class extends HTMLElement {
        setData() {}
      });
    }
    const mod = await import('./notification-tray.component.js');
    NotificationTrayComponent = mod.NotificationTrayComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => TEMPLATE });
    mockApiRequest.mockResolvedValue({ unread_count: 0, notifications: [] });
    mockGetUserId.mockReturnValue(null);
    mockInitEcho.mockReturnValue(null);
    delete window.localStorage;
    const store = {};
    window.localStorage = {
      getItem: jest.fn((key) => store[key] ?? null),
      setItem: jest.fn((key, val) => { store[key] = String(val); }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { for (const k in store) delete store[k]; }),
      length: 0,
    };
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('componente se define como custom element app-notification-tray', () => {
    expect(customElements.get('app-notification-tray')).toBe(NotificationTrayComponent);
  });

  it('onInit llama loadNotifications y setupWebSocket y registra listeners', async () => {
    const loadSpy = jest.spyOn(NotificationTrayComponent.prototype, 'loadNotifications');
    const wsSpy = jest.spyOn(NotificationTrayComponent.prototype, 'setupWebSocket');
    const addSpy = jest.spyOn(window, 'addEventListener');

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(loadSpy).toHaveBeenCalled();
    expect(wsSpy).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('notifications-changed', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('notification-read', expect.any(Function));

    loadSpy.mockRestore();
    wsSpy.mockRestore();
    addSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('loadNotifications carga notificaciones y llama renderList y updateBadge', async () => {
    localStorage.setItem('access_token', 'test-token');
    mockApiRequest.mockResolvedValue({
      unread_count: 3,
      notifications: [
        { id: 1, data: { title: 'Notif 1' } },
        { id: 2, data: { title: 'Notif 2' } },
      ],
    });

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const container = el.querySelector('#dynamicNotificationsContainer');
    const cards = container.querySelectorAll('app-notification-card');
    expect(cards.length).toBe(2);

    const badge = el.querySelector('#notificationBadge');
    expect(badge.textContent).toBe('3');
    expect(badge.classList.contains('d-none')).toBe(false);

    document.body.removeChild(el);
  });

  it('loadNotifications muestra mensaje de error en fallo', async () => {
    localStorage.setItem('access_token', 'test-token');
    mockApiRequest.mockRejectedValue(new Error('Network error'));

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.notificationsLoaded = false;
    mockApiRequest.mockRejectedValue(new Error('Network error'));
    await el.loadNotifications();

    const container = el.querySelector('#dynamicNotificationsContainer');
    expect(container.innerHTML).toContain('Error de comunicaci');

    document.body.removeChild(el);
  });

  it('loadNotifications muestra spinner mientras carga', async () => {
    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    localStorage.setItem('access_token', 'test-token');
    let resolveApi;
    mockApiRequest.mockReturnValue(new Promise((r) => { resolveApi = r; }));

    el.notificationsLoaded = false;
    const container = el.querySelector('#dynamicNotificationsContainer');
    container.innerHTML = '';

    const promise = el.loadNotifications();
    expect(container.innerHTML).toContain('spinner-border');

    resolveApi({ unread_count: 0, notifications: [] });
    await promise;

    document.body.removeChild(el);
  });

  it('loadNotifications retorna temprano si no hay token', async () => {
    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    mockApiRequest.mockClear();
    await el.loadNotifications();

    expect(mockApiRequest).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('renderList renderiza tarjetas de notificacion', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;

    const notifications = [
      { id: 1, data: { message: 'Test 1' } },
      { id: 2, data: { message: 'Test 2' } },
      { id: 3, data: { message: 'Test 3' } },
    ];

    el.renderList(notifications);

    const container = el.querySelector('#dynamicNotificationsContainer');
    const cards = container.querySelectorAll('app-notification-card');
    expect(cards.length).toBe(3);
    expect(container.innerHTML).not.toContain('No hay incidencias');
  });

  it('renderList muestra mensaje vacio cuando no hay notificaciones', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;

    el.renderList([]);
    let container = el.querySelector('#dynamicNotificationsContainer');
    expect(container.innerHTML).toContain('No hay incidencias');

    el.renderList(null);
    container = el.querySelector('#dynamicNotificationsContainer');
    expect(container.innerHTML).toContain('No hay incidencias');

    el.renderList(undefined);
    container = el.querySelector('#dynamicNotificationsContainer');
    expect(container.innerHTML).toContain('No hay incidencias');
  });

  it('updateBadge muestra/oculta badge correctamente y cap en 99+', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    const badge = el.querySelector('#notificationBadge');

    el.updateBadge(0);
    expect(badge.classList.contains('d-none')).toBe(true);

    el.updateBadge(null);
    expect(badge.classList.contains('d-none')).toBe(true);

    el.updateBadge(5);
    expect(badge.classList.contains('d-none')).toBe(false);
    expect(badge.textContent).toBe('5');

    el.updateBadge(100);
    expect(badge.textContent).toBe('99+');
    expect(badge.classList.contains('d-none')).toBe(false);
  });

  it('getBadgeCount retorna el contador correcto', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    const badge = el.querySelector('#notificationBadge');

    expect(el.getBadgeCount()).toBe(0);

    badge.classList.remove('d-none');
    badge.textContent = '7';
    expect(el.getBadgeCount()).toBe(7);

    badge.textContent = '99+';
    expect(el.getBadgeCount()).toBe(99);

    badge.textContent = 'abc';
    expect(el.getBadgeCount()).toBe(0);
  });

  it('incrementBadge y decrementBadge funcionan', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    const badge = el.querySelector('#notificationBadge');

    badge.classList.remove('d-none');
    badge.textContent = '5';

    el.incrementBadge();
    expect(badge.textContent).toBe('6');

    el.decrementBadge();
    expect(badge.textContent).toBe('5');

    badge.textContent = '0';
    el.decrementBadge();
    expect(badge.textContent).toBe('0');
  });

  it('markAllAsRead llama apiRequest y dispara evento', async () => {
    mockApiRequest.mockResolvedValue({});

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await el.markAllAsRead();

    expect(mockApiRequest).toHaveBeenCalledWith('/notificaciones/leer-todas', { method: 'PUT' });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));

    dispatchSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('handleRealtimeNotification crea tarjeta, antepone al container, incrementa badge', async () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    document.body.appendChild(el);

    const container = el.querySelector('#dynamicNotificationsContainer');
    container.innerHTML = '<div>existing</div>';

    const badge = el.querySelector('#notificationBadge');
    badge.classList.remove('d-none');
    badge.textContent = '5';

    const notif = { id: 100, data: { title: 'Test', message: 'Hello' } };
    el.handleRealtimeNotification(notif);

    const cards = container.querySelectorAll('app-notification-card');
    expect(cards.length).toBe(1);

    expect(badge.textContent).toBe('6');

    document.body.removeChild(el);
  });

  it('disconnectedCallback remueve listeners y websocket', async () => {
    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const disconnectSpy = jest.spyOn(NotificationTrayComponent.prototype, 'disconnectWebSocket');

    document.body.removeChild(el);

    expect(removeSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('notifications-changed', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('notification-read', expect.any(Function));
    expect(disconnectSpy).toHaveBeenCalled();

    removeSpy.mockRestore();
    disconnectSpy.mockRestore();
  });

  it('setupWebSocket sin userId loggea warning', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se puede conectar a WebSocket')
    );

    warnSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('setupWebSocket con userId pero initEcho devuelve null retorna temprano', async () => {
    mockGetUserId.mockReturnValue(42);
    mockInitEcho.mockReturnValue(null);

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(el.echoInstance).toBeNull();

    document.body.removeChild(el);
  });

  it('setupWebSocket conecta a canal privado con ID de usuario correcto', async () => {
    mockGetUserId.mockReturnValue(42);
    const mockEcho = {
      private: jest.fn().mockReturnThis(),
      notification: jest.fn(),
      leave: jest.fn(),
    };
    mockInitEcho.mockReturnValue(mockEcho);

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(mockInitEcho).toHaveBeenCalled();
    expect(mockEcho.private).toHaveBeenCalledWith('App.Models.User.42');
    expect(mockEcho.notification).toHaveBeenCalledWith(expect.any(Function));

    document.body.removeChild(el);
  });

  it('setupWebSocket ejecuta handleRealtimeNotification al recibir notificacion', async () => {
    mockGetUserId.mockReturnValue(42);
    let notificationCb;
    const mockEcho = {
      private: jest.fn().mockReturnThis(),
      notification: jest.fn((cb) => { notificationCb = cb; }),
      leave: jest.fn(),
    };
    mockInitEcho.mockReturnValue(mockEcho);

    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const badge = el.querySelector('#notificationBadge');
    badge.classList.remove('d-none');
    badge.textContent = '3';

    const handlerSpy = jest.spyOn(el, 'handleRealtimeNotification');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    notificationCb({ id: 99, data: { title: 'RT test' } });

    expect(logSpy).toHaveBeenCalledWith('Nueva alerta', { id: 99, data: { title: 'RT test' } });
    expect(handlerSpy).toHaveBeenCalledWith({ id: 99, data: { title: 'RT test' } });
    expect(badge.textContent).toBe('4');

    logSpy.mockRestore();
    handlerSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('handleRealtimeNotification limpia empty-message si existe', () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    const container = el.querySelector('#dynamicNotificationsContainer');
    container.innerHTML = '<p class="empty-message">No hay incidencias</p>';

    el.handleRealtimeNotification({ id: 1, data: { title: 'Test' } });

    expect(container.querySelector('.empty-message')).toBeNull();
    expect(container.querySelectorAll('app-notification-card').length).toBe(1);
  });

  it('evento auth-change dispara onAuthChange callback', async () => {
    mockGetUserId.mockReturnValue(42);
    mockInitEcho.mockReturnValue(null);
    localStorage.setItem('access_token', 'test-token');
    mockApiRequest.mockResolvedValue({ unread_count: 0, notifications: [] });

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.notificationsLoaded = true;
    const disconnectSpy = jest.spyOn(el, 'disconnectWebSocket');
    const loadSpy = jest.spyOn(el, 'loadNotifications');
    const wsSpy = jest.spyOn(el, 'setupWebSocket');

    window.dispatchEvent(new Event('auth-change'));

    expect(el.notificationsLoaded).toBe(false);
    expect(disconnectSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(wsSpy).toHaveBeenCalled();

    disconnectSpy.mockRestore();
    loadSpy.mockRestore();
    wsSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('evento notification-read dispara decrementBadge', async () => {
    localStorage.setItem('access_token', 'test-token');
    mockApiRequest.mockResolvedValue({ unread_count: 3, notifications: [] });
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const badge = el.querySelector('#notificationBadge');
    badge.classList.remove('d-none');
    badge.textContent = '5';

    window.dispatchEvent(new Event('notification-read'));

    expect(badge.textContent).toBe('4');

    document.body.removeChild(el);
  });

  it('click en btnReadAll llama markAllAsRead', async () => {
    const el = document.createElement('app-notification-tray');
    el.innerHTML = TEMPLATE;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const markSpy = jest.spyOn(el, 'markAllAsRead');

    const btn = el.querySelector('#btnReadAll');
    btn.click();

    expect(markSpy).toHaveBeenCalled();

    markSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('markAllAsRead maneja error', async () => {
    mockApiRequest.mockRejectedValue(new Error('Fallo'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const el = document.createElement('app-notification-tray');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    await el.markAllAsRead();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error limpiando bandeja'),
      expect.any(Error)
    );

    errorSpy.mockRestore();
    document.body.removeChild(el);
  });
});
