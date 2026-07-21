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
          <select id="dirPaisSelect">
            <option value="1">Ecuador</option>
          </select>
          <div id="colDirNivel1"><select id="dirNivel1Select"></select></div>
          <div id="colDirNivel2"><select id="dirNivel2Select"></select></div>
          <div id="colDirNivel3"><select id="dirNivel3Select"></select></div>
          
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
        <input type="radio" name="territoryResolveOption" value="register" id="resolveOptRegister" />
        <div id="missingTerritoryAlert"></div>
        <div id="missingTerritoryMessage"></div>
        <button id="btnRegistrarTerritorioFaltante"></button>
        <div id="missingTerritoryResolver"></div>
        
        <div id="autofillStatus"></div>
        <div id="autofillStatusText"></div>
        
        <div id="gpsLocationInfo"></div>
        <div id="gpsLocationText"></div>
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
    // Mock the dispatchEvent on component to avoid errors
    component.dispatchEvent = jest.fn();

    jest.spyOn(AuthService, 'getCurrentUser').mockReturnValue({ pais_id: 1 });
    
    jest.spyOn(UbicacionesService, 'getPaises').mockResolvedValue([{ id: 1, nombre: 'Ecuador', codigo_iso: 'EC', activo: true }]);
    jest.spyOn(UbicacionesService, 'getTerritorios').mockResolvedValue([{ id: 10, nombre: 'Pichincha', tipo: 'Provincia', activo: true }]);
    jest.spyOn(UbicacionesService, 'createDireccion').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'updateDireccion').mockResolvedValue({});
    jest.spyOn(UbicacionesService, 'reverseGeocode').mockResolvedValue({
      address: { country_code: 'ec', state: 'Pichincha', county: 'Quito', city: 'Conocoto', road: 'Av Principal', postcode: '170150' },
      display_name: 'Av Principal, Pichincha, EC'
    });
    jest.spyOn(UbicacionesService, 'createPais').mockResolvedValue({ id: 99 });
    jest.spyOn(UbicacionesService, 'createTerritorio').mockResolvedValue({ id: 100 });
    
    // Polyfill for normalizeText in jest if needed (string normalize)
    // We will let the real functions run for coverage
    
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
    expect(document.querySelector('#dirPaisSelect').value).toBe('1');
  });

  it('abrir(dir) prepara el formulario para edición y carga componentes', async () => {
    await component.onInit();
    const mockDir = {
      id: 5,
      detalle: 'Avenida Siempre Viva',
      latitud: 12.34,
      longitud: 56.78,
      activo: true,
      territorio: { pais_id: 1, id: 10, parent: { id: 2 } }
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
    expect(component.dispatchEvent).toHaveBeenCalled();
  });

  it('guardarDireccion llama a updateDireccion cuando hay id', async () => {
    await component.onInit();
    await component.abrir({ id: 5, territorio: { pais_id: 1 } });
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    document.querySelector('#direccionId').value = '5';
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="10">Pichincha</option>';
    document.querySelector('#dirNivel1Select').value = '10';

    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    expect(UbicacionesService.updateDireccion).toHaveBeenCalledWith('5', expect.any(Object));
  });

  it('guardarDireccion falla de validación', async () => {
    await component.onInit();
    await component.abrir();
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(false);

    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    expect(form.classList.contains('was-validated')).toBe(true);
    expect(UbicacionesService.createDireccion).not.toHaveBeenCalled();
  });
  
  it('guardarDireccion falla si no hay territorio', async () => {
    await component.onInit();
    await component.abrir();
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    document.querySelector('#dirNivel1Select').value = '';
    document.querySelector('#dirNivel2Select').value = '';
    document.querySelector('#dirNivel3Select').value = '';

    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    const errorAlert = document.querySelector('#direccionModalErrorAlert');
    expect(errorAlert.classList.contains('d-none')).toBe(false);
  });

  it('guardarDireccion con registro automático de territorios', async () => {
    await component.onInit();
    await component.abrir();
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    
    const registerOpt = document.querySelector('#resolveOptRegister');
    registerOpt.checked = true;
    
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="10">Pichincha</option>';
    document.querySelector('#dirNivel1Select').value = '10';
    
    component.pendingGeography = {
      pais: { nombre: 'New Country', codigo_iso: 'NC', exists: false, id: null },
      nivel1: { nombre: 'N1', exists: false, tipo: 'Provincia' },
      nivel2: { nombre: 'N2', exists: false, tipo: 'Canton' },
      nivel3: { nombre: 'N3', exists: false, tipo: 'Parroquia' }
    };
    
    document.querySelector('#direccionLatitud').value = '1';
    document.querySelector('#direccionLongitud').value = '1';

    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    expect(UbicacionesService.createPais).toHaveBeenCalled();
    expect(UbicacionesService.createTerritorio).toHaveBeenCalledTimes(3);
    expect(UbicacionesService.createDireccion).toHaveBeenCalled();
  });

  it('debería manejar initModalMap y clicks', async () => {
    await component.onInit();
    component.initModalMap();
    expect(window.L.map).toHaveBeenCalled();
    
    // Simulate map click
    const mapObj = window.L.map();
    const clickHandler = mapObj.on.mock.calls.find(c => c[0] === 'click')[1];
    clickHandler({ latlng: { lat: -0.22, lng: -78.5 } });
    
    expect(document.querySelector('#direccionLatitud').value).toBe('-0.220000');
  });

  it('debería autofillUbicacionDesdeCoords con pais existente y niveles', async () => {
    await component.onInit();
    await component.cargarPaises();
    
    // Prepare DOM elements
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="10">Pichincha</option>';
    document.querySelector('#dirNivel2Select').innerHTML = '<option value="20">Quito</option>';
    document.querySelector('#dirNivel3Select').innerHTML = '<option value="30">Conocoto</option>';
    
    // Simulate reverse geocode matching Pichincha, Quito, Conocoto
    jest.spyOn(UbicacionesService, 'reverseGeocode').mockResolvedValueOnce({
      address: { country_code: 'ec', state: 'Pichincha', county: 'Quito', parish: 'Conocoto', road: 'Av Principal' },
      display_name: 'Av Principal, Pichincha, EC'
    });
    
    jest.spyOn(UbicacionesService, 'getTerritorios').mockImplementation((params) => {
      if (!params.parent_id) return Promise.resolve([{ id: 10, nombre: 'Pichincha', tipo: 'Provincia' }]);
      if (params.parent_id == 10) return Promise.resolve([{ id: 20, nombre: 'Quito', tipo: 'Canton' }]);
      if (params.parent_id == 20) return Promise.resolve([{ id: 30, nombre: 'Conocoto', tipo: 'Parroquia' }]);
      return Promise.resolve([]);
    });
    
    await component.autofillUbicacionDesdeCoords(-0.22, -78.5);
    
    expect(UbicacionesService.reverseGeocode).toHaveBeenCalledWith(-0.22, -78.5);
    expect(document.querySelector('#direccionDetalle').value).toMatch(/Av Principal/);
  });

  it('debería registrarTerritorioFaltante', async () => {
    await component.onInit();
    component.pendingTerritory = {
      pais_id: 1, parent_id: null, nombre: 'Nuevo Nivel 1', tipo: 'Provincia', nivel: 1
    };
    
    await component.registrarTerritorioFaltante();
    
    expect(UbicacionesService.createTerritorio).toHaveBeenCalled();
    expect(ToastService.success).toHaveBeenCalled();
    expect(component.pendingTerritory).toBeNull();
  });

  it('debería llamar metodos auxiliares (normalizeText, mostrarCampo, ocultarCampo)', async () => {
    await component.onInit();
    
    const norm = component.normalizeText('Árbol');
    expect(norm).toBe('arbol');
    
    expect(component.normalizeText(null)).toBe('');
    expect(component.capitalizeWords(null)).toBe('');
    expect(component.capitalizeWords('hello world')).toBe('Hello World');

    document.body.innerHTML += '<div id="testDiv" class="d-none"></div>';
    component.mostrarCampo('#testDiv');
    expect(document.querySelector('#testDiv').classList.contains('d-none')).toBe(false);
    
    component.ocultarCampo('#testDiv');
    
    // Simulate timeout logic in ocultarCampo
    jest.useFakeTimers();
    component.ocultarCampo('#testDiv');
    document.querySelector('#testDiv').style.opacity = '0';
    jest.runAllTimers();
    expect(document.querySelector('#testDiv').classList.contains('d-none')).toBe(true);
    jest.useRealTimers();
  });

  it('actualizarEtiquetasNiveles funciona con un país dado', async () => {
    await component.onInit();
    component.paisesList = [{ id: 1, codigo_iso: 'EC' }];
    document.body.innerHTML += '<label id="lblDirNivel1"></label><select id="dirNivel1Select"><option></option></select>';
    
    component.actualizarEtiquetasNiveles(1);
    expect(document.querySelector('#lblDirNivel1').textContent).toBe('Provincia');
  });

  it('debería actualizarFeedbackResolver', async () => {
    await component.onInit();
    const resolveHtml = `
      <div id="missingTerritoryResolver">
        <div class="card"></div>
        <i class="bi-exclamation-triangle-fill"></i>
        <span class="fw-bold"></span>
        <span class="text-secondary"></span>
        <input type="radio" name="territoryResolveOption" value="register" id="resolveOptRegister" checked>
        <input type="radio" name="territoryResolveOption" value="existing" id="resolveOptExisting">
      </div>
    `;
    // Replace instead of append to avoid conflicts
    document.body.innerHTML = resolveHtml;
    
    component.pendingGeography = {
      pais: { exists: false, nombre: 'Pais1' },
      nivel1: { exists: false, nombre: 'N1', tipo: 'Prov' },
      nivel2: { exists: false, nombre: 'N2', tipo: 'Can' },
      nivel3: { exists: false, nombre: 'N3', tipo: 'Par' }
    };
    
    component.actualizarFeedbackResolver();
    const title = document.querySelector('#missingTerritoryResolver .fw-bold');
    expect(title.textContent).toBe('Registro Automático Activado');
    
    const rRegister = document.querySelector('#resolveOptRegister');
    const rExisting = document.querySelector('#resolveOptExisting');
    
    rExisting.checked = true;
    rRegister.checked = false;
    
    component.actualizarFeedbackResolver();
    expect(title.textContent).toBe('Resolución Manual');
  });

  it('guardarDireccion maneja errores del servicio', async () => {
    await component.onInit();
    await component.abrir();
    
    const form = document.querySelector('#direccionForm');
    form.checkValidity = jest.fn().mockReturnValue(true);
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="10">Pichincha</option>';
    document.querySelector('#dirNivel1Select').value = '10';
    
    jest.spyOn(UbicacionesService, 'createDireccion').mockRejectedValueOnce(new Error('Test error'));
    
    await component.guardarDireccion({ preventDefault: jest.fn() });
    
    const errorAlert = document.querySelector('#direccionModalErrorAlert');
    expect(errorAlert.classList.contains('d-none')).toBe(false);
    expect(document.querySelector('#direccionModalErrorMessage').textContent).toBe('Test error');
  });

  it('debería cargarDireccionDropdownNivel1 y subsecuentes', async () => {
    await component.onInit();
    await component.cargarPaises();
    
    await component.cargarDireccionDropdownNivel1('1');
    expect(UbicacionesService.getTerritorios).toHaveBeenCalledWith({ pais_id: '1', parent_id: null });
    
    await component.cargarDireccionDropdownNivel2('1', '10');
    expect(UbicacionesService.getTerritorios).toHaveBeenCalledWith({ pais_id: '1', parent_id: '10' });
    
    await component.cargarDireccionDropdownNivel3('1', '20');
    expect(UbicacionesService.getTerritorios).toHaveBeenCalledWith({ pais_id: '1', parent_id: '20' });
  });

  it('debería manejar eventos de change en selects', async () => {
    await component.onInit();
    
    const paisSelect = document.querySelector('#dirPaisSelect');
    // Value '1' is already an option thanks to the updated template
    paisSelect.value = '1';
    
    component.actualizarEtiquetasNiveles = jest.fn();
    paisSelect.dispatchEvent(new Event('change'));
    
    expect(component.actualizarEtiquetasNiveles).toHaveBeenCalledWith('1');
    
    const n1Select = document.querySelector('#dirNivel1Select');
    n1Select.innerHTML = '<option value="10">Opcion</option>';
    n1Select.value = '10';
    n1Select.dispatchEvent(new Event('change'));
    
    const n2Select = document.querySelector('#dirNivel2Select');
    n2Select.innerHTML = '<option value="20">Opcion 2</option>';
    n2Select.value = '20';
    n2Select.dispatchEvent(new Event('change'));
    
    const n3Select = document.querySelector('#dirNivel3Select');
    n3Select.innerHTML = '<option value="30">Opcion 3</option>';
    n3Select.value = '30';
    n3Select.dispatchEvent(new Event('change'));
  });

  it('debería manejar change en territoryResolveOption', async () => {
    await component.onInit();
    component.pendingGeography = {};
    component.actualizarFeedbackResolver = jest.fn();
    
    const radio = document.querySelector('input[name="territoryResolveOption"][value="existing"]');
    radio.dispatchEvent(new Event('change'));
    
    expect(component.actualizarFeedbackResolver).toHaveBeenCalled();
    expect(document.querySelector('#dirPaisSelect').disabled).toBe(false);
  });
  
  it('debería llamar disconnectedCallback y limpiar', async () => {
    await component.onInit();
    component.initModalMap();
    component.disconnectedCallback();
    
    expect(component.modalMap).toBeNull();
    expect(document.querySelector('#direccionModal')).toBeNull();
  });

  it('manejarCambioNivel', async () => {
    await component.onInit();
    
    // Mock event
    const selectPais = document.querySelector('#dirPaisSelect');
    selectPais.value = '1';
    
    const selectN1 = document.querySelector('#dirNivel1Select');
    if (selectN1 && selectN1.options.length === 0) {
      selectN1.appendChild(document.createElement('option'));
    }
    const selectN2 = document.querySelector('#dirNivel2Select');
    if (selectN2 && selectN2.options.length === 0) {
      selectN2.appendChild(document.createElement('option'));
    }
    const selectN3 = document.querySelector('#dirNivel3Select');
    if (selectN3 && selectN3.options.length === 0) {
      selectN3.appendChild(document.createElement('option'));
    }
    
    jest.spyOn(UbicacionesService, 'getTerritorios').mockResolvedValue([{ id: 2, nombre: 'Test', tipo: 'Provincia' }]);
    
    selectPais.dispatchEvent(new Event('change'));
    
    // allow microtasks to flush
    await Promise.resolve();
    expect(UbicacionesService.getTerritorios).toHaveBeenCalledWith(expect.objectContaining({ pais_id: '1', parent_id: null }));
  });

  it('registrarTerritorioFaltante', async () => {
    await component.onInit();
    
    const btn = document.createElement('button');
    btn.id = 'btnRegistrarTerritorioFaltante';
    document.body.appendChild(btn);
    
    component.pendingTerritory = { pais_id: 1, parent_id: 1, nombre: 'NuevoTerritorio', tipo: 'Provincia' };
    
    jest.spyOn(UbicacionesService, 'createTerritorio').mockResolvedValue({
      data: { id: 99, nombre: 'NuevoTerritorio', tipo: 'Provincia' }
    });
    
    const mockSelect = document.createElement('select');
    mockSelect.id = 'dirNivel1Select';
    document.body.appendChild(mockSelect);
    
    await component.registrarTerritorioFaltante();
    
    expect(UbicacionesService.createTerritorio).toHaveBeenCalledWith({
      pais_id: 1, parent_id: 1, nombre: 'NuevoTerritorio', tipo: 'Provincia', activo: true
    });
    expect(mockSelect.disabled).toBe(false);
  });
});
