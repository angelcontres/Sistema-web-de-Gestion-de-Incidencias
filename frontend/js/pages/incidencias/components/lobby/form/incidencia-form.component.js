import { BaseComponent } from '../../../../../core/base-component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { UbicacionesService } from '../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../shared/services/catalogo.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../core/auth.service.js';

import { IncidentMapPickerHelper } from './helpers/incident-map-picker.helper.js';
import { IncidentMediaUploaderHelper } from './helpers/incident-media-uploader.helper.js';
import { IncidentTerritoryCascadeHelper } from './helpers/incident-territory-cascade.helper.js';
import { IncidentClassificationHelper } from './helpers/incident-classification.helper.js';
import { IncidentMobileUIHelper } from './helpers/incident-mobile-ui.helper.js';
import { IncidentSupportInstitutionsHelper } from './helpers/incident-support-institutions.helper.js';
import { IncidentFormStateHelper } from './helpers/incident-form-state.helper.js';

export class IncidenciaFormComponent extends BaseComponent {
  constructor() {
    const isMobile = window.innerWidth <= 768;
    super(isMobile 
      ? 'js/pages/incidencias/components/lobby/form/incidencia-form-mobile.component.html'
      : 'js/pages/incidencias/components/lobby/form/incidencia-form.component.html'
    );
    this.isMobileLayout = isMobile;
  }

  async onInit() {
    console.log('Formulario de incidencias inicializado.');

    // 1. Initialize core elements
    this.form = this.querySelector('#incidenciaForm');
    this.incidenciaIdInput = this.querySelector('#incidenciaId');
    this.versionInput = this.querySelector('#incidenciaVersion');
    this.descripcionInput = this.querySelector('#descripcion');
    this.estadoSelect = this.querySelector('#estadoSelect');
    this.institucionSelect = this.querySelector('#institucionSelect');
    this.institucionesApoyoSelect = this.querySelector('#institucionesApoyoSelect');
    this.btnSubmit = this.querySelector('#btnSubmit');
    this.btnConfirmarResolucion = this.querySelector('#btnConfirmarResolucion');
    this.formTitle = this.querySelector('#formTitle');
    this.btnText = this.querySelector('#btnText');
    this.dirPrecisionGpsInput = this.querySelector('#dirPrecisionGps');

    // Apoyo Form Logic is handled by Helper

    // Check permissions
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const incidenciaId = urlParams.get('id');

    if (!this.checkFormAccess(incidenciaId)) return;

    const user = AuthService.getCurrentUser();
    const isAdmin = AuthService.isAdmin();
    const canManageIncidencia = AuthService.canManageIncidencias();

    const colEstado = this.querySelector('#colEstado');
    if (colEstado) {
      if (canManageIncidencia) colEstado.classList.remove('d-none');
      else colEstado.classList.add('d-none');
    }

    const divInstitucion = this.querySelector('#divInstitucion');
    if (divInstitucion) divInstitucion.classList.remove('d-none');
    if (this.institucionSelect) this.institucionSelect.disabled = !canManageIncidencia;

    // 2. Initialize Helpers
    this.mapController = new IncidentMapPickerHelper(this);
    this.mediaUploader = new IncidentMediaUploaderHelper(this);
    this.locationManager = new IncidentTerritoryCascadeHelper(this);
    this.categoryManager = new IncidentClassificationHelper(this);
    this.supportInstitutionsManager = new IncidentSupportInstitutionsHelper(this);
    this.stateManager = new IncidentFormStateHelper(this);

    // Link Location Manager and Map Controller
    this.locationManager.setMapController(this.mapController);
    this.mapController.initEvents((lat, lng) => {
      this.locationManager.autofillDesdeCoordenadas(lat, lng);
      if (this.isMobileLayout && this.mobileUIHelper) {
        this.mapController.habilitarMapaInteractivo();
        this.mobileUIHelper.markStepCompleted(2);
        this.mobileUIHelper.checkMobileReadyState();
      }
    });
    this.mapController.initMap();

    // 3. Init local events
    this.form.addEventListener('submit', (e) => this.guardarIncidencia(e));
    this.supportInstitutionsManager.initEvents();
    this.initMaxFilesLimit(user, isAdmin);

    // 4. Load initial dropdown data
    await this.cargarCatalogosIniciales();
    this.supportInstitutionsManager.actualizarBadgesApoyoForm();

    if (this.isMobileLayout) {
      this.mobileUIHelper = new IncidentMobileUIHelper(this);
      this.mobileUIHelper.initMobileUI();
    }

    // 5. Load edit or create mode
    if (incidenciaId) {
      await this.stateManager.cargarDatosEdicion(incidenciaId);
    } else {
      this.stateManager.prepararCreacion(user);
    }
  }

