import { BaseComponent } from '../../../../core/base-component.js';
import { UserService } from '../../services/user.service.js';
import { RoleService } from '../../../role/services/role.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { InstitucionService } from '../../../instituciones/services/institucion.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';

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
    this.territorioContainer = this.querySelector('#territorioContainer');
    this.territoriosSelect = this.querySelector('#territorios_select');
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
    this.inicializarFormulario(userId);
  }

  async inicializarFormulario(userId) {
    await Promise.all([this.cargarInstituciones(), this.cargarTerritorios()]);
    this.configurarInterfazModo(userId);
    await this.cargarDatosModo(userId);
  }

  configurarInterfazModo(userId) {
    if (userId) {
      this.configurarModoEdicion();
    } else {
      this.configurarModoCreacion();
    }
  }

  configurarModoEdicion() {
    document.title = 'Editar Usuario';
    if (this.formTitle) this.formTitle.textContent = 'Editar Usuario';
    if (this.btnText) this.btnText.textContent = 'Actualizar Usuario';
    if (this.txtPasswordHelp) this.txtPasswordHelp.classList.remove('d-none');
    if (this.passwordInput) {
      this.passwordInput.required = false;
      const mb3 = this.passwordInput.closest('.mb-3');
      if (mb3) mb3.classList.remove('d-none');
    }
    const inviteAlert = this.querySelector('#inviteInfoAlert');
    if (inviteAlert) inviteAlert.classList.add('d-none');
  }

  configurarModoCreacion() {
    document.title = 'Invitar Usuario';
    if (this.formTitle) this.formTitle.textContent = 'Invitar Usuario';
    if (this.btnText) this.btnText.textContent = 'Enviar Invitación';
    if (this.txtPasswordHelp) this.txtPasswordHelp.classList.add('d-none');
    if (this.passwordInput) {
      this.passwordInput.required = false;
      const mb3 = this.passwordInput.closest('.mb-3');
      if (mb3) mb3.classList.add('d-none'); // Hide password on create
    }
    const inviteAlert = this.querySelector('#inviteInfoAlert');
    if (inviteAlert) inviteAlert.classList.remove('d-none');
  }

  async cargarDatosModo(userId) {
    if (userId) {
      await this.cargarDatosEdicion(userId);
    } else {
      await this.cargarRolesCheckboxes();
    }
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
        this.rolesDisponiblesList.innerHTML =
          '<span class="empty-indicator text-muted small text-center my-3 w-100">Sin roles disponibles</span>';
      }
    } else if (dispEmptyIndicator) {
      dispEmptyIndicator.remove();
    }

    // Assigned List Empty State
    const hasAsignados = this.rolesAsignadosList.querySelectorAll('[data-role-id]').length > 0;
    const asigEmptyIndicator = this.rolesAsignadosList.querySelector('.empty-indicator');
    if (!hasAsignados) {
      if (!asigEmptyIndicator) {
        this.rolesAsignadosList.innerHTML =
          '<span class="empty-indicator text-muted small text-center my-3 w-100">Arrastre aquí...</span>';
      }
    } else if (asigEmptyIndicator) {
      asigEmptyIndicator.remove();
    }
  }

  async cargarRolesCheckboxes(rolesSeleccionadosIds = []) {
    if (!this.rolesDisponiblesList || !this.rolesAsignadosList) return;

    try {
      const response = await RoleService.getAll(1, 15, null, { all: true });
      const listRoles = Array.isArray(response) ? response : response.data || [];

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
        item.className =
          'p-2 border rounded bg-white shadow-sm d-flex align-items-center gap-2 role-draggable-item';
        item.style.cursor = 'grab';
        item.style.userSelect = 'none';
        item.setAttribute('draggable', 'true');
        item.dataset.roleId = role.id;
        item.dataset.roleName = role.nombre;

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
      this.rolesDisponiblesList.innerHTML =
        '<span class="text-danger small">Error al cargar roles.</span>';
    }
  }

  async cargarInstituciones() {
    try {
      const response = await InstitucionService.getAll(1, 15, null, { all: true });
      const list = Array.isArray(response) ? response : response.data || [];

      list.forEach((inst) => {
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

  async cargarTerritorios() {
    try {
      const paisId = AuthService.getPaisId();
      const response = await CatalogoService.getTerritorios(paisId, null);
      const territorios = response.data || response || [];
      const list = Array.isArray(territorios) ? territorios : territorios.data || [];

      if (this.territoriosSelect) {
        this.territoriosSelect.innerHTML = '';
        list.forEach((territorio) => {
          const option = document.createElement('option');
          option.value = territorio.id;
          option.textContent = territorio.nombre;
          this.territoriosSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error al cargar territorios:', error);
    }
  }

  checkInstitucionRole() {
    if (!this.rolesAsignadosList) return;

    let isInstitucion = false;
    let isSupervisor = false;

    const assignedItems = this.rolesAsignadosList.querySelectorAll('.role-draggable-item');
    assignedItems.forEach((item) => {
      const roleName = item.dataset.roleName;
      if (roleName) {
        const nameLower = roleName.toLowerCase();
        if (nameLower === 'institucion') {
          isInstitucion = true;
        } else if (nameLower === 'supervisor') {
          isSupervisor = true;
        }
      }
    });

    // Institucion role toggle
    if (this.institucionContainer && this.institucionSelect) {
      if (isInstitucion) {
        this.institucionContainer.classList.remove('d-none');
        this.institucionSelect.required = true;
      } else {
        this.institucionContainer.classList.add('d-none');
        this.institucionSelect.required = false;
        this.institucionSelect.value = '';
      }
    }

    // Supervisor role toggle
    if (this.territorioContainer && this.territoriosSelect) {
      if (isSupervisor) {
        this.territorioContainer.classList.remove('d-none');
        this.territoriosSelect.required = true;
      } else {
        this.territorioContainer.classList.add('d-none');
        this.territoriosSelect.required = false;
        Array.from(this.territoriosSelect.options).forEach((opt) => (opt.selected = false));
      }
    }
  }

  async cargarDatosEdicion(userId) {
    this.limpiarErrores();
    try {
      const user = await UserService.getById(userId);
      if (!user) return;
      this.poblarCamposBasicosUsuario(user);
      this.poblarInstitucionUsuario(user);
      await this.procesarRolesUsuario(user);
      this.poblarTerritoriosUsuario(user);
    } catch (error) {
      this.manejarErrorCargaEdicion(error);
    }
  }

  poblarCamposBasicosUsuario(user) {
    if (this.userIdInput) this.userIdInput.value = user.id;
    if (this.usernameInput) this.usernameInput.value = user.username || '';
    if (this.nameInput) this.nameInput.value = user.name || '';
    if (this.emailInput) this.emailInput.value = user.email || '';
    if (this.activoInput) this.activoInput.checked = !!user.activo;
  }

  poblarInstitucionUsuario(user) {
    if (this.institucionSelect && user.institucion_id) {
      this.institucionSelect.value = user.institucion_id;
    }
  }

  async procesarRolesUsuario(user) {
    const userRoleIds = (user.roles || []).map((r) => r.id);
    await this.cargarRolesCheckboxes(userRoleIds);
  }

  poblarTerritoriosUsuario(user) {
    if (!this.territoriosSelect || !user.territorios) return;
    const userTerritorioIds = new Set(user.territorios.map((t) => String(t.id)));
    Array.from(this.territoriosSelect.options).forEach((opt) => {
      opt.selected = userTerritorioIds.has(opt.value);
    });
  }

  manejarErrorCargaEdicion(error) {
    console.error('Error al cargar datos del usuario para edición:', error);
    this.mostrarError('No se pudieron cargar los datos del usuario.');
    if (this.btnSubmit) this.btnSubmit.disabled = true;
  }

  async guardarUsuario(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      return;
    }

    this.toggleLoading(true);

    const payload = this.construirPayload();

    try {
      if (this.userIdInput.value) {
        await UserService.update(this.userIdInput.value, payload);
      } else {
        await UserService.create(payload);
      }
      window.location.hash = '#/usuarios';
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      this.mostrarError(error.message || 'Error al procesar el formulario.');
      this.toggleLoading(false);
    }
  }

  construirPayload() {
    const institucion_id =
      this.institucionSelect && !this.institucionContainer.classList.contains('d-none')
        ? this.institucionSelect.value
        : null;

    const assignedItems = this.rolesAsignadosList.querySelectorAll('[data-role-id]');
    const roles = Array.from(assignedItems).map((item) => Number.parseInt(item.dataset.roleId, 10));

    let territorios = [];
    if (this.territoriosSelect && !this.territorioContainer.classList.contains('d-none')) {
      territorios = Array.from(this.territoriosSelect.selectedOptions).map((opt) =>
        Number.parseInt(opt.value, 10)
      );
    }

    const payload = {
      username: this.usernameInput.value.trim(),
      name: this.nameInput.value.trim(),
      email: this.emailInput.value.trim(),
      activo: this.activoInput.checked,
      roles,
      territorios,
      institucion_id: institucion_id ? Number.parseInt(institucion_id, 10) : null,
    };

    if (this.passwordInput.value) {
      payload.password = this.passwordInput.value;
    }

    return payload;
  }

  toggleLoading(isLoading) {
    if (this.btnSubmit) this.btnSubmit.disabled = isLoading;
    if (this.loadingSpinner) {
      if (isLoading) {
        this.loadingSpinner.classList.remove('d-none');
      } else {
        this.loadingSpinner.classList.add('d-none');
      }
    }
    if (isLoading) this.limpiarErrores();
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
