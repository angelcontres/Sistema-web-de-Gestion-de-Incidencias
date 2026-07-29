import { BaseComponent } from '../../../../core/base-component.js';
import { InstitucionService } from '../../services/institucion.service.js';

export class InstitucionFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/instituciones/components/form/institucion-form.component.html');
  }

  async onInit() {
    this._setupModalDOM();
    this._cacheElements();
    this._setupEventListeners();
  }

  _setupModalDOM() {
    this.modalElement = this.querySelector('#institucionModal');
    if (!this.modalElement) return;

    // Mover el modal al body para evitar problemas de z-index (sombra por encima)
    // Limpiar cualquier modal previo u órfano en el body con el mismo ID para evitar conflictos y recargas
    document.body.querySelectorAll('#institucionModal').forEach((el) => {
      if (el !== this.modalElement) el.remove();
    });
    document.body.appendChild(this.modalElement);
  }

  _cacheElements() {
    if (!this.modalElement) return;
    this.form = this.modalElement.querySelector('#institucionForm');
    this.nombreInput = this.modalElement.querySelector('#institucionNombre');
    this.siglasInput = this.modalElement.querySelector('#siglas');
    this.activoInput = this.modalElement.querySelector('#institucionActivo');
    this.formTitle = this.modalElement.querySelector('#institucionModalLabel');
    this.btnGuardarInstitucion = this.modalElement.querySelector('#btnGuardarInstitucion');
    this.formAlertContainer = this.modalElement.querySelector('#institucionModalErrorAlert');
    this.errorMessage = this.modalElement.querySelector('#institucionModalErrorMessage');
    this.institucionId = null;
  }

  _setupEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        if (e?.preventDefault) e.preventDefault();
        this.guardarInstitucion(e);
      });
    }

    if (this.btnGuardarInstitucion) {
      this.btnGuardarInstitucion.addEventListener('click', (e) => {
        if (e?.preventDefault) e.preventDefault();
        this.guardarInstitucion(e);
      });
    }

    if (this.modalElement) {
      this.modalElement.addEventListener('hidden.bs.modal', () => {
        if (this.form) {
          this.form.reset();
          this.form.classList.remove('was-validated');
        }
        this.institucionId = null;
        if (this.formAlertContainer) this.formAlertContainer.classList.add('d-none');
        if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = false;
      });
    }
  }

  async openModal(id = null) {
    this.institucionId = id;

    if (this.formAlertContainer) this.formAlertContainer.classList.add('d-none');
    this.form.reset();
    this.form.classList.remove('was-validated');
    if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = false;

    if (this.institucionId) {
      if (this.formTitle) this.formTitle.textContent = 'Editar Institución';
      if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.textContent = 'Actualizar';
      await this.cargarDatosEdicion(this.institucionId);
    } else {
      if (this.formTitle) this.formTitle.textContent = 'Nueva Institución';
      if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.textContent = 'Guardar';
      if (this.activoInput) this.activoInput.checked = true;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(this.modalElement);
    modal.show();
  }

  async cargarDatosEdicion(id) {
    try {
      const institucion = await InstitucionService.getById(id);
      if (institucion) {
        if (this.nombreInput) this.nombreInput.value = institucion.nombre || '';
        if (this.siglasInput) this.siglasInput.value = institucion.siglas || '';
        if (this.activoInput) this.activoInput.checked = institucion.activo !== false;
      }
    } catch (error) {
      console.error('Error al cargar datos de la institución:', error);
      if (this.formAlertContainer && this.errorMessage) {
        this.errorMessage.textContent = 'No se pudieron cargar los datos de la institución.';
        this.formAlertContainer.classList.remove('d-none');
      }
      if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = true;
    }
  }

  async guardarInstitucion(e) {
    if (e?.preventDefault) e.preventDefault();

    if (!this.validarFormulario()) return;

    if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = true;

    try {
      const payload = this.construirPayloadInstitucion();
      await this.ejecutarGuardadoInstitucion(payload);

      if (this.modalElement) {
        const modal = bootstrap.Modal.getInstance(this.modalElement);

        if (modal) modal.hide();
      }

      this.dispatchEvent(
        new CustomEvent('institucion-guardada', { bubbles: true, composed: true })
      );
    } catch (error) {
      this.manejarErrorGuardado(error);
    }
  }

  validarFormulario() {
    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return false;
    }
    return true;
  }

  construirPayloadInstitucion() {
    return {
      nombre: this.nombreInput.value.trim(),
      siglas: this.siglasInput.value.trim(),
      activo: this.activoInput ? this.activoInput.checked : true,
    };
  }

  async ejecutarGuardadoInstitucion(payload) {
    if (this.institucionId) {
      await InstitucionService.update(this.institucionId, payload);
    } else {
      await InstitucionService.create(payload);
    }
  }

  extraerMensajeError(error) {
    if (error?.response?.status === 422 && error.response.data?.errors) {
      return Object.values(error.response.data.errors).flat().join('<br>');
    }
    return error?.message || 'Error al procesar el formulario.';
  }

  manejarErrorGuardado(error) {
    console.error('Error al guardar institución:', error);

    const errorMsg = this.extraerMensajeError(error);

    if (this.formAlertContainer && this.errorMessage) {
      this.errorMessage.textContent = errorMsg;
      this.formAlertContainer.classList.remove('d-none');
    }
    if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = false;
  }

  disconnectedCallback() {
    if (this.modalElement?.parentNode === document.body) {
      this.modalElement.remove();
    }
  }
}

customElements.define('app-institucion-form', InstitucionFormComponent);
