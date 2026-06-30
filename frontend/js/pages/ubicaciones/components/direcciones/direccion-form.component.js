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
    if (form) {
      form.classList.remove('was-validated');
      form.reset();
    }
    if (errorAlert) {
      errorAlert.classList.add('d-none');
    }

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
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: null });
      s1.innerHTML = `<option value="">-- Selecciona ${config.nivel1} --</option>` + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s1.disabled = false;

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
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      s2.innerHTML = `<option value="">-- Selecciona ${config.nivel2} --</option>` + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s2.disabled = false;

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
      return;
    }

    try {
      const list = await UbicacionesService.getTerritorios({ pais_id: paisId, parent_id: parentId });
      s3.innerHTML = `<option value="">-- Selecciona ${config.nivel3} --</option>` + 
        list.map(t => `<option value="${t.id}">${t.tipo ? `[${t.tipo}] ` : ''}${t.nombre}</option>`).join('');
      s3.disabled = false;

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

    const payload = {
      territorio_id: parseInt(territorioIdVal),
      detalle: document.querySelector('#direccionDetalle').value,
      referencia: document.querySelector('#direccionReferencia').value || null,
      codigo_postal: document.querySelector('#direccionCodigoPostal').value || null,
      latitud: latVal ? parseFloat(latVal) : null,
      longitud: lngVal ? parseFloat(lngVal) : null,
      activo: document.querySelector('#direccionActivo').checked,
    };

    // Double-submit protection
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
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'es'
        }
      });
      if (!response.ok) throw new Error('Error en geocodificación');

      const data = await response.json();
      const address = data.address || {};

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

      // 3. País
      const countryCode = (address.country_code || '').toUpperCase();
      if (countryCode && this.paisesList.length > 0) {
        const matchedPais = this.paisesList.find(p => p.codigo_iso.toUpperCase() === countryCode);
        if (matchedPais) {
          const selectPais = document.querySelector('#dirPaisSelect');
          if (selectPais && !selectPais.disabled) {
            selectPais.value = matchedPais.id;
          }

          const currentPaisId = selectPais ? selectPais.value : null;
          if (currentPaisId) {
            const pais = this.paisesList.find(p => p.id == currentPaisId);
            const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
            const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

            if (statusText) statusText.textContent = `Buscando ${config.nivel1}...`;
            
            // Cargar Nivel 1
            await this.cargarDireccionDropdownNivel1(currentPaisId);
            
            const s1 = document.querySelector('#dirNivel1Select');
            const possibleNivel1Names = [address.state, address.region, address.county, address.state_district].filter(Boolean);
            let matchedN1Id = null;

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

            // Cargar Nivel 2
            if (matchedN1Id) {
              if (statusText) statusText.textContent = `Buscando ${config.nivel2}...`;
              await this.cargarDireccionDropdownNivel2(currentPaisId, matchedN1Id);
              
              const s2 = document.querySelector('#dirNivel2Select');
              const possibleNivel2Names = [address.county, address.city, address.town, address.municipality, address.city_district].filter(Boolean);
              let matchedN2Id = null;

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

              // Cargar Nivel 3
              if (matchedN2Id) {
                if (statusText) statusText.textContent = `Buscando ${config.nivel3}...`;
                await this.cargarDireccionDropdownNivel3(currentPaisId, matchedN2Id);
                
                const s3 = document.querySelector('#dirNivel3Select');
                const possibleNivel3Names = [address.suburb, address.neighbourhood, address.village, address.hamlet, address.city_district].filter(Boolean);

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
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error al autorellenar la ubicación:', error);
    } finally {
      if (statusContainer) {
        statusContainer.classList.add('d-none');
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
