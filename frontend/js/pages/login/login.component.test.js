import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LoginComponent } from './login.component.js';
import { AuthService } from '../../core/auth.service.js';
import { ToastService } from '../../shared/services/toast.service.js';

describe('LoginComponent', () => {
  function createMockComponent() {
    const component = new LoginComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      const defaultElement = {
        addEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        value: '',
        textContent: '',
        disabled: false,
        checkValidity: jest.fn(() => true)
      };
      
      if (!fakeElements[selector]) {
        fakeElements[selector] = defaultElement;
      } else {
        fakeElements[selector] = { ...defaultElement, ...fakeElements[selector] };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
    jest.spyOn(AuthService, 'login').mockResolvedValue();
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ToastService, 'warning').mockImplementation(() => {});
    window.dispatchEvent = jest.fn();
    window.location.hash = '';
  });

  it('onInit - redirige al dashboard si ya está autenticado', () => {
    jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
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
    fakeElements['#loginSubmitBtn'] = { disabled: false };
    fakeElements['#loginSpinner'] = { classList: { add: jest.fn(), remove: jest.fn() } };

    component.onInit();
    
    const e = { preventDefault: jest.fn() };
    await submitCallback(e);
    
    expect(e.preventDefault).toHaveBeenCalled();
    expect(AuthService.login).toHaveBeenCalledWith('admin@test.com', 'password123');
    expect(ToastService.success).toHaveBeenCalledWith('Bienvenido de nuevo al sistema.', 'Inicio Exitoso');
    expect(window.dispatchEvent).toHaveBeenCalled();
    expect(window.location.hash).toBe('#/');
  });

  it('submitForm - muestra error en UI si falla el login', async () => {
    const { component, fakeElements } = createMockComponent();
    jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Credenciales inválidas'));
    
    let submitCallback;
    fakeElements['#loginForm'] = {
      addEventListener: jest.fn((event, cb) => {
        if (event === 'submit') submitCallback = cb;
      }),
      classList: { add: jest.fn() },
      checkValidity: jest.fn(() => true)
    };
    fakeElements['#emailInput'] = { value: 'bad@test.com' };
    fakeElements['#passwordInput'] = { value: 'badpass' };
    fakeElements['#loginSubmitBtn'] = { disabled: false };
    fakeElements['#loginSpinner'] = { classList: { add: jest.fn(), remove: jest.fn() } };

    component.onInit();
    
    const e = { preventDefault: jest.fn() };
    await submitCallback(e);
    
    expect(AuthService.login).toHaveBeenCalled();
    expect(ToastService.error).toHaveBeenCalledWith('Credenciales inválidas', 'Error de Autenticación');
    expect(fakeElements['#loginSubmitBtn'].disabled).toBe(false); // Should re-enable
  });

  it('submitForm - muestra warning si el formulario es inválido', async () => {
    const { component, fakeElements } = createMockComponent();

    let submitCallback;
    fakeElements['#loginForm'] = {
      addEventListener: jest.fn((event, cb) => {
        if (event === 'submit') submitCallback = cb;
      }),
      classList: { add: jest.fn() },
      checkValidity: jest.fn(() => false)
    };
    fakeElements['#emailInput'] = { value: '' };
    fakeElements['#passwordInput'] = { value: '' };

    component.onInit();

    const e = { preventDefault: jest.fn() };
    await submitCallback(e);

    expect(ToastService.warning).toHaveBeenCalledWith('Por favor completa todos los campos requeridos.', 'Faltan datos');
  });

  it('initPrivacyMode - activa modo privado en focus/blur', () => {
    const { component, fakeElements } = createMockComponent();

    let focusCallback, blurCallback;
    fakeElements['#passwordInput'] = {
      addEventListener: jest.fn((event, cb) => {
        if (event === 'focus') focusCallback = cb;
        if (event === 'blur') blurCallback = cb;
      }),
    };
    fakeElements['app-mascot'] = {
      setPrivacyMode: jest.fn(),
    };

    component.initPrivacyMode();

    focusCallback();
    expect(fakeElements['app-mascot'].setPrivacyMode).toHaveBeenCalledWith(true);

    blurCallback();
    expect(fakeElements['app-mascot'].setPrivacyMode).toHaveBeenCalledWith(false);
  });
});
