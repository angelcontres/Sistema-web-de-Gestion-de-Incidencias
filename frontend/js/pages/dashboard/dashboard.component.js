import { BaseComponent } from '../../core/base-component.js';

export class DashboardComponent extends BaseComponent {
  constructor() {
    super('js/pages/dashboard/dashboard.component.html');
    this.map = null;
    this.clockInterval = null;
  }

  onInit() {
    console.log('DashboardComponent inicializado (onInit)');
    
    // 1. Iniciar reloj y fecha en vivo
    this.initClock();

    // 2. Inicializar el Mapa en vivo (esperar un micro-tick para que el DOM esté listo)
    setTimeout(() => {
      this.initDashboardMap();
    }, 50);

    // 3. Renderizar listado de incidencias
    this.renderRecentIncidents();
  }

  disconnectedCallback() {
    // Limpiar intervalo del reloj
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }

    // Limpiar instancia del mapa de Leaflet
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initClock() {
    const clockEl = this.querySelector('#liveClock');
    const dateEl = this.querySelector('#liveDate');

    const updateTime = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('es-EC', { hour12: false });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('es-EC', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  initDashboardMap() {
    const mapContainer = this.querySelector('#dashboardMap');
    if (!mapContainer) return;

    // Coordenadas centrales: Loja, Ecuador
    const defaultLat = -3.99313;
    const defaultLng = -79.20422;

    this.map = L.map(mapContainer, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false
    });

    // Agregar control de zoom en una esquina más limpia
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Agregar capa de mapa premium y limpia (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Mock markers de incidencias
    const mockIncidents = [
      {
        lat: -3.9915,
        lng: -79.2025,
        title: "Fuga de Agua Potable",
        desc: "Fuga masiva reportada en calzada principal.",
        priority: "Alta",
        color: "#e11d48"
      },
      {
        lat: -3.9975,
        lng: -79.2085,
        title: "Corte de Energía Sectorial",
        desc: "Fallo en transformador afecta a 3 manzanas.",
        priority: "Crítica",
        color: "#f59e0b"
      },
      {
        lat: -3.9885,
        lng: -79.2065,
        title: "Semáforo Averiado",
        desc: "Intersección con alto flujo vehicular inactiva.",
        priority: "Media",
        color: "#3b82f6"
      },
      {
        lat: -3.9950,
        lng: -79.2010,
        title: "Desechos Acumulados",
        desc: "Falta de recolección en contenedor municipal.",
        priority: "Baja",
        color: "#10b981"
      }
    ];

    // Agregar markers al mapa
    mockIncidents.forEach(inc => {
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: 10,
        fillColor: inc.color,
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(this.map);

      marker.bindPopup(`
        <div style="font-family: 'Outfit', sans-serif;">
          <span class="badge mb-1" style="background-color: ${inc.color}1c; color: ${inc.color}; border: 1px solid ${inc.color}40; font-weight: bold;">
            ${inc.priority}
          </span>
          <h6 class="fw-bold text-dark m-0" style="font-size: 0.9rem;">${inc.title}</h6>
          <p class="text-secondary small mt-1 mb-0" style="line-height: 1.3;">${inc.desc}</p>
        </div>
      `);
    });
  }

  renderRecentIncidents() {
    const container = this.querySelector('#recentIncidentsList');
    if (!container) return;

    const incidents = [
      {
        id: "INC-2026-084",
        titulo: "Fuga de Agua Potable en Av. Orillas del Zamora",
        categoria: "Agua y Alcantarillado",
        ubicacion: "El Sagrario, Loja",
        prioridad: "Alta",
        prioridadClass: "bg-danger-soft",
        estado: "En Progreso",
        estadoClass: "bg-warning-soft text-warning border-warning border-opacity-25",
        reportado: "Hace 10 min"
      },
      {
        id: "INC-2026-083",
        titulo: "Corte de Energía en Sector La Pradera",
        categoria: "Energía Eléctrica",
        ubicacion: "San Sebastián, Loja",
        prioridad: "Crítica",
        prioridadClass: "bg-danger text-white",
        estado: "Pendiente",
        estadoClass: "bg-secondary-soft text-secondary border-secondary border-opacity-25",
        reportado: "Hace 25 min"
      },
      {
        id: "INC-2026-082",
        titulo: "Semáforo inactivo en Av. Cuxibamba",
        categoria: "Tránsito y Vías",
        ubicacion: "El Valle, Loja",
        prioridad: "Media",
        prioridadClass: "bg-warning-soft",
        estado: "En Progreso",
        estadoClass: "bg-warning-soft text-warning border-warning border-opacity-25",
        reportado: "Hace 1 hora"
      },
      {
        id: "INC-2026-081",
        titulo: "Contenedor de basura desbordado en Parque Central",
        categoria: "Ambiental y Aseo",
        ubicacion: "El Sagrario, Loja",
        prioridad: "Baja",
        prioridadClass: "bg-primary-soft",
        estado: "Resuelta",
        estadoClass: "bg-success-soft text-success border-success border-opacity-25",
        reportado: "Hace 2 horas"
      },
      {
        id: "INC-2026-080",
        titulo: "Bache crítico en carril sur Av. Salvador Bustamante",
        categoria: "Infraestructura Vial",
        ubicacion: "Sucre, Loja",
        prioridad: "Media",
        prioridadClass: "bg-warning-soft",
        estado: "Resuelta",
        estadoClass: "bg-success-soft text-success border-success border-opacity-25",
        reportado: "Hace 4 horas"
      }
    ];

    container.innerHTML = incidents.map(inc => `
      <tr>
        <td><span class="fw-bold text-dark">${inc.id}</span></td>
        <td>
          <div class="fw-semibold text-dark">${inc.titulo}</div>
        </td>
        <td>
          <span class="text-secondary d-flex align-items-center gap-1.5">
            <i class="bi bi-tag-fill text-primary small"></i> ${inc.categoria}
          </span>
        </td>
        <td><span class="text-secondary">${inc.ubicacion}</span></td>
        <td>
          <span class="badge px-2.5 py-1.5 rounded-pill fw-bold ${inc.prioridadClass}" style="font-size: 0.75rem;">
            ${inc.prioridad}
          </span>
        </td>
        <td>
          <span class="badge px-2.5 py-1.5 rounded-pill fw-bold border ${inc.estadoClass}" style="font-size: 0.75rem;">
            ${inc.estado}
          </span>
        </td>
        <td class="text-muted">${inc.reportado}</td>
      </tr>
    `).join('');
  }
}

customElements.define('app-dashboard', DashboardComponent);
