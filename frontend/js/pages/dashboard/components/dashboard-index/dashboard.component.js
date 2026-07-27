import { BaseComponent } from '../../../../core/base-component.js';
import { AuthService } from '../../../../core/auth.service.js';
import { getSoftClass } from '../../../../shared/utils/badge-states.js';
import { DashboardService } from '../../services/dashboard.service.js';

export class DashboardComponent extends BaseComponent {
  constructor() {
    super('js/pages/dashboard/components/dashboard-index/dashboard.component.html');
    this.dashboardData = null;
    this.map = null;
    this.clusterGroup = null;
    this.mockMarkers = []; // to keep track of added markers
  }

  onInit() {
    console.log('DashboardComponent inicializado (onInit)');

    // 1. Iniciar reloj y fecha en vivo
    this.initClock();

    // 2. Personalizar Greeting
    this.initGreeting();

    // Hide admin-only sections if not admin
    if (!AuthService.isAdmin()) {
      const wrapper = this.querySelector('#recentIncidentsWrapper');
      if (wrapper) wrapper.classList.add('d-none');
    }

    // 3. Inicializar el Mapa en vivo (esperar un micro-tick para que el DOM esté listo)
    setTimeout(() => {
      this.initDashboardMap();
      this.loadDashboardData();
      this.initDashboards();
    }, 50);

    // 4. Renderizar menú dinámico
    this.loadMenuData();

    // 5. Escuchar notificaciones globales (WebSocket) para refrescar en vivo
    this._onGlobalNotif = (e) => {
      console.log('Refrescando dashboard en vivo por notificación:', e.detail);
      this.loadDashboardData();
      this.initDashboards();
    };
    window.addEventListener('global-notification-received', this._onGlobalNotif);
  }

