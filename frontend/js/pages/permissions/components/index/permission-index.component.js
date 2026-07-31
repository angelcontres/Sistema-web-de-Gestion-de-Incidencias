import { BaseComponent } from '../../../../core/base-component.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { PermissionService } from '../../services/permissions.service.js';

export class PermissionIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/permissions/components/index/permission-index.component.html');
  }

  async onInit() {
    this.tblDatos = this.querySelector('#tbl-datos-permisos');
    this.formComponent = this.querySelector('#app-permission-form');

    this._setupNewButton();
    this._setupFormListener();
    this._setupTable();
  }

  _setupNewButton() {
    const btnNuevoRegistro = this.querySelector('#btn-nuevo-registro');
    if (!btnNuevoRegistro) return;

    if (!AuthService.hasPermission('CREATE', 'permisos')) {
      btnNuevoRegistro.classList.add('d-none');
    } else if (this.formComponent) {
      btnNuevoRegistro.addEventListener('click', () => this.formComponent.abrirModalCrear());
    }
  }

  _setupFormListener() {
    if (!this.formComponent) return;
    this.formComponent.addEventListener('permiso-guardado', (e) => {
      this.mostrarAlertaExito(e.detail.mensaje);
      if (this.tblDatos?.load) {
        this.tblDatos.load('/permissions');
      }
    });
  }

  _setupTable() {
    if (!this.tblDatos) return;

    this.tblDatos.configure({
      columns: this._getTableColumns(),
    });

    this.tblDatos.addEventListener('row-action', (e) => this._handleRowAction(e));

    this.tblDatos.load('/permissions');
  }

  _getTableColumns() {
    return [
      {
        header: 'ID',
        key: 'id',
        class: 'ps-4 text-secondary fw-semibold',
        format: (id) => `#${id}`,
      },
      { header: 'Nombre', key: 'nombre', class: 'fw-bold text-dark' },
      {
        header: 'Acción',
        render: (permiso) => `<span class="badge bg-secondary">${permiso.accion}</span>`,
      },
      { header: 'Recurso', key: 'recurso' },
      {
        header: 'Opción de Menú',
        render: (permiso) => `${permiso.opcion_menu ? permiso.opcion_menu.nombre : '-'}`,
      },
      {
        header: 'Creado el',
        class: 'text-muted small',
        render: (permiso) =>
          permiso.created_at
            ? new Date(permiso.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-',
      },
      {
        header: 'Acciones',
        class: 'text-center',
        actions: this._getTableActions(),
      },
    ];
  }

  _getTableActions() {
    const actions = [];
    if (AuthService.hasPermission('UPDATE', 'permisos')) {
      actions.push({
        name: 'editar',
        label: 'Editar',
        icon: 'bi-pencil-square',
        class: 'text-primary',
      });
    }
    if (AuthService.hasPermission('DELETE', 'permisos')) {
      actions.push({
        name: 'eliminar',
        label: 'Eliminar',
        icon: 'bi-trash',
        class: 'text-danger',
      });
    }
    return actions;
  }

  _handleRowAction(e) {
    const { action, item } = e.detail;
    if (action === 'editar') {
      if (this.formComponent) this.formComponent.abrirModalEditar(item);
    } else if (action === 'eliminar') {
      this.eliminarPermiso(item.id, item.nombre);
    }
  }

  async eliminarPermiso(id, nombre) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Permiso',
      `¿Está seguro de eliminar el permiso "${nombre}"?`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );

    if (!isConfirmed) return;

    PermissionService.delete(id)
      .then(() => {
        ToastService.success('Permiso eliminado correctamente.');

        const tblDatos = this.querySelector('#tbl-datos-permisos');
        if (tblDatos?.load) {
          tblDatos.load('/permissions');
        }
      })
      .catch((err) => {
        console.error('Error al eliminar permiso:', err);
        ToastService.error(`No se pudo eliminar el permiso: ${err.message}`);
      });
  }

  mostrarAlertaExito(mensaje) {
    const alertEl = this.querySelector('#successAlert');
    const msgEl = this.querySelector('#successMessage');
    if (alertEl && msgEl) {
      msgEl.textContent = mensaje;
      alertEl.classList.remove('d-none');
      setTimeout(() => alertEl.classList.add('d-none'), 3000);
    } else {
      alert(mensaje);
    }
  }

  mostrarAlertaError(mensaje) {
    const alertEl = this.querySelector('#errorAlert');
    const msgEl = this.querySelector('#errorMessage');
    if (alertEl && msgEl) {
      msgEl.textContent = mensaje;
      alertEl.classList.remove('d-none');
      setTimeout(() => alertEl.classList.add('d-none'), 4000);
    } else {
      alert(mensaje);
    }
  }
}

customElements.define('app-permission-index', PermissionIndexComponent);
