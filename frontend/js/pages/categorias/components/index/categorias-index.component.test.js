import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';

jest.unstable_mockModule('../../services/categoria-incidencia.service.js', () => ({
  CategoriaIncidenciaService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../../core/auth.service.js', () => ({
  AuthService: { hasPermission: jest.fn() },
}));

jest.unstable_mockModule('../../../../shared/services/modal.service.js', () => ({
  ModalService: { confirm: jest.fn() },
}));

jest.unstable_mockModule('../../../../shared/services/toast.service.js', () => ({
  ToastService: { success: jest.fn(), error: jest.fn() },
}));

jest.unstable_mockModule('../../../../core/api.js', () => ({
  apiRequest: jest.fn(),
}));

jest.unstable_mockModule('../../../../shared/services/catalogo.service.js', () => ({
  CatalogoService: { clearCategoriasCache: jest.fn() },
}));

jest.unstable_mockModule('../../../instituciones/services/institucion.service.js', () => ({
  InstitucionService: { getAll: jest.fn() },
}));

let CategoriasIndexComponent;
let CategoriaIncidenciaService;
let AuthService;
let ModalService;
let ToastService;
let apiRequest;
let CatalogoService;
let InstitucionService;

async function flushPromises() {
  for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
}

function createFakeElement() {
  return {
    value: '',
    checked: false,
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
      replace: jest.fn(),
      toggle: jest.fn(),
    },
    addEventListener: jest.fn(),
    innerHTML: '',
    textContent: '',
    checkValidity: jest.fn(() => true),
    querySelector: jest.fn(() => createFakeElement()),
    querySelectorAll: jest.fn(() => []),
  };
}

function ensureFakeElements(fakeElements, selectors) {
  selectors.forEach((sel) => {
    if (!fakeElements[sel]) fakeElements[sel] = createFakeElement();
  });
}

function createMockComponent() {
  const component = new CategoriasIndexComponent();
  const fakeElements = {};

  component.querySelector = (selector) => {
    if (!fakeElements[selector]) {
      fakeElements[selector] = createFakeElement();
    }
    return fakeElements[selector];
  };

  component.querySelectorAll = (selector) => {
    if (!fakeElements[selector]) {
      fakeElements[selector] = [];
    }
    return fakeElements[selector];
  };

  return { component, fakeElements };
}

beforeAll(async () => {
  CategoriasIndexComponent = (await import('./categorias-index.component.js')).CategoriasIndexComponent;
  CategoriaIncidenciaService = (await import('../../services/categoria-incidencia.service.js')).CategoriaIncidenciaService;
  AuthService = (await import('../../../../core/auth.service.js')).AuthService;
  ModalService = (await import('../../../../shared/services/modal.service.js')).ModalService;
  ToastService = (await import('../../../../shared/services/toast.service.js')).ToastService;
  apiRequest = (await import('../../../../core/api.js')).apiRequest;
  CatalogoService = (await import('../../../../shared/services/catalogo.service.js')).CatalogoService;
  InstitucionService = (await import('../../../instituciones/services/institucion.service.js')).InstitucionService;
});

beforeEach(() => {
  jest.clearAllMocks();
  CategoriaIncidenciaService.getAll.mockResolvedValue([]);
  CategoriaIncidenciaService.create.mockResolvedValue({});
  CategoriaIncidenciaService.update.mockResolvedValue({});
  CategoriaIncidenciaService.delete.mockResolvedValue({});
  AuthService.hasPermission.mockReturnValue(true);
  ToastService.success.mockReturnValue(undefined);
  ToastService.error.mockReturnValue(undefined);
  ModalService.confirm.mockResolvedValue(true);
  apiRequest.mockResolvedValue([]);
  CatalogoService.clearCategoriasCache.mockReturnValue(undefined);
  InstitucionService.getAll.mockResolvedValue([]);
  window.bootstrap = {
    Modal: class {
      constructor() {}
      show() {}
      hide() {}
    },
  };
});

