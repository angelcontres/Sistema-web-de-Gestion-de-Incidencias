import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RoleFormComponent } from './role-form.component.js';
import { RoleService } from '../../services/role.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

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
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('') }));
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
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

  it('debe estar definido como custom element', () => {
    expect(customElements.get('app-role-form')).toBe(RoleFormComponent);
  });

  it('onInit - mueve el modal al body y configura elementos', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    expect(document.body.appendChild).toHaveBeenCalledWith(fakeElements['#roleModal']);
    expect(component.modalEl).toBe(fakeElements['#roleModal']);
    expect(component.form).toBe(fakeElements['#roleForm']);
    expect(component.roleIdInput).toBe(fakeElements['#roleId']);
    expect(component.nombreInput).toBe(fakeElements['#nombre']);
    expect(component.descripcionInput).toBe(fakeElements['#descripcion']);
    expect(component.padreSelect).toBe(fakeElements['#padre_id']);
    expect(component.formTitle).toBe(fakeElements['#roleModalLabel']);
    expect(component.btnText).toBe(fakeElements['#btnText']);
    expect(component.btnSubmit).toBe(fakeElements['#btnSubmit']);
    expect(component.errorAlert).toBe(fakeElements['#modalErrorAlert']);
    expect(component.errorMessage).toBe(fakeElements['#modalErrorMessage']);
  });

  it('onInit - registra error si no encuentra #roleModal', async () => {
    const { component } = createMockComponent();
    component.querySelector = jest.fn(() => null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    expect(consoleSpy).toHaveBeenCalledWith('No se encontró el modal #roleModal');
    expect(component.modalEl).toBeNull();
    consoleSpy.mockRestore();
  });

  it('abrirModalCrear - maneja error al cargar roles y abre modal igualmente', async () => {
    const { component } = createMockComponent();
    RoleService.getAll = jest.fn(() => Promise.reject(new Error('Error de red')));
    await component.onInit();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.abrirModalCrear();
    expect(consoleSpy).toHaveBeenCalled();
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('abrirModalEditar - carga roles de API cuando no se pasan', async () => {
    const { component } = createMockComponent();
    await component.onInit();
    RoleService.getAll.mockClear();
    await component.abrirModalEditar({ id: 2, nombre: 'Admin', descripcion: 'Des', padre_id: 1 });
    expect(RoleService.getAll).toHaveBeenCalled();
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
  });

  it('abrirModalEditar - maneja error al cargar roles', async () => {
    const { component } = createMockComponent();
    RoleService.getAll = jest.fn(() => Promise.reject(new Error('Error de red')));
    await component.onInit();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.abrirModalEditar({ id: 2, nombre: 'Admin', descripcion: 'Des', padre_id: 1 });
    expect(consoleSpy).toHaveBeenCalled();
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('guardarRol - validación falla y retorna temprano', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    fakeElements['#roleForm'].checkValidity = jest.fn(() => false);
    const e = { preventDefault: jest.fn() };
    await component.guardarRol(e);
    expect(fakeElements['#roleForm'].classList.add).toHaveBeenCalledWith('was-validated');
    expect(RoleService.create).not.toHaveBeenCalled();
    expect(RoleService.update).not.toHaveBeenCalled();
  });

  it('guardarRol - muestra toast error si la API falla', async () => {
    const { component, fakeElements } = createMockComponent();
    const errorMsg = 'Error de conexión';
    RoleService.create = jest.fn(() => Promise.reject(new Error(errorMsg)));
    await component.onInit();
    fakeElements['#nombre'].value = 'Test Rol';
    const e = { preventDefault: jest.fn() };
    await component.guardarRol(e);
    expect(ToastService.error).toHaveBeenCalledWith(errorMsg);
  });

  it('disconnectedCallback - remueve el modal del body si estaba adjunto', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();
    component.disconnectedCallback();
    expect(fakeElements['#roleModal'].remove).toHaveBeenCalled();
  });

  it('disconnectedCallback - no falla si modalEl es null', async () => {
    const { component } = createMockComponent();
    await component.onInit();
    component.modalEl = null;
    expect(() => component.disconnectedCallback()).not.toThrow();
  });
});
