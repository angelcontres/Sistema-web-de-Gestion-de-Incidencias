import { BaseComponent } from "../../../../core/base-component.js";
import { apiRequest } from "../../../../core/api.js";

export class RoleIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/role/component/index/role-index.component.html');
  }

  async onInit() {
    console.log('Página de roles con modal inicializada.');
    
    // 1. Cargar los roles inicialmente en la tabla
    await this.cargarRoles();

    // 2. Escuchar clic del botón "Nuevo Registro"
    const btnNuevoRol = this.querySelector('#btnNuevoRol');
    if (btnNuevoRol) {
      btnNuevoRol.addEventListener('click', () => this.abrirModalCrear());
    }

    // 3. Escuchar el submit del formulario del modal
    const form = this.querySelector('#roleForm');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarRol(e));
    }
  }

  /**
   * Carga los roles del backend y llena la tabla
   */
  async cargarRoles() {
    const tblDatos = this.querySelector('#tbl-datos-roles');
    const loadingSpinner = this.querySelector('#loadingSpinner');
    const tableContainer = this.querySelector('#tableContainer');
    const emptyState = this.querySelector('#emptyState');
    const totalRolesBadge = this.querySelector('#totalRolesBadge');

    if (!tblDatos) return;

    loadingSpinner.classList.remove('d-none');
    tableContainer.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    try {
      const response = await apiRequest('/v1/roles');
      const roles = response || [];

      if (totalRolesBadge) {
        totalRolesBadge.textContent = `${roles.length} Registros`;
      }

      tblDatos.innerHTML = '';

      if (roles.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      roles.forEach(rol => {
        const tr = document.createElement('tr');
        tr.className = 'border-bottom border-light';

        // Celda ID
        const tdId = document.createElement('td');
        tdId.className = 'ps-4 text-secondary fw-semibold';
        tdId.textContent = `#${rol.id}`;

        // Celda Nombre
        const tdNombre = document.createElement('td');
        const divNombre = document.createElement('div');
        divNombre.className = 'fw-bold text-dark';
        divNombre.textContent = rol.nombre;
        tdNombre.appendChild(divNombre);

        // Celda Descripción
        const tdDescripcion = document.createElement('td');
        tdDescripcion.textContent = rol.descripcion || '-';

        // Celda Rol Padre (Si no hay relación cargada, usamos padre_id)
        const tdPadre = document.createElement('td');
        if (rol.parent && rol.parent.nombre) {
          tdPadre.textContent = rol.parent.nombre;
        } else if (rol.padre_id) {
          // Buscamos el nombre localmente en la respuesta
          const padre = roles.find(r => r.id === rol.padre_id);
          tdPadre.textContent = padre ? padre.nombre : `Rol #${rol.padre_id}`;
        } else {
          tdPadre.textContent = '-';
        }

        // Celda Fecha de Creación
        const tdFecha = document.createElement('td');
        tdFecha.className = 'text-muted small';
        tdFecha.textContent = rol.created_at
          ? new Date(rol.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-';

        // Celda Acciones (Dropdown de los tres puntos)
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

        // Opción: Editar (Abre el modal en vez de cambiar de página)
        const liEdit = document.createElement('li');
        const btnEdit = document.createElement('button');
        btnEdit.className = 'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary small fw-medium border-0 bg-transparent w-100 text-start';
        btnEdit.type = 'button';
        btnEdit.addEventListener('click', () => this.abrirModalEditar(rol, roles));

        const iEdit = document.createElement('i');
        iEdit.className = 'bi bi-pencil-square';
        btnEdit.appendChild(iEdit);
        btnEdit.appendChild(document.createTextNode(' Editar'));
        liEdit.appendChild(btnEdit);

        // Opción: Eliminar
        const liDelete = document.createElement('li');
        const btnDelete = document.createElement('button');
        btnDelete.className = 'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger btn-eliminar border-0 bg-transparent w-100 small fw-medium text-start';
        btnDelete.addEventListener('click', () => this.eliminarRol(rol.id, rol.nombre));

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
        tr.appendChild(tdNombre);
        tr.appendChild(tdDescripcion);
        tr.appendChild(tdPadre);
        tr.appendChild(tdFecha);
        tr.appendChild(tdAcciones);

        tblDatos.appendChild(tr);
      });

      loadingSpinner.classList.add('d-none');
      tableContainer.classList.remove('d-none');

    } catch (error) {
      console.error('Error cargando roles:', error);
      loadingSpinner.classList.add('d-none');
      this.mostrarAlertaError(`Error al cargar roles: ${error.message}`);
    }
  }

  /**
   * Llena las opciones del select "padre_id" en el formulario del modal
   */
  llenarSelectPadre(roles, excluirId = null, valorSeleccionado = null) {
    const selectPadre = this.querySelector('#padre_id');
    if (!selectPadre) return;

    // Reiniciamos las opciones dejando solo la de "Ninguno"
    selectPadre.innerHTML = '<option value="" selected>Ninguno (Rol Principal)</option>';

    roles.forEach(rol => {
      // Al editar, no permitimos que se asigne como su propio padre
      if (excluirId && rol.id == excluirId) return;

      const option = document.createElement('option');
      option.value = rol.id;
      option.textContent = rol.nombre;
      selectPadre.appendChild(option);
    });

    if (valorSeleccionado) {
      selectPadre.value = valorSeleccionado;
    }
  }

  /**
   * Abre el modal en modo Creación (Limpio)
   */
  async abrirModalCrear() {
    this.limpiarErroresModal();
    this.querySelector('#roleForm').classList.remove('was-validated');
    
    this.querySelector('#roleId').value = '';
    this.querySelector('#nombre').value = '';
    this.querySelector('#descripcion').value = '';
    this.querySelector('#padre_id').value = '';
    
    this.querySelector('#roleModalLabel').textContent = 'Nuevo Rol';
    this.querySelector('#btnText').textContent = 'Guardar Rol';

    try {
      // Cargar roles padres disponibles
      const response = await apiRequest('/v1/roles');
      this.llenarSelectPadre(response || []);
    } catch (error) {
      console.error('Error cargando roles para select:', error);
    }

    const modalEl = this.querySelector('#roleModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Abre el modal en modo Edición (Carga datos)
   */
  async abrirModalEditar(rol, todosLosRoles) {
    this.limpiarErroresModal();
    this.querySelector('#roleForm').classList.remove('was-validated');

    this.querySelector('#roleId').value = rol.id;
    this.querySelector('#nombre').value = rol.nombre;
    this.querySelector('#descripcion').value = rol.descripcion || '';

    this.querySelector('#roleModalLabel').textContent = 'Editar Rol';
    this.querySelector('#btnText').textContent = 'Actualizar Rol';

    // Rellenamos el select excluyendo el ID actual para evitar bucles circulares
    this.llenarSelectPadre(todosLosRoles, rol.id, rol.padre_id);

    const modalEl = this.querySelector('#roleModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  /**
   * Guarda el rol (POST para crear, PUT para editar)
   */
  async guardarRol(e) {
    e.preventDefault();
    const form = this.querySelector('#roleForm');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const roleId = this.querySelector('#roleId').value;
    const nombre = this.querySelector('#nombre').value.trim();
    const descripcion = this.querySelector('#descripcion').value.trim();
    const padreSelectVal = this.querySelector('#padre_id').value;
    const padre_id = padreSelectVal ? parseInt(padreSelectVal) : null;

    const payload = { nombre, descripcion, padre_id };

    try {
      const endpoint = roleId ? `/v1/roles/${roleId}` : '/v1/roles';
      const method = roleId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      // 1. Ocultar el modal
      const modalEl = this.querySelector('#roleModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      // 2. Mostrar alerta de éxito
      this.mostrarAlertaExito(roleId ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');

      // 3. Recargar listado en la tabla
      await this.cargarRoles();

    } catch (error) {
      console.error('Error al guardar rol:', error);
      this.mostrarErrorModal(error.message || 'Error al procesar el formulario.');
    }
  }

  /**
   * Elimina un rol
   */
  async eliminarRol(id, nombre) {
    if (confirm(`¿Estás seguro de que deseas eliminar el rol "${nombre}"?\nEsta acción es irreversible.`)) {
      try {
        await apiRequest(`/v1/roles/${id}`, { method: 'DELETE' });
        this.mostrarAlertaExito(`Rol "${nombre}" eliminado con éxito.`);
        await this.cargarRoles();
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        alert(`Error al eliminar: ${error.message}`);
      }
    }
  }

  /**
   * Métodos helpers de Alertas
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

customElements.define('app-role-index', RoleIndexComponent);