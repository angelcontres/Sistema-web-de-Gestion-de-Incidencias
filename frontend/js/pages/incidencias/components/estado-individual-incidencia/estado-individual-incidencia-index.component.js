import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { getBadgeClass } from '../../../../shared/utils/badge-states.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';

export class EstadoIndividualIncidenciaComponent extends BaseComponent {
  constructor() {
    super(
      'js/pages/incidencias/components/estado-individual-incidencia/estado-individual-incidencia-index.component.html'
    );
    this.incidenciaId = null;
    this.currentPage = 1;
    this.lastPage = 1;
    this.isLoadingHistory = false;
    this.hasMore = true;
    this.historyData = [];
    this.institucionesList = [];
    this.currentUser = AuthService.getCurrentUser();
  }

  async onInit() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    this.incidenciaId = urlParams.get('id');

    if (!this.incidenciaId) {
      ToastService.error('ID de incidencia no proporcionado.');
      window.location.hash = '#/tramites/historial';
      return;
    }

    this.setupEventListeners();
    await this.cargarDetalles();
    await this.cargarHistorial(1);
    this.scrollToBottom();

    // Hide comment form if user is Supervisor (Supervisor can only view, not comment)
    if (
      this.currentUser &&
      this.currentUser.roles &&
      this.currentUser.roles.some((r) => r.nombre === 'Supervisor')
    ) {
      const formContainer = this.querySelector('.card-footer');
      if (formContainer) {
        formContainer.style.display = 'none';
      }
    }
  }

  setupEventListeners() {
    const textarea = this.querySelector('#nuevo-comentario');
    const charCount = this.querySelector('#chat-char-count');
    const form = this.querySelector('#form-comentario');
    const chatContainer = this.querySelector('#chat-container');

    if (textarea && charCount) {
      textarea.addEventListener('input', (e) => {
        charCount.textContent = e.target.value.length;
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.enviarComentario();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.enviarComentario();
      });
    }

    if (chatContainer) {
      chatContainer.addEventListener('scroll', () => {
        // Inverse infinite scroll: trigger when scrolling to the top
        if (chatContainer.scrollTop === 0 && this.hasMore && !this.isLoadingHistory) {
          this.cargarHistorial(this.currentPage + 1);
        }
      });
    }

    const btnEditApoyo = this.querySelector('#btn-edit-apoyo');
    const btnSaveApoyo = this.querySelector('#btn-save-apoyo');
    if (btnEditApoyo) {
      btnEditApoyo.addEventListener('click', () => this.abrirModalApoyo());
    }
    if (btnSaveApoyo) {
      btnSaveApoyo.addEventListener('click', () => this.guardarApoyo());
    }
  }

  async abrirModalApoyo() {
    try {
      if (this.institucionesList.length === 0) {
        this.institucionesList = await CatalogoService.getInstituciones();
      }
      const container = this.querySelector('#container-modal-apoyo');
      if (container) {
        container.innerHTML = this.institucionesList.map(i => `
          <label class="list-group-item d-flex gap-3 align-items-center cursor-pointer p-3" style="cursor: pointer;" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
            <input class="form-check-input flex-shrink-0 chk-apoyo" type="checkbox" value="${i.id}" style="font-size: 1.3em;">
            <span class="pt-1 form-checked-content">
              <strong>${i.nombre}</strong>
              <span class="d-block text-muted small">${i.siglas}</span>
            </span>
          </label>
        `).join('');

        if (this.currentIncidencia && this.currentIncidencia.instituciones_apoyo) {
          const supportIds = this.currentIncidencia.instituciones_apoyo.map(i => i.id.toString());
          Array.from(container.querySelectorAll('.chk-apoyo')).forEach(chk => {
            chk.checked = supportIds.includes(chk.value);
          });
        }
      }
      
      const modalEl = this.querySelector('#modalApoyo');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    } catch (e) {
      console.error(e);
      ToastService.error('Error al cargar instituciones.');
    }
  }

  async guardarApoyo() {
    const container = this.querySelector('#container-modal-apoyo');
    if (!container || !this.currentIncidencia) return;

    const selectedIds = Array.from(container.querySelectorAll('.chk-apoyo:checked')).map(chk => parseInt(chk.value));
    const btn = this.querySelector('#btn-save-apoyo');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

    try {
      await IncidenciaService.update(this.incidenciaId, {
        instituciones_apoyo: selectedIds,
        version: this.currentIncidencia.version || 1
      });
      ToastService.success('Instituciones de apoyo actualizadas.');
      
      const modalEl = this.querySelector('#modalApoyo');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      
      await this.cargarDetalles();
    } catch (error) {
      console.error('Error actualizando apoyo:', error);
      ToastService.error('Error al guardar instituciones de apoyo.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Cambios';
    }
  }

  async cargarDetalles() {
    try {
      const inc = await IncidenciaService.getById(this.incidenciaId);
      this.currentIncidencia = inc;
      this.renderDetalles(inc);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  }

  renderDetalles(inc) {
    this.querySelector('#lbl-descripcion-header').textContent =
      inc.incidencia_descripcion || 'Sin descripción';

    const createdAt = new Date(inc.created_at);
    const now = new Date();
    const diffMs = now - createdAt;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    let timeAgo;
    if (diffHrs >= 24) {
      timeAgo = `hace ${Math.floor(diffHrs / 24)} días`;
    } else if (diffHrs > 0) {
      timeAgo = `hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      timeAgo = `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else {
      timeAgo = 'hace unos instantes';
    }

    const formatOpts = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const dateFormatted = createdAt.toLocaleString('es-ES', formatOpts);

    this.querySelector('#lbl-fecha-registro').innerHTML =
      `Registrado ${timeAgo} (<span class="fw-bold text-dark">${dateFormatted}</span>)`;
    this.querySelector('#lbl-direccion').textContent = inc.direccion
      ? inc.direccion.detalle
      : 'Sin dirección';
    this.querySelector('#lbl-afectados').textContent = inc.cantidad_afectados_incidencia || 0;

    const inst = this.querySelector('#lbl-institucion');
    inst.textContent = inc.institucion ? inc.institucion.nombre : 'No asignada';
    if (!inc.institucion) inst.classList.add('text-muted');

    // Render Institutions of Support
    const listApoyo = this.querySelector('#list-instituciones-apoyo');
    if (listApoyo) {
      if (inc.instituciones_apoyo && inc.instituciones_apoyo.length > 0) {
        listApoyo.innerHTML = inc.instituciones_apoyo.map(i => 
          `<span class="badge bg-secondary-soft text-secondary border border-secondary-subtle fw-medium">${i.nombre}</span>`
        ).join('');
      } else {
        listApoyo.innerHTML = '<span class="text-muted small fst-italic">Ninguna asignada</span>';
      }
    }

    const canManageIncidencia =
      this.currentUser &&
      (this.currentUser.roles.some((r) => r.nombre === 'Admin' || r.nombre === 'Supervisor') ||
        AuthService.hasPermission('UPDATE', 'incidencias') ||
        AuthService.hasPermission('UPDATE', 'despacho_incidencias'));
        
    const btnEditApoyo = this.querySelector('#btn-edit-apoyo');
    if (btnEditApoyo) {
      if (canManageIncidencia) {
        btnEditApoyo.classList.remove('d-none');
      } else {
        btnEditApoyo.classList.add('d-none');
      }
    }

    if (inc.prioridad) {
      this.querySelector('#lbl-prioridad').innerHTML = `
        <span class="badge rounded-pill px-2 py-1 small" style="background-color: ${inc.prioridad.color_hex}20; color: ${inc.prioridad.color_hex}; border: 1px solid ${inc.prioridad.color_hex}40;">
          ${inc.prioridad.nombre}
        </span>`;
    }

    if (inc.estado) {
      const badgeClass = getBadgeClass(inc.estado.nombre);

      this.querySelector('#lbl-estado').innerHTML = `
        <span class="badge bg-${badgeClass} rounded-pill px-3 py-2 fw-semibold">
          ${inc.estado.nombre}
        </span>`;
    }

    this.renderTimeline(inc);

    // Render reportantes vinculados
    const reportantesContainer = this.querySelector('#container-reportantes');
    const reportantesList = this.querySelector('#list-reportantes');

    if (reportantesContainer && reportantesList) {
      const reportantes = inc.reportantes || [];
      if (reportantes.length > 0) {
        reportantesContainer.classList.remove('d-none');

        let html;
        if (reportantes.length <= 3) {
          html =
            `<ul class="list-unstyled mb-0">` +
            reportantes
              .map((r) => {
                const displayName = r.name || r.username || 'Usuario Anónimo';
                const creadorText =
                  r.id === inc.cliente_id
                    ? ' <span class="text-muted small fst-italic">(creador)</span>'
                    : '';
                return `<li class="text-dark"><i class="bi bi-person-fill text-muted me-1"></i>${displayName}${creadorText}</li>`;
              })
              .join('') +
            `</ul>`;
        } else {
          const visible = reportantes.slice(0, 3);
          const others = reportantes.slice(3);
          const othersNames = others
            .map((r) => {
              const displayName = r.name || r.username || 'Usuario Anónimo';
              return r.id === inc.cliente_id ? `${displayName} (creador)` : displayName;
            })
            .join(', ');

          html =
            `<ul class="list-unstyled mb-0">` +
            visible
              .map((r) => {
                const displayName = r.name || r.username || 'Usuario Anónimo';
                const creadorText =
                  r.id === inc.cliente_id
                    ? ' <span class="text-muted small fst-italic">(creador)</span>'
                    : '';
                return `<li class="text-dark"><i class="bi bi-person-fill text-muted me-1"></i>${displayName}${creadorText}</li>`;
              })
              .join('') +
            `</ul>` +
            `<div class="small text-muted mt-2" title="${othersNames}">+ ${others.length} reportante(s) adicional(es)</div>`;
        }
        reportantesList.innerHTML = html;

        setTimeout(() => {
          const tooltipTriggerList = [].slice.call(
            this.querySelectorAll('[data-bs-toggle="tooltip"]')
          );
          tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
          });
        }, 100);
      } else {
        reportantesContainer.classList.add('d-none');
      }
    }

    // Render adjuntos
    const containerAdjuntos = this.querySelector('#container-adjuntos');
    const msgNoAdjuntos = this.querySelector('#no-adjuntos-msg');

    if (containerAdjuntos && msgNoAdjuntos) {
      if (inc.recursos && inc.recursos.length > 0) {
        msgNoAdjuntos.classList.add('d-none');

        let adjuntosHtml = '';
        inc.recursos.forEach((recurso) => {
          const fileName = recurso.url.substring(recurso.url.lastIndexOf('/') + 1) || 'adjunto';
          const isImage = fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i);
          const icon = isImage ? 'bi-image' : 'bi-file-earmark-text';

          adjuntosHtml += `
            <a href="${recurso.url}" target="_blank" class="text-decoration-none text-dark">
              <div class="border rounded p-3 text-center bg-light" style="width: 120px; transition: 0.2s;" onmouseover="this.classList.replace('bg-light', 'bg-white'); this.classList.add('shadow-sm')" onmouseout="this.classList.replace('bg-white', 'bg-light'); this.classList.remove('shadow-sm')">
                <i class="bi ${icon} text-muted mb-2" style="font-size: 2rem;"></i>
                <div class="small text-truncate" title="${fileName}">${fileName}</div>
              </div>
            </a>
          `;
        });

        Array.from(containerAdjuntos.children).forEach((child) => {
          if (child.id !== 'no-adjuntos-msg') child.remove();
        });

        containerAdjuntos.insertAdjacentHTML('beforeend', adjuntosHtml);
      } else {
        msgNoAdjuntos.classList.remove('d-none');
        Array.from(containerAdjuntos.children).forEach((child) => {
          if (child.id !== 'no-adjuntos-msg') child.remove();
        });
      }
    }
  }

  renderTimeline(inc) {
    const timelineContainer = this.querySelector('#timeline-container');
    if (!timelineContainer) return;

    const isRechazado = inc.estado_id === 5;
    const steps = [
      { id: 1, label: 'Pendiente' },
      { id: 2, label: 'En Revisión' },
      { id: 3, label: 'En Proceso' },
      { id: isRechazado ? 5 : 4, label: isRechazado ? 'Rechazado' : 'Resuelto' },
    ];

    let html = '';
    let foundCurrent = false;

    steps.forEach((step, index) => {
      const isCurrent = step.id === inc.estado_id;
      const isPast = !foundCurrent && !isCurrent;

      if (isCurrent) foundCurrent = true;

      let circleClass = 'bg-white border-secondary border-opacity-50';
      let iconClass = 'd-none';
      let textClass = 'text-muted';

      if (isCurrent) {
        circleClass = 'bg-primary-soft border-primary';
        iconClass = 'bi bi-record-circle text-primary';
        textClass = 'fw-bold text-dark';
      } else if (isPast) {
        circleClass = 'bg-primary text-white border-primary';
        iconClass = 'bi bi-check text-white';
        textClass = 'text-dark';
      }

      const isLast = index === steps.length - 1;
      const lineHtml = isLast
        ? ''
        : `<div class="position-absolute" style="left: 11px; top: 24px; bottom: -8px; width: 2px; background-color: ${isPast ? 'var(--primary-color, #7c3aed)' : '#e9ecef'}; z-index: 0;"></div>`;

      html += `
        <div class="position-relative mb-3 d-flex align-items-center" style="min-height: 32px;">
          ${lineHtml}
          <div class="rounded-circle border d-flex align-items-center justify-content-center position-relative z-1 ${circleClass}" style="width: 24px; height: 24px;">
            <i class="${iconClass}" style="font-size: 14px;"></i>
          </div>
          <div class="ms-3 ${textClass}">
            ${step.label}
          </div>
        </div>
      `;
    });

    timelineContainer.innerHTML = html;
  }

  async cargarHistorial(page) {
    if (this.isLoadingHistory) return;
    this.isLoadingHistory = true;

    const loadingIndicator = this.querySelector('#loading-more');
    const chatContainer = this.querySelector('#chat-container');
    const listContainer = this.querySelector('#comments-list');

    if (loadingIndicator) loadingIndicator.classList.remove('d-none');

    // Save current scroll height to maintain scroll position after prepending items
    const previousScrollHeight = chatContainer.scrollHeight;

    try {
      const response = await IncidenciaService.getHistorial(this.incidenciaId, page);
      const items = response.data; // Paginated data is array in .data

      this.currentPage = response.current_page;
      this.lastPage = response.last_page;
      this.hasMore = this.currentPage < this.lastPage;

      // Because the backend orders by created_at DESC, page 1 has the newest.
      // We need to render them from oldest (top) to newest (bottom).
      // Since we fetch paginated DESC, we prepend the fetched chunk reversed.

      const fragment = document.createDocumentFragment();

      // reverse items so chronological order is maintained within the chunk
      [...items].reverse().forEach((item) => {
        fragment.appendChild(this.crearBurbujaChat(item));
      });

      // Insert at the beginning
      listContainer.prepend(fragment);

      // Restore scroll position
      if (page > 1) {
        chatContainer.scrollTop = chatContainer.scrollHeight - previousScrollHeight;
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      this.isLoadingHistory = false;
      if (loadingIndicator) loadingIndicator.classList.add('d-none');
    }
  }

  crearBurbujaChat(item) {
    const isMine = this.currentUser && item.usuario_id === this.currentUser.id;
    const div = document.createElement('div');

    const alignClass = isMine ? 'align-self-end' : 'align-self-start';
    const bgClass = isMine ? 'text-dark border shadow-sm' : 'bg-white text-dark border shadow-sm';
    const timeClass = 'text-muted';

    const autorNombre = item.usuario ? (item.usuario.name || item.usuario.username || 'Usuario Anónimo') : 'Sistema';
    let comentario = item.comentario || 'Cambio de estado';
    const fecha = new Date(item.created_at).toLocaleString();

    if (comentario.startsWith('[VINCULADO] ')) {
      comentario = 'Alguien más se vinculó a tu incidencia: ' + comentario.substring(12);
    } else if (comentario.startsWith('Reporte ciudadano coincidente adjuntado: ')) {
      comentario = 'Alguien más se vinculó a tu incidencia: ' + comentario.substring(41);
    }

    // UI logic for "(Editado)" - Assuming created_at and updated_at differ
    let editadoHtml = '';
    if (item.updated_at && item.created_at !== item.updated_at) {
      editadoHtml = '<span class="ms-2 fst-italic" style="font-size: 0.7em;">(Editado)</span>';
    }

    let isStateChange = (comentario === 'Cambio de estado' || comentario === 'Resolución confirmada por el solicitante/operador.');
    
    if (comentario.startsWith('[RESOLUCIÓN] ')) {
      isStateChange = true;
      comentario = comentario.substring(13);
    }

    // Badge for state change if applicable
    let estadoBadge = '';
    if (item.estado && isStateChange) {
      let evidenciaHtml = '';
      if (
        item.estado.nombre === 'Resuelto' &&
        this.currentIncidencia &&
        this.currentIncidencia.recursos
      ) {
        const imagenes = this.currentIncidencia.recursos.filter((r) =>
          r.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
        );
        if (imagenes.length > 0) {
          const lastImage = imagenes[imagenes.length - 1];
          const fileName =
            lastImage.url.substring(lastImage.url.lastIndexOf('/') + 1) || 'evidencia';
          evidenciaHtml = `
            <div class="mt-2">
              <a href="${lastImage.url}" target="_blank" class="text-decoration-none text-dark d-inline-block">
                <div class="border rounded p-2 text-center bg-light" style="width: 100px; transition: 0.2s;" onmouseover="this.classList.replace('bg-light', 'bg-white'); this.classList.add('shadow-sm')" onmouseout="this.classList.replace('bg-white', 'bg-light'); this.classList.remove('shadow-sm')">
                  <i class="bi bi-image text-muted mb-1" style="font-size: 1.5rem;"></i>
                  <div class="small text-truncate" style="font-size: 0.7rem;" title="${fileName}">Evidencia</div>
                </div>
              </a>
            </div>
          `;
        }
      }
      estadoBadge = `<div class="mt-1"><span class="text-dark small fw-bold">${item.estado.nombre}</span>${evidenciaHtml}</div>`;
    }

    div.className = `d-flex flex-column ${alignClass} mb-2`;
    div.style.maxWidth = '75%';

    div.innerHTML = `
      <div class="small fw-bold mb-1 ${isMine ? 'text-end text-primary' : 'text-secondary'}">
        ${autorNombre}
      </div>
      <div class="${bgClass} rounded-4 p-3" style="border-bottom-${isMine ? 'right' : 'left'}-radius: 0; ${isMine ? 'background-color: #e9ecef; border-color: #dee2e6 !important;' : ''}">
        <div class="mb-0" style="word-wrap: break-word;">${comentario}</div>
        ${estadoBadge}
        <div class="mt-2 text-end small ${timeClass}" style="font-size: 0.75rem;">
          ${fecha} ${editadoHtml}
        </div>
      </div>
    `;
    return div;
  }

  async enviarComentario() {
    const textarea = this.querySelector('#nuevo-comentario');
    const comentario = textarea.value.trim();

    if (!comentario) return;
    if (comentario.length > 200) {
      ToastService.warning('El comentario no puede exceder los 200 caracteres.');
      return;
    }

    const btn = this.querySelector('#btn-enviar-comentario');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

    try {
      const response = await IncidenciaService.addComment(this.incidenciaId, comentario);

      // Agregarlo a la lista directamente para respuesta rápida
      const listContainer = this.querySelector('#comments-list');
      listContainer.appendChild(this.crearBurbujaChat(response.data));

      textarea.value = '';
      this.querySelector('#chat-char-count').textContent = '0';
      this.scrollToBottom();
    } catch (error) {
      console.error('Error enviando comentario:', error);
      ToastService.error('No se pudo enviar el comentario.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send-fill"></i>';
    }
  }

  scrollToBottom() {
    const chatContainer = this.querySelector('#chat-container');
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 50);
    }
  }
}

customElements.define('app-estado-individual-incidencia', EstadoIndividualIncidenciaComponent);
