import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

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
  }

  async cargarDetalles() {
    try {
      const inc = await IncidenciaService.getById(this.incidenciaId);
      this.renderDetalles(inc);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  }

  renderDetalles(inc) {
    this.querySelector('#lbl-id').textContent = inc.id;
    this.querySelector('#lbl-descripcion').textContent =
      inc.incidencia_descripcion || 'Sin descripción';
    this.querySelector('#lbl-direccion').textContent = inc.direccion
      ? inc.direccion.detalle
      : 'Sin dirección';
    this.querySelector('#lbl-afectados').textContent = inc.cantidad_afectados_incidencia || 0;

    const inst = this.querySelector('#lbl-institucion');
    inst.textContent = inc.institucion ? inc.institucion.nombre : 'No asignada';
    if (!inc.institucion) inst.classList.add('text-muted');

    if (inc.prioridad) {
      this.querySelector('#lbl-prioridad').innerHTML = `
        <span class="badge rounded-pill px-2 py-1 small" style="background-color: ${inc.prioridad.color_hex}20; color: ${inc.prioridad.color_hex}; border: 1px solid ${inc.prioridad.color_hex}40;">
          ${inc.prioridad.nombre}
        </span>`;
    }

    if (inc.estado) {
      let badgeClass = 'secondary';
      if (inc.estado.nombre === 'Aprobado') badgeClass = 'success';
      else if (inc.estado.nombre === 'Rechazado') badgeClass = 'danger';
      else if (inc.estado.nombre === 'En Revisión') badgeClass = 'warning';
      else if (inc.estado.nombre === 'En Proceso') badgeClass = 'primary';
      else if (inc.estado.nombre === 'Resuelto') badgeClass = 'success';

      this.querySelector('#lbl-estado').innerHTML = `
        <span class="badge bg-${badgeClass} rounded-pill px-3 py-2 fw-semibold">
          ${inc.estado.nombre}
        </span>`;
    }
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
    const bgClass = isMine ? 'bg-primary text-white' : 'bg-white text-dark border shadow-sm';
    const timeClass = isMine ? 'text-white-50' : 'text-muted';

    const autorNombre = item.usuario ? item.usuario.name : 'Sistema';
    const comentario = item.comentario || 'Cambio de estado';
    const fecha = new Date(item.created_at).toLocaleString();

    // UI logic for "(Editado)" - Assuming created_at and updated_at differ
    let editadoHtml = '';
    if (item.updated_at && item.created_at !== item.updated_at) {
      editadoHtml = '<span class="ms-2 fst-italic" style="font-size: 0.7em;">(Editado)</span>';
    }

    // Badge for state change if applicable
    let estadoBadge = '';
    if (item.estado && comentario === 'Cambio de estado') {
      estadoBadge = `<div class="mt-1"><span class="badge bg-secondary small">${item.estado.nombre}</span></div>`;
    }

    div.className = `d-flex flex-column ${alignClass} mb-2`;
    div.style.maxWidth = '75%';

    div.innerHTML = `
      <div class="small fw-bold mb-1 ${isMine ? 'text-end text-primary' : 'text-secondary'}">
        ${autorNombre}
      </div>
      <div class="${bgClass} rounded-4 p-3" style="border-bottom-${isMine ? 'right' : 'left'}-radius: 0;">
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
