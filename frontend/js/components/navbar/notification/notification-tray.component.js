import { BaseComponent } from '../../../core/base-component.js';
import { apiRequest } from '../../../core/api.js';
import { NotificationCardComponent } from './notification-card.component.js';
import { initEcho } from '../../../core/echo.js';
import { AuthService } from '../../../core/auth.service.js';
export class NotificationTrayComponent extends BaseComponent {
  constructor() {
    super('js/components/navbar/notification/notification-tray.component.html');
    this.notificationsLoaded = false;
    this.echoInstance = null;
  }

  onInit() {
    // 1. Cargar historial de la base de datos al iniciar
    this.loadNotifications();

    // 2. Conectar al WebSocket de Laravel Reverb
    this.setupWebSocket();

    // 3. Reconectar si el usuario cambia de sesión o hace login
    this._onAuthChange = () => {
      this.notificationsLoaded = false;
      this.disconnectWebSocket();
      this.loadNotifications();
      this.setupWebSocket();
    };
    window.addEventListener('auth-change', this._onAuthChange);

    // 4. Si otra acción del sistema pide recargar las alertas (ej. desde el botón "Marcar todo como leído")
    this._onNotificationsChange = () => {
      this.loadNotifications();
    };
    window.addEventListener('notifications-changed', this._onNotificationsChange);

    // 5. NUEVO: Escuchar cuando una tarjeta individual se marca como leída para restar -1 en UI Optimista
    this._onNotificationRead = () => {
      this.decrementBadge();
    };
    window.addEventListener('notification-read', this._onNotificationRead);

    // 6. Botón de Marcar todo como leído
    const btnReadAll = this.querySelector('#btnReadAll');
    if (btnReadAll) {
      btnReadAll.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.markAllAsRead();
      });
    }
  }

  disconnectedCallback() {
    if (this._onAuthChange) window.removeEventListener('auth-change', this._onAuthChange);
    if (this._onNotificationsChange)
      window.removeEventListener('notifications-changed', this._onNotificationsChange);
    if (this._onNotificationRead)
      window.removeEventListener('notification-read', this._onNotificationRead);

    this.disconnectWebSocket();
  }

  setupWebSocket() {
    const userId = AuthService.getUserId();

    if (!userId) {
      console.warn('⚠️ No se puede conectar a WebSocket: Usuario no autenticado o falta ID.');
      return;
    }

    this.echoInstance = initEcho();
    if (!this.echoInstance) return;

    console.log(`📡 Conectando a WebSocket en canal privado: App.Models.User.${userId}`);

    this.echoInstance.private(`App.Models.User.${userId}`).notification((notification) => {
      console.log('🚨 ¡Nueva alerta en tiempo real!', notification);
      this.handleRealtimeNotification(notification);
    });
  }

  disconnectWebSocket() {
    const userId = AuthService.getUserId();
    if (this.echoInstance && userId) {
      this.echoInstance.leave(`App.Models.User.${userId}`);
      this.echoInstance = null;
    }
  }

  /**
   * 2. MÉTODO AGREGADO: Pinta la alerta que llega por WebSocket de forma instantánea
   */
  handleRealtimeNotification(notification) {
    const notifData = notification.data || notification;
    // 1. Aumentamos el contador en tiempo real
    this.incrementBadge();

    // 2. UNIFICADO: Utilizamos el mismo ID del contenedor que en renderList
    const listContainer = this.querySelector('#dynamicNotificationsContainer');
    if (!listContainer) return;

    // 3. Limpiar el mensaje de "No hay incidencias reportadas" si el contenedor estaba vacío
    const emptyMsg = listContainer.querySelector('.empty-message');
    if (emptyMsg) {
      listContainer.innerHTML = '';
    }

    // 4. Crear e insertar la nueva tarjeta en la parte superior
    const newCard = document.createElement('app-notification-card');
    listContainer.prepend(newCard);

    newCard.setData({
      id: notification.id ?? notifData.id,
      ...notifData,
      is_read: false,
      read_at: null,
    });
  }

  async loadNotifications() {
    const container = this.querySelector('#dynamicNotificationsContainer');
    const token = localStorage.getItem('access_token');

    if (!token || !container) return;

    try {
      if (!this.notificationsLoaded && container.innerHTML.trim() === '') {
        container.innerHTML = `
          <div class="d-flex justify-content-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Cargando alertas...</span>
            </div>
          </div>
        `;
      }

      const response = await apiRequest('/notificaciones', { method: 'GET' });
      const result = response.data || response;

      const unreadCount = result.unread_count ?? 0;
      const notificationsList = result.notifications ?? (Array.isArray(result) ? result : []);

      this.updateBadge(unreadCount);
      this.renderList(notificationsList);
      this.notificationsLoaded = true;
    } catch (error) {
      console.error('Error cargando incidencias de central:', error);
      if (container) {
        container.innerHTML =
          '<p class="text-danger small text-center py-3 mb-0">Error de comunicación.</p>';
      }
    }
  }

  async markAllAsRead() {
    try {
      await apiRequest('/notificaciones/leer-todas', { method: 'PUT' });
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    } catch (error) {
      console.error('Error limpiando bandeja:', error);
    }
  }
  getBadgeCount() {
    const badge = this.querySelector('#notificationBadge');
    if (!badge || badge.classList.contains('d-none')) return 0;
    const text = badge.textContent.trim();
    return text.includes('+') ? 99 : parseInt(text, 10) || 0;
  }

  incrementBadge() {
    this.updateBadge(this.getBadgeCount() + 1);
  }

  decrementBadge() {
    const current = this.getBadgeCount();
    this.updateBadge(Math.max(0, current - 1));
  }

  updateBadge(count) {
    const badge = this.querySelector('#notificationBadge');
    if (!badge) return;

    if (count && count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }

  renderList(notifications) {
    const container = this.querySelector('#dynamicNotificationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!notifications || notifications.length === 0) {
      // CORREGIDO: Se añade la clase 'empty-message' para que el WebSocket pueda identificarla
      container.innerHTML =
        '<p class="text-muted small text-center py-4 mb-0 empty-message">No hay incidencias reportadas.</p>';
      return;
    }

    notifications.forEach((notif) => {
      const card = document.createElement('app-notification-card');
      card.setData(notif);
      container.appendChild(card);
    });
  }
}

customElements.define('app-notification-tray', NotificationTrayComponent);
