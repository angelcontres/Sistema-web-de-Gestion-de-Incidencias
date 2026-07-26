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

    const isRead = Boolean(this.notificationData.is_read || this.notificationData.read_at);
    const { id, title, message, type, created_at, url } = this.notificationData;

    this.renderTextContent(title, message, created_at);

    const theme = this.getTheme(type);
    this.applyTheme(item, theme);

    this.updateReadState(item, theme, isRead);

    item.onclick = (e) => {
      e.preventDefault();
      this.handleCardClick(id, url);
    };
  }

  renderTextContent(title, message, created_at) {
    const esc = (v) =>
      String(v ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
      );

    this.querySelector('.card-title').innerHTML = esc(title || 'Alerta de Central');
    this.querySelector('.card-message').innerHTML = esc(message || 'Sin detalles.');

    const timeEl = this.querySelector('.card-time');
    if (created_at && timeEl) {
      const date = new Date(created_at);
      timeEl.textContent = !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : created_at;
    }
  }

  getTheme(type) {
    const typeClasses = {
      danger: { border: 'border-danger', bg: 'bg-danger' },
      warning: { border: 'border-warning', bg: 'bg-warning' },
      info: { border: 'border-info', bg: 'bg-info' },
      success: { border: 'border-success', bg: 'bg-success' },
      secondary: { border: 'border-secondary', bg: 'bg-secondary' },
    };
    return typeClasses[type] || { border: 'border-primary', bg: 'bg-primary' };
  }

  applyTheme(item, theme) {
    item.classList.remove(
      'border-danger',
      'border-warning',
      'border-info',
      'border-success',
      'border-secondary',
      'border-primary'
    );
    item.classList.add(theme.border);
  }

  updateReadState(item, theme, isRead) {
    const unreadDot = this.querySelector('.unread-dot');
    const titleEl = this.querySelector('.card-title');

    if (unreadDot) {
      unreadDot.classList.remove(
        'bg-primary',
        'bg-danger',
        'bg-warning',
        'bg-info',
        'bg-success',
        'bg-secondary'
      );
      unreadDot.classList.add(theme.bg);
    }

    if (isRead) {
      if (unreadDot) unreadDot.classList.add('d-none');
      item.classList.replace('bg-white', 'bg-light');
      item.style.opacity = '0.65';
      if (titleEl) {
        titleEl.classList.remove('fw-bold');
        titleEl.classList.replace('text-dark', 'text-muted');
      }
    } else {
      if (unreadDot) unreadDot.classList.remove('d-none');
      item.classList.replace('bg-light', 'bg-white');
      item.style.opacity = '1';
      if (titleEl) {
        titleEl.classList.add('fw-bold');
        titleEl.classList.replace('text-muted', 'text-dark');
      }
    }
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
        let targetUrl = url;

        // Si la URL ya viene completa con el hash, la respetamos
        if (targetUrl.startsWith('#')) {
          window.location.href = targetUrl;
        }
        // Si es una ruta relativa o viene de la API
        else {
          // Limpiamos cualquier barra inicial duplicada
          targetUrl = targetUrl.replace(/^\/+/, '');
          window.location.href = `#/${targetUrl}`;
        }
      } else {
        window.dispatchEvent(new CustomEvent('notifications-changed'));
      }
    } catch (error) {
      console.error('Error al marcar incidencia como leída:', error);
    }
  }
}

customElements.define('app-notification-card', NotificationCardComponent);
