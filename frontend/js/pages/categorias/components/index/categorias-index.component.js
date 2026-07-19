import { BaseComponent } from '../../../../core/base-component.js';
import { CategoriaIncidenciaService } from '../../services/categoria-incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { UIHelper } from '../../../../shared/utils/ui-helper.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

export class CategoriasIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/categorias/components/index/categorias-index.component.html');
    this.categoriaModalObj = null;
    this.categoriasList = [];
  }

  async onInit() {
    console.log('Módulo de Categorías de Incidencias inicializado.');

    // Initialize Bootstrap Modal
    try {
      this.categoriaModalObj = new bootstrap.Modal(this.querySelector('#categoriaModal'));
    } catch (e) {
      console.warn('Error al inicializar el modal de categorías.', e);
    }

    const btnNuevaCategoria = this.querySelector('#btnNuevaCategoria');

    // Check permissions
    if (btnNuevaCategoria) {
      if (!AuthService.hasPermission('CREATE', 'categorias')) {
        btnNuevaCategoria.classList.add('d-none');
      } else {
        btnNuevaCategoria.addEventListener('click', () => this.abrirModalCategoria());
      }
    }

    const categoriaForm = this.querySelector('#categoriaForm');
    if (categoriaForm) {
      categoriaForm.addEventListener('submit', (e) => this.guardarCategoria(e));
    }

    // Load initial data
    this.cargarCategorias();
  }

  async cargarCategorias() {
    const container = this.querySelector('#categoriasTableContainer');
    const tbody = this.querySelector('#tbody-categorias');

    if (!container || !tbody) return;

    try {
      const response = await CategoriaIncidenciaService.getAll();
      this.categoriasList = response || [];

      if (this.categoriasList.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="text-center py-5 text-muted">No se encontraron categorías de incidencias registradas.</td></tr>';
        container.classList.remove('d-none');
        return;
      }

      // Group categories: Main (parent_id is null) and Subcategories
      const mainCategories = this.categoriasList.filter((c) => c.parent_id === null);
      const subCategories = this.categoriasList.filter((c) => c.parent_id !== null);

      const canEdit = AuthService.hasPermission('UPDATE', 'categorias');
      const canDelete = AuthService.hasPermission('DELETE', 'categorias');
      const canCreate = AuthService.hasPermission('CREATE', 'categorias');

      let rowsHtml = '';

      mainCategories.forEach((main) => {
        const subs = subCategories.filter((sub) => sub.parent_id === main.id);
        const hasChildren = subs.length > 0;

        // Render Parent Row
        rowsHtml += `
          <tr class="parent-row cursor-pointer" data-id="${main.id}">
            <td class="ps-4 fw-bold text-dark">
              <div class="d-flex align-items-center">
                ${
                  hasChildren
                    ? `<i class="bi bi-chevron-right me-2 text-primary toggle-chevron fs-6 rotate-transition" data-id="${main.id}"></i>`
                    : `<i class="bi bi-dot me-2 text-muted fs-5"></i>`
                }
                <span>${main.nombre}</span>
              </div>
            </td>
            <td class="text-muted small">${main.descripcion || 'Sin descripción.'}</td>
            <td>
              <span class="badge bg-${main.activo ? 'success' : 'danger'}-soft text-${main.activo ? 'success' : 'danger'} rounded-pill px-2.5 py-1 small fw-semibold">
                ${main.activo ? 'Activa' : 'Inactiva'}
              </span>
            </td>
            <td class="text-end pe-4">
              <div class="dropdown" onclick="event.stopPropagation()">
                <button class="btn btn-light btn-sm text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-three-dots-vertical fs-6"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                  ${canCreate ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-success small fw-medium" type="button" data-action="agregar-sub"><i class="bi bi-plus-circle"></i> Agregar Subcategoría</button></li>` : ''}
                  ${canEdit ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium" type="button" data-action="editar"><i class="bi bi-pencil-square"></i> Editar</button></li>` : ''}
                  ${canDelete ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium" type="button" data-action="eliminar"><i class="bi bi-trash"></i> Eliminar</button></li>` : ''}
                </ul>
              </div>
            </td>
          </tr>
        `;

        // Render Children Rows (initially collapsed)
        subs.forEach((sub) => {
          rowsHtml += `
            <tr class="child-row d-none table-row-child" data-parent-id="${main.id}" data-id="${sub.id}">
              <td class="ps-5 text-dark">
                <div class="d-flex align-items-center">
                  <i class="bi bi-arrow-return-right text-muted me-2 small"></i>
                  <span class="fw-medium small">${sub.nombre}</span>
                </div>
              </td>
              <td class="text-muted small">${sub.descripcion || 'Sin descripción.'}</td>
              <td>
                <span class="badge bg-${sub.activo ? 'success' : 'danger'}-soft text-${sub.activo ? 'success' : 'danger'} rounded-pill px-2 py-0.5" style="font-size: 0.75rem;">
                  ${sub.activo ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td class="text-end pe-4">
                <div class="dropdown" onclick="event.stopPropagation()">
                  <button class="btn btn-light btn-sm text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots-vertical fs-6"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                    ${canEdit ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium" type="button" data-action="editar"><i class="bi bi-pencil-square"></i> Editar</button></li>` : ''}
                    ${canDelete ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium" type="button" data-action="eliminar"><i class="bi bi-trash"></i> Eliminar</button></li>` : ''}
                  </ul>
                </div>
              </td>
            </tr>
          `;
        });
      });

      tbody.innerHTML = rowsHtml;

      // Bind Toggle Collapse and Action events
      mainCategories.forEach((main) => {
        const parentRow = tbody.querySelector(`tr.parent-row[data-id="${main.id}"]`);
        const chevron = parentRow.querySelector('.toggle-chevron');
        const childRows = tbody.querySelectorAll(`tr.child-row[data-parent-id="${main.id}"]`);

        // Toggle children visibility
        if (parentRow && childRows.length > 0) {
          const toggleCollapse = () => {
            const isCollapsed = childRows[0].classList.contains('d-none');
            childRows.forEach((row) => {
              if (isCollapsed) {
                row.classList.remove('d-none');
              } else {
                row.classList.add('d-none');
              }
            });

            if (isCollapsed) {
              chevron.classList.replace('bi-chevron-right', 'bi-chevron-down');
              parentRow.classList.add('table-active');
            } else {
              chevron.classList.replace('bi-chevron-down', 'bi-chevron-right');
              parentRow.classList.remove('table-active');
            }
          };

          parentRow.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            toggleCollapse();
          });
        }

        // Action buttons on main category
        const btnAddSub = parentRow.querySelector('[data-action="agregar-sub"]');
        if (btnAddSub) {
          btnAddSub.addEventListener('click', () => this.abrirModalCategoria(null, main.id));
        }

        const btnEditMain = parentRow.querySelector('[data-action="editar"]');
        if (btnEditMain) {
          btnEditMain.addEventListener('click', () => this.abrirModalCategoria(main));
        }

        const btnDelMain = parentRow.querySelector('[data-action="eliminar"]');
        if (btnDelMain) {
          btnDelMain.addEventListener('click', () => this.eliminarCategoria(main.id, main.nombre));
        }

        // Action buttons on subcategories
        const subs = subCategories.filter((sub) => sub.parent_id === main.id);
        subs.forEach((sub) => {
          const childRow = tbody.querySelector(`tr.child-row[data-id="${sub.id}"]`);
          if (childRow) {
            const btnEditSub = childRow.querySelector('[data-action="editar"]');
            if (btnEditSub) {
              btnEditSub.addEventListener('click', () => this.abrirModalCategoria(sub));
            }

            const btnDelSub = childRow.querySelector('[data-action="eliminar"]');
            if (btnDelSub) {
              btnDelSub.addEventListener('click', () => this.eliminarCategoria(sub.id, sub.nombre));
            }
          }
        });
      });

      this.llenarParentSelect();
      container.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando categorías:', error);
      ToastService.error(`No se pudo cargar el listado de categorías: ${error.message}`);
    }
  }

  llenarParentSelect(excludeId = null) {
    const select = this.querySelector('#categoriaParentSelect');
    if (!select) return;

    // Filter out the category itself (if editing) to prevent circular parenting
    const filtered = this.categoriasList.filter((c) => c.activo && c.id != excludeId);

    const optionsHtml = filtered
      .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
      .join('');

    select.innerHTML = `<option value="">-- Ninguna (Categoría Raíz) --</option>${optionsHtml}`;
  }

  abrirModalCategoria(categoria = null, parentId = null) {
    const modalTitle = this.querySelector('#categoriaModalLabel');
    const form = this.querySelector('#categoriaForm');
    const inputId = this.querySelector('#categoriaId');
    const inputNombre = this.querySelector('#categoriaNombre');
    const inputDescripcion = this.querySelector('#categoriaDescripcion');
    const selectParent = this.querySelector('#categoriaParentSelect');
    const inputActivo = this.querySelector('#categoriaActivo');
    const errorAlert = this.querySelector('#categoriaModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    // Fill parent select, excluding the current category
    this.llenarParentSelect(categoria ? categoria.id : null);

    if (categoria) {
      modalTitle.textContent = 'Editar Categoría';
      inputId.value = categoria.id;
      inputNombre.value = categoria.nombre;
      inputDescripcion.value = categoria.descripcion || '';
      selectParent.value = categoria.parent_id || '';
      inputActivo.checked = categoria.activo;
    } else {
      modalTitle.textContent = 'Nueva Categoría';
      inputId.value = '';
      inputNombre.value = '';
      inputDescripcion.value = '';
      selectParent.value = parentId || '';
      inputActivo.checked = true;
    }

    this.categoriaModalObj.show();
  }

  async guardarCategoria(e) {
    e.preventDefault();
    const form = this.querySelector('#categoriaForm');
    const errorAlert = this.querySelector('#categoriaModalErrorAlert');
    const errorMessage = this.querySelector('#categoriaModalErrorMessage');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = this.querySelector('#categoriaId').value;
    const parentVal = this.querySelector('#categoriaParentSelect').value;

    const payload = {
      nombre: this.querySelector('#categoriaNombre').value,
      descripcion: this.querySelector('#categoriaDescripcion').value || null,
      parent_id: parentVal ? parseInt(parentVal) : null,
      activo: this.querySelector('#categoriaActivo').checked,
    };

    try {
      if (id) {
        await CategoriaIncidenciaService.update(id, payload);
        ToastService.success(`Categoría "${payload.nombre}" actualizada con éxito.`);
      } else {
        await CategoriaIncidenciaService.create(payload);
        ToastService.success(`Categoría "${payload.nombre}" creada con éxito.`);
      }

      this.categoriaModalObj.hide();
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarCategoria(id, nombre) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Categoría',
      `¿Está seguro de que desea eliminar la categoría "${nombre}"?<br>Se comprobará que no tenga subcategorías asociadas.`,
      'Eliminar',
      'Cancelar',
      'btn-danger'
    );

    if (!isConfirmed) return;

    try {
      await CategoriaIncidenciaService.delete(id);
      ToastService.success(`Categoría "${nombre}" eliminada con éxito.`);
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      ToastService.error(`No se pudo eliminar: ${error.message}`);
    }
  }
}

customElements.define('app-categorias-index', CategoriasIndexComponent);
