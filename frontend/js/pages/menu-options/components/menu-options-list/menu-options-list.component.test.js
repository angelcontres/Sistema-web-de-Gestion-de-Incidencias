import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockMenuOptionService = { delete: jest.fn(), getAll: jest.fn() };
const mockAuthService = { hasPermission: jest.fn() };
const mockModalService = { confirm: jest.fn() };
const mockToastService = { success: jest.fn(), error: jest.fn() };

jest.unstable_mockModule('../../services/menu-option.service.js', () => ({
  MenuOptionService: mockMenuOptionService,
}));
jest.unstable_mockModule('../../../../core/auth.service.js', () => ({
  AuthService: mockAuthService,
}));
jest.unstable_mockModule('../../../../shared/services/modal.service.js', () => ({
  ModalService: mockModalService,
}));
jest.unstable_mockModule('../../../../shared/services/toast.service.js', () => ({
  ToastService: mockToastService,
}));

const { MenuOptionsListComponent } = await import('./menu-options-list.component.js');

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
          classList: { add: jest.fn(), remove: jest.fn() },
        };
      }
      return fakeElements[selector];
    });

    return { component, fakeElements };
  }

  beforeEach(() => {
    mockAuthService.hasPermission.mockReturnValue(true);
    mockMenuOptionService.delete.mockReset();
    mockMenuOptionService.getAll.mockReset();
    mockModalService.confirm.mockReset();
    mockToastService.success.mockReset();
    mockToastService.error.mockReset();
    window.location.hash = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. Component is defined as custom element', () => {
    expect(customElements.get('app-menu-options-list')).toBe(MenuOptionsListComponent);
  });

  it('2. onInit hides btnNuevo if no CREATE permission', async () => {
    mockAuthService.hasPermission.mockImplementation((action) => {
      if (action === 'CREATE') return false;
      return true;
    });

    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    expect(fakeElements['#btnNuevoRegistro'].classList.add).toHaveBeenCalledWith('d-none');
  });

  it('3. onInit configures table with correct columns', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const configArg =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0];
    expect(configArg.columns).toBeDefined();
    expect(configArg.columns.length).toBe(6);
    expect(configArg.columns[0].header).toBe('Nombre');
    expect(configArg.columns[1].header).toBe('Icono');
    expect(configArg.columns[2].header).toBe('Ruta');
    expect(configArg.columns[3].header).toBe('Padre');
    expect(configArg.columns[4].header).toBe('Creado el');
    expect(configArg.columns[5].header).toBe('Acciones');
  });

  it('4. onInit row-action editar navigates to form with hash', async () => {
    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();

    eventCallback({ detail: { action: 'editar', item: { id: 7 } } });
    expect(window.location.hash).toBe('#/opciones-menu/form?id=7');
  });

  it('5. onInit row-action eliminar confirms and calls service', async () => {
    mockModalService.confirm.mockResolvedValue(true);
    mockMenuOptionService.delete.mockResolvedValue();

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();
    await eventCallback({
      detail: { action: 'eliminar', item: { id: 5, nombre: 'Test' } },
    });

    expect(mockModalService.confirm).toHaveBeenCalledWith(
      'Eliminar Opción',
      expect.any(String),
      'Eliminar',
      'Cancelar',
      'btn-danger',
    );
    expect(mockMenuOptionService.delete).toHaveBeenCalledWith(5);
    expect(mockToastService.success).toHaveBeenCalledWith(
      'La opción "Test" se eliminó correctamente.',
    );
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(
      fakeElements['#tbl-datos-opciones-menu'].load,
    ).toHaveBeenCalledWith(mockMenuOptionService.getAll);
  });

  it('6. onInit row-action eliminar not confirmed, no delete', async () => {
    mockModalService.confirm.mockResolvedValue(false);

    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();
    await eventCallback({
      detail: { action: 'eliminar', item: { id: 5, nombre: 'Test' } },
    });

    expect(mockModalService.confirm).toHaveBeenCalled();
    expect(mockMenuOptionService.delete).not.toHaveBeenCalled();
  });

  it('7. onInit row-action eliminar handles API error', async () => {
    mockModalService.confirm.mockResolvedValue(true);
    mockMenuOptionService.delete.mockRejectedValue(new Error('Network failure'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();
    await eventCallback({
      detail: { action: 'eliminar', item: { id: 5, nombre: 'Test' } },
    });

    expect(mockToastService.error).toHaveBeenCalledWith(
      'Error al eliminar: Network failure',
    );
    consoleSpy.mockRestore();
  });

  it('8. onInit configure action columns based on UPDATE/DELETE permissions', async () => {
    mockAuthService.hasPermission.mockImplementation((action) => {
      if (action === 'UPDATE' || action === 'DELETE') return true;
      return true;
    });

    let { component, fakeElements } = createMockComponent();
    await component.onInit();
    let columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    let actionsCol = columns[5];
    expect(actionsCol.header).toBe('Acciones');
    expect(actionsCol.actions.length).toBe(2);
    expect(actionsCol.actions[0].name).toBe('editar');
    expect(actionsCol.actions[1].name).toBe('eliminar');

    jest.clearAllMocks();
    mockAuthService.hasPermission.mockImplementation((action) => {
      if (action === 'UPDATE') return true;
      return false;
    });
    ({ component, fakeElements } = createMockComponent());
    await component.onInit();
    columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    actionsCol = columns[5];
    expect(actionsCol.actions.length).toBe(1);
    expect(actionsCol.actions[0].name).toBe('editar');

    jest.clearAllMocks();
    mockAuthService.hasPermission.mockImplementation((action) => {
      if (action === 'DELETE') return true;
      return false;
    });
    ({ component, fakeElements } = createMockComponent());
    await component.onInit();
    columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    actionsCol = columns[5];
    expect(actionsCol.actions.length).toBe(1);
    expect(actionsCol.actions[0].name).toBe('eliminar');
  });

  it('9. onInit no actions column when no UPDATE or DELETE permission', async () => {
    mockAuthService.hasPermission.mockReturnValue(false);

    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    expect(columns.length).toBe(5);
    const headers = columns.map((c) => c.header);
    expect(headers).not.toContain('Acciones');
  });

  it('10. onInit icono render empty shows dash', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    const iconoCol = columns[1];

    expect(iconoCol.render({ icono: '' })).toBe(
      '<span class="text-muted small">-</span>',
    );
    expect(iconoCol.render({ icono: '   ' })).toBe(
      '<span class="text-muted small">-</span>',
    );
    expect(iconoCol.render({})).toBe(
      '<span class="text-muted small">-</span>',
    );
  });

  it('11. onInit icono render valid bi icon class', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    const iconoCol = columns[1];

    const result = iconoCol.render({ icono: 'bi-gear' });
    const expected = [
      '',
      '              <span class="d-flex align-items-center gap-2 text-dark small">',
      '                <i class="bi bi-gear text-primary fs-5"></i>',
      '                <code>bi-gear</code>',
      '              </span>',
      '            ',
    ].join('\n');
    expect(result).toBe(expected);
  });

  it('12. onInit padre render with padre.nombre shows badge', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    const padreCol = columns[3];

    const result = padreCol.render({ padre: { nombre: 'Configuración' } });
    expect(result).toContain('badge');
    expect(result).toContain('Configuración');
    expect(result).toContain('bi-folder-fill');
  });

  it('13. onInit padre render without padre shows dash', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    const padreCol = columns[3];

    expect(padreCol.render({})).toBe(
      '<span class="text-muted small">-</span>',
    );
    expect(padreCol.render({ padre: null })).toBe(
      '<span class="text-muted small">-</span>',
    );
  });

  it('14. onInit created_at render formats date or shows dash', async () => {
    const { component, fakeElements } = createMockComponent();
    await component.onInit();

    const columns =
      fakeElements['#tbl-datos-opciones-menu'].configure.mock.calls[0][0].columns;
    const dateCol = columns[4];

    const dateResult = dateCol.render({
      created_at: '2025-06-15T10:30:00Z',
    });
    expect(dateResult).toContain('2025');
    expect(dateCol.render({})).toBe('-');
  });

  it('15. showSuccessMessage shows alert with classList manipulation', () => {
    const component = new MenuOptionsListComponent();
    const successAlert = { classList: { add: jest.fn(), remove: jest.fn() } };
    const successMessage = { textContent: '' };

    component.querySelector = jest.fn((sel) => {
      if (sel === '#successAlert') return successAlert;
      if (sel === '#successMessage') return successMessage;
      return null;
    });

    jest.useFakeTimers();
    component.showSuccessMessage('Éxito completo');

    expect(successMessage.textContent).toBe('Éxito completo');
    expect(successAlert.classList.remove).toHaveBeenCalledWith('d-none');

    jest.advanceTimersByTime(4000);
    expect(successAlert.classList.add).toHaveBeenCalledWith('d-none');

    jest.useRealTimers();
  });

  it('16. showSuccessMessage does nothing if alert elements missing', () => {
    const component = new MenuOptionsListComponent();
    component.querySelector = jest.fn(() => null);

    expect(() => {
      component.showSuccessMessage('Test');
    }).not.toThrow();
  });

  it('17. onInit dispatches menu-change event after deletion', async () => {
    mockModalService.confirm.mockResolvedValue(true);
    mockMenuOptionService.delete.mockResolvedValue();

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();
    await eventCallback({
      detail: { action: 'eliminar', item: { id: 1, nombre: 'Test' } },
    });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('menu-change');
  });

  it('18. onInit calls tblDatos.load with MenuOptionService.getAll after deletion', async () => {
    mockModalService.confirm.mockResolvedValue(true);
    mockMenuOptionService.delete.mockResolvedValue();

    const { component, fakeElements } = createMockComponent();
    let eventCallback;
    fakeElements['#tbl-datos-opciones-menu'] = {
      configure: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn((e, cb) => {
        if (e === 'row-action') eventCallback = cb;
      }),
    };

    await component.onInit();
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    await eventCallback({
      detail: { action: 'eliminar', item: { id: 1, nombre: 'Test' } },
    });
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const loadCalls =
      fakeElements['#tbl-datos-opciones-menu'].load.mock.calls;
    expect(loadCalls.length).toBe(2);
    expect(loadCalls[1][0]).toBe(mockMenuOptionService.getAll);
  });
});
