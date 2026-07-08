import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';

export class IncidenciaSupervisorIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/supervisor/incidencia-supervisor-index.component.html');
    this.map = null;
    this.markers = [];
    this.chart = null;
    this.incidencias = [];
    this.modal = null;
    this.incidenciaSeleccionada = null;
  }

  async onInit() {
    this.setupEventListeners();
    await this.cargarDatos();
  }

  setupEventListeners() {
    const btnRefresh = this.querySelector('#btn-refresh-dashboard');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.cargarDatos());
    }

    const btnDespachar = this.querySelector('#btn-despachar-incidencia');
    if (btnDespachar) {
      btnDespachar.addEventListener('click', () => this.despacharIncidencia());
    }
  }

  async cargarDatos() {
    this.mostrarSpinners(true);
    try {
      this.incidencias = await IncidenciaService.getAll();
      this.renderAlertas();
      this.initOrUpdateMap();
      this.renderChart();
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.mostrarSpinners(false);
    }
  }

  renderAlertas() {
    const container = this.querySelector('#alertas-container');
    const badge = this.querySelector('#badge-alertas');
    if (!container || !badge) return;

    container.innerHTML = '';

    // Alertas: Pendientes (2) o En Revisión (3)
    const alertas = this.incidencias.filter((i) => i.estado_id === 2 || i.estado_id === 3);
    badge.textContent = alertas.length;

    if (alertas.length === 0) {
      container.innerHTML =
        '<div class="p-4 text-center text-muted small">No hay alertas pendientes.</div>';
      return;
    }

    alertas.forEach((inc) => {
      const a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.className = 'list-group-item list-group-item-action p-3 border-start-0 border-end-0';

      const icon =
        inc.estado_id === 2
          ? '<i class="bi bi-circle-fill text-danger me-2" style="font-size: 0.5rem;"></i>'
          : '<i class="bi bi-circle-fill text-warning me-2" style="font-size: 0.5rem;"></i>';
      const prioridad = inc.prioridad ? inc.prioridad.nombre : 'Normal';
      const color = inc.prioridad ? inc.prioridad.color_hex : '#6c757d';

      a.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center mb-1">
          <h6 class="mb-0 fw-bold text-truncate" style="max-width: 70%;">${icon} #${inc.id} - ${inc.incidencia_descripcion || 'Sin descripción'}</h6>
          <span class="badge rounded-pill" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}; font-size: 0.65rem;">${prioridad}</span>
        </div>
        <div class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i> ${inc.direccion ? inc.direccion.detalle : 'Desconocida'}</div>
        <div class="small text-muted d-flex justify-content-between">
          <span><i class="bi bi-clock me-1"></i> ${new Date(inc.created_at).toLocaleDateString()}</span>
          <span class="fw-bold text-${inc.estado_id === 2 ? 'danger' : 'warning'}">${inc.estado ? inc.estado.nombre : ''}</span>
        </div>
      `;

      a.addEventListener('click', () => this.abrirModalDespacho(inc));

      container.appendChild(a);
    });
  }

  initOrUpdateMap() {
    const mapContainer = this.querySelector('#map');
    if (!mapContainer) return;

    if (!this.map) {
      // Coordenadas globales por defecto si no hay data
      this.map = L.map(mapContainer).setView([-1.831239, -78.183406], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
    }

    // Limpiar marcadores anteriores
    this.markers.forEach((m) => this.map.removeLayer(m));
    this.markers = [];

    const conCoordenadas = this.incidencias.filter(
      (i) => i.direccion && i.direccion.latitud && i.direccion.longitud
    );

    conCoordenadas.forEach((inc) => {
      const lat = parseFloat(inc.direccion.latitud);
      const lng = parseFloat(inc.direccion.longitud);

      let markerColor = 'blue';
      if (inc.estado_id === 2) markerColor = 'red';
      else if (inc.estado_id === 3) markerColor = 'orange';
      else if (inc.estado_id === 5) markerColor = 'green';

      const customIcon = new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const m = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

      // Creamos un botón para el popup en lugar de un enlace href simple
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="fw-bold mb-1">#${inc.id} - ${inc.tipo ? inc.tipo.nombre : 'Incidencia'}</div>
        <div class="small text-muted mb-2">${inc.incidencia_descripcion || ''}</div>
      `;
      const btnPopup = document.createElement('button');
      btnPopup.className = 'btn btn-sm btn-outline-primary w-100 mt-2';
      btnPopup.textContent = 'Ver Detalles y Despachar';
      btnPopup.addEventListener('click', () => {
        this.abrirModalDespacho(inc);
      });
      popupContent.appendChild(btnPopup);

      m.bindPopup(popupContent);
      this.markers.push(m);
    });

    // Centrar mapa si hay incidencias
    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  renderChart() {
    const canvas = this.querySelector('#chart-incidencias-pais');
    if (!canvas || !window.Chart) return;

    // Agrupar por país
    const paisesMap = {};
    this.incidencias.forEach((inc) => {
      const paisNombre =
        inc.direccion && inc.direccion.territorio && inc.direccion.territorio.pais
          ? inc.direccion.territorio.pais.nombre
          : 'Desconocido';
      if (!paisesMap[paisNombre]) paisesMap[paisNombre] = 0;
      paisesMap[paisNombre]++;
    });

    const labels = Object.keys(paisesMap);
    const data = Object.values(paisesMap);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Incidencias',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  abrirModalDespacho(inc) {
    this.incidenciaSeleccionada = inc;

    this.querySelector('#modal-incidencia-id').textContent = `#${inc.id}`;
    this.querySelector('#modal-incidencia-estado').textContent = inc.estado
      ? inc.estado.nombre
      : '';
    this.querySelector('#modal-incidencia-fecha').textContent = new Date(
      inc.created_at
    ).toLocaleString();
    this.querySelector('#modal-incidencia-tipo').textContent = inc.tipo
      ? inc.tipo.nombre
      : 'General';
    this.querySelector('#modal-incidencia-desc').textContent =
      inc.incidencia_descripcion || 'Sin descripción';
    this.querySelector('#modal-incidencia-dir').textContent = inc.direccion
      ? inc.direccion.detalle
      : 'Desconocida';
    this.querySelector('#modal-incidencia-prioridad').textContent = inc.prioridad
      ? inc.prioridad.nombre
      : 'Normal';
    this.querySelector('#modal-incidencia-afectados').textContent =
      inc.cantidad_afectados_incidencia || 0;

    // Disable button if already dispatched/in process/resolved
    const btn = this.querySelector('#btn-despachar-incidencia');
    if (inc.estado_id >= 4) {
      // 4: En Proceso, 5: Resuelto, 6: Rechazado
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Ya Despachada';
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send-check-fill me-2"></i>Despachar';
    }

    if (!this.modal) {
      this.modal = new bootstrap.Modal(this.querySelector('#modal-detalle-incidencia'));
    }
    this.modal.show();
  }

  async despacharIncidencia() {
    if (!this.incidenciaSeleccionada) return;

    const btn = this.querySelector('#btn-despachar-incidencia');
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';

    try {
      // Estado ID 4 es "En Proceso"
      await IncidenciaService.update(this.incidenciaSeleccionada.id, {
        version: this.incidenciaSeleccionada.version,
        estado_id: 4,
        tipo_incidencia_id: this.incidenciaSeleccionada.tipo_incidencia_id,
        sub_tipo_incidencia_id: this.incidenciaSeleccionada.sub_tipo_incidencia_id,
      });

      this.modal.hide();
      await this.cargarDatos(); // Recargar datos para refrescar la lista y el mapa

      // Mostrar toast de exito (si tuvieras una utilidad global)
      alert('Incidencia despachada con éxito.');
    } catch (error) {
      console.error('Error al despachar la incidencia:', error);
      alert('Error al despachar la incidencia. Puede que alguien más la haya modificado.');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send-check-fill me-2"></i>Despachar';
    }
  }

  mostrarSpinners(show) {
    const spinner = this.querySelector('.spinner-list');
    if (spinner) {
      if (show) spinner.classList.remove('d-none');
      else spinner.classList.add('d-none');
    }
  }
}

customElements.define('app-incidencia-supervisor-index', IncidenciaSupervisorIndexComponent);
