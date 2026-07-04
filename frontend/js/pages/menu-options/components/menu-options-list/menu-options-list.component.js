import { BaseComponent } from '../../../../core/base-component.js';
import { MenuOptionService } from '../../services/menu-option.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class MenuOptionsListComponent extends BaseComponent {
  constructor() {
    super('js/pages/menu-options/components/menu-options-list/menu-options-list.component.html');
  }

  async onInit() {
    const btnNuevo = this.querySelector('#btnNuevoRegistro');
    if (btnNuevo && !AuthService.hasPermission('CREATE', 'opciones_menu')) {
      btnNuevo.classList.add('d-none');
    }

    const tblDatos = this.querySelector('#tbl-datos-opciones-menu');
    if (tblDatos) {
      // 1. Configurar las columnas de forma parametrizable de acuerdo a los permisos
      const columns = [
        {
          header: 'Nombre',
          render: (opcion) => `<div class="fw-bold text-dark">${opcion.nombre || ''}</div>`,
        },
        {
          header: 'Icono',
          render: (opcion) => {
            if (!opcion.icono) return '<span class="text-muted small">-</span>';
            const cleanIcono = opcion.icono.trim().replace(/[^a-zA-Z0-9\s\-]/g, '');
            if (!cleanIcono) return '<span class="text-muted small">-</span>';
            const isBi = cleanIcono.startsWith('bi-') || cleanIcono.startsWith('bi ');
            const iconClass = isBi ? `bi ${cleanIcono}` : `bi bi-${cleanIcono}`;
            return `
              <span class="d-flex align-items-center gap-2 text-dark small">
                <i class="${iconClass} text-primary fs-5"></i>
                <code>${cleanIcono}</code>
              </span>
            `;
          },
        },
        {
          header: 'Ruta',
          render: (opcion) =>
            `<code class="text-indigo small font-monospace">${opcion.ruta || ''}</code>`,
        },
        {
          header: 'Padre',
          render: (opcion) =>
            opcion.padre && opcion.padre.nombre
              ? `
              <span class="badge bg-secondary-soft text-dark px-2.5 py-1 rounded small fw-medium">
                <i class="bi bi-folder-fill me-1 small"></i>${opcion.padre.nombre}
              </span>
            `
              : '<span class="text-muted small">-</span>',
        },
        {
          header: 'Creado el',
          render: (opcion) =>
            opcion.created_at
              ? new Date(opcion.created_at).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-',
        },
      ];

      const actions = [];
      if (AuthService.hasPermission('UPDATE', 'opciones_menu')) {
        actions.push({
          name: 'editar',
          label: 'Editar',
          icon: 'bi-pencil-square',
          class: 'text-primary',
        });
      }
      if (AuthService.hasPermission('DELETE', 'opciones_menu')) {
        actions.push({
          name: 'eliminar',
          label: 'Eliminar',
          icon: 'bi-trash',
          class: 'text-danger',
        });
      }

      if (actions.length > 0) {
        columns.push({
          header: 'Acciones',
          class: 'text-center',
          actions: actions,
        });
      }

      tblDatos.configure({
        columns: columns,
      });

      // 2. Escuchar acciones de la tabla (editar / eliminar)
      tblDatos.addEventListener('row-action', async (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          window.location.hash = `#/opciones-menu/form?id=${item.id}`;
        } else if (action === 'eliminar') {
          if (
            confirm(
              `¿Estás seguro de que deseas eliminar la opción de menú "${item.nombre}"?\nEsta acción es irreversible.`
            )
          ) {
            try {
              await MenuOptionService.delete(item.id);
              this.showSuccessMessage(`La opción "${item.nombre}" se eliminó correctamente.`);
              window.dispatchEvent(new CustomEvent('menu-change'));
              await tblDatos.load(MenuOptionService.getAll);
            } catch (error) {
              console.error('Error al eliminar opción de menú:', error);
              alert(`Error al eliminar: ${error.message}`);
            }
          }
        }
      });

      // 3. Cargar las opciones inicialmente
      tblDatos.load(MenuOptionService.getAll);
    }
  }

  /**
   * Shows a success alert temporarily.
   */
  showSuccessMessage(message) {
    const successAlert = this.querySelector('#successAlert');
    const successMessage = this.querySelector('#successMessage');
    if (successAlert && successMessage) {
      successMessage.textContent = message;
      successAlert.classList.remove('d-none');
      setTimeout(() => {
        successAlert.classList.add('d-none');
      }, 4000);
    }
  }
}

customElements.define('app-menu-options-list', MenuOptionsListComponent);
