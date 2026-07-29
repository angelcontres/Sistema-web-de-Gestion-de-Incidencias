import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../../core/auth.service.js', () => ({
  AuthService: { isAdmin: jest.fn(() => true) }
}));

jest.unstable_mockModule('../../../../shared/services/modal.service.js', () => ({
  ModalService: { confirm: jest.fn() }
}));

jest.unstable_mockModule('../../../../shared/services/toast.service.js', () => ({
  ToastService: { success: jest.fn(), error: jest.fn() }
}));

jest.unstable_mockModule('../../services/institucion.service.js', () => ({
  InstitucionService: { getAll: jest.fn(), delete: jest.fn() }
}));

// Same structure as real template but with mock custom elements
const INDEX_TEMPLATE = `
<div class="page-fade-in">
  <div>
    <h1>Mantenimiento de Instituciones</h1>
    <button id="btn-nuevo-registro" class="btn">Nueva Instituci\u00f3n</button>
  </div>
  <app-data-table id="tbl-datos-instituciones"></app-data-table>
  <app-institucion-form id="institucionFormModal"></app-institucion-form>
</div>`;

const TEMPLATE_WITH_SEARCH = `
<div class="page-fade-in">
  <div>
    <input id="searchInput" />
    <h1>Mantenimiento de Instituciones</h1>
    <button id="btn-nuevo-registro" class="btn">Nueva Instituci\u00f3n</button>
  </div>
  <app-data-table id="tbl-datos-instituciones"></app-data-table>
  <app-institucion-form id="institucionFormModal"></app-institucion-form>
</div>`;

const TEMPLATE_NO_BTN = `
<div class="page-fade-in">
  <div>
    <input id="searchInput" />
    <h1>Mantenimiento de Instituciones</h1>
  </div>
  <app-data-table id="tbl-datos-instituciones"></app-data-table>
  <app-institucion-form id="institucionFormModal"></app-institucion-form>
</div>`;

const TEMPLATE_NO_TABLE = `
<div class="page-fade-in">
  <div>
    <h1>Mantenimiento de Instituciones</h1>
    <button id="btn-nuevo-registro" class="btn">Nueva Instituci\u00f3n</button>
  </div>
  <app-institucion-form id="institucionFormModal"></app-institucion-form>
</div>`;

function setupFetch() {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => INDEX_TEMPLATE });
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

class MockAppInstitucionForm extends HTMLElement {
  constructor() {
    super();
    this.openModal = jest.fn();
  }
}