describe('CategoriasIndexComponent', () => {

  it('1 - Component is defined as custom element', () => {
    expect(customElements.get('app-categorias-index')).toBe(CategoriasIndexComponent);
  });

  it('2 - onInit() - initializes modal, loads categories', async () => {
    const { component } = createMockComponent();
    const cargarCategoriasSpy = jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    expect(component.categoriaModalObj).toBeDefined();
    expect(component.categoriaModalObj).toBeInstanceOf(window.bootstrap.Modal);
    expect(cargarCategoriasSpy).toHaveBeenCalled();
  });

  it('2b - onInit() - handles modal init failure gracefully', async () => {
    window.bootstrap.Modal = class {
      constructor() { throw new Error('Modal init error'); }
    };
    const { component } = createMockComponent();
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    expect(component.categoriaModalObj).toBeNull();
  });

  it('3 - onInit() - hides btnNuevaCategoria if no CREATE permission', async () => {
    AuthService.hasPermission.mockReturnValue(false);
    const { component, fakeElements } = createMockComponent();
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    expect(fakeElements['#btnNuevaCategoria'].classList.add).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#btnNuevaCategoria'].addEventListener).not.toHaveBeenCalled();
  });

  it('4 - onInit() - sets up form submit event', async () => {
    const { component, fakeElements } = createMockComponent();
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    expect(fakeElements['#categoriaForm'].addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
  });

  it('5a - onInit() - handles delegated click for toggle-group', async () => {
    const { component, fakeElements } = createMockComponent();
    jest.spyOn(component, '_toggleGroup').mockImplementation(() => {});
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    const tbody = fakeElements['#cat-tbody'];
    const clickHandler = tbody.addEventListener.mock.calls.find(c => c[0] === 'click')[1];
    clickHandler({
      target: {
        closest: (s) => {
          if (s === '[data-toggle-group]') return { dataset: { toggleGroup: '5' } };
          if (s === '[data-cat-action]') return null;
          return null;
        },
      },
    });
    expect(component._toggleGroup).toHaveBeenCalledWith('5');
  });

  it('5b - onInit() - handles delegated click for agregar-sub, editar, eliminar', async () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriasList = [
      { id: 1, nombre: 'Cat 1', parent_id: null },
      { id: 2, nombre: 'Cat 2', parent_id: null },
    ];
    jest.spyOn(component, 'abrirModalCategoria').mockImplementation(() => {});
    jest.spyOn(component, 'eliminarCategoria').mockImplementation(() => {});
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    await component.onInit();
    const tbody = fakeElements['#cat-tbody'];
    const clickHandler = tbody.addEventListener.mock.calls.find(c => c[0] === 'click')[1];

    clickHandler({
      target: {
        closest: (s) => {
          if (s === '[data-toggle-group]') return null;
          if (s === '[data-cat-action]') return { dataset: { catAction: 'editar', catId: '1' } };
          return null;
        },
      },
    });
    expect(component.abrirModalCategoria).toHaveBeenCalledWith({ id: 1, nombre: 'Cat 1', parent_id: null });
    jest.clearAllMocks();

    clickHandler({
      target: {
        closest: (s) => {
          if (s === '[data-toggle-group]') return null;
          if (s === '[data-cat-action]') return { dataset: { catAction: 'agregar-sub', catId: '2' } };
          return null;
        },
      },
    });
    expect(component.abrirModalCategoria).toHaveBeenCalledWith(null, 2);
    jest.clearAllMocks();

    clickHandler({
      target: {
        closest: (s) => {
          if (s === '[data-toggle-group]') return null;
          if (s === '[data-cat-action]') return { dataset: { catAction: 'eliminar', catId: '1' } };
          return null;
        },
      },
    });
    expect(component.eliminarCategoria).toHaveBeenCalledWith(1, 'Cat 1');
  });

  it('6 - _cargarCatalogos() - loads prioridades and instituciones successfully', async () => {
    const { component } = createMockComponent();
    apiRequest.mockResolvedValue([{ id: 1, nombre: 'Alta' }, { id: 2, nombre: 'Baja' }]);
    InstitucionService.getAll.mockResolvedValue([{ id: 1, nombre: 'Inst 1' }]);
    await component._cargarCatalogos();
    expect(apiRequest).toHaveBeenCalledWith('/priorities');
    expect(InstitucionService.getAll).toHaveBeenCalledWith(1, 15, null, { all: true });
    expect(component.prioridadesList).toEqual([{ id: 1, nombre: 'Alta' }, { id: 2, nombre: 'Baja' }]);
    expect(component.institucionesList).toEqual([{ id: 1, nombre: 'Inst 1' }]);
    expect(component._catalogsLoaded).toBe(true);
  });

  it('7 - _cargarCatalogos() - handles error gracefully', async () => {
    const { component } = createMockComponent();
    apiRequest.mockRejectedValue(new Error('Network error'));
    InstitucionService.getAll.mockRejectedValue(new Error('Network error'));
    await expect(component._cargarCatalogos()).resolves.toBeUndefined();
    expect(component.prioridadesList).toEqual([]);
    expect(component.institucionesList).toEqual([]);
    expect(component._catalogsLoaded).toBe(true);
  });

  it('8 - _llenarSelectPrioridad() - fills select with options, selects one', () => {
    const { component, fakeElements } = createMockComponent();
    component.prioridadesList = [
      { id: 1, nombre: 'Alta' },
      { id: 2, nombre: 'Media' },
      { id: 3, nombre: 'Baja' },
    ];
    component._llenarSelectPrioridad(2);
    const html = fakeElements['#categoriaPrioridadSelect'].innerHTML;
    expect(html).toContain('-- Sin prioridad por defecto --');
    expect(html).toContain('value="1"');
    expect(html).toContain('value="2" selected');
    expect(html).toContain('value="3"');
    expect(html).toContain('Alta');
    expect(html).toContain('Media');
    expect(html).toContain('Baja');
  });

  it('9 - _llenarSelectInstitucion() - fills select with options', () => {
    const { component, fakeElements } = createMockComponent();
    component.institucionesList = [
      { id: 1, nombre: 'Inst A' },
      { id: 2, nombre: 'Inst B' },
    ];
    component._llenarSelectInstitucion(2);
    const html = fakeElements['#categoriaInstitucionSelect'].innerHTML;
    expect(html).toContain('-- Sin institución asignada --');
    expect(html).toContain('value="1"');
    expect(html).toContain('value="2" selected');
    expect(html).toContain('Inst A');
    expect(html).toContain('Inst B');
  });

  it('10 - cargarCategorias() - empty list shows empty state', async () => {
    const { component } = createMockComponent();
    CategoriaIncidenciaService.getAll.mockResolvedValue([]);
    const setLoadingSpy = jest.spyOn(component, '_setLoadingState');
    await component.cargarCategorias();
    expect(setLoadingSpy).toHaveBeenCalledWith('loading');
    expect(setLoadingSpy).toHaveBeenCalledWith('empty');
    expect(component.categoriasList).toEqual([]);
  });

  it('11 - cargarCategorias() - with data, calls render and fills parent select', async () => {
    const { component } = createMockComponent();
    const mockData = [
      { id: 1, nombre: 'Padre', parent_id: null, activo: true },
      { id: 2, nombre: 'Hijo', parent_id: 1, activo: true },
    ];
    CategoriaIncidenciaService.getAll.mockResolvedValue(mockData);
    const setLoadingSpy = jest.spyOn(component, '_setLoadingState');
    const renderSpy = jest.spyOn(component, '_renderAccordion').mockImplementation(() => {});
    component.llenarParentSelect = jest.fn();
    await component.cargarCategorias();
    expect(component.categoriasList).toHaveLength(2);
    expect(setLoadingSpy).toHaveBeenCalledWith('loading');
    expect(setLoadingSpy).toHaveBeenCalledWith('ready');
    expect(renderSpy).toHaveBeenCalled();
    expect(component.llenarParentSelect).toHaveBeenCalled();
  });

  it('12 - cargarCategorias() - handles API error', async () => {
    const { component } = createMockComponent();
    const testError = new Error('API failure');
    CategoriaIncidenciaService.getAll.mockRejectedValue(testError);
    const setLoadingSpy = jest.spyOn(component, '_setLoadingState');
    await component.cargarCategorias();
    expect(setLoadingSpy).toHaveBeenCalledWith('loading');
    expect(setLoadingSpy).toHaveBeenCalledWith('error', 'API failure');
  });

  it('13 - _renderAccordion() - renders parent and child rows with toggle buttons', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriasList = [
      { id: 1, nombre: 'Parent 1', descripcion: 'Desc 1', activo: true, parent_id: null },
      { id: 2, nombre: 'Child 1', descripcion: 'Child desc', activo: true, parent_id: 1 },
      { id: 3, nombre: 'Parent 2', descripcion: '', activo: false, parent_id: null },
    ];
    component._renderAccordion();
    const html = fakeElements['#cat-tbody'].innerHTML;
    expect(html).toContain('Parent 1');
    expect(html).toContain('Child 1');
    expect(html).toContain('Parent 2');
    expect(html).toContain('data-toggle-group="1"');
    expect(html).toContain('bi-chevron-right');
    expect(html).toContain('cat-child-row border-bottom d-none');
    expect(html).toContain('data-child-of="1"');
    expect(html).toContain('<span class="fst-italic">Sin descripción</span>');
  });

  it('14 - _renderAccordion() - renders orphan subcategories', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriasList = [
      { id: 1, nombre: 'Parent', descripcion: 'P', activo: true, parent_id: null },
      { id: 2, nombre: 'Orphan', descripcion: 'O', activo: true, parent_id: 999 },
    ];
    component._renderAccordion();
    const html = fakeElements['#cat-tbody'].innerHTML;
    expect(html).toContain('Subcategorías huérfanas');
    expect(html).toContain('Orphan');
  });

  it('15 - _parentRow() - renders with subcount badge and actions', () => {
    const { component } = createMockComponent();
    const cat = { id: 1, nombre: 'Test Cat', descripcion: 'Test desc', activo: true };
    const toggleIcon = '<span class="toggle-placeholder"></span>';
    const html = component._parentRow(cat, 2, toggleIcon, true, true, true);
    expect(html).toContain('Test Cat');
    expect(html).toContain('Test desc');
    expect(html).toContain('Activa');
    expect(html).toContain('2 sub');
    expect(html).toContain('cat-parent-row');
    expect(html).toContain('data-parent-id="1"');
    expect(html).toContain('toggle-placeholder');
    expect(html).toContain('dropdown');
  });

  it('16 - _childRow() - renders with d-none class when not visible', () => {
    const { component } = createMockComponent();
    const cat = { id: 2, nombre: 'Child Cat', descripcion: 'Child desc', activo: false };
    const html = component._childRow(cat, 1, false, true, true);
    expect(html).toContain('Child Cat');
    expect(html).toContain('Child desc');
    expect(html).toContain('Inactiva');
    expect(html).toContain('cat-child-row border-bottom d-none');
    expect(html).toContain('data-child-of="1"');
  });

  it('17 - _statusBadge() - returns Activa for active, Inactiva for inactive', () => {
    const { component } = createMockComponent();
    const activeHtml = component._statusBadge(true);
    expect(activeHtml).toContain('Activa');
    expect(activeHtml).not.toContain('Inactiva');
    const inactiveHtml = component._statusBadge(false);
    expect(inactiveHtml).toContain('Inactiva');
    expect(inactiveHtml).not.toContain('Activa');
  });

  it('18 - _actionsDropdown() - returns correct buttons based on permissions', () => {
    const { component } = createMockComponent();
    const cat = { id: 1, nombre: 'Test' };
    const allPerms = component._actionsDropdown(cat, true, true, true, true);
    expect(allPerms).toContain('agregar-sub');
    expect(allPerms).toContain('editar');
    expect(allPerms).toContain('eliminar');
    const noCreate = component._actionsDropdown(cat, false, true, true, true);
    expect(noCreate).not.toContain('agregar-sub');
    expect(noCreate).toContain('editar');
    expect(noCreate).toContain('eliminar');
    const noEdit = component._actionsDropdown(cat, true, false, true, true);
    expect(noEdit).toContain('agregar-sub');
    expect(noEdit).not.toContain('editar');
    expect(noEdit).toContain('eliminar');
    const noDelete = component._actionsDropdown(cat, true, true, false, true);
    expect(noDelete).toContain('agregar-sub');
    expect(noDelete).toContain('editar');
    expect(noDelete).not.toContain('eliminar');
  });

  it('19 - _actionsDropdown() - returns empty string when no permissions', () => {
    const { component } = createMockComponent();
    const cat = { id: 1, nombre: 'Test' };
    const html = component._actionsDropdown(cat, false, false, false, true);
    expect(html).toBe('');
  });

  it('20 - _toggleGroup() - expands child rows and rotates chevron', () => {
    const { component, fakeElements } = createMockComponent();
    const childRows = [
      { classList: { toggle: jest.fn() } },
      { classList: { toggle: jest.fn() } },
    ];
    fakeElements['[data-child-of="1"]'] = childRows;
    const icon = { className: '' };
    fakeElements['[data-toggle-group="1"]'] = {
      querySelector: jest.fn(() => icon),
      title: '',
    };
    component._toggleGroup(1);
    expect(component.expandedGroups.has('1')).toBe(true);
    expect(childRows[0].classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(childRows[1].classList.toggle).toHaveBeenCalledWith('d-none', false);
    expect(icon.className).toBe('bi bi-chevron-down');
  });

  it('21 - _toggleGroup() - collapses child rows', () => {
    const { component, fakeElements } = createMockComponent();
    component.expandedGroups.add('1');
    const childRows = [
      { classList: { toggle: jest.fn() } },
    ];
    fakeElements['[data-child-of="1"]'] = childRows;
    const icon = { className: 'bi bi-chevron-down' };
    fakeElements['[data-toggle-group="1"]'] = {
      querySelector: jest.fn(() => icon),
      title: '',
    };
    component._toggleGroup(1);
    expect(component.expandedGroups.has('1')).toBe(false);
    expect(childRows[0].classList.toggle).toHaveBeenCalledWith('d-none', true);
    expect(icon.className).toBe('bi bi-chevron-right');
  });

  it('22 - _setLoadingState() - shows loading, empty, ready, error states', () => {
    const { component, fakeElements } = createMockComponent();
    component._setLoadingState('loading');
    expect(fakeElements['#cat-loading'].classList.remove).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#cat-empty'].classList.remove).not.toHaveBeenCalled();
    component._setLoadingState('empty');
    expect(fakeElements['#cat-empty'].classList.remove).toHaveBeenCalledWith('d-none');
    component._setLoadingState('ready');
    expect(fakeElements['#cat-table-container'].classList.remove).toHaveBeenCalledWith('d-none');
    component._setLoadingState('error', 'Server error');
    expect(fakeElements['#cat-error'].classList.remove).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#cat-error-msg'].textContent).toBe('Server error');
  });

  it('23 - llenarParentSelect() - fills select with active parent categories', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriasList = [
      { id: 1, nombre: 'Parent 1', activo: true, parent_id: null },
      { id: 2, nombre: 'Parent 2', activo: true, parent_id: null },
      { id: 3, nombre: 'Child', activo: true, parent_id: 1 },
      { id: 4, nombre: 'Inactive Parent', activo: false, parent_id: null },
    ];
    component.llenarParentSelect();
    const html = fakeElements['#categoriaParentSelect'].innerHTML;
    expect(html).toContain('Parent 1');
    expect(html).toContain('Parent 2');
    expect(html).not.toContain('Child');
    expect(html).not.toContain('Inactive Parent');
  });

  it('24 - llenarParentSelect() - excludes given id', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriasList = [
      { id: 1, nombre: 'Parent 1', activo: true, parent_id: null },
      { id: 2, nombre: 'Parent 2', activo: true, parent_id: null },
    ];
    component.llenarParentSelect(1);
    const html = fakeElements['#categoriaParentSelect'].innerHTML;
    expect(html).not.toContain('Parent 1');
    expect(html).toContain('Parent 2');
  });

  it('25 - abrirModalCategoria() - opens modal for new category with parentId', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { show: jest.fn() };
    component.llenarParentSelect = jest.fn();
    component._llenarSelectPrioridad = jest.fn();
    component._llenarSelectInstitucion = jest.fn();
    component.abrirModalCategoria(null, 5);
    expect(fakeElements['#categoriaModalErrorAlert'].classList.add).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#categoriaForm'].classList.remove).toHaveBeenCalledWith('was-validated');
    expect(component.llenarParentSelect).toHaveBeenCalledWith(null);
    expect(component._llenarSelectPrioridad).toHaveBeenCalledWith(null);
    expect(component._llenarSelectInstitucion).toHaveBeenCalledWith(null);
    expect(fakeElements['#categoriaModalLabel'].textContent).toBe('Nueva Categoría');
    expect(fakeElements['#categoriaId'].value).toBe('');
    expect(fakeElements['#categoriaNombre'].value).toBe('');
    expect(fakeElements['#categoriaDescripcion'].value).toBe('');
    expect(fakeElements['#categoriaParentSelect'].value).toBe(5);
    expect(fakeElements['#categoriaActivo'].checked).toBe(true);
    expect(component.categoriaModalObj.show).toHaveBeenCalled();
  });

  it('26 - abrirModalCategoria() - opens modal for edit with data', () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { show: jest.fn() };
    component.llenarParentSelect = jest.fn();
    component._llenarSelectPrioridad = jest.fn();
    component._llenarSelectInstitucion = jest.fn();
    const mockCat = { id: 5, nombre: 'Cat 5', descripcion: 'Desc 5', parent_id: 1, activo: false, prioridad_id: 3, institucion_id: 2 };
    component.abrirModalCategoria(mockCat);
    expect(component.llenarParentSelect).toHaveBeenCalledWith(5);
    expect(component._llenarSelectPrioridad).toHaveBeenCalledWith(3);
    expect(component._llenarSelectInstitucion).toHaveBeenCalledWith(2);
    expect(fakeElements['#categoriaModalLabel'].textContent).toBe('Editar Categoría');
    expect(fakeElements['#categoriaId'].value).toBe(5);
    expect(fakeElements['#categoriaNombre'].value).toBe('Cat 5');
    expect(fakeElements['#categoriaDescripcion'].value).toBe('Desc 5');
    expect(fakeElements['#categoriaParentSelect'].value).toBe(1);
    expect(fakeElements['#categoriaActivo'].checked).toBe(false);
    expect(component.categoriaModalObj.show).toHaveBeenCalled();
  });

  it('27 - guardarCategoria() - creates new category', async () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { hide: jest.fn() };
    ensureFakeElements(fakeElements, ['#categoriaId', '#categoriaNombre', '#categoriaDescripcion', '#categoriaParentSelect', '#categoriaPrioridadSelect', '#categoriaInstitucionSelect', '#categoriaActivo', '#categoriaForm']);
    fakeElements['#categoriaId'].value = '';
    fakeElements['#categoriaNombre'].value = 'Nueva Cat';
    fakeElements['#categoriaDescripcion'].value = 'Desc';
    fakeElements['#categoriaParentSelect'].value = '';
    fakeElements['#categoriaPrioridadSelect'].value = '';
    fakeElements['#categoriaInstitucionSelect'].value = '';
    fakeElements['#categoriaActivo'].checked = true;
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    const event = { preventDefault: jest.fn() };
    await component.guardarCategoria(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(CategoriaIncidenciaService.create).toHaveBeenCalledWith({
      nombre: 'Nueva Cat',
      descripcion: 'Desc',
      parent_id: null,
      prioridad_id: null,
      institucion_id: null,
      activo: true,
    });
    expect(CategoriaIncidenciaService.update).not.toHaveBeenCalled();
    expect(ToastService.success).toHaveBeenCalledWith('Categoría "Nueva Cat" creada con éxito.');
    expect(component.categoriaModalObj.hide).toHaveBeenCalled();
    expect(component.cargarCategorias).toHaveBeenCalled();
    expect(CatalogoService.clearCategoriasCache).toHaveBeenCalled();
  });

  it('28 - guardarCategoria() - updates existing category', async () => {
    const { component, fakeElements } = createMockComponent();
    component.categoriaModalObj = { hide: jest.fn() };
    ensureFakeElements(fakeElements, ['#categoriaId', '#categoriaNombre', '#categoriaDescripcion', '#categoriaParentSelect', '#categoriaPrioridadSelect', '#categoriaInstitucionSelect', '#categoriaActivo', '#categoriaForm']);
    fakeElements['#categoriaId'].value = '10';
    fakeElements['#categoriaNombre'].value = 'Updated Cat';
    fakeElements['#categoriaDescripcion'].value = 'Updated desc';
    fakeElements['#categoriaParentSelect'].value = '2';
    fakeElements['#categoriaPrioridadSelect'].value = '3';
    fakeElements['#categoriaInstitucionSelect'].value = '4';
    fakeElements['#categoriaActivo'].checked = false;
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    const event = { preventDefault: jest.fn() };
    await component.guardarCategoria(event);
    expect(CategoriaIncidenciaService.create).not.toHaveBeenCalled();
    expect(CategoriaIncidenciaService.update).toHaveBeenCalledWith('10', {
      nombre: 'Updated Cat',
      descripcion: 'Updated desc',
      parent_id: 2,
      prioridad_id: 3,
      institucion_id: 4,
      activo: false,
    });
    expect(ToastService.success).toHaveBeenCalledWith('Categoría "Updated Cat" actualizada con éxito.');
    expect(component.categoriaModalObj.hide).toHaveBeenCalled();
    expect(component.cargarCategorias).toHaveBeenCalled();
    expect(CatalogoService.clearCategoriasCache).toHaveBeenCalled();
  });

  it('29 - guardarCategoria() - form validation fails', async () => {
    const { component, fakeElements } = createMockComponent();
    ensureFakeElements(fakeElements, ['#categoriaForm']);
    fakeElements['#categoriaForm'].checkValidity.mockReturnValue(false);
    const event = { preventDefault: jest.fn() };
    await component.guardarCategoria(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(fakeElements['#categoriaForm'].classList.add).toHaveBeenCalledWith('was-validated');
    expect(CategoriaIncidenciaService.create).not.toHaveBeenCalled();
    expect(CategoriaIncidenciaService.update).not.toHaveBeenCalled();
  });

  it('30 - guardarCategoria() - handles API error', async () => {
    const { component, fakeElements } = createMockComponent();
    ensureFakeElements(fakeElements, ['#categoriaId', '#categoriaNombre', '#categoriaDescripcion', '#categoriaParentSelect', '#categoriaPrioridadSelect', '#categoriaInstitucionSelect', '#categoriaActivo', '#categoriaModalErrorAlert', '#categoriaModalErrorMessage']);
    fakeElements['#categoriaId'].value = '';
    fakeElements['#categoriaNombre'].value = 'Fail Cat';
    fakeElements['#categoriaDescripcion'].value = '';
    fakeElements['#categoriaParentSelect'].value = '';
    fakeElements['#categoriaPrioridadSelect'].value = '';
    fakeElements['#categoriaInstitucionSelect'].value = '';
    fakeElements['#categoriaActivo'].checked = true;
    const testError = new Error('Create failed');
    CategoriaIncidenciaService.create.mockRejectedValue(testError);
    const event = { preventDefault: jest.fn() };
    await component.guardarCategoria(event);
    expect(fakeElements['#categoriaModalErrorAlert'].classList.remove).toHaveBeenCalledWith('d-none');
    expect(fakeElements['#categoriaModalErrorMessage'].textContent).toBe('Create failed');
    expect(CatalogoService.clearCategoriasCache).toHaveBeenCalled();
  });

  it('31 - eliminarCategoria() - deletes after confirmation', async () => {
    const { component } = createMockComponent();
    jest.spyOn(component, 'cargarCategorias').mockImplementation(async () => {});
    ModalService.confirm.mockResolvedValue(true);
    await component.eliminarCategoria(10, 'Prueba');
    expect(CategoriaIncidenciaService.delete).toHaveBeenCalledWith(10);
    expect(ToastService.success).toHaveBeenCalledWith('Categoría "Prueba" eliminada con éxito.');
    expect(component.cargarCategorias).toHaveBeenCalled();
    expect(CatalogoService.clearCategoriasCache).toHaveBeenCalled();
  });

  it('32 - eliminarCategoria() - does not delete if not confirmed', async () => {
    const { component } = createMockComponent();
    ModalService.confirm.mockResolvedValue(false);
    await component.eliminarCategoria(10, 'Prueba');
    expect(CategoriaIncidenciaService.delete).not.toHaveBeenCalled();
  });

  it('33 - eliminarCategoria() - handles API error', async () => {
    const { component } = createMockComponent();
    ModalService.confirm.mockResolvedValue(true);
    const testError = new Error('Delete failed');
    CategoriaIncidenciaService.delete.mockRejectedValue(testError);
    await component.eliminarCategoria(10, 'Prueba');
    expect(ToastService.error).toHaveBeenCalledWith('No se pudo eliminar: Delete failed');
    expect(CatalogoService.clearCategoriasCache).toHaveBeenCalled();
  });

});
