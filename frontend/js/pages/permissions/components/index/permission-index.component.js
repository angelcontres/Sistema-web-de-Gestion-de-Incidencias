import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';

export class PermissionIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/permissions/components/index/permission-index.component.html');
  }

  async onInit() {
    console.log('Página de permisos inicializada.');

    await this.cargarPermisos();

    const btnNuevoPermiso = this.querySelector('#btnNuevoPermiso');
    if (btnNuevoPermiso) {
      btnNuevoPermiso.addEventListener('click', () => this.abrirModalCrear());
    }

    const form = this.querySelector('#permisoForm');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarPermiso(e));
    }
  }

  async cargarPermisos() {
    const tblDatos = this.querySelector('#tbl-datos-permisos');
    const loadingSpinner = this.querySelector('#loadingSpinner');
    const tableContainer = this.querySelector('#tableContainer');
    const emptyState = this.querySelector('#emptyState');
    const totalPermisosBadge = this.querySelector('#totalPermisosBadge');

    if (!tblDatos) return;

    loadingSpinner.classList.remove('d-none');
    tableContainer.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    try {
      const response = await apiRequest('/permisos');
      const permisos = response || [];

      if (totalPermisosBadge) {
        totalPermisosBadge.textContent = `${permisos.length} Registros`;
      }

      tblDatos.innerHTML = '';

      if (permisos.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      permisos.forEach((permiso) => {
        const tr = document.createElement('tr');
        tr.className = 'border-bottom border-light';

        const tdId = document.createElement('td');
        tdId.className = 'ps-4 text-secondary fw-semibold';
        tdId.textContent = `#${permiso.id}`;

        const tdNombre = document.createElement('td');
        const divNombre = document.createElement('div');
        divNombre.className = 'fw-bold text-dark';
        divNombre.textContent = permiso.nombre;
        tdNombre.appendChild(divNombre);

        const tdDescripcion = document.createElement('td');
        tdDescripcion.textContent = permiso.descripcion || '-';

        const tdOpcionMenu = document.createElement('td');
        tdOpcionMenu.textContent = `Opción #${permiso.opcion_menu_id}`;

        const tdFecha = document.createElement('td');
        tdFecha.className = 'text-muted small';
        tdFecha.textContent = permiso.created_at
          ? new Date(permiso.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '-';

        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';

        const divDropdown = document.createElement('div');
        divDropdown.className = 'dropdown';

        const btnDropdown = document.createElement('button');
        btnDropdown.className = 'btn btn-light text-secondary p-1.5 rounded-2 border-0';
        btnDropdown.type = 'button';
        btnDropdown.setAttribute('data-bs-toggle', 'dropdown');

        const iDots = document.createElement('i');
        iDots.className = 'bi bi-three-dots-vertical fs-6';
        btnDropdown.appendChild(iDots);

        const ulMenu = document.createElement('ul');
        ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0';

        const liEdit = document.createElement('li');
        const btnEdit = document.createElement('button');
        btnEdit.className =
          'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary small fw-medium border-0 bg-transparent w-100 text-start';
        btnEdit.type = 'button';
        btnEdit.addEventListener('click', () => this.abrirModalEditar(permiso));

        const iEdit = document.createElement('i');
        iEdit.className = 'bi bi-pencil-square';
        btnEdit.appendChild(iEdit);
        btnEdit.appendChild(document.createTextNode(' Editar'));
        liEdit.appendChild(btnEdit);

        const liDelete = document.createElement('li');
        const btnDelete = document.createElement('button');
        btnDelete.className =
          'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger border-0 bg-transparent w-100 small fw-medium text-start';
        btnDelete.addEventListener('click', () => this.eliminarPermiso(permiso.id, permiso.nombre));

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
        tr.appendChild(tdOpcionMenu);
        tr.appendChild(tdFecha);
        tr.appendChild(tdAcciones);

        tblDatos.appendChild(tr);
      });

      loadingSpinner.classList.add('d-none');
      tableContainer.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando permisos:', error);
      loadingSpinner.classList.add('d-none');
      this.mostrarAlertaError(`Error al cargar permisos: ${error.message}`);
    }
  }

  async llenarSelectOpcionesMenu(valorSeleccionado = null) {
    const selectOpcion = this.querySelector('#opcion_menu_id');
    if (!selectOpcion) return;

    selectOpcion.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';

    try {
      const response = await apiRequest('/opciones-menu');
      const opciones = response.data || [];

      opciones.forEach((opcion) => {
        const option = document.createElement('option');
        option.value = opcion.id;
        option.textContent = opcion.nombre;
        selectOpcion.appendChild(option);
      });

      if (valorSeleccionado) {
        selectOpcion.value = valorSeleccionado;
      }
    } catch (error) {
      console.error('Error cargando opciones de menú:', error);
    }
  }

  async abrirModalCrear() {
    this.limpiarErroresModal();
    this.querySelector('#permisoForm').classList.remove('was-validated');

    this.querySelector('#permisoId').value = '';
    this.querySelector('#nombre').value = '';
    this.querySelector('#descripcion').value = '';

    this.querySelector('#permisoModalLabel').textContent = 'Nuevo Permiso';
    this.querySelector('#btnText').textContent = 'Guardar Permiso';

    await this.llenarSelectOpcionesMenu();

    const modalEl = this.querySelector('#permisoModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  async abrirModalEditar(permiso) {
    this.limpiarErroresModal();
    this.querySelector('#permisoForm').classList.remove('was-validated');

    this.querySelector('#permisoId').value = permiso.id;
    this.querySelector('#nombre').value = permiso.nombre;
    this.querySelector('#descripcion').value = permiso.descripcion || '';

    this.querySelector('#permisoModalLabel').textContent = 'Editar Permiso';
    this.querySelector('#btnText').textContent = 'Actualizar Permiso';

    await this.llenarSelectOpcionesMenu(permiso.opcion_menu_id);

    const modalEl = this.querySelector('#permisoModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  async guardarPermiso(e) {
    e.preventDefault();
    const form = this.querySelector('#permisoForm');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const permisoId = this.querySelector('#permisoId').value;
    const nombre = this.querySelector('#nombre').value.trim();
    const descripcion = this.querySelector('#descripcion').value.trim();
    const opcion_menu_id = parseInt(this.querySelector('#opcion_menu_id').value);

    const payload = { nombre, descripcion, opcion_menu_id };

    try {
      const endpoint = permisoId ? `/permisos/${permisoId}` : '/permisos';
      const method = permisoId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const modalEl = this.querySelector('#permisoModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      this.mostrarAlertaExito(
        permisoId ? 'Permiso actualizado correctamente.' : 'Permiso creado correctamente.'
      );
      await this.cargarPermisos();
    } catch (error) {
      console.error('Error al guardar permiso:', error);
      this.mostrarErrorModal(error.message || 'Error al procesar el formulario.');
    }
  }

  async eliminarPermiso(id, nombre) {
    if (confirm(`¿Estás seguro de que deseas eliminar el permiso "${nombre}"?`)) {
      try {
        await apiRequest(`/permisos/${id}`, { method: 'DELETE' });
        this.mostrarAlertaExito(`Permiso "${nombre}" eliminado con éxito.`);
        await this.cargarPermisos();
      } catch (error) {
        console.error('Error al eliminar permiso:', error);
        alert(`Error al eliminar: ${error.message}`);
      }
    }
  }

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

customElements.define('app-permission-index', PermissionIndexComponent);
