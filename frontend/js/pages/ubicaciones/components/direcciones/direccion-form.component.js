import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { MAP_CONFIG, COUNTRY_LEVELS } from '../../../../shared/constants.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

export class DireccionFormComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/direcciones/direccion-form.component.html');
    this.modalMap = null;
    this.modalMarker = null;
    this.tempCoords = null;
    this.direccionModalObj = null;
    this.paisesList = [];
    this.pendingGeography = null;
  }

  async onInit() {
    const modalEl = this.querySelector('#direccionModal');
    if (!modalEl) return;

    document.body.appendChild(modalEl);
    this.direccionModalObj = new bootstrap.Modal(modalEl);
    modalEl.addEventListener('shown.bs.modal', () => this.initModalMap());

    this.setupEventListeners(modalEl);
  }

  setupEventListeners(modalEl) {
    const direccionForm = modalEl.querySelector('#direccionForm');
    const dirPaisSelect = modalEl.querySelector('#dirPaisSelect');
    const dirNivel1Select = modalEl.querySelector('#dirNivel1Select');
    const dirNivel2Select = modalEl.querySelector('#dirNivel2Select');
    const dirNivel3Select = modalEl.querySelector('#dirNivel3Select');

    if (direccionForm) {
      direccionForm.addEventListener('submit', (e) => this.guardarDireccion(e));
    }

    const resolveRadios = modalEl.querySelectorAll('input[name="territoryResolveOption"]');
    resolveRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        if (!this.pendingGeography) return;

        const selectPais = document.querySelector('#dirPaisSelect');
        const selectN1 = document.querySelector('#dirNivel1Select');
        const selectN2 = document.querySelector('#dirNivel2Select');
        const selectN3 = document.querySelector('#dirNivel3Select');

        if (e.target.value === 'existing') {
          [selectPais, selectN1, selectN2, selectN3].forEach((sel) => {
            if (sel) {
              sel.disabled = false;
              const newOpt = sel.querySelector('option[value="__new__"]');
              if (newOpt) newOpt.remove();
            }
          });
        } else {
          [selectPais, selectN1, selectN2, selectN3].forEach((sel) => {
            if (sel) sel.disabled = true;
          });
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

    const activePaises = this.paisesList.filter((p) => p.activo);
    select.innerHTML =
      '<option value="">-- Seleccione --</option>' +
      activePaises.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('');
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
    this.pendingGeography = null;

    document.querySelector('#direccionId').value = '';
    document.querySelector('#direccionLatitud').value = '';
    document.querySelector('#direccionLongitud').value = '';
    this.tempCoords = null;

    if (this.modalMarker && this.modalMap) {
      this.modalMap.removeLayer(this.modalMarker);
      this.modalMarker = null;
    }

    // Reset dropdowns
    document.querySelector('#dirNivel1Select').innerHTML =
      '<option value="">-- Seleccione País primero --</option>';
    document.querySelector('#dirNivel1Select').disabled = true;
    document.querySelector('#dirNivel2Select').innerHTML =
      '<option value="">-- Seleccione Nivel 1 primero --</option>';
    document.querySelector('#dirNivel2Select').disabled = true;
    document.querySelector('#dirNivel3Select').innerHTML =
      '<option value="">-- Seleccione Nivel 2 primero --</option>';
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
      if (user?.pais_id) {
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
      maxZoom: 20,
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

    const latVal = Number.parseFloat(lat).toFixed(6);
    const lngVal = Number.parseFloat(lng).toFixed(6);

    document.querySelector('#direccionLatitud').value = latVal;
    document.querySelector('#direccionLongitud').value = lngVal;
    this.tempCoords = { lat: Number.parseFloat(latVal), lng: Number.parseFloat(lngVal) };

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
      this.autofillUbicacionDesdeCoords(Number.parseFloat(latVal), Number.parseFloat(lngVal));
    }
  }

  centrarModalMapaSegunPais() {
    const selectPais = document.querySelector('#dirPaisSelect');
    const paisId = selectPais ? selectPais.value : '';
    if (!paisId || !this.modalMap) return;

    const pais = this.paisesList.find((p) => p.id == paisId);
    if (!pais) return;

    const config = MAP_CONFIG.COUNTRY_CENTERS[pais.codigo_iso];
    const centro = config ? config.center : MAP_CONFIG.DEFAULT_CENTER;
    this.modalMap.setView(centro, 6);
  }

  async cargarDireccionDropdownNivel1(paisId, selectedTerritorio = null) {
    const pais = this.paisesList.find((p) => p.id == paisId);
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
      const res = await UbicacionesService.getTerritorios(1, 1000, null, {
        all: true,
        pais_id: paisId,
        parent_id: null,
      });
      const list = this.extractList(res);
      if (list.length > 0) {
        s1.innerHTML =
          `<option value="">-- Selecciona ${config.nivel1} --</option>` +
          list
            .map((t) => {
              const prefix = t.tipo ? '[' + t.tipo + '] ' : '';
              return `<option value="${t.id}">${prefix}${t.nombre}</option>`;
            })
            .join('');
        s1.disabled = false;
        this.mostrarCampo('#colDirNivel1');
      } else {
        s1.innerHTML = `<option value="">-- No hay ${config.nivel1} registrados --</option>`;
        this.ocultarCampo('#colDirNivel1');
        this.ocultarCampo('#colDirNivel2');
        this.ocultarCampo('#colDirNivel3');
      }

      if (selectedTerritorio) {
        let n1Id = null;
        let n2Id = null;
        let n3Id = null;

        if (selectedTerritorio?.parent?.parent) {
          n1Id = selectedTerritorio.parent.parent.id;
          n2Id = selectedTerritorio.parent.id;
          n3Id = selectedTerritorio.id;
        } else if (selectedTerritorio?.parent) {
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
      ToastService.error(e.message, 'Error al cargar');
      s1.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel2(paisId, parentId, selectVal = null, selectValNivel3 = null) {
    const pais = this.paisesList.find((p) => p.id == paisId);
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
      const res = await UbicacionesService.getTerritorios(1, 1000, null, {
        all: true,
        pais_id: paisId,
        parent_id: parentId,
      });

      const list = this.extractList(res);
      if (list.length > 0) {
        s2.innerHTML =
          `<option value="">-- Selecciona ${config.nivel2} --</option>` +
          list
            .map((t) => {
              const prefix = t.tipo ? '[' + t.tipo + '] ' : '';
              return `<option value="${t.id}">${prefix}${t.nombre}</option>`;
            })
            .join('');
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
      ToastService.error(e.message, 'Error al cargar');
      s2.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async cargarDireccionDropdownNivel3(paisId, parentId, selectVal = null) {
    const pais = this.paisesList.find((p) => p.id == paisId);
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
      const res = await UbicacionesService.getTerritorios(1, 1000, null, {
        all: true,
        pais_id: paisId,
        parent_id: parentId,
      });

      const list = this.extractList(res);
      if (list.length > 0) {
        s3.innerHTML =
          `<option value="">-- Selecciona ${config.nivel3} --</option>` +
          list
            .map((t) => {
              const prefix = t.tipo ? '[' + t.tipo + '] ' : '';
              return `<option value="${t.id}">${prefix}${t.nombre}</option>`;
            })
            .join('');
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
      ToastService.error(e.message, 'Error al cargar');
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
      btnSubmit.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Guardando...';
    }

    try {
      if (resolveRadioRegister?.checked && this.pendingGeography) {
        finalTerritorioId = await this.registrarCadenaTerritoriosPendiente(btnSubmit);
      }

      if (!finalTerritorioId) {
        errorAlert.classList.remove('d-none');
        errorMessage.textContent = 'Debe seleccionar la ubicación correspondiente de la lista.';
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalText;
        }
        return;
      }

      const payload = {
        territorio_id: Number.parseInt(finalTerritorioId),
        detalle: document.querySelector('#direccionDetalle').value,
        referencia: document.querySelector('#direccionReferencia').value || null,
        codigo_postal: document.querySelector('#direccionCodigoPostal').value || null,
        latitud: latVal ? Number.parseFloat(latVal) : null,
        longitud: lngVal ? Number.parseFloat(lngVal) : null,
        activo: document.querySelector('#direccionActivo').checked,
      };

      if (id) {
        await UbicacionesService.updateDireccion(id, payload);
      } else {
        await UbicacionesService.createDireccion(payload);
      }

      this.direccionModalObj.hide();

      this.dispatchEvent(
        new CustomEvent('direccion-saved', {
          bubbles: true,
          composed: true,
          detail: { isEdit: !!id },
        })
      );
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

  limpiarYActualizarUIAutofill(address, data) {
    this.pendingTerritory = null;
    this.ocultarCampo('#missingTerritoryAlert');
    this.ocultarCampo('#missingTerritoryMessage');
    this.ocultarCampo('#btnRegistrarTerritorioFaltante');

    const gpsInfo = document.querySelector('#gpsLocationInfo');
    const gpsText = document.querySelector('#gpsLocationText');
    if (gpsInfo && gpsText) {
      const addressParts = [
        address.road || address.pedestrian,
        address.suburb || address.neighbourhood || address.parish || address.quarter,
        address.city || address.town || address.village,
        address.state,
        address.country,
      ].filter(Boolean);

      gpsText.textContent = addressParts.join(', ') || data.display_name || 'Ubicación desconocida';
      gpsInfo.classList.remove('d-none');
    }

    const inputDetalle = document.querySelector('#direccionDetalle');
    const detalleText = [
      address.road || address.pedestrian || address.suburb || address.neighbourhood || '',
      address.house_number || '',
    ].filter(Boolean).join(' ') || data.display_name || '';

    if (inputDetalle && detalleText) {
      inputDetalle.value = detalleText;
    }

    const inputCP = document.querySelector('#direccionCodigoPostal');
    if (inputCP) {
      inputCP.value = address.postcode || '';
    }
  }

  async aplicarTerritorioDetectado(td, matchedPais, config, address) {
    const selectN1 = document.querySelector('#dirNivel1Select');
    const selectN2 = document.querySelector('#dirNivel2Select');
    const selectN3 = document.querySelector('#dirNivel3Select');

    await this.cargarDireccionDropdownNivel1(matchedPais.id);
    if (!td.provincia_id || !selectN1) return;

    selectN1.value = td.provincia_id;
    this.pendingGeography.nivel1 = { exists: true, id: td.provincia_id, tipo: config.nivel1 };
    this.mostrarCampo('#colDirNivel1');

    await this.cargarDireccionDropdownNivel2(td.provincia_id);
    if (!td.canton_id || !selectN2) return;

    selectN2.value = td.canton_id;
    this.pendingGeography.nivel2 = { exists: true, id: td.canton_id, tipo: config.nivel2 };
    this.mostrarCampo('#colDirNivel2');

    await this.cargarDireccionDropdownNivel3(td.canton_id);
    if (!selectN3) return;

    if (td.parroquia_id) {
      selectN3.value = td.parroquia_id;
      this.pendingGeography.nivel3 = { exists: true, id: td.parroquia_id, tipo: config.nivel3 };
      this.mostrarCampo('#colDirNivel3');
      return;
    }

    const n3Name = [address.parish, address.suburb, address.neighbourhood, address.quarter].find(Boolean) || '';
    const foundN3 = this.findMatchingOptionByText(selectN3, n3Name);
    if (foundN3) {
      selectN3.value = foundN3.value;
      this.pendingGeography.nivel3 = { exists: true, id: foundN3.value, tipo: config.nivel3 };
      this.mostrarCampo('#colDirNivel3');
    }
  }

  verificarNivelesFaltantes() {
    return (
      !this.pendingGeography.pais.exists ||
      Boolean(this.pendingGeography.nivel1.nombre && !this.pendingGeography.nivel1.exists) ||
      Boolean(this.pendingGeography.nivel2.nombre && !this.pendingGeography.nivel2.exists) ||
      Boolean(this.pendingGeography.nivel3.nombre && !this.pendingGeography.nivel3.exists)
    );
  }

  mostrarEstadoAutorelleno(visible, texto = '') {
    const statusContainer = document.querySelector('#autofillStatus');
    const statusText = document.querySelector('#autofillStatusText');
    if (statusContainer) {
      if (visible) {
        statusContainer.classList.remove('d-none');
        if (statusText && texto) statusText.textContent = texto;
      } else {
        statusContainer.classList.add('d-none');
      }
    }
  }

  mostrarErrorAutorelleno(mensaje) {
    const errorAlert = document.querySelector('#direccionModalErrorAlert');
    const errorMessage = document.querySelector('#direccionModalErrorMessage');
    if (errorAlert && errorMessage) {
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = mensaje;
    }
  }

  inicializarPendingGeography(address, matchedPais) {
    const countryCode = (address.country_code || '').toUpperCase();
    const countryName = this.capitalizeWords(address.country || countryCode);
    const iso = matchedPais ? (matchedPais.codigo_iso || '').toUpperCase() : countryCode;
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    this.pendingGeography = {
      pais: {
        nombre: countryName,
        codigo_iso: countryCode,
        exists: Boolean(matchedPais),
        id: matchedPais ? matchedPais.id : null,
        tipo: 'País',
      },
      nivel1: { nombre: '', exists: false, id: null, tipo: config.nivel1 },
      nivel2: { nombre: '', exists: false, id: null, tipo: config.nivel2 },
      nivel3: { nombre: '', exists: false, id: null, tipo: config.nivel3 },
    };

    return config;
  }

  async procesarDeteccionGeografica(data, address, matchedPais, config) {
    if (!matchedPais) return;

    const selectPais = document.querySelector('#dirPaisSelect');
    if (selectPais) selectPais.value = matchedPais.id;
    this.actualizarEtiquetasNiveles(matchedPais.id);

    if (data.territorio_detectado) {
      this.mostrarEstadoAutorelleno(true, 'Cargando jerarquía geográfica...');
      await this.aplicarTerritorioDetectado(data.territorio_detectado, matchedPais, config, address);
    } else {
      const statusText = document.querySelector('#autofillStatusText');
      await this.procesarJerarquiaGeograficaAutofill(address, matchedPais, config, statusText);
    }
  }

  async autofillUbicacionDesdeCoords(lat, lng) {
    this.mostrarEstadoAutorelleno(true, 'Autorellenando ubicación...');

    try {
      const data = await UbicacionesService.reverseGeocode(lat, lng);
      const address = data.address || {};
      this.limpiarYActualizarUIAutofill(address, data);

      const countryCode = (address.country_code || '').toUpperCase();
      const matchedPais = countryCode
        ? this.paisesList.find((p) => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode)
        : null;

      const config = this.inicializarPendingGeography(address, matchedPais);
      await this.procesarDeteccionGeografica(data, address, matchedPais, config);

      this.configurarResolverTerritoriosFaltantes(this.verificarNivelesFaltantes());
    } catch (error) {
      console.warn('Error al autorellenar la ubicación:', error);
      this.mostrarErrorAutorelleno(`Error de Autorelleno: ${error.message} (Ver consola para más detalles)`);
    } finally {
      this.mostrarEstadoAutorelleno(false);
    }
  }

  actualizarFeedbackResolver() {
    if (!this.pendingGeography) return;

    const resolverCard = document.querySelector('#missingTerritoryResolver');
    if (!resolverCard) return;

    const cardDiv = resolverCard.querySelector('.card');
    const icon = resolverCard.querySelector(
      '.bi-exclamation-triangle-fill, .bi-info-circle-fill, .bi-check-circle-fill'
    );
    const titleSpan = resolverCard.querySelector('.fw-bold');
    const descSpan = resolverCard.querySelector('.text-secondary');
    const activeOption = document.querySelector(
      'input[name="territoryResolveOption"]:checked'
    )?.value;

    const selectPais = document.querySelector('#dirPaisSelect');
    const selectN1 = document.querySelector('#dirNivel1Select');
    const selectN2 = document.querySelector('#dirNivel2Select');
    const selectN3 = document.querySelector('#dirNivel3Select');

    if (!cardDiv || !titleSpan) return;

    const selects = { selectPais, selectN1, selectN2, selectN3 };
    const elementos = { cardDiv, icon, titleSpan, descSpan };

    this.limpiarOpcionesTemporalesSelects(selects);

    if (activeOption === 'existing') {
      this.configurarModoResolucionManual(selects, elementos);
    } else if (activeOption === 'fallback') {
      this.configurarModoResolucionFallback(selectN3, elementos);
    } else {
      this.configurarModoResolucionAutomatica(selects, elementos);
    }
  }

  limpiarOpcionesTemporalesSelects(selects) {
    Object.values(selects).forEach((sel) => {
      if (sel) {
        const existingNewOpt = sel.querySelector('option[value="__new__"]');
        if (existingNewOpt) existingNewOpt.remove();
      }
    });
  }

  aplicarEstiloResolverCard(elementos, config) {
    const { cardDiv, icon, titleSpan, descSpan } = elementos;
    
    cardDiv.className = `card border-${config.color} border-opacity-25 bg-${config.color} bg-opacity-10 p-3 rounded-3 shadow-none animate-fade-in`;
    
    if (icon) {
      icon.className = `bi ${config.iconClass} text-${config.color} fs-5`;
    }
    
    titleSpan.textContent = config.title;
    titleSpan.className = `fw-bold text-${config.titleColor || config.color} d-block`;
    
    if (descSpan) {
      descSpan.innerHTML = config.descHtml;
    }
  }

  configurarModoResolucionManual(selects, elementos) {
    Object.values(selects).forEach(sel => {
      if (sel) sel.disabled = false;
    });

    this.aplicarEstiloResolverCard(elementos, {
      color: 'success',
      iconClass: 'bi-check-circle-fill',
      title: 'Resolución Manual',
      descHtml: 'Por favor, selecciona las ubicaciones correspondientes de las listas desplegables.'
    });
  }

  configurarModoResolucionFallback(selectN3, elementos) {
    this.aplicarEstiloResolverCard(elementos, {
      color: 'info',
      iconClass: 'bi-info-circle-fill',
      title: 'Ubicación Sugerida',
      descHtml: `La parroquia clickeada no está registrada. Se usará la cabecera cantonal <strong>"${this.pendingGeography.nivel3.fallbackNombre}"</strong>.`
    });

    if (selectN3) {
      selectN3.value = this.pendingGeography.nivel3.fallbackId || '';
      selectN3.disabled = true;
    }
  }

  configurarModoResolucionAutomatica(selects, elementos) {
    this.aplicarEstiloResolverCard(elementos, {
      color: 'warning',
      iconClass: 'bi-exclamation-triangle-fill',
      title: 'Registro Automático Activado',
      titleColor: 'dark',
      descHtml: `Se registrarán automáticamente al guardar: <strong>${this.obtenerListaNombresFaltantes().join(', ')}</strong>.`
    });

    const { selectPais, selectN1, selectN2, selectN3 } = selects;

    if (!this.pendingGeography.pais.exists) {
      this.inyectarOpcionTemporal(selectPais, `[Nuevo País: ${this.pendingGeography.pais.nombre}]`);
    }
    if (this.pendingGeography.nivel1.nombre && !this.pendingGeography.nivel1.exists) {
      this.inyectarOpcionTemporal(selectN1, `[Nueva ${this.pendingGeography.nivel1.tipo}: ${this.pendingGeography.nivel1.nombre}]`, '#colDirNivel1');
    }
    if (this.pendingGeography.nivel2.nombre && !this.pendingGeography.nivel2.exists) {
      this.inyectarOpcionTemporal(selectN2, `[Nuevo ${this.pendingGeography.nivel2.tipo}: ${this.pendingGeography.nivel2.nombre}]`, '#colDirNivel2');
    }
    if (this.pendingGeography.nivel3.nombre && !this.pendingGeography.nivel3.exists) {
      this.inyectarOpcionTemporal(selectN3, `[Nueva ${this.pendingGeography.nivel3.tipo}: ${this.pendingGeography.nivel3.nombre}]`, '#colDirNivel3');
    }
  }

  normalizeText(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  mostrarCampo(selector) {
    const el = document.querySelector(selector);
    if (el?.classList.contains('d-none')) {
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
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Registrando...';
    }

    try {
      const payload = {
        pais_id: this.pendingTerritory.pais_id,
        parent_id: this.pendingTerritory.parent_id,
        nombre: this.pendingTerritory.nombre,
        tipo: this.pendingTerritory.tipo,
        activo: true,
      };

      const res = await UbicacionesService.createTerritorio(payload);
      const newTerritory = this.extractData(res);

      ToastService.success(
        `${this.pendingTerritory.tipo} "${this.pendingTerritory.nombre}" registrada con éxito.`
      );

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
      this.dispatchEvent(
        new CustomEvent('territorios-updated', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (e) {
      console.error('Error al registrar territorio faltante:', e);
      ToastService.error(e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  capitalizeWords(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  actualizarEtiquetasNiveles(paisId) {
    const pais = this.paisesList.find((p) => p.id == paisId);
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

    if (s1?.disabled) {
      s1.innerHTML = `<option value="">-- Seleccione País primero --</option>`;
    } else if (s1) {
      s1.options[0].text = `-- Selecciona ${config.nivel1} --`;
    }

    if (s2?.disabled) {
      s2.innerHTML = `<option value="">-- Seleccione ${config.nivel1} primero --</option>`;
    } else if (s2) {
      s2.options[0].text = `-- Selecciona ${config.nivel2} --`;
    }

    if (s3?.disabled) {
      s3.innerHTML = `<option value="">-- Seleccione ${config.nivel2} primero --</option>`;
    } else if (s3) {
      s3.options[0].text = `-- Selecciona ${config.nivel3} --`;
    }
  }

  // --- HELPERS PARA MODULARIZACIÓN Y ELIMINACIÓN DE DUPLICIDADES ---
  extractList(res) {
    const fetchedData = res?.data || [];
    return Array.isArray(res) ? res : fetchedData;
  }

  extractData(res) {
    return res?.data || res || null;
  }

  obtenerListaNombresFaltantes() {
    if (!this.pendingGeography) return [];
    const list = [];
    if (!this.pendingGeography.pais.exists)
      list.push(`País "${this.pendingGeography.pais.nombre}"`);
    if (this.pendingGeography.nivel1.nombre && !this.pendingGeography.nivel1.exists)
      list.push(
        `${this.pendingGeography.nivel1.tipo} "${this.pendingGeography.nivel1.nombre}"`
      );
    if (this.pendingGeography.nivel2.nombre && !this.pendingGeography.nivel2.exists)
      list.push(
        `${this.pendingGeography.nivel2.tipo} "${this.pendingGeography.nivel2.nombre}"`
      );
    if (this.pendingGeography.nivel3.nombre && !this.pendingGeography.nivel3.exists)
      list.push(
        `${this.pendingGeography.nivel3.tipo} "${this.pendingGeography.nivel3.nombre}"`
      );
    return list;
  }

  findMatchingOptionByText(selectEl, targetText) {
    if (!selectEl || !targetText) return null;
    const cleanTarget = this.normalizeText(targetText);
    if (!cleanTarget) return null;
    return Array.from(selectEl.options).find((opt) => {
      const optText = this.normalizeText(opt.text);
      return optText.includes(cleanTarget) || cleanTarget.includes(optText);
    });
  }

  inyectarOpcionTemporal(selectEl, labelText, campoSelector = null) {
    if (!selectEl) return;
    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.text = labelText;
    newOpt.selected = true;
    selectEl.appendChild(newOpt);
    selectEl.disabled = true;
    if (campoSelector) {
      this.mostrarCampo(campoSelector);
    }
  }

  async registrarCadenaTerritoriosPendiente(btnSubmit) {
    let currentCountryId = this.pendingGeography.pais.id || null;

    if (!this.pendingGeography.pais.exists) {
      if (btnSubmit)
        btnSubmit.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Registrando País...';
      const res = await UbicacionesService.createPais({
        nombre: this.pendingGeography.pais.nombre,
        codigo_iso: this.pendingGeography.pais.codigo_iso,
        activo: true,
      });
      const newObj = this.extractData(res);
      currentCountryId = newObj.id;

      this.dispatchEvent(
        new CustomEvent('paises-updated', {
          detail: { paises: this.paisesList },
          bubbles: true,
          composed: true,
        })
      );
    }

    let parentId = null;
    parentId = await this.registrarNivelGeograficoPendiente(
      this.pendingGeography.nivel1,
      currentCountryId,
      null,
      btnSubmit
    );
    parentId = await this.registrarNivelGeograficoPendiente(
      this.pendingGeography.nivel2,
      currentCountryId,
      parentId,
      btnSubmit
    );
    parentId = await this.registrarNivelGeograficoPendiente(
      this.pendingGeography.nivel3,
      currentCountryId,
      parentId,
      btnSubmit
    );

    this.dispatchEvent(
      new CustomEvent('territorios-updated', {
        bubbles: true,
        composed: true,
      })
    );

    return parentId;
  }

  async registrarNivelGeograficoPendiente(nivel, paisId, parentId, btnSubmit) {
    if (!nivel.nombre) return parentId;
    if (nivel.exists) return nivel.id;

    if (btnSubmit) {
      btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Registrando ${nivel.tipo}...`;
    }
    const res = await UbicacionesService.createTerritorio({
      pais_id: paisId,
      parent_id: parentId,
      nombre: nivel.nombre,
      tipo: nivel.tipo,
      activo: true,
    });
    const newObj = this.extractData(res);
    return newObj.id;
  }

  async procesarNivelGeograficoAutofill({
    key,
    candidatos,
    selectEl,
    colSelector,
    label,
    statusText,
    loadFn,
    fallbackText = null,
  }) {
    const nombre = this.capitalizeWords(candidatos.find(Boolean) || '');
    this.pendingGeography[key].nombre = nombre;

    if (!nombre) {
      this.mostrarCampo(colSelector);
      return false;
    }

    if (statusText) {
      statusText.textContent = `Buscando ${label}...`;
    }

    await loadFn();
    const foundOpt = this.findMatchingOptionByText(selectEl, nombre);

    if (foundOpt) {
      this.pendingGeography[key].exists = true;
      this.pendingGeography[key].id = foundOpt.value;
      if (selectEl) selectEl.value = foundOpt.value;
      this.mostrarCampo(colSelector);
      return foundOpt.value;
    }

    if (fallbackText) {
      const cabeceraOpt = this.findMatchingOptionByText(selectEl, fallbackText);
      if (cabeceraOpt) {
        this.pendingGeography[key].fallbackNombre = cabeceraOpt.text.replace(
          /^\[.*?\]\s*/,
          ''
        );
        this.pendingGeography[key].fallbackId = cabeceraOpt.value;
      }
    }

    this.mostrarCampo(colSelector);
    return false;
  }

  async procesarJerarquiaGeograficaAutofill(address, matchedPais, config, statusText) {
    if (!matchedPais) return;
    const selectPais = document.querySelector('#dirPaisSelect');
    const selectN1 = document.querySelector('#dirNivel1Select');
    const selectN2 = document.querySelector('#dirNivel2Select');
    const selectN3 = document.querySelector('#dirNivel3Select');

    if (selectPais) selectPais.value = matchedPais.id;
    this.actualizarEtiquetasNiveles(matchedPais.id);

    const n1Id = await this.procesarNivelGeograficoAutofill({
      key: 'nivel1',
      candidatos: [address.state, address.region, address.province, address.state_district],
      selectEl: selectN1,
      colSelector: '#colDirNivel1',
      label: config.nivel1,
      statusText,
      loadFn: () => this.cargarDireccionDropdownNivel1(matchedPais.id),
    });
    if (!n1Id) return;

    const n2Id = await this.procesarNivelGeograficoAutofill({
      key: 'nivel2',
      candidatos: [address.county, address.city, address.town, address.municipality, address.city_district],
      selectEl: selectN2,
      colSelector: '#colDirNivel2',
      label: config.nivel2,
      statusText,
      loadFn: () => this.cargarDireccionDropdownNivel2(matchedPais.id, n1Id),
    });
    if (!n2Id) return;

    await this.procesarNivelGeograficoAutofill({
      key: 'nivel3',
      candidatos: [
        address.parish,
        address.suburb,
        address.neighbourhood,
        address.quarter,
        address.village,
        address.town,
        address.city_district,
        address.hamlet,
      ],
      selectEl: selectN3,
      colSelector: '#colDirNivel3',
      label: config.nivel3,
      statusText,
      loadFn: () => this.cargarDireccionDropdownNivel3(matchedPais.id, n2Id),
      fallbackText: this.pendingGeography.nivel2.nombre,
    });
  }

  esSoloNivel3FaltanteConFallback() {
    return (
      this.pendingGeography.pais.exists &&
      this.pendingGeography.nivel1.exists &&
      this.pendingGeography.nivel2.exists &&
      !this.pendingGeography.nivel3.exists &&
      Boolean(this.pendingGeography.nivel3.fallbackId)
    );
  }

  configurarOpcionFallbackResolver(canUseFallback) {
    const fallbackContainer = document.querySelector('#resolveOptFallbackContainer');
    const fallbackRadio = document.querySelector('#resolveOptFallback');
    const existingRadio = document.querySelector('#resolveOptExisting');

    if (canUseFallback && fallbackContainer) {
      fallbackContainer.classList.remove('d-none');
      const fallbackSpan = document.querySelector('#fallbackParishNameSpan');
      if (fallbackSpan) fallbackSpan.textContent = this.pendingGeography.nivel3.fallbackNombre;
      if (fallbackRadio) fallbackRadio.checked = true;
      return;
    }

    if (fallbackContainer) fallbackContainer.classList.add('d-none');
    if (existingRadio) existingRadio.checked = true;
  }

  configurarOpcionRegistroResolver(isAdmin, canUseFallback) {
    const registerRadio = document.querySelector('#resolveOptRegister');
    const fallbackRadio = document.querySelector('#resolveOptFallback');
    const existingRadio = document.querySelector('#resolveOptExisting');
    const labelRegister = document.querySelector('label[for="resolveOptRegister"]');
    const labelExisting = document.querySelector('label[for="resolveOptExisting"]');

    if (labelExisting) {
      labelExisting.innerHTML = `<strong>Seleccionar existente:</strong> Elegir manualmente de la lista de ubicaciones`;
    }

    if (isAdmin) {
      if (registerRadio) registerRadio.disabled = false;
      if (labelRegister) {
        const toCreateList = this.obtenerListaNombresFaltantes();
        labelRegister.innerHTML = `<strong>Crear y usar nuevos registros:</strong> Registrar automáticamente al guardar: ${toCreateList.join(', ')}`;
      }
      return;
    }

    if (registerRadio) registerRadio.disabled = true;
    if (labelRegister) {
      labelRegister.innerHTML = `<strong>Crear y usar nuevos registros:</strong> <span class="text-muted">(Requiere rol de Administrador para registrar)</span>`;
    }

    if (canUseFallback && fallbackRadio) {
      fallbackRadio.checked = true;
    } else if (existingRadio) {
      existingRadio.checked = true;
    }
  }

  configurarResolverTerritoriosFaltantes(hasMissing) {
    const resolverCard = document.querySelector('#missingTerritoryResolver');
    if (!resolverCard) return;

    if (!hasMissing) {
      resolverCard.classList.add('d-none');
      return;
    }

    const canUseFallback = this.esSoloNivel3FaltanteConFallback();
    this.configurarOpcionFallbackResolver(canUseFallback);
    this.configurarOpcionRegistroResolver(AuthService.isAdmin(), canUseFallback);

    resolverCard.classList.remove('d-none');
    this.actualizarFeedbackResolver();
  }
}

customElements.define('app-direccion-form', DireccionFormComponent);
