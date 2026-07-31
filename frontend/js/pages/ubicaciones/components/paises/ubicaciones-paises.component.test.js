import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesPaisesComponent } from './ubicaciones-paises.component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { BaseComponent } from '../../../../core/base-component.js';

describe('UbicacionesPaisesComponent', () => {
  let component;

  beforeAll(() => {
    HTMLDivElement.prototype.configure = jest.fn();
    HTMLDivElement.prototype.load = jest.fn().mockResolvedValue([]);
    HTMLDivElement.prototype.items = [];
  });

  afterAll(() => {
    delete HTMLDivElement.prototype.configure;
    delete HTMLDivElement.prototype.load;
    delete HTMLDivElement.prototype.items;
  });

  beforeEach(() => {
    const templateHtml = `
      <div id="paisModal">
        <h5 id="paisModalLabel"></h5>
        <form id="paisForm">
          <input id="paisId" value="" />
          <input id="paisNombre" value="" />
          <input id="paisCodigo" value="" />
          <input type="checkbox" id="paisActivo" />
        </form>
        <div id="paisModalErrorAlert" class="d-none"></div>
        <div id="paisModalErrorMessage"></div>
      </div>
      <button id="btnNuevoPais"></button>
      <div id="tbl-datos-paises"></div>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-ubicaciones-paises></app-ubicaciones-paises>
    `;
    
    const toast = document.querySelector('app-toast');
    if (toast) toast.show = jest.fn();

    component = document.querySelector('app-ubicaciones-paises');

    // Mocks genéricos
    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
      }))
    };

    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);

    jest.spyOn(UbicacionesService, 'createPais').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'updatePais').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'deletePais').mockResolvedValue({});
    
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar modal y tabla', async () => {
    await component.onInit();
    
    const tblDatos = component.querySelector('#tbl-datos-paises');
    expect(tblDatos.configure).toHaveBeenCalled();
    expect(tblDatos.load).toHaveBeenCalled();
  });

  it('abrirModalPais debería preparar el formulario para nuevo registro', () => {
    component.onInit(); // Inicializa modalObj
    component.abrirModalPais();
    
    expect(document.querySelector('#paisId').value).toBe('');
    expect(document.querySelector('#paisActivo').checked).toBe(true);
  });

  it('abrirModalPais debería cargar datos si se pasa un país', () => {
    component.onInit();
    component.abrirModalPais({ id: 5, nombre: 'Test', codigo_iso: 'TS', activo: false });
    
    expect(document.querySelector('#paisId').value).toBe('5');
    expect(document.querySelector('#paisNombre').value).toBe('Test');
    expect(document.querySelector('#paisCodigo').value).toBe('TS');
    expect(document.querySelector('#paisActivo').checked).toBe(false);
  });

  it('guardarPais debería llamar a createPais si no hay id', async () => {
    await component.onInit();
    
    const form = document.querySelector('#paisForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    document.querySelector('#paisId').value = '';
    document.querySelector('#paisNombre').value = 'Test';
    document.querySelector('#paisCodigo').value = 'TS';
    document.querySelector('#paisActivo').checked = true;

    await component.guardarPais({ preventDefault: jest.fn() });
    
    expect(UbicacionesService.createPais).toHaveBeenCalledWith({
      nombre: 'Test',
      codigo_iso: 'TS',
      activo: true
    });
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('eliminarPais debería llamar a deletePais', async () => {
    await component.onInit();
    await component.eliminarPais(1, 'Test');
    
    expect(ModalService.confirm).toHaveBeenCalled();
    expect(UbicacionesService.deletePais).toHaveBeenCalledWith(1);
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('deberia ocultar btnNuevoPais si no es admin', async () => {
    AuthService.isAdmin.mockReturnValue(false);
    await component.onInit();
    const btn = component.querySelector('#btnNuevoPais');
    expect(btn.classList.contains('d-none')).toBe(true);
  });

  it('deberia manejar row-action editar', async () => {
    const tbl = component.querySelector('#tbl-datos-paises');
    jest.spyOn(tbl, 'addEventListener');
    await component.onInit();
    const spy = jest.spyOn(component, 'abrirModalPais');
    const eventCallback = tbl.addEventListener.mock.calls.find(c => c[0] === 'row-action')[1];
    eventCallback({ detail: { action: 'editar', item: { id: 1, nombre: 'Test' } } });
    expect(spy).toHaveBeenCalledWith({ id: 1, nombre: 'Test' });
  });

  it('deberia manejar row-action eliminar', async () => {
    const tbl = component.querySelector('#tbl-datos-paises');
    jest.spyOn(tbl, 'addEventListener');
    await component.onInit();
    const spy = jest.spyOn(component, 'eliminarPais');
    const eventCallback = tbl.addEventListener.mock.calls.find(c => c[0] === 'row-action')[1];
    eventCallback({ detail: { action: 'eliminar', item: { id: 5, nombre: 'Test' } } });
    expect(spy).toHaveBeenCalledWith(5, 'Test');
  });

  it('guardarPais deberia llamar a updatePais si hay id', async () => {
    await component.onInit();
    const form = document.querySelector('#paisForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    document.querySelector('#paisId').value = '3';
    document.querySelector('#paisNombre').value = 'Updated';
    document.querySelector('#paisCodigo').value = 'UP';
    document.querySelector('#paisActivo').checked = false;
    await component.guardarPais({ preventDefault: jest.fn() });
    expect(UbicacionesService.updatePais).toHaveBeenCalledWith('3', {
      nombre: 'Updated', codigo_iso: 'UP', activo: false
    });
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('guardarPais deberia mostrar error si API falla', async () => {
    UbicacionesService.createPais.mockRejectedValue(new Error('API Error'));
    await component.onInit();
    const form = document.querySelector('#paisForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    document.querySelector('#paisId').value = '';
    document.querySelector('#paisNombre').value = 'Test';
    document.querySelector('#paisCodigo').value = 'TS';
    document.querySelector('#paisActivo').checked = true;
    await component.guardarPais({ preventDefault: jest.fn() });
    expect(ToastService.error).toHaveBeenCalled();
  });

  it('eliminarPais no deberia eliminar si no se confirma', async () => {
    ModalService.confirm.mockResolvedValue(false);
    await component.onInit();
    await component.eliminarPais(1, 'Test');
    expect(UbicacionesService.deletePais).not.toHaveBeenCalled();
  });

  it('eliminarPais deberia mostrar error si API falla', async () => {
    UbicacionesService.deletePais.mockRejectedValue(new Error('Error'));
    await component.onInit();
    await component.eliminarPais(1, 'Test');
    expect(ToastService.error).toHaveBeenCalled();
  });

  it('disconnectedCallback deberia remover modal del body', async () => {
    await component.onInit();
    const modalEl = document.querySelector('#paisModal');
    expect(modalEl).toBeTruthy();
    if (modalEl) modalEl.remove = jest.fn();
    component.disconnectedCallback();
  });

  it('guardarPais deberia fallar validacion si form no es valido', async () => {
    await component.onInit();
    const form = document.querySelector('#paisForm');
    form.checkValidity = jest.fn().mockReturnValue(false);
    await component.guardarPais({ preventDefault: jest.fn() });
    expect(UbicacionesService.createPais).not.toHaveBeenCalled();
    expect(form.classList.contains('was-validated')).toBe(true);
  });

  it('debería manejar error al inicializar el modal en onInit', async () => {
    // connectedCallback already called onInit which moved #paisModal to body,
    // move it back so the second onInit call finds it and triggers the catch
    const modalEl = document.querySelector('#paisModal');
    if (modalEl) component.appendChild(modalEl);
    window.bootstrap.Modal = jest.fn(() => { throw new Error('fail'); });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await component.onInit();
    expect(consoleSpy).toHaveBeenCalledWith('Error inicializando el modal de países.', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('debería renderizar el badge de estado correctamente', async () => {
    const origConfigure = HTMLDivElement.prototype.configure;
    let capturedColumns;
    HTMLDivElement.prototype.configure = jest.fn((config) => { capturedColumns = config.columns; });
    await component.onInit();
    const statusColumn = capturedColumns.find(c => c.render);
    expect(statusColumn).toBeDefined();
    const activeHtml = statusColumn.render({ activo: true });
    expect(activeHtml).toContain('bg-success');
    expect(activeHtml).toContain('Activo');
    const inactiveHtml = statusColumn.render({ activo: false });
    expect(inactiveHtml).toContain('bg-danger');
    expect(inactiveHtml).toContain('Inactivo');
    HTMLDivElement.prototype.configure = origConfigure;
  });

  it('debería manejar error al cargar países', async () => {
    const origLoad = HTMLDivElement.prototype.load;
    HTMLDivElement.prototype.load = jest.fn().mockRejectedValue(new Error('fail'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.onInit();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(consoleSpy).toHaveBeenCalledWith('Error al cargar países:', expect.any(Error));
    consoleSpy.mockRestore();
    HTMLDivElement.prototype.load = origLoad;
  });
});
