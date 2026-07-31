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
    window.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(templateHtml) })
    );

    // Mock L (Leaflet)
    window.L = {
      map: jest.fn().mockReturnValue({
        setView: jest.fn().mockReturnThis(),
        remove: jest.fn(),
        invalidateSize: jest.fn(),
        removeLayer: jest.fn(),
        fitBounds: jest.fn(),
      }),
      tileLayer: jest.fn().mockReturnValue({
        addTo: jest.fn(),
      }),
      marker: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        openPopup: jest.fn(),
      }),
      featureGroup: jest.fn().mockImplementation(() => ({
        getBounds: jest.fn().mockReturnValue({
          pad: jest.fn(),
        }),
      })),
    };

    document.body.innerHTML = `
      <app-toast></app-toast>
      <app-ubicaciones-direcciones></app-ubicaciones-direcciones>
    `;
    const toast = document.querySelector('app-toast');
    if (toast) toast.show = jest.fn();

    component = document.querySelector('app-ubicaciones-direcciones');

    jest.spyOn(AuthService, 'isAdmin').mockReturnValue(true);
    jest
      .spyOn(AuthService, 'getCurrentUser')
      .mockReturnValue({ pais_id: 1, pais: { codigo_iso: 'EC' } });

    jest
      .spyOn(UbicacionesService, 'getPaises')
      .mockResolvedValue([{ id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true }]);
    jest
      .spyOn(UbicacionesService, 'getDirecciones')
      .mockResolvedValue([
        {
          id: 1,
          detalle: 'Calle Falsa',
          latitud: 0,
          longitud: 0,
          territorio: { pais: { nombre: 'Ecuador' } },
          activo: true,
        },
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
    expect(component.direccionesList).toHaveLength(1);

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

  it('no-admin oculta btnNuevaDireccion', async () => {
    AuthService.isAdmin.mockReturnValue(false);
    await component.onInit();
    const btn = component.querySelector('#btnNuevaDireccion');
    expect(btn.classList.contains('d-none')).toBe(true);
  });

  it('cargarPaises maneja error gracefulmente', async () => {
    component.paisesList = [];
    UbicacionesService.getPaises.mockRejectedValue(new Error('Error de red'));
    await component.cargarPaises();
    expect(component.paisesList).toEqual([]);
  });

  it('cargarDirecciones maneja error con ToastService.error', async () => {
    UbicacionesService.getDirecciones.mockRejectedValue(new Error('Error API'));
    await component.cargarDirecciones();
    expect(ToastService.error).toHaveBeenCalledWith('No se pudieron cargar las direcciones.');
  });

  it('llenarPaisSelect llena el select de filtro', async () => {
    await component.onInit();
    component.paisesList = [
      { id: 1, nombre: 'Ecuador', activo: true },
      { id: 2, nombre: 'Peru', activo: true },
      { id: 3, nombre: 'Colombia', activo: false },
    ];
    component.llenarPaisSelect();
    const select = component.querySelector('#filterPaisSelect');
    expect(select.options.length).toBe(3);
    expect(select.options[1].value).toBe('1');
    expect(select.options[1].text).toBe('Ecuador');
    expect(select.options[2].value).toBe('2');
    expect(select.options[2].text).toBe('Peru');
  });

  it('initMainMap retorna si no hay div#map', async () => {
    await component.onInit();
    const mapDiv = component.querySelector('#map');
    mapDiv.remove();
    component.initMainMap();
    expect(component.map).toBeNull();
  });

  it('initMainMap invalida size si el mapa ya existe', async () => {
    await component.onInit();
    component.initMainMap();
    const invalidateSpy = component.map.invalidateSize;
    component.initMainMap();
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('limpiarMapaPrincipal limpia marcadores y re-centra', async () => {
    await component.onInit();
    component.initMainMap();
    const fakeMarker = {};
    component.mapMarkers = [fakeMarker];
    component.limpiarMapaPrincipal();
    expect(component.map.removeLayer).toHaveBeenCalledWith(fakeMarker);
    expect(component.mapMarkers).toHaveLength(0);
    expect(component.map.setView).toHaveBeenCalled();
  });

  it('mostrarUnicoMarcadorEnMapa crea marcador con popup', async () => {
    await component.onInit();
    component.initMainMap();
    const dir = { id: 1, detalle: 'Test', latitud: -0.18, longitud: -78.5, territorio: { pais: { nombre: 'Ecuador' } } };
    component.mostrarUnicoMarcadorEnMapa(dir);
    expect(window.L.marker).toHaveBeenCalledWith([-0.18, -78.5]);
    expect(component.mapMarkers).toHaveLength(1);
    expect(component.map.setView).toHaveBeenCalledWith([-0.18, -78.5], 16);
  });

  it('centrarMapaEnTodo retorna temprano si no hay mapa', async () => {
    await component.onInit();
    component.map = null;
    component.centrarMapaEnTodo();
    expect(component.map).toBeNull();
  });

  it('centrarMapaEnTodo retorna temprano si no hay marcadores', async () => {
    await component.onInit();
    component.initMainMap();
    component.mapMarkers = [];
    component.centrarMapaEnTodo();
    expect(component.map.fitBounds).not.toHaveBeenCalled();
  });

  it('obtenerPathTerritorio construye cadena de path', () => {
    const territorio = { nombre: 'Cantón', parent: { nombre: 'Provincia', parent: { nombre: 'Región' } } };
    expect(component.obtenerPathTerritorio(territorio)).toBe('Región &raquo; Provincia &raquo; Cantón');
  });

  it('obtenerPathTerritorio retorna vacío si no hay territorio', () => {
    expect(component.obtenerPathTerritorio(null)).toBe('');
    expect(component.obtenerPathTerritorio(undefined)).toBe('');
  });

  it('obtenerPathTerritorio maneja nivel único sin parent', () => {
    const territorio = { nombre: 'Solo' };
    expect(component.obtenerPathTerritorio(territorio)).toBe('Solo');
  });

  it('filtrarDirecciones filtra por select de país', async () => {
    UbicacionesService.getPaises.mockResolvedValue([
      { id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true },
      { id: 2, nombre: 'Peru', codigo_iso: 'PE', activo: true },
    ]);
    UbicacionesService.getDirecciones.mockResolvedValue([
      { id: 1, detalle: 'Calle Falsa', latitud: 0, longitud: 0, territorio: { pais_id: 1, pais: { nombre: 'Ecuador' } }, activo: true },
      { id: 2, detalle: 'Otra Calle', latitud: null, longitud: null, territorio: { pais_id: 2, pais: { nombre: 'Peru' }, nombre: 'Lima', parent: { nombre: 'Region Lima' } }, activo: false, referencia: 'ref', codigo_postal: '123' },
    ]);
    await component.onInit();
    const filterPais = component.querySelector('#filterPaisSelect');
    filterPais.value = '2';
    component.filtrarDirecciones();
    const tbody = component.querySelector('#direccionesTableBody');
    expect(tbody.innerHTML).toContain('Otra Calle');
    expect(tbody.innerHTML).not.toContain('Calle Falsa');
  });

  it('filtrarDirecciones filtra por estado activo/inactivo', async () => {
    UbicacionesService.getPaises.mockResolvedValue([
      { id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true },
      { id: 2, nombre: 'Peru', codigo_iso: 'PE', activo: true },
    ]);
    UbicacionesService.getDirecciones.mockResolvedValue([
      { id: 1, detalle: 'Calle Falsa', latitud: 0, longitud: 0, territorio: { pais_id: 1, pais: { nombre: 'Ecuador' } }, activo: true },
      { id: 2, detalle: 'Otra Calle', latitud: null, longitud: null, territorio: { pais_id: 2, pais: { nombre: 'Peru' }, nombre: 'Lima', parent: { nombre: 'Region Lima' } }, activo: false, referencia: 'ref', codigo_postal: '123' },
    ]);
    await component.onInit();
    const filterEstado = component.querySelector('#filterEstadoSelect');
    filterEstado.innerHTML = '<option value="">Todos</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option>';
    filterEstado.value = 'inactivo';
    component.filtrarDirecciones();
    const tbody = component.querySelector('#direccionesTableBody');
    expect(tbody.innerHTML).toContain('Otra Calle');
    expect(tbody.innerHTML).not.toContain('Calle Falsa');
  });

  it('renderDireccionesTable muestra estado vacío cuando no hay datos', async () => {
    await component.onInit();
    const emptyState = component.querySelector('#direccionesEmptyState');
    emptyState.classList.add('d-none');
    component.renderDireccionesTable([]);
    const tbody = component.querySelector('#direccionesTableBody');
    expect(tbody.innerHTML).toBe('');
    expect(emptyState.classList.contains('d-none')).toBe(false);
  });

  it('eliminarDireccion no confirmado salta eliminación', async () => {
    ModalService.confirm.mockResolvedValue(false);
    await component.eliminarDireccion(1);
    expect(UbicacionesService.deleteDireccion).not.toHaveBeenCalled();
  });

  it('eliminarDireccion error de API muestra ToastService.error', async () => {
    UbicacionesService.deleteDireccion.mockRejectedValue(new Error('Error de prueba'));
    await component.eliminarDireccion(1);
    expect(ToastService.error).toHaveBeenCalledWith(expect.stringContaining('No se pudo eliminar'));
  });

  it('click en fila sin coordenadas muestra toast de error', async () => {
    UbicacionesService.getDirecciones.mockResolvedValue([
      { id: 2, detalle: 'Otra Calle', latitud: null, longitud: null, territorio: { pais: { nombre: 'Peru' }, nombre: 'Lima', parent: { nombre: 'Region Lima' } }, activo: false, referencia: 'ref', codigo_postal: '123' },
    ]);
    await component.onInit();
    const row = component.querySelector('#direccionesTableBody tr');
    row.click();
    expect(ToastService.error).toHaveBeenCalledWith('Esta dirección no cuenta con coordenadas.');
  });

  it('disconnectedCallback remueve el mapa', async () => {
    await component.onInit();
    component.initMainMap();
    const mapRemoveSpy = component.map.remove;
    component.disconnectedCallback();
    expect(mapRemoveSpy).toHaveBeenCalled();
    expect(component.map).toBeNull();
  });
});
