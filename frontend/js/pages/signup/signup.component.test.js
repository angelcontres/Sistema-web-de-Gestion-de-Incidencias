import { jest, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('../../core/auth.service.js', () => ({
  AuthService: { isAuthenticated: jest.fn(() => false), register: jest.fn() }
}));

jest.unstable_mockModule('../../shared/services/toast.service.js', () => ({
  ToastService: { success: jest.fn(), warning: jest.fn() }
}));

const SIGNUP_TEMPLATE = `<form id="signup-form" novalidate><input id="username" required /><input id="password" required minlength="8" /><button id="submit-btn">R</button><output id="signup-spinner" class="d-none"></output></form><app-mascot></app-mascot>`;
const EMPTY_TEMPLATE = `<div></div>`;

function setupFetch() {
  global.fetch = jest.fn().mockImplementation((url) => {
    const text = url.includes('signup') ? SIGNUP_TEMPLATE : EMPTY_TEMPLATE;
    return Promise.resolve({ ok: true, text: async () => text });
  });
}

describe('SignupComponent', () => {
  let AuthService, ToastService;

  beforeAll(async () => {
    await import('../../core/mascot/mascot.component.js');
    const authMod = await import('../../core/auth.service.js');
    AuthService = authMod.AuthService;
    const toastMod = await import('../../shared/services/toast.service.js');
    ToastService = toastMod.ToastService;
    await import('./signup.component.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.isAuthenticated.mockImplementation(() => false);
    AuthService.register.mockImplementation(() => Promise.resolve({ access_token: 'tok' }));
    window.location.hash = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('smoke test', async () => {
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#username')).not.toBeNull();
    expect(el.querySelector('#submit-btn')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('redirect when authenticated', async () => {
    AuthService.isAuthenticated.mockReturnValue(true);
    setupFetch();
    window.location.hash = '#/signup';
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(window.location.hash).toBe('#/');
    document.body.removeChild(el);
  });

  it('valid form calls AuthService.register', async () => {
    AuthService.register.mockResolvedValue({ access_token: 'tok' });
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 10; i++) await new Promise(process.nextTick);

    const form = el.querySelector('#signup-form');
    expect(form).not.toBeNull();
    el.querySelector('#username').value = 'testuser';
    el.querySelector('#password').value = '12345678';

    expect(form.checkValidity()).toBe(true);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    for (let i = 0; i < 10; i++) await new Promise(process.nextTick);

    expect(AuthService.register).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('handleSignup manually calls register', async () => {
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 10; i++) await new Promise(process.nextTick);

    expect(el.form).not.toBeNull();
    el.querySelector('#username').value = 'testuser';
    el.querySelector('#password').value = '12345678';
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

    await el.handleSignup(submitEvent);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(AuthService.register).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('valid form with email sends email field', async () => {
    AuthService.register.mockResolvedValue({ access_token: 'tok' });
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = 'user@test.com';
    el.querySelector('#password').value = '12345678';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(AuthService.register).toHaveBeenCalledWith({ email: 'user@test.com', password: '12345678' });
    document.body.removeChild(el);
  });

  it('invalid form shows warning', async () => {
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = '';
    el.querySelector('#password').value = '';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(ToastService.warning).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('error 422 shows field-level message', async () => {
    const err = new Error('Validation error');
    err.status = 422;
    err.data = { errors: { email: ['El email ya existe'] } };
    AuthService.register.mockRejectedValue(err);
    setupFetch();

    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = 'user@test.com';
    el.querySelector('#password').value = '12345678';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(ToastService.warning).toHaveBeenCalledWith('El email ya existe', 'Error de Registro');
    document.body.removeChild(el);
  });

  it('sets loading state during submit', async () => {
    AuthService.register.mockImplementation(() => new Promise(() => {}));
    setupFetch();

    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = 'test';
    el.querySelector('#password').value = '12345678';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(el.querySelector('#submit-btn').disabled).toBe(true);
    const spinner = el.querySelector('#signup-spinner');
    expect(spinner.classList.contains('d-none')).toBe(false);
    document.body.removeChild(el);
  });

  it('error with data.message shows warning', async () => {
    const err = new Error('fallback');
    err.data = { message: 'Custom data error' };
    AuthService.register.mockRejectedValue(err);
    setupFetch();

    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = 'user@test.com';
    el.querySelector('#password').value = '12345678';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(ToastService.warning).toHaveBeenCalledWith('Custom data error', 'Error de Registro');
    document.body.removeChild(el);
  });

  it('error with only message shows warning', async () => {
    AuthService.register.mockRejectedValue(new Error('Simple error'));
    setupFetch();

    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#username').value = 'user@test.com';
    el.querySelector('#password').value = '12345678';
    el.querySelector('#signup-form').dispatchEvent(new Event('submit', { bubbles: true }));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(ToastService.warning).toHaveBeenCalledWith('Simple error', 'Error de Registro');
    document.body.removeChild(el);
  });

  it('initPrivacyMode sets privacy mode on password focus/blur', async () => {
    setupFetch();
    const el = document.createElement('app-signup');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const mascot = el.querySelector('app-mascot');
    const spy = jest.spyOn(mascot, 'setPrivacyMode');

    const passwordInput = el.querySelector('#password');
    passwordInput.dispatchEvent(new Event('focus'));
    expect(spy).toHaveBeenCalledWith(true);

    passwordInput.dispatchEvent(new Event('blur'));
    expect(spy).toHaveBeenCalledWith(false);

    document.body.removeChild(el);
  });
});
