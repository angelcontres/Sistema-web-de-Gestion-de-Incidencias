import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../../incidencias/services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

export class KanbanIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/instituciones/components/kanban/kanban-index.component.html');
    this.incidencias = [];
    this.recursosFiles = [];
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

    const dropzone = this.querySelector('#dropzoneContainerKanban');
    const fileInput = this.querySelector('#fileInputKanban');
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
      this.setupDropzoneDragAndDrop(dropzone);
    }
  }

  async cargarIncidencias() {
    this.mostrarSpinners(true);
    try {
      const response = await IncidenciaService.getAll(1, 15, null, { all: true });
      this.incidencias = Array.isArray(response) ? response : (response.data || []);
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

    const enProceso = this.incidencias.filter((i) => i.estado_id === 3); // En Proceso
    const resueltas = this.incidencias.filter((i) => i.estado_id === 4); // Resuelto

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
    if (isProceso && AuthService.hasPermission('UPDATE', 'kanban')) {
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
    this.recursosFiles = [];
    this.renderThumbnails();

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
      ToastService.warning('Debes ingresar un comentario de resolución.');
      return;
    }

    if (this.recursosFiles.length === 0) {
      ToastService.warning('Debes adjuntar al menos una imagen de evidencia.');
      return;
    }

    try {
      const btnConfirmar = this.querySelector('#btn-confirmar-resolver');
      const originalText = btnConfirmar.innerHTML;
      btnConfirmar.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
      btnConfirmar.disabled = true;

      const base64Recursos = this.recursosFiles.map((f) => f.base64);

      await IncidenciaService.update(id, {
        estado_id: 4, // Resuelto
        version: version,
        comentario_estado: '[RESOLUCIÓN] ' + comentario,
        recursos: base64Recursos,
      });

      ToastService.success('Incidencia marcada como resuelta.');

      const modalEl = this.querySelector('#modalResolver');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      await this.cargarIncidencias();
    } catch (error) {
      ToastService.error('Error al resolver: ' + error.message);
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

  // --- EVIDENCE FILE UPLOAD LOGIC ---
  setupDropzoneDragAndDrop(dropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.add('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.processFiles(files);
    });
  }

  handleFileSelection(e) {
    const files = e.target.files;
    this.processFiles(files);
    e.target.value = ''; // Reset input to allow selecting the same file again
  }

  async processFiles(files) {
    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        ToastService.warning('Solo se permiten archivos de imagen.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        ToastService.warning('La imagen no debe superar el límite de 10 MB.');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      try {
        const base64Data = await this.convertToWebP(file);
        let fileName = file.name;
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex !== -1) {
          fileName = fileName.substring(0, dotIndex) + '.webp';
        } else {
          fileName += '.webp';
        }

        const fileObj = {
          name: fileName,
          size: Math.round(base64Data.length * 0.75),
          type: 'image/webp',
          base64: base64Data,
          compressed: true,
        };

        this.recursosFiles.push(fileObj);
      } catch (e) {
        console.error('Error al comprimir la imagen:', e);
        // Fallback
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            this.recursosFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              base64: reader.result,
              compressed: false,
            });
            resolve();
          };
        });
      }
    }
    this.renderThumbnails();
  }

  convertToWebP(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(webpDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  renderThumbnails() {
    const container = this.querySelector('#thumbnailsContainerKanban');
    if (!container) return;

    container.innerHTML = '';

    this.recursosFiles.forEach((file, index) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <div class="card h-100 border rounded-3 overflow-hidden position-relative shadow-sm">
          <img src="\${file.base64}" loading="lazy" class="card-img-top object-fit-cover" style="height: 120px;" alt="\${file.name}" />
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <div class="text-truncate small fw-medium" title="\${file.name}">\${file.name}</div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="badge bg-success-soft text-success" style="font-size: 0.7rem;">.webp</span>
              <button type="button" class="btn btn-link text-danger p-0 border-0 btn-delete-file" data-index="\${index}">
                <i class="bi bi-trash small"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      col.querySelector('.btn-delete-file').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        this.recursosFiles.splice(idx, 1);
        this.renderThumbnails();
      });

      container.appendChild(col);
    });
  }
}

customElements.define('app-kanban-institucion', KanbanIndexComponent);
