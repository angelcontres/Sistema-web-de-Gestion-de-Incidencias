import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../core/api.js', () => ({
  apiRequest: jest.fn(),
}));

const TEMPLATE = `<div class="card-item premium-notification-card p-3 mb-2 bg-white border-start border-4 rounded shadow-sm">
  <div class="d-flex justify-content-between align-items-center mb-1">
    <div class="d-flex align-items-center gap-2">
      <span class="unread-dot bg-primary rounded-circle d-inline-block shadow-sm"></span>
      <strong class="card-title text-dark small mb-0"></strong>
    </div>
    <small class="card-time text-muted fw-medium"></small>
  </div>
  <p class="card-message mb-0 text-secondary ms-3 ps-1"></p>
</div>`;

function setupFetch(template) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });
}

describe('NotificationCardComponent', () => {
  let NotificationCardComponent, apiRequest;

  beforeAll(async () => {
    const apiMod = await import('../../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const mod = await import('./notification-card.component.js');
    NotificationCardComponent = mod.NotificationCardComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    delete global.fetch;
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-notification-card', () => {
    expect(customElements.get('app-notification-card')).toBe(NotificationCardComponent);
  });

  it('onInit no llama render si notificationData es null', async () => {
    setupFetch(TEMPLATE);
    const renderSpy = jest.spyOn(NotificationCardComponent.prototype, 'render');
    const el = document.createElement('app-notification-card');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(renderSpy).not.toHaveBeenCalled();
    renderSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('onInit llama render si notificationData ya esta establecido', async () => {
    setupFetch(TEMPLATE);
    const el = document.createElement('app-notification-card');
    el.notificationData = { id: 1, title: 'Pre', message: 'loaded', type: 'info', created_at: null, url: null };
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('.card-title').innerHTML).toBe('Pre');
    document.body.removeChild(el);
  });

  it('setData almacena datos y llama render', async () => {
    setupFetch(TEMPLATE);
    const data = { id: 1, title: 'Test', message: 'Msg', type: 'info', created_at: '2025-01-01T12:00:00Z', url: '#/' };
    const el = document.createElement('app-notification-card');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.setData(data);
    expect(el.notificationData).toEqual(data);
    expect(el.querySelector('.card-title').innerHTML).toBe('Test');
    document.body.removeChild(el);
  });

  it('render muestra titulo, mensaje y hora correctamente', async () => {
    setupFetch(TEMPLATE);
    const data = { id: 1, title: 'Incidente crítico', message: 'Fallo en servidor', type: 'danger', created_at: '2025-06-15T14:30:00Z', url: null };
    const el = document.createElement('app-notification-card');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.setData(data);
    expect(el.querySelector('.card-title').innerHTML).toBe('Incidente crítico');
    expect(el.querySelector('.card-message').innerHTML).toBe('Fallo en servidor');
    const timeEl = el.querySelector('.card-time');
    expect(timeEl.textContent).toBeTruthy();
    document.body.removeChild(el);
  });

  it('render escapa caracteres HTML en title y message', async () => {
    setupFetch(TEMPLATE);
    const data = { id: 2, title: '<script>alert("xss")</script>', message: 'Buenos días & adiós', type: 'warning', created_at: null, url: null };
    const el = document.createElement('app-notification-card');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.setData(data);
    expect(el.querySelector('.card-title').innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    expect(el.querySelector('.card-message').innerHTML).toBe('Buenos días &amp; adiós');
    document.body.removeChild(el);
  });

  it('render crea texto fallback para title y message ausentes', async () => {
    setupFetch(TEMPLATE);
    const data = { id: 3, title: null, message: null, type: 'success', created_at: null, url: null };
    const el = document.createElement('app-notification-card');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.setData(data);
    expect(el.querySelector('.card-title').innerHTML).toBe('Alerta de Central');
    expect(el.querySelector('.card-message').innerHTML).toBe('Sin detalles.');
    document.body.removeChild(el);
  });

  describe('renderTextContent', () => {
    it('deja timeEl.textContent vacio cuando created_at es null', async () => {
      setupFetch(TEMPLATE);
      const el = document.createElement('app-notification-card');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      el.setData({ id: 1, title: 'T', message: 'M', type: 'info', created_at: null, url: null });
      expect(el.querySelector('.card-time').textContent).toBe('');
      document.body.removeChild(el);
    });

    it('muestra el valor original cuando created_at no es una fecha valida', async () => {
      setupFetch(TEMPLATE);
      const el = document.createElement('app-notification-card');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      el.setData({ id: 2, title: 'T', message: 'M', type: 'info', created_at: 'not-a-date', url: null });
      expect(el.querySelector('.card-time').textContent).toBe('not-a-date');
      document.body.removeChild(el);
    });
  });

  describe('getTheme', () => {
    it('retorna tema danger', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('danger')).toEqual({ border: 'border-danger', bg: 'bg-danger' });
    });

    it('retorna tema warning', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('warning')).toEqual({ border: 'border-warning', bg: 'bg-warning' });
    });

    it('retorna tema info', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('info')).toEqual({ border: 'border-info', bg: 'bg-info' });
    });

    it('retorna tema success', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('success')).toEqual({ border: 'border-success', bg: 'bg-success' });
    });

    it('retorna tema secondary', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('secondary')).toEqual({ border: 'border-secondary', bg: 'bg-secondary' });
    });

    it('retorna primary como default para tipo desconocido', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme('unknown')).toEqual({ border: 'border-primary', bg: 'bg-primary' });
    });

    it('retorna primary como default para undefined', () => {
      const card = new NotificationCardComponent();
      expect(card.getTheme(undefined)).toEqual({ border: 'border-primary', bg: 'bg-primary' });
    });
  });

  describe('applyTheme', () => {
    it('agrega la clase border correcta y limpia las anteriores', async () => {
      setupFetch(TEMPLATE);
      const el = document.createElement('app-notification-card');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      const item = el.querySelector('.card-item');
      item.classList.add('border-danger', 'border-warning');
      el.applyTheme(item, { border: 'border-info', bg: 'bg-info' });
      expect(item.classList.contains('border-info')).toBe(true);
      expect(item.classList.contains('border-danger')).toBe(false);
      expect(item.classList.contains('border-warning')).toBe(false);
      expect(item.classList.contains('border-primary')).toBe(false);
      document.body.removeChild(el);
    });
  });

  describe('updateReadState', () => {
    async function setupCard() {
      setupFetch(TEMPLATE);
      const el = document.createElement('app-notification-card');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      el.setData({ id: 1, title: 'Test', message: 'Msg', type: 'info', created_at: null, url: null });
      return el;
    }

    it('maneja estado leido: d-none dot, bg-light, opacity 0.65, muted title sin bold', async () => {
      const el = await setupCard();
      el.setData({ id: 1, title: 'Test', message: 'Msg', type: 'info', created_at: null, url: null, is_read: true });
      const unreadDot = el.querySelector('.unread-dot');
      expect(unreadDot.classList.contains('d-none')).toBe(true);
      expect(el.querySelector('.card-item').classList.contains('bg-light')).toBe(true);
      expect(el.querySelector('.card-item').style.opacity).toBe('0.65');
      expect(el.querySelector('.card-title').classList.contains('text-muted')).toBe(true);
      expect(el.querySelector('.card-title').classList.contains('fw-bold')).toBe(false);
      document.body.removeChild(el);
    });

    it('maneja estado no leido: dot visible, bg-white, opacity 1, bold title text-dark', async () => {
      const el = await setupCard();
      el.notificationData.is_read = false;
      el.notificationData.read_at = null;
      el.render();
      const unreadDot = el.querySelector('.unread-dot');
      expect(unreadDot.classList.contains('d-none')).toBe(false);
      expect(el.querySelector('.card-item').classList.contains('bg-white')).toBe(true);
      expect(el.querySelector('.card-item').style.opacity).toBe('1');
      expect(el.querySelector('.card-title').classList.contains('fw-bold')).toBe(true);
      expect(el.querySelector('.card-title').classList.contains('text-dark')).toBe(true);
      document.body.removeChild(el);
    });
  });

  describe('handleCardClick', () => {
    beforeEach(() => {
      delete global.fetch;
      setupFetch(TEMPLATE);
      apiRequest.mockResolvedValue({});
    });

    async function setupCard() {
      const el = document.createElement('app-notification-card');
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
      el.setData({ id: 5, title: 'Test', message: 'Msg', type: 'info', created_at: null, url: null });
      return el;
    }

    it('marca como leido, dispara notification-read y llama apiRequest', async () => {
      const el = await setupCard();
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      await el.handleCardClick(5, null);
      expect(el.notificationData.is_read).toBe(true);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notification-read' }));
      expect(apiRequest).toHaveBeenCalledWith('/notificaciones/5/leer', { method: 'PUT' });
      dispatchSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('navega con URL hash', async () => {
      const el = await setupCard();
      await el.handleCardClick(5, '#/dashboard');
      expect(window.location.hash).toBe('#/dashboard');
      document.body.removeChild(el);
    });

    it('navega con URL relativa agregando #/', async () => {
      const el = await setupCard();
      await el.handleCardClick(5, '/incidencias/5');
      expect(window.location.hash).toBe('#/incidencias/5');
      document.body.removeChild(el);
    });

    it('dispara notifications-changed si no hay url', async () => {
      const el = await setupCard();
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      await el.handleCardClick(5, null);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications-changed' }));
      dispatchSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('url que empieza con # asigna window.location.href directamente', async () => {
      const el = await setupCard();
      await el.handleCardClick(5, '#/admin');
      expect(window.location.href).toContain('#/admin');
      document.body.removeChild(el);
    });

    it('url relativa con barras multiples limpia y anade #/', async () => {
      const el = await setupCard();
      await el.handleCardClick(5, '//incidencias/5');
      expect(window.location.hash).toBe('#/incidencias/5');
      document.body.removeChild(el);
    });

    it('maneja error de apiRequest', async () => {
      const el = await setupCard();
      apiRequest.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await el.handleCardClick(5, null);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      document.body.removeChild(el);
    });

    it('click en .card-item llama handleCardClick', async () => {
      const el = await setupCard();
      el.setData({ id: 5, title: 'Test', message: 'Msg', type: 'info', created_at: null, url: '#/test' });
      const spy = jest.spyOn(el, 'handleCardClick').mockImplementation(jest.fn());
      el.querySelector('.card-item').click();
      expect(spy).toHaveBeenCalledWith(5, '#/test');
      spy.mockRestore();
      document.body.removeChild(el);
    });
  });
});
