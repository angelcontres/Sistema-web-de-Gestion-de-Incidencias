import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { UIHelper } from '../../../../shared/utils/ui-helper.js';
import { MAP_CONFIG } from '../../../../shared/constants.js';

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
    if (modalEl) {
      document.body.appendChild(modalEl);
      this.direccionModalObj = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('shown.bs.modal', () => this.initModalMap());
    }

    // Setup Event Listeners
    const direccionForm = document.querySelector('#direccionForm');
    if (direccionForm) {
      direccionForm.addEventListener('submit', (e) => this.guardarDireccion(e));
    }

    // Cascading dropdowns (Modal Form)
    const dirPaisSelect = document.querySelector('#dirPaisSelect');
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

    const dirNivel1Select = document.querySelector('#dirNivel1Select');
    if (dirNivel1Select) {
      dirNivel1Select.addEventListener('change', (e) => {
        const parentId = e.target.value;
        const paisId = document.querySelector('#dirPaisSelect').value;
        this.cargarDireccionDropdownNivel2(paisId, parentId);
      });
    }

    const dirNivel2Select = document.querySelector('#dirNivel2Select');
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

      // Await cascading load
      await this.cargarDireccionDropdownNivel1(paisId, direccion.territorio);
    } else {
      document.querySelector('#direccionModalLabel').textContent = 'Nueva Dirección';
      
      // Pre-fill country if operator
      const user = AuthService.getCurrentUser();
      if (user && user.pais_id) {
        document.querySelector('#dirPaisSelect').value = user.pais_id;
        document.querySelector('#dirPaisSelect').disabled = true;
        await this.cargarDireccionDropdownNivel1(user.pais_id);
      } else {
        document.querySelector('#dirPaisSelect').disabled = false;
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
      this.establecerMarcadorModal(lat, lng);
    });

    if (this.tempCoords) {
      this.establecerMarcadorModal(this.tempCoords.lat, this.tempCoords.lng);
      this.modalMap.setView([this.tempCoords.lat, this.tempCoords.lng], 14);
    } else {
      this.centrarModalMapaSegunPais();
    }
  }

  establecerMarcadorModal(lat, lng) {
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
        this.establecerMarcadorModal(position.lat, position.lng);
      });
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
}

customElements.define('app-direccion-form', DireccionFormComponent);
