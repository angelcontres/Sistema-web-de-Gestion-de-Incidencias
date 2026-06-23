import { BaseComponent } from '../../../../core/base-component.js';
import { UserService } from '../../services/user.service.js';
import { RoleService } from '../../../role/services/role.service.js';

export class UserFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/user/component/form/user-form.component.html');
  }

  async onInit() {
    this.form = this.querySelector('#userForm');
    this.userIdInput = this.querySelector('#userId');
    this.usernameInput = this.querySelector('#username');
    this.nameInput = this.querySelector('#name');
    this.emailInput = this.querySelector('#email');
    this.passwordInput = this.querySelector('#password');
    this.activoInput = this.querySelector('#activo');
    this.rolesContainer = this.querySelector('#rolesCheckboxContainer');
    this.formTitle = this.querySelector('#userModalLabel');
    this.btnText = this.querySelector('#btnText');
    this.txtPasswordHelp = this.querySelector('#txtPasswordHelp');
    this.errorAlert = this.querySelector('#modalErrorAlert');
    this.errorMessage = this.querySelector('#modalErrorMessage');
    this.loadingSpinner = this.querySelector('#loadingSpinner');
    this.btnSubmit = this.querySelector('#btnSubmit');

    // Parse user ID from hash query parameters
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const userId = urlParams.get('id');

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.guardarUsuario(e));
    }

    // Initialize data
    const init = async () => {
      if (userId) {
        document.title = 'Editar Usuario';
        if (this.formTitle) this.formTitle.textContent = 'Editar Usuario';
        if (this.btnText) this.btnText.textContent = 'Actualizar Usuario';
        if (this.txtPasswordHelp) this.txtPasswordHelp.classList.remove('d-none');
        if (this.passwordInput) this.passwordInput.required = false;

        // Load user data
        await this.cargarDatosEdicion(userId);
      } else {
        document.title = 'Crear Nuevo Usuario';
        if (this.formTitle) this.formTitle.textContent = 'Crear Nuevo Usuario';
        if (this.btnText) this.btnText.textContent = 'Guardar Usuario';
        if (this.txtPasswordHelp) this.txtPasswordHelp.classList.add('d-none');
        if (this.passwordInput) this.passwordInput.required = true;

        // Load empty roles checkboxes
        await this.cargarRolesCheckboxes();
      }
    };

    init();
  }

  async cargarRolesCheckboxes(rolesSeleccionadosIds = []) {
    if (!this.rolesContainer) return;

    try {
      const roles = await RoleService.getAll();
      const listRoles = roles || [];

      this.rolesContainer.innerHTML = '';

      if (listRoles.length === 0) {
        this.rolesContainer.innerHTML =
          '<span class="text-muted small">No hay roles registrados en el sistema.</span>';
        return;
      }

      listRoles.forEach((role) => {
        const div = document.createElement('div');
        div.className = 'form-check mb-1';

        const input = document.createElement('input');
        input.className = 'form-check-input role-checkbox';
        input.type = 'checkbox';
        input.value = role.id;
        input.id = `role-chk-${role.id}`;

        if (rolesSeleccionadosIds.includes(role.id)) {
          input.checked = true;
        }

        const label = document.createElement('label');
        label.className = 'form-check-label text-dark small';
        label.htmlFor = `role-chk-${role.id}`;
        label.textContent = role.nombre;

        div.appendChild(input);
        div.appendChild(label);
        this.rolesContainer.appendChild(div);
      });
    } catch (error) {
      console.error('Error al cargar catálogo de roles:', error);
      this.rolesContainer.innerHTML = '<span class="text-danger small">Error al cargar roles.</span>';
    }
  }

  async cargarDatosEdicion(userId) {
    this.limpiarErrores();
    try {
      const user = await UserService.getById(userId);
      if (user) {
        if (this.userIdInput) this.userIdInput.value = user.id;
        if (this.usernameInput) this.usernameInput.value = user.username || '';
        if (this.nameInput) this.nameInput.value = user.name || '';
        if (this.emailInput) this.emailInput.value = user.email || '';
        if (this.activoInput) this.activoInput.checked = !!user.activo;

        const userRoleIds = (user.roles || []).map((r) => r.id);
        await this.cargarRolesCheckboxes(userRoleIds);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario para edición:', error);
      this.mostrarError('No se pudieron cargar los datos del usuario.');
      if (this.btnSubmit) this.btnSubmit.disabled = true;
    }
  }

  async guardarUsuario(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return;
    }

    // Show loading indicators
    if (this.btnSubmit) this.btnSubmit.disabled = true;
    if (this.loadingSpinner) this.loadingSpinner.classList.remove('d-none');
    this.limpiarErrores();

    const userId = this.userIdInput.value;
    const username = this.usernameInput.value.trim();
    const name = this.nameInput.value.trim();
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const activo = this.activoInput.checked;

    const checkboxes = this.querySelectorAll('.role-checkbox:checked');
    const roles = Array.from(checkboxes).map((chk) => parseInt(chk.value));

    const payload = {
      username,
      name,
      email,
      activo,
      roles,
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (userId) {
        await UserService.update(userId, payload);
      } else {
        await UserService.create(payload);
      }

      // Redirect back to users listing
      window.location.hash = '#/usuarios';

    } catch (error) {
      console.error('Error al guardar usuario:', error);
      this.mostrarError(error.message || 'Error al procesar el formulario.');
      
      // Reset loading indicators
      if (this.btnSubmit) this.btnSubmit.disabled = false;
      if (this.loadingSpinner) this.loadingSpinner.classList.add('d-none');
    }
  }

  mostrarError(message) {
    if (this.errorAlert && this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorAlert.classList.remove('d-none');
      this.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  limpiarErrores() {
    if (this.errorAlert) this.errorAlert.classList.add('d-none');
  }
}

customElements.define('app-user-form', UserFormComponent);
