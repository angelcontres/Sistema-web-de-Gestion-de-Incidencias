import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class UbicacionesDireccionesComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/direcciones/ubicaciones-direcciones.component.html');
    
    this.direccionesList = [];
    this.paisesList = [];
    
    // Maps
    this.map = null;
    this.modalMap = null;
    this.mapMarkers = [];
    this.modalMarker = null;
    this.tempCoords = null;
    
    this.direccionModalObj = null;
  }

  async onInit() {
    // Initialize Modal and move it to document.body to avoid stacking context / backdrop issues
    try {
      const modalEl = this.querySelector('#direccionModal');
      if (modalEl) {
        document.body.appendChild(modalEl);
        this.direccionModalObj = new bootstrap.Modal(modalEl);
      }
    } catch (e) {
      console.warn('Error inicializando el modal de direcciones.', e);
    }

    // Load initial data
    await this.cargarPaises();
    await this.cargarDirecciones();

    // Listen to global country/territory updates
    document.addEventListener('paises-updated', (e) => {
      this.paisesList = e.detail.paises || [];
      this.llenarPaisSelect();
    });

    // Setup Event Listeners
    const btnNuevaDireccion = this.querySelector('#btnNuevaDireccion');
    const isAdmin = AuthService.isAdmin();

    if (btnNuevaDireccion) {
      if (!isAdmin) {
        btnNuevaDireccion.classList.add('d-none');
      } else {
        btnNuevaDireccion.addEventListener('click', () => this.abrirModalDireccion());
      }
    }

    const direccionForm = this.querySelector('#direccionForm');
    if (direccionForm) {
      direccionForm.addEventListener('submit', (e) => this.guardarDireccion(e));
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

    // Cascading dropdowns (Modal Form)
    const dirPaisSelect = this.querySelector('#dirPaisSelect');
    if (dirPaisSelect) {
      dirPaisSelect.addEventListener('change', (e) => {
        this.cargarDireccionDropdownNivel1(e.target.value);
        
        // Clear coordinates and marker when country changes to prevent geo-incoherence
        const inputLat = document.querySelector('#direccionLatitud');
        const inputLng = document.querySelector('#direccionLongitud');
        if (inputLat) inputLat.value = '';
        if (inputLng) inputLng.value = '';
        this.tempCoords = null;
        if (this.modalMarker && this.modalMap) {
          this.modalMap.removeLayer(this.modalMarker);
          this.modalMarker = null;
        }
      });
    }

    const dirNivel1Select = this.querySelector('#dirNivel1Select');
    if (dirNivel1Select) {
      dirNivel1Select.addEventListener('change', (e) => {
        const parentId = e.target.value;
        const paisId = this.querySelector('#dirPaisSelect').value;
        this.cargarDireccionDropdownNivel2(paisId, parentId);
      });
    }

    const dirNivel2Select = this.querySelector('#dirNivel2Select');
    if (dirNivel2Select) {
      dirNivel2Select.addEventListener('change', (e) => {
        const parentId = e.target.value;
        const paisId = this.querySelector('#dirPaisSelect').value;
        this.cargarDireccionDropdownNivel3(paisId, parentId);
      });
    }

    // Map listeners
    const btnCentrarMapa = this.querySelector('#btnCentrarMapa');
    if (btnCentrarMapa) {
      btnCentrarMapa.addEventListener('click', () => this.centrarMapaEnTodo());
    }

    // Modal shown map load
    const modalEl = document.querySelector('#direccionModal');
    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', () => this.initModalMap());
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
    if (this.modalMap) {
      try {
        this.modalMap.remove();
      } catch (e) {
        console.warn('Error al destruir el mapa del modal:', e);
      }
      this.modalMap = null;
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
    const select = this.querySelector('#dirPaisSelect');
    const filterSelect = this.querySelector('#filterPaisSelect');
    
    const activePaises = this.paisesList.filter(p => p.activo);
    const optionsHtml = activePaises
      .map(p => `<option value="${p.id}">${p.nombre}</option>`)
      .join('');

    if (select) {
      select.innerHTML = `<option value="">-- Seleccione --</option>${optionsHtml}`;
      if (activePaises.length === 1) {
        select.value = activePaises[0].id;
        // Trigger Nivel 1 dropdown load
        this.cargarDireccionDropdownNivel1(activePaises[0].id);
      }
    }
    
    if (filterSelect) {
      const currentVal = filterSelect.value;
      filterSelect.innerHTML = `<option value="">Todos los Países</option>${optionsHtml}`;
      if (activePaises.length === 1) {
        filterSelect.value = activePaises[0].id;
      } else {
        filterSelect.value = currentVal;
      }
    }
  }

  async cargarDirecciones() {
    try {
      const direcciones = await UbicacionesService.getDirecciones();
      this.direccionesList = direcciones || [];
      
      // Apply filters on initial load
      this.filtrarDirecciones();
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      this.mostrarAlertaLocal('error', `Error al cargar direcciones: ${error.message}`);
    }
  }

  // Map Logic
  initMainMap() {
    const mapDiv = this.querySelector('#map');
    if (!mapDiv) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    // Default center depending on user's assigned country
    const user = AuthService.getCurrentUser();
    let centro = [-1.8312, -78.1834]; // Ecuador by default
    let zoom = 5;

    if (user && user.pais) {
      const centrosPaises = {
        'PE': [-9.1900, -75.0152],
        'MX': [23.6345, -102.5528],
        'EC': [-1.8312, -78.1834],
      };
      centro = centrosPaises[user.pais.codigo_iso] || [-1.8312, -78.1834];
      zoom = 6;
    }

    this.map = L.map(mapDiv).setView(centro, zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
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
    let centro = [-1.8312, -78.1834];
    let zoom = 5;
    if (user && user.pais) {
      const centrosPaises = {
        'PE': [-9.1900, -75.0152],
        'MX': [23.6345, -102.5528],
        'EC': [-1.8312, -78.1834],
      };
      centro = centrosPaises[user.pais.codigo_iso] || [-1.8312, -78.1834];
      zoom = 6;
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
    this.map.fitBounds(group.getBounds().pad(0.15));
  }

  initModalMap() {
    const modalMapDiv = document.querySelector('#modalMap');
    if (!modalMapDiv) return;

    if (this.modalMap) {
      this.modalMap.invalidateSize();
    } else {
      this.modalMap = L.map(modalMapDiv).setView([-1.8312, -78.1834], 5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(this.modalMap);

      this.modalMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.establecerMarcadorModal(lat, lng);
      });
    }

    if (this.tempCoords) {
      this.establecerMarcadorModal(this.tempCoords.lat, this.tempCoords.lng);
      this.modalMap.setView([this.tempCoords.lat, this.tempCoords.lng], 14);
      this.tempCoords = null;
    } else {
      this.centrarModalMapaSegunPais();
    }
  }

  establecerMarcadorModal(lat, lng) {
    if (!this.modalMap) return;

    if (this.modalMarker) {
      this.modalMarker.setLatLng([lat, lng]);
    } else {
      this.modalMarker = L.marker([lat, lng], { draggable: true }).addTo(this.modalMap);
      this.modalMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.actualizarInputsCoordenadas(pos.lat, pos.lng);
      });
    }

    this.actualizarInputsCoordenadas(lat, lng);
  }

  actualizarInputsCoordenadas(lat, lng) {
    const inputLat = document.querySelector('#direccionLatitud');
    const inputLng = document.querySelector('#direccionLongitud');
    if (inputLat && inputLng) {
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
    }
  }

  centrarModalMapaSegunPais() {
    const selectPais = document.querySelector('#dirPaisSelect');
    const paisId = selectPais ? selectPais.value : '';
    if (!paisId || !this.modalMap) return;

    const pais = this.paisesList.find(p => p.id == paisId);
    if (!pais) return;

    const centrosPaises = {
      'PE': [-9.1900, -75.0152],
      'MX': [23.6345, -102.5528],
      'EC': [-1.8312, -78.1834],
    };

    const centro = centrosPaises[pais.codigo_iso] || [-1.8312, -78.1834];
    this.modalMap.setView(centro, 6);
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
      tr.style.cursor = 'pointer';
      
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
            <button class="btn btn-light btn-sm text-secondary p-1.5 rounded-2 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
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
          this.mostrarAlertaLocal('error', 'Esta dirección no cuenta con coordenadas.');
        }
      });

      if (isAdmin) {
        tr.querySelector('.btn-editar-dir').addEventListener('click', () => this.abrirModalDireccion(dir));
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
      let matchesCountry = true;
      if (paisId) {
        matchesCountry = dir.territorio?.pais_id == paisId;
      }

      // 3. Status Filter
      let matchesStatus = true;
      if (estado) {
        matchesStatus = estado === 'activo' ? dir.activo : !dir.activo;
      }

      return matchesText && matchesCountry && matchesStatus;
    });

    this.renderDireccionesTable(filtered);
    this.limpiarMapaPrincipal();
  }

  async abrirModalDireccion(direccion = null) {
    const modalTitle = document.querySelector('#direccionModalLabel');
    const form = document.querySelector('#direccionForm');
    const inputId = document.querySelector('#direccionId');
    const inputDetalle = document.querySelector('#direccionDetalle');
    const inputReferencia = document.querySelector('#direccionReferencia');
    const inputCodigoPostal = document.querySelector('#direccionCodigoPostal');
    const inputActivo = document.querySelector('#direccionActivo');
    const inputLat = document.querySelector('#direccionLatitud');
    const inputLng = document.querySelector('#direccionLongitud');
    
    const selectPais = document.querySelector('#dirPaisSelect');
    const selectNivel1 = document.querySelector('#dirNivel1Select');
    const selectNivel2 = document.querySelector('#dirNivel2Select');
    const selectNivel3 = document.querySelector('#dirNivel3Select');
    
    const errorAlert = document.querySelector('#direccionModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    // Reset dropdowns
    const activePaises = this.paisesList.filter(p => p.activo);
    if (activePaises.length === 1) {
      selectPais.value = activePaises[0].id;
      this.cargarDireccionDropdownNivel1(activePaises[0].id);
    } else {
      selectPais.value = '';
      selectNivel1.value = '';
      selectNivel1.disabled = true;
      selectNivel1.innerHTML = '<option value="">-- Seleccione País primero --</option>';
    }
    
    selectNivel2.value = '';
    selectNivel2.disabled = true;
    selectNivel2.innerHTML = '<option value="">-- Seleccione Nivel 1 primero --</option>';
    selectNivel3.value = '';
    selectNivel3.disabled = true;
    selectNivel3.innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';

    if (this.modalMarker) {
      if (this.modalMap) this.modalMap.removeLayer(this.modalMarker);
      this.modalMarker = null;
    }
    this.tempCoords = null;
    inputLat.value = '';
    inputLng.value = '';

    if (direccion) {
      modalTitle.textContent = 'Editar Dirección';
      inputId.value = direccion.id;
      inputDetalle.value = direccion.detalle;
      inputReferencia.value = direccion.referencia || '';
      inputCodigoPostal.value = direccion.codigo_postal || '';
      inputActivo.checked = direccion.activo;

      if (direccion.latitud && direccion.longitud) {
        inputLat.value = direccion.latitud.toFixed(6);
        inputLng.value = direccion.longitud.toFixed(6);
        this.tempCoords = { lat: direccion.latitud, lng: direccion.longitud };
      }

      if (direccion.territorio) {
        const terr = direccion.territorio;
        const paisId = terr.pais_id;
        selectPais.value = paisId;
        
        await this.cargarDireccionDropdownNivel1(paisId);
        
        if (terr.parent_id === null) {
          selectNivel1.value = terr.id;
        } else {
          try {
            const parentTerr = await UbicacionesService.getTerritorioById(terr.parent_id);
            if (parentTerr.parent_id === null) {
              selectNivel1.value = parentTerr.id;
              await this.cargarDireccionDropdownNivel2(paisId, parentTerr.id);
              selectNivel2.value = terr.id;
            } else {
              const grandParentId = parentTerr.parent_id;
              selectNivel1.value = grandParentId;
              await this.cargarDireccionDropdownNivel2(paisId, grandParentId);
              selectNivel2.value = parentTerr.id;
              await this.cargarDireccionDropdownNivel3(paisId, parentTerr.id);
              selectNivel3.value = terr.id;
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    } else {
      modalTitle.textContent = 'Nueva Dirección';
      inputId.value = '';
      inputDetalle.value = '';
      inputReferencia.value = '';
      inputCodigoPostal.value = '';
      inputActivo.checked = true;
    }

    this.direccionModalObj.show();
  }

  // Cascading Dropdowns loading
  async cargarDireccionDropdownNivel1(paisId) {
    const s1 = document.querySelector('#dirNivel1Select');
    const s2 = document.querySelector('#dirNivel2Select');
    const s3 = document.querySelector('#dirNivel3Select');

    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;
    s2.innerHTML = '<option value="">-- Seleccione Nivel 1 primero --</option>';
    s2.disabled = true;
    s3.innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';
    s3.disabled = true;

    if (!paisId) {
      s1.innerHTML = '<option value="">-- Seleccione País primero --</option>';
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: null });
      s1.innerHTML = '<option value="">-- Selecciona Nivel 1 --</option>' + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s1.disabled = false;
    } catch (e) {
      s1.innerHTML = '<option value="">-- Error al cargar --</option>';
    }

    this.centrarModalMapaSegunPais();
  }

  async cargarDireccionDropdownNivel2(paisId, parentId) {
    const s2 = document.querySelector('#dirNivel2Select');
    const s3 = document.querySelector('#dirNivel3Select');

    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;
    s3.innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';
    s3.disabled = true;

    if (!parentId) {
      s2.innerHTML = '<option value="">-- Seleccione Nivel 1 primero --</option>';
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      s2.innerHTML = '<option value="">-- Selecciona Nivel 2 --</option>' + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s2.disabled = false;
    } catch (e) {
      s2.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel3(paisId, parentId) {
    const s3 = document.querySelector('#dirNivel3Select');
    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    if (!parentId) {
      s3.innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      s3.innerHTML = '<option value="">-- Selecciona Nivel 3 --</option>' + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s3.disabled = false;
    } catch (e) {
      s3.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async guardarDireccion(e) {
    e.preventDefault();
    const form = document.querySelector('#direccionForm');
    const errorAlert = document.querySelector('#direccionModalErrorAlert');
    const errorMessage = document.querySelector('#direccionModalErrorMessage');

    const selectNivel1 = document.querySelector('#dirNivel1Select');
    const selectNivel2 = document.querySelector('#dirNivel2Select');
    const selectNivel3 = document.querySelector('#dirNivel3Select');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const territorioIdVal = selectNivel3.value || selectNivel2.value || selectNivel1.value;
    if (!territorioIdVal) {
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = 'Debe seleccionar al menos un nivel geográfico (Nivel 1, 2 o 3) para la dirección.';
      return;
    }

    const id = document.querySelector('#direccionId').value;
    const latVal = document.querySelector('#direccionLatitud').value;
    const lngVal = document.querySelector('#direccionLongitud').value;

    const payload = {
      territorio_id: parseInt(territorioIdVal),
      detalle: document.querySelector('#direccionDetalle').value,
      referencia: document.querySelector('#direccionReferencia').value || null,
      codigo_postal: document.querySelector('#direccionCodigoPostal').value || null,
      latitud: latVal ? parseFloat(latVal) : null,
      longitud: lngVal ? parseFloat(lngVal) : null,
      activo: document.querySelector('#direccionActivo').checked,
    };

    // Double-submit protection: Disable submit button and show spinner
    const btnSubmit = form.querySelector('button[type="submit"]');
    let originalText = '';
    if (btnSubmit) {
      originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Guardando...';
    }

    try {
      if (id) {
        await UbicacionesService.updateDireccion(id, payload);
        this.mostrarAlertaLocal('success', 'Dirección actualizada con éxito.');
      } else {
        await UbicacionesService.createDireccion(payload);
        this.mostrarAlertaLocal('success', 'Dirección creada con éxito.');
      }

      this.direccionModalObj.hide();
      await this.cargarDirecciones();
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    }
  }

  async eliminarDireccion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta dirección?')) return;

    try {
      await UbicacionesService.deleteDireccion(id);
      this.mostrarAlertaLocal('success', 'Dirección eliminada con éxito.');
      await this.cargarDirecciones();
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      this.mostrarAlertaLocal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  mostrarAlertaLocal(tipo, mensaje) {
    const successAlert = this.querySelector('#direccionesSuccessAlert');
    const successMsg = this.querySelector('#direccionesSuccessMessage');
    const errorAlert = this.querySelector('#direccionesErrorAlert');
    const errorMsg = this.querySelector('#direccionesErrorMessage');

    if (tipo === 'success') {
      errorAlert.classList.add('d-none');
      successMsg.textContent = mensaje;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 5000);
    } else {
      successAlert.classList.add('d-none');
      errorMsg.textContent = mensaje;
      errorAlert.classList.remove('d-none');
      setTimeout(() => errorAlert.classList.add('d-none'), 6000);
    }
  }
}

customElements.define('app-ubicaciones-direcciones', UbicacionesDireccionesComponent);