describe('InstitucionIndexComponent', () => {
  let AuthService, ModalService, ToastService, InstitucionService;

  beforeAll(async () => {
    if (!customElements.get('app-data-table')) {
      customElements.define('app-data-table', MockAppDataTable);
    }
    if (!customElements.get('app-institucion-form')) {
      customElements.define('app-institucion-form', MockAppInstitucionForm);
    }
    const authMod = await import('../../../../core/auth.service.js');
    AuthService = authMod.AuthService;
    const modalMod = await import('../../../../shared/services/modal.service.js');
    ModalService = modalMod.ModalService;
    const toastMod = await import('../../../../shared/services/toast.service.js');
    ToastService = toastMod.ToastService;
    const svcMod = await import('../../services/institucion.service.js');
    InstitucionService = svcMod.InstitucionService;
    await import('./institucion-index.component.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    AuthService.isAdmin.mockReturnValue(true);
    ModalService.confirm.mockResolvedValue(true);
    InstitucionService.getAll.mockResolvedValue({ data: [] });
    InstitucionService.delete.mockResolvedValue({});
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-institucion-index', () => {
    expect(customElements.get('app-institucion-index')).toBeDefined();
  });

  it('oculta btn-nuevo-registro si no es admin', async () => {
    setupFetch();
    AuthService.isAdmin.mockReturnValue(false);
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(el.querySelector('#btn-nuevo-registro').classList.contains('d-none')).toBe(true);
    document.body.removeChild(el);
  });

  it('configura tabla con columnas y carga datos iniciales', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    expect(tbl.configure).toHaveBeenCalled();
    expect(tbl.load).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('no agrega columna acciones si no es admin', async () => {
    setupFetch();
    AuthService.isAdmin.mockReturnValue(false);
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    const configArg = tbl.configure.mock.calls[0][0];
    expect(configArg.columns.find(c => c.header === 'Acciones')).toBeUndefined();
    document.body.removeChild(el);
  });

  it('maneja evento row-action editar', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    const spy = jest.spyOn(el, 'openModal');
    tbl._handlers['row-action']({ detail: { action: 'editar', item: { id: 1, nombre: 'Test' } } });
    expect(spy).toHaveBeenCalledWith({ id: 1, nombre: 'Test' });
    spy.mockRestore();
    document.body.removeChild(el);
  });

  it('maneja evento row-action eliminar', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    tbl._handlers['row-action']({ detail: { action: 'eliminar', item: { id: 5, nombre: 'Test Inst' } } });
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(ModalService.confirm).toHaveBeenCalled();
    expect(InstitucionService.delete).toHaveBeenCalledWith(5);
    expect(ToastService.success).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('cancela eliminacion si ModalService.confirm es false', async () => {
    setupFetch();
    ModalService.confirm.mockResolvedValue(false);
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    tbl._handlers['row-action']({ detail: { action: 'eliminar', item: { id: 5, nombre: 'Test Inst' } } });
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(InstitucionService.delete).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('btn-nuevo-registro click abre modal', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const spy = jest.spyOn(el, 'openModal');
    el.querySelector('#btn-nuevo-registro').click();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    document.body.removeChild(el);
  });

  it('evento institucion-guardada recarga tabla', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const tbl = el.querySelector('#tbl-datos-instituciones');
    tbl.load.mockClear();
    el.dispatchEvent(new Event('institucion-guardada'));
    expect(tbl.load).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('el input de b\u00fasqueda con debounce dispara tblDatos.load con el t\u00e9rmino', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => TEMPLATE_WITH_SEARCH });
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const tbl = el.querySelector('#tbl-datos-instituciones');
    const searchInput = el.querySelector('#searchInput');
    tbl.load.mockClear();
    InstitucionService.getAll.mockClear();

    jest.useFakeTimers();
    searchInput.value = 'test-busqueda';
    searchInput.dispatchEvent(new Event('input'));
    jest.advanceTimersByTime(510);

    expect(tbl.load).toHaveBeenCalledTimes(1);
    const loadFn = tbl.load.mock.calls[0][0];
    await loadFn(1, 10, null);
    expect(InstitucionService.getAll).toHaveBeenCalledWith(1, 10, null, { search: 'test-busqueda' });

    document.body.removeChild(el);
    jest.useRealTimers();
  });

  it('openModal() llama formModal.openModal con null si no hay item', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const formModal = el.querySelector('#institucionFormModal');
    await el.openModal();
    expect(formModal.openModal).toHaveBeenCalledWith(null);

    document.body.removeChild(el);
  });

  it('openModal() llama formModal.openModal con item.id si hay item', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const formModal = el.querySelector('#institucionFormModal');
    await el.openModal({ id: 42, nombre: 'Test' });
    expect(formModal.openModal).toHaveBeenCalledWith(42);

    document.body.removeChild(el);
  });

  it('openModal() muestra console.error si formModal no est\u00e1 listo', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    el.querySelector('#institucionFormModal').remove();

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await el.openModal({ id: 1 });
    expect(console.error).toHaveBeenCalledWith('El componente del formulario no est\u00e1 listo.');
    spy.mockRestore();

    document.body.removeChild(el);
  });

  it('eliminarInstitucion() muestra ToastService.error si falla API', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    InstitucionService.delete.mockRejectedValue(new Error('Network error'));
    await el.eliminarInstitucion(1, 'Test');

    expect(ToastService.error).toHaveBeenCalledWith('No se pudo eliminar: Network error');

    document.body.removeChild(el);
  });

  it('no agrega listener de click al btn si no es admin', async () => {
    setupFetch();
    AuthService.isAdmin.mockReturnValue(false);
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const spy = jest.spyOn(el, 'openModal');
    el.querySelector('#btn-nuevo-registro').click();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    document.body.removeChild(el);
  });

  it('eliminarInstitucion() recarga tabla con el valor de b\u00fasqueda', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => TEMPLATE_WITH_SEARCH });
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    const tbl = el.querySelector('#tbl-datos-instituciones');
    el.querySelector('#searchInput').value = 'test-search';
    tbl.load.mockClear();
    InstitucionService.getAll.mockClear();

    await el.eliminarInstitucion(1, 'Test');

    expect(tbl.load).toHaveBeenCalled();
    const loadFn = tbl.load.mock.calls[0][0];
    await loadFn(1, 10, null);
    expect(InstitucionService.getAll).toHaveBeenCalledWith(1, 10, null, { search: 'test-search' });

    document.body.removeChild(el);
  });

  it('no falla si el searchInput no existe en el DOM', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(el.querySelector('#searchInput')).toBeNull();
    expect(el.querySelector('#tbl-datos-instituciones').configure).toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('no falla si el bot\u00f3n btn-nuevo-registro no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => TEMPLATE_NO_BTN });
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(el.querySelector('#btn-nuevo-registro')).toBeNull();
    expect(el.querySelector('#tbl-datos-instituciones').configure).toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('no falla si la tabla tbl-datos-instituciones no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => TEMPLATE_NO_TABLE });
    const el = document.createElement('app-institucion-index');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);

    expect(el.querySelector('#tbl-datos-instituciones')).toBeNull();
    expect(el).toBeDefined();

    document.body.removeChild(el);
  });
});
