import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { UIHelper } from '../../../../shared/utils/ui-helper.js';
import { MAP_CONFIG } from '../../../../shared/constants.js';
import './direccion-form.component.js';

export class UbicacionesDireccionesComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/direcciones/ubicaciones-direcciones.component.html');
    
    this.direccionesList = [];
    this.paisesList = [];
    
    // Maps
    this.map = null;
    this.mapMarkers = [];
  }

  async onInit() {
    // Load initial data
    await this.cargarPaises();
    await this.cargarDirecciones();

    // Listen to global country/territory updates
    document.addEventListener('paises-updated', (e) => {
      this.paisesList = e.detail.paises || [];
      this.llenarPaisSelect();
    });

    // Listen to form component save event
    this.addEventListener('direccion-saved', (e) => {
      const isEdit = e.detail.isEdit;
      UIHelper.mostrarAlerta(this, 'success', `Dirección ${isEdit ? 'actualizada' : 'creada'} con éxito.`);
      this.cargarDirecciones();
    });

    // Setup Event Listeners
    const btnNuevaDireccion = this.querySelector('#btnNuevaDireccion');
    const isAdmin = AuthService.isAdmin();

    if (btnNuevaDireccion) {
      if (!isAdmin) {
        btnNuevaDireccion.classList.add('d-none');
      } else {
        btnNuevaDireccion.addEventListener('click', () => {
          const formComp = this.querySelector('#direccionFormComp');
          if (formComp) formComp.abrir();
        });
      }
    }

    // Combined Filters (Search + Country + Status) with Debounce (250ms)
    const direccionSearch = this.querySelector('#direccionSearch');
    const filterPaisSelect = this.querySelector('#filterPaisSelect');
    const filterEstadoSelect = this.querySelector('#filterEstadoSelect');

    const triggerFilter = () => this.filtrarDirecciones();

    if (direccionSearch) {
      let debounceTimeout;
      direccionSearch.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(triggerFilter, 250);
      });
    }
    if (filterPaisSelect) {
      filterPaisSelect.addEventListener('change', triggerFilter);
    }
    if (filterEstadoSelect) {
      filterEstadoSelect.addEventListener('change', triggerFilter);
    }

    // Map listeners
    const btnCentrarMapa = this.querySelector('#btnCentrarMapa');
    if (btnCentrarMapa) {
      btnCentrarMapa.addEventListener('click', () => this.centrarMapaEnTodo());
    }

    // Lazy load the main map when visible
    setTimeout(() => {
      if (this.offsetParent !== null) {
        this.initMainMap();
      }
    }, 100);
  }

  disconnectedCallback() {
    // Memory leak prevention: Clean up Leaflet map instances
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn('Error al destruir el mapa principal:', e);
      }
      this.map = null;
    }
  }

  async cargarPaises() {
    try {
      const paises = await UbicacionesService.getPaises();
      this.paisesList = paises || [];
      this.llenarPaisSelect();
    } catch (e) {
      console.error(e);
    }
  }

  llenarPaisSelect() {
    const filterSelect = this.querySelector('#filterPaisSelect');
    if (!filterSelect) return;
    
    const activePaises = this.paisesList.filter(p => p.activo);
    filterSelect.innerHTML = '<option value="">Todos los Países</option>' + 
      activePaises.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  }

  async cargarDirecciones() {
    try {
      const list = await UbicacionesService.getDirecciones();
      this.direccionesList = list || [];
      this.filtrarDirecciones();
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      UIHelper.mostrarAlerta(this, 'error', 'No se pudieron cargar las direcciones.');
    }
  }

  initMainMap() {
    const mapDiv = this.querySelector('#map');
    if (!mapDiv) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    // Default center depending on user's assigned country
    const user = AuthService.getCurrentUser();
    let centro = MAP_CONFIG.DEFAULT_CENTER;
    let zoom = MAP_CONFIG.DEFAULT_ZOOM;

    if (user && user.pais) {
      const config = MAP_CONFIG.COUNTRY_CENTERS[user.pais.codigo_iso];
      if (config) {
        centro = config.center;
        zoom = config.zoom;
      }
    }

    this.map = L.map(mapDiv).setView(centro, zoom);

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);
  }

  limpiarMapaPrincipal() {
    if (!this.map) return;

    // Clear previous markers
    this.mapMarkers.forEach(m => this.map.removeLayer(m));
    this.mapMarkers = [];

    // Recenter to default country view
    const user = AuthService.getCurrentUser();
    let centro = MAP_CONFIG.DEFAULT_CENTER;
    let zoom = MAP_CONFIG.DEFAULT_ZOOM;
    if (user && user.pais) {
      const config = MAP_CONFIG.COUNTRY_CENTERS[user.pais.codigo_iso];
      if (config) {
        centro = config.center;
        zoom = config.zoom;
      }
    }
    this.map.setView(centro, zoom);
  }

  mostrarUnicoMarcadorEnMapa(dir) {
    if (!this.map) return;

    // Clear previous markers
    this.mapMarkers.forEach(m => this.map.removeLayer(m));
    this.mapMarkers = [];

    // Create single marker
    const marker = L.marker([dir.latitud, dir.longitud]).addTo(this.map);
    const pais = dir.territorio?.pais?.nombre || '';
    const path = this.obtenerPathTerritorio(dir.territorio);
    
    const popupHtml = `
      <div class="p-1">
        <h6 class="fw-bold text-dark mb-1">${dir.detalle}</h6>
        <p class="text-muted small mb-1"><i class="bi bi-geo-alt-fill text-danger"></i> ${pais} &raquo; ${path}</p>
        ${dir.referencia ? `<small class="text-secondary d-block mb-1">Ref: ${dir.referencia}</small>` : ''}
        ${dir.codigo_postal ? `<span class="badge bg-secondary-soft text-secondary small">CP: ${dir.codigo_postal}</span>` : ''}
      </div>
    `;
    
    marker.bindPopup(popupHtml).openPopup();
    this.mapMarkers.push(marker);

    // Zoom and center
    this.map.setView([dir.latitud, dir.longitud], 16);
  }

  centrarMapaEnTodo() {
    if (!this.map || this.mapMarkers.length === 0) return;
    const group = new L.featureGroup(this.mapMarkers);
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  obtenerPathTerritorio(territorio) {
    if (!territorio) return '';
    const parts = [];
    let current = territorio;
    
    if (current.nombre) {
      parts.unshift(current.nombre);
    }
    if (current.parent) {
      parts.unshift(current.parent.nombre);
      if (current.parent.parent) {
        parts.unshift(current.parent.parent.nombre);
      }
    }
    return parts.join(' &raquo; ');
  }

  renderDireccionesTable(lista) {
    const tbody = this.querySelector('#direccionesTableBody');
    const emptyState = this.querySelector('#direccionesEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (lista.length === 0) {
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');

    const isAdmin = AuthService.isAdmin();

    lista.forEach((dir) => {
      const tr = document.createElement('tr');
      tr.classList.add('cursor-pointer');
      
      const badgeClass = dir.activo ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';
      const badgeText = dir.activo ? 'Activa' : 'Inactiva';
      
      const paisNombre = dir.territorio?.pais?.nombre || 'N/A';
      const pathTerritorios = this.obtenerPathTerritorio(dir.territorio);

      tr.innerHTML = `
        <td class="ps-3 fw-semibold text-dark">${paisNombre}</td>
        <td class="small text-muted text-truncate" style="max-width: 150px;" title="${pathTerritorios.replace(/&raquo;/g, '>')}" >${pathTerritorios}</td>
        <td class="fw-medium text-dark text-truncate" style="max-width: 180px;" title="${dir.detalle}">${dir.detalle}</td>
        <td><code class="text-secondary small fw-semibold">${dir.codigo_postal || 'N/A'}</code></td>
        <td><span class="badge ${badgeClass} rounded-pill px-2 py-0.5 small">${badgeText}</span></td>
        <td class="text-end pe-3">
          <div class="dropdown ${isAdmin ? '' : 'd-none'}" onclick="event.stopPropagation()">
            <button class="btn btn-light btn-sm text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-popper-config='{"strategy":"fixed"}' aria-expanded="false">
              <i class="bi bi-three-dots-vertical fs-6"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><button class="dropdown-item d-flex align-items-center gap-2 text-primary small fw-medium btn-editar-dir" type="button" data-id="${dir.id}"><i class="bi bi-pencil-square"></i> Editar</button></li>
              <li><button class="dropdown-item d-flex align-items-center gap-2 text-danger small fw-medium btn-eliminar-dir" type="button" data-id="${dir.id}"><i class="bi bi-trash"></i> Eliminar</button></li>
            </ul>
          </div>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown') || e.target.closest('button')) return;
        
        if (dir.latitud && dir.longitud && this.map) {
          this.mostrarUnicoMarcadorEnMapa(dir);
        } else {
          UIHelper.mostrarAlerta(this, 'error', 'Esta dirección no cuenta con coordenadas.');
        }
      });

      if (isAdmin) {
        tr.querySelector('.btn-editar-dir').addEventListener('click', () => {
          const formComp = this.querySelector('#direccionFormComp');
          if (formComp) formComp.abrir(dir);
        });
        tr.querySelector('.btn-eliminar-dir').addEventListener('click', () => this.eliminarDireccion(dir.id));
      }

      tbody.appendChild(tr);
    });
  }

  filtrarDirecciones() {
    const searchInput = this.querySelector('#direccionSearch');
    const filterPaisSelect = this.querySelector('#filterPaisSelect');
    const filterEstadoSelect = this.querySelector('#filterEstadoSelect');

    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const paisId = filterPaisSelect ? filterPaisSelect.value : '';
    const estado = filterEstadoSelect ? filterEstadoSelect.value : '';

    const filtered = this.direccionesList.filter((dir) => {
      // 1. Text Query Filter
      let matchesText = true;
      if (query) {
        const detalle = (dir.detalle || '').toLowerCase();
        const ref = (dir.referencia || '').toLowerCase();
        const cp = (dir.codigo_postal || '').toLowerCase();
        const pais = (dir.territorio?.pais?.nombre || '').toLowerCase();
        const terr = (dir.territorio?.nombre || '').toLowerCase();
        
        matchesText = detalle.includes(query) || ref.includes(query) || cp.includes(query) || pais.includes(query) || terr.includes(query);
      }

      // 2. Country Filter
      const matchesPais = !paisId || (dir.territorio?.pais_id == paisId);

      // 3. Status Filter
      const matchesEstado = !estado || (estado === 'activo' ? dir.activo : !dir.activo);

      return matchesText && matchesPais && matchesEstado;
    });

    this.renderDireccionesTable(filtered);
    this.limpiarMapaPrincipal();
  }

  async eliminarDireccion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta dirección?')) return;

    try {
      await UbicacionesService.deleteDireccion(id);
      UIHelper.mostrarAlerta(this, 'success', 'Dirección eliminada con éxito.');
      await this.cargarDirecciones();
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      UIHelper.mostrarAlerta(this, 'error', `No se pudo eliminar: ${error.message}`);
    }
  }
}

customElements.define('app-ubicaciones-direcciones', UbicacionesDireccionesComponent);
