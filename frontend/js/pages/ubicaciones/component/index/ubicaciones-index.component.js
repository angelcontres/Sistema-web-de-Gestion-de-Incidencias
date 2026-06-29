import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class UbicacionesIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/component/index/ubicaciones-index.component.html');
    
    // State management for the explorer columns
    this.selectedPaisId = null;
    this.selectedNivel1Id = null;
    this.selectedNivel2Id = null;
    
    // Lists of records
    this.paisesList = [];
    this.territoriosNivel1 = [];
    this.territoriosNivel2 = [];
    this.territoriosNivel3 = [];
    this.direccionesList = [];

    // Modals instances
    this.paisModalObj = null;
    this.territorioModalObj = null;
    this.direccionModalObj = null;

    // Maps state
    this.map = null;
    this.modalMap = null;
    this.mapMarkers = [];
    this.modalMarker = null;

    // Temporary storage for modal edit coordinates
    this.tempCoords = null;
  }

  async onInit() {
    console.log('Página de Ubicaciones inicializada.');
    
    // Initialize Bootstrap Modals
    try {
      this.paisModalObj = new bootstrap.Modal(this.querySelector('#paisModal'));
      this.territorioModalObj = new bootstrap.Modal(this.querySelector('#territorioModal'));
      this.direccionModalObj = new bootstrap.Modal(this.querySelector('#direccionModal'));
    } catch (e) {
      console.warn('Error inicializando Bootstrap Modals. Asegúrese de que bootstrap.js esté cargado.', e);
    }

    // Load Initial Data
    await this.cargarPaises();
    await this.cargarDirecciones();

    // Setup Event Listeners
    this.setupEventListeners();
    this.setupMapListeners();
  }

  setupEventListeners() {
    // --- PAISES ---
    const btnNuevoPais = this.querySelector('#btnNuevoPais');
    if (btnNuevoPais) {
      btnNuevoPais.addEventListener('click', () => this.abrirModalPais());
    }
    
    const paisForm = this.querySelector('#paisForm');
    if (paisForm) {
      paisForm.addEventListener('submit', (e) => this.guardarPais(e));
    }

    // --- EXPLORADOR DE TERRITORIOS ---
    const explorerPaisSelect = this.querySelector('#explorerPaisSelect');
    if (explorerPaisSelect) {
      explorerPaisSelect.addEventListener('change', (e) => {
        this.selectedPaisId = e.target.value;
        this.selectedNivel1Id = null;
        this.selectedNivel2Id = null;
        this.cargarTerritoriosColumna1();
      });
    }

    // Botones agregar en columnas
    const btnAddNivel1 = this.querySelector('#btnAddNivel1');
    if (btnAddNivel1) {
      btnAddNivel1.addEventListener('click', () => this.abrirModalTerritorio(1));
    }
    const btnAddNivel2 = this.querySelector('#btnAddNivel2');
    if (btnAddNivel2) {
      btnAddNivel2.addEventListener('click', () => this.abrirModalTerritorio(2));
    }
    const btnAddNivel3 = this.querySelector('#btnAddNivel3');
    if (btnAddNivel3) {
      btnAddNivel3.addEventListener('click', () => this.abrirModalTerritorio(3));
    }

    const territorioForm = this.querySelector('#territorioForm');
    if (territorioForm) {
      territorioForm.addEventListener('submit', (e) => this.guardarTerritorio(e));
    }

    // --- DIRECCIONES ---
    const btnNuevaDireccion = this.querySelector('#btnNuevaDireccion');
    if (btnNuevaDireccion) {
      btnNuevaDireccion.addEventListener('click', () => this.abrirModalDireccion());
    }

    const direccionForm = this.querySelector('#direccionForm');
    if (direccionForm) {
      direccionForm.addEventListener('submit', (e) => this.guardarDireccion(e));
    }

    // Búsqueda de direcciones
    const direccionSearch = this.querySelector('#direccionSearch');
    if (direccionSearch) {
      direccionSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        this.filtrarDirecciones(query);
      });
    }

    // --- SELECTORES CASCADED EN DIRECCION FORM ---
    const dirPaisSelect = this.querySelector('#dirPaisSelect');
    if (dirPaisSelect) {
      dirPaisSelect.addEventListener('change', async (e) => {
        const paisId = e.target.value;
        await this.cargarDireccionDropdownNivel1(paisId);
      });
    }

    const dirNivel1Select = this.querySelector('#dirNivel1Select');
    if (dirNivel1Select) {
      dirNivel1Select.addEventListener('change', async (e) => {
        const parentId = e.target.value;
        const paisId = this.querySelector('#dirPaisSelect').value;
        await this.cargarDireccionDropdownNivel2(paisId, parentId);
      });
    }

    const dirNivel2Select = this.querySelector('#dirNivel2Select');
    if (dirNivel2Select) {
      dirNivel2Select.addEventListener('change', async (e) => {
        const parentId = e.target.value;
        const paisId = this.querySelector('#dirPaisSelect').value;
        await this.cargarDireccionDropdownNivel3(paisId, parentId);
      });
    }
  }

  // =========================================================================
  // --- CONTROL DE MAPAS (Leaflet.js) ---
  // =========================================================================

  setupMapListeners() {
    // 1. Inicializar el mapa principal al hacer clic en la pestaña "Direcciones"
    const direccionesTab = this.querySelector('#direcciones-tab');
    if (direccionesTab) {
      direccionesTab.addEventListener('shown.bs.tab', () => {
        this.initMainMap();
      });
    }

    // 2. Inicializar el mapa del modal cuando este se muestre por completo
    const direccionModalEl = this.querySelector('#direccionModal');
    if (direccionModalEl) {
      direccionModalEl.addEventListener('shown.bs.modal', () => {
        this.initModalMap();
      });
    }

    // 3. Botón para centrar mapa en todas las direcciones
    const btnCentrarMapa = this.querySelector('#btnCentrarMapa');
    if (btnCentrarMapa) {
      btnCentrarMapa.addEventListener('click', () => {
        this.centrarMapaEnTodo();
      });
    }
  }

  initMainMap() {
    const mapDiv = this.querySelector('#map');
    if (!mapDiv) return;

    if (this.map) {
      // Si ya existe, forzar recalcular tamaño por si cambió el layout
      this.map.invalidateSize();
      return;
    }

    // Inicializar mapa centrado por defecto en Sudamérica/Ecuador
    this.map = L.map(mapDiv).setView([-1.8312, -78.1834], 5);

    // Agregar capa de mapa estética y moderna (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Cargar marcadores
    this.actualizarMarcadoresMapaPrincipal();
  }

  actualizarMarcadoresMapaPrincipal() {
    if (!this.map) return;

    // Limpiar marcadores anteriores
    this.mapMarkers.forEach(marker => this.map.removeLayer(marker));
    this.mapMarkers = [];

    this.direccionesList.forEach((dir) => {
      if (dir.latitud && dir.longitud) {
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
        marker.bindPopup(popupHtml);
        this.mapMarkers.push(marker);
      }
    });

    this.centrarMapaEnTodo();
  }

  centrarMapaEnTodo() {
    if (!this.map || this.mapMarkers.length === 0) return;

    const group = new L.featureGroup(this.mapMarkers);
    this.map.fitBounds(group.getBounds().pad(0.15));
  }

  initModalMap() {
    const modalMapDiv = this.querySelector('#modalMap');
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

      // Evento de clic para georeferenciar
      this.modalMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.establecerMarcadorModal(lat, lng);
      });
    }

    // Si existen coordenadas temporales (estamos editando), posicionar marcador
    if (this.tempCoords) {
      this.establecerMarcadorModal(this.tempCoords.lat, this.tempCoords.lng);
      this.modalMap.setView([this.tempCoords.lat, this.tempCoords.lng], 14);
      this.tempCoords = null; // Limpiar
    } else {
      // Si es nuevo, intentar centrar según el país seleccionado
      this.centrarModalMapaSegunPais();
    }
  }

  establecerMarcadorModal(lat, lng) {
    if (!this.modalMap) return;

    if (this.modalMarker) {
      this.modalMarker.setLatLng([lat, lng]);
    } else {
      this.modalMarker = L.marker([lat, lng], { draggable: true }).addTo(this.modalMap);
      
      // Evento de arrastrar marcador
      this.modalMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.actualizarInputsCoordenadas(pos.lat, pos.lng);
      });
    }

    this.actualizarInputsCoordenadas(lat, lng);
  }

  actualizarInputsCoordenadas(lat, lng) {
    const inputLat = this.querySelector('#direccionLatitud');
    const inputLng = this.querySelector('#direccionLongitud');
    if (inputLat && inputLng) {
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
    }
  }

  centrarModalMapaSegunPais() {
    const paisId = this.querySelector('#dirPaisSelect').value;
    if (!paisId || !this.modalMap) return;

    const pais = this.paisesList.find(p => p.id == paisId);
    if (!pais) return;

    // Coordenadas estimadas de centros de países para experiencia premium
    const centrosPaises = {
      'PE': [-9.1900, -75.0152], // Perú
      'MX': [23.6345, -102.5528], // México
      'EC': [-1.8312, -78.1834], // Ecuador
    };

    const centro = centrosPaises[pais.codigo_iso] || [-1.8312, -78.1834];
    this.modalMap.setView(centro, 6);
  }

  // =========================================================================
  // --- CONTROL DE PAÍSES ---
  // =========================================================================

  async cargarPaises() {
    try {
      const paises = await UbicacionesService.getPaises();
      this.paisesList = paises || [];
      this.renderPaisesTable();
      this.llenarPaisSelects();
    } catch (error) {
      console.error('Error cargando países:', error);
      this.mostrarAlertaGlobal('error', `Error al cargar países: ${error.message}`);
    }
  }

  renderPaisesTable() {
    const tbody = this.querySelector('#paisesTableBody');
    const emptyState = this.querySelector('#paisesEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.paisesList.length === 0) {
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');

    this.paisesList.forEach((pais) => {
      const tr = document.createElement('tr');
      
      const badgeClass = pais.activo ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';
      const badgeText = pais.activo ? 'Activo' : 'Inactivo';

      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${pais.nombre}</td>
        <td><code class="text-secondary fw-semibold">${pais.codigo_iso}</code></td>
        <td><span class="badge ${badgeClass} rounded-pill px-2.5 py-1 small">${badgeText}</span></td>
        <td class="text-end pe-4">
          <div class="btn-group">
            <button class="btn btn-sm btn-light border-0 btn-editar-pais" data-id="${pais.id}" title="Editar País">
              <i class="bi bi-pencil-square text-primary"></i>
            </button>
            <button class="btn btn-sm btn-light border-0 btn-eliminar-pais" data-id="${pais.id}" title="Eliminar País">
              <i class="bi bi-trash text-danger"></i>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-editar-pais').addEventListener('click', () => this.abrirModalPais(pais));
      tr.querySelector('.btn-eliminar-pais').addEventListener('click', () => this.eliminarPais(pais.id, pais.nombre));

      tbody.appendChild(tr);
    });
  }

  llenarPaisSelects() {
    const explorerSelect = this.querySelector('#explorerPaisSelect');
    const dirPaisSelect = this.querySelector('#dirPaisSelect');

    const optionsHtml = this.paisesList
      .filter(p => p.activo)
      .map(p => `<option value="${p.id}">${p.nombre}</option>`)
      .join('');

    if (explorerSelect) {
      const currentVal = explorerSelect.value;
      explorerSelect.innerHTML = `<option value="">-- Selecciona un País --</option>${optionsHtml}`;
      explorerSelect.value = currentVal;
    }

    if (dirPaisSelect) {
      dirPaisSelect.innerHTML = `<option value="">-- Seleccione --</option>${optionsHtml}`;
    }
  }

  abrirModalPais(pais = null) {
    const modalTitle = this.querySelector('#paisModalLabel');
    const form = this.querySelector('#paisForm');
    const inputId = this.querySelector('#paisId');
    const inputNombre = this.querySelector('#paisNombre');
    const inputCodigo = this.querySelector('#paisCodigo');
    const inputActivo = this.querySelector('#paisActivo');
    const errorAlert = this.querySelector('#paisModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    if (pais) {
      modalTitle.textContent = 'Editar País';
      inputId.value = pais.id;
      inputNombre.value = pais.nombre;
      inputCodigo.value = pais.codigo_iso;
      inputActivo.checked = pais.activo;
    } else {
      modalTitle.textContent = 'Nuevo País';
      inputId.value = '';
      inputNombre.value = '';
      inputCodigo.value = '';
      inputActivo.checked = true;
    }

    this.paisModalObj.show();
  }

  async guardarPais(e) {
    e.preventDefault();
    const form = this.querySelector('#paisForm');
    const errorAlert = this.querySelector('#paisModalErrorAlert');
    const errorMessage = this.querySelector('#paisModalErrorMessage');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = this.querySelector('#paisId').value;
    const payload = {
      nombre: this.querySelector('#paisNombre').value,
      codigo_iso: this.querySelector('#paisCodigo').value.toUpperCase(),
      activo: this.querySelector('#paisActivo').checked,
    };

    try {
      if (id) {
        await UbicacionesService.updatePais(id, payload);
        this.mostrarAlertaGlobal('success', 'País actualizado con éxito.');
      } else {
        await UbicacionesService.createPais(payload);
        this.mostrarAlertaGlobal('success', 'País creado con éxito.');
      }

      this.paisModalObj.hide();
      await this.cargarPaises();
    } catch (error) {
      console.error('Error al guardar país:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarPais(id, nombre) {
    if (!confirm(`¿Está seguro de que desea eliminar el país "${nombre}"?`)) return;

    try {
      await UbicacionesService.deletePais(id);
      this.mostrarAlertaGlobal('success', `País "${nombre}" eliminado con éxito.`);
      await this.cargarPaises();
    } catch (error) {
      console.error('Error al eliminar país:', error);
      this.mostrarAlertaGlobal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  // =========================================================================
  // --- CONTROL DE EXPLORADOR DE TERRITORIOS (Miller Columns) ---
  // =========================================================================

  async cargarTerritoriosColumna1() {
    const list1 = this.querySelector('#listNivel1');
    const list2 = this.querySelector('#listNivel2');
    const list3 = this.querySelector('#listNivel3');
    const btnAdd1 = this.querySelector('#btnAddNivel1');
    const btnAdd2 = this.querySelector('#btnAddNivel2');
    const btnAdd3 = this.querySelector('#btnAddNivel3');

    list1.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    list2.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 1</div>';
    list3.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 2</div>';

    btnAdd1.classList.add('d-none');
    btnAdd2.classList.add('d-none');
    btnAdd3.classList.add('d-none');

    if (!this.selectedPaisId) {
      list1.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un país para comenzar</div>';
      return;
    }

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: null,
      });

      this.territoriosNivel1 = territorios || [];
      this.renderColumna1();
      btnAdd1.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 1:', error);
      list1.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna1() {
    const list = this.querySelector('#listNivel1');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel1.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    this.territoriosNivel1.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'pointer';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
          <i class="bi bi-chevron-right text-muted ms-1"></i>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        
        list.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-item'));
        item.classList.add('active-item');

        this.selectedNivel1Id = t.id;
        this.selectedNivel2Id = null;
        this.cargarTerritoriosColumna2();
      });

      item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(1, t));
      item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 1));

      list.appendChild(item);
    });
  }

  async cargarTerritoriosColumna2() {
    const list2 = this.querySelector('#listNivel2');
    const list3 = this.querySelector('#listNivel3');
    const btnAdd2 = this.querySelector('#btnAddNivel2');
    const btnAdd3 = this.querySelector('#btnAddNivel3');

    list2.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    list3.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 2</div>';

    btnAdd2.classList.add('d-none');
    btnAdd3.classList.add('d-none');

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: this.selectedNivel1Id,
      });

      this.territoriosNivel2 = territorios || [];
      this.renderColumna2();
      
      btnAdd2.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 2:', error);
      list2.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna2() {
    const list = this.querySelector('#listNivel2');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel2.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    this.territoriosNivel2.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'pointer';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
          <i class="bi bi-chevron-right text-muted ms-1"></i>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        
        list.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-item'));
        item.classList.add('active-item');

        this.selectedNivel2Id = t.id;
        this.cargarTerritoriosColumna3();
      });

      item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(2, t));
      item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 2));

      list.appendChild(item);
    });
  }

  async cargarTerritoriosColumna3() {
    const list3 = this.querySelector('#listNivel3');
    const btnAdd3 = this.querySelector('#btnAddNivel3');

    list3.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    btnAdd3.classList.add('d-none');

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: this.selectedNivel2Id,
      });

      this.territoriosNivel3 = territorios || [];
      this.renderColumna3();
      
      btnAdd3.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 3:', error);
      list3.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna3() {
    const list = this.querySelector('#listNivel3');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel3.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    this.territoriosNivel3.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'default';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
        </div>
      `;

      item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(3, t));
      item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 3));

      list.appendChild(item);
    });
  }

  abrirModalTerritorio(columnaNivel, territorio = null) {
    const modalTitle = this.querySelector('#territorioModalLabel');
    const form = this.querySelector('#territorioForm');
    const inputId = this.querySelector('#territorioId');
    const inputParentId = this.querySelector('#territorioParentId');
    const inputPaisId = this.querySelector('#territorioPaisId');
    const inputNombre = this.querySelector('#territorioNombre');
    const inputTipo = this.querySelector('#territorioTipo');
    const inputActivo = this.querySelector('#territorioActivo');
    const contextLabel = this.querySelector('#territorioContextLabel');
    const errorAlert = this.querySelector('#territorioModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    inputPaisId.value = this.selectedPaisId;

    let parentName = '';
    const paisNombre = this.paisesList.find(p => p.id == this.selectedPaisId)?.nombre || 'País';

    if (columnaNivel === 1) {
      inputParentId.value = '';
      parentName = `Raíz de ${paisNombre}`;
      inputTipo.placeholder = 'Ej: Departamento, Estado';
    } else if (columnaNivel === 2) {
      inputParentId.value = this.selectedNivel1Id;
      const parentObj = this.territoriosNivel1.find(t => t.id == this.selectedNivel1Id);
      parentName = `${paisNombre} > ${parentObj?.nombre || 'Nivel 1'}`;
      inputTipo.placeholder = 'Ej: Provincia, Municipio';
    } else if (columnaNivel === 3) {
      inputParentId.value = this.selectedNivel2Id;
      const parentObj1 = this.territoriosNivel1.find(t => t.id == this.selectedNivel1Id);
      const parentObj2 = this.territoriosNivel2.find(t => t.id == this.selectedNivel2Id);
      parentName = `${paisNombre} > ${parentObj1?.nombre || 'Nivel 1'} > ${parentObj2?.nombre || 'Nivel 2'}`;
      inputTipo.placeholder = 'Ej: Distrito, Alcaldía, Localidad';
    }

    contextLabel.textContent = parentName;

    if (territorio) {
      modalTitle.textContent = 'Editar Territorio';
      inputId.value = territorio.id;
      inputNombre.value = territorio.nombre;
      inputTipo.value = territorio.tipo;
      inputActivo.checked = territorio.activo;
    } else {
      modalTitle.textContent = 'Nuevo Territorio';
      inputId.value = '';
      inputNombre.value = '';
      inputTipo.value = '';
      inputActivo.checked = true;
    }

    this.territorioModalObj.show();
  }

  async guardarTerritorio(e) {
    e.preventDefault();
    const form = this.querySelector('#territorioForm');
    const errorAlert = this.querySelector('#territorioModalErrorAlert');
    const errorMessage = this.querySelector('#territorioModalErrorMessage');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = this.querySelector('#territorioId').value;
    const parentId = this.querySelector('#territorioParentId').value;
    
    const payload = {
      pais_id: parseInt(this.querySelector('#territorioPaisId').value),
      parent_id: parentId ? parseInt(parentId) : null,
      nombre: this.querySelector('#territorioNombre').value,
      tipo: this.querySelector('#territorioTipo').value,
      activo: this.querySelector('#territorioActivo').checked,
    };

    try {
      if (id) {
        await UbicacionesService.updateTerritorio(id, payload);
        this.mostrarAlertaGlobal('success', 'Territorio actualizado con éxito.');
      } else {
        await UbicacionesService.createTerritorio(payload);
        this.mostrarAlertaGlobal('success', 'Territorio creado con éxito.');
      }

      this.territorioModalObj.hide();
      
      if (!parentId) {
        await this.cargarTerritoriosColumna1();
      } else if (parentId == this.selectedNivel1Id) {
        await this.cargarTerritoriosColumna2();
      } else if (parentId == this.selectedNivel2Id) {
        await this.cargarTerritoriosColumna3();
      }
    } catch (error) {
      console.error('Error al guardar territorio:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarTerritorio(id, nombre, columnaNivel) {
    if (!confirm(`¿Está seguro de que desea eliminar el territorio "${nombre}"? Se comprobará que no tenga sub-elementos o direcciones asociadas.`)) return;

    try {
      await UbicacionesService.deleteTerritorio(id);
      this.mostrarAlertaGlobal('success', `Territorio "${nombre}" eliminado con éxito.`);
      
      if (columnaNivel === 1) {
        this.selectedNivel1Id = null;
        this.selectedNivel2Id = null;
        await this.cargarTerritoriosColumna1();
      } else if (columnaNivel === 2) {
        this.selectedNivel2Id = null;
        await this.cargarTerritoriosColumna2();
      } else if (columnaNivel === 3) {
        await this.cargarTerritoriosColumna3();
      }
    } catch (error) {
      console.error('Error al eliminar territorio:', error);
      this.mostrarAlertaGlobal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  // =========================================================================
  // --- CONTROL DE DIRECCIONES ---
  // =========================================================================

  async cargarDirecciones() {
    try {
      const direcciones = await UbicacionesService.getDirecciones();
      this.direccionesList = direcciones || [];
      this.renderDireccionesTable(this.direccionesList);
      
      // Actualizar el mapa si ya está inicializado
      this.actualizarMarcadoresMapaPrincipal();
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      this.mostrarAlertaGlobal('error', `Error al cargar direcciones: ${error.message}`);
    }
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
          <div class="btn-group">
            <button class="btn btn-sm btn-light border-0 btn-editar-dir" data-id="${dir.id}" title="Editar Dirección">
              <i class="bi bi-pencil-square text-primary"></i>
            </button>
            <button class="btn btn-sm btn-light border-0 btn-eliminar-dir" data-id="${dir.id}" title="Eliminar Dirección">
              <i class="bi bi-trash text-danger"></i>
            </button>
          </div>
        </td>
      `;

      // Evento de clic en la fila: Centra el mapa en esa dirección
      tr.addEventListener('click', (e) => {
        // Ignorar clic si fue en los botones de acción
        if (e.target.closest('.btn-group') || e.target.closest('button')) return;
        
        if (dir.latitud && dir.longitud && this.map) {
          this.map.setView([dir.latitud, dir.longitud], 15);
          
          // Buscar marcador correspondiente y abrir su popup
          const matchedMarker = this.mapMarkers.find((m) => {
            const latLng = m.getLatLng();
            return Math.abs(latLng.lat - dir.latitud) < 0.0001 && Math.abs(latLng.lng - dir.longitud) < 0.0001;
          });
          
          if (matchedMarker) {
            matchedMarker.openPopup();
          }
        } else {
          this.mostrarAlertaGlobal('error', 'Esta dirección no cuenta con coordenadas geográficas.');
        }
      });

      tr.querySelector('.btn-editar-dir').addEventListener('click', () => this.abrirModalDireccion(dir));
      tr.querySelector('.btn-eliminar-dir').addEventListener('click', () => this.eliminarDireccion(dir.id));

      tbody.appendChild(tr);
    });
  }

  filtrarDirecciones(query) {
    if (!query) {
      this.renderDireccionesTable(this.direccionesList);
      return;
    }
    const filtered = this.direccionesList.filter((dir) => {
      const detalle = (dir.detalle || '').toLowerCase();
      const ref = (dir.referencia || '').toLowerCase();
      const cp = (dir.codigo_postal || '').toLowerCase();
      const pais = (dir.territorio?.pais?.nombre || '').toLowerCase();
      const terr = (dir.territorio?.nombre || '').toLowerCase();
      
      return detalle.includes(query) || ref.includes(query) || cp.includes(query) || pais.includes(query) || terr.includes(query);
    });
    this.renderDireccionesTable(filtered);
  }

  async abrirModalDireccion(direccion = null) {
    const modalTitle = this.querySelector('#direccionModalLabel');
    const form = this.querySelector('#direccionForm');
    const inputId = this.querySelector('#direccionId');
    const inputDetalle = this.querySelector('#direccionDetalle');
    const inputReferencia = this.querySelector('#direccionReferencia');
    const inputCodigoPostal = this.querySelector('#direccionCodigoPostal');
    const inputActivo = this.querySelector('#direccionActivo');
    const inputLat = this.querySelector('#direccionLatitud');
    const inputLng = this.querySelector('#direccionLongitud');
    
    const selectPais = this.querySelector('#dirPaisSelect');
    const selectNivel1 = this.querySelector('#dirNivel1Select');
    const selectNivel2 = this.querySelector('#dirNivel2Select');
    const selectNivel3 = this.querySelector('#dirNivel3Select');
    
    const errorAlert = this.querySelector('#direccionModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    // Reset selectors
    selectPais.value = '';
    selectNivel1.value = '';
    selectNivel1.disabled = true;
    selectNivel1.innerHTML = '<option value="">-- Seleccione País primero --</option>';
    selectNivel2.value = '';
    selectNivel2.disabled = true;
    selectNivel2.innerHTML = '<option value="">-- Seleccione Nivel 1 primero --</option>';
    selectNivel3.value = '';
    selectNivel3.disabled = true;
    selectNivel3.innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';

    // Reset Map Marker
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
        
        // Guardar coordenadas temporalmente para el evento shown.bs.modal
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
            console.error('Error resolviendo jerarquía de la dirección:', err);
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

  async cargarDireccionDropdownNivel1(paisId) {
    const s1 = this.querySelector('#dirNivel1Select');
    const s2 = this.querySelector('#dirNivel2Select');
    const s3 = this.querySelector('#dirNivel3Select');

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
      console.error(e);
      s1.innerHTML = '<option value="">-- Error al cargar --</option>';
    }

    // Centrar mapa del modal en el país seleccionado
    this.centrarModalMapaSegunPais();
  }

  async cargarDireccionDropdownNivel2(paisId, parentId) {
    const s2 = this.querySelector('#dirNivel2Select');
    const s3 = this.querySelector('#dirNivel3Select');

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
      console.error(e);
      s2.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel3(paisId, parentId) {
    const s3 = this.querySelector('#dirNivel3Select');

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
      console.error(e);
      s3.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async guardarDireccion(e) {
    e.preventDefault();
    const form = this.querySelector('#direccionForm');
    const errorAlert = this.querySelector('#direccionModalErrorAlert');
    const errorMessage = this.querySelector('#direccionModalErrorMessage');

    const selectPais = this.querySelector('#dirPaisSelect');
    const selectNivel1 = this.querySelector('#dirNivel1Select');
    const selectNivel2 = this.querySelector('#dirNivel2Select');
    const selectNivel3 = this.querySelector('#dirNivel3Select');

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

    const id = this.querySelector('#direccionId').value;
    const latVal = this.querySelector('#direccionLatitud').value;
    const lngVal = this.querySelector('#direccionLongitud').value;

    const payload = {
      territorio_id: parseInt(territorioIdVal),
      detalle: this.querySelector('#direccionDetalle').value,
      referencia: this.querySelector('#direccionReferencia').value || null,
      codigo_postal: this.querySelector('#direccionCodigoPostal').value || null,
      latitud: latVal ? parseFloat(latVal) : null,
      longitud: lngVal ? parseFloat(lngVal) : null,
      activo: this.querySelector('#direccionActivo').checked,
    };

    try {
      if (id) {
        await UbicacionesService.updateDireccion(id, payload);
        this.mostrarAlertaGlobal('success', 'Dirección actualizada con éxito.');
      } else {
        await UbicacionesService.createDireccion(payload);
        this.mostrarAlertaGlobal('success', 'Dirección creada con éxito.');
      }

      this.direccionModalObj.hide();
      await this.cargarDirecciones();
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarDireccion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta dirección?')) return;

    try {
      await UbicacionesService.deleteDireccion(id);
      this.mostrarAlertaGlobal('success', 'Dirección eliminada con éxito.');
      await this.cargarDirecciones();
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      this.mostrarAlertaGlobal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  // =========================================================================
  // --- UTILERÍAS ---
  // =========================================================================

  mostrarAlertaGlobal(tipo, mensaje) {
    const successAlert = this.querySelector('#globalSuccessAlert');
    const successMsg = this.querySelector('#globalSuccessMessage');
    const errorAlert = this.querySelector('#globalErrorAlert');
    const errorMsg = this.querySelector('#globalErrorMessage');

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

// Register Web Component
customElements.define('app-ubicaciones-index', UbicacionesIndexComponent);
