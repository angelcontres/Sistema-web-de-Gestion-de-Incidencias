import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidenciaFormComponent } from './incidencia-form.component.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';
import { UbicacionesService } from '../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../shared/services/catalogo.service.js';

describe('IncidenciaFormComponent - Vista de Ciudadano', () => {
  let component;

  beforeEach(async () => {
    // 1. Simular sesión del usuario con rol Ciudadano y permisos requeridos
    AuthService.getCurrentUser = () => ({
      name: 'Ciudadano Ejemplo',
      email: 'ciudadano@example.com',
      roles: [{ nombre: 'Ciudadano' }],
      ubicacion_defecto: JSON.stringify({ lat: 10, lng: -20 }),
    });
    AuthService.hasPermission = () => true;
    AuthService.isAdmin = () => false;

    // Mockear ToastService para evitar errores en DOM
    ToastService.error = jest.fn();
    ToastService.success = jest.fn();
    ToastService.show = jest.fn();
    ToastService.info = jest.fn();
    ToastService.warning = jest.fn();

    // Mock Services
    UbicacionesService.reverseGeocode = jest.fn().mockResolvedValue({
      address: {
        road: 'Main St',
        suburb: 'Downtown',
        city: 'Metropolis',
        postcode: '12345',
        country_code: 'ec',
      },
      display_name: 'Main St, Downtown',
    });
    CatalogoService.getDirecciones = jest.fn().mockResolvedValue([]);
    CatalogoService.getTerritorios = jest
      .fn()
      .mockResolvedValue([{ id: 1, nombre: 'Territory 1' }]);

    // Mockear la plantilla HTML
    const mockHtml = `
      <form id="incidenciaForm" class="needs-validation" novalidate>
        <div id="sectionAsignacion"></div>
        <div id="detallesDireccionContainer" class="col-lg-5">
          <input type="text" id="dirDetalle" required />
          <select id="dirPais" required></select>
          <label id="lblDirNivel1"></label><select id="dirNivel1" required></select>
          <label id="lblDirNivel2"></label><select id="dirNivel2" required></select>
          <label id="lblDirNivel3"></label><select id="dirNivel3" required></select>
        </div>
        <div id="colMapaContainer" class="col-lg-7">
          <div id="incidenciaMapa"></div>
          <div id="infoUbicacionMinimalista" class="d-none">
            <span id="txtInfoUbicacion"></span>
          </div>
        </div>
        <input type="hidden" id="incidenciaId" />
        <input type="hidden" id="incidenciaVersion" />
        <select id="tipoSelect"></select>
        <select id="subTipoSelect"></select>
        <input type="number" id="cantidadAfectados" />
        <div id="prioridadDisplay"></div>
        <textarea id="descripcion"></textarea>
        <select id="institucionSelect"></select>
        <select id="estadoSelect"></select>
        <input type="hidden" id="dirLat" />
        <input type="hidden" id="dirLng" />
        <button type="button" id="btnBuscarDireccion"></button>
        <input type="text" id="direccionSearch" />
        <button type="submit" id="btnSubmit"></button>
        <button type="button" id="btnConfirmarResolucion"></button>
        <div id="divInstitucion"></div>
        <h1 id="formTitle"></h1>
        <span id="btnText"></span>
        <button id="btnObtenerUbicacion"></button>
        <button id="btnSeleccionarMapa"></button>
        
        <input id="dirCodigoPostal" />
        
        <div class="modal" id="modalRegistrarDireccion">
          <input id="modalDirLat" />
          <input id="modalDirLng" />
          <input id="modalDirDetalle" />
          <input id="modalDirCodigoPostal" />
          <select id="modalDirPais"></select>
          <label id="lblModalDirNivel1"></label><select id="modalDirNivel1"></select>
          <label id="lblModalDirNivel2"></label><select id="modalDirNivel2"></select>
          <label id="lblModalDirNivel3"></label><select id="modalDirNivel3"></select>
        </div>
        <div id="colModalDirNivel1"></div>
        <div id="colModalDirNivel2"></div>
        <div id="colModalDirNivel3"></div>
      </form>
    `;

    // Mock de window.fetch
    window.fetch = jest.fn(async (url) => {
      if (typeof url === 'string' && url.includes('.html')) {
        return { ok: true, status: 200, text: async () => mockHtml };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
    });

    // Mock Bootstrap modal
    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({ show: jest.fn(), hide: jest.fn() })),
    };

    // Instanciar el componente
    component = new IncidenciaFormComponent();

    // Mockear métodos del ciclo de vida externos
    component.initMap = jest.fn();
    component.cargarCatalogosIniciales = jest.fn().mockResolvedValue();

    document.body.appendChild(component);

    // Wait for connectedCallback to fetch HTML and call onInit
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  afterEach(() => {
    if (component && component.parentNode) {
      document.body.removeChild(component);
    }
    jest.clearAllMocks();
  });

  describe('Métodos Core Públicos', () => {
    test('limpiarErrores() - debe ocultar formErrorAlert', () => {
      component.form.innerHTML += '<div id="formErrorAlert" class="">Error</div>';
      component.limpiarErrores();
      expect(component.form.querySelector('#formErrorAlert').classList.contains('d-none')).toBe(
        true
      );
    });

    test('disableFormFields() - debe deshabilitar controles de formulario', () => {
      component.disableFormFields();
      expect(component.tipoSelect.disabled).toBe(true);
      expect(component.descripcionInput.disabled).toBe(true);
      expect(component.cantidadAfectadosInput.disabled).toBe(true);
      expect(component.btnObtenerUbicacion.disabled).toBe(true);
      expect(component.btnSeleccionarMapa.disabled).toBe(true);
    });

    test('onCategoryChange() - debe actualizar subTipoSelect y prioridad', () => {
      component.categorias = [
        { id: 1, nombre: 'Cat1' },
        { id: 10, nombre: 'Sub1', prioridad_id: 3, parent_id: 1, activo: true },
      ];
      component.tipoSelect = component.querySelector('#tipoSelect');
      component.tipoSelect.innerHTML = '<option value="1">Cat1</option>';
      component.tipoSelect.value = '1';
      component.tipoSelect.selectedIndex = 0;

      component.subTipoSelect = component.querySelector('#subTipoSelect');

      // Stub the calculate method since we want to check it's called
      const spyPrioridad = jest.spyOn(component, 'calcularPrioridadDinamica');

      component.onCategoryChange();

      expect(component.subTipoSelect.disabled).toBe(false);
      expect(component.subTipoSelect.options.length).toHaveLength(2);
      expect(spyPrioridad).toHaveBeenCalled();
    });

    test('onCategoryChange() - categoria sin subtipos', () => {
      component.categorias = [];
      component.tipoSelect = component.querySelector('#tipoSelect');
      component.tipoSelect.innerHTML = '<option value="99">Cat</option>';
      component.tipoSelect.value = '99';
      component.subTipoSelect = component.querySelector('#subTipoSelect');

      component.onCategoryChange();

      expect(component.subTipoSelect.innerHTML).toContain('Seleccione');
      expect(component.subTipoSelect.disabled).toBe(false);
    });

    test('calcularPrioridadDinamica() - calcula la prioridad correctamente', () => {
      component.subTipoSelect = { value: '2' };
      component.categorias = [{ id: 2, prioridad_id: 4 }];
      component.cantidadAfectadosInput = { value: '10' };

      component.prioridadDisplay = { innerHTML: '', className: '', style: {} };

      component.calcularPrioridadDinamica();

      // baja (4) becomes media (3) because afectados >= 10
      expect(component.prioridadDisplay.textContent).toContain('Media');
      expect(component.prioridadDisplay.className).toContain('badge bg-info');
    });

    test('calcularPrioridadDinamica() - maneja NaN o sin seleccion', () => {
      component.subTipoSelect = { value: '' };
      component.prioridadDisplay = { innerHTML: '', className: '', style: {} };

      component.calcularPrioridadDinamica();

      expect(component.prioridadCalculada).toBeUndefined();
      expect(component.prioridadDisplay.textContent).toBe('-');
    });

    test('calcularDistancia() - retorna la distancia correcta usando formula de Haversine', () => {
      const dist = component.calcularDistancia(40.4168, -3.7038, 41.3851, 2.1734);
      expect(dist).toBeGreaterThan(490);
      expect(dist).toBeLessThan(520);
    });

    test('prepararCreacion() - resetea el formulario para nuevo registro', () => {
      component.formTitle = { textContent: '' };
      component.btnText = { textContent: '' };

      // Spy autofill
      component.autofillDesdeCoordenadas = jest.fn();
      component.cargarDropdownNivel1 = jest.fn();
      component.actualizarEtiquetasNiveles = jest.fn();

      component.prepararCreacion();

      expect(component.formTitle.textContent).toBe('Registrar Incidencia');
      expect(component.btnText.textContent).toBe('Guardar Incidencia');
    });

    test('actualizarMarcador() - actualiza coords y campos lat/lng', () => {
      component.dirLatInput = { value: '' };
      component.dirLngInput = { value: '' };
      component.autofillDesdeCoordenadas = jest.fn();

      component.actualizarMarcador(10.1234567, -20.1234567, false);

      expect(component.dirLatInput.value).toBe('10.123457');
      expect(component.dirLngInput.value).toBe('-20.123457');
      expect(component.coords).toEqual({ lat: 10.123457, lng: -20.123457 });
      expect(component.autofillDesdeCoordenadas).not.toHaveBeenCalled();
    });

    test('actualizarMarcador() - con map y marker existente', () => {
      const setLatLngMock = jest.fn();
      component.marker = { setLatLng: setLatLngMock };
      const setViewMock = jest.fn();
      component.map = { setView: setViewMock, remove: jest.fn() };
      component.autofillDesdeCoordenadas = jest.fn();

      component.actualizarMarcador(10.1, 20.1, true);

      expect(setLatLngMock).toHaveBeenCalledWith([10.1, 20.1]);
      expect(setViewMock).toHaveBeenCalledWith([10.1, 20.1], 16);
      expect(component.autofillDesdeCoordenadas).toHaveBeenCalledWith('10.100000', '20.100000');
    });

    test('autofillDesdeCoordenadas() - rellena campos desde el reverse geocoding', async () => {
      component.paisesList = [{ id: 1, codigo_iso: 'EC' }];
      component.dirPaisSelect = component.querySelector('#dirPais');
      component.dirPaisSelect.innerHTML = '<option value="1">Ecuador</option>';
      component.dirDetalleInput = component.querySelector('#dirDetalle');
      component.actualizarEtiquetasNiveles = jest.fn();
      component.autofillTerritoriosCascading = jest.fn().mockResolvedValue();

      await component.autofillDesdeCoordenadas(10.1, 20.1);

      expect(UbicacionesService.reverseGeocode).toHaveBeenCalledWith(10.1, 20.1);
      expect(component.dirDetalleInput.value).toBe('Main St, Downtown, Metropolis');
      expect(component.currentPostalCode).toBe('12345');
      expect(component.dirPaisSelect.value).toBe('1');
      expect(component.autofillTerritoriosCascading).toHaveBeenCalled();
    });

    test('autofillDesdeCoordenadas() - cuando ubicacion esta registrada', async () => {
      component.paisesList = [{ id: 1, codigo_iso: 'EC' }];
      CatalogoService.getDirecciones.mockResolvedValue([
        {
          id: 99,
          latitud: 10.1,
          longitud: 20.1,
          detalle: 'DB Dir',
          codigo_postal: '999',
          territorio: { pais_id: 1 },
        },
      ]);
      component.actualizarIndicadorMinimalista = jest.fn();

      await component.autofillDesdeCoordenadas(10.1, 20.1);

      expect(component.selectedDireccionId).toBe(99);
      expect(component.dirDetalleInput.value).toBe('DB Dir');
    });
  });
});
