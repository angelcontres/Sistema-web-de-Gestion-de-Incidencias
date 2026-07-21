import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UbicacionesDireccionesComponent } from './ubicaciones-direcciones.component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';

describe('UbicacionesDireccionesComponent', () => {
  let component;

  beforeEach(() => {
    const templateHtml = `
      <button id="btnNuevaDireccion"></button>
      <input id="direccionSearch" />
      <select id="filterPaisSelect"></select>
      <select id="filterEstadoSelect"></select>
      <button id="btnCentrarMapa"></button>
      <div id="map"></div>
      <table class="table">
        <tbody id="direccionesTableBody"></tbody>
      </table>
      <div id="direccionesEmptyState" class="d-none"></div>
    `;
    window.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) }));

    // Mock L (Leaflet)
    window.L = {
      map: jest.fn().mockReturnValue({
        setView: jest.fn().mockReturnThis(),
        remove: jest.fn(),
        invalidateSize: jest.fn(),
        removeLayer: jest.fn(),
        fitBounds: jest.fn()
      }),
      tileLayer: jest.fn().mockReturnValue({
        addTo: jest.fn()
      }),
      marker: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        openPopup: jest.fn()
      }),
      featureGroup: jest.fn().mockImplementation(() => ({
        getBounds: jest.fn().mockReturnValue({
          pad: jest.fn()
        })
      }))
    };

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-ubicaciones-direcciones></app-ubicaciones-direcciones>
    `;
    const toast = document.querySelector('app-toast');
    if (toast) toast.show = jest.fn();
    
    component = document.querySelector('app-ubicaciones-direcciones');

    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);
    jest.spyOn(AuthService, 'getCurrentUser').mockReturnValue({ pais_id: 1, pais: { codigo_iso: 'EC' } });
    
    jest.spyOn(UbicacionesService, 'getPaises').mockResolvedValue([{ id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true }]);
    jest.spyOn(UbicacionesService, 'getDirecciones').mockResolvedValue([
      { id: 1, detalle: 'Calle Falsa', latitud: 0, longitud: 0, territorio: { pais: { nombre: 'Ecuador' } }, activo: true }
    ]);
    jest.spyOn(UbicacionesService, 'deleteDireccion').mockResolvedValue({});
    
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    delete window.fetch;
  });

  it('debería inicializar, cargar países y direcciones', async () => {
    await component.onInit();
    
    expect(UbicacionesService.getPaises).toHaveBeenCalled();
    expect(UbicacionesService.getDirecciones).toHaveBeenCalled();
    expect(component.direccionesList.length).toBe(1);
    
    const tbody = component.querySelector('#direccionesTableBody');
    expect(tbody.innerHTML).toContain('Calle Falsa');
  });

  it('initMainMap debería instanciar Leaflet map', async () => {
    await component.onInit();
    component.initMainMap();
    expect(window.L.map).toHaveBeenCalled();
    expect(window.L.tileLayer).toHaveBeenCalled();
  });

  it('eliminarDireccion debería llamar a deleteDireccion y recargar', async () => {
    await component.onInit();
    await component.eliminarDireccion(1);
    
    expect(ModalService.confirm).toHaveBeenCalled();
    expect(UbicacionesService.deleteDireccion).toHaveBeenCalledWith(1);
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('filtrarDirecciones debería actualizar la tabla según la búsqueda', async () => {
    await component.onInit(); // Carga 'Calle Falsa'
    
    const searchInput = component.querySelector('#direccionSearch');
    searchInput.value = 'Inexistente';
    
    component.filtrarDirecciones();
    
    const tbody = component.querySelector('#direccionesTableBody');
    const emptyState = component.querySelector('#direccionesEmptyState');
    
    expect(tbody.innerHTML).toBe(''); // Tabla vacía
    expect(emptyState.classList.contains('d-none')).toBeFalsy(); // Empty state visible
  });
});
