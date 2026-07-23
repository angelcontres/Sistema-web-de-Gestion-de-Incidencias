import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionIndexComponent } from './permission-index.component.js';
import { PermissionService } from '../../services/permissions.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('PermissionIndexComponent', () => {
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
    jest.spyOn(AuthService, 'hasPermission').mockReturnValue(true);
    jest.spyOn(PermissionService, 'delete').mockResolvedValue();
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.fetch;
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

  it('eliminarPermiso - confirma y llama a PermissionService.delete', async () => {
    const { component, fakeElements } = createMockComponent();
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
    ToastService.success = jest.fn();
    fakeElements['#tbl-datos-permisos'] = { load: jest.fn() };

    await component.eliminarPermiso(5, 'Test Permiso');

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(PermissionService.delete).toHaveBeenCalledWith(5);
    
    // Permite que las promesas se resuelvan
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ToastService.success).toHaveBeenCalled();
    expect(fakeElements['#tbl-datos-permisos'].load).toHaveBeenCalledWith('/permissions');
  });
});
