import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionFormComponent } from './permission-form.component.js';

describe('PermissionFormComponent', () => {
  let originalFetch;

  function createMockComponent() {
    const component = new PermissionFormComponent();
    const fakeElements = {};

    component.querySelector = jest.fn((selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = {
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          value: '',
          checkValidity: jest.fn(() => true),
          innerHTML: '',
          appendChild: jest.fn(),
          parentNode: global.document.body,
          remove: jest.fn(),
          dataset: {},
          querySelector: jest.fn((innerSel) => {
            if (!fakeElements[innerSel]) {
              fakeElements[innerSel] = {
                addEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn() },
                value: '',
                checkValidity: jest.fn(() => true),
                dataset: {}
              };
            }
            return fakeElements[innerSel];
          })
        };
      }
      return fakeElements[selector];
    });

    component.dispatchEvent = jest.fn();
    return { component, fakeElements };
  }

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: 1, nombre: 'Menu1' }])
      })
    );
    if (!window.localStorage) {
      window.localStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
    }
    
    window.bootstrap = { 
      Modal: {
        getOrCreateInstance: jest.fn(() => ({ show: jest.fn() })),
        getInstance: jest.fn(() => ({ hide: jest.fn() }))
      }
    };
    global.document.createElement = jest.fn(() => ({}));
    global.document.body.appendChild = jest.fn();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    delete window.bootstrap;
    jest.restoreAllMocks();
  });

  it('abrirModalCrear - limpia inputs y abre modal', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit(); 
    
    await component.abrirModalCrear();
    
    expect(fakeElements['#permisoId'].value).toBe('');
    expect(fakeElements['#nombre'].value).toBe('');
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
  });

  it('abrirModalEditar - llena los campos del permiso', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    await component.abrirModalEditar({ id: 9, nombre: 'Edit', recurso: 'res', accion: 'CREATE', opcion_menu_id: 1 });
    
    expect(fakeElements['#permisoId'].value).toBe(9);
    expect(fakeElements['#nombre'].value).toBe('Edit');
  });

  it('guardarPermiso - hace petición y despacha evento', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    fakeElements['#permisoId'].value = '';
    fakeElements['#nombre'].value = 'Test';
    fakeElements['#recurso'].value = 'test-res';
    fakeElements['#accion'].value = 'READ';
    fakeElements['#opcion_menu_id'].value = '1';

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);
    
    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/permisos'), 
      expect.objectContaining({ method: 'POST' })
    );
    expect(component.dispatchEvent).toHaveBeenCalled();
  });
});
