import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CategoriasIndexComponent } from './categorias-index.component.js';
import { CategoriaIncidenciaService } from '../../services/categoria-incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

describe('CategoriasIndexComponent', () => {
  const originalGetAll = CategoriaIncidenciaService.getAll;
  const originalDelete = CategoriaIncidenciaService.delete;
  const originalHasPermission = AuthService.hasPermission;
  const originalToastSuccess = ToastService.success;
  const originalToastError = ToastService.error;
  const originalToastShow = ToastService.show;
  const originalModalConfirm = ModalService.confirm;

  function setupMocks() {
    window.bootstrap = {
      Modal: class {
        show() {}
        hide() {}
      },
    };

    CategoriaIncidenciaService.getAll = jest.fn(async () => []);
    CategoriaIncidenciaService.delete = jest.fn(async () => {});

    AuthService.hasPermission = jest.fn(() => true);

    ToastService.success = jest.fn(() => {});
    ToastService.error = jest.fn(() => {});
    ToastService.show = jest.fn(() => {});

    ModalService.confirm = jest.fn(async () => true);
  }

  function restoreMocks() {
    CategoriaIncidenciaService.getAll = originalGetAll;
    CategoriaIncidenciaService.delete = originalDelete;
    AuthService.hasPermission = originalHasPermission;
    ToastService.success = originalToastSuccess;
    ToastService.error = originalToastError;
    ToastService.show = originalToastShow;
    ModalService.confirm = originalModalConfirm;
  }

  function createMockComponent() {
    const component = new CategoriasIndexComponent();
    const fakeElements = {};

    const createFakeElement = () => {
      return {
        value: '',
        checked: false,
        classList: { add: () => {}, remove: () => {}, contains: () => false, replace: () => {} },
        addEventListener: () => {},
        innerHTML: '',
        textContent: '',
        checkValidity: () => true,
        querySelector: () => createFakeElement(),
        querySelectorAll: () => [createFakeElement()],
        configure: jest.fn(),
        items: [],
      };
    };

    component.querySelector = (selector) => {
      if (!fakeElements[selector]) {
        fakeElements[selector] = createFakeElement();
      }
      return fakeElements[selector];
    };

    component.querySelectorAll = () => [createFakeElement()];

    return { component, fakeElements };
  }

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it('onInit() - debería inicializar el modal, configurar <app-data-table> y cargar categorías (T8 - R10)', async () => {
    const { component, fakeElements } = createMockComponent();

    let loadCalled = false;
    component.cargarCategorias = async () => {
      loadCalled = true;
    };

    await component.onInit();

    expect(component.categoriaModalObj).toBeDefined();
    expect(loadCalled).toBeTruthy();
    const tblDatos = fakeElements['#tbl-categorias-data'];
    expect(tblDatos.configure).toHaveBeenCalled();
    const configArg = tblDatos.configure.mock.calls[0][0];
    expect(configArg.columns).toBeDefined();
    const headers = configArg.columns.map((col) => col.header);
    expect(headers).toContain('ID');
    expect(headers).toContain('Nombre');
    expect(headers).toContain('Descripción');
    expect(headers).toContain('Estado');
    expect(headers).toContain('Acciones');
  });

  it('cargarCategorias() - debería setear items vacíos en <app-data-table> si no hay categorías (T8 - R10)', async () => {
    const { component, fakeElements } = createMockComponent();
    CategoriaIncidenciaService.getAll = jest.fn(async () => []);

    await component.cargarCategorias();

    const tblDatos = fakeElements['#tbl-categorias-data'];
    expect(tblDatos.items).toEqual([]);
  });

  it('cargarCategorias() - debería llenar this.categoriasList y pasar los items ordenados a <app-data-table> (T8 - R10)', async () => {
    const mockData = [
      { id: 1, nombre: 'Padre', parent_id: null, activo: true },
      { id: 2, nombre: 'Hijo', parent_id: 1, activo: true },
    ];
    CategoriaIncidenciaService.getAll = jest.fn(async () => mockData);

    const { component, fakeElements } = createMockComponent();
    await component.cargarCategorias();

    expect(component.categoriasList.length).toBe(2);
    const tblDatos = fakeElements['#tbl-categorias-data'];
    expect(tblDatos.items.length).toBe(2);
    expect(tblDatos.items[0].nombre).toBe('Padre');
    expect(tblDatos.items[1].nombre).toBe('Hijo');
  });

  it('abrirModalCategoria() - debería preparar el formulario para "Nueva Categoría" si no se pasa categoría', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { show: () => {} };
    component.llenarParentSelect = () => {};

    component.abrirModalCategoria();

    expect(fakeElements['#categoriaId'].value).toBe('');
    expect(fakeElements['#categoriaNombre'].value).toBe('');
    expect(fakeElements['#categoriaModalLabel'].textContent).toBe('Nueva Categoría');
  });

  it('abrirModalCategoria() - debería rellenar el formulario para "Editar Categoría" si se pasa categoría', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { show: () => {} };
    component.llenarParentSelect = () => {};

    const mockCat = { id: 5, nombre: 'Cat 5', descripcion: 'Desc 5', parent_id: 1, activo: false };
    component.abrirModalCategoria(mockCat);

    expect(fakeElements['#categoriaId'].value).toBe(5);
    expect(fakeElements['#categoriaNombre'].value).toBe('Cat 5');
    expect(fakeElements['#categoriaModalLabel'].textContent).toBe('Editar Categoría');
  });

  it('eliminarCategoria() - debería llamar al servicio delete si se confirma', async () => {
    let deleteId = null;
    CategoriaIncidenciaService.delete = jest.fn(async (id) => {
      deleteId = id;
    });
    ModalService.confirm = jest.fn(async () => true);

    const { component } = createMockComponent();
    component.cargarCategorias = async () => {};

    await component.eliminarCategoria(10, 'Prueba');

    expect(deleteId).toBe(10);
  });

  it('eliminarCategoria() - NO debería llamar al servicio delete si no se confirma', async () => {
    let deleteCalled = false;
    CategoriaIncidenciaService.delete = jest.fn(async () => {
      deleteCalled = true;
    });
    ModalService.confirm = jest.fn(async () => false);

    const { component } = createMockComponent();

    await component.eliminarCategoria(10, 'Prueba');

    expect(deleteCalled).toBeFalsy();
  });
});
