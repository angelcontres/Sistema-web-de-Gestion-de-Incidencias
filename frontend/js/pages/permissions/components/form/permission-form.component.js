import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';

export class PermissionFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/permissions/components/form/permission-form.component.html');
  }

  async onInit() {
    this.modalEl = this.querySelector('#permisoModal');
    
    // Mover el modal al body para evitar problemas de z-index con Bootstrap
    if (this.modalEl) {
      document.body.appendChild(this.modalEl);
    } else {
      console.error('No se encontró el modal #permisoModal');
      return;
    }

    this.form = this.modalEl.querySelector('#permisoForm');
    this.permisoIdInput = this.modalEl.querySelector('#permisoId');
    this.nombreInput = this.modalEl.querySelector('#nombre');
    this.accionInput = this.modalEl.querySelector('#accion');
    this.opcionMenuSelect = this.modalEl.querySelector('#opcion_menu_id');
    
    this.formTitle = this.modalEl.querySelector('#permisoModalLabel');
    this.btnText = this.modalEl.querySelector('#btnText');
    this.btnSubmit = this.modalEl.querySelector('#btnSubmit');
    this.errorAlert = this.modalEl.querySelector('#modalErrorAlert');
    this.errorMessage = this.modalEl.querySelector('#modalErrorMessage');
    this.loadingSpinner = this.modalEl.querySelector('#loadingSpinner');

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.guardarPermiso(e));
    }
  }

  disconnectedCallback() {
    // Limpiar el modal del body cuando se destruye el componente para evitar fugas de memoria y duplicados
    if (this.modalEl && this.modalEl.parentNode === document.body) {
      this.modalEl.remove();
    }
  }

  async llenarSelectOpcionesMenu(valorSeleccionado = null) {
    if (!this.opcionMenuSelect) return;

    this.opcionMenuSelect.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';

    try {
      const response = await apiRequest('/v1/opciones-menu');
      const opciones = Array.isArray(response) ? response : (response.data || []);

      opciones.forEach((opcion) => {
        const option = document.createElement('option');
        option.value = opcion.id;
        option.textContent = opcion.nombre;
        this.opcionMenuSelect.appendChild(option);
      });

      if (valorSeleccionado) {
        this.opcionMenuSelect.value = valorSeleccionado;
      }
    } catch (error) {
      console.error('Error cargando opciones de menú:', error);
      this.mostrarError('Error al cargar opciones de menú.');
    }
  }

  async abrirModalCrear() {
    this.limpiarError();
    if (this.form) this.form.classList.remove('was-validated');

    this.permisoIdInput.value = '';
    this.nombreInput.value = '';
    this.accionInput.value = '';
    this.opcionMenuSelect.value = '';

    if (this.formTitle) this.formTitle.textContent = 'Nuevo Permiso';
    if (this.btnText) this.btnText.textContent = 'Guardar Permiso';

    await this.llenarSelectOpcionesMenu();

    if (this.modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(this.modalEl);
      modal.show();
    }
  }

  async abrirModalEditar(permiso) {
    this.limpiarError();
    if (this.form) this.form.classList.remove('was-validated');

    this.permisoIdInput.value = permiso.id;
    this.nombreInput.value = permiso.nombre;
    this.accionInput.value = permiso.accion || '';
    this.opcionMenuSelect.value = permiso.opcion_menu_id || '';

    if (this.formTitle) this.formTitle.textContent = 'Editar Permiso';
    if (this.btnText) this.btnText.textContent = 'Actualizar Permiso';

    await this.llenarSelectOpcionesMenu(permiso.opcion_menu_id);

    if (this.modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(this.modalEl);
      modal.show();
    }
  }

  async guardarPermiso(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return;
    }

    this.limpiarError();
    this.setSubmitting(true);

    const permisoId = this.permisoIdInput.value;
    const payload = {
      nombre: this.nombreInput.value.trim(),
      accion: this.accionInput.value,
      opcion_menu_id: parseInt(this.opcionMenuSelect.value),
    };

    try {
      const endpoint = permisoId ? `/v1/permisos/${permisoId}` : '/v1/permisos';
      const method = permisoId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (this.modalEl) {
        const modal = bootstrap.Modal.getInstance(this.modalEl);
        if (modal) modal.hide();
      }

      // Despachar evento para notificar al index que se guardó exitosamente
      this.dispatchEvent(new CustomEvent('permiso-guardado', { 
        detail: { 
          mensaje: permisoId ? 'Permiso actualizado correctamente.' : 'Permiso creado correctamente.' 
        },
        bubbles: true 
      }));

    } catch (error) {
      console.error('Error al guardar permiso:', error);
      this.mostrarError(error.message || 'Error al procesar el formulario.');
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(isSubmitting) {
    if (!this.btnSubmit) return;
    
    if (isSubmitting) {
      this.btnSubmit.disabled = true;
      const originalText = this.btnText ? this.btnText.textContent : 'Guardando...';
      this.btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...`;
      this.btnSubmit.dataset.originalText = originalText;
    } else {
      this.btnSubmit.disabled = false;
      this.btnSubmit.innerHTML = `<span id="btnText">${this.btnSubmit.dataset.originalText}</span>`;
      this.btnText = this.modalEl.querySelector('#btnText');
    }
  }

  mostrarError(mensaje) {
    if (this.errorAlert && this.errorMessage) {
      this.errorMessage.textContent = mensaje;
      this.errorAlert.classList.remove('d-none');
    }
  }

  limpiarError() {
    if (this.errorAlert) {
      this.errorAlert.classList.add('d-none');
    }
  }
}

customElements.define('app-permission-form', PermissionFormComponent);
