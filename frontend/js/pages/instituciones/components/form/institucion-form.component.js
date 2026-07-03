import { BaseComponent } from '../../../../core/base-component.js';
import { InstitucionService } from '../../services/institucion.service.js';
import { UIHelper } from '../../../../shared/utils/ui-helper.js';

export class InstitucionFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/instituciones/components/form/institucion-form.component.html');
  }

  async onInit() {
    this.modalElement = this.querySelector('#institucionModal');
    
    // Mover el modal al body para evitar problemas de z-index (sombra por encima)
    if (this.modalElement) {
      document.body.appendChild(this.modalElement);
    }
    
    this.bsModal = new bootstrap.Modal(this.modalElement);

    this.form = this.modalElement.querySelector('#institucionForm');
    this.nombreInput = this.modalElement.querySelector('#institucionNombre');
    this.siglasInput = this.modalElement.querySelector('#siglas');
    this.activoInput = this.modalElement.querySelector('#institucionActivo');
    this.formTitle = this.modalElement.querySelector('#institucionModalLabel');
    this.btnGuardarInstitucion = this.modalElement.querySelector('#btnGuardarInstitucion');
    this.formAlertContainer = this.modalElement.querySelector('#institucionModalErrorAlert');
    this.errorMessage = this.modalElement.querySelector('#institucionModalErrorMessage');

    this.institucionId = null;

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.guardarInstitucion(e));
    }

    // Reset form when modal is hidden
    this.modalElement.addEventListener('hidden.bs.modal', () => {
      this.form.reset();
      this.form.classList.remove('was-validated');
      this.institucionId = null;
      if (this.formAlertContainer) this.formAlertContainer.classList.add('d-none');
      if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = false;
    });
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

    this.bsModal.show();
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
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return;
    }

    if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = true;

    const payload = {
      nombre: this.nombreInput.value.trim(),
      siglas: this.siglasInput.value.trim(),
      activo: this.activoInput ? this.activoInput.checked : true,
    };

    try {
      if (this.institucionId) {
        await InstitucionService.update(this.institucionId, payload);
      } else {
        await InstitucionService.create(payload);
      }

      this.bsModal.hide();

      // Dispatch event to parent to reload table
      this.dispatchEvent(
        new CustomEvent('institucion-guardada', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error('Error al guardar institución:', error);

      let errorMsg = 'Error al procesar el formulario.';
      if (error.response && error.response.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
          const messages = Object.values(errors).flat().join('<br>');
          errorMsg = messages;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      if (this.formAlertContainer && this.errorMessage) {
        this.errorMessage.textContent = errorMsg;
        this.formAlertContainer.classList.remove('d-none');
      }
      if (this.btnGuardarInstitucion) this.btnGuardarInstitucion.disabled = false;
    }
  }
}

customElements.define('app-institucion-form', InstitucionFormComponent);
