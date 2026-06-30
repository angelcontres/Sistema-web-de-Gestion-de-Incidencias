import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { UIHelper } from '../../../../shared/utils/ui-helper.js';
import { MAP_CONFIG, COUNTRY_LEVELS } from '../../../../shared/constants.js';

export class DireccionFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/direcciones/direccion-form.component.html');
    this.modalMap = null;
    this.modalMarker = null;
    this.tempCoords = null;
    this.direccionModalObj = null;
    this.paisesList = [];
    this.pendingTerritory = null;
  }

  async onInit() {
    const modalEl = this.querySelector('#direccionModal');
    if (!modalEl) return;

    const direccionForm = modalEl.querySelector('#direccionForm');
    const dirPaisSelect = modalEl.querySelector('#dirPaisSelect');
    const dirNivel1Select = modalEl.querySelector('#dirNivel1Select');
    const dirNivel2Select = modalEl.querySelector('#dirNivel2Select');

    document.body.appendChild(modalEl);
    this.direccionModalObj = new bootstrap.Modal(modalEl);
    modalEl.addEventListener('shown.bs.modal', () => this.initModalMap());

    // Setup Event Listeners
    if (direccionForm) {
      direccionForm.addEventListener('submit', (e) => this.guardarDireccion(e));
    }

    const resolveRadios = modalEl.querySelectorAll('input[name="territoryResolveOption"]');
    resolveRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (!this.pendingTerritory) return;
        const selectN3 = document.querySelector('#dirNivel3Select');
        if (!selectN3) return;

        if (e.target.value === 'fallback') {
          selectN3.value = this.pendingTerritory.fallbackId || '';
          selectN3.disabled = true;
        } else if (e.target.value === 'existing') {
          selectN3.disabled = false;
          selectN3.focus();
        } else if (e.target.value === 'register') {
          selectN3.value = '';
          selectN3.disabled = true;
        }
        
        this.actualizarFeedbackResolver();
      });
    });

    if (dirNivel3Select) {
      dirNivel3Select.addEventListener('change', () => {
        this.actualizarFeedbackResolver();
      });
    }

    // Cascading dropdowns (Modal Form)
    if (dirPaisSelect) {
      dirPaisSelect.addEventListener('change', (e) => {
        this.actualizarEtiquetasNiveles(e.target.value);
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

    if (dirNivel1Select) {
      dirNivel1Select.addEventListener('change', (e) => {
        const parentId = e.target.value;
        const paisId = document.querySelector('#dirPaisSelect').value;
        this.cargarDireccionDropdownNivel2(paisId, parentId);
        this.ocultarCampo('#colDirNivel3');
      });
    }

    if (dirNivel2Select) {
      dirNivel2Select.addEventListener('change', (e) => {
        const parentId = e.target.value;
        const paisId = document.querySelector('#dirPaisSelect').value;
        this.cargarDireccionDropdownNivel3(paisId, parentId);
      });
    }
  }

  disconnectedCallback() {
    const modalEl = document.querySelector('#direccionModal');
    if (modalEl) {
      modalEl.remove();
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
    const select = document.querySelector('#dirPaisSelect');
    if (!select) return;
    
    const activePaises = this.paisesList.filter(p => p.activo);
    select.innerHTML = '<option value="">-- Seleccione --</option>' + 
      activePaises.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  }

  async abrir(direccion = null) {
    await this.cargarPaises();

    const form = document.querySelector('#direccionForm');
    const errorAlert = document.querySelector('#direccionModalErrorAlert');
    const gpsInfo = document.querySelector('#gpsLocationInfo');
    
    if (form) {
      form.classList.remove('was-validated');
      form.reset();
    }
    if (errorAlert) {
      errorAlert.classList.add('d-none');
    }
    if (gpsInfo) {
      gpsInfo.classList.add('d-none');
    }

    const missingAlert = document.querySelector('#missingTerritoryAlert');
    if (missingAlert) {
      missingAlert.classList.add('d-none');
    }
    const resolverCard = document.querySelector('#missingTerritoryResolver');
    if (resolverCard) {
      resolverCard.classList.add('d-none');
    }
    this.pendingTerritory = null;

    document.querySelector('#direccionId').value = '';
    document.querySelector('#direccionLatitud').value = '';
    document.querySelector('#direccionLongitud').value = '';
    this.tempCoords = null;

    if (this.modalMarker && this.modalMap) {
      this.modalMap.removeLayer(this.modalMarker);
      this.modalMarker = null;
    }

    // Reset dropdowns
    document.querySelector('#dirNivel1Select').innerHTML = '<option value="">-- Seleccione País primero --</option>';
    document.querySelector('#dirNivel1Select').disabled = true;
    document.querySelector('#dirNivel2Select').innerHTML = '<option value="">-- Seleccione Nivel 1 primero --</option>';
    document.querySelector('#dirNivel2Select').disabled = true;
    document.querySelector('#dirNivel3Select').innerHTML = '<option value="">-- Seleccione Nivel 2 primero --</option>';
    document.querySelector('#dirNivel3Select').disabled = true;

    this.ocultarCampo('#colDirNivel1');
    this.ocultarCampo('#colDirNivel2');
    this.ocultarCampo('#colDirNivel3');

    if (direccion) {
      document.querySelector('#direccionModalLabel').textContent = 'Editar Dirección';
      document.querySelector('#direccionId').value = direccion.id;
      document.querySelector('#direccionDetalle').value = direccion.detalle;
      document.querySelector('#direccionReferencia').value = direccion.referencia || '';
      document.querySelector('#direccionCodigoPostal').value = direccion.codigo_postal || '';
      document.querySelector('#direccionActivo').checked = !!direccion.activo;

      if (direccion.latitud && direccion.longitud) {
        document.querySelector('#direccionLatitud').value = direccion.latitud;
        document.querySelector('#direccionLongitud').value = direccion.longitud;
        this.tempCoords = { lat: direccion.latitud, lng: direccion.longitud };
      }

      const paisId = direccion.territorio?.pais_id;
      document.querySelector('#dirPaisSelect').value = paisId;
      document.querySelector('#dirPaisSelect').disabled = false; // Admin editing

      this.actualizarEtiquetasNiveles(paisId);

      // Await cascading load
      await this.cargarDireccionDropdownNivel1(paisId, direccion.territorio);
    } else {
      document.querySelector('#direccionModalLabel').textContent = 'Nueva Dirección';
      
      // Pre-fill country if operator
      const user = AuthService.getCurrentUser();
      if (user && user.pais_id) {
        document.querySelector('#dirPaisSelect').value = user.pais_id;
        document.querySelector('#dirPaisSelect').disabled = true;
        this.actualizarEtiquetasNiveles(user.pais_id);
        await this.cargarDireccionDropdownNivel1(user.pais_id);
      } else {
        document.querySelector('#dirPaisSelect').disabled = false;
        this.actualizarEtiquetasNiveles('');
      }
    }

    this.direccionModalObj.show();
  }

  initModalMap() {
    const modalMapDiv = document.querySelector('#modalMap');
    if (!modalMapDiv) return;

    if (this.modalMap) {
      this.modalMap.invalidateSize();
      return;
    }

    this.modalMap = L.map(modalMapDiv).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.modalMap);

    this.modalMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.establecerMarcadorModal(lat, lng, true);
    });

    if (this.tempCoords) {
      this.establecerMarcadorModal(this.tempCoords.lat, this.tempCoords.lng, false);
      this.modalMap.setView([this.tempCoords.lat, this.tempCoords.lng], 14);
    } else {
      this.centrarModalMapaSegunPais();
    }
  }

  establecerMarcadorModal(lat, lng, isManualClick = false) {
    if (!this.modalMap) return;

    const latVal = parseFloat(lat).toFixed(6);
    const lngVal = parseFloat(lng).toFixed(6);

    document.querySelector('#direccionLatitud').value = latVal;
    document.querySelector('#direccionLongitud').value = lngVal;
    this.tempCoords = { lat: parseFloat(latVal), lng: parseFloat(lngVal) };

    if (this.modalMarker) {
      this.modalMarker.setLatLng([lat, lng]);
    } else {
      this.modalMarker = L.marker([lat, lng], { draggable: true }).addTo(this.modalMap);
      this.modalMarker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        this.establecerMarcadorModal(position.lat, position.lng, true);
      });
    }

    if (isManualClick) {
      this.autofillUbicacionDesdeCoords(parseFloat(latVal), parseFloat(lngVal));
    }
  }

  centrarModalMapaSegunPais() {
    const selectPais = document.querySelector('#dirPaisSelect');
    const paisId = selectPais ? selectPais.value : '';
    if (!paisId || !this.modalMap) return;

    const pais = this.paisesList.find(p => p.id == paisId);
    if (!pais) return;

    const config = MAP_CONFIG.COUNTRY_CENTERS[pais.codigo_iso];
    const centro = config ? config.center : MAP_CONFIG.DEFAULT_CENTER;
    this.modalMap.setView(centro, 6);
  }

  async cargarDireccionDropdownNivel1(paisId, selectedTerritorio = null) {
    const pais = this.paisesList.find(p => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    const s1 = document.querySelector('#dirNivel1Select');
    const s2 = document.querySelector('#dirNivel2Select');
    const s3 = document.querySelector('#dirNivel3Select');

    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;
    s2.innerHTML = `<option value="">-- Seleccione ${config.nivel1} primero --</option>`;
    s2.disabled = true;
    s3.innerHTML = `<option value="">-- Seleccione ${config.nivel2} primero --</option>`;
    s3.disabled = true;

    if (!paisId) {
      s1.innerHTML = '<option value="">-- Seleccione País primero --</option>';
      this.ocultarCampo('#colDirNivel1');
      this.ocultarCampo('#colDirNivel2');
      this.ocultarCampo('#colDirNivel3');
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: null });
      if (list.length > 0) {
        s1.innerHTML = `<option value="">-- Selecciona ${config.nivel1} --</option>` + 
          list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
        s1.disabled = false;
        this.mostrarCampo('#colDirNivel1');
      } else {
        s1.innerHTML = `<option value="">-- No hay ${config.nivel1} registrados --</option>`;
        this.ocultarCampo('#colDirNivel1');
        this.ocultarCampo('#colDirNivel2');
        this.ocultarCampo('#colDirNivel3');
      }

      // Handle editing pre-selection
      if (selectedTerritorio) {
        let n1Id = null;
        let n2Id = null;
        let n3Id = null;

        if (selectedTerritorio.parent && selectedTerritorio.parent.parent) {
          n1Id = selectedTerritorio.parent.parent.id;
          n2Id = selectedTerritorio.parent.id;
          n3Id = selectedTerritorio.id;
        } else if (selectedTerritorio.parent) {
          n1Id = selectedTerritorio.parent.id;
          n2Id = selectedTerritorio.id;
        } else {
          n1Id = selectedTerritorio.id;
        }

        s1.value = n1Id;
        if (n2Id) {
          await this.cargarDireccionDropdownNivel2(paisId, n1Id, n2Id, n3Id);
        }
      }
    } catch (e) {
      s1.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel2(paisId, parentId, selectVal = null, selectValNivel3 = null) {
    const pais = this.paisesList.find(p => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    const s2 = document.querySelector('#dirNivel2Select');
    const s3 = document.querySelector('#dirNivel3Select');

    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;
    s3.innerHTML = `<option value="">-- Seleccione ${config.nivel2} primero --</option>`;
    s3.disabled = true;

    if (!parentId) {
      s2.innerHTML = `<option value="">-- Seleccione ${config.nivel1} primero --</option>`;
      this.ocultarCampo('#colDirNivel2');
      this.ocultarCampo('#colDirNivel3');
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      if (list.length > 0) {
        s2.innerHTML = `<option value="">-- Selecciona ${config.nivel2} --</option>` + 
          list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
        s2.disabled = false;
        this.mostrarCampo('#colDirNivel2');
      } else {
        s2.innerHTML = `<option value="">-- No hay ${config.nivel2} registrados --</option>`;
        this.ocultarCampo('#colDirNivel2');
        this.ocultarCampo('#colDirNivel3');
      }

      if (selectVal) {
        s2.value = selectVal;
        if (selectValNivel3) {
          await this.cargarDireccionDropdownNivel3(paisId, selectVal, selectValNivel3);
        }
      }
    } catch (e) {
      s2.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel3(paisId, parentId, selectVal = null) {
    const pais = this.paisesList.find(p => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    const s3 = document.querySelector('#dirNivel3Select');
    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    if (!parentId) {
      s3.innerHTML = `<option value="">-- Seleccione ${config.nivel2} primero --</option>`;
      this.ocultarCampo('#colDirNivel3');
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      if (list.length > 0) {
        s3.innerHTML = `<option value="">-- Selecciona ${config.nivel3} --</option>` + 
          list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
        s3.disabled = false;
        this.mostrarCampo('#colDirNivel3');
      } else {
        s3.innerHTML = `<option value="">-- No hay ${config.nivel3} registrados --</option>`;
        this.ocultarCampo('#colDirNivel3');
      }

      if (selectVal) {
        s3.value = selectVal;
      }
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
      errorMessage.textContent = 'Debe seleccionar al menos un nivel geográfico para la dirección.';
      return;
    }

    const id = document.querySelector('#direccionId').value;
    const latVal = document.querySelector('#direccionLatitud').value;
    const lngVal = document.querySelector('#direccionLongitud').value;

    const resolveRadioRegister = document.querySelector('#resolveOptRegister');
    let finalTerritorioId = selectNivel3.value || selectNivel2.value || selectNivel1.value;

    // Double-submit protection
    const btnSubmit = form.querySelector('button[type="submit"]');
    let originalText = '';
    if (btnSubmit) {
      originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Guardando...';
    }

    try {
      // Si se eligió registrar una nueva parroquia automáticamente al guardar la dirección
      if (resolveRadioRegister && resolveRadioRegister.checked && this.pendingTerritory) {
        if (btnSubmit) {
          btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Registrando Parroquia...';
        }

        const payloadTerritorio = {
          pais_id: this.pendingTerritory.pais_id,
          parent_id: this.pendingTerritory.parent_id,
          nombre: this.pendingTerritory.nombre,
          tipo: this.pendingTerritory.tipo,
          activo: true
        };

        const resTerritorio = await UbicacionesService.createTerritorio(payloadTerritorio);
        const newTerritory = resTerritorio.data || resTerritorio;
        
        finalTerritorioId = newTerritory.id;

        // Despachar evento para notificar al explorador de territorios
        this.dispatchEvent(new CustomEvent('territorios-updated', {
          bubbles: true,
          composed: true
        }));
      }

      if (!finalTerritorioId) {
        // Si no hay territorio ID y se eligió seleccionar otra existente, mostrar error
        errorAlert.classList.remove('d-none');
        errorMessage.textContent = 'Debe seleccionar la parroquia correspondiente de la lista.';
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalText;
        }
        return;
      }

      const payload = {
        territorio_id: parseInt(finalTerritorioId),
        detalle: document.querySelector('#direccionDetalle').value,
        referencia: document.querySelector('#direccionReferencia').value || null,
        codigo_postal: document.querySelector('#direccionCodigoPostal').value || null,
        latitud: latVal ? parseFloat(latVal) : null,
        longitud: lngVal ? parseFloat(lngVal) : null,
        activo: document.querySelector('#direccionActivo').checked,
      };

      if (id) {
        await UbicacionesService.updateDireccion(id, payload);
      } else {
        await UbicacionesService.createDireccion(payload);
      }

      this.direccionModalObj.hide();
      
      // Dispatch custom event to notify parent component to reload the list
      this.dispatchEvent(new CustomEvent('direccion-saved', {
        bubbles: true,
        composed: true,
        detail: { isEdit: !!id }
      }));
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

  async autofillUbicacionDesdeCoords(lat, lng) {
    const statusContainer = document.querySelector('#autofillStatus');
    const statusText = document.querySelector('#autofillStatusText');
    
    if (statusContainer && statusText) {
      statusContainer.classList.remove('d-none');
      statusText.textContent = 'Autorellenando ubicación...';
    }

    try {
      const data = await UbicacionesService.reverseGeocode(lat, lng);
      const address = data.address || {};
      let missingTerritoryData = null;

      // Mostrar la ubicación completa detectada por GPS
      const gpsInfo = document.querySelector('#gpsLocationInfo');
      const gpsText = document.querySelector('#gpsLocationText');
      if (gpsInfo && gpsText) {
        const addressParts = [
          address.road || address.pedestrian,
          address.suburb || address.neighbourhood || address.parish || address.quarter,
          address.city || address.town || address.village,
          address.state,
          address.country
        ].filter(Boolean);
        
        gpsText.textContent = addressParts.join(', ') || data.display_name || 'Ubicación desconocida';
        gpsInfo.classList.remove('d-none');
      }

      // Reset de alerta de territorio faltante
      const missingAlert = document.querySelector('#missingTerritoryAlert');
      const missingMsg = document.querySelector('#missingTerritoryMessage');
      const btnRegisterMissing = document.querySelector('#btnRegistrarTerritorioFaltante');
      
      if (missingAlert) missingAlert.classList.add('d-none');
      if (btnRegisterMissing) btnRegisterMissing.classList.add('d-none');
      this.pendingTerritory = null;

      // 1. Detalle de dirección (Calle + número)
      const street = address.road || address.pedestrian || address.suburb || address.neighbourhood || '';
      const houseNumber = address.house_number || '';
      const detalleText = [street, houseNumber].filter(Boolean).join(' ') || data.display_name || '';
      
      const inputDetalle = document.querySelector('#direccionDetalle');
      if (inputDetalle && detalleText) {
        inputDetalle.value = detalleText;
      }

      // 2. Código Postal
      const inputCP = document.querySelector('#direccionCodigoPostal');
      if (inputCP) {
        inputCP.value = address.postcode || '';
      }

      // 3. País y Niveles Geográficos (Búsqueda e integración)
      const countryCode = (address.country_code || '').toUpperCase();
      let currentPaisId = null;

      const selectPais = document.querySelector('#dirPaisSelect');
      if (selectPais && selectPais.disabled) {
        // Si el selector de país está deshabilitado (ej. es operador), forzamos su país asignado
        currentPaisId = selectPais.value;
      } else if (countryCode && this.paisesList.length > 0) {
        const matchedPais = this.paisesList.find(p => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode);
        if (matchedPais) {
          currentPaisId = matchedPais.id;
          if (selectPais) {
            selectPais.value = currentPaisId;
          }
          this.actualizarEtiquetasNiveles(currentPaisId);
        }
      }

      if (currentPaisId) {
        const paisObj = this.paisesList.find(p => p.id == currentPaisId);
        const iso = paisObj ? (paisObj.codigo_iso || '').toUpperCase() : '';
        const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

        let matchedN1Id = null;
        let matchedN2Id = null;
        let matchedN3Id = null;
        missingTerritoryData = null;

        // A. Cargar y Buscar Nivel 1
        if (statusText) statusText.textContent = `Buscando ${config.nivel1}...`;
        await this.cargarDireccionDropdownNivel1(currentPaisId);
        
        const s1 = document.querySelector('#dirNivel1Select');
        const possibleNivel1Names = [address.state, address.region, address.province, address.state_district].filter(Boolean);
        const n1NameFoundInGps = possibleNivel1Names[0] || null;

        if (s1 && !s1.disabled && possibleNivel1Names.length > 0) {
          const options = Array.from(s1.options);
          for (const name of possibleNivel1Names) {
            const cleanName = this.normalizeText(name);
            const foundOpt = options.find(opt => {
              const optText = this.normalizeText(opt.text);
              return optText.includes(cleanName) || cleanName.includes(optText);
            });
            if (foundOpt && foundOpt.value) {
              s1.value = foundOpt.value;
              matchedN1Id = foundOpt.value;
              break;
            }
          }
        }

        if (n1NameFoundInGps && !matchedN1Id) {
          // Nivel 1 faltante en BD
          missingTerritoryData = {
            nivel: 1,
            nombre: this.capitalizeWords(n1NameFoundInGps),
            tipo: config.nivel1,
            parent_id: null,
            pais_id: parseInt(currentPaisId)
          };
        }

        // B. Cargar y Buscar Nivel 2
        if (matchedN1Id) {
          if (statusText) statusText.textContent = `Buscando ${config.nivel2}...`;
          await this.cargarDireccionDropdownNivel2(currentPaisId, matchedN1Id);
          
          const s2 = document.querySelector('#dirNivel2Select');
          const possibleNivel2Names = [address.county, address.city, address.town, address.municipality, address.city_district].filter(Boolean);
          const n2NameFoundInGps = possibleNivel2Names[0] || null;

          if (s2 && !s2.disabled && possibleNivel2Names.length > 0) {
            const options = Array.from(s2.options);
            for (const name of possibleNivel2Names) {
              const cleanName = this.normalizeText(name);
              const foundOpt = options.find(opt => {
                const optText = this.normalizeText(opt.text);
                return optText.includes(cleanName) || cleanName.includes(optText);
              });
              if (foundOpt && foundOpt.value) {
                s2.value = foundOpt.value;
                matchedN2Id = foundOpt.value;
                break;
              }
            }
          }

          if (n2NameFoundInGps && !matchedN2Id) {
            // Nivel 2 faltante en BD
            missingTerritoryData = {
              nivel: 2,
              nombre: this.capitalizeWords(n2NameFoundInGps),
              tipo: config.nivel2,
              parent_id: parseInt(matchedN1Id),
              pais_id: parseInt(currentPaisId)
            };
          }
        }

        // C. Cargar y Buscar Nivel 3
        if (matchedN2Id) {
          if (statusText) statusText.textContent = `Buscando ${config.nivel3}...`;
          await this.cargarDireccionDropdownNivel3(currentPaisId, matchedN2Id);
          
          const s3 = document.querySelector('#dirNivel3Select');
          const possibleNivel3Names = [
            address.parish,
            address.suburb,
            address.neighbourhood,
            address.quarter,
            address.village,
            address.town,
            address.city_district,
            address.hamlet
          ].filter(Boolean);
          const n3NameFoundInGps = possibleNivel3Names[0] || null;

          if (s3 && !s3.disabled && possibleNivel3Names.length > 0) {
            const options = Array.from(s3.options);
            for (const name of possibleNivel3Names) {
              const cleanName = this.normalizeText(name);
              const foundOpt = options.find(opt => {
                const optText = this.normalizeText(opt.text);
                return optText.includes(cleanName) || cleanName.includes(optText);
              });
              if (foundOpt && foundOpt.value) {
                s3.value = foundOpt.value;
                matchedN3Id = foundOpt.value;
                break;
              }
            }
          }

          if (n3NameFoundInGps && !matchedN3Id) {
            // Nivel 3 faltante en BD
            missingTerritoryData = {
              nivel: 3,
              nombre: this.capitalizeWords(n3NameFoundInGps),
              tipo: config.nivel3,
              parent_id: parseInt(matchedN2Id),
              pais_id: parseInt(currentPaisId)
            };

            // Intentar buscar una parroquia cabecera (que tenga nombre similar al Cantón)
            const cantonSelect = document.querySelector('#dirNivel2Select');
            const cantonName = cantonSelect && cantonSelect.selectedIndex >= 0 ? cantonSelect.options[cantonSelect.selectedIndex].text : '';
            const cleanCantonName = this.normalizeText(cantonName);
            
            if (s3 && cleanCantonName) {
              const options = Array.from(s3.options);
              const cabeceraOpt = options.find(opt => {
                const optText = this.normalizeText(opt.text);
                return optText.includes(cleanCantonName) || cleanCantonName.includes(optText);
              });
              
              if (cabeceraOpt && cabeceraOpt.value) {
                s3.value = cabeceraOpt.value;
                matchedN3Id = cabeceraOpt.value;
                missingTerritoryData.fallbackNombre = cabeceraOpt.text.replace(/^\[.*?\]\s*/, ''); // Limpiar tipo si existe
                missingTerritoryData.fallbackId = cabeceraOpt.value;
              }
            }
          }
        }
      }

      // Mostrar resolvedor si hay algún territorio faltante detectado
      const resolverCard = document.querySelector('#missingTerritoryResolver');
        if (missingTerritoryData && resolverCard) {
          this.pendingTerritory = missingTerritoryData;
          
          const nameSpan = document.querySelector('#missingTerritoryNameSpan');
          if (nameSpan) nameSpan.textContent = missingTerritoryData.nombre;
          
          const newParishSpan = document.querySelector('#newParishNameSpan');
          if (newParishSpan) newParishSpan.textContent = missingTerritoryData.nombre;
          
          const fallbackContainer = document.querySelector('#resolveOptFallbackContainer');
          const registerRadio = document.querySelector('#resolveOptRegister');
          const fallbackRadio = document.querySelector('#resolveOptFallback');
          const existingRadio = document.querySelector('#resolveOptExisting');
          const selectN3 = document.querySelector('#dirNivel3Select');
          const isAdmin = AuthService.isAdmin();
 
          // 1. Configurar opción de Cabecera/Fallback
          if (missingTerritoryData.fallbackId && fallbackContainer) {
            fallbackContainer.classList.remove('d-none');
            const fallbackSpan = document.querySelector('#fallbackParishNameSpan');
            if (fallbackSpan) fallbackSpan.textContent = missingTerritoryData.fallbackNombre;
            fallbackRadio.checked = true;
            if (selectN3) {
              selectN3.value = missingTerritoryData.fallbackId;
              selectN3.disabled = true; // Deshabilitado por defecto al usar fallback
            }
          } else if (fallbackContainer) {
            fallbackContainer.classList.add('d-none');
            if (existingRadio) {
              existingRadio.checked = true;
            }
            if (selectN3) {
              selectN3.disabled = false;
              selectN3.value = '';
            }
          }

          // 2. Configurar opción de Registro (Solo Admin)
          const labelRegister = document.querySelector('label[for="resolveOptRegister"]');
          if (isAdmin) {
            registerRadio.disabled = false;
            if (labelRegister) {
              labelRegister.innerHTML = `<strong>Crear y usar nueva:</strong> Registrar "${missingTerritoryData.nombre}" automáticamente al guardar`;
            }
          } else {
            registerRadio.disabled = true;
            if (labelRegister) {
              labelRegister.innerHTML = `<strong>Crear y usar nueva:</strong> <span class="text-muted">(Requiere rol de Administrador para registrar)</span>`;
            }
            // Si no es admin y hay fallback, forzar fallback
            if (missingTerritoryData.fallbackId && fallbackRadio) {
              fallbackRadio.checked = true;
              if (selectN3) {
                selectN3.value = missingTerritoryData.fallbackId;
                selectN3.disabled = true;
              }
            }
          }

          resolverCard.classList.remove('d-none');
          this.actualizarFeedbackResolver();
        } else if (resolverCard) {
          resolverCard.classList.add('d-none');
        }
    } catch (error) {
      console.warn('Error al autorellenar la ubicación:', error);
      const errorAlert = document.querySelector('#direccionModalErrorAlert');
      const errorMessage = document.querySelector('#direccionModalErrorMessage');
      if (errorAlert && errorMessage) {
        errorAlert.classList.remove('d-none');
        errorMessage.textContent = `Error de Autorelleno: ${error.message} (Ver consola para más detalles)`;
      }
    } finally {
      if (statusContainer) {
        statusContainer.classList.add('d-none');
      }
    }
  }

  actualizarFeedbackResolver() {
    if (!this.pendingTerritory) return;

    const resolverCard = document.querySelector('#missingTerritoryResolver');
    if (!resolverCard) return;

    const cardDiv = resolverCard.querySelector('.card');
    const icon = resolverCard.querySelector('.bi-exclamation-triangle-fill, .bi-info-circle-fill, .bi-check-circle-fill');
    const titleSpan = resolverCard.querySelector('.fw-bold');
    const descSpan = resolverCard.querySelector('.text-secondary');
    const selectN3 = document.querySelector('#dirNivel3Select');
    const activeOption = document.querySelector('input[name="territoryResolveOption"]:checked')?.value;

    if (!cardDiv || !titleSpan) return;

    if (activeOption === 'existing') {
      if (selectN3 && selectN3.value) {
        // Estado: Resuelto con otra existente
        const selectedText = selectN3.options[selectN3.selectedIndex].text.replace(/^\[.*?\]\s*/, '');
        cardDiv.className = 'card border-success border-opacity-25 bg-success bg-opacity-10 p-3 rounded-3 shadow-none animate-fade-in';
        if (icon) icon.className = 'bi bi-check-circle-fill text-success fs-5';
        titleSpan.textContent = 'Parroquia Seleccionada';
        titleSpan.className = 'fw-bold text-success d-block';
        if (descSpan) {
          descSpan.innerHTML = `Se asociará esta dirección a la parroquia existente <strong>"${selectedText}"</strong>.`;
        }
      } else {
        // Estado: Pendiente de seleccionar existente
        cardDiv.className = 'card border-warning border-opacity-25 bg-warning bg-opacity-10 p-3 rounded-3 shadow-none animate-fade-in';
        if (icon) icon.className = 'bi bi-exclamation-triangle-fill text-warning fs-5';
        titleSpan.textContent = 'Selección Requerida';
        titleSpan.className = 'fw-bold text-dark d-block';
        if (descSpan) {
          descSpan.innerHTML = 'Por favor, selecciona una parroquia de la lista desplegable.';
        }
      }
    } else if (activeOption === 'fallback') {
      // Estado: Resuelto por Cabecera
      cardDiv.className = 'card border-info border-opacity-25 bg-info bg-opacity-10 p-3 rounded-3 shadow-none animate-fade-in';
      if (icon) icon.className = 'bi bi-info-circle-fill text-info fs-5';
      titleSpan.textContent = 'Ubicación Sugerida';
      titleSpan.className = 'fw-bold text-info d-block';
      if (descSpan) {
        descSpan.innerHTML = `La parroquia clickeada no está registrada. Se usará la cabecera cantonal <strong>"${this.pendingTerritory.fallbackNombre}"</strong>.`;
      }
    } else {
      // Estado: Advertencia / Pendiente de registro
      cardDiv.className = 'card border-warning border-opacity-25 bg-warning bg-opacity-10 p-3 rounded-3 shadow-none animate-fade-in';
      if (icon) icon.className = 'bi bi-exclamation-triangle-fill text-warning fs-5';
      titleSpan.textContent = 'Parroquia Faltante Detectada';
      titleSpan.className = 'fw-bold text-dark d-block';
      if (descSpan) {
        descSpan.innerHTML = `La parroquia <strong>"${this.pendingTerritory.nombre}"</strong> no está registrada. Se creará automáticamente al guardar.`;
      }
    }
  }

  normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  mostrarCampo(selector) {
    const el = document.querySelector(selector);
    if (el && el.classList.contains('d-none')) {
      el.classList.remove('d-none');
      // Force reflow
      el.offsetHeight;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }

  ocultarCampo(selector) {
    const el = document.querySelector(selector);
    if (el && !el.classList.contains('d-none')) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (el.style.opacity === '0') {
          el.classList.add('d-none');
        }
      }, 300);
    }
  }

  async registrarTerritorioFaltante() {
    if (!this.pendingTerritory) return;
    
    const btn = document.querySelector('#btnRegistrarTerritorioFaltante');
    let originalText = '';
    if (btn) {
      originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Registrando...';
    }

    try {
      const payload = {
        pais_id: this.pendingTerritory.pais_id,
        parent_id: this.pendingTerritory.parent_id,
        nombre: this.pendingTerritory.nombre,
        tipo: this.pendingTerritory.tipo,
        activo: true
      };

      const res = await UbicacionesService.createTerritorio(payload);
      const newTerritory = res.data || res;

      UIHelper.mostrarAlerta(this, 'success', `${this.pendingTerritory.tipo} "${this.pendingTerritory.nombre}" registrada con éxito.`);

      // Ocultar alerta de territorio faltante
      const missingAlert = document.querySelector('#missingTerritoryAlert');
      if (missingAlert) missingAlert.classList.add('d-none');

      const paisId = this.pendingTerritory.pais_id;
      const level = this.pendingTerritory.nivel;
      
      if (level === 1) {
        await this.cargarDireccionDropdownNivel1(paisId);
        document.querySelector('#dirNivel1Select').value = newTerritory.id;
        document.querySelector('#dirNivel1Select').dispatchEvent(new Event('change'));
      } else if (level === 2) {
        const parentId = this.pendingTerritory.parent_id;
        await this.cargarDireccionDropdownNivel2(paisId, parentId);
        document.querySelector('#dirNivel2Select').value = newTerritory.id;
        document.querySelector('#dirNivel2Select').dispatchEvent(new Event('change'));
      } else if (level === 3) {
        const parentId = this.pendingTerritory.parent_id;
        await this.cargarDireccionDropdownNivel3(paisId, parentId);
        document.querySelector('#dirNivel3Select').value = newTerritory.id;
      }

      this.pendingTerritory = null;

      // Despachar evento para notificar al explorador de territorios
      this.dispatchEvent(new CustomEvent('territorios-updated', {
        bubbles: true,
        composed: true
      }));

    } catch (e) {
      console.error('Error al registrar territorio faltante:', e);
      UIHelper.mostrarAlerta(this, 'error', `No se pudo registrar: ${e.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  capitalizeWords(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  actualizarEtiquetasNiveles(paisId) {
    const pais = this.paisesList.find(p => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    const lblN1 = document.querySelector('#lblDirNivel1');
    const lblN2 = document.querySelector('#lblDirNivel2');
    const lblN3 = document.querySelector('#lblDirNivel3');

    if (lblN1) lblN1.textContent = config.nivel1;
    if (lblN2) lblN2.textContent = config.nivel2;
    if (lblN3) lblN3.textContent = config.nivel3;

    // Update select placeholders if they are not loaded
    const s1 = document.querySelector('#dirNivel1Select');
    const s2 = document.querySelector('#dirNivel2Select');
    const s3 = document.querySelector('#dirNivel3Select');

    if (s1 && s1.disabled) {
      s1.innerHTML = `<option value="">-- Seleccione País primero --</option>`;
    } else if (s1) {
      s1.options[0].text = `-- Selecciona ${config.nivel1} --`;
    }

    if (s2 && s2.disabled) {
      s2.innerHTML = `<option value="">-- Seleccione ${config.nivel1} primero --</option>`;
    } else if (s2) {
      s2.options[0].text = `-- Selecciona ${config.nivel2} --`;
    }

    if (s3 && s3.disabled) {
      s3.innerHTML = `<option value="">-- Seleccione ${config.nivel2} primero --</option>`;
    } else if (s3) {
      s3.options[0].text = `-- Selecciona ${config.nivel3} --`;
    }
  }
}

customElements.define('app-direccion-form', DireccionFormComponent);
