import { BaseComponent } from '../../../../core/base-component.js';
import { IncidenciaService } from '../../services/incidencia.service.js';
import { CategoriaIncidenciaService } from '../../../categorias/services/categoria-incidencia.service.js';
import { UbicacionesService } from '../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../shared/services/catalogo.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { MAP_CONFIG, COUNTRY_LEVELS } from '../../../../shared/constants.js';

export class IncidenciaFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/incidencias/components/form/incidencia-form.component.html');
    this.map = null;
    this.marker = null;
    this.coords = null;
    this.categorias = [];
    this.paisesList = [];
    this.recursosFiles = []; // Attached images list
  }

  async onInit() {
    console.log('Formulario de incidencias inicializado.');

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
    this.dirCodigoPostalInput = this.querySelector('#dirCodigoPostal');
    this.dirPaisSelect = this.querySelector('#dirPais');
    this.dirNivel1Select = this.querySelector('#dirNivel1');
    this.dirNivel2Select = this.querySelector('#dirNivel2');
    this.dirNivel3Select = this.querySelector('#dirNivel3');
    this.dirLatInput = this.querySelector('#dirLat');
    this.dirLngInput = this.querySelector('#dirLng');
    this.btnBuscarDireccion = this.querySelector('#btnBuscarDireccion');
    this.direccionSearchInput = this.querySelector('#direccionSearch');
    this.btnSubmit = this.querySelector('#btnSubmit');
    
    // Tab Elements
    this.dropzoneContainer = this.querySelector('#dropzoneContainer');
    this.fileInput = this.querySelector('#fileInput');
    this.thumbnailsContainer = this.querySelector('#thumbnailsContainer');

    // Parse URL params
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const incidenciaId = urlParams.get('id');

    // Verify permissions
    if (incidenciaId && !AuthService.hasPermission('Actualizar Incidencia')) {
      alert('No tiene permiso para editar incidencias.');
      window.location.hash = '#/incidencias';
      return;
    }
    if (!incidenciaId && !AuthService.hasPermission('Crear Incidencia')) {
      alert('No tiene permiso para registrar incidencias.');
      window.location.hash = '#/incidencias';
      return;
    }

    // Role-based visibility
    const user = AuthService.getCurrentUser();
    const isCitizen = user && user.roles && user.roles.every(r => r.nombre !== 'Admin' && r.nombre !== 'Operador' && r.nombre !== 'Institucion');
    if (isCitizen) {
      this.querySelector('#sectionAsignacion')?.classList.add('d-none');
    }

    // Initialize map
    this.initMap();

    // Event listeners
    this.form.addEventListener('submit', (e) => this.guardarIncidencia(e));
    this.tipoSelect.addEventListener('change', () => this.onCategoryChange());
    this.subTipoSelect.addEventListener('change', () => this.calcularPrioridadDinamica());
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

    this.btnBuscarDireccion.addEventListener('click', () => this.buscarDireccionText());
    this.direccionSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.buscarDireccionText();
      }
    });

    // Resources/Upload events
    if (this.dropzoneContainer && this.fileInput) {
      this.dropzoneContainer.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
      this.setupDropzoneDragAndDrop();
    }

    // Load initial dropdown data
    await this.cargarCatalogosIniciales();

    if (incidenciaId) {
      await this.cargarDatosEdicion(incidenciaId);
    } else {
      this.prepararCreacion();
    }
  }

  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // --- MAP LOGIC ---
  initMap() {
    const mapDiv = this.querySelector('#incidenciaMapa');
    if (!mapDiv) return;

    this.map = L.map(mapDiv).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.actualizarMarcador(lat, lng, true);
    });
  }

  actualizarMarcador(lat, lng, triggerGeocode = false) {
    if (!this.map) return;

    const latVal = parseFloat(lat).toFixed(6);
    const lngVal = parseFloat(lng).toFixed(6);

    this.dirLatInput.value = latVal;
    this.dirLngInput.value = lngVal;
    this.coords = { lat: parseFloat(latVal), lng: parseFloat(lngVal) };

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.actualizarMarcador(pos.lat, pos.lng, true);
      });
    }

    if (triggerGeocode) {
      this.autofillDesdeCoordenadas(latVal, lngVal);
    }
  }

  async autofillDesdeCoordenadas(lat, lng) {
    const mapLoader = this.querySelector('#mapLoader');
    if (mapLoader) mapLoader.classList.remove('d-none');

    try {
      const data = await UbicacionesService.reverseGeocode(lat, lng);
      const address = data.address || {};

      // 1. Fill detailed address
      const road = address.road || address.pedestrian || '';
      const suburb = address.suburb || address.neighbourhood || address.parish || '';
      const county = address.county || address.city || '';
      this.dirDetalleInput.value = [road, suburb, county].filter(Boolean).join(', ') || data.display_name || '';

      // 2. Postal code
      this.dirCodigoPostalInput.value = address.postcode || '';

      // 3. Match Country
      const countryCode = (address.country_code || '').toUpperCase();
      const matchedPais = this.paisesList.find(p => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode);

      if (matchedPais) {
        this.dirPaisSelect.value = matchedPais.id;
        this.actualizarEtiquetasNiveles(matchedPais.id);

        // Geocoding autofill cascading for territories
        await this.autofillTerritoriosCascading(matchedPais.id, address);
      }
    } catch (e) {
      console.warn('Error autofilling from reverse geocoding:', e);
    } finally {
      if (mapLoader) mapLoader.classList.add('d-none');
    }
  }

  async autofillTerritoriosCascading(paisId, address) {
    const possibleNivel1Names = [address.state, address.region, address.province].filter(Boolean);
    const n1Name = possibleNivel1Names[0] || '';

    if (n1Name) {
      await this.cargarDropdownNivel1(paisId);
      const opt1 = this.findOptionMatchingText(this.dirNivel1Select, n1Name);
      if (opt1) {
        this.dirNivel1Select.value = opt1.value;
        this.querySelector('#colDirNivel1').classList.remove('d-none');

        const possibleNivel2Names = [address.county, address.city, address.town, address.municipality].filter(Boolean);
        const n2Name = possibleNivel2Names[0] || '';
        if (n2Name) {
          await this.cargarDropdownNivel2(paisId, opt1.value);
          const opt2 = this.findOptionMatchingText(this.dirNivel2Select, n2Name);
          if (opt2) {
            this.dirNivel2Select.value = opt2.value;
            this.querySelector('#colDirNivel2').classList.remove('d-none');

            const possibleNivel3Names = [address.parish, address.suburb, address.neighbourhood, address.quarter].filter(Boolean);
            const n3Name = possibleNivel3Names[0] || '';
            if (n3Name) {
              await this.cargarDropdownNivel3(paisId, opt2.value);
              const opt3 = this.findOptionMatchingText(this.dirNivel3Select, n3Name);
              if (opt3) {
                this.dirNivel3Select.value = opt3.value;
                this.querySelector('#colDirNivel3').classList.remove('d-none');
              }
            }
          }
        }
      }
    }
  }

  findOptionMatchingText(selectEl, text) {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return Array.from(selectEl.options).find(opt => {
      const optNorm = opt.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return optNorm.includes(normalized) || normalized.includes(optNorm);
    });
  }

  async buscarDireccionText() {
    const query = this.direccionSearchInput.value.trim();
    if (!query) return;

    const mapLoader = this.querySelector('#mapLoader');
    if (mapLoader) mapLoader.classList.remove('d-none');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        this.actualizarMarcador(lat, lng, false);
        this.map.setView([lat, lng], 14);

        // Populate fields
        this.dirDetalleInput.value = item.display_name;
        // Trigger autofill detail based on the coordinates
        await this.autofillDesdeCoordenadas(lat, lng);
      } else {
        alert('No se encontraron resultados para la dirección buscada.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al buscar dirección.');
    } finally {
      if (mapLoader) mapLoader.classList.add('d-none');
    }
  }

  // --- CATALOGS AND DATA ---
  async cargarCatalogosIniciales() {
    try {
      // 1. Fetch categories
      this.categorias = await CategoriaIncidenciaService.getAll() || [];
      const rootCategories = this.categorias.filter(c => c.parent_id === null && c.activo);
      this.tipoSelect.innerHTML = '<option value="">-- Seleccione --</option>' + 
        rootCategories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

      // 2. Fetch countries
      const paises = await CatalogoService.getPaises();
      this.paisesList = paises || [];
      this.dirPaisSelect.innerHTML = '<option value="">-- Seleccione --</option>' + 
        this.paisesList.filter(p => p.activo).map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

      // 3. Fetch institutions
      const insts = await CatalogoService.getInstituciones();
      this.institucionSelect.innerHTML = '<option value="">-- Ninguna --</option>' + 
        insts.map(i => `<option value="${i.id}">${i.nombre} (${i.siglas})</option>`).join('');

      // 4. Populate state dropdown
      const estados = [
        { id: 1, nombre: 'Borrador' },
        { id: 2, nombre: 'En Revisión' },
        { id: 3, nombre: 'Aprobado' },
        { id: 4, nombre: 'Rechazado' }
      ];
      this.estadoSelect.innerHTML = estados.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
      this.estadoSelect.value = 2; // Default En Revisión

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

    const subCats = this.categorias.filter(c => c.parent_id == parentId && c.activo);
    this.subTipoSelect.innerHTML = '<option value="">-- Seleccione --</option>' + 
      subCats.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    this.subTipoSelect.disabled = false;
    this.calcularPrioridadDinamica();
  }

  calcularPrioridadDinamica() {
    const subTipoId = this.subTipoSelect.value;
    const afectados = parseInt(this.cantidadAfectadosInput.value) || 0;

    if (!subTipoId) {
      this.prioridadDisplay.textContent = '-';
      this.prioridadDisplay.style.color = '';
      this.prioridadDisplay.className = 'fw-bold fs-5 text-secondary';
      return;
    }

    const subcat = this.categorias.find(c => c.id == subTipoId);
    if (!subcat || !subcat.prioridad_id) {
      this.prioridadDisplay.textContent = '-';
      this.prioridadDisplay.style.color = '';
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
    this.prioridadDisplay.className = `fw-bold fs-5 badge bg-${badgeClass}-soft text-${badgeClass} px-3 py-1.5`;
  }

  actualizarEtiquetasNiveles(paisId) {
    const pais = this.paisesList.find(p => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    this.querySelector('#lblDirNivel1').innerHTML = `${config.nivel1} <span class="text-danger">*</span>`;
    this.querySelector('#lblDirNivel2').innerHTML = `${config.nivel2} <span class="text-danger">*</span>`;
    this.querySelector('#lblDirNivel3').innerHTML = `${config.nivel3} <span class="text-danger">*</span>`;
  }

  async cargarDropdownNivel1(paisId, selectVal = null) {
    const s1 = this.dirNivel1Select;
    const s2 = this.dirNivel2Select;
    const s3 = this.dirNivel3Select;

    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: null });
      if (list.length > 0) {
        s1.innerHTML = '<option value="">-- Seleccione --</option>' + 
          list.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
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
      s1.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel2(paisId, parentId, selectVal = null) {
    const s2 = this.dirNivel2Select;
    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      if (list.length > 0) {
        s2.innerHTML = '<option value="">-- Seleccione --</option>' + 
          list.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
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
      s2.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel3(paisId, parentId, selectVal = null) {
    const s3 = this.dirNivel3Select;
    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      if (list.length > 0) {
        s3.innerHTML = '<option value="">-- Seleccione --</option>' + 
          list.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
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
      s3.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  prepararCreacion() {
    document.title = 'Registrar Incidencia';
    this.formTitle.textContent = 'Registrar Incidencia';
    this.btnText.textContent = 'Guardar Incidencia';
    
    // Auto-select operator's country if exists
    const user = AuthService.getCurrentUser();
    if (user && user.pais_id) {
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

      this.incidenciaIdInput.value = inc.id;
      this.versionInput.value = inc.version || 1;
      this.tipoSelect.value = inc.tipo_incidencia_id || '';
      
      // Load subcategories
      this.onCategoryChange();
      this.subTipoSelect.value = inc.sub_tipo_incidencia_id || '';
      
      this.cantidadAfectadosInput.value = inc.cantidad_afectados_incidencia || 0;
      this.descripcionInput.value = inc.incidencia_descripcion || '';
      this.institucionSelect.value = inc.institucion_id || '';
      this.estadoSelect.value = inc.estado_id || 2;

      this.calcularPrioridadDinamica();

      // Location
      if (inc.direccion) {
        const dir = inc.direccion;
        this.dirDetalleInput.value = dir.detalle || '';
        this.dirCodigoPostalInput.value = dir.codigo_postal || '';
        
        if (dir.latitud && dir.longitud) {
          this.actualizarMarcador(dir.latitud, dir.longitud, false);
          this.map.setView([dir.latitud, dir.longitud], 15);
        }

        const terr = dir.territorio;
        if (terr) {
          this.dirPaisSelect.value = terr.pais_id;
          this.actualizarEtiquetasNiveles(terr.pais_id);

          // Rebuild cascade
          let n1 = null, n2 = null, n3 = null;
          if (terr.parent && terr.parent.parent) {
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
      }
    } catch (e) {
      console.error(e);
      this.mostrarError('Error al cargar la incidencia para edición.');
    }
  }

  // --- SAVE LOGIC ---
  async guardarIncidencia(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      this.mostrarError('Por favor complete los campos obligatorios del formulario.');
      return;
    }

    const id = this.incidenciaIdInput.value;
    
    // Validate that we have coordinates and detailed address
    if (!this.coords) {
      this.mostrarError('Debe marcar la ubicación en el mapa.');
      return;
    }

    const finalTerritorioId = this.dirNivel3Select.value || this.dirNivel2Select.value || this.dirNivel1Select.value;
    if (!finalTerritorioId) {
      this.mostrarError('Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).');
      return;
    }

    this.limpiarErrores();
    this.btnSubmit.disabled = true;
    this.querySelector('#loadingSpinner').classList.remove('d-none');

    try {
      // 1. Guardar la dirección primero
      const dirPayload = {
        territorio_id: parseInt(finalTerritorioId),
        detalle: this.dirDetalleInput.value,
        codigo_postal: this.dirCodigoPostalInput.value || null,
        latitud: this.coords.lat,
        longitud: this.coords.lng,
        activo: true
      };

      let direccionId = null;
      if (id) {
        // If editing, update or keep address
        const incData = await IncidenciaService.getById(id);
        direccionId = incData.direccion_id;
        await UbicacionesService.updateDireccion(direccionId, dirPayload);
      } else {
        const dirRes = await UbicacionesService.createDireccion(dirPayload);
        direccionId = (dirRes.data || dirRes).id;
      }

      // 2. Guardar incidencia
      const incPayload = {
        incidencia_descripcion: this.descripcionInput.value,
        direccion_id: direccionId,
        tipo_incidencia_id: parseInt(this.tipoSelect.value),
        sub_tipo_incidencia_id: parseInt(this.subTipoSelect.value),
        cantidad_afectados_incidencia: parseInt(this.cantidadAfectadosInput.value) || 0,
        institucion_id: this.institucionSelect.value ? parseInt(this.institucionSelect.value) : null,
        estado_id: parseInt(this.estadoSelect.value) || 2,
        version: parseInt(this.versionInput.value) || 1
      };

      if (id) {
        await IncidenciaService.update(id, incPayload);
        this.mostrarAlertaExito('Incidencia actualizada con éxito.');
      } else {
        await IncidenciaService.create(incPayload);
        this.mostrarAlertaExito('Incidencia registrada con éxito.');
      }

      setTimeout(() => {
        window.location.hash = '#/incidencias';
      }, 1500);

    } catch (err) {
      console.error(err);
      this.mostrarError(err.message || 'Error al procesar la incidencia.');
      this.btnSubmit.disabled = false;
      this.querySelector('#loadingSpinner').classList.add('d-none');
    }
  }

  // --- RESOURCES & FILE UPLOADS MOCK (CIMIENTOS) ---
  setupDropzoneDragAndDrop() {
    const dropzone = this.dropzoneContainer;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('border-primary', 'bg-primary-soft');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-primary', 'bg-primary-soft');
      }, false);
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

  processFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar el límite de 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          base64: reader.result,
          compressed: true // Mock compression flag (representing .webp automatic client compression)
        };

        this.recursosFiles.push(fileObj);
        this.renderThumbnails();
      };
    });
  }

  renderThumbnails() {
    this.thumbnailsContainer.innerHTML = '';
    
    this.recursosFiles.forEach((file, index) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <div class="card h-100 border rounded-3 overflow-hidden position-relative shadow-sm">
          <img src="${file.base64}" class="card-img-top object-fit-cover" style="height: 120px;" alt="${file.name}" />
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
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        this.recursosFiles.splice(idx, 1);
        this.renderThumbnails();
      });

      this.thumbnailsContainer.appendChild(col);
    });
  }

  // --- ALERTS AND FEEDBACK ---
  mostrarAlertaExito(message) {
    const successAlert = this.querySelector('#formSuccessAlert');
    const successMessage = this.querySelector('#formSuccessMessage');
    if (successAlert && successMessage) {
      successMessage.textContent = message;
      successAlert.classList.remove('d-none');
      successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  mostrarError(message) {
    const errorAlert = this.querySelector('#formErrorAlert');
    const errorMessage = this.querySelector('#formErrorMessage');
    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.classList.remove('d-none');
      errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  limpiarErrores() {
    const errorAlert = this.querySelector('#formErrorAlert');
    if (errorAlert) errorAlert.classList.add('d-none');
  }
}

customElements.define('app-incidencia-form', IncidenciaFormComponent);