  disconnectedCallback() {
    if (this.mapController) {
      this.mapController.destroy();
    }
  }

  checkFormAccess(incidenciaId) {
    if (incidenciaId && !AuthService.hasPermission('UPDATE', 'incidencias')) {
      ToastService.error('No tiene permiso para editar incidencias.');
      window.location.hash = '#/incidencias';
      return false;
    }
    if (!incidenciaId && !AuthService.hasPermission('CREATE', 'incidencias')) {
      ToastService.error('No tiene permiso para registrar incidencias.');
      window.location.hash = '#/incidencias';
      return false;
    }
    return true;
  }

  initMaxFilesLimit(user, isAdmin) {
    const cantMaximaArchivosEl = this.querySelector('#cantMaximaArchivos');
    if (!cantMaximaArchivosEl) return;
    
    const maxFiles = user?.max_files || 5;
    cantMaximaArchivosEl.value = maxFiles;
    if (isAdmin) {
      cantMaximaArchivosEl.removeAttribute('readonly');
      cantMaximaArchivosEl.style.setProperty('border-bottom', '1px dashed #6c757d', 'important');
      cantMaximaArchivosEl.style.pointerEvents = 'auto';

      cantMaximaArchivosEl.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 5;
        if (val < 1) {
          ToastService.warning('El límite debe ser al menos 1.');
          e.target.value = 1;
          return;
        }
        user.max_files = val;
        localStorage.setItem('user', JSON.stringify(user));
        ToastService.success(`Límite de subida modificado a: ${val}`);
      });
    } else {
      cantMaximaArchivosEl.setAttribute('readonly', 'true');
      cantMaximaArchivosEl.style.setProperty('border-bottom', 'none', 'important');
      cantMaximaArchivosEl.style.pointerEvents = 'none';
      cantMaximaArchivosEl.classList.remove('text-primary');
      cantMaximaArchivosEl.classList.add('text-dark');
    }
  }

  async cargarCatalogosIniciales() {
    try {
      const catRes = await CatalogoService.getCategoriasIncidencia();
      this.categoryManager.setCategorias(Array.isArray(catRes) ? catRes : catRes?.data || []);

      const paisesRes = await CatalogoService.getPaises();
      this.locationManager.setPaises(Array.isArray(paisesRes) ? paisesRes : paisesRes?.data || []);

      const instsRes = await CatalogoService.getInstituciones();
      const insts = Array.isArray(instsRes) ? instsRes : instsRes?.data || [];
      this.institucionSelect.innerHTML =
        '<option value="">-- Ninguna --</option>' +
        insts.map((i) => `<option value="${i.id}">${i.nombre} (${i.siglas})</option>`).join('');
      if (this.institucionesApoyoSelect) {
        this.institucionesApoyoSelect.innerHTML =
          insts.map((i) => `<option value="${i.id}">${i.nombre} (${i.siglas})</option>`).join('');
      }
      this.supportInstitutionsManager.renderInstitucionesCheckboxes(insts);

      const prioridadesRes = await CatalogoService.getPrioridades();
      this.categoryManager.setPrioridades(Array.isArray(prioridadesRes) ? prioridadesRes : prioridadesRes?.data || []);

      const estadosRes = await CatalogoService.getEstados();
      const estados = Array.isArray(estadosRes) ? estadosRes : estadosRes?.data || [];
      this.estadoSelect.innerHTML = estados
        .map((e) => `<option value="${e.id}">${e.nombre}</option>`)
        .join('');
      this.estadoSelect.value = 1;
    } catch (e) {
      console.error('Error loading initial catalog dropdowns:', e);
    }
  }

  limpiarErrores() {
    const errorAlert = this.querySelector('#formErrorAlert');
    if (errorAlert) errorAlert.classList.add('d-none');
  }

  async guardarIncidencia(e) {
    e.preventDefault();

    if (!this._validateForm()) return;

    const coords = this.mapController.getCoords();
    if (!coords) {
      ToastService.error('Debe marcar la ubicación en el mapa.');
      return;
    }

    const locData = this.locationManager.getDatos();
    let direccionId = locData.selectedDireccionId;

    if (!direccionId) {
      direccionId = await this._resolveDireccion(locData, coords);
      if (!direccionId) return; // Error handled inside
    } else {
      this._setLoadingState();
    }

    await this._submitIncidencia(direccionId);
  }

  _validateForm() {
    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      ToastService.error('Por favor complete los campos obligatorios del formulario.');
      return false;
    }
    return true;
  }

  _setLoadingState() {
    this.limpiarErrores();
    this.btnSubmit.disabled = true;
    this.querySelector('#loadingSpinner').classList.remove('d-none');
  }

  _clearLoadingState() {
    this.btnSubmit.disabled = false;
    this.querySelector('#loadingSpinner').classList.add('d-none');
  }

  async _resolveDireccion(locData, coords) {
    if (!locData.finalTerritorioId) {
      ToastService.error(
        'Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).'
      );
      return null;
    }

    this._setLoadingState();

    try {
      const dirPayload = {
        territorio_id: parseInt(locData.finalTerritorioId),
        detalle: locData.detalle,
        referencia: '',
        codigo_postal: locData.codigoPostal || null,
        latitud: coords.lat,
        longitud: coords.lng,
        precision_gps: this.dirPrecisionGpsInput?.value ? parseFloat(this.dirPrecisionGpsInput.value) : null,
        activo: true,
      };

      const id = this.incidenciaIdInput.value;
      const incData = id ? await IncidenciaService.getById(id) : null;
      let resolvedId;

      if (incData && incData.direccion_id) {
        resolvedId = incData.direccion_id;
        await UbicacionesService.updateDireccion(resolvedId, dirPayload);
      } else {
        const dirRes = await UbicacionesService.createDireccion(dirPayload);
        resolvedId = (dirRes.data || dirRes).id;
      }

      CatalogoService.clearDireccionesCache();
      return resolvedId;
    } catch (err) {
      console.error(err);
      ToastService.error('Error al guardar la dirección.');
      this._clearLoadingState();
      return null;
    }
  }

  async _submitIncidencia(direccionId) {
    try {
      const id = this.incidenciaIdInput.value;
      const catData = this.categoryManager.getDatos();
      const incPayload = {
        incidencia_descripcion: this.descripcionInput.value,
        direccion_id: direccionId,
        tipo_incidencia_id: catData.tipo_incidencia_id,
        sub_tipo_incidencia_id: catData.sub_tipo_incidencia_id,
        cantidad_afectados_incidencia: catData.cantidad_afectados_incidencia,
        institucion_id: this.institucionSelect.value ? parseInt(this.institucionSelect.value) : null,
        instituciones_apoyo: this.supportInstitutionsManager.getSelectedInstitutionsIds(),
        estado_id: parseInt(this.estadoSelect.value) || 1,
        version: parseInt(this.versionInput.value) || 1,
        recursos: this.mediaUploader.getNewFilesBase64(),
      };

      let redirectId = id;
      if (id) {
        await IncidenciaService.update(id, incPayload);
        ToastService.success('Incidencia actualizada con éxito.');
      } else {
        const result = await IncidenciaService.create(incPayload);
        redirectId = result?.data?.id || result?.id || null;
        ToastService.success('Incidencia registrada con éxito.');
      }

      setTimeout(() => {
        if (redirectId) {
          window.location.hash = `#/tramites/estado-individual?id=${redirectId}`;
        } else {
          window.location.hash = '#/incidencias';
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      ToastService.error(err.message || 'Error al procesar la incidencia.');
      this._clearLoadingState();
    }
  }
}

customElements.define('app-incidencia-form', IncidenciaFormComponent);
