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
});
