import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';
import { AuthService } from '../../core/auth.service.js';
import { getSoftClass } from '../../shared/utils/badge-states.js';

export class DashboardComponent extends BaseComponent {
  constructor() {
    super('js/pages/dashboard/dashboard.component.html');
    this.map = null;
    this.clockInterval = null;
    this.mockMarkers = []; // to keep track of added markers
  }

  onInit() {
    console.log('DashboardComponent inicializado (onInit)');

    // 1. Iniciar reloj y fecha en vivo
    this.initClock();

    // 2. Personalizar Greeting
    this.initGreeting();

    // 3. Inicializar el Mapa en vivo (esperar un micro-tick para que el DOM esté listo)
    setTimeout(() => {
      this.initDashboardMap();
      this.loadDashboardData();
      this.initGrafanaDashboards();
    }, 50);

    // 4. Renderizar menú dinámico
    this.loadMenuData();
  }

  disconnectedCallback() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initGreeting() {
    const user = AuthService.getCurrentUser();
    if (user) {
      const greetingEl = this.querySelector('#dashboardGreeting');
      if (greetingEl) {
        greetingEl.textContent = `Bienvenido, ${user.name}`;
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
          menuList = JSON.parse(menuStr);
        }
      } catch (e) {}

      if (!menuList || menuList.length === 0) {
        const response = await apiRequest('/me/menu', { method: 'GET' });
        menuList = response.data || response;
        localStorage.setItem('user_menu', JSON.stringify(menuList));
      }

      // Filtrar solo los menús de nivel superior
      const rootMenus = menuList.filter((item) => !item.padre_id);

      container.innerHTML = rootMenus
        .map(
          (menu) => `
        <div class="col-6 col-md-4 col-lg-3">
          <a href="${menu.ruta || '#/'}" class="card border border-light shadow-sm rounded-3 text-decoration-none stat-card-hover bg-white text-dark h-100">
            <div class="card-body p-3 d-flex align-items-center gap-3">
              <div class="bg-primary-soft rounded-3 p-2.5 text-primary d-inline-flex">
                <i class="${menu.icono || 'bi bi-grid'} fs-5"></i>
              </div>
              <div class="text-start">
                <span class="fw-bold small d-block" style="letter-spacing: -0.01em; line-height: 1.2;">${menu.nombre}</span>
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
      const response = await apiRequest('/dashboard/stats');
      this.renderTopServices(response.servicios_mas_utilizados);
      this.renderRecentIncidents(response.recientes);
      this.updateMapMarkers(response.mapa_reportes);
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
    }
  }

  initGrafanaDashboards() {
    const container = this.querySelector('#grafanaKpisContainer');
    if (!container) return;

    const GRAFANA_BASE = 'https://localhost:3000'; // Ajustable según host de Grafana

    const GRAFANA_PANELS = {
      Admin: [
        {
          title: 'Tiempo de Respuesta Promedio (TRP)',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/admin?panelId=1&theme=light`,
        },
        {
          title: 'Incidencias Totales',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/admin?panelId=2&theme=light`,
        },
        {
          title: 'Tasa de Éxito de Pruebas (TEP)',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/admin?panelId=3&theme=light`,
        },
        {
          title: 'Vulnerabilidades Críticas',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/admin?panelId=4&theme=light`,
        },
      ],
      Supervisor: [
        {
          title: 'Incidencias Activas',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/supervisor?panelId=1&theme=light`,
        },
        {
          title: 'Incidencias Sin Asignar',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/supervisor?panelId=2&theme=light`,
        },
        {
          title: 'Tiempo Promedio de Respuesta',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/supervisor?panelId=3&theme=light`,
        },
      ],
      Institucion: [
        {
          title: 'Mis Incidencias Activas',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/institucion?panelId=1&theme=light`,
        },
        {
          title: 'Incidencias Resueltas Hoy',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/institucion?panelId=2&theme=light`,
        },
      ],
      Ciudadano: [
        {
          title: 'Mis Reportes Realizados',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/ciudadano?panelId=1&theme=light`,
        },
        {
          title: 'Mis Reportes Resueltos',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/ciudadano?panelId=2&theme=light`,
        },
      ],
      Default: [
        {
          title: 'Incidencias Activas',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/general?panelId=1&theme=light`,
        },
        {
          title: 'Resueltas Hoy',
          url: `${GRAFANA_BASE}/d-solo/metrics-dw/general?panelId=2&theme=light`,
        },
      ],
    };

    // Resolver rol por permisos o is_admin
    let role = 'Default';
    if (AuthService.isAdmin()) {
      role = 'Admin';
    } else if (AuthService.hasPermission('Ver Despacho de Incidencia')) {
      role = 'Supervisor';
    } else if (AuthService.hasPermission('Ver Kanban')) {
      role = 'Institucion';
    } else if (AuthService.hasPermission('Crear Incidencia')) {
      role = 'Ciudadano';
    }

    const panels = GRAFANA_PANELS[role] || GRAFANA_PANELS['Default'];
    const numPanels = panels.length;

    // Determinar columnas Bootstrap para grid
    let colClass = 'col-md-3';
    if (numPanels === 3) colClass = 'col-md-4';
    else if (numPanels === 2) colClass = 'col-md-6';
    else if (numPanels === 1) colClass = 'col-md-12';

    container.innerHTML = panels
      .map(
        (panel) => `
      <div class="${colClass}">
        <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden" style="height: 150px;">
          <iframe src="${panel.url}" width="100%" height="100%" frameborder="0" style="border: none;"></iframe>
        </div>
      </div>
    `
      )
      .join('');

    // Inyectar el gráfico de provincias si el usuario es Supervisor o Admin
    const provinciaChartContainer = this.querySelector('#provinciaChartContainer');
    const iframeProvincia = this.querySelector('#iframe-provincia-chart');
    if (provinciaChartContainer && iframeProvincia && (role === 'Supervisor' || role === 'Admin')) {
      provinciaChartContainer.style.display = 'block';
      iframeProvincia.src = `${GRAFANA_BASE}/d-solo/metrics-dw/supervisor?panelId=5&theme=light`;
    }
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
        <div class="d-flex justify-content-between text-secondary small fw-bold mb-1">
          <span>${service.nombre}</span>
          <span class="text-dark">${service.porcentaje}%</span>
        </div>
        <div class="progress rounded-pill" style="height: 8px;">
          <div class="progress-bar bg-${service.color}" role="progressbar" style="width: ${service.porcentaje}%" aria-valuenow="${service.porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
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
  }

  updateMapMarkers(markersData) {
    if (!this.map || !markersData) return;

    markersData.forEach((inc) => {
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: 10,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95,
      }).addTo(this.map);

      marker.bindPopup(`
        <div style="font-family: 'Outfit', sans-serif;">
          <span class="badge mb-1 bg-primary-soft text-primary" style="border: 1px solid #3b82f640; font-weight: bold;">
            ${inc.categoria}
          </span>
          <h6 class="fw-bold text-dark m-0" style="font-size: 0.9rem;">${inc.titulo || 'Sin descripción'}</h6>
        </div>
      `);
      this.mockMarkers.push(marker);
    });

    // Enfoque en la incidencia más reciente
    const mostRecent = markersData[0];
    if (mostRecent && mostRecent.lat && mostRecent.lng) {
      this.map.setView([mostRecent.lat, mostRecent.lng], 15);
    }
  }

  renderRecentIncidents(incidents) {
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
        <tr data-id="${inc.id}" style="cursor: pointer;">
          <td><span class="fw-bold text-dark">INC-${inc.id.toString().padStart(4, '0')}</span></td>
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

    // Dblclick listener para redirección a edición
    const rows = container.querySelectorAll('tr[data-id]');
    rows.forEach((row) => {
      row.addEventListener('dblclick', () => {
        const id = row.getAttribute('data-id');
        window.location.hash = `#/incidencias/form?id=${id}`;
      });
    });
  }
}

customElements.define('app-dashboard', DashboardComponent);
