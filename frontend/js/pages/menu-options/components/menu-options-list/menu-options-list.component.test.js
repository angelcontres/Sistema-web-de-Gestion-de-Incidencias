import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MenuOptionsListComponent } from './menu-options-list.component.js';
import { MenuOptionService } from '../../services/menu-option.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../core/auth.service.js';

describe('MenuOptionsListComponent', () => {
  function createMockComponent() {
    const component = new MenuOptionsListComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          configure: jest.fn(),
          load: jest.fn(),
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() }
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    AuthService.hasPermission = jest.fn(() => true);
    window.location.hash = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('onInit - configura la tabla y escucha row-action para editar', async () => {
    const { component, fakeElements } = createMockComponent();
    
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => { if(e === 'row-action') eventCallback = cb; })
    };
    
    await component.onInit();
    
    expect(fakeElements['#tbl-datos-opciones-menu'].configure).toHaveBeenCalled();
    
    // Simulate event
    eventCallback({ detail: { action: 'editar', item: { id: 2 } } });
    expect(window.location.hash).toBe('#/opciones-menu/form?id=2');
  });

  it('onInit - row-action eliminar confirma y llama al servicio', async () => {
    const { component, fakeElements } = createMockComponent();
    ModalService.confirm = jest.fn(() => Promise.resolve(true));
    MenuOptionService.delete = jest.fn(() => Promise.resolve());
    ToastService.success = jest.fn();
    window.dispatchEvent = jest.fn();

    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => { if(e === 'row-action') eventCallback = cb; })
    };

    await component.onInit();
    await eventCallback({ detail: { action: 'eliminar', item: { id: 5, nombre: 'Test' } } });

    expect(ModalService.confirm).toHaveBeenCalled();
    expect(MenuOptionService.delete).toHaveBeenCalledWith(5);
    expect(ToastService.success).toHaveBeenCalled();
    expect(fakeElements['#tbl-datos-opciones-menu'].load).toHaveBeenCalled();
  });
});
