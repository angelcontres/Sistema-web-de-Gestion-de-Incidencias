import { BaseComponent } from '../../../../core/base-component.js';
import { InstitucionService } from '../../services/institucion.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

export class InstitucionIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/instituciones/components/index/institucion-index.component.html');
    this.institucionesList = [];
    this.searchTimeout = null;
    this.institucionModalObj = null;
  }

  async onInit() {
    console.log('Módulo de Instituciones inicializado.');

    const searchInput = this.querySelector('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          const tblDatos = this.querySelector('#tbl-datos-instituciones');
          if (tblDatos) {
            tblDatos.load((page, perPage, cursor) =>
              InstitucionService.getAll(page, perPage, cursor, { search: e.target.value })
            );
          }
        }, 500);
      });
    }

    // Event listeners
    const btnNuevoRegistro = this.querySelector('#btn-nuevo-registro');
    const isAdmin = AuthService.isAdmin();

    if (btnNuevoRegistro) {
      if (!isAdmin) {
        btnNuevoRegistro.classList.add('d-none');
      } else {
        btnNuevoRegistro.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      }
    }

    const tblDatos = this.querySelector('#tbl-datos-instituciones');
    if (tblDatos) {
      const columns = [
        { header: 'Nombre', key: 'nombre', class: 'ps-4 fw-bold text-dark' },
        { header: 'Siglas', key: 'siglas', class: 'text-secondary fw-semibold' },
        {
          header: 'Estado',
          render: (item) => `
            <span class="badge bg-${item.activo ? 'success' : 'danger'}-soft text-${item.activo ? 'success' : 'danger'} small fw-semibold">
              ${item.activo ? 'Activo' : 'Inactivo'}
            </span>
          `,
        },
      ];

      if (isAdmin) {
        columns.push({
          header: 'Acciones',
          class: 'text-end pe-4',
          actions: [
            { name: 'editar', label: 'Editar', icon: 'bi-pencil-square', class: 'text-primary' },
            { name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' },
          ],
        });
      }

      tblDatos.configure({ columns });

      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          this.openModal(item);
        } else if (action === 'eliminar') {
          this.eliminarInstitucion(item.id, item.nombre);
        }
      });

      // Load initial data
      tblDatos.load((page, perPage, cursor) =>
        InstitucionService.getAll(page, perPage, cursor, {})
      );
    }

    // Listen for form save event to refresh table
    this.addEventListener('institucion-guardada', () => {
      if (tblDatos) {
        const searchInput = this.querySelector('#searchInput');
        const searchValue = searchInput ? searchInput.value : '';
        tblDatos.load((page, perPage, cursor) =>
          InstitucionService.getAll(page, perPage, cursor, { search: searchValue })
        );
      }
    });
  }

  async openModal(item = null) {
    const formModal = this.querySelector('#institucionFormModal');
    if (formModal?.openModal) {
      formModal.openModal(item ? item.id : null);
    } else {
      console.error('El componente del formulario no está listo.');
    }
  }

  async eliminarInstitucion(id, nombre) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Institución',
      `¿Está seguro de que desea eliminar la institución "${nombre}"?`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );

    if (!isConfirmed) return;

    try {
      await InstitucionService.delete(id);
      ToastService.success(`Institución "${nombre}" eliminada con éxito.`);
      const tblDatos = this.querySelector('#tbl-datos-instituciones');
      if (tblDatos) {
        const searchInput = this.querySelector('#searchInput');
        const searchValue = searchInput ? searchInput.value : '';
        tblDatos.load((page, perPage, cursor) =>
          InstitucionService.getAll(page, perPage, cursor, { search: searchValue })
        );
      }
    } catch (error) {
      console.error('Error al eliminar institución:', error);
      ToastService.error(`No se pudo eliminar: ${error.message}`);
    }
  }
}

customElements.define('app-institucion-index', InstitucionIndexComponent);
