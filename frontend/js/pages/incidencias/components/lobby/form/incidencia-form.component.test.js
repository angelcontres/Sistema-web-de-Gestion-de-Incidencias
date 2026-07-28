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
    CatalogoService.getCategoriasIncidencia = jest.fn().mockResolvedValue([]);
    CatalogoService.getPaises = jest.fn().mockResolvedValue([]);
    CatalogoService.getInstituciones = jest.fn().mockResolvedValue([]);
    CatalogoService.getEstados = jest.fn().mockResolvedValue([
      { id: 1, nombre: 'Pendiente' },
      { id: 3, nombre: 'En Proceso' }
    ]);
    CatalogoService.getPrioridades = jest.fn().mockResolvedValue([
      { id: 1, nombre: 'Crítica', color_hex: '#FF0000' },
      { id: 2, nombre: 'Alta', color_hex: '#FF8C00' },
      { id: 3, nombre: 'Media', color_hex: '#FFD700' },
      { id: 4, nombre: 'Baja', color_hex: '#008000' }
    ]);

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
        <output class="spinner-border spinner-border-sm d-none"></output>
        
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
      Modal: { getOrCreateInstance: jest.fn().mockImplementation(() => ({ show: jest.fn(), hide: jest.fn() })) },
    };
    
    // Mock L Leaflet
    window.L = {
      map: jest.fn().mockReturnValue({ setView: jest.fn().mockReturnThis(), on: jest.fn(), remove: jest.fn() }),
      tileLayer: jest.fn().mockReturnValue({ addTo: jest.fn() }),
      marker: jest.fn().mockReturnValue({ addTo: jest.fn(), on: jest.fn(), setLatLng: jest.fn() })
    };

    // Instanciar el componente
    component = new IncidenciaFormComponent();

    document.body.appendChild(component);

    // Wait for connectedCallback to fetch HTML and call onInit
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (component && component.parentNode) {
      document.body.removeChild(component);
    }
    jest.clearAllMocks();
  });

  describe('Métodos Core Públicos y Helpers', () => {
    test('limpiarErrores() - debe ocultar formErrorAlert', () => {
      component.form.innerHTML += '<div id="formErrorAlert" class="">Error</div>';
      component.limpiarErrores();
      expect(component.form.querySelector('#formErrorAlert').classList.contains('d-none')).toBe(
        true
      );
    });

    test('disableFormFields() - debe deshabilitar controles de formulario', () => {
      component.disableFormFields();
      expect(component.categoryManager.tipoSelect.disabled).toBe(true);
      expect(component.descripcionInput.disabled).toBe(true);
      expect(component.categoryManager.cantidadAfectadosInput.disabled).toBe(true);
    });

    test('IncidentClassificationHelper onCategoryChange() - debe actualizar subTipoSelect y prioridad', () => {
      component.categoryManager.categorias = [
        { id: 1, nombre: 'Cat1', parent_id: null, activo: true },
        { id: 10, nombre: 'Sub1', prioridad_id: 3, parent_id: 1, activo: true },
      ];
      const tipoSelect = component.querySelector('#tipoSelect');
      tipoSelect.innerHTML = '<option value="1">Cat1</option>';
      tipoSelect.value = '1';
      tipoSelect.selectedIndex = 0;

      const spyPrioridad = jest.spyOn(component.categoryManager, 'calcularPrioridadDinamica');

      component.categoryManager.onCategoryChange();

      expect(component.categoryManager.subTipoSelect.disabled).toBe(false);
      expect(component.categoryManager.subTipoSelect.options).toHaveLength(2);
      expect(spyPrioridad).toHaveBeenCalled();
    });

    test('IncidentClassificationHelper calcularPrioridadDinamica() - calcula la prioridad correctamente', () => {
      component.categoryManager.subTipoSelect = { value: '2' };
      component.categoryManager.categorias = [{ id: 2, prioridad_id: 4 }];
      component.categoryManager.cantidadAfectadosInput = { value: '10' };

      component.categoryManager.prioridadDisplay = { innerHTML: '', className: '', style: {} };

      component.categoryManager.calcularPrioridadDinamica();

      expect(component.categoryManager.prioridadDisplay.textContent).toContain('Media');
    });

    test('IncidentMapPickerHelper calcularDistancia() - retorna la distancia correcta', () => {
      const dist = component.mapController.calcularDistancia(40.4168, -3.7038, 41.3851, 2.1734);
      expect(dist).toBeGreaterThan(490);
      expect(dist).toBeLessThan(520);
    });

    test('prepararCreacion() - resetea el formulario para nuevo registro', () => {
      component.formTitle = { textContent: '' };
      component.btnText = { textContent: '' };

      component.prepararCreacion();

      expect(component.formTitle.textContent).toBe('Registrar Incidencia');
      expect(component.btnText.textContent).toBe('Guardar Incidencia');
    });

    test('IncidentMapPickerHelper actualizarMarcador() - actualiza coords y campos lat/lng', () => {
      component.mapController.dirLatInput = { value: '' };
      component.mapController.dirLngInput = { value: '' };

      component.mapController.actualizarMarcador(10.1234567, -20.1234567, false);

      expect(component.mapController.dirLatInput.value).toBe('10.123457');
      expect(component.mapController.dirLngInput.value).toBe('-20.123457');
      expect(component.mapController.coords).toEqual({ lat: 10.123457, lng: -20.123457 });
    });

    test('IncidentTerritoryCascadeHelper autofillDesdeCoordenadas() - rellena campos desde el reverse geocoding', async () => {
      component.locationManager.paisesList = [{ id: 1, codigo_iso: 'EC', activo: true }];
      component.locationManager.dirPaisSelect = component.querySelector('#dirPais');
      component.locationManager.dirPaisSelect.innerHTML = '<option value="1">Ecuador</option>';
      component.locationManager.dirDetalleInput = component.querySelector('#dirDetalle');
      
      component.locationManager.autofillTerritoriosCascading = jest.fn().mockResolvedValue();

      await component.locationManager.autofillDesdeCoordenadas(10.1, 20.1);

      expect(UbicacionesService.reverseGeocode).toHaveBeenCalledWith(10.1, 20.1);
      expect(component.locationManager.dirDetalleInput.value).toBe('Main St, Downtown, Metropolis');
      expect(component.locationManager.currentPostalCode).toBe('12345');
      expect(component.locationManager.dirPaisSelect.value).toBe('1');
      expect(component.locationManager.autofillTerritoriosCascading).toHaveBeenCalled();
    });

    test('guardarIncidencia() - rechaza si faltan coordenadas (R9)', async () => {
      component.form.checkValidity = () => true;
      component.mapController.getCoords = () => null; // Simulate missing map ping

      await component.guardarIncidencia({ preventDefault: jest.fn() });

      expect(ToastService.error).toHaveBeenCalledWith('Debe marcar la ubicación en el mapa.');
    });
  });
});
