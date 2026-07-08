import { BaseComponent } from '../../../core/base-component.js';
import { IncidenciaService } from '../../incidencias/services/incidencia.service.js';
import { AuthService } from '../../../core/auth.service.js';

export class KanbanIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/institucion/kanban/kanban-index.component.html');
    this.incidencias = [];
  }

  async onInit() {
    this.setupEventListeners();
    await this.cargarIncidencias();
  }

  setupEventListeners() {
    const btnRefresh = this.querySelector('#btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.cargarIncidencias());
    }

    const formResolver = this.querySelector('#form-resolver');
    const textarea = this.querySelector('#resolver-comentario');
    const charCount = this.querySelector('#char-count');

    if (textarea && charCount) {
      textarea.addEventListener('input', (e) => {
        charCount.textContent = e.target.value.length;
      });
    }

    const btnConfirmar = this.querySelector('#btn-confirmar-resolver');
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', () => this.resolverIncidencia());
    }
  }

  async cargarIncidencias() {
    this.mostrarSpinners(true);
    try {
      // Por defecto la API devuelve filtrado para 'Institucion' role
      this.incidencias = await IncidenciaService.getAll();
      this.renderKanban();
    } catch (error) {
      this.mostrarAlertaError('No se pudieron cargar las incidencias: ' + error.message);
    } finally {
      this.mostrarSpinners(false);
    }
  }

  renderKanban() {
    const colProceso = this.querySelector('#col-en-proceso');
    const colResuelto = this.querySelector('#col-resuelto');
    const countProceso = this.querySelector('#count-proceso');
    const countResuelto = this.querySelector('#count-resuelto');

    if (!colProceso || !colResuelto) return;

    // Limpiar columnas
    colProceso.innerHTML = '';
    colResuelto.innerHTML = '';

    const enProceso = this.incidencias.filter((i) => i.estado_id === 4); // En Proceso
    const resueltas = this.incidencias.filter((i) => i.estado_id === 5); // Resuelto

    countProceso.textContent = enProceso.length;
    countResuelto.textContent = resueltas.length;

    enProceso.forEach((inc) => {
      colProceso.appendChild(this.crearTarjeta(inc, true));
    });

    resueltas.forEach((inc) => {
      colResuelto.appendChild(this.crearTarjeta(inc, false));
    });

    if (enProceso.length === 0) {
      colProceso.innerHTML =
        '<div class="text-center text-muted mt-5 small">No hay incidencias en proceso</div>';
    }
    if (resueltas.length === 0) {
      colResuelto.innerHTML =
        '<div class="text-center text-muted mt-5 small">No hay incidencias resueltas</div>';
    }
  }

  crearTarjeta(incidencia, isProceso) {
    const div = document.createElement('div');
    div.className = 'card border-0 shadow-sm rounded-3 mb-3';

    let btnHtml = '';
    if (isProceso && AuthService.hasPermission('Actualizar Incidencia')) {
      btnHtml = `<button class="btn btn-sm btn-success w-100 rounded-pill mt-3 btn-resolver" data-id="${incidencia.id}" data-version="${incidencia.version}"><i class="bi bi-check2-circle me-1"></i> Resolver</button>`;
    }

    const prioridadHtml = incidencia.prioridad
      ? `<span class="badge rounded-pill px-2 py-1 small" style="background-color: ${incidencia.prioridad.color_hex}20; color: ${incidencia.prioridad.color_hex}; border: 1px solid ${incidencia.prioridad.color_hex}40;">${incidencia.prioridad.nombre}</span>`
      : '';

    const direccion = incidencia.direccion ? incidencia.direccion.detalle : 'Sin dirección';

    div.innerHTML = `
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="text-muted small fw-bold">#${incidencia.id}</span>
          ${prioridadHtml}
        </div>
        <h6 class="card-title fw-bold text-truncate" title="${incidencia.incidencia_descripcion}">${incidencia.incidencia_descripcion || 'Sin descripción'}</h6>
        <p class="card-text text-muted small mb-2"><i class="bi bi-geo-alt text-danger me-1"></i> ${direccion}</p>
        <p class="card-text text-muted small mb-0"><i class="bi bi-calendar-event me-1"></i> ${new Date(incidencia.created_at).toLocaleDateString()}</p>
        ${btnHtml}
      </div>
    `;

    if (isProceso) {
      const btn = div.querySelector('.btn-resolver');
      if (btn) {
        btn.addEventListener('click', () => {
          this.abrirModalResolver(incidencia.id, incidencia.version);
        });
      }
    }

    return div;
  }

  abrirModalResolver(id, version) {
    this.querySelector('#resolver-incidencia-id').value = id;
    this.querySelector('#resolver-incidencia-version').value = version;
    this.querySelector('#resolver-comentario').value = '';
    this.querySelector('#char-count').textContent = '0';

    const modalEl = this.querySelector('#modalResolver');
    if (modalEl && window.bootstrap) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  async resolverIncidencia() {
    const id = this.querySelector('#resolver-incidencia-id').value;
    const version = this.querySelector('#resolver-incidencia-version').value;
    const comentario = this.querySelector('#resolver-comentario').value.trim();

    if (!comentario) {
      alert('Debes ingresar un comentario de resolución.');
      return;
    }

    try {
      const btnConfirmar = this.querySelector('#btn-confirmar-resolver');
      const originalText = btnConfirmar.innerHTML;
      btnConfirmar.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
      btnConfirmar.disabled = true;

      await IncidenciaService.update(id, {
        estado_id: 5, // Resuelto
        version: version,
        comentario_estado: comentario,
      });

      this.mostrarAlertaExito('Incidencia marcada como resuelta.');

      const modalEl = this.querySelector('#modalResolver');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      await this.cargarIncidencias();
    } catch (error) {
      this.mostrarAlertaError('Error al resolver: ' + error.message);
    } finally {
      const btnConfirmar = this.querySelector('#btn-confirmar-resolver');
      if (btnConfirmar) {
        btnConfirmar.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Marcar Resuelta';
        btnConfirmar.disabled = false;
      }
    }
  }

  mostrarSpinners(show) {
    const spinners = this.querySelectorAll('.spinner-col');
    spinners.forEach((s) => {
      if (show) s.classList.remove('d-none');
      else s.classList.add('d-none');
    });
  }

  mostrarAlertaExito(message) {
    const successAlert = this.querySelector('#successAlert');
    const successMessage = this.querySelector('#successMessage');
    if (successAlert && successMessage) {
      successMessage.textContent = message;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 4000);
    }
  }

  mostrarAlertaError(message) {
    const errorAlert = this.querySelector('#errorAlert');
    const errorMessage = this.querySelector('#errorMessage');
    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.classList.remove('d-none');
      setTimeout(() => errorAlert.classList.add('d-none'), 5000);
    }
  }
}

customElements.define('app-kanban-institucion', KanbanIndexComponent);
