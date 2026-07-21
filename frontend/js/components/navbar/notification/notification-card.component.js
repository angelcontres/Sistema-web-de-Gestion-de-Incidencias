import { BaseComponent } from '../../../core/base-component.js';
import { apiRequest } from '../../../core/api.js';

export class NotificationCardComponent extends BaseComponent {
  constructor() {
    super('js/components/navbar/notification/notification-card.component.html');
    this.notificationData = null;
  }

  onInit() {
    if (this.notificationData) {
      this.render();
    }
  }

  setData(data) {
    this.notificationData = data;
    if (this.firstElementChild) {
      this.render();
    }
  }

  render() {
    const item = this.querySelector('.card-item');
    if (!item || !this.notificationData) return;

    // Evaluamos de forma segura si la alerta ya fue leída
    const isRead = Boolean(this.notificationData.is_read || this.notificationData.read_at);
    const { id, title, message, type, created_at, url } = this.notificationData;

    const esc = (v) =>
      String(v ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
      );

    this.querySelector('.card-title').innerHTML = esc(title || 'Alerta de Central');
    this.querySelector('.card-message').innerHTML = esc(message || 'Sin detalles.');
    
    // Formateo de fecha y hora
    const timeEl = this.querySelector('.card-time');
    if (created_at && timeEl) {
      const date = new Date(created_at);
      timeEl.textContent = !isNaN(date) 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : created_at;
    }

    // Mapeo exacto de colores Bootstrap según gravedad de la incidencia
    const typeClasses = {
      'danger':  { border: 'border-danger',  bg: 'bg-danger' },
      'warning': { border: 'border-warning', bg: 'bg-warning' },
      'info':    { border: 'border-info',    bg: 'bg-info' },
      'success': { border: 'border-success', bg: 'bg-success' }
    };
    
    const theme = typeClasses[type] || { border: 'border-primary', bg: 'bg-primary' };
    
    // Limpiamos bordes anteriores por si se está re-renderizando y aplicamos el nuevo
    item.classList.remove('border-danger', 'border-warning', 'border-info', 'border-success', 'border-primary');
    item.classList.add(theme.border);

    // --- GESTIÓN VISUAL DEL PUNTO INDICADOR (ESTILO FACEBOOK/INSTAGRAM) ---
    const unreadDot = this.querySelector('.unread-dot');
    const titleEl = this.querySelector('.card-title');
    
    if (unreadDot) {
      // Limpiamos cualquier color de fondo anterior y le ponemos el color de la emergencia
      unreadDot.classList.remove('bg-primary', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success');
      unreadDot.classList.add(theme.bg);
    }

    if (isRead) {
      // ESTADO LEÍDO: Ocultamos el punto, opacamos la tarjeta y quitamos negrita
      if (unreadDot) unreadDot.classList.add('d-none');
      
      item.classList.replace('bg-white', 'bg-light');
      item.style.opacity = '0.65';
      
      if (titleEl) {
        titleEl.classList.remove('fw-bold');
        titleEl.classList.replace('text-dark', 'text-muted');
      }
    } else {
      // ESTADO NO LEÍDO: Mostramos el punto encendido, fondo blanco brillante y título en negrita
      if (unreadDot) unreadDot.classList.remove('d-none');
      
      item.classList.replace('bg-light', 'bg-white');
      item.style.opacity = '1';
      
      if (titleEl) {
        titleEl.classList.add('fw-bold');
        titleEl.classList.replace('text-muted', 'text-dark');
      }
    }

    // Evento Click: Marca como leído en backend y redirige
    item.onclick = (e) => {
      e.preventDefault();
      this.handleCardClick(id, url);
    };
  }

  async handleCardClick(id, url) {
    try {
      // 1. MUTACIÓN VISUAL INSTANTÁNEA (UI Optimista)
      // Cambiamos los datos internos a "leído" y re-renderizamos esta tarjeta en el DOM ya mismo
      this.notificationData.is_read = true;
      this.notificationData.read_at = new Date().toISOString();
      this.render(); // Esto oculta el punto (unread-dot) y cambia el fondo a gris (bg-light)

      // 2. Avisamos a la bandeja (Tray) para que reste -1 al número rojo de la campanita
      window.dispatchEvent(new CustomEvent('notification-read'));

      // 3. Petición en segundo plano para persistir en Laravel
      await apiRequest(`/notificaciones/${id}/leer`, { method: 'PUT' });

      // 4. Redirección por Hash en tu SPA
      if (url) {
        window.location.href = url.startsWith('#') ? url : `#${url}`;
      } else {
        window.dispatchEvent(new CustomEvent('notifications-changed'));
      }
    } catch (error) {
      console.error('Error al marcar incidencia como leída:', error);
    }
  }
}

customElements.define('app-notification-card', NotificationCardComponent);