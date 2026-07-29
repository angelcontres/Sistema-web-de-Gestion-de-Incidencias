import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../../../core/api.js', () => ({
  apiRequest: jest.fn()
}));

const FORM_TEMPLATE = '<div class="modal fade" id="institucionModal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 id="institucionModalLabel">Nueva Institución</h5></div><div class="modal-body"><div id="institucionModalErrorAlert" class="d-none"><span id="institucionModalErrorMessage"></span></div><form id="institucionForm" novalidate><input type="text" id="institucionNombre" required /><input type="text" id="siglas" required /><input type="checkbox" id="institucionActivo" checked /></form></div><div class="modal-footer"><button id="btnGuardarInstitucion">Guardar</button></div></div></div></div>';

function setupFetch() {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => FORM_TEMPLATE });
}

describe('InstitucionFormComponent', () => {
  let InstitucionFormComponent, apiRequest, InstitucionService;

  beforeAll(async () => {
    const apiMod = await import('../../../../core/api.js');
    apiRequest = apiMod.apiRequest;
    const svcMod = await import('../../services/institucion.service.js');
    InstitucionService = svcMod.InstitucionService;
    const mod = await import('./institucion-form.component.js');
    InstitucionFormComponent = mod.InstitucionFormComponent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    apiRequest.mockResolvedValue({});
    document.body.innerHTML = '';
    window.bootstrap = {
      Modal: { getInstance: jest.fn(), getOrCreateInstance: jest.fn() }
    };
    window.bootstrap.Modal.getOrCreateInstance.mockReturnValue({ show: jest.fn(), hide: jest.fn() });
    window.bootstrap.Modal.getInstance.mockReturnValue({ hide: jest.fn() });
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = '';
  });

  it('se define como custom element app-institucion-form', () => {
    expect(customElements.get('app-institucion-form')).toBe(InstitucionFormComponent);
  });

  it('renderiza template y mueve modal al body', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(document.body.querySelector('#institucionModal')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('abre modal en modo crear', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.openModal();
    const modal = document.querySelector('#institucionModal');
    expect(modal.querySelector('#institucionModalLabel').textContent).toBe('Nueva Institución');
    expect(modal.querySelector('#btnGuardarInstitucion').textContent).toBe('Guardar');
    expect(modal.querySelector('#institucionActivo').checked).toBe(true);
    expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('abre modal en modo editar y carga datos', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ nombre: 'Test Inst', siglas: 'TI', activo: true });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.openModal(5);
    const modal = document.querySelector('#institucionModal');
    expect(modal.querySelector('#institucionModalLabel').textContent).toBe('Editar Institución');
    expect(modal.querySelector('#btnGuardarInstitucion').textContent).toBe('Actualizar');
    expect(apiRequest).toHaveBeenCalledWith('/institutions/5');
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(modal.querySelector('#institucionNombre').value).toBe('Test Inst');
    expect(modal.querySelector('#siglas').value).toBe('TI');
    document.body.removeChild(el);
  });

  it('maneja error al cargar datos de edicion', async () => {
    setupFetch();
    apiRequest.mockRejectedValue(new Error('Not found'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.openModal(99);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(errSpy).toHaveBeenCalled();
    expect(document.querySelector('#btnGuardarInstitucion').disabled).toBe(true);
    errSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('guarda institucion (crear)', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ id: 1 });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'Nueva';
    modal.querySelector('#siglas').value = 'NVA';
    await el.guardarInstitucion(new Event('submit'));
    expect(apiRequest).toHaveBeenCalledWith('/institutions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ nombre: 'Nueva', siglas: 'NVA', activo: true })
    }));
    document.body.removeChild(el);
  });

  it('guarda institucion (actualizar)', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ id: 1 });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    el.institucionId = 10;
    modal.querySelector('#institucionNombre').value = 'Editada';
    modal.querySelector('#siglas').value = 'EDI';
    await el.guardarInstitucion(new Event('submit'));
    expect(apiRequest).toHaveBeenCalledWith('/institutions/10', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ nombre: 'Editada', siglas: 'EDI', activo: true })
    }));
    document.body.removeChild(el);
  });

  it('no guarda si formulario es invalido', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    await el.guardarInstitucion(new Event('submit'));
    expect(apiRequest).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('maneja error al guardar', async () => {
    setupFetch();
    apiRequest.mockRejectedValue(new Error('Validation failed'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'Test';
    modal.querySelector('#siglas').value = 'TST';
    await el.guardarInstitucion(new Event('submit'));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(modal.querySelector('#btnGuardarInstitucion').disabled).toBe(false);
    expect(modal.querySelector('#institucionModalErrorAlert').classList.contains('d-none')).toBe(false);
    errSpy.mockRestore();
    document.body.removeChild(el);
  });

  it('extraerMensajeError maneja error 422 con errors', () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    const err422 = {
      response: { status: 422, data: { errors: { nombre: ['El nombre ya existe'] } } }
    };
    expect(el.extraerMensajeError(err422)).toBe('El nombre ya existe');
  });

  it('extraerMensajeError usa message por defecto', () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    expect(el.extraerMensajeError(new Error('Generic error'))).toBe('Generic error');
  });

  it('dispara evento institucion-guardada al guardar', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ id: 1 });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const handler = jest.fn();
    el.addEventListener('institucion-guardada', handler);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'Test';
    modal.querySelector('#siglas').value = 'TST';
    await el.guardarInstitucion(new Event('submit'));
    expect(handler).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('hidden.bs.modal resetea formulario', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'algo';
    el.institucionId = 5;
    modal.dispatchEvent(new Event('hidden.bs.modal'));
    expect(modal.querySelector('#institucionNombre').value).toBe('');
    expect(el.institucionId).toBeNull();
    document.body.removeChild(el);
  });

  it('disconnectedCallback remueve modal del body', async () => {
    setupFetch();
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    document.body.removeChild(el);
    expect(document.body.querySelector('#institucionModal')).toBeNull();
  });

  it('form submit event llama a guardarInstitucion', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ id: 1 });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'Test';
    modal.querySelector('#siglas').value = 'TST';
    modal.querySelector('#institucionForm').dispatchEvent(new Event('submit'));
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(apiRequest).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('click en btnGuardarInstitucion llama a guardarInstitucion', async () => {
    setupFetch();
    apiRequest.mockResolvedValue({ id: 1 });
    const el = document.createElement('app-institucion-form');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    const modal = document.querySelector('#institucionModal');
    modal.querySelector('#institucionNombre').value = 'Test';
    modal.querySelector('#siglas').value = 'TST';
    modal.querySelector('#btnGuardarInstitucion').click();
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    expect(apiRequest).toHaveBeenCalled();
    document.body.removeChild(el);
  });
});
