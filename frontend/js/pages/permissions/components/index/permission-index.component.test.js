import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../services/permissions.service.js', () => ({
  PermissionService: { delete: jest.fn() }
}));

jest.unstable_mockModule('../../../../core/auth.service.js', () => ({
  AuthService: { hasPermission: jest.fn() }
}));

jest.unstable_mockModule('../../../../shared/services/modal.service.js', () => ({
  ModalService: { confirm: jest.fn() }
}));

jest.unstable_mockModule('../../../../shared/services/toast.service.js', () => ({
  ToastService: { success: jest.fn(), error: jest.fn() }
}));

const BASE_TEMPLATE = `
<div class="page-fade-in">
  <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
    <div>
      <h1 class="h3 fw-bold text-dark mb-1">Permisos del Sistema</h1>
      <p class="text-muted small mb-0">Gestiona los permisos y accesos de las opciones del sistema.</p>
    </div>
    <button id="btn-nuevo-registro" class="btn btn-primary fw-semibold px-4 py-2 rounded-2 d-flex align-items-center gap-2">
      <i class="bi bi-plus-lg"></i> Nuevo Registro
    </button>
  </div>
  <div id="successAlert" class="alert alert-success my-2 d-none">
    <i class="bi bi-check-circle-fill me-2"></i>
    <span id="successMessage">Acci\u00f3n completada con \u00e9xito.</span>
  </div>
  <app-data-table id="tbl-datos-permisos" title="Lista de Permisos" empty-text="No se encontraron permisos registrados."></app-data-table>
  <app-permission-form id="app-permission-form"></app-permission-form>
</div>`;

const TEMPLATE_WITH_ERROR_ALERT = `
<div class="page-fade-in">
  <div id="errorAlert" class="alert alert-danger my-2 d-none">
    <span id="errorMessage">Error message.</span>
  </div>
  <div id="successAlert" class="alert alert-success my-2 d-none">
    <span id="successMessage">Acci\u00f3n completada.</span>
  </div>
  <app-data-table id="tbl-datos-permisos"></app-data-table>
  <app-permission-form id="app-permission-form"></app-permission-form>
</div>`;

const MINIMAL_TEMPLATE = `<div><app-data-table id="tbl-datos-permisos"></app-data-table><app-permission-form id="app-permission-form"></app-permission-form></div>`;

function setupFetch(template = BASE_TEMPLATE) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });
}

class MockAppDataTable extends HTMLElement {
  constructor() {
    super();
    this.configure = jest.fn();
    this.load = jest.fn();
    this._handlers = {};
    this.addEventListener = jest.fn((evt, fn) => { this._handlers[evt] = fn; });
  }
}

class MockAppPermissionForm extends HTMLElement {
  constructor() {
    super();
    this.abrirModalCrear = jest.fn();
    this.abrirModalEditar = jest.fn();
    this._handlers = {};
    this.addEventListener = jest.fn((evt, fn) => { this._handlers[evt] = fn; });
  }
}