  disconnectedCallback() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this._onGlobalNotif) {
      window.removeEventListener('global-notification-received', this._onGlobalNotif);
    }
  }

  initGreeting() {
    const user = AuthService.getCurrentUser();
    if (user) {
      const greetingEl = this.querySelector('#dashboardGreeting');
      if (greetingEl) {
        greetingEl.textContent = `Bienvenido, ${user.name || user.username || 'Usuario'}`;
      }
    }
  }

  initClock() {
    const clockEl = this.querySelector('#liveClock');
    const dateEl = this.querySelector('#liveDate');

    const updateTime = () => {
      const now = new Date();
      if (clockEl) clockEl.textContent = now.toLocaleTimeString('es-EC', { hour12: false });
      if (dateEl)
        dateEl.textContent = now.toLocaleDateString('es-EC', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  async loadMenuData() {
    const container = this.querySelector('#dashboardMenuContainer');
    if (!container) return;

    try {
      let menuList = null;
      try {
        const menuStr = localStorage.getItem('user_menu');
        if (menuStr) {
          const parsed = JSON.parse(menuStr);
          menuList = Array.isArray(parsed) ? parsed : parsed.data || null;
        }
      } catch (e) {
        console.log(`Error obteniendo los menus de localStorage: ${e}`);
      }

      if (!menuList || !Array.isArray(menuList) || menuList.length === 0) {
        const response = await DashboardService.getMyMenus();
        menuList = response.data || response;
        localStorage.setItem('user_menu', JSON.stringify(menuList));
      }

      // Filtrar solo los menús de nivel superior y verificar permisos
      const rootMenus = menuList.filter((item) => {
        if (item.padre_id) return false;

        // Check routing access rights
        if (item.ruta && item.ruta !== '#/' && !AuthService.canAccessRoute(item.ruta)) {
          return false;
        }
        return true;
      });

      container.innerHTML = rootMenus
        .map(
          (menu) => `
        <div class="col-6 col-md-4 col-lg-3">
          <a href="${menu.ruta || '#/'}" class="premium-card text-decoration-none d-block h-100 py-3 px-4">
            <div class="d-flex align-items-center gap-3">
              <div class="bg-primary-soft rounded-circle p-3 text-primary d-inline-flex justify-content-center align-items-center shadow-sm" style="width: 48px; height: 48px;">
                <i class="${menu.icono || 'bi bi-grid'} fs-4"></i>
              </div>
              <div class="text-start">
                <span class="fw-bolder text-dark d-block" style="letter-spacing: -0.01em; line-height: 1.2;">${menu.nombre}</span>
              </div>
            </div>
          </a>
        </div>
      `
        )
        .join('');
    } catch (error) {
      console.error('Error cargando el menú del dashboard:', error);
      container.innerHTML = '<p class="text-danger">No se pudieron cargar las operaciones.</p>';
    }
  }

  async loadDashboardData() {
    try {
      const response = await DashboardService.getDashboardStats();
      this.renderTopServices(response.servicios_mas_utilizados);
      this.renderRecentIncidents(response.recientes);
      this.updateMapMarkers(response.mapa_reportes);
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
    }
  }

  async initDashboards() {
    const container = this.querySelector('#grafanaKpisContainer');
    if (!container) return;

    let role = 'Default';
    if (AuthService.hasPermission('READ', 'roles')) {
      role = 'Admin';
    } else if (AuthService.hasPermission('READ', 'despacho')) {
      role = 'Supervisor';
    } else if (AuthService.hasPermission('READ', 'kanban')) {
      role = 'Institucion';
    } else if (AuthService.hasPermission('CREATE', 'incidencias')) {
      role = 'Ciudadano';
    }

    container.innerHTML =
      '<div class="text-center p-5 w-100"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 text-muted">Cargando métricas...</p></div>';

    // Cargar ECharts vía CDN y el CSS de las tarjetas
    await Promise.all([this.loadECharts(), this.loadDashboardStyles()]);

    let data;
    try {
      const response = await DashboardService.getDashboardMetricsByRole(role);
      data = response.data || response;
    } catch (e) {
      console.error('Error cargando métricas:', e);
      // Fallback a un objeto vacío para ser tolerante a fallos
      data = {
        kpis: {},
        distribucion_estado: [],
        distribucion_prioridad: [],
        incidencias_institucion: [],
        tendencia_temporal: [],
      };
    }

    container.innerHTML = ''; // clear loading

    try {
      if (role === 'Ciudadano') {
        await import('../dashboard-ciudadano/dashboard-ciudadano.component.js');
        const dashEl = document.createElement('app-dashboard-ciudadano');
        dashEl.data = data;
        container.appendChild(dashEl);
      } else if (role === 'Institucion') {
        await import('../dashboard-institucion/dashboard-institucion.component.js');
        const dashEl = document.createElement('app-dashboard-institucion');
        dashEl.data = data;
        container.appendChild(dashEl);
      } else if (role === 'Supervisor') {
        await import('../dashboard-supervisor/dashboard-supervisor.component.js');
        const dashEl = document.createElement('app-dashboard-supervisor');
        dashEl.data = data;
        container.appendChild(dashEl);
      } else {
        await import('../dashboard-admin/dashboard-admin.component.js');
        const dashEl = document.createElement('app-dashboard-admin');
        dashEl.data = data;
        container.appendChild(dashEl);
      }
    } catch (e) {
      console.error('Error instanciando el componente del dashboard:', e);
      container.innerHTML =
        '<div class="alert alert-danger w-100">Error cargando la vista del dashboard.</div>';
    }
  }

  loadECharts() {
    return new Promise((resolve) => {
      if (window.echarts) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js';
      script.integrity = 'sha256-QvgynZibb2U53SsVu98NggJXYqwRL7tg3FeyfXvPOUY=';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  loadDashboardStyles() {
    return Promise.resolve();
  }

  renderTopServices(services) {
    const container = this.querySelector('#dashboardTopServices');
    if (!container || !services) return;

    if (services.length === 0) {
      container.innerHTML = '<p class="text-muted small">No hay suficientes datos registrados.</p>';
      return;
    }

    container.innerHTML = services
      .map(
        (service) => `
      <div>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary fw-semibold" style="font-size: 0.85rem;">${service.nombre}</span>
          <span class="badge bg-secondary-soft text-dark fw-bolder">${service.porcentaje}%</span>
        </div>
        <div class="progress rounded-pill shadow-sm" style="height: 6px; background-color: var(--border-light);">
          <div class="progress-bar bg-${service.color} rounded-pill" role="progressbar" style="width: ${service.porcentaje}%" aria-valuenow="${service.porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `
      )
      .join('');
  }

  initDashboardMap() {
    const mapContainer = this.querySelector('#dashboardMap');
    if (!mapContainer) return;

    const defaultLat = -3.99313;
    const defaultLng = -79.20422;

    this.map = L.map(mapContainer, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    this.clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 40,
    });
    this.map.addLayer(this.clusterGroup);
  }

  updateMapMarkers(markersData) {
    if (!this.map || !markersData) return;

    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
    }
    this.mockMarkers = [];

    markersData.forEach((inc) => {
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: 10,
        fillColor: '#D98A2F',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95,
      });

      marker.bindPopup(`
        <div style="font-family: 'Outfit', sans-serif;">
          <span class="badge mb-1 bg-primary-soft text-primary" style="border: 1px solid #D98A2F40; font-weight: bold;">
            ${inc.categoria}
          </span>
          <h6 class="fw-bold text-dark m-0" style="font-size: 0.9rem;">${inc.titulo || 'Sin descripción'}</h6>
        </div>
      `);
      this.mockMarkers.push(marker);
    });

    if (this.mockMarkers.length > 0) {
      this.clusterGroup.addLayers(this.mockMarkers);
    }

    // Enfoque en la incidencia más reciente
    const mostRecent = markersData[0];
    if (mostRecent?.lat && mostRecent.lng) {
      this.map.setView([mostRecent.lat, mostRecent.lng], 15);
    }
  }

  renderRecentIncidents(incidents) {
    const wrapper = this.querySelector('#recentIncidentsWrapper');
    if (!AuthService.isAdmin()) {
      if (wrapper) wrapper.classList.add('d-none');
      return;
    }

    const container = this.querySelector('#recentIncidentsList');
    if (!container || !incidents) return;

    if (incidents.length === 0) {
      container.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted py-4">No hay reportes recientes.</td></tr>';
      return;
    }

    container.innerHTML = incidents
      .map((inc) => {
        const estadoClass = getSoftClass(inc.estado);

        return `
        <tr data-id="${inc.id}">
          <td>
            <div class="fw-semibold text-dark text-truncate" style="max-width: 280px;" title="${inc.descripcion || ''}">${inc.descripcion || 'Sin descripción'}</div>
          </td>
          <td>
            <span class="text-secondary d-flex align-items-center gap-1.5">
              <i class="bi bi-tag-fill text-primary small"></i> ${inc.categoria}
            </span>
          </td>
          <td><span class="text-secondary">${inc.ubicacion}</span></td>
          <td>
            <span class="badge px-2.5 py-1.5 rounded-pill fw-bold bg-primary-soft text-primary" style="font-size: 0.75rem;">
              ${inc.prioridad}
            </span>
          </td>
          <td>
            <span class="badge px-2.5 py-1.5 rounded-pill fw-bold border ${estadoClass}" style="font-size: 0.75rem;">
              ${inc.estado}
            </span>
          </td>
          <td class="text-muted">${inc.reportado}</td>
        </tr>
      `;
      })
      .join('');
  }
}

customElements.define('app-dashboard', DashboardComponent);
