import { BaseComponent } from '../../../../core/base-component.js';
import { MenuOptionService } from '../../services/menu-option.service.js';

export class MenuOptionsFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/menu-options/components/menu-options-form/menu-options-form.component.html');
  }

  actualizarVistaPreviaIcono(icono, iconoPreviewEl) {
    if (!iconoPreviewEl) return;
    const value = (icono || '').trim();
    if (value) {
      const cleanValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
      iconoPreviewEl.className = '';
      if (cleanValue.startsWith('bi-') || cleanValue.startsWith('bi ')) {
        iconoPreviewEl.className = `bi ${cleanValue}`;
      } else {
        iconoPreviewEl.className = `bi bi-${cleanValue}`;
      }
    } else {
      iconoPreviewEl.className = 'bi bi-tag';
    }
  }

  poblarCamposFormulario(opcion, selectPadre, iconoPreviewEl) {
    const inputNombre = this.querySelector('#nombre');
    const inputRuta = this.querySelector('#ruta');
    const inputIcono = this.querySelector('#icono');

    if (inputNombre) inputNombre.value = opcion.nombre || '';
    if (inputRuta) inputRuta.value = opcion.ruta || '';
    if (inputIcono) inputIcono.value = opcion.icono || '';

    this.actualizarVistaPreviaIcono(opcion.icono, iconoPreviewEl);

    if (opcion.padre_id && selectPadre) {
      selectPadre.value = opcion.padre_id;
    }
  }

  configurarEncabezadoEdicion(formTitleEl) {
    document.title = 'Editar Opción de Menú';
    if (formTitleEl) formTitleEl.textContent = 'Editar Opción de Menú';
  }

  async onInit() {
    this._getOptionId();
    this._cacheElements();
    this._setupIconPreview();
    this._setupFormSubmit();

    await this._cargarOpcionesPadre();
    await this._cargarDatosEdicion();
  }

  _getOptionId() {
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    this.optionId = urlParams.get('id');
  }

  _cacheElements() {
    this.formTitle = this.querySelector('#formTitle');
    this.form = this.querySelector('#opcionMenuForm');
    this.selectPadre = this.querySelector('#padre_id');
    this.inputIcono = this.querySelector('#icono');
    this.iconoPreview = this.querySelector('#icono-preview');
    this.alertMessage = this.querySelector('#alertMessage');
    this.btnGuardar = this.querySelector('#btnGuardar');
    this.loadingSpinner = this.querySelector('#loadingSpinner');
  }

  _setupIconPreview() {
    if (this.inputIcono && this.iconoPreview) {
      this.inputIcono.addEventListener('input', (e) => {
        this.actualizarVistaPreviaIcono(e.target.value, this.iconoPreview);
      });
    }
  }

  showAlert(message, type = 'success') {
    if (!this.alertMessage) return;
    this.alertMessage.textContent = message;
    this.alertMessage.style.whiteSpace = 'pre-line';
    this.alertMessage.className = `alert alert-${type} mt-3`;
    this.alertMessage.classList.remove('d-none');
    this.alertMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async _cargarOpcionesPadre() {
    if (!this.selectPadre) return;
    try {
      const response = await MenuOptionService.getAll(1, 15, null, { all: true });
      const opciones = Array.isArray(response) ? response : response.data || [];

      opciones.forEach((opcion) => {
        if (this.optionId && opcion.id == this.optionId) return;

        const opt = document.createElement('option');
        opt.value = opcion.id;
        opt.textContent = `${opcion.nombre} (${opcion.ruta})`;
        this.selectPadre.appendChild(opt);
      });
    } catch (error) {
      console.error(error);
      this.showAlert('Error al conectar con el servidor para cargar las opciones del menú.', 'danger');
    }
  }

  async _cargarDatosEdicion() {
    if (!this.optionId) return;

    this.configurarEncabezadoEdicion(this.formTitle);

    try {
      const response = await MenuOptionService.getById(this.optionId);
      const opcion = response.data;

      if (opcion) {
        this.poblarCamposFormulario(opcion, this.selectPadre, this.iconoPreview);
      }
    } catch (error) {
      console.error(error);
      this.showAlert('No se pudieron cargar los datos del registro a editar.', 'danger');
      if (this.btnGuardar) this.btnGuardar.disabled = true;
    }
  }

  _setupFormSubmit() {
    if (!this.form) return;

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.form.checkValidity()) {
        e.stopPropagation();
        this.form.classList.add('was-validated');
        return;
      }

      this._setLoadingState(true);

      const inputNombreVal = this.querySelector('#nombre') ? this.querySelector('#nombre').value.trim() : '';
      const inputRutaVal = this.querySelector('#ruta') ? this.querySelector('#ruta').value.trim() : '';

      const payload = {
        nombre: inputNombreVal,
        icono: this.inputIcono?.value.trim() || null,
        ruta: inputRutaVal,
        padre_id: this.selectPadre?.value ? Number.parseInt(this.selectPadre.value, 10) : null,
      };

      try {
        const response = this.optionId
          ? await MenuOptionService.update(this.optionId, payload)
          : await MenuOptionService.create(payload);

        this.showAlert(
          response.message || (this.optionId ? 'Opción de menú actualizada con éxito.' : 'Opción de menú creada con éxito.'),
          'success'
        );

        setTimeout(() => {
          window.location.hash = '#/opciones-menu';
        }, 1500);
      } catch (error) {
        console.error(error);
        this.showAlert(
          error.message || 'Hubo un error inesperado al procesar la solicitud.',
          'danger'
        );
        this._setLoadingState(false);
      }
    });
  }

  _setLoadingState(isLoading) {
    if (this.btnGuardar) this.btnGuardar.disabled = isLoading;
    if (this.loadingSpinner) {
      if (isLoading) this.loadingSpinner.classList.remove('d-none');
      else this.loadingSpinner.classList.add('d-none');
    }
    if (isLoading && this.alertMessage) this.alertMessage.classList.add('d-none');
  }
}

customElements.define('app-menu-options-form', MenuOptionsFormComponent);
