import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PermissionFormComponent } from './permission-form.component.js';
import { PermissionService } from '../../services/permissions.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('PermissionFormComponent', () => {
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
                dataset: {},
              };
            }
            return fakeElements[innerSel];
          }),
        };
      }
      return fakeElements[selector];
    });

    component.dispatchEvent = jest.fn();
    return { component, fakeElements };
  }

  let originalFetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    window.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.includes('/opciones-menu')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 1, nombre: 'Menu1' }]),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    PermissionService.create = jest.fn(() => Promise.resolve());
    PermissionService.update = jest.fn(() => Promise.resolve());

    window.bootstrap = {
      Modal: {
        getOrCreateInstance: jest.fn(() => ({ show: jest.fn() })),
        getInstance: jest.fn(() => ({ hide: jest.fn() })),
      },
    };
    ToastService.success = jest.fn();
    ToastService.error = jest.fn();
    global.document.createElement = jest.fn(() => ({
      style: {},
      classList: { add: jest.fn(), remove: jest.fn() },
      setAttribute: jest.fn(),
      appendChild: jest.fn(),
    }));
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

    await component.abrirModalEditar({
      id: 9,
      nombre: 'Edit',
      recurso: 'res',
      accion: 'CREATE',
      opcion_menu_id: 1,
    });

    expect(fakeElements['#permisoId'].value).toBe(9);
    expect(fakeElements['#nombre'].value).toBe('Edit');
  });

  it('guardarPermiso - hace petición CREATE si no hay ID y despacha evento', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    fakeElements['#permisoId'].value = '';
    fakeElements['#nombre'].value = 'Test';
    fakeElements['#recurso'].value = 'test-res';
    fakeElements['#accion'].value = 'READ';
    fakeElements['#opcion_menu_id'].value = '1';

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(PermissionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Test', accion: 'READ' })
    );
    expect(component.dispatchEvent).toHaveBeenCalled();
  });

  it('guardarPermiso - hace petición UPDATE si hay ID y despacha evento', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    fakeElements['#permisoId'].value = '5';
    fakeElements['#nombre'].value = 'Test2';
    fakeElements['#recurso'].value = 'test-res';
    fakeElements['#accion'].value = 'UPDATE';
    fakeElements['#opcion_menu_id'].value = '1';

    const e = { preventDefault: jest.fn() };
    await component.guardarPermiso(e);

    expect(PermissionService.update).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ nombre: 'Test2', accion: 'UPDATE' })
    );
    expect(component.dispatchEvent).toHaveBeenCalled();
  });
});
