import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';

export class MenuOptionsListComponent extends BaseComponent {
  constructor() {
    super('js/pages/menu-options/components/menu-options-list/menu-options-list.component.html');
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
          fechaFormat = new Date(opcion.created_at).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
          <td class="text-center">
            <div class="dropdown">
              <button
                class="btn btn-light text-secondary p-1 rounded-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                <li>
                  <a
                    class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary"
                    href="#/opciones-menu/form?id=${opcion.id}"
                  >
                    <i class="bi bi-pencil-square"></i> Editar
                  </a>
                </li>
                <li>
                  <button
                    class="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger btn-eliminar border-0 bg-transparent w-100"
                    data-id="${opcion.id}"
                    data-name="${opcion.nombre}"
                  >
                    <i class="bi bi-trash"></i> Eliminar
                  </button>
                </li>
              </ul>
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
    const tblDatos = this.querySelector('#tbl-datos-opciones-menu');
    if (tblDatos && !tblDatos.dataset.hasDeleteListener) {
      tblDatos.dataset.hasDeleteListener = 'true';
      tblDatos.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-eliminar');
        if (deleteBtn) {
          e.preventDefault();
          const id = deleteBtn.getAttribute('data-id');
          const name = deleteBtn.getAttribute('data-name');

          if (
            confirm(
              `¿Está seguro de que desea eliminar la opción de menú "${name}"?\nEsta acción es irreversible y sus submenús perderán su padre.`
            )
          ) {
            try {
              await apiRequest(`/opciones-menu/${id}`, {
                method: 'DELETE',
              });

              this.showSuccessMessage(`La opción "${name}" se eliminó correctamente.`);
              window.dispatchEvent(new CustomEvent('menu-change'));
              await this.cargarOpciones();
            } catch (error) {
              console.error('Error deleting option:', error);
              alert(`Error al eliminar registro: ${error.message}`);
            }
          }
        }
      });
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
