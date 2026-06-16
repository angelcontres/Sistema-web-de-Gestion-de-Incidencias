import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

export class OpcionesMenuFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/opciones-menu/opciones-menu-form.component.html');
    this.editMode = false;
    this.opcionId = null;
  }

  async onInit() {
    this.parseQueryParams();
    await this.inicializarFormulario();
  }

  /**
   * Helper to parse query parameters from the window location hash.
   */
  parseQueryParams() {
    const hash = window.location.hash || '#/';
    const queryString = hash.split('?')[1];
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      this.opcionId = urlParams.get('id');
      this.editMode = !!this.opcionId;
    } else {
      this.opcionId = null;
      this.editMode = false;
    }
  }

  /**
   * Performs view updates, fetches options list, and sets up form submission handlers.
   */
  async inicializarFormulario() {
    const titleEl = this.querySelector('#formTitle');
    const subtitleEl = this.querySelector('#formSubtitle');
    const submitTextEl = this.querySelector('#submitText');
    const formLoadingSpinner = this.querySelector('#formLoadingSpinner');
    const formEl = this.querySelector('#opcionesMenuForm');

    /** @type {HTMLSelectElement} */
    const padreSelect = this.querySelector('#padreSelect');
    /** @type {HTMLInputElement} */
    const iconoInput = this.querySelector('#iconoInput');
    /** @type {HTMLInputElement} */
    const nombreInput = this.querySelector('#nombreInput');
    /** @type {HTMLInputElement} */
    const rutaInput = this.querySelector('#rutaInput');

    const iconPreview = this.querySelector('#iconPreview');

    if (!formEl || !padreSelect || !nombreInput || !rutaInput || !iconoInput) return;

    // Set UI headings based on edit or create mode
    if (this.editMode) {
      titleEl.textContent = 'Editar Opción de Menú';
      subtitleEl.textContent = 'Modifica los campos del registro';
      submitTextEl.textContent = 'Guardar Cambios';
    } else {
      titleEl.textContent = 'Nueva Opción de Menú';
      subtitleEl.textContent = 'Registra un nuevo acceso en el sistema';
      submitTextEl.textContent = 'Guardar Registro';
    }

    try {
      // 1. Fetch all options to populate the parent select dropdown
      const optionsResponse = await apiRequest('/opciones-menu');
      const allOptions = optionsResponse.data || [];

      // Populate select list, excluding current option (to prevent circular parent reference)
      allOptions.forEach((opt) => {
        if (this.editMode && String(opt.id) === String(this.opcionId)) {
          return; // Skip self
        }
        const optionEl = document.createElement('option');
        optionEl.value = opt.id;
        optionEl.textContent = opt.nombre;
        padreSelect.appendChild(optionEl);
      });

      // Helper functions for counters
      const updateNombreCounter = () => {
        const len = nombreInput.value.length;
        const counterEl = this.querySelector('#nombreCounter');
        if (counterEl) counterEl.textContent = `${len}/50`;
      };

      const updateIconoCounter = () => {
        const val = iconoInput.value;
        iconPreview.className = val.trim() ? val.trim() : 'bi bi-grid-fill';
        const counterEl = this.querySelector('#iconoCounter');
        if (counterEl) counterEl.textContent = `${val.length}/50`;
      };

      const updateRutaCounter = () => {
        const len = rutaInput.value.length;
        const counterEl = this.querySelector('#rutaCounter');
        if (counterEl) counterEl.textContent = `${len}/255`;
      };

      // 2. If in Edit Mode, fetch details of the record being edited
      if (this.editMode) {
        const detailResponse = await apiRequest(`/opciones-menu/${this.opcionId}`);
        const opcion = detailResponse.data;

        if (opcion) {
          nombreInput.value = opcion.nombre || '';
          rutaInput.value = opcion.ruta || '';
          iconoInput.value = opcion.icono || '';
          padreSelect.value = opcion.padre_id || '';

          // Trigger updates
          updateNombreCounter();
          updateIconoCounter();
          updateRutaCounter();
        }
      }

      // 3. Dynamic Listeners
      nombreInput.addEventListener('input', updateNombreCounter);
      iconoInput.addEventListener('input', updateIconoCounter);
      rutaInput.addEventListener('input', updateRutaCounter);

      // 4. Form Submit Listener
      formEl.addEventListener('submit', (e) => this.handleSubmit(e));

      // Hide loading, show form
      formLoadingSpinner.classList.add('d-none');
      formEl.classList.remove('d-none');
    } catch (error) {
      console.error('Error initializing form:', error);
      const errorAlert = this.querySelector('#formErrorAlert');
      const errorMessage = this.querySelector('#formErrorMessage');
      if (errorAlert && errorMessage) {
        errorMessage.textContent = error.message || 'Error de comunicación con el servidor.';
        errorAlert.classList.remove('d-none');
      }
      formLoadingSpinner.classList.add('d-none');
    }
  }

  /**
   * Form submission logic.
   */
  async handleSubmit(e) {
    e.preventDefault();

    /** @type {HTMLFormElement} */
    const formEl = this.querySelector('#opcionesMenuForm');
    /** @type {HTMLButtonElement} */
    const submitBtn = this.querySelector('#submitBtn');
    const submitSpinner = this.querySelector('#submitSpinner');
    const errorAlert = this.querySelector('#formErrorAlert');
    const errorMessage = this.querySelector('#formErrorMessage');

    // Bootstrap Validation
    formEl.classList.add('was-validated');
    if (!formEl.checkValidity()) {
      return;
    }

    // Reset alert and start submission loading state
    errorAlert.classList.add('d-none');
    submitBtn.disabled = true;
    submitSpinner.classList.remove('d-none');

    // Extract inputs with proper JSDoc casting
    /** @type {HTMLInputElement} */
    const nombreInput = this.querySelector('#nombreInput');
    /** @type {HTMLInputElement} */
    const rutaInput = this.querySelector('#rutaInput');
    /** @type {HTMLInputElement} */
    const iconoInput = this.querySelector('#iconoInput');
    /** @type {HTMLSelectElement} */
    const padreSelect = this.querySelector('#padreSelect');

    const nombre = nombreInput.value.trim();
    const ruta = rutaInput.value.trim();
    const icono = iconoInput.value.trim() || null;
    const padre_val = padreSelect.value;
    const padre_id = padre_val ? parseInt(padre_val, 10) : null;

    const payload = {
      nombre,
      ruta,
      icono,
      padre_id,
    };

    try {
      let response;
      if (this.editMode) {
        // PUT /api/opciones-menu/{id}
        response = await apiRequest(`/opciones-menu/${this.opcionId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // POST /api/opciones-menu
        response = await apiRequest('/opciones-menu', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      // Notify other components (like the sidebar) to refresh
      window.dispatchEvent(new CustomEvent('menu-change'));

      // Success redirect to list page
      window.location.hash = '#/opciones-menu';
    } catch (error) {
      console.error('Error saving option:', error);
      errorMessage.textContent = error.message || 'Error al guardar el registro en el servidor.';
      errorAlert.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitSpinner.classList.add('d-none');
    }
  }
}

customElements.define('app-opciones-menu-form', OpcionesMenuFormComponent);
