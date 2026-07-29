import { BaseComponent } from '../../../../core/base-component.js';
import { CategoriaIncidenciaService } from '../../services/categoria-incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { apiRequest } from '../../../../core/api.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';
import { InstitucionService } from '../../../instituciones/services/institucion.service.js';

export class CategoriasIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/categorias/components/index/categorias-index.component.html');
    this.categoriaModalObj = null;
    this.categoriasList = [];
    this.prioridadesList = [];
    this.institucionesList = [];
    this._catalogsLoaded = false;
    // Track which parent rows are expanded (by parent id)
    this.expandedGroups = new Set();
  }

  async onInit() {
    console.log('Módulo de Categorías de Incidencias inicializado.');

    this._initModal();
    this._initPermissions();
    this._initForm();
    this._cargarCatalogos();
    this._initTableEvents();

    await this.cargarCategorias();
  }

  _initModal() {
    try {
      this.categoriaModalObj = new bootstrap.Modal(this.querySelector('#categoriaModal'));
    } catch (e) {
      console.warn('Error al inicializar el modal de categorías.', e);
    }
  }

  _initPermissions() {
    const btnNuevaCategoria = this.querySelector('#btnNuevaCategoria');
    if (!btnNuevaCategoria) return;

    if (!AuthService.hasPermission('CREATE', 'categorias')) {
      btnNuevaCategoria.classList.add('d-none');
    } else {
      btnNuevaCategoria.addEventListener('click', () => this.abrirModalCategoria());
    }
  }

  _initForm() {
    const categoriaForm = this.querySelector('#categoriaForm');
    if (categoriaForm) {
      categoriaForm.addEventListener('submit', (e) => this.guardarCategoria(e));
    }
  }

  _initTableEvents() {
    const tbody = this.querySelector('#cat-tbody');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-toggle-group]');
      if (toggleBtn) {
        this._toggleGroup(toggleBtn.dataset.toggleGroup);
        return;
      }

      const actionBtn = e.target.closest('[data-cat-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.catAction;
        const id = Number(actionBtn.dataset.catId);
        const cat = this.categoriasList.find((c) => c.id === id);
        if (cat) this._handleTableAction(action, cat);
      }
    });
  }

  _handleTableAction(action, cat) {
    if (action === 'agregar-sub') {
      const parentId = cat.parent_id === null || cat.parent_id === undefined ? cat.id : cat.parent_id;
      this.abrirModalCategoria(null, parentId);
    } else if (action === 'editar') {
      this.abrirModalCategoria(cat);
    } else if (action === 'eliminar') {
      this.eliminarCategoria(cat.id, cat.nombre);
    }
  }

  // ─────────────────────────────────────────────────────────
  // CATALOGS (prioridades + instituciones)
  // ─────────────────────────────────────────────────────────

  async _cargarCatalogos() {
    try {
      const [priResp, instResp] = await Promise.all([
        apiRequest('/priorities'),
        InstitucionService.getAll(1, 15, null, { all: true }),
      ]);
      this.prioridadesList = Array.isArray(priResp) ? priResp : priResp.data || [];
      this.institucionesList = Array.isArray(instResp) ? instResp : instResp.data || [];
      this._catalogsLoaded = true;
    } catch (err) {
      console.warn('No se pudieron cargar los catálogos de prioridades/instituciones:', err);
      this.prioridadesList = [];
      this.institucionesList = [];
      this._catalogsLoaded = true;
    }
  }

  _llenarSelectPrioridad(selectedId = null) {
    const select = this.querySelector('#categoriaPrioridadSelect');
    if (!select) return;
    select.innerHTML =
      `<option value="">-- Sin prioridad por defecto --</option>` +
      this.prioridadesList
        .map(
          (p) =>
            `<option value="${p.id}" ${Number(selectedId) === p.id ? 'selected' : ''}>${p.nombre}</option>`
        )
        .join('');
  }

  _llenarSelectInstitucion(selectedId = null) {
    const select = this.querySelector('#categoriaInstitucionSelect');
    if (!select) return;
    select.innerHTML =
      `<option value="">-- Sin institución asignada --</option>` +
      this.institucionesList
        .map(
          (i) =>
            `<option value="${i.id}" ${Number(selectedId) === i.id ? 'selected' : ''}>${i.nombre}</option>`
        )
        .join('');
  }

  // ─────────────────────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────────────────────

  async cargarCategorias() {
    try {
      this._setLoadingState('loading');

      const resp = await CategoriaIncidenciaService.getAll(1, 15, null, undefined, { all: true });
      this.categoriasList = Array.isArray(resp) ? resp : resp.data || [];

      if (this.categoriasList.length === 0) {
        this._setLoadingState('empty');
        return;
      }

      this._setLoadingState('ready');
      this._renderAccordion();
      this.llenarParentSelect();

      const badge = this.querySelector('#cat-total-badge');
      if (badge) {
        badge.textContent = `${this.categoriasList.length} categorías`;
        badge.classList.remove('d-none');
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      this._setLoadingState('error', error.message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  _renderAccordion() {
    const tbody = this.querySelector('#cat-tbody');
    if (!tbody) return;

    const canCreate = AuthService.hasPermission('CREATE', 'categorias');
    const canEdit = AuthService.hasPermission('UPDATE', 'categorias');
    const canDelete = AuthService.hasPermission('DELETE', 'categorias');

    const mainCategories = this.categoriasList.filter(
      (c) => c.parent_id === null || c.parent_id === undefined
    );
    
    const subMap = this._buildSubCategoriesMap();

    let html = this._buildMainCategoriesHtml(mainCategories, subMap, canCreate, canEdit, canDelete);
    html += this._buildOrphanCategoriesHtml(mainCategories, canEdit, canDelete);

    tbody.innerHTML = html;
  }

  _buildSubCategoriesMap() {
    const subMap = {};
    this.categoriasList
      .filter((c) => c.parent_id !== null && c.parent_id !== undefined)
      .forEach((sub) => {
        if (!subMap[sub.parent_id]) subMap[sub.parent_id] = [];
        subMap[sub.parent_id].push(sub);
      });
    return subMap;
  }

  _buildMainCategoriesHtml(mainCategories, subMap, canCreate, canEdit, canDelete) {
    let html = '';
    mainCategories.forEach((parent) => {
      const subs = subMap[parent.id] || [];
      const hasSubs = subs.length > 0;
      const isExpanded = this.expandedGroups.has(String(parent.id));
      
      const toggleIcon = this._buildToggleIcon(parent.id, hasSubs, isExpanded);

      html += this._parentRow(parent, subs.length, toggleIcon, canCreate, canEdit, canDelete);

      if (hasSubs) {
        subs.forEach((sub) => {
          html += this._childRow(sub, parent.id, isExpanded, canEdit, canDelete);
        });
      }
    });
    return html;
  }

  _buildToggleIcon(parentId, hasSubs, isExpanded) {
    if (!hasSubs) {
      return `<span class="me-2" style="display:inline-block;width:1.4rem;"></span>`;
    }
    const toogleExpand = isExpanded ? 'Colapsar' : 'Expandir';
    const toogleIconDirection = isExpanded ? 'down' : 'right';

    return `<button
        class="btn btn-sm p-0 border-0 bg-transparent me-2 text-primary cat-toggle-btn"
        data-toggle-group="${parentId}"
        title="${toogleExpand} subcategorías"
        style="line-height:1; transition: transform 0.2s;"
      >
        <i class="bi bi-chevron-${toogleIconDirection}" style="font-size:0.8rem;"></i>
      </button>`;
  }

  _buildOrphanCategoriesHtml(mainCategories, canEdit, canDelete) {
    const orphans = this.categoriasList.filter(
      (c) =>
        c.parent_id !== null &&
        c.parent_id !== undefined &&
        !mainCategories.some((m) => m.id === c.parent_id)
    );

    if (orphans.length === 0) return '';

    let html = `<tr class="table-light">
      <td colspan="4" class="ps-4 py-2 text-muted small fst-italic">
        <i class="bi bi-exclamation-circle me-1"></i>Subcategorías huérfanas
      </td>
    </tr>`;
    
    orphans.forEach((sub) => {
      html += this._childRow(sub, null, true, canEdit, canDelete);
    });

    return html;
  }

  _parentRow(cat, subCount, toggleIcon, canCreate, canEdit, canDelete) {
    const statusBadge = this._statusBadge(cat.activo);
    const actionsMenu = this._actionsDropdown(cat, canCreate, canEdit, canDelete, true);

    return `
    <tr
      class="cat-parent-row border-bottom"
      data-parent-id="${cat.id}"
      style="background-color: var(--card-bg); font-weight: 600;"
    >
      <td class="ps-4 py-3">
        <div class="d-flex align-items-center">
          ${toggleIcon}
          
          <span>${cat.nombre}</span>
          ${subCount > 0 ? `<span class="badge bg-primary-soft text-primary ms-2 fw-normal" style="font-size:0.7rem;">${subCount} sub</span>` : ''}
        </div>
      </td>
      <td class="py-3 text-muted fw-normal small align-middle">${cat.descripcion || '<span class="fst-italic">Sin descripción</span>'}</td>
      <td class="py-3 align-middle">${statusBadge}</td>
      <td class="py-3 text-end pe-4 align-middle">${actionsMenu}</td>
    </tr>`;
  }

  _childRow(cat, parentId, visible, canEdit, canDelete) {
    const statusBadge = this._statusBadge(cat.activo);
    const actionsMenu = this._actionsDropdown(cat, false, canEdit, canDelete, false);

    return `
    <tr
      class="cat-child-row border-bottom${visible ? '' : ' d-none'}"
      data-child-of="${parentId}"
      style="background-color: rgba(14,54,89,0.02);"
    >
      <td class="ps-5 py-2">
        <div class="d-flex align-items-center">
          <i class="bi bi-arrow-return-right ps-3 text-muted me-2 small"></i>
          <span class="fw-normal text-dark" style="font-size:0.92rem;">${cat.nombre}</span>
        </div>
      </td>
      <td class="py-2 text-muted small align-middle">${cat.descripcion || '<span class="fst-italic">Sin descripción</span>'}</td>
      <td class="py-2 align-middle">${statusBadge}</td>
      <td class="py-2 text-end pe-4 align-middle">${actionsMenu}</td>
    </tr>`;
  }

  _statusBadge(activo) {
    return activo
      ? `<span class="badge rounded-pill px-2 py-1 small fw-semibold" style="background:rgba(78,125,127,0.12);color:var(--secondary-color);">Activa</span>`
      : `<span class="badge rounded-pill px-2 py-1 small fw-semibold" style="background:rgba(217,138,47,0.12);color:var(--highlight-color);">Inactiva</span>`;
  }

  _actionsDropdown(cat, canCreate, canEdit, canDelete, isParent) {
    const items = [];

    if (canCreate && isParent) {
      items.push(`
        <li>
          <button class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-success fw-medium"
            type="button" data-cat-action="agregar-sub" data-cat-id="${cat.id}">
            <i class="bi bi-plus-circle"></i> Agregar Subcategoría
          </button>
        </li>`);
    }
    if (canEdit) {
      items.push(`
        <li>
          <button class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-primary fw-medium"
            type="button" data-cat-action="editar" data-cat-id="${cat.id}">
            <i class="bi bi-pencil-square"></i> Editar
          </button>
        </li>`);
    }
    if (canDelete) {
      if (items.length > 0) items.push('<li><hr class="dropdown-divider my-1"></li>');
      items.push(`
        <li>
          <button class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-danger fw-medium"
            type="button" data-cat-action="eliminar" data-cat-id="${cat.id}">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </li>`);
    }

    if (items.length === 0) return '';

    return `
      <div class="dropdown">
        <button class="btn btn-light text-secondary p-1 rounded-2 border-0" type="button"
          data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots-vertical fs-6"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 py-1">
          ${items.join('')}
        </ul>
      </div>`;
  }

  // ─────────────────────────────────────────────────────────
  // ACCORDION TOGGLE
  // ─────────────────────────────────────────────────────────

  _toggleGroup(parentId) {
    const key = String(parentId);
    const isNowExpanded = !this.expandedGroups.has(key);

    if (isNowExpanded) {
      this.expandedGroups.add(key);
    } else {
      this.expandedGroups.delete(key);
    }

    // Toggle child rows visibility
    const childRows = this.querySelectorAll(`[data-child-of="${parentId}"]`);
    childRows.forEach((tr) => {
      tr.classList.toggle('d-none', !isNowExpanded);
    });

    // Rotate chevron icon
    const toggleBtn = this.querySelector(`[data-toggle-group="${parentId}"]`);
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = `bi bi-chevron-${isNowExpanded ? 'down' : 'right'}`;
      }
      toggleBtn.title = `${isNowExpanded ? 'Colapsar' : 'Expandir'} subcategorías`;
    }
  }

  // ─────────────────────────────────────────────────────────
  // STATES
  // ─────────────────────────────────────────────────────────

  _setLoadingState(state, errorMsg = '') {
    const loading = this.querySelector('#cat-loading');
    const empty = this.querySelector('#cat-empty');
    const error = this.querySelector('#cat-error');
    const container = this.querySelector('#cat-table-container');
    const badge = this.querySelector('#cat-total-badge');

    [loading, empty, error, container].forEach((el) => el?.classList.add('d-none'));
    badge?.classList.add('d-none');

    if (state === 'loading') loading?.classList.remove('d-none');
    if (state === 'empty') empty?.classList.remove('d-none');
    if (state === 'ready') container?.classList.remove('d-none');
    if (state === 'error') {
      error?.classList.remove('d-none');
      const msgEl = this.querySelector('#cat-error-msg');
      if (msgEl) msgEl.textContent = errorMsg || 'Error al cargar las categorías.';
    }
  }

  // ─────────────────────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────────────────────

  llenarParentSelect(excludeId = null) {
    const select = this.querySelector('#categoriaParentSelect');
    if (!select) return;

    const filtered = this.categoriasList.filter(
      (c) => c.activo && c.id != excludeId && (c.parent_id === null || c.parent_id === undefined)
    );

    select.innerHTML =
      `<option value="">-- Ninguna (Categoría Raíz) --</option>` +
      filtered.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');
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
    this.llenarParentSelect(categoria ? categoria.id : null);
    this._llenarSelectPrioridad(categoria ? categoria.prioridad_id : null);
    this._llenarSelectInstitucion(categoria ? categoria.institucion_id : null);

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
    const prioVal = this.querySelector('#categoriaPrioridadSelect').value;
    const instVal = this.querySelector('#categoriaInstitucionSelect').value;
    const payload = {
      nombre: this.querySelector('#categoriaNombre').value,
      descripcion: this.querySelector('#categoriaDescripcion').value || null,
      parent_id: parentVal ? Number.parseInt(parentVal) : null,
      prioridad_id: prioVal ? Number.parseInt(prioVal) : null,
      institucion_id: instVal ? Number.parseInt(instVal) : null,
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
    CatalogoService.clearCategoriasCache();
  }

  async eliminarCategoria(id, nombre) {
    const isConfirmed = await ModalService.confirm(
      'Eliminar Categoría',
      `¿Está seguro de que desea eliminar la categoría "<strong>${nombre}</strong>"?<br>Se comprobará que no tenga subcategorías asociadas.`,
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
    CatalogoService.clearCategoriasCache();
  }
}

customElements.define('app-categorias-index', CategoriasIndexComponent);
