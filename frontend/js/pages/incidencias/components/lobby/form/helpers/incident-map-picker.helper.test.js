import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidentMapPickerHelper } from './incident-map-picker.helper.js';
import { ToastService } from '../../../../../../shared/services/toast.service.js';

jest.mock('../../../../../../shared/services/toast.service.js');

describe('IncidentMapPickerHelper', () => {
  let mockComponent;
  let helper;
  let mockMap;
  let mockMarker;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="incidenciaMapa"></div>
      <input id="dirLat" />
      <input id="dirLng" />
      <button id="btnSeleccionarMapa" class="btn-outline-primary"></button>
      <button id="btnObtenerUbicacion"></button>
      <div id="btnObtenerUbicacionIcon"></div>
      <div id="btnObtenerUbicacionSpinner" class="d-none"></div>
      <span id="btnObtenerUbicacionText">Obtener mi ubicación</span>
      <input id="dirPrecisionGps" />
    `;

    mockComponent = {
      querySelector: (sel) => document.querySelector(sel),
      isMobileLayout: false
    };

    mockMarker = {
      setLatLng: jest.fn(),
      on: jest.fn(),
      addTo: jest.fn().mockReturnThis()
    };

    mockMap = {
      setView: jest.fn().mockReturnThis(),
      on: jest.fn(),
      remove: jest.fn()
    };

    window.L = {
      map: jest.fn().mockReturnValue(mockMap),
      tileLayer: jest.fn().mockReturnValue({ addTo: jest.fn() }),
      marker: jest.fn().mockReturnValue(mockMarker)
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(),
      },
      configurable: true
    });

    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'info').mockImplementation(() => {});

    helper = new IncidentMapPickerHelper(mockComponent);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initEvents', () => {
    it('should attach events to buttons', () => {
      jest.spyOn(helper, 'obtenerUbicacionActual').mockImplementation(() => {});
      jest.spyOn(helper, 'habilitarMapaInteractivo').mockImplementation(() => {});

      helper.initEvents(jest.fn());

      document.querySelector('#btnObtenerUbicacion').click();
      document.querySelector('#btnSeleccionarMapa').click();

      expect(helper.obtenerUbicacionActual).toHaveBeenCalled();
      expect(helper.habilitarMapaInteractivo).toHaveBeenCalled();
    });
  });

  describe('initMap', () => {
    it('should initialize the map with static options', () => {
      helper.initMap();

      expect(window.L.map).toHaveBeenCalledWith(
        document.querySelector('#incidenciaMapa'),
        expect.objectContaining({ dragging: false, zoomControl: false })
      );
      expect(window.L.tileLayer).toHaveBeenCalled();
      expect(mockMap.setView).toHaveBeenCalled();
      expect(helper.isMapInteractive).toBe(false);
    });
  });

  describe('habilitarMapaInteractivo', () => {
    it('should re-initialize the map with interaction enabled', () => {
      helper.map = mockMap; // mock existing map
      helper.habilitarMapaInteractivo();

      expect(mockMap.remove).toHaveBeenCalled();
      expect(window.L.map).toHaveBeenCalledWith(document.querySelector('#incidenciaMapa'));
      expect(helper.isMapInteractive).toBe(true);
      expect(ToastService.info).toHaveBeenCalled();

      const btnMap = document.querySelector('#btnSeleccionarMapa');
      expect(btnMap.classList.contains('btn-primary')).toBe(true);
      expect(btnMap.disabled).toBe(true);
    });

    it('should set click event on map to update marker', () => {
      jest.spyOn(helper, 'actualizarMarcador').mockImplementation(() => {});
      helper.habilitarMapaInteractivo();

      expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));

      // Trigger the mock callback
      const clickCallback = mockMap.on.mock.calls.find(c => c[0] === 'click')[1];
      clickCallback({ latlng: { lat: 10, lng: 20 } });

      expect(helper.actualizarMarcador).toHaveBeenCalledWith(10, 20, true);
    });
  });

  describe('actualizarMarcador', () => {
    it('should update inputs, state, and create marker if none exists', () => {
      helper.map = mockMap;
      helper.isMapInteractive = true;
      const callback = jest.fn();
      helper.onLocationSelectedCallback = callback;

      helper.actualizarMarcador(1.234567, -1.234567, true);

      expect(document.querySelector('#dirLat').value).toBe('1.234567');
      expect(document.querySelector('#dirLng').value).toBe('-1.234567');
      expect(helper.coords).toEqual({ lat: 1.234567, lng: -1.234567 });

      expect(window.L.marker).toHaveBeenCalledWith([1.234567, -1.234567], { draggable: true });
      expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
      expect(mockMap.setView).toHaveBeenCalledWith([1.234567, -1.234567], 16);
      expect(callback).toHaveBeenCalledWith('1.234567', '-1.234567');
    });

    it('should update existing marker if it exists', () => {
      helper.map = mockMap;
      helper.marker = mockMarker;

      helper.actualizarMarcador(2.5, 3.5, false);

      expect(mockMarker.setLatLng).toHaveBeenCalledWith([2.5, 3.5]);
      expect(window.L.marker).not.toHaveBeenCalled();
    });
  });

  describe('obtenerUbicacionActual', () => {
    it('should request geolocation if supported', () => {
      jest.spyOn(helper, '_toggleLocationLoading');
      helper.obtenerUbicacionActual();

      expect(helper._toggleLocationLoading).toHaveBeenCalledWith(true);
      expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should show error toast if not supported', () => {
      Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });
      helper.obtenerUbicacionActual();

      expect(ToastService.error).toHaveBeenCalledWith('Su navegador no soporta la Geolocalización.');
    });
  });

  describe('_handleGeolocationSuccess', () => {
    it('should update marker and call callback', () => {
      jest.spyOn(helper, 'actualizarMarcador').mockImplementation(() => {});
      jest.spyOn(helper, '_toggleLocationLoading').mockImplementation(() => {});
      const callback = jest.fn();
      helper.onLocationSelectedCallback = callback;

      helper._handleGeolocationSuccess({ coords: { latitude: 10, longitude: 20, accuracy: 5.5 } });

      expect(document.querySelector('#dirPrecisionGps').value).toBe('5.50');
      expect(helper.actualizarMarcador).toHaveBeenCalledWith(10, 20, false);
      expect(callback).toHaveBeenCalledWith(10, 20);
      expect(helper._toggleLocationLoading).toHaveBeenCalledWith(false);
      expect(ToastService.success).toHaveBeenCalled();
    });
  });

  describe('_handleGeolocationError', () => {
    it('should handle different error codes', () => {
      jest.spyOn(helper, '_toggleLocationLoading').mockImplementation(() => {});

      const error = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      
      helper._handleGeolocationError(error);
      expect(ToastService.error).toHaveBeenCalledWith('Permiso denegado. Active la Ubicación en su navegador.');

      error.code = 2;
      helper._handleGeolocationError(error);
      expect(ToastService.error).toHaveBeenCalledWith('La ubicación no está disponible.');

      error.code = 3;
      helper._handleGeolocationError(error);
      expect(ToastService.error).toHaveBeenCalledWith('Tiempo de espera agotado al obtener la ubicación.');
    });
  });

  describe('calcularDistancia', () => {
    it('should correctly calculate distance using Haversine formula', () => {
      // Distance between two points approx
      const d = helper.calcularDistancia(0, 0, 1, 1);
      expect(d).toBeCloseTo(157.2, 1); // Approx 157.2 km
    });
  });

  describe('setCoordsAndCenter', () => {
    it('should update marker and center map', () => {
      jest.spyOn(helper, 'actualizarMarcador').mockImplementation(() => {});
      helper.map = mockMap;

      helper.setCoordsAndCenter(10, 20, 14);

      expect(helper.actualizarMarcador).toHaveBeenCalledWith(10, 20, false);
      expect(mockMap.setView).toHaveBeenCalledWith([10, 20], 14);
    });
  });

  describe('destroy', () => {
    it('should remove map and set to null', () => {
      helper.map = mockMap;
      helper.destroy();
      expect(mockMap.remove).toHaveBeenCalled();
      expect(helper.map).toBeNull();
    });
  });

});
