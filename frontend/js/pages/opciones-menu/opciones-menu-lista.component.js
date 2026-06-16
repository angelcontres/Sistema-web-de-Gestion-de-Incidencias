import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

export class OpcionesMenuListaComponent extends BaseComponent {
  constructor() {
    super('js/pages/opciones-menu/opciones-menu-lista.component.html');
  }

  async onInit() {
    await this.cargarOpciones();
  }

  /**
   * Fetches all menu options from the backend and renders them.
   */
  async cargarOpciones() {
    const loadingSpinner = this.querySelector('#loadingSpinner');
    const tableContainer = this.querySelector('#tableContainer');
    const emptyState = this.querySelector('#emptyState');
    const tblDatos = this.querySelector('#tbl-datos-opciones-menu');
    const totalBadge = this.querySelector('#totalOpcionesBadge');
    const errorAlert = this.querySelector('#errorAlert');
    const errorMessage = this.querySelector('#errorMessage');

    if (!tblDatos) return;

    // Show loading spinner and hide others
    loadingSpinner.classList.remove('d-none');
    tableContainer.classList.add('d-none');
    emptyState.classList.add('d-none');
    errorAlert.classList.add('d-none');

    try {
      // Call GET /api/opciones-menu using apiRequest helper
      const response = await apiRequest('/opciones-menu');
      
      const opciones = response.data || [];
      totalBadge.textContent = `${opciones.length} Registros`;

      if (opciones.length === 0) {
        emptyState.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        return;
      }

      tblDatos.innerHTML = '';

      opciones.forEach((opcion) => {
        const tr = document.createElement('tr');
        tr.className = 'border-bottom border-light';

        // Format Date
        let fechaFormat = '-';
        if (opcion.created_at) {
          fechaFormat = new Date(opcion.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        // Parent Option Label
        const padreLabel = opcion.padre 
          ? `<span class="badge bg-secondary-soft text-dark px-2.5 py-1 rounded small fw-medium"><i class="bi bi-folder-fill me-1 small"></i>${opcion.padre.nombre}</span>`
          : '<span class="text-muted small">-</span>';

        // Icon Markup
        const iconoMarkup = opcion.icono
          ? `<span class="d-flex align-items-center gap-2 text-dark small"><i class="${opcion.icono} text-primary fs-5"></i> <code>${opcion.icono}</code></span>`
          : '<span class="text-muted small">-</span>';

        tr.innerHTML = `
          <td class="ps-4 text-secondary fw-semibold">#${opcion.id}</td>
          <td>
            <div class="fw-bold text-dark">${opcion.nombre}</div>
          </td>
          <td>${iconoMarkup}</td>
          <td>
            <code class="text-indigo small font-monospace">${opcion.ruta}</code>
          </td>
          <td>${padreLabel}</td>
          <td class="text-muted small">${fechaFormat}</td>
          <td class="text-end pe-4">
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-outline-primary btn-sm btn-edit d-flex align-items-center gap-1 rounded-2" data-id="${opcion.id}">
                <i class="bi bi-pencil-square"></i> <span class="d-none d-md-inline">Editar</span>
              </button>
              <button class="btn btn-outline-danger btn-sm btn-delete d-flex align-items-center gap-1 rounded-2" data-id="${opcion.id}" data-name="${opcion.nombre}">
                <i class="bi bi-trash"></i> <span class="d-none d-md-inline">Eliminar</span>
              </button>
            </div>
          </td>
        `;

        tblDatos.appendChild(tr);
      });

      // Add event listeners to the action buttons
      this.setupActionListeners();

      loadingSpinner.classList.add('d-none');
      tableContainer.classList.remove('d-none');
    } catch (error) {
      console.error('Error loading options:', error);
      errorMessage.textContent = error.message || 'Error de conexión con el servidor.';
      errorAlert.classList.remove('d-none');
      loadingSpinner.classList.add('d-none');
    }
  }

  /**
   * Sets up event listeners for dynamically rendered buttons.
   */
  setupActionListeners() {
    // Edit Button handler
    this.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        window.location.hash = `#/opciones-menu/editar?id=${id}`;
      });
    });

    // Delete Button handler
    this.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');

        if (confirm(`¿Está seguro de que desea eliminar la opción de menú "${name}"?\nEsta acción es irreversible y sus submenús perderán su padre.`)) {
          try {
            await apiRequest(`/opciones-menu/${id}`, {
              method: 'DELETE'
            });

            this.showSuccessMessage(`La opción "${name}" se eliminó correctamente.`);
            window.dispatchEvent(new CustomEvent('menu-change'));
            await this.cargarOpciones();
          } catch (error) {
            console.error('Error deleting option:', error);
            alert(`Error al eliminar registro: ${error.message}`);
          }
        }
      });
    });
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

customElements.define('app-opciones-menu-lista', OpcionesMenuListaComponent);
