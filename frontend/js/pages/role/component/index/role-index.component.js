import { BaseComponent } from "../../../../core/base-component.js";
import { RoleService } from "../../services/role.service.js";

export class RoleIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/role/component/index/role-index.component.html');
  }

  async onInit() {
    console.log('Página de roles con modal inicializada.');
    
    const tblDatos = this.querySelector('#tbl-datos-roles');
    if (tblDatos) {
      // 1. Configurar las columnas de forma parametrizable
      tblDatos.configure({
        columns: [
          { header: 'ID', key: 'id', class: 'ps-4 text-secondary fw-semibold', format: (id) => `#${id}` },
          { 
            header: 'Nombre', 
            render: (rol) => `<div class="fw-bold text-dark">${rol.nombre}</div>` 
          },
          { header: 'Descripción', key: 'descripcion' },
          { 
            header: 'Rol Padre', 
            render: (rol) => rol.parent ? rol.parent.nombre : '-' 
          },
          { 
            header: 'Creado el', 
            render: (rol) => rol.created_at 
              ? new Date(rol.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) 
              : '-' 
          },
          {
            header: 'Acciones',
            class: 'text-center',
            actions: [
              { name: 'editar', label: 'Editar', icon: 'bi-pencil-square', class: 'text-primary' },
              { name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }
            ]
          }
        ]
      });

      // 2. Escuchar acciones de la tabla (editar / eliminar)
      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          this.abrirModalEditar(item, tblDatos.items);
        } else if (action === 'eliminar') {
          this.eliminarRol(item.id, item.nombre);
        }
      });

      // 3. Cargar los roles inicialmente en la tabla
      tblDatos.load(RoleService.getAll);
    }

    // 3. Escuchar clic del botón "Nuevo Registro"
    const btnNuevoRol = this.querySelector('#btnNuevoRol');
    if (btnNuevoRol) {
      btnNuevoRol.addEventListener('click', () => this.abrirModalCrear());
    }

    // 4. Escuchar el submit del formulario del modal
    const form = this.querySelector('#roleForm');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarRol(e));
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
      const response = await RoleService.getAll();
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
      if (roleId) {
        await RoleService.update(roleId, payload);
      } else {
        await RoleService.create(payload);
      }

      // 1. Ocultar el modal
      const modalEl = this.querySelector('#roleModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      // 2. Mostrar alerta de éxito
      this.mostrarAlertaExito(roleId ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');

      // 3. Recargar listado en la tabla
      await this.querySelector('#tbl-datos-roles').load(RoleService.getAll);

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
        await RoleService.delete(id);
        this.mostrarAlertaExito(`Rol "${nombre}" eliminado con éxito.`);
        await this.querySelector('#tbl-datos-roles').load(RoleService.getAll);
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