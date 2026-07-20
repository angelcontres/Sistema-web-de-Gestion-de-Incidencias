import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DireccionFormComponent } from './direccion-form.component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('DireccionFormComponent', () => {
  let component;

  beforeEach(() => {
    const templateHtml = `
      <div id="direccionModal">
        <h5 id="direccionModalLabel"></h5>
        <form id="direccionForm">
          <input id="direccionId" value="" />
          <select id="dirPaisSelect"></select>
          <select id="dirNivel1Select"></select>
          <select id="dirNivel2Select"></select>
          <select id="dirNivel3Select"></select>
          
          <input id="direccionDetalle" value="" />
          <input id="direccionReferencia" value="" />
          <input id="direccionCodigoPostal" value="" />
          <input id="direccionLatitud" value="" />
          <input id="direccionLongitud" value="" />
          <input type="checkbox" id="direccionActivo" />
          <button type="submit"></button>
        </form>
        <div id="direccionModalErrorAlert" class="d-none"></div>
        <div id="direccionModalErrorMessage"></div>
        <div id="modalMap"></div>
        <input type="radio" name="territoryResolveOption" value="existing" />
      </div>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
      }))
    };
    
    window.L = {
      map: jest.fn().mockReturnValue({
        setView: jest.fn().mockReturnThis(),
        on: jest.fn(),
        remove: jest.fn(),
        invalidateSize: jest.fn(),
        removeLayer: jest.fn()
      }),
      tileLayer: jest.fn().mockReturnValue({
        addTo: jest.fn()
      }),
      marker: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        on: jest.fn(),
        setLatLng: jest.fn()
      })
    };

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-direccion-form></app-direccion-form>
    `;
    const toast = document.querySelector('app-toast');
    if(toast) toast.show = jest.fn();
    
    component = document.querySelector('app-direccion-form');

    jest.spyOn(AuthService, 'getCurrentUser').mockReturnValue({ pais_id: 1 });
    
    jest.spyOn(UbicacionesService, 'getPaises').mockResolvedValue([{ id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true }]);
    jest.spyOn(UbicacionesService, 'getTerritorios').mockResolvedValue([{ id: 10, nombre: 'Pichincha', tipo: 'Provincia', activo: true }]);
    jest.spyOn(UbicacionesService, 'createDireccion').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'updateDireccion').mockResolvedValue({});
    
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar el modal correctamente', async () => {
    await component.onInit();
    expect(window.bootstrap.Modal).toHaveBeenCalled();
  });

  it('abrir() prepara el formulario para una nueva dirección', async () => {
    await component.onInit();
    await component.abrir();
    
    expect(document.querySelector('#direccionId').value).toBe('');
    expect(document.querySelector('#direccionModalLabel').textContent).toBe('Nueva Dirección');
    expect(document.querySelector('#dirPaisSelect').value).toBe('1'); // User's prefilled country
  });

  it('abrir(dir) prepara el formulario para edición', async () => {
    await component.onInit();
    const mockDir = {
      id: 5,
      detalle: 'Avenida Siempre Viva',
      latitud: 12.34,
      longitud: 56.78,
      activo: true,
      territorio: { pais_id: 1, id: 10 }
    };

    await component.abrir(mockDir);
    
    expect(document.querySelector('#direccionId').value).toBe('5');
    expect(document.querySelector('#direccionDetalle').value).toBe('Avenida Siempre Viva');
    expect(document.querySelector('#direccionLatitud').value).toBe('12.34');
    expect(document.querySelector('#direccionLongitud').value).toBe('56.78');
  });

  it('guardarDireccion llama a createDireccion cuando no hay id', async () => {
    await component.onInit();
    await component.abrir();
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="10">Pichincha</option>';
    document.querySelector('#dirNivel1Select').value = '10';
    document.querySelector('#direccionDetalle').value = 'Test';
    document.querySelector('#direccionLatitud').value = '1';
    document.querySelector('#direccionLongitud').value = '1';
    document.querySelector('#direccionActivo').checked = true;

    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    expect(UbicacionesService.createDireccion).toHaveBeenCalled();
  });
});
