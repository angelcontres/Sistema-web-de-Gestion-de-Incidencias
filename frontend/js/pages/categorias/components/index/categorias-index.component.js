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

    // Configure the shared data table
    const tblDatos = this.querySelector('#tbl-datos-categorias');
    if (tblDatos) {
      const columns = [
        { header: 'Nombre', key: 'nombre', class: 'ps-4 fw-bold text-dark' },
        { 
          header: 'Categoría Padre', 
          render: (cat) => cat.parent 
            ? `<span class="badge bg-secondary-soft text-secondary rounded-pill fw-semibold">${cat.parent.nombre}</span>` 
            : '<span class="text-muted small"><i>Raíz</i></span>'
        },
        { header: 'Descripción', key: 'descripcion', class: 'text-muted text-truncate', format: (desc) => desc || '-' },
        {
          header: 'Estado',
          render: (cat) => `
            <span class="badge bg-${cat.activo ? 'success' : 'danger'}-soft text-${cat.activo ? 'success' : 'danger'} rounded-pill px-2.5 py-1 small fw-semibold">
              ${cat.activo ? 'Activa' : 'Inactiva'}
            </span>
          `
        }
      ];

      // Only add actions if user has edit or delete permissions
      const canEdit = AuthService.hasPermission('Actualizar Categoría de Incidencia');
      const canDelete = AuthService.hasPermission('Eliminar Categoría de Incidencia');

      if (canEdit || canDelete) {
        columns.push({
          header: 'Acciones',
          class: 'text-end pe-4',
          actions: [
            ...(canEdit ? [{ name: 'editar', label: 'Editar', icon: 'bi-pencil-square', class: 'text-primary' }] : []),
            ...(canDelete ? [{ name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }] : [])
          ]
        });
      }

      tblDatos.configure({ columns });

      // Listen to row actions
      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          this.abrirModalCategoria(item);
        } else if (action === 'eliminar') {
          this.eliminarCategoria(item.id, item.nombre);
        }
      });

      // Load initial data
      this.cargarCategorias();
    }
  }

  async cargarCategorias() {
    const tblDatos = this.querySelector('#tbl-datos-categorias');
    if (!tblDatos) return;

    try {
      await tblDatos.load(CategoriaIncidenciaService.getAll);
      this.categoriasList = tblDatos.items || [];
      this.llenarParentSelect();
    } catch (error) {
      console.error('Error cargando categorías:', error);
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

  abrirModalCategoria(categoria = null) {
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
      selectParent.value = '';
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