describe('PermissionIndexComponent', () => {
  let AuthService, ModalService, ToastService, PermissionService;

  beforeAll(async () => {
    if (!customElements.get('app-data-table')) {
      customElements.define('app-data-table', MockAppDataTable);
    }
    if (!customElements.get('app-permission-form')) {
      customElements.define('app-permission-form', MockAppPermissionForm);
    }
    const authMod = await import('../../../../core/auth.service.js');
    AuthService = authMod.AuthService;
    const modalMod = await import('../../../../shared/services/modal.service.js');
    ModalService = modalMod.ModalService;
    const toastMod = await import('../../../../shared/services/toast.service.js');
    ToastService = toastMod.ToastService;
    const svcMod = await import('../../services/permissions.service.js');
    PermissionService = svcMod.PermissionService;
    await import('./permission-index.component.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.hasPermission.mockReturnValue(true);
    ModalService.confirm.mockResolvedValue(true);
    PermissionService.delete.mockResolvedValue({});
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('se define como custom element app-permission-index', () => {
    expect(customElements.get('app-permission-index')).toBeDefined();
  });

  it('onInit - configura tabla con columnas y carga datos', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-permisos');
    expect(tbl.configure).toHaveBeenCalled();
    const configArg = tbl.configure.mock.calls[0][0];
    expect(configArg.columns.length).toBeGreaterThan(0);
    const idCol = configArg.columns.find(c => c.key === 'id');
    expect(idCol).toBeDefined();
    expect(idCol.format(5)).toBe('#5');
    const accionCol = configArg.columns.find(c => c.header === 'Acción');
    expect(accionCol.render({ accion: 'Crear' })).toContain('Crear');
    const menuCol = configArg.columns.find(c => c.header === 'Opción de Menú');
    expect(menuCol.render({ opcion_menu: { nombre: 'Admin' } })).toBe('Admin');
    expect(menuCol.render({ opcion_menu: null })).toBe('-');
    const creadoCol = configArg.columns.find(c => c.header === 'Creado el');
    expect(creadoCol.render({ created_at: '2025-01-15' })).toBeDefined();
    expect(creadoCol.render({})).toBe('-');
    expect(tbl.load).toHaveBeenCalledWith('/permissions');
    document.body.removeChild(el);
  });

  it('onInit - actions columna excluye editar si no UPDATE', async () => {
    setupFetch();
    AuthService.hasPermission.mockImplementation((perm, resource) => {
      if (perm === 'UPDATE' && resource === 'permisos') return false;
      return true;
    });
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const configArg = el.querySelector('#tbl-datos-permisos').configure.mock.calls[0][0];
    const actionsCol = configArg.columns.find(c => c.header === 'Acciones');
    expect(actionsCol.actions.find(a => a.name === 'editar')).toBeUndefined();
    expect(actionsCol.actions.find(a => a.name === 'eliminar')).toBeDefined();
    document.body.removeChild(el);
  });

  it('onInit - actions columna excluye eliminar si no DELETE', async () => {
    setupFetch();
    AuthService.hasPermission.mockImplementation((perm, resource) => {
      if (perm === 'DELETE' && resource === 'permisos') return false;
      return true;
    });
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const configArg = el.querySelector('#tbl-datos-permisos').configure.mock.calls[0][0];
    const actionsCol = configArg.columns.find(c => c.header === 'Acciones');
    expect(actionsCol.actions.find(a => a.name === 'editar')).toBeDefined();
    expect(actionsCol.actions.find(a => a.name === 'eliminar')).toBeUndefined();
    document.body.removeChild(el);
  });

  it('onInit - oculta btnNuevo si no tiene permiso CREATE', async () => {
    setupFetch();
    AuthService.hasPermission.mockImplementation((perm, resource) => {
      if (perm === 'CREATE' && resource === 'permisos') return false;
      return true;
    });
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#btn-nuevo-registro').classList.contains('d-none')).toBe(true);
    document.body.removeChild(el);
  });

  it('onInit - row-action editar abre modal editar', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-permisos');
    const form = el.querySelector('#app-permission-form');
    tbl._handlers['row-action']({ detail: { action: 'editar', item: { id: 1, nombre: 'Test' } } });
    expect(form.abrirModalEditar).toHaveBeenCalledWith({ id: 1, nombre: 'Test' });
    document.body.removeChild(el);
  });

  it('onInit - row-action eliminar llama a eliminarPermiso', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-permisos');
    const spy = jest.spyOn(el, 'eliminarPermiso');
    tbl._handlers['row-action']({ detail: { action: 'eliminar', item: { id: 5, nombre: 'Test Permiso' } } });
    expect(spy).toHaveBeenCalledWith(5, 'Test Permiso');
    spy.mockRestore();
    document.body.removeChild(el);
  });

  it('onInit - row-action accion desconocida no hace nada', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-permisos');
    const spyEdit = jest.spyOn(el, 'eliminarPermiso');
    tbl._handlers['row-action']({ detail: { action: 'unknown', item: { id: 1 } } });
    expect(spyEdit).not.toHaveBeenCalled();
    spyEdit.mockRestore();
    document.body.removeChild(el);
  });

  it('onInit - escucha evento permiso-guardado y recarga tabla', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-permisos');
    tbl.load.mockClear();
    const form = el.querySelector('#app-permission-form');
    form._handlers['permiso-guardado']({ detail: { mensaje: 'Permiso creado correctamente.' } });
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(tbl.load).toHaveBeenCalledWith('/permissions');
    document.body.removeChild(el);
  });

  it('eliminarPermiso - confirma y llama a PermissionService.delete', async () => {
    setupFetch(MINIMAL_TEMPLATE);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.eliminarPermiso(5, 'Test Permiso');
    expect(ModalService.confirm).toHaveBeenCalledWith(
      'Eliminar Permiso',
      '¿Está seguro de eliminar el permiso "Test Permiso"?',
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );
    expect(PermissionService.delete).toHaveBeenCalledWith(5);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ToastService.success).toHaveBeenCalledWith('Permiso eliminado correctamente.');
    document.body.removeChild(el);
  });

  it('eliminarPermiso - no confirmado no elimina', async () => {
    ModalService.confirm.mockResolvedValue(false);
    setupFetch(MINIMAL_TEMPLATE);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.eliminarPermiso(5, 'Test Permiso');
    expect(PermissionService.delete).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('eliminarPermiso - error del servicio muestra ToastService.error', async () => {
    PermissionService.delete.mockRejectedValue(new Error('Network error'));
    setupFetch(MINIMAL_TEMPLATE);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.eliminarPermiso(5, 'Test Permiso');
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ToastService.error).toHaveBeenCalledWith('No se pudo eliminar el permiso: Network error');
    document.body.removeChild(el);
  });

  it('onInit - btnNuevo con CREATE llama a abrirModalCrear al hacer click', async () => {
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const form = el.querySelector('#app-permission-form');
    el.querySelector('#btn-nuevo-registro').click();
    expect(form.abrirModalCrear).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('mostrarAlertaExito - muestra alerta con classList manipulation', async () => {
    jest.useFakeTimers({doNotFake: ['nextTick']});
    setupFetch();
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.mostrarAlertaExito('Operacion exitosa.');
    const alertEl = el.querySelector('#successAlert');
    const msgEl = el.querySelector('#successMessage');
    expect(msgEl.textContent).toBe('Operacion exitosa.');
    expect(alertEl.classList.contains('d-none')).toBe(false);
    jest.advanceTimersByTime(3000);
    expect(alertEl.classList.contains('d-none')).toBe(true);
    jest.useRealTimers();
    document.body.removeChild(el);
  });

  it('mostrarAlertaExito - fallback a window.alert cuando faltan elementos DOM', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    setupFetch(MINIMAL_TEMPLATE);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.mostrarAlertaExito('Fallback message');
    expect(alertSpy).toHaveBeenCalledWith('Fallback message');
    alertSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('mostrarAlertaError - muestra error alert con timeout m\u00e1s largo', async () => {
    jest.useFakeTimers({doNotFake: ['nextTick']});
    setupFetch(TEMPLATE_WITH_ERROR_ALERT);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.mostrarAlertaError('Error occurred.');
    const alertEl = el.querySelector('#errorAlert');
    const msgEl = el.querySelector('#errorMessage');
    expect(msgEl.textContent).toBe('Error occurred.');
    expect(alertEl.classList.contains('d-none')).toBe(false);
    jest.advanceTimersByTime(4000);
    expect(alertEl.classList.contains('d-none')).toBe(true);
    jest.useRealTimers();
    document.body.removeChild(el);
  });

  it('mostrarAlertaError - fallback a window.alert cuando faltan elementos DOM', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    setupFetch(MINIMAL_TEMPLATE);
    const el = document.createElement('app-permission-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    el.mostrarAlertaError('Fallback error');
    expect(alertSpy).toHaveBeenCalledWith('Fallback error');
    alertSpy.mockRestore();
    document.body.removeChild(el);
  });
});
