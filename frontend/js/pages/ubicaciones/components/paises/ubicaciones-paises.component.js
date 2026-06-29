import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class UbicacionesPaisesComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/paises/ubicaciones-paises.component.html');
    this.paisModalObj = null;
  }

  async onInit() {
    // Initialize Bootstrap Modal
    try {
      this.paisModalObj = new bootstrap.Modal(this.querySelector('#paisModal'));
    } catch (e) {
      console.warn('Error inicializando el modal de países.', e);
    }

    const btnNuevoPais = this.querySelector('#btnNuevoPais');
    const isAdmin = AuthService.isAdmin();

    if (btnNuevoPais) {
      if (!isAdmin) {
        btnNuevoPais.classList.add('d-none');
      } else {
        btnNuevoPais.addEventListener('click', () => this.abrirModalPais());
      }
    }

    const paisForm = this.querySelector('#paisForm');
    if (paisForm) {
      paisForm.addEventListener('submit', (e) => this.guardarPais(e));
    }

    // Configure the shared data table
    const tblDatos = this.querySelector('#tbl-datos-paises');
    if (tblDatos) {
      const columns = [
        { header: 'Nombre del País', key: 'nombre', class: 'ps-4 fw-bold text-dark' },
        { header: 'Código ISO', key: 'codigo_iso', class: 'text-secondary fw-semibold' },
        {
          header: 'Estado',
          render: (pais) => `
            <span class="badge bg-${pais.activo ? 'success' : 'danger'}-soft text-${pais.activo ? 'success' : 'danger'} rounded-pill px-2.5 py-1 small">
              ${pais.activo ? 'Activo' : 'Inactivo'}
            </span>
          `
        }
      ];

      if (isAdmin) {
        columns.push({
          header: 'Acciones',
          class: 'text-end pe-4',
          actions: [
            { name: 'editar', label: 'Editar', icon: 'bi-pencil-square', class: 'text-primary' },
            { name: 'eliminar', label: 'Eliminar', icon: 'bi-trash', class: 'text-danger' }
          ]
        });
      }

      tblDatos.configure({ columns });

      // Listen to row actions
      tblDatos.addEventListener('row-action', (e) => {
        const { action, item } = e.detail;
        if (action === 'editar') {
          this.abrirModalPais(item);
        } else if (action === 'eliminar') {
          this.eliminarPais(item.id, item.nombre);
        }
      });

      // Load data and trigger event when loaded to sync other components
      this.cargarPaises();
    }
  }

  async cargarPaises() {
    const tblDatos = this.querySelector('#tbl-datos-paises');
    if (!tblDatos) return;

    try {
      await tblDatos.load(UbicacionesService.getPaises);
      
      // Dispatch event to sync with other components
      this.dispatchEvent(new CustomEvent('paises-updated', {
        detail: { paises: tblDatos.items },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error al cargar países:', error);
    }
  }

  abrirModalPais(pais = null) {
    const modalTitle = this.querySelector('#paisModalLabel');
    const form = this.querySelector('#paisForm');
    const inputId = this.querySelector('#paisId');
    const inputNombre = this.querySelector('#paisNombre');
    const inputCodigo = this.querySelector('#paisCodigo');
    const inputActivo = this.querySelector('#paisActivo');
    const errorAlert = this.querySelector('#paisModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    if (pais) {
      modalTitle.textContent = 'Editar País';
      inputId.value = pais.id;
      inputNombre.value = pais.nombre;
      inputCodigo.value = pais.codigo_iso;
      inputActivo.checked = pais.activo;
    } else {
      modalTitle.textContent = 'Nuevo País';
      inputId.value = '';
      inputNombre.value = '';
      inputCodigo.value = '';
      inputActivo.checked = true;
    }

    this.paisModalObj.show();
  }

  async guardarPais(e) {
    e.preventDefault();
    const form = this.querySelector('#paisForm');
    const errorAlert = this.querySelector('#paisModalErrorAlert');
    const errorMessage = this.querySelector('#paisModalErrorMessage');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = this.querySelector('#paisId').value;
    const payload = {
      nombre: this.querySelector('#paisNombre').value,
      codigo_iso: this.querySelector('#paisCodigo').value.toUpperCase(),
      activo: this.querySelector('#paisActivo').checked,
    };

    try {
      if (id) {
        await UbicacionesService.updatePais(id, payload);
        this.mostrarAlertaLocal('success', 'País actualizado con éxito.');
      } else {
        await UbicacionesService.createPais(payload);
        this.mostrarAlertaLocal('success', 'País creado con éxito.');
      }

      this.paisModalObj.hide();
      await this.cargarPaises();
    } catch (error) {
      console.error('Error al guardar país:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarPais(id, nombre) {
    if (!confirm(`¿Está seguro de que desea eliminar el país "${nombre}"?`)) return;

    try {
      await UbicacionesService.deletePais(id);
      this.mostrarAlertaLocal('success', `País "${nombre}" eliminado con éxito.`);
      await this.cargarPaises();
    } catch (error) {
      console.error('Error al eliminar país:', error);
      this.mostrarAlertaLocal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  mostrarAlertaLocal(tipo, mensaje) {
    const successAlert = this.querySelector('#paisesSuccessAlert');
    const successMsg = this.querySelector('#paisesSuccessMessage');
    const errorAlert = this.querySelector('#paisesErrorAlert');
    const errorMsg = this.querySelector('#paisesErrorMessage');

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

customElements.define('app-ubicaciones-paises', UbicacionesPaisesComponent);
