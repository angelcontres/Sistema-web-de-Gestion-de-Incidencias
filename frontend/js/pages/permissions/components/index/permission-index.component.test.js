import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionIndexComponent } from './permission-index.component.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('PermissionIndexComponent', () => {
  let originalFetch;

  function createMockComponent() {
    const component = new PermissionIndexComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          configure: jest.fn(),
          load: jest.fn(),
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          abrirModalCrear: jest.fn(),
          abrirModalEditar: jest.fn()
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    AuthService.hasPermission = jest.fn(() => true);
    
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] })
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

  it('onInit - configura la tabla y escucha evento row-action para editar', async () => {
    const { component, fakeElements } = createMockComponent();
    
    let eventCallback;
    component.querySelector('#tbl-datos-permisos').addEventListener = jest.fn((e, cb) => {
      if(e === 'row-action') eventCallback = cb;
    });
    
    await component.onInit();
    
    expect(fakeElements['#tbl-datos-permisos'].configure).toHaveBeenCalled();
    
    // Simulate event
    eventCallback({ detail: { action: 'editar', item: { id: 3 } } });
    expect(fakeElements['#app-permission-form'].abrirModalEditar).toHaveBeenCalledWith({ id: 3 });
  });

  it('eliminarPermiso - confirma y llama a la API con DELETE', async () => {
    const { component, fakeElements } = createMockComponent();
    ModalService.confirm = jest.fn(() => Promise.resolve(true));
    ToastService.success = jest.fn();

    await component.eliminarPermiso(5, 'Test Permiso');

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/permisos/5'),
      expect.objectContaining({ method: 'DELETE' })
    );
    
    // Permite que las promesas se resuelvan (then en eliminarPermiso)
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ToastService.success).toHaveBeenCalled();
    expect(fakeElements['#tbl-datos-permisos'].load).toHaveBeenCalledWith('/permisos');
  });
});
