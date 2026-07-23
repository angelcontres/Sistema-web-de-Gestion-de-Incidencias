import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RoleFormComponent } from './role-form.component.js';
import { RoleService } from '../../services/role.service.js';

describe('RoleFormComponent', () => {
  function createMockComponent() {
    const component = new RoleFormComponent();
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
                appendChild: jest.fn(),
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
    RoleService.getAll = jest.fn(() => Promise.resolve([{ id: 1, nombre: 'Padre' }]));
    RoleService.create = jest.fn(() => Promise.resolve());
    RoleService.update = jest.fn(() => Promise.resolve());
    
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
    delete window.bootstrap;
    jest.restoreAllMocks();
  });

  it('abrirModalCrear - limpia campos, carga select padre y abre modal', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    await component.abrirModalCrear();
    
    expect(fakeElements['#roleId'].value).toBe('');
    expect(fakeElements['#nombre'].value).toBe('');
    expect(RoleService.getAll).toHaveBeenCalled();
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
  });

  it('abrirModalEditar - llena los campos, carga select padre y abre modal', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    await component.abrirModalEditar({ id: 2, nombre: 'Admin', descripcion: 'Des', padre_id: 1 }, [{id: 1, nombre: 'Padre'}]);
    
    expect(fakeElements['#roleId'].value).toBe(2);
    expect(fakeElements['#nombre'].value).toBe('Admin');
  });

  it('guardarRol - hace POST si no hay ID y despacha evento', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    fakeElements['#roleId'].value = '';
    fakeElements['#nombre'].value = 'Nuevo Rol';
    fakeElements['#descripcion'].value = 'Desc';
    fakeElements['#padre_id'].value = '1';

    const e = { preventDefault: jest.fn() };
    await component.guardarRol(e);
    
    expect(RoleService.create).toHaveBeenCalledWith({
      nombre: 'Nuevo Rol',
      descripcion: 'Desc',
      padre_id: 1
    });
    expect(component.dispatchEvent).toHaveBeenCalled();
  });

  it('guardarRol - hace PUT si hay ID y despacha evento', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    
    fakeElements['#roleId'].value = '5';
    fakeElements['#nombre'].value = 'Rol Editado';
    fakeElements['#descripcion'].value = 'Desc';
    fakeElements['#padre_id'].value = '';

    const e = { preventDefault: jest.fn() };
    await component.guardarRol(e);
    
    expect(RoleService.update).toHaveBeenCalledWith('5', {
      nombre: 'Rol Editado',
      descripcion: 'Desc',
      padre_id: null
    });
    expect(component.dispatchEvent).toHaveBeenCalled();
  });
});
