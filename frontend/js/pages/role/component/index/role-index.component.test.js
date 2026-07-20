import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RoleIndexComponent } from './role-index.component.js';
import { RoleService } from '../../services/role.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('RoleIndexComponent', () => {
  let originalFetch;

  function createMockComponent() {
    const component = new RoleIndexComponent();
    
    // Un mock genérico de elemento del DOM para no tener undefined
    const createFakeElement = () => {
      const el = {
        addEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        value: '',
        innerHTML: '',
        textContent: '',
        abrirModalCrear: jest.fn(),
        abrirModalEditar: jest.fn(),
        children: []
      };
      // Permite encadenar querySelector infinatemente
      el.querySelector = jest.fn(() => createFakeElement());
      el.querySelectorAll = jest.fn(() => []);
      return el;
    };

    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = createFakeElement();
      }
      return fakeElements[selector];
    });

    component.querySelectorAll = jest.fn(() => []);
    return { component, fakeElements };
  }

  beforeEach(() => {
    AuthService.hasPermission = jest.fn(() => true);
    RoleService.getAll = jest.fn(() => Promise.resolve([{ id: 1, nombre: 'Role 1', descripcion: 'test' }]));
    RoleService.delete = jest.fn(() => Promise.resolve());
    
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: 1, nombre: 'Permiso 1', accion: 'CREATE', opcion_menu: { nombre: 'Menu1' } }])
      })
    );
    if (!window.localStorage) {
      window.localStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
    }
  });

  afterEach(() => {
    window.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('onInit - carga roles e inicializa formulario', async () => {
    const { component, fakeElements } = createMockComponent();
    
    await component.onInit();
    
    expect(RoleService.getAll).toHaveBeenCalled();
    expect(fakeElements['#app-role-form'].addEventListener).toHaveBeenCalledWith('rol-guardado', expect.any(Function));
  });

  it('eliminarRol - confirma y llama al RoleService.delete', async () => {
    const { component } = createMockComponent();
    ModalService.confirm = jest.fn(() => Promise.resolve(true));
    ToastService.success = jest.fn();
    ToastService.error = jest.fn();

    await component.eliminarRol(5, 'Test Role');

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(RoleService.delete).toHaveBeenCalledWith(5);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ToastService.success).toHaveBeenCalled();
  });
});
