import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesTerritoriosComponent } from './ubicaciones-territorios.component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

describe('UbicacionesTerritoriosComponent', () => {
  let component;

  beforeEach(() => {
    const templateHtml = `
      <div id="territorioModal">
        <h5 id="territorioModalLabel"></h5>
        <form id="territorioForm">
          <input id="territorioId" value="" />
          <input id="territorioParentId" value="" />
          <input id="territorioPaisId" value="" />
          <input id="territorioNombre" value="" />
          <input id="territorioTipo" value="" />
          <input type="checkbox" id="territorioActivo" />
          <button type="submit"></button>
        </form>
        <div id="territorioContextLabel"></div>
        <div id="territorioModalErrorAlert" class="d-none"></div>
        <div id="territorioModalErrorMessage"></div>
      </div>
      <select id="explorerPaisSelect"></select>
      <button id="btnAddNivel1"></button>
      <button id="btnAddNivel2"></button>
      <button id="btnAddNivel3"></button>
      <div id="listNivel1"></div>
      <div id="listNivel2"></div>
      <div id="listNivel3"></div>
      <span id="lblNivel1"></span>
      <span id="lblNivel2"></span>
      <span id="lblNivel3"></span>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-ubicaciones-territorios></app-ubicaciones-territorios>
    `;
    
    const toast = document.querySelector('app-toast');
    toast.show = jest.fn();

    component = document.querySelector('app-ubicaciones-territorios');

    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
      }))
    };

    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);
    
    jest.spyOn(UbicacionesService, 'getPaises').mockResolvedValue([{ id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true }]);
    jest.spyOn(UbicacionesService, 'getTerritorios').mockResolvedValue([{ id: 10, nombre: 'Pichincha', tipo: 'Provincia', activo: true }]);
    jest.spyOn(UbicacionesService, 'createTerritorio').mockResolvedValue({ id: 99 });
    jest.spyOn(UbicacionesService, 'updateTerritorio').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'deleteTerritorio').mockResolvedValue({});
    
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar y cargar países', async () => {
    await component.onInit();
    expect(UbicacionesService.getPaises).toHaveBeenCalled();
    expect(component.paisesList.length).toBe(1);
    expect(document.querySelector('#explorerPaisSelect').innerHTML).toContain('Ecuador');
  });

  it('debería cargar territorios al cambiar de país', async () => {
    await component.onInit();
    const select = document.querySelector('#explorerPaisSelect');
    
    // Simular evento change
    select.dispatchEvent(new Event('change'));
    
    expect(UbicacionesService.getTerritorios).toHaveBeenCalledWith(1, 1000, null, { all: true, pais_id: '1', parent_id: null });
  });

  it('abrirModalTerritorio configura el form para Nivel 1', async () => {
    await component.onInit();
    component.selectedPaisId = 1;
    
    component.abrirModalTerritorio(1);
    
    expect(document.querySelector('#territorioParentId').value).toBe('');
    expect(document.querySelector('#territorioModalLabel').textContent).toContain('Provincia');
  });

  it('guardarTerritorio llama a createTerritorio', async () => {
    await component.onInit();
    
    const form = document.querySelector('#territorioForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    document.querySelector('#territorioId').value = '';
    document.querySelector('#territorioPaisId').value = '1';
    document.querySelector('#territorioNombre').value = 'Test';
    document.querySelector('#territorioTipo').value = 'Provincia';
    document.querySelector('#territorioActivo').checked = true;

    await component.guardarTerritorio({ preventDefault: jest.fn() });
    
    expect(UbicacionesService.createTerritorio).toHaveBeenCalled();
    expect(ToastService.success).toHaveBeenCalled();
  });
});
