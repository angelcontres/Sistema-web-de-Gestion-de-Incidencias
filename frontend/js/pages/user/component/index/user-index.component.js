import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';

export class UserIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/user/component/index/user-index.component.html');
  }

  async onInit() {
    console.log('Página de mantenimiento de usuarios inicializada.');

    // 1. Cargar la lista inicial de usuarios
    await this.cargarUsuarios();

    // 2. Escuchar clic del botón "Nuevo Registro"
    const btnNuevoUsuario = this.querySelector('#btnNuevoUsuario');
    if (btnNuevoUsuario) {
      btnNuevoUsuario.addEventListener('click', () => this.abrirModalCrear());
    }

    // 3. Escuchar el submit del formulario del modal
    const form = this.querySelector('#userForm');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarUsuario(e));
    }
  }

  /**
   * Carga los usuarios y llena la tabla principal
   */
  async cargarUsuarios() {
    const tblDatos = this.querySelector('#tbl-datos-usuarios');
    const loadingSpinner = this.querySelector('#loadingSpinner');
    const tableContainer = this.querySelector('#tableContainer');
    const emptyState = this.querySelector('#emptyState');
    const totalUsuariosBadge = this.querySelector('#totalUsuariosBadge');

    if (!tblDatos) return;

    loadingSpinner.classList.remove('d-none');
    tableContainer.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    try {
      const users = await apiRequest('/v1/usuarios');
      const userList = users || [];

      if (totalUsuariosBadge) {
        totalUsuariosBadge.textContent = `${userList.length} Registros`;
      }

      tblDatos.innerHTML = '';

      if (userList.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      userList.forEach((user) => {
        const tr = document.createElement('tr');
        tr.className = 'border-bottom border-light';

        // ID
        const tdId = document.createElement('td');
        tdId.className = 'ps-4 text-secondary fw-semibold';
        tdId.textContent = `#${user.id}`;

        // Username
        const tdUsername = document.createElement('td');
        tdUsername.className = 'fw-semibold text-dark';
        tdUsername.textContent = user.username;

        // Nombre Completo
        const tdNombre = document.createElement('td');
        tdNombre.textContent = user.name;

        // Email
        const tdEmail = document.createElement('td');
        tdEmail.className = 'text-muted';
        tdEmail.textContent = user.email;

        // Roles (relación cargada)
        const tdRoles = document.createElement('td');
        if (user.roles && user.roles.length > 0) {
          const rolesNames = user.roles.map((r) => r.nombre);
          rolesNames.forEach((roleName) => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary-soft text-primary me-1 small fw-semibold';
            badge.textContent = roleName;
            tdRoles.appendChild(badge);
          });
        } else {
          tdRoles.textContent = '-';
        }

        // Estado (Activo / Inactivo)
        const tdEstado = document.createElement('td');
        const badgeEstado = document.createElement('span');
        if (user.activo) {
          badgeEstado.className = 'badge bg-success-soft text-success small fw-semibold';
          badgeEstado.textContent = 'Activo';
        } else {
          badgeEstado.className = 'badge bg-danger-soft text-danger small fw-semibold';
          badgeEstado.textContent = 'Inactivo';
        }
        tdEstado.appendChild(badgeEstado);

        // Fecha de creación
        const tdFecha = document.createElement('td');
        tdFecha.className = 'text-muted small';
        tdFecha.textContent = user.created_at
          ? new Date(user.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '-';

        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';

        const divDropdown = document.createElement('div');
        divDropdown.className = 'dropdown';

        const btnDropdown = document.createElement('button');
        btnDropdown.className = 'btn btn-light text-secondary p-1.5 rounded-2 border-0';
        btnDropdown.type = 'button';
        btnDropdown.setAttribute('data-bs-toggle', 'dropdown');
        btnDropdown.setAttribute('aria-expanded', 'false');

        const iDots = document.createElement('i');
        iDots.className = 'bi bi-three-dots-vertical fs-6';
        btnDropdown.appendChild(iDots);

        const ulMenu = document.createElement('ul');
        ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0';

        // Editar
        const liEdit = document.createElement('li');
        const btnEdit = document.createElement('button');
        btnEdit.className =
          'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary small fw-medium border-0 bg-transparent w-100 text-start';
        btnEdit.type = 'button';
        btnEdit.addEventListener('click', () => this.abrirModalEditar(user));

        const iEdit = document.createElement('i');
        iEdit.className = 'bi bi-pencil-square';
        btnEdit.appendChild(iEdit);
        btnEdit.appendChild(document.createTextNode(' Editar'));
        liEdit.appendChild(btnEdit);

        // Eliminar
        const liDelete = document.createElement('li');
        const btnDelete = document.createElement('button');
        btnDelete.className =
          'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger border-0 bg-transparent w-100 small fw-medium text-start';
        btnDelete.type = 'button';
        btnDelete.addEventListener('click', () => this.eliminarUsuario(user.id, user.name));

        const iDelete = document.createElement('i');
        iDelete.className = 'bi bi-trash';
        btnDelete.appendChild(iDelete);
        btnDelete.appendChild(document.createTextNode(' Eliminar'));
        liDelete.appendChild(btnDelete);

        ulMenu.appendChild(liEdit);
        ulMenu.appendChild(liDelete);
        divDropdown.appendChild(btnDropdown);
        divDropdown.appendChild(ulMenu);
        tdAcciones.appendChild(divDropdown);

        tr.appendChild(tdId);
        tr.appendChild(tdUsername);
        tr.appendChild(tdNombre);
        tr.appendChild(tdEmail);
        tr.appendChild(tdRoles);
        tr.appendChild(tdEstado);
        tr.appendChild(tdFecha);
        tr.appendChild(tdAcciones);

        tblDatos.appendChild(tr);
      });

      loadingSpinner.classList.add('d-none');
      tableContainer.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      loadingSpinner.classList.add('d-none');
      this.mostrarAlertaError(`Error al cargar usuarios: ${error.message}`);
    }
  }

  /**
   * Carga los roles disponibles como checkboxes
   */
  async cargarRolesCheckboxes(rolesSeleccionadosIds = []) {
    const container = this.querySelector('#rolesCheckboxContainer');
    if (!container) return;

    try {
      const roles = await apiRequest('/v1/roles');
      const listRoles = roles || [];

      container.innerHTML = '';

      if (listRoles.length === 0) {
        container.innerHTML =
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
        container.appendChild(div);
      });
    } catch (error) {
      console.error('Error al cargar catálogo de roles:', error);
      container.innerHTML = '<span class="text-danger small">Error al cargar roles.</span>';
    }
  }

  /**
   * Limpia y abre el modal en modo Creación
   */
  async abrirModalCrear() {
    this.limpiarErroresModal();
    this.querySelector('#userForm').classList.remove('was-validated');

    this.querySelector('#userId').value = '';
    this.querySelector('#username').value = '';
    this.querySelector('#name').value = '';
    this.querySelector('#email').value = '';

    const passwordInput = this.querySelector('#password');
    passwordInput.value = '';
    passwordInput.required = true; // Requerido para nuevo usuario

    this.querySelector('#activo').checked = true;

    this.querySelector('#userModalLabel').textContent = 'Nuevo Usuario';
    this.querySelector('#btnText').textContent = 'Guardar Usuario';
    this.querySelector('#txtPasswordHelp').classList.add('d-none');

    // Cargar checkboxes vacíos
    await this.cargarRolesCheckboxes();

    const modalEl = this.querySelector('#userModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Carga los datos y abre el modal en modo Edición
   */
  async abrirModalEditar(user) {
    this.limpiarErroresModal();
    this.querySelector('#userForm').classList.remove('was-validated');

    this.querySelector('#userId').value = user.id;
    this.querySelector('#username').value = user.username;
    this.querySelector('#name').value = user.name;
    this.querySelector('#email').value = user.email;

    const passwordInput = this.querySelector('#password');
    passwordInput.value = '';
    passwordInput.required = false; // Opcional para editar

    this.querySelector('#activo').checked = !!user.activo;

    this.querySelector('#userModalLabel').textContent = 'Editar Usuario';
    this.querySelector('#btnText').textContent = 'Actualizar Usuario';
    this.querySelector('#txtPasswordHelp').classList.remove('d-none');

    // Cargar checkboxes con sus roles seleccionados
    const userRoleIds = (user.roles || []).map((r) => r.id);
    await this.cargarRolesCheckboxes(userRoleIds);

    const modalEl = this.querySelector('#userModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Guarda el usuario (POST para crear, PUT para editar)
   */
  async guardarUsuario(e) {
    e.preventDefault();
    const form = this.querySelector('#userForm');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const userId = this.querySelector('#userId').value;
    const username = this.querySelector('#username').value.trim();
    const name = this.querySelector('#name').value.trim();
    const email = this.querySelector('#email').value.trim();
    const password = this.querySelector('#password').value;
    const activo = this.querySelector('#activo').checked;

    // Obtener los roles seleccionados de los checkboxes
    const checkboxes = this.querySelectorAll('.role-checkbox:checked');
    const roles = Array.from(checkboxes).map((chk) => parseInt(chk.value));

    const payload = {
      username,
      name,
      email,
      activo,
      roles,
    };

    // Añadir password solo si está lleno o si es creación
    if (password) {
      payload.password = password;
    }

    try {
      const endpoint = userId ? `/v1/usuarios/${userId}` : '/v1/usuarios';
      const method = userId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      // Ocultar modal
      const modalEl = this.querySelector('#userModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      // Mostrar éxito
      this.mostrarAlertaExito(
        userId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.'
      );

      // Recargar tabla
      await this.cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      this.mostrarErrorModal(error.message || 'Error al procesar el formulario.');
    }
  }

  /**
   * Elimina un usuario por ID
   */
  async eliminarUsuario(id, name) {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar el usuario "${name}"?\nEsta acción lo removerá del sistema.`
      )
    ) {
      try {
        await apiRequest(`/v1/usuarios/${id}`, { method: 'DELETE' });
        this.mostrarAlertaExito(`Usuario "${name}" eliminado con éxito.`);
        await this.cargarUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert(`Error al eliminar: ${error.message}`);
      }
    }
  }

  /**
   * Helpers de alertas
   */
  mostrarAlertaExito(message) {
    const successAlert = this.querySelector('#successAlert');
    const successMessage = this.querySelector('#successMessage');
    if (successAlert && successMessage) {
      successMessage.textContent = message;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 4000);
    }
  }

  mostrarAlertaError(message) {
    const errorAlert = this.querySelector('#errorAlert');
    const errorMessage = this.querySelector('#errorMessage');
    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.classList.remove('d-none');
    }
  }

  mostrarErrorModal(message) {
    const modalErrorAlert = this.querySelector('#modalErrorAlert');
    const modalErrorMessage = this.querySelector('#modalErrorMessage');
    if (modalErrorAlert && modalErrorMessage) {
      modalErrorMessage.textContent = message;
      modalErrorAlert.classList.remove('d-none');
    }
  }

  limpiarErroresModal() {
    const modalErrorAlert = this.querySelector('#modalErrorAlert');
    if (modalErrorAlert) modalErrorAlert.classList.add('d-none');
  }
}

customElements.define('app-user-index', UserIndexComponent);
