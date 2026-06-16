import { BaseComponent } from '../../../../core/base-component.js';
import { apiRequest } from '../../../../core/api.js';

export class MenuOptionsFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/opciones-menu/components/menu-options-form/menu-options-form.component.html');
  }

  onInit() {
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const optionId = urlParams.get('id');

    const formTitle = this.querySelector('#formTitle');
    const form = this.querySelector('#opcionMenuForm');
    const selectPadre = this.querySelector('#padre_id');
    const inputIcono = this.querySelector('#icono');
    const iconoPreview = this.querySelector('#icono-preview');
    const alertMessage = this.querySelector('#alertMessage');
    const btnGuardar = this.querySelector('#btnGuardar');
    const loadingSpinner = this.querySelector('#loadingSpinner');

    // Actualizar vista previa del icono en tiempo real
    if (inputIcono && iconoPreview) {
      inputIcono.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value) {
          iconoPreview.className = '';
          if (value.startsWith('bi-') || value.startsWith('bi ')) {
            iconoPreview.className = `bi ${value}`;
          } else {
            iconoPreview.className = `bi bi-${value}`;
          }
        } else {
          iconoPreview.className = 'bi bi-tag';
        }
      });
    }

    // Mostrar alertas
    const showAlert = (message, type = 'success') => {
      if (!alertMessage) return;
      alertMessage.textContent = message;
      alertMessage.style.whiteSpace = 'pre-line';
      alertMessage.className = `alert alert-${type} mt-3`;
      alertMessage.classList.remove('d-none');
      alertMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Cargar opciones padre
    const cargarOpcionesPadre = async () => {
      if (!selectPadre) return;
      try {
        const response = await apiRequest('/opciones-menu');
        const opciones = response.data || [];

        opciones.forEach(opcion => {
          // Evitar que una opción sea su propio padre
          if (optionId && opcion.id == optionId) return;

          const opt = document.createElement('option');
          opt.value = opcion.id;
          opt.textContent = `${opcion.nombre} (${opcion.ruta})`;
          selectPadre.appendChild(opt);
        });
      } catch (error) {
        console.error(error);
        showAlert('Error al conectar con el servidor para cargar las opciones del menú.', 'danger');
      }
    };

    // Cargar datos del registro si estamos editando
    const cargarDatosEdicion = async () => {
      if (!optionId) return;

      document.title = 'Editar Opción de Menú';
      if (formTitle) formTitle.textContent = 'Editar Opción de Menú';

      try {
        const response = await apiRequest(`/opciones-menu/${optionId}`);
        const opcion = response.data;

        if (opcion) {
          const inputNombre = this.querySelector('#nombre');
          const inputRuta = this.querySelector('#ruta');

          if (inputNombre) inputNombre.value = opcion.nombre || '';
          if (inputRuta) inputRuta.value = opcion.ruta || '';
          if (inputIcono) inputIcono.value = opcion.icono || '';

          // Actualizar vista previa del icono
          if (opcion.icono && iconoPreview) {
            const val = opcion.icono.trim();
            if (val.startsWith('bi-') || val.startsWith('bi ')) {
              iconoPreview.className = `bi ${val}`;
            } else {
              iconoPreview.className = `bi bi-${val}`;
            }
          }

          // Seleccionar padre_id
          if (opcion.padre_id && selectPadre) {
            selectPadre.value = opcion.padre_id;
          }
        }
      } catch (error) {
        console.error(error);
        showAlert('No se pudieron cargar los datos del registro a editar.', 'danger');
        if (btnGuardar) btnGuardar.disabled = true;
      }
    };

    // Manejar el submit del formulario
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar con Bootstrap
        if (!form.checkValidity()) {
          e.stopPropagation();
          form.classList.add('was-validated');
          return;
        }

        // Mostrar spinner de carga
        if (btnGuardar) btnGuardar.disabled = true;
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');
        if (alertMessage) alertMessage.classList.add('d-none');

        const inputNombreVal = this.querySelector('#nombre') ? this.querySelector('#nombre').value.trim() : '';
        const inputRutaVal = this.querySelector('#ruta') ? this.querySelector('#ruta').value.trim() : '';

        const payload = {
          nombre: inputNombreVal,
          icono: inputIcono ? inputIcono.value.trim() || null : null,
          ruta: inputRutaVal,
          padre_id: selectPadre && selectPadre.value ? parseInt(selectPadre.value) : null
        };

        try {
          const response = await apiRequest(optionId ? `/opciones-menu/${optionId}` : '/opciones-menu', {
            method: optionId ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
          });

          showAlert(response.message || (optionId ? 'Opción de menú actualizada con éxito.' : 'Opción de menú creada con éxito.'), 'success');

          // Redireccionar después de 1.5 segundos a la lista SPA
          setTimeout(() => {
            window.location.hash = '#/opciones-menu';
          }, 1500);

        } catch (error) {
          console.error(error);
          showAlert(error.message || 'Hubo un error inesperado al procesar la solicitud.', 'danger');
          if (btnGuardar) btnGuardar.disabled = false;
          if (loadingSpinner) loadingSpinner.classList.add('d-none');
        }
      });
    }

    // Inicializar
    const init = async () => {
      await cargarOpcionesPadre();
      await cargarDatosEdicion();
    };

    init();
  }
}

customElements.define('app-menu-options-form', MenuOptionsFormComponent);