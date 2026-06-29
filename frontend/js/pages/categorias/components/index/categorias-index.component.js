import { BaseComponent } from '../../../../core/base-component.js';
import { CategoriaIncidenciaService } from '../../services/categoria-incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';

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
    const isAdmin = AuthService.isAdmin();

    // Check permissions
    if (btnNuevaCategoria) {
      if (!AuthService.hasPermission('Crear Categoría de Incidencia')) {
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
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">No se encontraron categorías de incidencias registradas.</td></tr>';
        container.classList.remove('d-none');
        return;
      }

      // Group categories: Main (parent_id is null) and Subcategories
      const mainCategories = this.categoriasList.filter(c => c.parent_id === null);
      const subCategories = this.categoriasList.filter(c => c.parent_id !== null);

      const canEdit = AuthService.hasPermission('Actualizar Categoría de Incidencia');
      const canDelete = AuthService.hasPermission('Eliminar Categoría de Incidencia');
      const canCreate = AuthService.hasPermission('Crear Categoría de Incidencia');

      let rowsHtml = '';

      mainCategories.forEach(main => {
        const subs = subCategories.filter(sub => sub.parent_id === main.id);
        const hasChildren = subs.length > 0;

        // Render Parent Row
        rowsHtml += `
          <tr class="parent-row" data-id="${main.id}" style="cursor: pointer;">
            <td class="ps-4 fw-bold text-dark">
              <div class="d-flex align-items-center">
                ${hasChildren 
                  ? `<i class="bi bi-chevron-right me-2 text-primary toggle-chevron fs-6" style="transition: transform 0.2s ease;" data-id="${main.id}"></i>` 
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
              <div class="d-flex justify-content-end gap-1" onclick="event.stopPropagation()">
                ${canCreate ? `
                  <button class="btn btn-sm btn-link text-success p-1 border-0 bg-transparent" type="button" data-action="agregar-sub" data-parent-id="${main.id}" title="Agregar Subcategoría">
                    <i class="bi bi-plus-circle fs-5"></i>
                  </button>
                ` : ''}
                ${canEdit ? `
                  <button class="btn btn-sm btn-link text-primary p-1 border-0 bg-transparent" type="button" data-action="editar" data-id="${main.id}" title="Editar">
                    <i class="bi bi-pencil-square fs-5"></i>
                  </button>
                ` : ''}
                ${canDelete ? `
                  <button class="btn btn-sm btn-link text-danger p-1 border-0 bg-transparent" type="button" data-action="eliminar" data-id="${main.id}" title="Eliminar">
                    <i class="bi bi-trash fs-5"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;

        // Render Children Rows (initially collapsed)
        subs.forEach(sub => {
          rowsHtml += `
            <tr class="child-row d-none bg-light-soft" data-parent-id="${main.id}" data-id="${sub.id}" style="--bs-bg-opacity: 0.2; background-color: var(--bs-light);">
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
                <div class="d-flex justify-content-end gap-1" onclick="event.stopPropagation()">
                  ${canEdit ? `
                    <button class="btn btn-sm btn-link text-primary p-1 border-0 bg-transparent" type="button" data-action="editar" data-id="${sub.id}" title="Editar">
                      <i class="bi bi-pencil-square fs-5"></i>
                    </button>
                  ` : ''}
                  ${canDelete ? `
                    <button class="btn btn-sm btn-link text-danger p-1 border-0 bg-transparent" type="button" data-action="eliminar" data-id="${sub.id}" title="Eliminar">
                      <i class="bi bi-trash fs-5"></i>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        });
      });

      tbody.innerHTML = rowsHtml;

      // Bind Toggle Collapse and Action events
      mainCategories.forEach(main => {
        const parentRow = tbody.querySelector(`tr.parent-row[data-id="${main.id}"]`);
        const chevron = parentRow.querySelector('.toggle-chevron');
        const childRows = tbody.querySelectorAll(`tr.child-row[data-parent-id="${main.id}"]`);

        // Toggle children visibility
        if (parentRow && childRows.length > 0) {
          const toggleCollapse = () => {
            const isCollapsed = childRows[0].classList.contains('d-none');
            childRows.forEach(row => {
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
        const subs = subCategories.filter(sub => sub.parent_id === main.id);
        subs.forEach(sub => {
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
      this.mostrarAlertaLocal('error', 'Error al cargar el listado de categorías.');
    }
  }

  llenarParentSelect(excludeId = null) {
    const select = this.querySelector('#categoriaParentSelect');
    if (!select) return;

    // Filter out the category itself (if editing) to prevent circular parenting
    const filtered = this.categoriasList.filter(c => c.activo && c.id != excludeId);

    const optionsHtml = filtered
      .map(c => `<option value="${c.id}">${c.nombre}</option>`)
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
        this.mostrarAlertaLocal('success', 'Categoría de incidencia actualizada con éxito.');
      } else {
        await CategoriaIncidenciaService.create(payload);
        this.mostrarAlertaLocal('success', 'Categoría de incidencia creada con éxito.');
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
    if (!confirm(`¿Está seguro de que desea eliminar la categoría "${nombre}"? Se comprobará que no tenga subcategorías asociadas.`)) return;

    try {
      await CategoriaIncidenciaService.delete(id);
      this.mostrarAlertaLocal('success', `Categoría "${nombre}" eliminada con éxito.`);
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      this.mostrarAlertaLocal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  mostrarAlertaLocal(tipo, mensaje) {
    const successAlert = this.querySelector('#categoriasSuccessAlert');
    const successMsg = this.querySelector('#categoriasSuccessMessage');
    const errorAlert = this.querySelector('#categoriasErrorAlert');
    const errorMsg = this.querySelector('#categoriasErrorMessage');

    if (tipo === 'success') {
      errorAlert.classList.add('d-none');
      successMsg.textContent = mensaje;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 5000);
    } else {
      successAlert.classList.add('d-none');
      errorMsg.textContent = mensaje;
      errorAlert.classList.remove('d-none');
      setTimeout(() => errorAlert.classList.add('d-none'), 6000);
    }
  }
}

customElements.define('app-categorias-index', CategoriasIndexComponent);
