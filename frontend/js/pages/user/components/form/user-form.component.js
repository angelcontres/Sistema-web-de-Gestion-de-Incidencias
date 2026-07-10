import { BaseComponent } from '../../../../core/base-component.js';
import { UserService } from '../../services/user.service.js';
import { RoleService } from '../../../role/services/role.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { InstitucionService } from '../../../instituciones/services/institucion.service.js';

export class UserFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/user/components/form/user-form.component.html');
  }

  async onInit() {
    this.form = this.querySelector('#userForm');
    this.userIdInput = this.querySelector('#userId');
    this.usernameInput = this.querySelector('#username');
    this.nameInput = this.querySelector('#name');
    this.emailInput = this.querySelector('#email');
    this.passwordInput = this.querySelector('#password');
    this.activoInput = this.querySelector('#activo');
    this.institucionContainer = this.querySelector('#institucionContainer');
    this.institucionSelect = this.querySelector('#institucion_id');
    this.rolesDisponiblesList = this.querySelector('#rolesDisponiblesList');
    this.rolesAsignadosList = this.querySelector('#rolesAsignadosList');
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

    // Block access if creating new user and lacks permission
    if (!userId && !AuthService.hasPermission('CREATE', 'usuarios')) {
      alert('No tienes permiso para crear usuarios.');
      window.location.hash = '#/usuarios';
      return;
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.guardarUsuario(e));
    }

    // Configure Drag and Drop events
    this.setupDragAndDrop(this.rolesDisponiblesList);
    this.setupDragAndDrop(this.rolesAsignadosList);

    // Initialize data
    const init = async () => {
      await this.cargarInstituciones();

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

        // Load empty roles Drag & Drop
        await this.cargarRolesCheckboxes();
      }
    };

    init();
  }

  setupDragAndDrop(listEl) {
    if (!listEl) return;

    listEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      listEl.classList.add('bg-opacity-75');
      listEl.style.borderColor = '#4f46e5';
    });

    listEl.addEventListener('dragleave', () => {
      listEl.classList.remove('bg-opacity-75');
      listEl.style.borderColor = '';
    });

    listEl.addEventListener('drop', (e) => {
      e.preventDefault();
      listEl.classList.remove('bg-opacity-75');
      listEl.style.borderColor = '';
      
      const roleId = e.dataTransfer.getData('text/plain');
      const element = this.querySelector(`[data-role-id="${roleId}"]`);
      if (element) {
        listEl.appendChild(element);
        this.updateEmptyStates();
        this.checkInstitucionRole();
      }
    });
  }

  updateEmptyStates() {
    if (!this.rolesDisponiblesList || !this.rolesAsignadosList) return;

    // Available List Empty State
    const hasDisponibles = this.rolesDisponiblesList.querySelectorAll('[data-role-id]').length > 0;
    const dispEmptyIndicator = this.rolesDisponiblesList.querySelector('.empty-indicator');
    if (!hasDisponibles) {
      if (!dispEmptyIndicator) {
        this.rolesDisponiblesList.innerHTML = '<span class="empty-indicator text-muted small text-center my-3 w-100">Sin roles disponibles</span>';
      }
    } else if (dispEmptyIndicator) {
      dispEmptyIndicator.remove();
    }

    // Assigned List Empty State
    const hasAsignados = this.rolesAsignadosList.querySelectorAll('[data-role-id]').length > 0;
    const asigEmptyIndicator = this.rolesAsignadosList.querySelector('.empty-indicator');
    if (!hasAsignados) {
      if (!asigEmptyIndicator) {
        this.rolesAsignadosList.innerHTML = '<span class="empty-indicator text-muted small text-center my-3 w-100">Arrastre aquí...</span>';
      }
    } else if (asigEmptyIndicator) {
      asigEmptyIndicator.remove();
    }
  }

  async cargarRolesCheckboxes(rolesSeleccionadosIds = []) {
    if (!this.rolesDisponiblesList || !this.rolesAsignadosList) return;

    try {
      const roles = await RoleService.getAll();
      const listRoles = roles || [];

      this.rolesDisponiblesList.innerHTML = '';
      this.rolesAsignadosList.innerHTML = '';

      if (listRoles.length === 0) {
        this.rolesDisponiblesList.innerHTML =
          '<span class="text-muted small text-center my-3 w-100">No hay roles registrados.</span>';
        this.updateEmptyStates();
        return;
      }

      listRoles.forEach((role) => {
        const item = document.createElement('div');
        item.className = 'p-2 border rounded bg-white shadow-sm d-flex align-items-center gap-2 role-draggable-item';
        item.style.cursor = 'grab';
        item.style.userSelect = 'none';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-role-id', role.id);
        item.setAttribute('data-role-name', role.nombre);
        
        item.innerHTML = `
          <i class="bi bi-grip-vertical text-muted"></i>
          <span class="fw-semibold small text-dark">${role.nombre}</span>
        `;

        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', role.id);
          item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
          item.style.opacity = '1';
        });

        if (rolesSeleccionadosIds.includes(role.id)) {
          this.rolesAsignadosList.appendChild(item);
        } else {
          this.rolesDisponiblesList.appendChild(item);
        }
      });

      this.updateEmptyStates();
      this.checkInstitucionRole();
    } catch (error) {
      console.error('Error al cargar catálogo de roles:', error);
      this.rolesDisponiblesList.innerHTML = '<span class="text-danger small">Error al cargar roles.</span>';
    }
  }

  async cargarInstituciones() {
    try {
      const response = await InstitucionService.getAll();
      const instituciones = response.data || response || [];
      const list = Array.isArray(instituciones) ? instituciones : instituciones.data || [];
      
      list.forEach(inst => {
        const option = document.createElement('option');
        option.value = inst.id;
        option.textContent = inst.nombre;
        if (this.institucionSelect) {
          this.institucionSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
    }
  }

  checkInstitucionRole() {
    if (!this.rolesAsignadosList || !this.institucionContainer || !this.institucionSelect) return;
    
    let isInstitucion = false;
    const assignedItems = this.rolesAsignadosList.querySelectorAll('.role-draggable-item');
    assignedItems.forEach(item => {
      const roleName = item.getAttribute('data-role-name');
      if (roleName && roleName.toLowerCase() === 'institucion') {
        isInstitucion = true;
      }
    });

    if (isInstitucion) {
      this.institucionContainer.classList.remove('d-none');
      this.institucionSelect.required = true;
    } else {
      this.institucionContainer.classList.add('d-none');
      this.institucionSelect.required = false;
      this.institucionSelect.value = '';
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
        
        if (this.institucionSelect && user.institucion_id) {
          this.institucionSelect.value = user.institucion_id;
        }

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
    
    const institucion_id = this.institucionSelect && !this.institucionContainer.classList.contains('d-none') ? this.institucionSelect.value : null;

    const assignedItems = this.rolesAsignadosList.querySelectorAll('[data-role-id]');
    const roles = Array.from(assignedItems).map((item) => parseInt(item.getAttribute('data-role-id')));

    const payload = {
      username,
      name,
      email,
      activo,
      roles,
    };
    
    if (institucion_id) {
      payload.institucion_id = parseInt(institucion_id);
    }

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
