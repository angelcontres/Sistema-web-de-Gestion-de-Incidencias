import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../core/api.js', () => ({
  apiRequest: jest.fn()
}));

jest.unstable_mockModule('../../../shared/services/toast.service.js', () => ({
  ToastService: { error: jest.fn(), success: jest.fn() }
}));

const ACTIVATE_TEMPLATE = '<div><div id="activate-loading" class="d-none"></div><div id="activate-success" class="d-none"></div><form id="form-activate-account"><input id="password" /><input id="password_confirmation" /><button type="submit">Activar</button></form></div>';

function setupFetch() {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => ACTIVATE_TEMPLATE });
}

describe('ActivateAccountComponent', () => {
  let ActivateAccountComponent, apiRequest, ToastService;

  beforeAll(async () => {
    const apiMod = await import('../../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const toastMod = await import('../../../shared/services/toast.service.js');
    ToastService = toastMod.ToastService;
    const mod = await import('./activate.component.js');
    ActivateAccountComponent = mod.ActivateAccountComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    apiRequest.mockResolvedValue({});
    ToastService.error.mockImplementation(() => {});
    ToastService.success.mockImplementation(() => {});
    window.location.hash = '#/activate?token=VALIDTOKEN123';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-activate-account', () => {
    expect(customElements.get('app-activate-account')).toBe(ActivateAccountComponent);
  });

  it('renderiza template', async () => {
    setupFetch();
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#form-activate-account')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('redirige a login si no hay token', async () => {
    setupFetch();
    window.location.hash = '#/activate';
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(window.location.hash).toBe('#/login');
    expect(ToastService.error).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('retorna temprano si no hay form', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '<div></div>' });
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    document.body.removeChild(el);
  });

  it('muestra error si password es menor a 8 caracteres', async () => {
    setupFetch();
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.querySelector('#password').value = '123';
    el.querySelector('#password_confirmation').value = '123';
    el.querySelector('#form-activate-account').dispatchEvent(new Event('submit', { cancelable: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ToastService.error).toHaveBeenCalledWith('La contraseña debe tener al menos 8 caracteres.');
    document.body.removeChild(el);
  });

  it('muestra error si passwords no coinciden', async () => {
    setupFetch();
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.querySelector('#password').value = '12345678';
    el.querySelector('#password_confirmation').value = 'different';
    el.querySelector('#form-activate-account').dispatchEvent(new Event('submit', { cancelable: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ToastService.error).toHaveBeenCalledWith('Las contraseñas no coinciden.');
    document.body.removeChild(el);
  });

  it('activa cuenta exitosamente', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ message: 'ok' });
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.querySelector('#password').value = '12345678';
    el.querySelector('#password_confirmation').value = '12345678';
    el.querySelector('#form-activate-account').dispatchEvent(new Event('submit', { cancelable: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(apiRequest).toHaveBeenCalledWith('/auth/activate', {
      method: 'POST',
      body: JSON.stringify({ token: 'VALIDTOKEN123', password: '12345678', password_confirmation: '12345678' })
    });
    expect(el.querySelector('#activate-success').classList.contains('d-none')).toBe(false);
    expect(ToastService.success).toHaveBeenCalledWith('Cuenta activada correctamente.');
    document.body.removeChild(el);
  });

  it('muestra error si api falla', async () => {
    setupFetch();
    apiRequest.mockRejectedValue(new Error('Server error'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const el = document.createElement('app-activate-account');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.querySelector('#password').value = '12345678';
    el.querySelector('#password_confirmation').value = '12345678';
    el.querySelector('#form-activate-account').dispatchEvent(new Event('submit', { cancelable: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ToastService.error).toHaveBeenCalledWith('Server error');
    expect(el.querySelector('#form-activate-account').classList.contains('d-none')).toBe(false);
    errSpy.mockRestore();
    document.body.removeChild(el);
  });
});
