import { BaseComponent } from '../../../../core/base-component.js';
import { UserService } from '../../services/user.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
export class UserIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/user/components/index/user-index.component.html');
  }

  async onInit() {
    console.log('Página de mantenimiento de usuarios inicializada.');

    const btnNuevoRegistro = this.querySelector('#btn-nuevo-registro');
    if (btnNuevoRegistro && !AuthService.hasPermission('CREATE', 'usuarios')) {
      btnNuevoRegistro.classList.add('d-none');
    }

    const tblDatos = this.querySelector('#tbl-datos-usuarios');

    if (tblDatos) {
      // 1. Configurar las columnas de forma parametrizable
      tblDatos.configure({
        columns: [
          {
            header: 'ID',
            key: 'id',
            class: 'ps-4 text-secondary fw-semibold',
            format: (id) => `#${id}`,
          },
          { header: 'Usuario', key: 'username', class: 'fw-semibold text-dark' },
          { header: 'Nombre', key: 'name' },
          { header: 'Email', key: 'email', class: 'text-muted' },
          {
            header: 'Roles',
            render: (user) =>
              user.roles && user.roles.length > 0
                ? user.roles
                    .map(
                      (r) =>
                        `<span class="badge bg-primary-soft text-primary me-1 small fw-semibold">${r.nombre}</span>`
                    )
                    .join('')
                : '-',
          },
          {
            header: 'Estado',
            render: (user) => `
              <span class="badge bg-${user.activo ? 'success' : 'danger'}-soft text-${user.activo ? 'success' : 'danger'} small fw-semibold">
                ${user.activo ? 'Activo' : 'Inactivo'}
              </span>
            `,
          },
          {
            header: 'Creado el',
            render: (user) =>
              user.created_at
                ? new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '-',
          },
          {
            header: 'Acciones',
            class: 'text-center',
            actions: [
              ...(AuthService.hasPermission('UPDATE', 'usuarios') ? [{ name: 'editar', label: 'Editar', icon: 'bi-pencil-square', class: 'text-primary' }] : []),
              ...(AuthService.hasPermission('DELETE', 'usuarios') ? [{ name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }] : []),
            ],
          },
        ],
      });

      // 2. Escuchar acciones de la tabla (editar / eliminar)
      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          window.location.hash = `#/usuarios/form?id=${item.id}`;
        } else if (action === 'eliminar') {
          this.eliminarUsuario(item.id, item.name);
        }
      });

      // 3. Cargar la lista inicial de usuarios
      tblDatos.load(UserService.getAll);
    }
  }

  /**
   * Elimina un usuario por ID
   */
  async eliminarUsuario(id, name) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Usuario',
      `¿Estás seguro de que deseas eliminar el usuario "${name}"?<br>Esta acción lo removerá del sistema.`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );
    
    if (isConfirmed) {
      try {
        await UserService.delete(id);
        ToastService.success(`Usuario "${name}" eliminado con éxito.`);
        const tblDatos = this.querySelector('#tbl-datos-usuarios');
        if (tblDatos) {
          await tblDatos.load(UserService.getAll);
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        ToastService.error(`Error al eliminar: ${error.message}`);
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
}

customElements.define('app-user-index', UserIndexComponent);
