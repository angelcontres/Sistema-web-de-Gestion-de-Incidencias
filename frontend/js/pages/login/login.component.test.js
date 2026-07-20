import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LoginComponent } from './login.component.js';
import { AuthService } from '../../core/auth.service.js';

describe('LoginComponent', () => {
  function createMockComponent() {
    const component = new LoginComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          value: '',
          textContent: '',
          disabled: false,
          checkValidity: jest.fn(() => true)
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    AuthService.isAuthenticated = jest.fn(() => false);
    AuthService.login = jest.fn(() => Promise.resolve());
    window.dispatchEvent = jest.fn();
    window.location.hash = '';
  });

  it('onInit - redirige al dashboard si ya está autenticado', () => {
    AuthService.isAuthenticated = jest.fn(() => true);
    const { component } = createMockComponent();
    
    component.onInit();
    expect(window.location.hash).toBe('#/');
  });

  it('submitForm - llama al servicio de login y despacha evento si es exitoso', async () => {
    const { component, fakeElements } = createMockComponent();
    
    let submitCallback;
    fakeElements['#loginForm'] = {
      addEventListener: jest.fn((event, cb) => {
        if (event === 'submit') submitCallback = cb;
      }),
      classList: { add: jest.fn(), remove: jest.fn() },
      checkValidity: jest.fn(() => true)
    };
    fakeElements['#emailInput'] = { value: 'admin@test.com' };
    fakeElements['#passwordInput'] = { value: 'password123' };
    fakeElements['#loginSubmitBtn'] = {};
    fakeElements['#loginSpinner'] = { classList: { add: jest.fn(), remove: jest.fn() } };
    fakeElements['#loginErrorAlert'] = { classList: { add: jest.fn(), remove: jest.fn() } };

    component.onInit();
    
    const e = { preventDefault: jest.fn() };
    await submitCallback(e);
    
    expect(e.preventDefault).toHaveBeenCalled();
    expect(AuthService.login).toHaveBeenCalledWith('admin@test.com', 'password123');
    expect(window.dispatchEvent).toHaveBeenCalled();
    expect(window.location.hash).toBe('#/');
  });

  it('submitForm - muestra error en UI si falla el login', async () => {
    const { component, fakeElements } = createMockComponent();
    AuthService.login = jest.fn(() => Promise.reject(new Error('Credenciales inválidas')));
    
    let submitCallback;
    fakeElements['#loginForm'] = {
      addEventListener: jest.fn((event, cb) => submitCallback = cb),
      classList: { add: jest.fn() },
      checkValidity: jest.fn(() => true)
    };
    fakeElements['#emailInput'] = { value: 'bad@test.com' };
    fakeElements['#passwordInput'] = { value: 'badpass' };
    fakeElements['#loginSubmitBtn'] = {};
    fakeElements['#loginSpinner'] = { classList: { add: jest.fn(), remove: jest.fn() } };
    fakeElements['#loginErrorAlert'] = { classList: { add: jest.fn(), remove: jest.fn() } };
    fakeElements['#loginErrorMessage'] = {};

    component.onInit();
    
    const e = { preventDefault: jest.fn() };
    await submitCallback(e);
    
    expect(AuthService.login).toHaveBeenCalled();
    expect(fakeElements['#loginErrorMessage'].textContent).toBe('Credenciales inválidas');
    expect(fakeElements['#loginErrorAlert'].classList.remove).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#loginSubmitBtn'].disabled).toBe(false); // Should re-enable
  });
});
