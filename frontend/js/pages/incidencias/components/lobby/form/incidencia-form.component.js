import { BaseComponent } from '../../../../../core/base-component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { UbicacionesService } from '../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../shared/services/catalogo.service.js';
import { ModalService } from '../../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { MAP_CONFIG } from '../../../../../shared/constants.js';

import { IncidentMapPickerHelper } from './helpers/incident-map-picker.helper.js';
import { IncidentMediaUploaderHelper } from './helpers/incident-media-uploader.helper.js';
import { IncidentTerritoryCascadeHelper } from './helpers/incident-territory-cascade.helper.js';
import { IncidentClassificationHelper } from './helpers/incident-classification.helper.js';

export class IncidenciaFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/lobby/form/incidencia-form.component.html');
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

    // Apoyo Form Elements
    this.btnEditApoyoForm = this.querySelector('#btn-edit-apoyo-form');
    this.btnSaveApoyoForm = this.querySelector('#btn-save-apoyo-form');
    this.containerModalApoyoForm = this.querySelector('#container-modal-apoyo-form');
    this.listInstitucionesApoyoForm = this.querySelector('#list-instituciones-apoyo-form');

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

    // Link Location Manager and Map Controller
    this.locationManager.setMapController(this.mapController);
    this.mapController.initEvents((lat, lng) => {
      this.locationManager.autofillDesdeCoordenadas(lat, lng);
    });
    this.mapController.initMap();

    // 3. Init local events
    this.form.addEventListener('submit', (e) => this.guardarIncidencia(e));
    this.initApoyoEvents();
    this.initMaxFilesLimit(user, isAdmin);

    // 4. Load initial dropdown data
    await this.cargarCatalogosIniciales();
    this.actualizarBadgesApoyoForm();

    // 5. Load edit or create mode
    if (incidenciaId) {
      await this.cargarDatosEdicion(incidenciaId);
    } else {
      this.prepararCreacion(user);
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

  initApoyoEvents() {
    if (this.btnEditApoyoForm) {
      this.btnEditApoyoForm.addEventListener('click', () => {
        if (!this.containerModalApoyoForm) return;
        const modalEl = this.querySelector('#modalApoyoForm');
        if (modalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      });
    }

    if (this.btnSaveApoyoForm) {
      this.btnSaveApoyoForm.addEventListener('click', () => {
        if (!this.containerModalApoyoForm || !this.institucionesApoyoSelect) return;
        const selectedIds = Array.from(this.containerModalApoyoForm.querySelectorAll('.chk-apoyo:checked')).map(chk => chk.value);
        Array.from(this.institucionesApoyoSelect.options).forEach(opt => {
          opt.selected = selectedIds.includes(opt.value);
        });
        
        this.actualizarBadgesApoyoForm();
        
        const modalEl = this.querySelector('#modalApoyoForm');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
      });
    }
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

  actualizarBadgesApoyoForm() {
    if (!this.listInstitucionesApoyoForm || !this.institucionesApoyoSelect) return;
    const selectedOptions = Array.from(this.institucionesApoyoSelect.selectedOptions);
    if (selectedOptions.length > 0) {
      this.listInstitucionesApoyoForm.innerHTML = selectedOptions.map(opt => 
        `<span class="badge bg-secondary-soft text-secondary border border-secondary-subtle fw-medium">${opt.text.split('(')[0].trim()}</span>`
      ).join('');
    } else {
      this.listInstitucionesApoyoForm.innerHTML = '<span class="text-muted small fst-italic">Ninguna asignada</span>';
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
      if (this.containerModalApoyoForm) {
        this.containerModalApoyoForm.innerHTML =
          insts.map((i) => `
            <label class="list-group-item d-flex gap-3 align-items-center cursor-pointer p-3" style="cursor: pointer;" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
              <input class="form-check-input flex-shrink-0 chk-apoyo" type="checkbox" value="${i.id}" style="font-size: 1.3em;">
              <span class="pt-1 form-checked-content">
                <strong>${i.nombre}</strong>
                <span class="d-block text-muted small">${i.siglas}</span>
              </span>
            </label>
          `).join('');
      }

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

  prepararCreacion(user) {
    document.title = 'Registrar Incidencia';
    this.formTitle.textContent = 'Registrar Incidencia';
    this.btnText.textContent = 'Guardar Incidencia';

    if (user && user.pais_id) {
      if (this.locationManager.dirPaisSelect) {
        this.locationManager.dirPaisSelect.value = user.pais_id;
        this.locationManager.dirPaisSelect.disabled = true;
      }
      this.locationManager.actualizarEtiquetasNiveles(user.pais_id);
      this.locationManager.cargarDropdownNivel1(user.pais_id);

      const config = MAP_CONFIG.COUNTRY_CENTERS[user.codigo_iso_pais || 'EC'];
      if (config) {
        this.mapController.centerMap(config);
      }
    }
  }

  async cargarDatosEdicion(id) {
    document.title = 'Editar Incidencia';
    this.formTitle.textContent = 'Editar Incidencia';
    this.btnText.textContent = 'Actualizar Incidencia';

    try {
      const inc = await IncidenciaService.getById(id);
      if (!inc) return;

      this.incidenciaIdInput.value = inc.id;
      this.versionInput.value = inc.version || 1;
      
      this.locationManager.selectedDireccionId = inc.direccion_id;
      this.categoryManager.tipoSelect.value = inc.tipo_incidencia_id || '';
      
      this.categoryManager.onCategoryChange();
      this.categoryManager.subTipoSelect.value = inc.sub_tipo_incidencia_id || '';
      this.categoryManager.cantidadAfectadosInput.value = inc.cantidad_afectados_incidencia || 0;
      this.categoryManager.calcularPrioridadDinamica();

      this.descripcionInput.value = inc.incidencia_descripcion || '';
      this.institucionSelect.value = inc.institucion_id || '';
      
      if (this.institucionesApoyoSelect && inc.instituciones_apoyo) {
        const supportIds = inc.instituciones_apoyo.map((i) => i.id.toString());
        Array.from(this.institucionesApoyoSelect.options).forEach((opt) => {
          opt.selected = supportIds.includes(opt.value);
        });
        if (this.containerModalApoyoForm) {
          Array.from(this.containerModalApoyoForm.querySelectorAll('.chk-apoyo')).forEach((chk) => {
            chk.checked = supportIds.includes(chk.value);
          });
        }
        this.actualizarBadgesApoyoForm();
      }
      this.estadoSelect.value = inc.estado_id || 1;

      // Location
      if (inc.direccion) {
        const dir = inc.direccion;
        if (this.locationManager.dirDetalleInput) this.locationManager.dirDetalleInput.value = dir.detalle || '';
        this.locationManager.currentPostalCode = dir.codigo_postal || '';

        if (dir.latitud && dir.longitud) {
          this.mapController.setCoordsAndCenter(dir.latitud, dir.longitud, 15);
        }

        const terr = dir.territorio;
        if (terr) {
          if (this.locationManager.dirPaisSelect) this.locationManager.dirPaisSelect.value = terr.pais_id;
          this.locationManager.actualizarEtiquetasNiveles(terr.pais_id);

          let n1 = null, n2 = null, n3 = null;
          if (terr.parent && terr.parent.parent) {
            n1 = terr.parent.parent.id; n2 = terr.parent.id; n3 = terr.id;
          } else if (terr.parent) {
            n1 = terr.parent.id; n2 = terr.id;
          } else {
            n1 = terr.id;
          }

          if (n1) {
            await this.locationManager.cargarDropdownNivel1(terr.pais_id, n1);
            if (n2) {
              await this.locationManager.cargarDropdownNivel2(terr.pais_id, n1, n2);
              if (n3) {
                await this.locationManager.cargarDropdownNivel3(terr.pais_id, n2, n3);
              }
            }
          }
        }
      }

      this.locationManager.actualizarIndicadorMinimalista();

      if (inc.recursos && inc.recursos.length > 0) {
        const files = inc.recursos.map((r) => ({
          id: r.id,
          name: r.url.substring(r.url.lastIndexOf('/') + 1),
          base64: r.url,
          existing: true,
        }));
        this.mediaUploader.setFiles(files);
      }

      const user = AuthService.getCurrentUser();
      const isInstitucion = user && user.roles && user.roles.some((r) => r.nombre === 'Institucion');
      if (isInstitucion) {
        this.disableFormFields();
        if (inc.estado_id === 3) { // En Proceso
          if (this.btnConfirmarResolucion) {
            this.btnConfirmarResolucion.classList.remove('d-none');
            this.btnConfirmarResolucion.disabled = false;
            this.btnConfirmarResolucion.addEventListener('click', () =>
              this.confirmarResolucion(inc.id, inc.version)
            );
          }
          if (this.btnSubmit) {
            this.btnSubmit.classList.add('d-none');
          }
        }
      }
    } catch (e) {
      console.error(e);
      ToastService.error('Error al cargar la incidencia para edición.');
    }
  }

  disableFormFields() {
    const inputs = this.querySelectorAll(
      'input, select, textarea, button:not(#btnConfirmarResolucion):not([href])'
    );
    inputs.forEach((el) => {
      el.disabled = true;
    });
    this.querySelector('#direccionSearch')?.classList.add('d-none');
    this.querySelector('#btnBuscarDireccion')?.classList.add('d-none');
    this.querySelector('#dropzoneContainer')?.classList.add('d-none');

    const dragText =
      this.querySelector('.text-muted.small.mt-1\\.5') ||
      this.querySelector('span.text-muted.small.mt-1\\.5');
    if (dragText) dragText.classList.add('d-none');
  }

  async confirmarResolucion(id, version) {
    const isConfirmed = await ModalService.confirm(
      'Confirmar Resolución',
      '¿Está seguro de que desea confirmar la resolución de esta incidencia?',
      'Confirmar',
      'Cancelar',
      'btn-success'
    );
    if (!isConfirmed) return;

    if (this.btnConfirmarResolucion) this.btnConfirmarResolucion.disabled = true;
    const spinner = this.querySelector('#loadingSpinner');
    if (spinner) spinner.classList.remove('d-none');

    try {
      const payload = {
        estado_id: 4,
        version: version,
        comentario_estado: 'Resolución confirmada por el solicitante/operador.',
      };

      await IncidenciaService.update(id, payload);
      ToastService.success('La resolución ha sido confirmada correctamente.');
      window.location.hash = '#/incidencias';
    } catch (err) {
      console.error('Error al confirmar resolución:', err);
      ToastService.error(err.message || 'Error al confirmar la resolución.');
      if (this.btnConfirmarResolucion) this.btnConfirmarResolucion.disabled = false;
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  }

  limpiarErrores() {
    const errorAlert = this.querySelector('#formErrorAlert');
    if (errorAlert) errorAlert.classList.add('d-none');
  }

  async guardarIncidencia(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      ToastService.error('Por favor complete los campos obligatorios del formulario.');
      return;
    }

    const id = this.incidenciaIdInput.value;
    const coords = this.mapController.getCoords();

    if (!coords) {
      ToastService.error('Debe marcar la ubicación en el mapa.');
      return;
    }

    const locData = this.locationManager.getDatos();
    let direccionId = locData.selectedDireccionId;

    if (!direccionId) {
      if (!locData.finalTerritorioId) {
        ToastService.error(
          'Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).'
        );
        return;
      }

      this.limpiarErrores();
      this.btnSubmit.disabled = true;
      this.querySelector('#loadingSpinner').classList.remove('d-none');

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

        const incData = id ? await IncidenciaService.getById(id) : null;
        if (incData && incData.direccion_id) {
          direccionId = incData.direccion_id;
          await UbicacionesService.updateDireccion(direccionId, dirPayload);
        } else {
          const dirRes = await UbicacionesService.createDireccion(dirPayload);
          direccionId = (dirRes.data || dirRes).id;
        }

        CatalogoService.clearDireccionesCache();
      } catch (err) {
        console.error(err);
        ToastService.error('Error al guardar la dirección.');
        this.btnSubmit.disabled = false;
        this.querySelector('#loadingSpinner').classList.add('d-none');
        return;
      }
    } else {
      this.limpiarErrores();
      this.btnSubmit.disabled = true;
      this.querySelector('#loadingSpinner').classList.remove('d-none');
    }

    try {
      const catData = this.categoryManager.getDatos();
      const incPayload = {
        incidencia_descripcion: this.descripcionInput.value,
        direccion_id: direccionId,
        tipo_incidencia_id: catData.tipo_incidencia_id,
        sub_tipo_incidencia_id: catData.sub_tipo_incidencia_id,
        cantidad_afectados_incidencia: catData.cantidad_afectados_incidencia,
        institucion_id: this.institucionSelect.value ? parseInt(this.institucionSelect.value) : null,
        instituciones_apoyo: this.institucionesApoyoSelect
          ? Array.from(this.institucionesApoyoSelect.selectedOptions).map(opt => parseInt(opt.value))
          : [],
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
      this.btnSubmit.disabled = false;
      this.querySelector('#loadingSpinner').classList.add('d-none');
    }
  }
}

customElements.define('app-incidencia-form', IncidenciaFormComponent);
