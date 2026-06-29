import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class UbicacionesPaisesComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/paises/ubicaciones-paises.component.html');
    this.paisesList = [];
    this.paisModalObj = null;
  }

  async onInit() {
    // Initialize Bootstrap Modal
    try {
      this.paisModalObj = new bootstrap.Modal(this.querySelector('#paisModal'));
    } catch (e) {
      console.warn('Error inicializando el modal de países.', e);
    }

    // Load Data
    await this.cargarPaises();

    // Setup Event Listeners
    const btnNuevoPais = this.querySelector('#btnNuevoPais');
    if (btnNuevoPais) {
      if (!AuthService.isAdmin()) {
        btnNuevoPais.classList.add('d-none');
      } else {
        btnNuevoPais.addEventListener('click', () => this.abrirModalPais());
      }
    }

    const paisForm = this.querySelector('#paisForm');
    if (paisForm) {
      paisForm.addEventListener('submit', (e) => this.guardarPais(e));
    }
  }

  async cargarPaises() {
    try {
      const paises = await UbicacionesService.getPaises();
      this.paisesList = paises || [];
      this.renderPaisesTable();
      
      // Dispatch event to notify other components that countries have changed
      this.dispatchEvent(new CustomEvent('paises-updated', {
        detail: { paises: this.paisesList },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error cargando países:', error);
      this.mostrarAlertaLocal('error', `Error al cargar países: ${error.message}`);
    }
  }

  renderPaisesTable() {
    const tbody = this.querySelector('#paisesTableBody');
    const emptyState = this.querySelector('#paisesEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.paisesList.length === 0) {
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');

    const isAdmin = AuthService.isAdmin();

    this.paisesList.forEach((pais) => {
      const tr = document.createElement('tr');
      
      const badgeClass = pais.activo ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';
      const badgeText = pais.activo ? 'Activo' : 'Inactivo';

      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${pais.nombre}</td>
        <td><code class="text-secondary fw-semibold">${pais.codigo_iso}</code></td>
        <td><span class="badge ${badgeClass} rounded-pill px-2.5 py-1 small">${badgeText}</span></td>
        <td class="text-end pe-4">
          <div class="btn-group ${isAdmin ? '' : 'd-none'}">
            <button class="btn btn-sm btn-light border-0 btn-editar-pais" data-id="${pais.id}" title="Editar País">
              <i class="bi bi-pencil-square text-primary"></i>
            </button>
            <button class="btn btn-sm btn-light border-0 btn-eliminar-pais" data-id="${pais.id}" title="Eliminar País">
              <i class="bi bi-trash text-danger"></i>
            </button>
          </div>
        </td>
      `;

      if (isAdmin) {
        tr.querySelector('.btn-editar-pais').addEventListener('click', () => this.abrirModalPais(pais));
        tr.querySelector('.btn-eliminar-pais').addEventListener('click', () => this.eliminarPais(pais.id, pais.nombre));
      }

      tbody.appendChild(tr);
    });
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
