import { IncidenciaService } from '../../../../services/incidencia.service.js';
import { ToastService } from '../../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../../core/auth.service.js';
import { ModalService } from '../../../../../../shared/services/modal.service.js';
import { MAP_CONFIG } from '../../../../../../shared/constants.js';

export class IncidentFormStateHelper {
  constructor(component) {
    this.component = component;
  }

  prepararCreacion(user) {
    if (this.component.formTitle) this.component.formTitle.textContent = 'Registrar Incidencia';
    else {
      const titleEl = this.component.querySelector('#formTitle');
      if (titleEl) titleEl.textContent = 'Registrar Incidencia';
    }
    
    if (this.component.btnText) this.component.btnText.textContent = 'Guardar Incidencia';

    if (user && user.pais_id) {
      if (this.component.locationManager.dirPaisSelect) {
        this.component.locationManager.dirPaisSelect.value = user.pais_id;
        this.component.locationManager.dirPaisSelect.disabled = true;
      }
      this.component.locationManager.actualizarEtiquetasNiveles(user.pais_id);
      this.component.locationManager.cargarDropdownNivel1(user.pais_id);

      const config = MAP_CONFIG.COUNTRY_CENTERS[user.codigo_iso_pais || 'EC'];
      if (config) {
        this.component.mapController.centerMap(config);
      }
    }
  }

  async cargarDatosEdicion(id) {
    document.title = 'Editar Incidencia';
    if (this.component.formTitle) this.component.formTitle.textContent = 'Editar Incidencia';
    if (this.component.btnText) this.component.btnText.textContent = 'Actualizar Incidencia';

    try {
      const inc = await IncidenciaService.getById(id);
      if (!inc) return;

      this.component.incidenciaIdInput.value = inc.id;
      this.component.versionInput.value = inc.version || 1;
      
      this.component.locationManager.selectedDireccionId = inc.direccion_id;
      this.component.categoryManager.tipoSelect.value = inc.tipo_incidencia_id || '';
      
      this.component.categoryManager.onCategoryChange();
      this.component.categoryManager.subTipoSelect.value = inc.sub_tipo_incidencia_id || '';
      this.component.categoryManager.cantidadAfectadosInput.value = inc.cantidad_afectados_incidencia || 0;
      this.component.categoryManager.calcularPrioridadDinamica();

      this.component.descripcionInput.value = inc.incidencia_descripcion || '';
      this.component.institucionSelect.value = inc.institucion_id || '';
      
      if (this.component.supportInstitutionsManager && inc.instituciones_apoyo) {
        const supportIds = inc.instituciones_apoyo.map((i) => i.id.toString());
        this.component.supportInstitutionsManager.setSelectedInstitutions(supportIds);
      }
      this.component.estadoSelect.value = inc.estado_id || 1;

      // Location
      if (inc.direccion) {
        const dir = inc.direccion;
        if (this.component.locationManager.dirDetalleInput) {
          this.component.locationManager.dirDetalleInput.value = dir.detalle || '';
        }
        this.component.locationManager.currentPostalCode = dir.codigo_postal || '';

        if (dir.latitud && dir.longitud) {
          this.component.mapController.setCoordsAndCenter(dir.latitud, dir.longitud, 15);
        }

        const terr = dir.territorio;
        if (terr) {
          if (this.component.locationManager.dirPaisSelect) {
            this.component.locationManager.dirPaisSelect.value = terr.pais_id;
          }
          this.component.locationManager.actualizarEtiquetasNiveles(terr.pais_id);

          let n1 = null, n2 = null, n3 = null;
          if (terr.parent && terr.parent.parent) {
            n1 = terr.parent.parent.id; n2 = terr.parent.id; n3 = terr.id;
          } else if (terr.parent) {
            n1 = terr.parent.id; n2 = terr.id;
          } else {
            n1 = terr.id;
          }

          if (n1) {
            await this.component.locationManager.cargarDropdownNivel1(terr.pais_id, n1);
            if (n2) {
              await this.component.locationManager.cargarDropdownNivel2(terr.pais_id, n1, n2);
              if (n3) {
                await this.component.locationManager.cargarDropdownNivel3(terr.pais_id, n2, n3);
              }
            }
          }
        }
      }

      this.component.locationManager.actualizarIndicadorMinimalista();

      if (inc.recursos && inc.recursos.length > 0) {
        const files = inc.recursos.map((r) => ({
          id: r.id,
          name: r.url.substring(r.url.lastIndexOf('/') + 1),
          base64: r.url,
          existing: true,
        }));
        this.component.mediaUploader.setFiles(files);
      }

      const user = AuthService.getCurrentUser();
      const isInstitucion = user && user.roles && user.roles.some((r) => r.nombre === 'Institucion');
      if (isInstitucion) {
        this.disableFormFields();
        if (inc.estado_id === 3) { // En Proceso
          if (this.component.btnConfirmarResolucion) {
            this.component.btnConfirmarResolucion.classList.remove('d-none');
            this.component.btnConfirmarResolucion.disabled = false;
            this.component.btnConfirmarResolucion.addEventListener('click', () =>
              this.confirmarResolucion(inc.id, inc.version)
            );
          }
          if (this.component.btnSubmit) {
            this.component.btnSubmit.classList.add('d-none');
          }
        }
      }
    } catch (e) {
      console.error(e);
      ToastService.error('Error al cargar la incidencia para edición.');
    }
  }

  disableFormFields() {
    const inputs = this.component.querySelectorAll(
      'input, select, textarea, button:not(#btnConfirmarResolucion):not([href])'
    );
    inputs.forEach((el) => {
      el.disabled = true;
    });
    this.component.querySelector('#direccionSearch')?.classList.add('d-none');
    this.component.querySelector('#btnBuscarDireccion')?.classList.add('d-none');
    this.component.querySelector('#dropzoneContainer')?.classList.add('d-none');

    const dragText =
      this.component.querySelector('.text-muted.small.mt-1\\.5') ||
      this.component.querySelector('span.text-muted.small.mt-1\\.5');
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

    if (this.component.btnConfirmarResolucion) this.component.btnConfirmarResolucion.disabled = true;
    const spinner = this.component.querySelector('#loadingSpinner');
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
      if (this.component.btnConfirmarResolucion) this.component.btnConfirmarResolucion.disabled = false;
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  }
}
