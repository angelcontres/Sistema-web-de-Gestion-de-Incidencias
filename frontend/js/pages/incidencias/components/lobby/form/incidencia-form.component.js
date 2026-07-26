import { BaseComponent } from '../../../../../core/base-component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { UbicacionesService } from '../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../shared/services/catalogo.service.js';
import { ModalService } from '../../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { MAP_CONFIG, COUNTRY_LEVELS } from '../../../../../shared/constants.js';

export class IncidenciaFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/lobby/form/incidencia-form.component.html');
    this.map = null;
    this.marker = null;
    this.coords = null;
    this.categorias = [];
    this.paisesList = [];
    this.recursosFiles = []; // Attached images list
    this.selectedDireccionId = null;
  }

  async onInit() {
    console.log('Formulario de incidencias inicializado.');

    this.inicializarReferenciasDOM();

    // Parse URL params
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const incidenciaId = urlParams.get('id');

    if (!this.verificarPermisosAcceso(incidenciaId)) {
      return;
    }

    const user = AuthService.getCurrentUser();
    const isAdmin = AuthService.isAdmin();

    this.configurarVisibilidadCampos(isAdmin);

    this.initMap();

    this.registrarEventListenersGenerales();
    this.configurarEventosAdjuntos();

    await this.cargarCatalogosIniciales();

    this.configurarLimiteArchivos(user, isAdmin);

    if (incidenciaId) {
      await this.cargarDatosEdicion(incidenciaId);
    } else {
      this.prepararCreacion();
    }
  }

  inicializarReferenciasDOM() {
    // Element references
    this.form = this.querySelector('#incidenciaForm');
    this.incidenciaIdInput = this.querySelector('#incidenciaId');
    this.versionInput = this.querySelector('#incidenciaVersion');
    this.tipoSelect = this.querySelector('#tipoSelect');
    this.subTipoSelect = this.querySelector('#subTipoSelect');
    this.cantidadAfectadosInput = this.querySelector('#cantidadAfectados');
    this.prioridadDisplay = this.querySelector('#prioridadDisplay');
    this.descripcionInput = this.querySelector('#descripcion');
    this.institucionSelect = this.querySelector('#institucionSelect');
    this.estadoSelect = this.querySelector('#estadoSelect');
    this.dirDetalleInput = this.querySelector('#dirDetalle');
    this.dirPaisSelect = this.querySelector('#dirPais');
    this.dirNivel1Select = this.querySelector('#dirNivel1');
    this.dirNivel2Select = this.querySelector('#dirNivel2');
    this.dirNivel3Select = this.querySelector('#dirNivel3');
    this.dirLatInput = this.querySelector('#dirLat');
    this.dirLngInput = this.querySelector('#dirLng');
    this.btnObtenerUbicacion = this.querySelector('#btnObtenerUbicacion');
    this.btnObtenerUbicacionSpinner = this.querySelector('#btnObtenerUbicacionSpinner');
    this.btnObtenerUbicacionText = this.querySelector('#btnObtenerUbicacionText');
    this.btnObtenerUbicacionIcon = this.querySelector('#btnObtenerUbicacionIcon');
    this.btnSeleccionarMapa = this.querySelector('#btnSeleccionarMapa');
    this.dirPrecisionGpsInput = this.querySelector('#dirPrecisionGps');
    this.btnSubmit = this.querySelector('#btnSubmit');
    this.btnConfirmarResolucion = this.querySelector('#btnConfirmarResolucion');
    this.divInstitucion = this.querySelector('#divInstitucion');
    this.formTitle = this.querySelector('#formTitle');
    this.btnText = this.querySelector('#btnText');

    // Removed modal elements and unused fields
    this.currentPostalCode = '';

    // Tab Elements
    this.dropzoneContainer = this.querySelector('#dropzoneContainer');
    this.fileInput = this.querySelector('#fileInput');
    this.thumbnailsContainer = this.querySelector('#thumbnailsContainer');
  }

  verificarPermisosAcceso(incidenciaId) {
    if (incidenciaId && !AuthService.hasPermission('UPDATE', 'incidencias')) {
      ToastService.error('No tiene permiso para editar incidencias.');
      window.location.hash = '#/incidencias';
      return false;
    }
    if (!incidenciaId && !AuthService.hasPermission('CREATE', 'incidencias')) {
      ToastService.error('No tiene permiso para registrar incidencias.');
      window.location.hash = '#/incidencias';
      return false;
    }
    return true;
  }

  configurarVisibilidadCampos(isAdmin) {
    const canManageIncidencia =
      isAdmin ||
      AuthService.hasPermission('UPDATE', 'incidencias') ||
      AuthService.hasPermission('UPDATE', 'despacho_incidencias');

    const colEstado = this.querySelector('#colEstado');
    if (colEstado) {
      if (canManageIncidencia) {
        colEstado.classList.remove('d-none');
      } else {
        colEstado.classList.add('d-none');
      }
    }

    if (this.divInstitucion) {
      this.divInstitucion.classList.remove('d-none');
    }
    if (this.institucionSelect) {
      this.institucionSelect.disabled = !canManageIncidencia;
    }
  }

  registrarEventListenersGenerales() {
    this.form.addEventListener('submit', (e) => this.guardarIncidencia(e));
    this.tipoSelect.addEventListener('change', () => this.onCategoryChange());
    this.subTipoSelect.addEventListener('change', () => this.onSubCategoryChange());
    this.cantidadAfectadosInput.addEventListener('input', () => this.calcularPrioridadDinamica());

    this.dirPaisSelect.addEventListener('change', (e) => {
      this.actualizarEtiquetasNiveles(e.target.value);
      this.cargarDropdownNivel1(e.target.value);
    });
    this.dirNivel1Select.addEventListener('change', (e) => {
      this.cargarDropdownNivel2(this.dirPaisSelect.value, e.target.value);
    });
    this.dirNivel2Select.addEventListener('change', (e) => {
      this.cargarDropdownNivel3(this.dirPaisSelect.value, e.target.value);
    });

    if (this.btnObtenerUbicacion) {
      this.btnObtenerUbicacion.addEventListener('click', () => this.obtenerUbicacionActual());
    }
    if (this.btnSeleccionarMapa) {
      this.btnSeleccionarMapa.addEventListener('click', () => this.habilitarMapaInteractivo());
    }

    if (this.dirDetalleInput) {
      this.dirDetalleInput.addEventListener('input', () => {
        this.selectedDireccionId = null;
      });
    }
  }

  configurarEventosAdjuntos() {
    if (this.dropzoneContainer && this.fileInput) {
      this.dropzoneContainer.addEventListener('click', (e) => {
        if (e.target.closest('#btnTestImagen')) return;
        this.fileInput.click();
      });
      this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
      this.setupDropzoneDragAndDrop();

      const btnTestImagen = this.querySelector('#btnTestImagen');
      if (btnTestImagen) {
        btnTestImagen.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cargarImagenDePrueba();
        });
      }
    }
  }

  configurarLimiteArchivos(user, isAdmin) {
    const cantMaximaArchivosEl = this.querySelector('#cantMaximaArchivos');
    const maxFiles = user?.max_files || 5;
    if (cantMaximaArchivosEl) {
      cantMaximaArchivosEl.value = maxFiles;
      if (isAdmin) {
        cantMaximaArchivosEl.removeAttribute('readonly');
        cantMaximaArchivosEl.style.setProperty('border-bottom', '1px dashed #6c757d', 'important');
        cantMaximaArchivosEl.style.pointerEvents = 'auto';

        cantMaximaArchivosEl.addEventListener('change', (e) => {
          const val = Number.parseInt(e.target.value) || 5;
          if (val < 1) {
            ToastService.warning('El límite debe ser al menos 1.');
            e.target.value = 1;
            return;
          }
          user.max_files = val;
          localStorage.setItem('user', JSON.stringify(user));
          ToastService.success(`Límite de subida modificado a: ${val}`);
        });
      } else {
        cantMaximaArchivosEl.setAttribute('readonly', 'true');
        cantMaximaArchivosEl.style.setProperty('border-bottom', 'none', 'important');
        cantMaximaArchivosEl.style.pointerEvents = 'none';
        cantMaximaArchivosEl.classList.remove('text-primary');
        cantMaximaArchivosEl.classList.add('text-dark');
      }
    }
  }

  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  obtenerUbicacionActual() {
    if (!navigator.geolocation) {
      ToastService.error('Su navegador no soporta la Geolocalización.');
      return;
    }

    const toggleLoading = (isLoading) => {
      if (this.btnObtenerUbicacion) this.btnObtenerUbicacion.disabled = isLoading;
      if (isLoading) {
        this.btnObtenerUbicacionIcon?.classList.add('d-none');
        this.btnObtenerUbicacionSpinner?.classList.remove('d-none');
        if (this.btnObtenerUbicacionText)
          this.btnObtenerUbicacionText.textContent = 'Obteniendo ubicación...';
      } else {
        this.btnObtenerUbicacionIcon?.classList.remove('d-none');
        this.btnObtenerUbicacionSpinner?.classList.add('d-none');
        if (this.btnObtenerUbicacionText)
          this.btnObtenerUbicacionText.textContent = 'Obtener mi ubicación';
      }
    };

    toggleLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (this.dirPrecisionGpsInput) {
          this.dirPrecisionGpsInput.value = accuracy.toFixed(2);
        }
        this.actualizarMarcador(latitude, longitude, false);
        await this.autofillDesdeCoordenadas(latitude, longitude);
        toggleLoading(false);
        ToastService.success(`Ubicación obtenida con éxito.`);
      },
      (error) => {
        toggleLoading(false);
        let msg = 'Error al obtener la geolocalización.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso denegado. Active la Ubicación en su navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'La ubicación no está disponible.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Tiempo de espera agotado al obtener la ubicación.';
        }
        ToastService.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // --- MAP & LOCATION LOGIC ---
  initMap() {
    const mapDiv = this.querySelector('#incidenciaMapa');
    if (!mapDiv) return;

    // Make map non-interactive (read-only guide) by default
    this.map = L.map(mapDiv, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
    }).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    this.isMapInteractive = false;
  }

  habilitarMapaInteractivo() {
    const mapDiv = this.querySelector('#incidenciaMapa');
    if (!mapDiv) return;

    if (this.map) {
      this.map.remove();
    }

    // Initialize with all default interactions enabled
    this.map = L.map(mapDiv).setView(
      this.coords ? [this.coords.lat, this.coords.lng] : MAP_CONFIG.DEFAULT_CENTER,
      this.coords ? 16 : MAP_CONFIG.DEFAULT_ZOOM
    );

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    this.isMapInteractive = true;
    this.marker = null; // Reset marker reference

    // Restore marker if coords exist
    if (this.coords) {
      this.actualizarMarcador(this.coords.lat, this.coords.lng, false);
    }

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.actualizarMarcador(lat, lng, true);
    });

    ToastService.info(
      'Mapa habilitado. Haga clic o arrastre el marcador para seleccionar la ubicación.'
    );

    if (this.btnSeleccionarMapa) {
      this.btnSeleccionarMapa.classList.replace('btn-outline-primary', 'btn-primary');
      this.btnSeleccionarMapa.disabled = true;
    }
  }

  actualizarMarcador(lat, lng, triggerGeocode = false) {
    const latVal = Number.parseFloat(lat).toFixed(6);
    const lngVal = Number.parseFloat(lng).toFixed(6);

    if (this.dirLatInput) this.dirLatInput.value = latVal;
    if (this.dirLngInput) this.dirLngInput.value = lngVal;
    this.coords = { lat: Number.parseFloat(latVal), lng: Number.parseFloat(lngVal) };

    if (this.map) {
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { draggable: !!this.isMapInteractive }).addTo(this.map);
        if (this.isMapInteractive) {
          this.marker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            this.actualizarMarcador(pos.lat, pos.lng, true);
          });
        }
      }
      this.map.setView([lat, lng], 16);
    }

    if (triggerGeocode) {
      this.autofillDesdeCoordenadas(latVal, lngVal);
    }
  }

  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  async autofillDesdeCoordenadas(lat, lng) {
    try {
      const data = await UbicacionesService.reverseGeocode(lat, lng);
      const address = data.address || {};

      // 1. Street Name
      const road = address.road || address.pedestrian || '';
      const suburb = address.suburb || address.neighbourhood || address.parish || '';
      const county = address.county || address.city || '';
      this.dirDetalleInput.value =
        [road, suburb, county].filter(Boolean).join(', ') || data.display_name || '';

      // 2. Postal code (guardado internamente)
      this.currentPostalCode = address.postcode || '';

      // 3. Match Country
      const countryCode = (address.country_code || '').toUpperCase();
      const matchedPais = this.paisesList.find(
        (p) => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode
      );

      if (matchedPais) {
        if (this.dirPaisSelect) this.dirPaisSelect.value = matchedPais.id;
        this.actualizarEtiquetasNiveles(matchedPais.id);

        // Geocoding autofill cascading for territories
        await this.autofillTerritoriosCascading(matchedPais.id, address, data.territorio_detectado);
      }

      // Check if location is already registered in DB (Optimizado por proximidad)
      const matchedDbDir = await this.findMatchedDbDir(lat, lng);

      if (matchedDbDir) {
        this.selectedDireccionId = matchedDbDir.id;
        this.dirDetalleInput.value = matchedDbDir.detalle;
        if (this.dirLatInput) this.dirLatInput.value = matchedDbDir.latitud;
        if (this.dirLngInput) this.dirLngInput.value = matchedDbDir.longitud;
        if (this.dirPaisSelect) this.dirPaisSelect.value = matchedDbDir.territorio?.pais_id || '';
        this.currentPostalCode = matchedDbDir.codigo_postal || '';

        this.actualizarIndicadorMinimalista();

        ToastService.info(`Ubicación seleccionada: ${matchedDbDir.detalle}`);
      } else {
        this.selectedDireccionId = null;
        this.actualizarIndicadorMinimalista();
      }
    } catch (e) {
      console.warn('Error autofilling from reverse geocoding:', e);
    }
  }

  async findMatchedDbDir(lat, lng) {
    let matchedDbDir = null;
    try {
      const dbDirs = (await CatalogoService.getDirecciones()) || [];
      let minDistance = Infinity;

      for (const d of dbDirs) {
        if (!d.latitud || !d.longitud) continue;
        const dist = this.calcularDistancia(
          Number.parseFloat(lat),
          Number.parseFloat(lng),
          Number.parseFloat(d.latitud),
          Number.parseFloat(d.longitud)
        );
        if (dist < minDistance && dist <= 0.05) {
          minDistance = dist;
          matchedDbDir = d;
        }
      }
    } catch (err) {
      console.warn('Error fetching existing addresses for matching:', err);
    }
    return matchedDbDir;
  }

  async autofillTerritoriosCascading(paisId, address, territorioDetectado) {
    if (territorioDetectado) {
      await this.handleTerritorioDetectado(paisId, address, territorioDetectado);
      return;
    }
    await this.handleTerritorioNoDetectado(paisId, address);
  }

  async handleTerritorioDetectado(paisId, address, td) {
    await this.cargarDropdownNivel1(paisId);
    if (!td.provincia_id || !this.dirNivel1Select) return;

    this.dirNivel1Select.value = td.provincia_id;
    await this.cargarDropdownNivel2(paisId, td.provincia_id);

    if (!td.canton_id || !this.dirNivel2Select) return;
    this.dirNivel2Select.value = td.canton_id;

    await this.cargarDropdownNivel3(paisId, td.canton_id);

    if (td.parroquia_id && this.dirNivel3Select) {
      this.dirNivel3Select.value = td.parroquia_id;
    } else if (!td.parroquia_id && this.dirNivel3Select) {
      this.autofillNivel3FromAddress(address);
    }
  }

  autofillNivel3FromAddress(address) {
    const n3Name =
      [address.parish, address.suburb, address.neighbourhood, address.quarter].find(Boolean) || '';
    if (n3Name) {
      const opt3 = this.findOptionMatchingText(this.dirNivel3Select, n3Name);
      if (opt3) this.dirNivel3Select.value = opt3.value;
    }
  }

  async handleTerritorioNoDetectado(paisId, address) {
    await this.cargarDropdownNivel1(paisId);

    const n1Name = [address.state, address.region, address.province].find(Boolean) || '';
    if (!n1Name) return;

    const opt1 = this.findOptionMatchingText(this.dirNivel1Select, n1Name);
    if (!opt1) return;

    this.dirNivel1Select.value = opt1.value;
    await this.cargarDropdownNivel2(paisId, opt1.value);

    const n2Name =
      [address.county, address.city, address.town, address.municipality].find(Boolean) || '';
    if (!n2Name) return;

    const opt2 = this.findOptionMatchingText(this.dirNivel2Select, n2Name);
    if (!opt2) return;

    this.dirNivel2Select.value = opt2.value;
    await this.cargarDropdownNivel3(paisId, opt2.value);

    this.autofillNivel3FromAddress(address);
  }

  actualizarIndicadorMinimalista() {
    const detalle = this.dirDetalleInput.value;
    const n3Select = this.querySelector('#dirNivel3');
    let parroquiaNombre = '';

    if (n3Select && n3Select.options.length > 0 && n3Select.selectedIndex > 0) {
      parroquiaNombre = n3Select.options[n3Select.selectedIndex].text;
    }

    const txt = this.querySelector('#txtInfoUbicacion');
    if (txt) {
      if (detalle) {
        let txtInfo = `<strong>Dirección:</strong> ${detalle}`;
        if (parroquiaNombre) {
          txtInfo += ` | <strong>Parroquia:</strong> ${parroquiaNombre}`;
        }
        txt.innerHTML = txtInfo;
      } else {
        txt.textContent = 'Ninguna ubicación seleccionada.';
      }
    }
  }

  findOptionMatchingText(selectEl, text) {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return Array.from(selectEl.options).find((opt) => {
      const optNorm = opt.text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return optNorm.includes(normalized) || normalized.includes(optNorm);
    });
  }

  // --- CATALOGS AND DATA ---
  async cargarCatalogosIniciales() {
    try {
      // 1. Fetch categories
      const catRes = await CatalogoService.getCategoriasIncidencia();
      this.categorias = Array.isArray(catRes) ? catRes : catRes?.data || [];
      const rootCategories = this.categorias.filter((c) => c.parent_id === null && c.activo);
      this.tipoSelect.innerHTML =
        '<option value="">-- Seleccione --</option>' +
        rootCategories.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');

      // 2. Fetch countries
      const paisesRes = await CatalogoService.getPaises();
      this.paisesList = Array.isArray(paisesRes) ? paisesRes : paisesRes?.data || [];
      const optionsHtml =
        '<option value="">-- Seleccione --</option>' +
        this.paisesList
          .filter((p) => p.activo)
          .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
          .join('');
      this.dirPaisSelect.innerHTML = optionsHtml;
      if (this.modalDirPais) {
        this.modalDirPais.innerHTML = optionsHtml;
      }

      // 3. Fetch institutions
      const instsRes = await CatalogoService.getInstituciones();
      const insts = Array.isArray(instsRes) ? instsRes : instsRes?.data || [];
      this.institucionSelect.innerHTML =
        '<option value="">-- Ninguna --</option>' +
        insts.map((i) => `<option value="${i.id}">${i.nombre} (${i.siglas})</option>`).join('');

      // 4. Populate state dropdown
      const estados = [
        { id: 1, nombre: 'Pendiente' },
        { id: 2, nombre: 'En Revisión' },
        { id: 3, nombre: 'En Proceso' },
        { id: 4, nombre: 'Resuelto' },
        { id: 5, nombre: 'Rechazado' },
      ];
      this.estadoSelect.innerHTML = estados
        .map((e) => `<option value="${e.id}">${e.nombre}</option>`)
        .join('');
      this.estadoSelect.value = 1; // Default Pendiente
    } catch (e) {
      console.error('Error loading initial catalog dropdowns:', e);
    }
  }

  onCategoryChange() {
    const parentId = this.tipoSelect.value;
    if (!parentId) {
      this.subTipoSelect.innerHTML = '<option value="">-- Seleccione categoría primero --</option>';
      this.subTipoSelect.disabled = true;
      this.prioridadDisplay.textContent = '-';
      this.prioridadDisplay.style.color = '';
      return;
    }

    const subCats = this.categorias.filter((c) => c.parent_id == parentId && c.activo);
    this.subTipoSelect.innerHTML =
      '<option value="">-- Seleccione --</option>' +
      subCats.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');
    this.subTipoSelect.disabled = false;
    this.calcularPrioridadDinamica();
  }

  onSubCategoryChange() {
    const subTipoId = this.subTipoSelect.value;
    if (subTipoId) {
      const subcat = this.categorias.find((c) => c.id == subTipoId);
      if (subcat?.institucion_id && this.institucionSelect) {
        this.institucionSelect.value = subcat.institucion_id;
      }
    }
    this.calcularPrioridadDinamica();
  }

  calcularPrioridadDinamica() {
    const subTipoId = this.subTipoSelect.value;
    const afectados = Number.parseInt(this.cantidadAfectadosInput.value) || 0;

    const resetDisplay = () => {
      this.prioridadDisplay.textContent = '-';
      this.prioridadDisplay.style.color = '';
      this.prioridadDisplay.className = 'fw-bold fs-6 text-secondary';
    };

    if (!subTipoId) {
      resetDisplay();
      return;
    }

    const subcat = this.categorias.find((c) => c.id == subTipoId);
    if (!subcat?.prioridad_id) {
      resetDisplay();
      return;
    }

    let pId = subcat.prioridad_id;

    // Shift priority up one level if >= 10 affected:
    // Baja (4) -> Media (3)
    // Media (3) -> Alta (2)
    // Alta (2) -> Crítica (1)
    if (afectados >= 10) {
      if (pId === 2) pId = 1;
      else if (pId === 3) pId = 2;
      else if (pId === 4) pId = 3;
    }

    let label = 'Baja';
    let color = '#008000'; // Green
    let badgeClass = 'success';

    if (pId === 1) {
      label = 'Crítica';
      color = '#FF0000'; // Red
      badgeClass = 'danger';
    } else if (pId === 2) {
      label = 'Alta';
      color = '#FF8C00'; // Orange
      badgeClass = 'warning';
    } else if (pId === 3) {
      label = 'Media';
      color = '#FFD700'; // Yellow
      badgeClass = 'info';
    }

    this.prioridadDisplay.textContent = label;
    this.prioridadDisplay.style.color = color;
    this.prioridadDisplay.className = `fw-bold fs-6 badge bg-${badgeClass}-soft text-${badgeClass} px-3 py-1`;
  }

  actualizarEtiquetasNiveles(paisId) {
    const pais = this.paisesList.find((p) => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    this.querySelector('#lblDirNivel1').innerHTML =
      `${config.nivel1} <span class="text-danger">*</span>`;
    this.querySelector('#lblDirNivel2').innerHTML =
      `${config.nivel2} <span class="text-danger">*</span>`;
    this.querySelector('#lblDirNivel3').innerHTML =
      `${config.nivel3} <span class="text-danger">*</span>`;
  }

  async cargarDropdownNivel1(paisId, selectVal = null) {
    const s1 = this.dirNivel1Select;

    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, null);
      if (list.length > 0) {
        s1.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s1.disabled = false;
        this.querySelector('#colDirNivel1').classList.remove('d-none');
      } else {
        s1.innerHTML = '<option value="">-- No hay territorios registrados --</option>';
        this.querySelector('#colDirNivel1').classList.add('d-none');
      }
      this.querySelector('#colDirNivel2').classList.add('d-none');
      this.querySelector('#colDirNivel3').classList.add('d-none');

      if (selectVal) {
        s1.value = selectVal;
      }
    } catch (e) {
      ToastService.error(`Error al cargar provincias: ${e.message}`);
      s1.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel2(paisId, parentId, selectVal = null) {
    const s2 = this.dirNivel2Select;
    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s2.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s2.disabled = false;
        this.querySelector('#colDirNivel2').classList.remove('d-none');
      } else {
        s2.innerHTML = '<option value="">-- No hay --</option>';
        this.querySelector('#colDirNivel2').classList.add('d-none');
      }
      this.querySelector('#colDirNivel3').classList.add('d-none');

      if (selectVal) {
        s2.value = selectVal;
      }
    } catch (e) {
      ToastService.error(`Error al cargar cantones: ${e.message}`);
      s2.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel3(paisId, parentId, selectVal = null) {
    const s3 = this.dirNivel3Select;
    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s3.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s3.disabled = false;
        this.querySelector('#colDirNivel3').classList.remove('d-none');
      } else {
        s3.innerHTML = '<option value="">-- No hay --</option>';
        this.querySelector('#colDirNivel3').classList.add('d-none');
      }

      if (selectVal) {
        s3.value = selectVal;
      }
    } catch (e) {
      ToastService.error(`Error al cargar parroquias: ${e.message}`);
      s3.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  prepararCreacion() {
    document.title = 'Registrar Incidencia';
    this.formTitle.textContent = 'Registrar Incidencia';
    this.btnText.textContent = 'Guardar Incidencia';

    // Auto-select operator's country if exists
    const user = AuthService.getCurrentUser();
    if (user?.pais_id) {
      this.dirPaisSelect.value = user.pais_id;
      this.dirPaisSelect.disabled = true;
      this.actualizarEtiquetasNiveles(user.pais_id);
      this.cargarDropdownNivel1(user.pais_id);

      // Center map around operator's country
      const config = MAP_CONFIG.COUNTRY_CENTERS[user.codigo_iso_pais || 'EC'];
      if (config && this.map) {
        this.map.setView(config.center, config.zoom);
      }
    }
  }

  async cargarDatosEdicion(id) {
    document.title = 'Editar Incidencia';
    this.formTitle.textContent = 'Editar Incidencia';
    this.btnText.textContent = 'Actualizar Incidencia';

    try {
      const inc = await IncidenciaService.getById(id);
      if (!inc) return;

      this.poblarCamposBasicosEdicion(inc);

      // Location
      if (inc.direccion) {
        await this.poblarUbicacionYTerritorioEdicion(inc.direccion);
      }

      this.actualizarIndicadorMinimalista();

      if (inc.recursos && inc.recursos.length > 0) {
        this.poblarRecursosEdicion(inc.recursos);
      }

      this.configurarModoInstitucionEdicion(inc);
    } catch (e) {
      console.error(e);
      ToastService.error('Error al cargar la incidencia para edición.');
    }
  }

  poblarCamposBasicosEdicion(inc) {
    this.incidenciaIdInput.value = inc.id;
    this.versionInput.value = inc.version || 1;
    this.selectedDireccionId = inc.direccion_id;
    this.tipoSelect.value = inc.tipo_incidencia_id || '';

    // Load subcategories
    this.onCategoryChange();
    this.subTipoSelect.value = inc.sub_tipo_incidencia_id || '';

    this.cantidadAfectadosInput.value = inc.cantidad_afectados_incidencia || 0;
    this.descripcionInput.value = inc.incidencia_descripcion || '';
    this.institucionSelect.value = inc.institucion_id || '';
    this.estadoSelect.value = inc.estado_id || 1;

    this.calcularPrioridadDinamica();
  }

  async poblarUbicacionYTerritorioEdicion(dir) {
    this.dirDetalleInput.value = dir.detalle || '';
    this.dirCodigoPostalInput.value = dir.codigo_postal || '';

    if (dir.latitud && dir.longitud) {
      this.actualizarMarcador(dir.latitud, dir.longitud, false);
      this.map.setView([dir.latitud, dir.longitud], 15);
    }

    const terr = dir.territorio;
    if (terr) {
      await this.reconstruirCascadaTerritorial(terr);
    }
  }

  async reconstruirCascadaTerritorial(terr) {
    this.dirPaisSelect.value = terr.pais_id;
    this.actualizarEtiquetasNiveles(terr.pais_id);

    // Rebuild cascade
    let n1 = null,
      n2 = null,
      n3 = null;
    if (terr.parent?.parent) {
      n1 = terr.parent.parent.id;
      n2 = terr.parent.id;
      n3 = terr.id;
    } else if (terr.parent) {
      n1 = terr.parent.id;
      n2 = terr.id;
    } else {
      n1 = terr.id;
    }

    if (n1) {
      await this.cargarDropdownNivel1(terr.pais_id, n1);
      if (n2) {
        await this.cargarDropdownNivel2(terr.pais_id, n1, n2);
        if (n3) {
          await this.cargarDropdownNivel3(terr.pais_id, n2, n3);
        }
      }
    }
  }

  poblarRecursosEdicion(recursos) {
    this.recursosFiles = recursos.map((r) => ({
      id: r.id,
      name: r.url.substring(r.url.lastIndexOf('/') + 1),
      base64: r.url,
      existing: true,
    }));
    this.renderThumbnails();
  }

  configurarModoInstitucionEdicion(inc) {
    // Check if user is of role Institucion
    const user = AuthService.getCurrentUser();
    const isInstitucion = user?.roles?.some((r) => r.nombre === 'Institucion');
    if (isInstitucion) {
      this.disableFormFields();
      // If state is 'En Proceso' (3), show confirm button
      if (inc.estado_id === 3) {
        if (this.btnConfirmarResolucion) {
          this.btnConfirmarResolucion.classList.remove('d-none');
          this.btnConfirmarResolucion.disabled = false;
          this.btnConfirmarResolucion.addEventListener('click', () =>
            this.confirmarResolucion(inc.id)
          );
        }
        if (this.btnSubmit) {
          this.btnSubmit.classList.add('d-none');
        }
      }
    }
  }

  disableFormFields() {
    const inputs = this.querySelectorAll(
      'input, select, textarea, button:not(#btnConfirmarResolucion):not([href])'
    );
    inputs.forEach((el) => {
      el.disabled = true;
    });
    // Hide map instructions, search button/input, and dropzone
    this.querySelector('#direccionSearch')?.classList.add('d-none');
    this.querySelector('#btnBuscarDireccion')?.classList.add('d-none');
    this.querySelector('#dropzoneContainer')?.classList.add('d-none');

    // Select instruction text using a broader selector or class
    const dragText =
      this.querySelector(String.raw`.text-muted.small.mt-1\.5`) ||
      this.querySelector(String.raw`span.text-muted.small.mt-1\.5`);
    if (dragText) dragText.classList.add('d-none');
  }

  async confirmarResolucion(id) {
    const isConfirmed = await ModalService.confirm(
      'Confirmar Resolución',
      '¿Está seguro de que desea confirmar la resolución de esta incidencia?',
      'Confirmar',
      'Cancelar',
      'btn-success'
    );
    if (!isConfirmed) {
      return;
    }

    if (this.btnConfirmarResolucion) this.btnConfirmarResolucion.disabled = true;
    const spinner = this.querySelector('#loadingSpinner');
    if (spinner) spinner.classList.remove('d-none');

    try {
      // Get current version to avoid optimistic locking
      const inc = await IncidenciaService.getById(id);

      const payload = {
        estado_id: 4, // Resuelto
        version: inc.version,
        comentario_estado: 'Resolución confirmada por el solicitante/operador.',
      };

      await IncidenciaService.update(id, payload);
      ToastService.success('La resolución ha sido confirmada correctamente.');
      window.location.hash = '#/incidencias';
    } catch (err) {
      console.error('Error al confirmar resolución:', err);
      ToastService.error(err.message || 'Error al confirmar la resolución.');
      if (this.btnConfirmarResolucion) this.btnConfirmarResolucion.disabled = false;
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  }

  // --- SAVE LOGIC ---
  async guardarIncidencia(e) {
    e.preventDefault();

    if (!this.validarPrecondicionesGuardado()) {
      return;
    }

    const id = this.incidenciaIdInput.value;

    this.limpiarErrores();
    this.btnSubmit.disabled = true;
    const spinner = this.querySelector('#loadingSpinner');
    if (spinner) spinner.classList.remove('d-none');

    try {
      const direccionId = await this.procesarGuardadoDireccion(id);
      const incPayload = this.construirPayloadIncidencia(direccionId);
      await this.ejecutarGuardadoIncidencia(id, incPayload);
    } catch (err) {
      this.manejarErrorGuardado(err, err.message || 'Error al procesar la incidencia.');
    }
  }

  validarPrecondicionesGuardado() {
    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      ToastService.error('Por favor complete los campos obligatorios del formulario.');
      return false;
    }

    if (!this.coords) {
      ToastService.error('Debe marcar la ubicación en el mapa.');
      return false;
    }

    if (!this.selectedDireccionId) {
      const finalTerritorioId =
        this.dirNivel3Select.value || this.dirNivel2Select.value || this.dirNivel1Select.value;
      if (!finalTerritorioId) {
        ToastService.error(
          'Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).'
        );
        return false;
      }
    }

    return true;
  }

  async procesarGuardadoDireccion(id) {
    if (this.selectedDireccionId) {
      return this.selectedDireccionId;
    }

    const finalTerritorioId =
      this.dirNivel3Select.value || this.dirNivel2Select.value || this.dirNivel1Select.value;

    try {
      const dirPayload = {
        territorio_id: Number.parseInt(finalTerritorioId),
        detalle: this.dirDetalleInput.value,
        referencia: '',
        codigo_postal: this.currentPostalCode || null,
        latitud: this.coords.lat,
        longitud: this.coords.lng,
        precision_gps: this.dirPrecisionGpsInput?.value
          ? Number.parseFloat(this.dirPrecisionGpsInput.value)
          : null,
        activo: true,
      };

      let direccionId;
      const incData = id ? await IncidenciaService.getById(id) : null;
      if (incData?.direccion_id) {
        direccionId = incData.direccion_id;
        await UbicacionesService.updateDireccion(direccionId, dirPayload);
      } else {
        const dirRes = await UbicacionesService.createDireccion(dirPayload);
        direccionId = (dirRes.data || dirRes).id;
      }

      // Limpiar la caché de direcciones
      CatalogoService.clearDireccionesCache();
      return direccionId;
    } catch (err) {
      ToastService.error(`Error al guardar la dirección: ${err.message}`);
    }
  }

  construirPayloadIncidencia(direccionId) {
    return {
      incidencia_descripcion: this.descripcionInput.value,
      direccion_id: direccionId,
      tipo_incidencia_id: Number.parseInt(this.tipoSelect.value),
      sub_tipo_incidencia_id: Number.parseInt(this.subTipoSelect.value),
      cantidad_afectados_incidencia: Number.parseInt(this.cantidadAfectadosInput.value) || 0,
      institucion_id: this.institucionSelect.value
        ? Number.parseInt(this.institucionSelect.value)
        : null,
      estado_id: Number.parseInt(this.estadoSelect.value) || 1,
      version: Number.parseInt(this.versionInput.value) || 1,
      recursos: this.recursosFiles.filter((f) => !f.id).map((f) => f.base64),
    };
  }

  async ejecutarGuardadoIncidencia(id, incPayload) {
    let redirectId = id;
    if (id) {
      await IncidenciaService.update(id, incPayload);
      ToastService.success('Incidencia actualizada con éxito.');
    } else {
      const result = await IncidenciaService.create(incPayload);
      redirectId = result?.data?.id || result?.id || null;
      ToastService.success('Incidencia registrada con éxito.');
    }

    setTimeout(() => {
      if (redirectId) {
        window.location.hash = `#/tramites/estado-individual?id=${redirectId}`;
      } else {
        window.location.hash = '#/incidencias';
      }
    }, 1500);
  }

  manejarErrorGuardado(err, mensaje) {
    console.error(err);
    ToastService.error(mensaje);
    if (this.btnSubmit) this.btnSubmit.disabled = false;
    const spinner = this.querySelector('#loadingSpinner');
    if (spinner) spinner.classList.add('d-none');
  }

  // --- RESOURCES & FILE UPLOADS MOCK (CIMIENTOS) ---
  setupDropzoneDragAndDrop() {
    const dropzone = this.dropzoneContainer;

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.add('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.processFiles(files);
    });
  }

  handleFileSelection(e) {
    const files = e.target.files;
    this.processFiles(files);
  }
  async processFiles(files) {
    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        ToastService.warning('Solo se permiten archivos de imagen.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        ToastService.warning('La imagen no debe superar el límite de 10 MB.');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentUser = AuthService.getCurrentUser();
    const maxFiles = currentUser?.max_files || 5;

    if (this.recursosFiles.length + validFiles.length > maxFiles) {
      ToastService.warning(
        `No puede subir más de ${maxFiles} archivos en total. (Límite configurado: ${maxFiles})`
      );
      return;
    }

    const isConfirmed = await ModalService.confirm(
      'Confirmar Subida de Imágenes',
      '¿Está seguro de que desea adjuntar estas imágenes a la incidencia? Por favor, verifique que cumplan con las normas.',
      'Adjuntar',
      'Cancelar',
      'btn-primary'
    );

    if (!isConfirmed) return;

    for (const file of validFiles) {
      try {
        const base64Data = await this.convertToWebP(file);
        let fileName = file.name;
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex !== -1) {
          fileName = fileName.substring(0, dotIndex) + '.webp';
        } else {
          fileName += '.webp';
        }

        const fileObj = {
          name: fileName,
          size: Math.round(base64Data.length * 0.75),
          type: 'image/webp',
          base64: base64Data,
          compressed: true,
        };

        this.recursosFiles.push(fileObj);
      } catch (e) {
        console.error('Error al comprimir la imagen:', e);
        // Fallback to original file read
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            this.recursosFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              base64: reader.result,
              compressed: false,
            });
            resolve();
          };
        });
      }
    }
    this.renderThumbnails();
  }

  convertToWebP(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(webpDataUrl);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen.'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    });
  }

  renderThumbnails() {
    this.thumbnailsContainer.innerHTML = '';

    this.recursosFiles.forEach((file, index) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <div class="card h-100 border rounded-3 overflow-hidden position-relative shadow-sm">
          <img src="${file.base64}" loading="lazy" class="card-img-top object-fit-cover" style="height: 120px;" alt="${file.name}" />
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <div class="text-truncate small fw-medium" title="${file.name}">${file.name}</div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="badge bg-success-soft text-success style="font-size: 0.7rem;">.webp Compressed</span>
              <button type="button" class="btn btn-link text-danger p-0 border-0" data-index="${index}">
                <i class="bi bi-trash small"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      col.querySelector('button').addEventListener('click', (e) => {
        const idx = Number.parseInt(e.currentTarget.dataset.index);
        this.recursosFiles.splice(idx, 1);
        this.renderThumbnails();
      });

      this.thumbnailsContainer.appendChild(col);
    });
  }

  cargarImagenDePrueba() {
    const mockBase64 = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const fileObj = {
      name: 'imagen-de-prueba.webp',
      size: 40,
      type: 'image/webp',
      base64: mockBase64,
      compressed: true,
    };

    // Check limit
    const currentUser = AuthService.getCurrentUser();
    const maxFiles = currentUser?.max_files || 5;
    if (this.recursosFiles.length >= maxFiles) {
      ToastService.warning(`No puede subir más de ${maxFiles} archivos.`);
      return;
    }

    this.recursosFiles.push(fileObj);
    this.renderThumbnails();
    ToastService.success('Imagen de prueba cargada. Listo para guardar.');
  }

  limpiarErrores() {
    const errorAlert = this.querySelector('#formErrorAlert');
    if (errorAlert) errorAlert.classList.add('d-none');
  }
}

customElements.define('app-incidencia-form', IncidenciaFormComponent);
