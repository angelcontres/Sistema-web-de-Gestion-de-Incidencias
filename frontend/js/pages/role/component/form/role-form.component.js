import { BaseComponent } from '../../../../core/base-component.js';
import { RoleService } from '../../services/role.service.js';

export class RoleFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/role/component/form/role-form.component.html');
  }

  onInit() {
    this.modalEl = this.querySelector('#roleModal');

    // Mover el modal al body para evitar problemas de z-index
    if (this.modalEl) {
      document.body.appendChild(this.modalEl);
    } else {
      console.error('No se encontró el modal #roleModal');
      return;
    }

    this.form = this.modalEl.querySelector('#roleForm');
    this.roleIdInput = this.modalEl.querySelector('#roleId');
    this.nombreInput = this.modalEl.querySelector('#nombre');
    this.descripcionInput = this.modalEl.querySelector('#descripcion');
    this.padreSelect = this.modalEl.querySelector('#padre_id');
    this.formTitle = this.modalEl.querySelector('#roleModalLabel');
    this.btnText = this.modalEl.querySelector('#btnText');
    this.btnSubmit = this.modalEl.querySelector('#btnSubmit');
    this.errorAlert = this.modalEl.querySelector('#modalErrorAlert');
    this.errorMessage = this.modalEl.querySelector('#modalErrorMessage');

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.guardarRol(e));
    }
  }

  disconnectedCallback() {
    if (this.modalEl?.parentNode === document.body) {
      this.modalEl.remove();
    }
  }

  llenarSelectPadre(roles, excluirId = null, valorSeleccionado = null) {
    if (!this.padreSelect) return;

    this.padreSelect.innerHTML = '<option value="" selected>Ninguno (Rol Principal)</option>';

    roles.forEach((rol) => {
      if (excluirId && rol.id == excluirId) return;
      const option = document.createElement('option');
      option.value = rol.id;
      option.textContent = rol.nombre;
      this.padreSelect.appendChild(option);
    });

    if (valorSeleccionado) {
      this.padreSelect.value = valorSeleccionado;
    }
  }

  async abrirModalCrear() {
    this.limpiarErroresModal();
    if (this.form) this.form.classList.remove('was-validated');

    this.roleIdInput.value = '';
    this.nombreInput.value = '';
    this.descripcionInput.value = '';
    this.padreSelect.value = '';

    if (this.formTitle) this.formTitle.textContent = 'Nuevo Rol';
    if (this.btnText) this.btnText.textContent = 'Guardar Rol';

    try {
      const response = await RoleService.getAll();
      this.llenarSelectPadre(response || []);
    } catch (error) {
      console.error('Error cargando roles para select:', error);
    }

    if (this.modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(this.modalEl);
      modal.show();
    }
  }

  async abrirModalEditar(rol, todosLosRoles) {
    this.limpiarErroresModal();
    if (this.form) this.form.classList.remove('was-validated');

    this.roleIdInput.value = rol.id;
    this.nombreInput.value = rol.nombre;
    this.descripcionInput.value = rol.descripcion || '';

    if (this.formTitle) this.formTitle.textContent = 'Editar Rol';
    if (this.btnText) this.btnText.textContent = 'Actualizar Rol';

    this.llenarSelectPadre(todosLosRoles, rol.id, rol.padre_id);

    if (this.modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(this.modalEl);
      modal.show();
    }
  }

  async guardarRol(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return;
    }

    this.limpiarErroresModal();
    this.setSubmitting(true);

    const roleId = this.roleIdInput.value;
    const nombre = this.nombreInput.value.trim();
    const descripcion = this.descripcionInput.value.trim();
    const padreSelectVal = this.padreSelect.value;
    const padre_id = padreSelectVal ? Number.parseInt(padreSelectVal, 10) : null;

    const payload = { nombre, descripcion, padre_id };

    try {
      if (roleId) {
        await RoleService.update(roleId, payload);
      } else {
        await RoleService.create(payload);
      }

      if (this.modalEl) {
        const modal = bootstrap.Modal.getInstance(this.modalEl);
        if (modal) modal.hide();
      }

      this.dispatchEvent(
        new CustomEvent('rol-guardado', {
          detail: { mensaje: roleId ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.' },
          bubbles: true,
        })
      );
    } catch (error) {
      console.error('Error al guardar rol:', error);
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

  limpiarErroresModal() {
    if (this.errorAlert) this.errorAlert.classList.add('d-none');
  }
}

customElements.define('app-role-form', RoleFormComponent);
