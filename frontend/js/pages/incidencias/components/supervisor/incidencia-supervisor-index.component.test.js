import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidenciaSupervisorIndexComponent } from './incidencia-supervisor-index.component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

describe('IncidenciaSupervisorIndexComponent', () => {
  let component;
  let mockMapInstance;

  beforeEach(() => {
    window.fetch = jest.fn((url) => {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
          <div>
            <button id="btn-refresh-dashboard"></button>
            <button id="btn-despachar-incidencia"></button>
            <div id="alertas-container"></div>
            <span id="badge-alertas"></span>
            <div id="map"></div>
            <div class="spinner-list"></div>
            <span id="modal-incidencia-id"></span>
            <span id="modal-incidencia-estado"></span>
            <span id="modal-incidencia-fecha"></span>
            <span id="modal-incidencia-tipo"></span>
            <span id="modal-incidencia-desc"></span>
            <span id="modal-incidencia-dir"></span>
            <span id="modal-incidencia-prioridad"></span>
            <span id="modal-incidencia-afectados"></span>
            <div id="modal-detalle-incidencia"></div>
          </div>
        `)
      });
    });

    IncidenciaService.getAll = jest.fn(() => Promise.resolve({ data: [] }));
    IncidenciaService.update = jest.fn(() => Promise.resolve({}));
    ModalService.confirm = jest.fn(() => Promise.resolve(true));
    ToastService.success = jest.fn();
    ToastService.error = jest.fn();

    window.bootstrap = { Modal: jest.fn(() => ({ show: jest.fn(), hide: jest.fn() })) };

    mockMapInstance = {
      setView: jest.fn().mockReturnThis(),
      removeLayer: jest.fn(),
      fitBounds: jest.fn()
    };

    window.L = {
      map: jest.fn(() => mockMapInstance),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn() })),
      Icon: jest.fn(),
      featureGroup: jest.fn(() => ({ getBounds: jest.fn(() => ({ pad: jest.fn() })) }))
    };

    document.body.innerHTML = '<app-incidencia-supervisor-index></app-incidencia-supervisor-index>';
    component = document.querySelector('app-incidencia-supervisor-index');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('debería inicializarse correctamente, configurar eventos y cargar datos', async () => {
    const getAllSpy = jest.spyOn(IncidenciaService, 'getAll');
    await component.onInit();
    await Promise.resolve();
    
    expect(getAllSpy).toHaveBeenCalled();
    getAllSpy.mockClear();
    
    const btnRefresh = component.querySelector('#btn-refresh-dashboard');
    btnRefresh.click();
    expect(getAllSpy).toHaveBeenCalled();

    const btnDespachar = component.querySelector('#btn-despachar-incidencia');
    const despacharSpy = jest.spyOn(component, 'despacharIncidencia');
    btnDespachar.click();
    expect(despacharSpy).toHaveBeenCalled();
  });

  it('cargarDatos maneja errores', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    IncidenciaService.getAll.mockRejectedValueOnce(new Error('Network error'));
    
    await component.cargarDatos();
    
    expect(errorSpy).toHaveBeenCalledWith('Error cargando dashboard:', expect.any(Error));
    errorSpy.mockRestore();
  });

  it('renderAlertas muestra mensaje vacío si no hay alertas', async () => {
    await component.onInit();
    const container = component.querySelector('#alertas-container');
    expect(container.innerHTML).toContain('No hay alertas pendientes');
  });

  it('renderAlertas muestra alertas y maneja clicks', async () => {
    const mockIncidencias = [
      { id: 1, estado_id: 1, incidencia_descripcion: 'Test', estado: { nombre: 'Pendiente' }, prioridad: { nombre: 'Alta', color_hex: '#ff0000' }, direccion: { detalle: 'Dir 1' }, created_at: '2023-01-01' },
      { id: 2, estado_id: 2, incidencia_descripcion: null, estado: { nombre: 'Revisión' }, created_at: '2023-01-01' },
      { id: 3, estado_id: 3, estado: { nombre: 'Proceso' }, created_at: '2023-01-01' } // No es alerta
    ];
    IncidenciaService.getAll.mockResolvedValueOnce({ data: mockIncidencias });
    
    await component.onInit();
    await Promise.resolve();

    const badge = component.querySelector('#badge-alertas');
    expect(badge.textContent).toBe('2');

    const container = component.querySelector('#alertas-container');
    const items = container.querySelectorAll('a.list-group-item');
    expect(items.length).toBe(2);

    const modalSpy = jest.spyOn(component, 'abrirModalDespacho');
    items[0].click();
    expect(modalSpy).toHaveBeenCalledWith(mockIncidencias[0]);
  });

  it('initOrUpdateMap inicializa el mapa y dibuja marcadores', async () => {
    const mockIncidencias = [
      { id: 1, estado_id: 1, direccion: { latitud: '0', longitud: '0' } },
      { id: 2, estado_id: 2, direccion: { latitud: '1', longitud: '1' } },
      { id: 3, estado_id: 4, direccion: { latitud: '2', longitud: '2' } },
      { id: 4, estado_id: 5, direccion: { latitud: '3', longitud: '3' } },
      { id: 5, estado_id: 1 } // Sin coordenadas completas
    ];
    IncidenciaService.getAll.mockResolvedValueOnce(mockIncidencias); // Prueba cuando no hay .data
    
    await component.onInit();
    await Promise.resolve();

    expect(window.L.map).toHaveBeenCalled();
    expect(window.L.marker).toHaveBeenCalledTimes(4);
    
    // Check map logic on subsequent calls (should not re-initialize map, should remove old markers)
    const removeLayerSpy = jest.spyOn(mockMapInstance, 'removeLayer');
    await component.cargarDatos();
    expect(removeLayerSpy).toHaveBeenCalledTimes(4); // Remove 4 markers from previous load
  });

  it('initOrUpdateMap añade evento al botón de popup', async () => {
    const mockIncidencias = [{ id: 1, estado_id: 1, direccion: { latitud: '0', longitud: '0' } }];
    IncidenciaService.getAll.mockResolvedValueOnce({ data: mockIncidencias });
    
    let popupElement;
    window.L.marker = jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      bindPopup: jest.fn((content) => { popupElement = content; })
    }));

    await component.onInit();
    await Promise.resolve();

    const btn = popupElement.querySelector('button');
    const modalSpy = jest.spyOn(component, 'abrirModalDespacho');
    btn.click();
    
    expect(modalSpy).toHaveBeenCalledWith(mockIncidencias[0]);
  });

  it('abrirModalDespacho muestra modal y bloquea botón si ya está despachada', async () => {
    await component.onInit();
    
    const inc = { 
      id: 1, 
      estado_id: 3, 
      estado: { nombre: 'Proceso' },
      tipo: { nombre: 'Falla' },
      incidencia_descripcion: 'Desc',
      direccion: { detalle: 'Dir' },
      prioridad: { nombre: 'Alta' },
      cantidad_afectados_incidencia: 5,
      created_at: '2023-01-01'
    };
    
    component.abrirModalDespacho(inc);
    
    expect(component.incidenciaSeleccionada).toBe(inc);
    
    const btn = component.querySelector('#btn-despachar-incidencia');
    expect(btn.disabled).toBe(true);
    
    // Test without some fields
    const inc2 = { id: 2, estado_id: 1, created_at: '2023-01-01' };
    component.abrirModalDespacho(inc2);
    expect(component.querySelector('#modal-incidencia-prioridad').textContent).toBe('Normal');
    expect(btn.disabled).toBe(false);
  });

  it('despacharIncidencia no hace nada si no hay incidencia seleccionada', async () => {
    component.incidenciaSeleccionada = null;
    await component.despacharIncidencia();
    expect(ModalService.confirm).not.toHaveBeenCalled();
  });

  it('despacharIncidencia no hace nada si usuario cancela', async () => {
    component.incidenciaSeleccionada = { id: 1 };
    ModalService.confirm.mockResolvedValueOnce(false);
    
    await component.despacharIncidencia();
    expect(IncidenciaService.update).not.toHaveBeenCalled();
  });

  it('despacharIncidencia despacha exitosamente', async () => {
    await component.onInit();
    component.incidenciaSeleccionada = { id: 1, version: 1, tipo_incidencia_id: 1, sub_tipo_incidencia_id: 1 };
    
    component.modal = { hide: jest.fn() };
    
    const loadDataSpy = jest.spyOn(component, 'cargarDatos');
    
    await component.despacharIncidencia();
    
    expect(IncidenciaService.update).toHaveBeenCalledWith(1, {
      version: 1,
      estado_id: 3,
      tipo_incidencia_id: 1,
      sub_tipo_incidencia_id: 1
    });
    
    expect(component.modal.hide).toHaveBeenCalled();
    expect(loadDataSpy).toHaveBeenCalled();
    expect(ToastService.success).toHaveBeenCalled();
  });

  it('despacharIncidencia maneja error al actualizar', async () => {
    await component.onInit();
    component.incidenciaSeleccionada = { id: 1 };
    
    IncidenciaService.update.mockRejectedValueOnce(new Error('Update error'));
    
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await component.despacharIncidencia();
    
    expect(errorSpy).toHaveBeenCalled();
    expect(ToastService.error).toHaveBeenCalled();
    
    errorSpy.mockRestore();
  });

  it('mostrarSpinners modifica clases', () => {
    component.mostrarSpinners(true);
    expect(component.querySelector('.spinner-list').classList.contains('d-none')).toBe(false);
    
    component.mostrarSpinners(false);
    expect(component.querySelector('.spinner-list').classList.contains('d-none')).toBe(true);
  });
});
