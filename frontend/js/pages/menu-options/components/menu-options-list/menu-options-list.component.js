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

        // Celda ID
        // const tdId = document.createElement('td');
        // tdId.className = 'ps-4 text-secondary fw-semibold';
        // tdId.textContent = `#${opcion.id}`;

        // Celda Nombre
        const tdNombre = document.createElement('td');
        const divNombre = document.createElement('div');
        divNombre.className = 'fw-bold text-dark';
        divNombre.textContent = opcion.nombre || '';
        tdNombre.appendChild(divNombre);

        // Celda Icono (validada contra XSS)
        const tdIcono = document.createElement('td');
        if (opcion.icono) {
          const cleanIcono = opcion.icono.trim().replace(/[^a-zA-Z0-9\s\-]/g, '');
          if (cleanIcono) {
            const spanIcono = document.createElement('span');
            spanIcono.className = 'd-flex align-items-center gap-2 text-dark small';

            const iIcono = document.createElement('i');
            if (cleanIcono.startsWith('bi-') || cleanIcono.startsWith('bi ')) {
              iIcono.className = `bi ${cleanIcono} text-primary fs-5`;
            } else {
              iIcono.className = `bi bi-${cleanIcono} text-primary fs-5`;
            }

            const codeIcono = document.createElement('code');
            codeIcono.textContent = cleanIcono;

            spanIcono.appendChild(iIcono);
            spanIcono.appendChild(codeIcono);
            tdIcono.appendChild(spanIcono);
          } else {
            const spanEmpty = document.createElement('span');
            spanEmpty.className = 'text-muted small';
            spanEmpty.textContent = '-';
            tdIcono.appendChild(spanEmpty);
          }
        } else {
          const spanEmpty = document.createElement('span');
          spanEmpty.className = 'text-muted small';
          spanEmpty.textContent = '-';
          tdIcono.appendChild(spanEmpty);
        }

        // Celda Ruta
        const tdRuta = document.createElement('td');
        const codeRuta = document.createElement('code');
        codeRuta.className = 'text-indigo small font-monospace';
        codeRuta.textContent = opcion.ruta || '';
        tdRuta.appendChild(codeRuta);

        // Celda Padre
        const tdPadre = document.createElement('td');
        if (opcion.padre && opcion.padre.nombre) {
          const badgePadre = document.createElement('span');
          badgePadre.className =
            'badge bg-secondary-soft text-dark px-2.5 py-1 rounded small fw-medium';

          const iFolder = document.createElement('i');
          iFolder.className = 'bi bi-folder-fill me-1 small';

          const textPadre = document.createTextNode(opcion.padre.nombre);

          badgePadre.appendChild(iFolder);
          badgePadre.appendChild(textPadre);
          tdPadre.appendChild(badgePadre);
        } else {
          const spanEmpty = document.createElement('span');
          spanEmpty.className = 'text-muted small';
          spanEmpty.textContent = '-';
          tdPadre.appendChild(spanEmpty);
        }

        // Celda Fecha de Creación
        const tdFecha = document.createElement('td');
        tdFecha.className = 'text-muted small';
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
        tdFecha.textContent = fechaFormat;

        // Celda Acciones (Dropdown seguro construído programáticamente)
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';

        const divDropdown = document.createElement('div');
        divDropdown.className = 'dropdown';

        const btnDropdown = document.createElement('button');
        btnDropdown.className = 'btn btn-light text-secondary p-1 rounded-2';
        btnDropdown.type = 'button';
        btnDropdown.setAttribute('data-bs-toggle', 'dropdown');
        btnDropdown.setAttribute('aria-expanded', 'false');

        const iDots = document.createElement('i');
        iDots.className = 'bi bi-three-dots-vertical';
        btnDropdown.appendChild(iDots);

        const ulMenu = document.createElement('ul');
        ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0';

        // Item de menú: Editar
        const liEdit = document.createElement('li');
        const aEdit = document.createElement('a');
        aEdit.className = 'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary';
        aEdit.setAttribute('href', `#/opciones-menu/form?id=${opcion.id}`);

        const iEdit = document.createElement('i');
        iEdit.className = 'bi bi-pencil-square';
        aEdit.appendChild(iEdit);
        aEdit.appendChild(document.createTextNode(' Editar'));
        liEdit.appendChild(aEdit);

        // Item de menú: Eliminar
        const liDelete = document.createElement('li');
        const btnDelete = document.createElement('button');
        btnDelete.className =
          'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger btn-eliminar border-0 bg-transparent w-100';
        btnDelete.setAttribute('data-id', opcion.id);
        btnDelete.setAttribute('data-name', opcion.nombre || '');

        const iDelete = document.createElement('i');
        iDelete.className = 'bi bi-trash';
        btnDelete.appendChild(iDelete);
        btnDelete.appendChild(document.createTextNode(' Eliminar'));
        liDelete.appendChild(btnDelete);

        ulMenu.appendChild(liEdit);
        ulMenu.appendChild(liDelete);

        divDropdown.appendChild(btnDropdown);
        divDropdown.appendChild(ulMenu);
        tdAcciones.appendChild(divDropdown);

        // Armar la fila completa
        // tr.appendChild(tdId);
        tr.appendChild(tdNombre);
        tr.appendChild(tdIcono);
        tr.appendChild(tdRuta);
        tr.appendChild(tdPadre);
        tr.appendChild(tdFecha);
        tr.appendChild(tdAcciones);

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
