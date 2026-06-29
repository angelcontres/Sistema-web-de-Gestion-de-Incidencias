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
    const grid = this.querySelector('#categoriasGrid');
    const spinner = this.querySelector('#loadingSpinner');
    const emptyState = this.querySelector('#emptyState');

    if (!grid) return;

    spinner.classList.remove('d-none');
    grid.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    try {
      const response = await CategoriaIncidenciaService.getAll();
      this.categoriasList = response || [];

      if (this.categoriasList.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        spinner.classList.add('d-none');
        return;
      }

      // Group categories: Main (parent_id is null) and Subcategories
      const mainCategories = this.categoriasList.filter(c => c.parent_id === null);
      const subCategories = this.categoriasList.filter(c => c.parent_id !== null);

      const canEdit = AuthService.hasPermission('Actualizar Categoría de Incidencia');
      const canDelete = AuthService.hasPermission('Eliminar Categoría de Incidencia');
      const canCreate = AuthService.hasPermission('Crear Categoría de Incidencia');

      grid.innerHTML = mainCategories.map(main => {
        const subs = subCategories.filter(sub => sub.parent_id === main.id);
        
        return `
          <div class="col-xl-6 col-lg-12">
            <div class="card border-0 shadow-sm h-100 custom-card">
              <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 pe-3 text-truncate">
                  <h5 class="fw-bold text-primary mb-1 text-truncate">${main.nombre}</h5>
                  <p class="text-muted small mb-0 text-truncate">${main.descripcion || 'Sin descripción.'}</p>
                </div>
                
                ${(canEdit || canDelete) ? `
                  <div class="dropdown">
                    <button class="btn btn-light btn-sm text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                      ${canEdit ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium" type="button" data-action="editar-principal" data-id="${main.id}"><i class="bi bi-pencil-square"></i> Editar</button></li>` : ''}
                      ${canDelete ? `<li><button class="dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium" type="button" data-action="eliminar-principal" data-id="${main.id}"><i class="bi bi-trash"></i> Eliminar</button></li>` : ''}
                    </ul>
                  </div>
                ` : ''}
              </div>

              <div class="card-body px-4 py-2">
                <div class="list-group list-group-flush border-top border-light">
                  ${subs.length === 0 ? `
                    <div class="text-center py-4 text-muted small">
                      <i class="bi bi-tag me-1"></i> No hay subcategorías registradas.
                    </div>
                  ` : subs.map(sub => `
                    <div class="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-light">
                      <div class="flex-grow-1 pe-3">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                          <span class="fw-semibold text-dark small">${sub.nombre}</span>
                          <span class="badge bg-${sub.activo ? 'success' : 'danger'}-soft text-${sub.activo ? 'success' : 'danger'} rounded-pill px-2 py-0.5" style="font-size: 0.7rem;">
                            ${sub.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <p class="text-muted small mb-0 mt-1" style="line-height: 1.3;">${sub.descripcion || 'Sin descripción.'}</p>
                      </div>
                      
                      ${(canEdit || canDelete) ? `
                        <div class="d-flex align-items-center gap-1">
                          ${canEdit ? `
                            <button class="btn btn-sm btn-link text-primary p-1 border-0 bg-transparent" type="button" data-action="editar-sub" data-id="${sub.id}" title="Editar">
                              <i class="bi bi-pencil-square fs-6"></i>
                            </button>
                          ` : ''}
                          ${canDelete ? `
                            <button class="btn btn-sm btn-link text-danger p-1 border-0 bg-transparent" type="button" data-action="eliminar-sub" data-id="${sub.id}" title="Eliminar">
                              <i class="bi bi-trash fs-6"></i>
                            </button>
                          ` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>

              ${canCreate ? `
                <div class="card-footer bg-white border-top-0 px-4 pb-4 pt-2">
                  <button class="btn btn-sm btn-light text-primary fw-semibold w-100 py-2 border-0 d-flex align-items-center justify-content-center gap-1" type="button" data-action="agregar-sub" data-parent-id="${main.id}">
                    <i class="bi bi-plus-lg"></i> Agregar Subcategoría
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Bind actions
      mainCategories.forEach(main => {
        const cardEl = grid.querySelector(`[data-action="editar-principal"][data-id="${main.id}"]`);
        if (cardEl) {
          cardEl.addEventListener('click', () => this.abrirModalCategoria(main));
        }

        const delEl = grid.querySelector(`[data-action="eliminar-principal"][data-id="${main.id}"]`);
        if (delEl) {
          delEl.addEventListener('click', () => this.eliminarCategoria(main.id, main.nombre));
        }

        const addSubEl = grid.querySelector(`[data-action="agregar-sub"][data-parent-id="${main.id}"]`);
        if (addSubEl) {
          addSubEl.addEventListener('click', () => this.abrirModalCategoria(null, main.id));
        }

        // Bind subcategories events
        const subs = subCategories.filter(sub => sub.parent_id === main.id);
        subs.forEach(sub => {
          const editSubEl = grid.querySelector(`[data-action="editar-sub"][data-id="${sub.id}"]`);
          if (editSubEl) {
            editSubEl.addEventListener('click', () => this.abrirModalCategoria(sub));
          }

          const delSubEl = grid.querySelector(`[data-action="eliminar-sub"][data-id="${sub.id}"]`);
          if (delSubEl) {
            delSubEl.addEventListener('click', () => this.eliminarCategoria(sub.id, sub.nombre));
          }
        });
      });

      this.llenarParentSelect();
      spinner.classList.add('d-none');
      grid.classList.remove('d-none');
    } catch (error) {
      console.error('Error cargando categorías:', error);
      spinner.classList.add('d-none');
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
