import { BaseComponent } from '../../../../../core/base-component.js';
import { IncidenciaService } from '../../../services/incidencia.service.js';
import { UbicacionesService } from '../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../shared/services/catalogo.service.js';
import { ModalService } from '../../../../../shared/services/modal.service.js';
import { ToastService } from '../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../core/auth.service.js';
import { PermissionsEnum } from '../../../../../core/permissions.enum.js';
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
    this.btnObtenerUbicacion = this.querySelector('#btnObtenerUbicacion');
    this.dirPrecisionGpsInput = this.querySelector('#dirPrecisionGps');
    this.direccionSearchInput = this.querySelector('#direccionSearch');
    this.btnSubmit = this.querySelector('#btnSubmit');
    this.btnConfirmarResolucion = this.querySelector('#btnConfirmarResolucion');
    this.divInstitucion = this.querySelector('#divInstitucion');
    this.formTitle = this.querySelector('#formTitle');
    this.btnText = this.querySelector('#btnText');

    // Modal elements
    this.modalElement = this.querySelector('#modalRegistrarDireccion');
    this.modalInstance = this.modalElement ? new bootstrap.Modal(this.modalElement) : null;

    this.modalDirDetalle = this.querySelector('#modalDirDetalle');
    this.modalDirCodigoPostal = this.querySelector('#modalDirCodigoPostal');
    this.modalDirPais = this.querySelector('#modalDirPais');
    this.modalDirNivel1 = this.querySelector('#modalDirNivel1');
    this.modalDirNivel2 = this.querySelector('#modalDirNivel2');
    this.modalDirNivel3 = this.querySelector('#modalDirNivel3');
    this.modalDirLat = this.querySelector('#modalDirLat');
    this.modalDirLng = this.querySelector('#modalDirLng');

    this.colModalDirNivel1 = this.querySelector('#colModalDirNivel1');
    this.colModalDirNivel2 = this.querySelector('#colModalDirNivel2');
    this.colModalDirNivel3 = this.querySelector('#colModalDirNivel3');

    this.btnCancelarModal = this.querySelector('#btnCancelarModal');
    this.btnCerrarModalX = this.querySelector('#btnCerrarModalX');
    this.btnGuardarModalDireccion = this.querySelector('#btnGuardarModalDireccion');

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
      ToastService.error('No tiene permiso para editar incidencias.');
      window.location.hash = '#/incidencias';
      return;
    }
    if (!incidenciaId && !AuthService.hasPermission('Crear Incidencia')) {
      ToastService.error('No tiene permiso para registrar incidencias.');
      window.location.hash = '#/incidencias';
      return;
    }

    // Role & Permission based field visibility and behavior
    const user = AuthService.getCurrentUser();
    const isAdmin = AuthService.isAdmin();

    // Check if the user has permissions to modify the incident status/assignment
    const canManageIncidencia =
      isAdmin ||
      AuthService.hasPermission(PermissionsEnum.UPDATE_INCIDENCIAS) ||
      AuthService.hasPermission(PermissionsEnum.UPDATE_DESPACHO_INCIDENCIAS);

    // Hide State selector (colEstado) if user cannot manage/update incidents
    const colEstado = this.querySelector('#colEstado');
    if (colEstado) {
      if (canManageIncidencia) {
        colEstado.classList.remove('d-none');
      } else {
        colEstado.classList.add('d-none');
      }
    }

    // Institution select must be visible, but disabled for users without update permissions (e.g. Citizens)
    if (this.divInstitucion) {
      this.divInstitucion.classList.remove('d-none');
    }
    if (this.institucionSelect) {
      this.institucionSelect.disabled = !canManageIncidencia;
    }

    const isCitizen =
      user &&
      user.roles &&
      user.roles.every(
        (r) => r.nombre !== 'Admin' && r.nombre !== 'Supervisor' && r.nombre !== 'Institucion'
      );
    if (isCitizen) {
      const detContainer = this.querySelector('#detallesDireccionContainer');
      if (detContainer) detContainer.classList.add('d-none');

      const colMapa = this.querySelector('#colMapaContainer');
      if (colMapa) {
        colMapa.classList.remove('col-lg-7');
        colMapa.classList.add('col-lg-12');
      }

      const infoMinimalista = this.querySelector('#infoUbicacionMinimalista');
      if (infoMinimalista) {
        infoMinimalista.classList.remove('d-none');
      }

      // Remove required from hidden inputs to avoid form validation blocking
      this.dirDetalleInput?.removeAttribute('required');
      this.dirPaisSelect?.removeAttribute('required');
      this.dirNivel1Select?.removeAttribute('required');
      this.dirNivel2Select?.removeAttribute('required');
      this.dirNivel3Select?.removeAttribute('required');
    }

    // Initialize map
    this.initMap();

    // Event listeners
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

    // Modal event listeners
    if (this.btnCancelarModal) {
      this.btnCancelarModal.addEventListener('click', () => this.modalInstance?.hide());
    }
    if (this.btnCerrarModalX) {
      this.btnCerrarModalX.addEventListener('click', () => this.modalInstance?.hide());
    }
    if (this.btnGuardarModalDireccion) {
      this.btnGuardarModalDireccion.addEventListener('click', () => this.guardarDireccionModal());
    }

    if (this.modalDirPais) {
      this.modalDirPais.addEventListener('change', (e) => {
        this.actualizarEtiquetasNivelesModal(e.target.value);
        this.cargarModalDropdownNivel1(e.target.value);
      });
    }
    if (this.modalDirNivel1) {
      this.modalDirNivel1.addEventListener('change', (e) => {
        this.cargarModalDropdownNivel2(this.modalDirPais.value, e.target.value);
      });
    }
    if (this.modalDirNivel2) {
      this.modalDirNivel2.addEventListener('change', (e) => {
        this.cargarModalDropdownNivel3(this.modalDirPais.value, e.target.value);
      });
    }

    if (this.btnObtenerUbicacion) {
      this.btnObtenerUbicacion.addEventListener('click', () => this.obtenerUbicacionActual());
    }
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

    // Display maximum files limit
    const cantMaximaArchivosEl = this.querySelector('#cantMaximaArchivos');
    const maxFiles = user?.max_files || 5;
    if (cantMaximaArchivosEl) {
      cantMaximaArchivosEl.value = maxFiles;
      if (isAdmin) {
        cantMaximaArchivosEl.removeAttribute('readonly');
        cantMaximaArchivosEl.style.setProperty('border-bottom', '1px dashed #6c757d', 'important');
        cantMaximaArchivosEl.style.pointerEvents = 'auto';

        cantMaximaArchivosEl.addEventListener('change', (e) => {
          const val = parseInt(e.target.value) || 5;
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

  obtenerUbicacionActual() {
    if (!navigator.geolocation) {
      ToastService.error('Su navegador no soporta la Geolocalización.');
      return;
    }

    const mapLoader = this.querySelector('#mapLoader');
    if (mapLoader) mapLoader.classList.remove('d-none');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (this.dirPrecisionGpsInput) {
          this.dirPrecisionGpsInput.value = accuracy.toFixed(2);
        }
        this.actualizarMarcador(latitude, longitude, false);
        if (this.map) {
          this.map.setView([latitude, longitude], 16);
        }
        await this.autofillDesdeCoordenadas(latitude, longitude);
        if (mapLoader) mapLoader.classList.add('d-none');
        ToastService.success(`Ubicación obtenida con éxito (Precisión: ${accuracy.toFixed(1)}m).`);
      },
      (error) => {
        if (mapLoader) mapLoader.classList.add('d-none');
        let msg = 'Error al obtener la geolocalización.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso denegado por el usuario para obtener geolocalización.';
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

  // --- MAP LOGIC ---
  initMap() {
    const mapDiv = this.querySelector('#incidenciaMapa');
    if (!mapDiv) return;

    this.map = L.map(mapDiv).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20,
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
      this.dirDetalleInput.value =
        [road, suburb, county].filter(Boolean).join(', ') || data.display_name || '';

      // 2. Postal code
      this.dirCodigoPostalInput.value = address.postcode || '';

      // 3. Match Country
      const countryCode = (address.country_code || '').toUpperCase();
      const matchedPais = this.paisesList.find(
        (p) => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode
      );

      if (matchedPais) {
        this.dirPaisSelect.value = matchedPais.id;
        this.actualizarEtiquetasNiveles(matchedPais.id);

        // Geocoding autofill cascading for territories
        await this.autofillTerritoriosCascading(matchedPais.id, address);
      }

      // Check if location is already registered in DB
      let matchedDbDir = null;
      try {
        const dbDirs = (await CatalogoService.getDirecciones()) || [];
        matchedDbDir = dbDirs.find((d) => {
          const latDiff = Math.abs(parseFloat(d.latitud) - parseFloat(lat));
          const lngDiff = Math.abs(parseFloat(d.longitud) - parseFloat(lng));
          return latDiff < 0.00025 && lngDiff < 0.00025;
        });
      } catch (err) {
        console.warn('Error fetching existing addresses for matching:', err);
      }

      const user = AuthService.getCurrentUser();
      const isCitizen =
        user &&
        user.roles &&
        user.roles.every(
          (r) => r.nombre !== 'Admin' && r.nombre !== 'Supervisor' && r.nombre !== 'Institucion'
        );

      if (matchedDbDir) {
        this.selectedDireccionId = matchedDbDir.id;
        this.dirDetalleInput.value = matchedDbDir.detalle;
        this.dirLatInput.value = matchedDbDir.latitud;
        this.dirLngInput.value = matchedDbDir.longitud;
        this.dirPaisSelect.value = matchedDbDir.territorio?.pais_id || '';
        this.dirCodigoPostalInput.value = matchedDbDir.codigo_postal || '';

        this.actualizarIndicadorMinimalista();

        if (isCitizen) {
          ToastService.info(`Ubicación seleccionada: ${matchedDbDir.detalle}`);
        }
      } else {
        this.selectedDireccionId = null;
        if (isCitizen) {
          if (this.modalInstance) {
            this.modalDirLat.value = lat;
            this.modalDirLng.value = lng;
            this.modalDirDetalle.value =
              [road, suburb, county].filter(Boolean).join(', ') || data.display_name || '';
            this.modalDirCodigoPostal.value = address.postcode || '';

            if (matchedPais) {
              this.modalDirPais.value = matchedPais.id;
              this.actualizarEtiquetasNivelesModal(matchedPais.id);
              await this.autofillModalTerritoriosCascading(matchedPais.id, address);
            } else {
              this.modalDirPais.value = '';
              this.colModalDirNivel1.classList.add('d-none');
              this.colModalDirNivel2.classList.add('d-none');
              this.colModalDirNivel3.classList.add('d-none');
            }
            this.modalInstance.show();
          }
        }
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

        const possibleNivel2Names = [
          address.county,
          address.city,
          address.town,
          address.municipality,
        ].filter(Boolean);
        const n2Name = possibleNivel2Names[0] || '';
        if (n2Name) {
          await this.cargarDropdownNivel2(paisId, opt1.value);
          const opt2 = this.findOptionMatchingText(this.dirNivel2Select, n2Name);
          if (opt2) {
            this.dirNivel2Select.value = opt2.value;
            this.querySelector('#colDirNivel2').classList.remove('d-none');

            const possibleNivel3Names = [
              address.parish,
              address.suburb,
              address.neighbourhood,
              address.quarter,
            ].filter(Boolean);
            const n3Name = possibleNivel3Names[0] || '';

            // Load and show Nivel 3 if we matched Nivel 2
            await this.cargarDropdownNivel3(paisId, opt2.value);
            if (n3Name) {
              const opt3 = this.findOptionMatchingText(this.dirNivel3Select, n3Name);
              if (opt3) {
                this.dirNivel3Select.value = opt3.value;
              }
            }
          }
        }
      }
    }
  }

  async autofillModalTerritoriosCascading(paisId, address) {
    const possibleNivel1Names = [address.state, address.region, address.province].filter(Boolean);
    const n1Name = possibleNivel1Names[0] || '';

    if (n1Name) {
      await this.cargarModalDropdownNivel1(paisId);
      const opt1 = this.findOptionMatchingText(this.modalDirNivel1, n1Name);
      if (opt1) {
        this.modalDirNivel1.value = opt1.value;
        this.colModalDirNivel1.classList.remove('d-none');

        const possibleNivel2Names = [
          address.county,
          address.city,
          address.town,
          address.municipality,
        ].filter(Boolean);
        const n2Name = possibleNivel2Names[0] || '';
        if (n2Name) {
          await this.cargarModalDropdownNivel2(paisId, opt1.value);
          const opt2 = this.findOptionMatchingText(this.modalDirNivel2, n2Name);
          if (opt2) {
            this.modalDirNivel2.value = opt2.value;
            this.colModalDirNivel2.classList.remove('d-none');
            const possibleNivel3Names = [
              address.parish,
              address.suburb,
              address.neighbourhood,
              address.quarter,
            ].filter(Boolean);
            const n3Name = possibleNivel3Names[0] || '';

            // Load and show Nivel 3 in modal if we matched Nivel 2
            await this.cargarModalDropdownNivel3(paisId, opt2.value);
            if (n3Name) {
              const opt3 = this.findOptionMatchingText(this.modalDirNivel3, n3Name);
              if (opt3) {
                this.modalDirNivel3.value = opt3.value;
              }
            }
          }
        }
      }
    }
  }

  actualizarEtiquetasNivelesModal(paisId) {
    const pId = parseInt(paisId);
    const lbl1 = this.querySelector('#lblModalDirNivel1');
    const lbl2 = this.querySelector('#lblModalDirNivel2');
    const lbl3 = this.querySelector('#lblModalDirNivel3');

    if (pId === 1) {
      // Perú
      if (lbl1) lbl1.textContent = 'Departamento *';
      if (lbl2) lbl2.textContent = 'Provincia *';
      if (lbl3) lbl3.textContent = 'Distrito *';
    } else if (pId === 2) {
      // México
      if (lbl1) lbl1.textContent = 'Estado *';
      if (lbl2) lbl2.textContent = 'Municipio *';
      if (lbl3) lbl3.textContent = 'Colonia/Localidad *';
    } else {
      // Ecuador / default
      if (lbl1) lbl1.textContent = 'Provincia *';
      if (lbl2) lbl2.textContent = 'Cantón *';
      if (lbl3) lbl3.textContent = 'Parroquia *';
    }
  }

  async cargarModalDropdownNivel1(paisId, selectVal = null) {
    const s1 = this.modalDirNivel1;
    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, null);
      if (list.length > 0) {
        s1.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s1.disabled = false;
        this.colModalDirNivel1.classList.remove('d-none');
      } else {
        s1.innerHTML = '<option value="">-- No hay territorios registrados --</option>';
        this.colModalDirNivel1.classList.add('d-none');
      }
      this.colModalDirNivel2.classList.add('d-none');
      this.colModalDirNivel3.classList.add('d-none');

      if (selectVal) {
        s1.value = selectVal;
      }
    } catch (e) {
      s1.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarModalDropdownNivel2(paisId, parentId, selectVal = null) {
    const s2 = this.modalDirNivel2;
    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s2.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s2.disabled = false;
        this.colModalDirNivel2.classList.remove('d-none');
      } else {
        s2.innerHTML = '<option value="">-- No hay --</option>';
        this.colModalDirNivel2.classList.add('d-none');
      }
      this.colModalDirNivel3.classList.add('d-none');

      if (selectVal) {
        s2.value = selectVal;
      }
    } catch (e) {
      s2.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarModalDropdownNivel3(paisId, parentId, selectVal = null) {
    const s3 = this.modalDirNivel3;
    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s3.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s3.disabled = false;
        this.colModalDirNivel3.classList.remove('d-none');
      } else {
        s3.innerHTML = '<option value="">-- No hay --</option>';
        this.colModalDirNivel3.classList.add('d-none');
      }

      if (selectVal) {
        s3.value = selectVal;
      }
    } catch (e) {
      s3.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async guardarDireccionModal() {
    const finalTerritorioId =
      this.modalDirNivel3.value || this.modalDirNivel2.value || this.modalDirNivel1.value;
    if (!finalTerritorioId) {
      ToastService.warning(
        'Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).'
      );
      return;
    }
    if (!this.modalDirDetalle.value) {
      ToastService.warning('La dirección detallada es obligatoria.');
      return;
    }

    const dirPayload = {
      territorio_id: parseInt(finalTerritorioId),
      detalle: this.modalDirDetalle.value,
      codigo_postal: this.modalDirCodigoPostal.value || null,
      latitud: parseFloat(this.modalDirLat.value),
      longitud: parseFloat(this.modalDirLng.value),
      activo: true,
    };

    try {
      const dirRes = await UbicacionesService.createDireccion(dirPayload);
      const newDir = dirRes.data || dirRes;
      this.selectedDireccionId = newDir.id;

      // Update background values
      this.dirDetalleInput.value = newDir.detalle;
      this.dirLatInput.value = newDir.latitud;
      this.dirLngInput.value = newDir.longitud;
      this.dirPaisSelect.value = newDir.territorio?.pais_id || this.modalDirPais.value;
      this.dirCodigoPostalInput.value = newDir.codigo_postal || this.modalDirCodigoPostal.value;

      this.actualizarIndicadorMinimalista();

      this.modalInstance?.hide();
      ToastService.success('Ubicación guardada con éxito.');
    } catch (e) {
      console.error(e);
      ToastService.error('Error al guardar la ubicación en la base de datos.');
    }
  }

  actualizarIndicadorMinimalista() {
    const paisId = this.dirPaisSelect.value;
    const paisNombre = this.paisesList.find((p) => p.id == paisId)?.nombre || '';
    const detalle = this.dirDetalleInput.value;
    const cp = this.dirCodigoPostalInput.value;
    const lat = this.coords?.lat || '';
    const lng = this.coords?.lng || '';

    const txt = this.querySelector('#txtInfoUbicacion');
    if (txt) {
      if (detalle) {
        txt.innerHTML = `<strong>País:</strong> ${paisNombre} | <strong>Dirección:</strong> ${detalle} | <strong>C.P.:</strong> ${cp || 'N/A'} | <strong>Coordenadas:</strong> (${lat}, ${lng})`;
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
        ToastService.error('No se encontraron resultados para la dirección buscada.');
      }
    } catch (e) {
      console.error(e);
      ToastService.error('Error al buscar dirección.');
    } finally {
      if (mapLoader) mapLoader.classList.add('d-none');
    }
  }

  // --- CATALOGS AND DATA ---
  async cargarCatalogosIniciales() {
    try {
      // 1. Fetch categories
      this.categorias = (await CatalogoService.getCategoriasIncidencia()) || [];
      const rootCategories = this.categorias.filter((c) => c.parent_id === null && c.activo);
      this.tipoSelect.innerHTML =
        '<option value="">-- Seleccione --</option>' +
        rootCategories.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');

      // 2. Fetch countries
      const paises = await CatalogoService.getPaises();
      this.paisesList = paises || [];
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
      const insts = await CatalogoService.getInstituciones();
      this.institucionSelect.innerHTML =
        '<option value="">-- Ninguna --</option>' +
        insts.map((i) => `<option value="${i.id}">${i.nombre} (${i.siglas})</option>`).join('');

      // 4. Populate state dropdown
      const estados = [
        { id: 1, nombre: 'Borrador' },
        { id: 2, nombre: 'Pendiente' },
        { id: 3, nombre: 'En Revisión' },
        { id: 4, nombre: 'En Proceso' },
        { id: 5, nombre: 'Resuelto' },
        { id: 6, nombre: 'Rechazado' },
      ];
      this.estadoSelect.innerHTML = estados
        .map((e) => `<option value="${e.id}">${e.nombre}</option>`)
        .join('');
      this.estadoSelect.value = 2; // Default Pendiente
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
      if (subcat && subcat.institucion_id && this.institucionSelect) {
        this.institucionSelect.value = subcat.institucion_id;
      }
    }
    this.calcularPrioridadDinamica();
  }

  calcularPrioridadDinamica() {
    const subTipoId = this.subTipoSelect.value;
    const afectados = parseInt(this.cantidadAfectadosInput.value) || 0;

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
    if (!subcat || !subcat.prioridad_id) {
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
    const s2 = this.dirNivel2Select;
    const s3 = this.dirNivel3Select;

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
      this.selectedDireccionId = inc.direccion_id;
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
          let n1 = null,
            n2 = null,
            n3 = null;
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

      this.actualizarIndicadorMinimalista();

      if (inc.recursos && inc.recursos.length > 0) {
        this.recursosFiles = inc.recursos.map((r) => ({
          id: r.id,
          name: r.url.substring(r.url.lastIndexOf('/') + 1),
          base64: r.url,
          existing: true,
        }));
        this.renderThumbnails();
      }

      // Check if user is of role Institucion
      const user = AuthService.getCurrentUser();
      const isInstitucion =
        user && user.roles && user.roles.some((r) => r.nombre === 'Institucion');
      if (isInstitucion) {
        this.disableFormFields();
        // If state is 'En Proceso' (4), show confirm button
        if (inc.estado_id === 4) {
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
    } catch (e) {
      console.error(e);
      ToastService.error('Error al cargar la incidencia para edición.');
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
      this.querySelector('.text-muted.small.mt-1\\.5') ||
      this.querySelector('span.text-muted.small.mt-1\\.5');
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
        estado_id: 5, // Resuelto
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

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      ToastService.error('Por favor complete los campos obligatorios del formulario.');
      return;
    }

    const id = this.incidenciaIdInput.value;

    // Validate that we have coordinates and detailed address
    if (!this.coords) {
      ToastService.error('Debe marcar la ubicación en el mapa.');
      return;
    }

    let direccionId = this.selectedDireccionId;

    if (!direccionId) {
      const finalTerritorioId =
        this.dirNivel3Select.value || this.dirNivel2Select.value || this.dirNivel1Select.value;
      if (!finalTerritorioId) {
        ToastService.error(
          'Debe seleccionar el territorio geográfico correspondiente (Provincia/Cantón/Parroquia).'
        );
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
          precision_gps: this.dirPrecisionGpsInput?.value
            ? parseFloat(this.dirPrecisionGpsInput.value)
            : null,
          activo: true,
        };

        if (id) {
          // If editing, update or keep address
          const incData = await IncidenciaService.getById(id);
          direccionId = incData.direccion_id;
          await UbicacionesService.updateDireccion(direccionId, dirPayload);
        } else {
          const dirRes = await UbicacionesService.createDireccion(dirPayload);
          direccionId = (dirRes.data || dirRes).id;
        }
      } catch (err) {
        console.error(err);
        ToastService.error('Error al guardar la dirección.');
        this.btnSubmit.disabled = false;
        this.querySelector('#loadingSpinner').classList.add('d-none');
        return;
      }
    } else {
      this.limpiarErrores();
      this.btnSubmit.disabled = true;
      this.querySelector('#loadingSpinner').classList.remove('d-none');
    }

    try {
      // 2. Guardar incidencia
      const incPayload = {
        incidencia_descripcion: this.descripcionInput.value,
        direccion_id: direccionId,
        tipo_incidencia_id: parseInt(this.tipoSelect.value),
        sub_tipo_incidencia_id: parseInt(this.subTipoSelect.value),
        cantidad_afectados_incidencia: parseInt(this.cantidadAfectadosInput.value) || 0,
        institucion_id: this.institucionSelect.value
          ? parseInt(this.institucionSelect.value)
          : null,
        estado_id: parseInt(this.estadoSelect.value) || 2,
        version: parseInt(this.versionInput.value) || 1,
        recursos: this.recursosFiles.filter((f) => !f.id).map((f) => f.base64),
      };

      if (id) {
        await IncidenciaService.update(id, incPayload);
        ToastService.success('Incidencia actualizada con éxito.');
      } else {
        await IncidenciaService.create(incPayload);
        ToastService.success('Incidencia registrada con éxito.');
      }

      setTimeout(() => {
        window.location.hash = '#/incidencias';
      }, 1500);
    } catch (err) {
      console.error(err);
      ToastService.error(err.message || 'Error al procesar la incidencia.');
      this.btnSubmit.disabled = false;
      this.querySelector('#loadingSpinner').classList.add('d-none');
    }
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
      if (file.size > 5 * 1024 * 1024) {
        ToastService.warning('La imagen no debe superar el límite de 5 MB.');
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

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          base64: reader.result,
          compressed: true, // Mock compression flag (representing .webp automatic client compression)
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

  limpiarErrores() {
    const errorAlert = this.querySelector('#formErrorAlert');
    if (errorAlert) errorAlert.classList.add('d-none');
  }
}

customElements.define('app-incidencia-form', IncidenciaFormComponent);
