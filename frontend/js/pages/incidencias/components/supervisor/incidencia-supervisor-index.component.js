import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { ModalService } from '../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';
import { getBadgeClass, getTextColorClass } from '../../../../shared/utils/badge-states.js';

export class IncidenciaSupervisorIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/supervisor/incidencia-supervisor-index.component.html');
    this.map = null;
    this.clusterGroup = null;
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
      const response = await IncidenciaService.getAll();
      this.incidencias = Array.isArray(response) ? response : response.data || [];
      this.renderAlertas();
      this.initOrUpdateMap();
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

    // Alertas: Pendientes (1) o En Revisión (2)
    const alertas = this.incidencias.filter((i) => i.estado_id === 1 || i.estado_id === 2);
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

      const textClass = getTextColorClass(inc.estado);
      const icon = `<i class="bi bi-circle-fill text-${textClass} me-2" style="font-size: 0.5rem;"></i>`;
      const prioridad = inc.prioridad ? inc.prioridad.nombre : 'Normal';
      const color = inc.prioridad ? inc.prioridad.color_hex : '#6c757d';

      a.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center mb-2">
          <h6 class="mb-0 fw-bold text-truncate text-dark" style="max-width: 70%;">${icon} #${inc.id} - ${inc.incidencia_descripcion || 'Sin descripción'}</h6>
          <span class="badge rounded-pill shadow-sm" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}40; font-size: 0.65rem; font-weight: 700;">${prioridad}</span>
        </div>
        <div class="small text-muted mb-2"><i class="bi bi-geo-alt-fill text-primary me-1"></i> ${inc.direccion ? inc.direccion.detalle : 'Desconocida'}</div>
        <div class="small text-muted d-flex justify-content-between align-items-center">
          <span class="d-flex align-items-center gap-1"><i class="bi bi-clock-history"></i> ${new Date(inc.created_at).toLocaleDateString()}</span>
          <span class="badge bg-${getTextColorClass(inc.estado)}-soft text-${getTextColorClass(inc.estado)} rounded-pill px-2 py-1 fw-bold">${inc.estado ? inc.estado.nombre : ''}</span>
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

      // Initialize the cluster group ONCE
      this.clusterGroup = L.markerClusterGroup({
        chunkedLoading: true, // Optimizes performance for 1000+ markers
        maxClusterRadius: 50,
      });
      this.map.addLayer(this.clusterGroup);
    }

    // Limpiar marcadores anteriores
    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
    }
    this.markers = [];

    const conCoordenadas = this.incidencias.filter(
      (i) => i.direccion?.latitud && i.direccion.longitud
    );

    conCoordenadas.forEach((inc) => {
      const lat = Number.parseFloat(inc.direccion.latitud);
      const lng = Number.parseFloat(inc.direccion.longitud);

      let markerColor = 'blue';
      if (inc.estado_id === 1) markerColor = 'red';
      else if (inc.estado_id === 2) markerColor = 'orange';
      else if (inc.estado_id === 4) markerColor = 'green';

      const customIcon = new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const m = L.marker([lat, lng], { icon: customIcon });

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

    // Add all markers to the cluster group efficiently
    if (this.markers.length > 0) {
      this.clusterGroup.addLayers(this.markers);
      // Fit bounds to show all clusters
      this.map.fitBounds(this.clusterGroup.getBounds().pad(0.1));
    }
  }

  abrirModalDespacho(inc) {
    this.incidenciaSeleccionada = inc;

    this.querySelector('#modal-incidencia-id').textContent = `#${inc.id}`;
    const badgeEl = this.querySelector('#modal-incidencia-estado');
    badgeEl.textContent = inc.estado ? inc.estado.nombre : '';
    badgeEl.className = `badge bg-${getBadgeClass(inc.estado)}`;
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
    if (inc.estado_id >= 3) {
      // 3: En Proceso, 4: Resuelto, 5: Rechazado
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

    const isConfirmed = await ModalService.confirm(
      'Despachar Incidencia',
      `¿Está seguro de que desea despachar la incidencia #${this.incidenciaSeleccionada.id}?`,
      'Despachar',
      'Cancelar',
      'btn-primary'
    );

    if (!isConfirmed) return;

    const btn = this.querySelector('#btn-despachar-incidencia');
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';

    try {
      // Estado ID 3 es "En Proceso"
      await IncidenciaService.update(this.incidenciaSeleccionada.id, {
        version: this.incidenciaSeleccionada.version,
        estado_id: 3,
        tipo_incidencia_id: this.incidenciaSeleccionada.tipo_incidencia_id,
        sub_tipo_incidencia_id: this.incidenciaSeleccionada.sub_tipo_incidencia_id,
      });

      this.modal.hide();
      await this.cargarDatos(); // Recargar datos para refrescar la lista y el mapa

      ToastService.success('Incidencia despachada con éxito.');
    } catch (error) {
      console.error('Error al despachar la incidencia:', error);
      ToastService.error(
        'Error al despachar la incidencia. Puede que alguien más la haya modificado.'
      );
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
