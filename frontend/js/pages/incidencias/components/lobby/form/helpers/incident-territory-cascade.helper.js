import { UbicacionesService } from '../../../../../ubicaciones/services/ubicaciones.service.js';
import { CatalogoService } from '../../../../../../shared/services/catalogo.service.js';
import { AuthService } from '../../../../../../core/auth.service.js';
import { ToastService } from '../../../../../../shared/services/toast.service.js';
import { COUNTRY_LEVELS } from '../../../../../../shared/constants.js';

export class IncidentTerritoryCascadeHelper {
  constructor(component) {
    this.component = component;
    this.paisesList = [];
    this.currentPostalCode = '';
    this.selectedDireccionId = null;
    this.mapController = null; // Injected later if needed for distance calc

    // Elements
    this.dirPaisSelect = component.querySelector('#dirPais');
    this.dirNivel1Select = component.querySelector('#dirNivel1');
    this.dirNivel2Select = component.querySelector('#dirNivel2');
    this.dirNivel3Select = component.querySelector('#dirNivel3');
    this.dirDetalleInput = component.querySelector('#dirDetalle');
    this.txtInfoUbicacion = component.querySelector('#txtInfoUbicacion');

    this.initEvents();
  }

  setMapController(mc) {
    this.mapController = mc;
  }

  initEvents() {
    if (this.dirPaisSelect) {
      this.dirPaisSelect.addEventListener('change', (e) => {
        this.actualizarEtiquetasNiveles(e.target.value);
        this.cargarDropdownNivel1(e.target.value);
      });
    }
    if (this.dirNivel1Select) {
      this.dirNivel1Select.addEventListener('change', (e) => {
        this.cargarDropdownNivel2(this.dirPaisSelect?.value, e.target.value);
      });
    }
    if (this.dirNivel2Select) {
      this.dirNivel2Select.addEventListener('change', (e) => {
        this.cargarDropdownNivel3(this.dirPaisSelect?.value, e.target.value);
      });
    }
    if (this.dirDetalleInput) {
      this.dirDetalleInput.addEventListener('input', () => {
        this.selectedDireccionId = null;
      });
    }
  }

  setPaises(paises) {
    this.paisesList = paises;
    this.renderPaisesSelect();
  }

  renderPaisesSelect() {
    if (!this.dirPaisSelect) return;
    const optionsHtml =
      '<option value="">-- Seleccione --</option>' +
      this.paisesList
        .filter((p) => p.activo)
        .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
        .join('');
    this.dirPaisSelect.innerHTML = optionsHtml;
  }

  actualizarEtiquetasNiveles(paisId) {
    const pais = this.paisesList.find((p) => p.id == paisId);
    const iso = pais ? (pais.codigo_iso || '').toUpperCase() : '';
    const config = COUNTRY_LEVELS[iso] || COUNTRY_LEVELS.DEFAULT;

    const l1 = this.component.querySelector('#lblDirNivel1');
    const l2 = this.component.querySelector('#lblDirNivel2');
    const l3 = this.component.querySelector('#lblDirNivel3');

    if (l1) l1.innerHTML = `${config.nivel1} <span class="text-danger">*</span>`;
    if (l2) l2.innerHTML = `${config.nivel2} <span class="text-danger">*</span>`;
    if (l3) l3.innerHTML = `${config.nivel3} <span class="text-danger">*</span>`;
  }

  async cargarDropdownNivel1(paisId, selectVal = null) {
    const s1 = this.dirNivel1Select;
    if (!s1) return;
    
    s1.innerHTML = '<option value="">-- Cargando --</option>';
    s1.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, null);
      if (list.length > 0) {
        s1.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s1.disabled = false;
        this.component.querySelector('#colDirNivel1')?.classList.remove('d-none');
      } else {
        s1.innerHTML = '<option value="">-- No hay territorios registrados --</option>';
        this.component.querySelector('#colDirNivel1')?.classList.add('d-none');
      }
      this.component.querySelector('#colDirNivel2')?.classList.add('d-none');
      this.component.querySelector('#colDirNivel3')?.classList.add('d-none');

      if (selectVal) {
        s1.value = selectVal;
      }
    } catch (e) {
      s1.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel2(paisId, parentId, selectVal = null) {
    const s2 = this.dirNivel2Select;
    if (!s2) return;

    s2.innerHTML = '<option value="">-- Cargando --</option>';
    s2.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s2.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s2.disabled = false;
        this.component.querySelector('#colDirNivel2')?.classList.remove('d-none');
      } else {
        s2.innerHTML = '<option value="">-- No hay --</option>';
        this.component.querySelector('#colDirNivel2')?.classList.add('d-none');
      }
      this.component.querySelector('#colDirNivel3')?.classList.add('d-none');

      if (selectVal) {
        s2.value = selectVal;
      }
    } catch (e) {
      s2.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async cargarDropdownNivel3(paisId, parentId, selectVal = null) {
    const s3 = this.dirNivel3Select;
    if (!s3) return;

    s3.innerHTML = '<option value="">-- Cargando --</option>';
    s3.disabled = true;

    try {
      const list = await CatalogoService.getTerritorios(paisId, parentId);
      if (list.length > 0) {
        s3.innerHTML =
          '<option value="">-- Seleccione --</option>' +
          list.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
        s3.disabled = false;
        this.component.querySelector('#colDirNivel3')?.classList.remove('d-none');
      } else {
        s3.innerHTML = '<option value="">-- No hay --</option>';
        this.component.querySelector('#colDirNivel3')?.classList.add('d-none');
      }

      if (selectVal) {
        s3.value = selectVal;
      }
    } catch (e) {
      s3.innerHTML = '<option value="">-- Error --</option>';
    }
  }

  async autofillDesdeCoordenadas(lat, lng) {
    try {
      const data = await UbicacionesService.reverseGeocode(lat, lng);
      const address = data.address || {};

      const road = address.road || address.pedestrian || '';
      const suburb = address.suburb || address.neighbourhood || address.parish || '';
      const county = address.county || address.city || '';
      
      if (this.dirDetalleInput) {
        this.dirDetalleInput.value = [road, suburb, county].filter(Boolean).join(', ') || data.display_name || '';
      }

      this.currentPostalCode = address.postcode || '';

      const countryCode = (address.country_code || '').toUpperCase();
      const matchedPais = this.paisesList.find(
        (p) => p.codigo_iso && p.codigo_iso.toUpperCase() === countryCode
      );

      if (matchedPais) {
        if (this.dirPaisSelect) this.dirPaisSelect.value = matchedPais.id;
        this.actualizarEtiquetasNiveles(matchedPais.id);
        await this.autofillTerritoriosCascading(matchedPais.id, address, data.territorio_detectado);
      }

      // Check DB proximity
      let matchedDbDir = null;
      try {
        const dbDirs = (await CatalogoService.getDirecciones()) || [];
        let minDistance = Infinity;

        for (const d of dbDirs) {
          if (!d.latitud || !d.longitud) continue;

          const dist = this.mapController ? this.mapController.calcularDistancia(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(d.latitud),
            parseFloat(d.longitud)
          ) : Infinity;

          if (dist < minDistance && dist <= 0.05) {
            minDistance = dist;
            matchedDbDir = d;
          }
        }
      } catch (err) {
        console.warn('Error fetching existing addresses for matching:', err);
      }

      if (matchedDbDir) {
        this.selectedDireccionId = matchedDbDir.id;
        if (this.dirDetalleInput) this.dirDetalleInput.value = matchedDbDir.detalle;
        if (this.dirPaisSelect) this.dirPaisSelect.value = matchedDbDir.territorio?.pais_id || '';
        this.currentPostalCode = matchedDbDir.codigo_postal || '';

        // Update map controller quietly
        if (this.mapController) {
          this.mapController.actualizarMarcador(matchedDbDir.latitud, matchedDbDir.longitud, false);
        }

        this.actualizarIndicadorMinimalista();
        if (!this.component.isMobileLayout) {
          ToastService.info(`Ubicación seleccionada: ${matchedDbDir.detalle}`);
        }
      } else {
        this.selectedDireccionId = null;
        this.actualizarIndicadorMinimalista();
      }
    } catch (e) {
      console.warn('Error autofilling from reverse geocoding:', e);
    }
  }

  async autofillTerritoriosCascading(paisId, address, territorioDetectado) {
    if (territorioDetectado) {
      const td = territorioDetectado;
      await this.cargarDropdownNivel1(paisId);
      if (td.provincia_id && this.dirNivel1Select) {
        this.dirNivel1Select.value = td.provincia_id;

        await this.cargarDropdownNivel2(paisId, td.provincia_id);
        if (td.canton_id && this.dirNivel2Select) {
          this.dirNivel2Select.value = td.canton_id;

          await this.cargarDropdownNivel3(paisId, td.canton_id);
          if (td.parroquia_id && this.dirNivel3Select) {
            this.dirNivel3Select.value = td.parroquia_id;
          } else if (!td.parroquia_id && this.dirNivel3Select) {
            const possibleNivel3Names = [
              address.parish,
              address.suburb,
              address.neighbourhood,
              address.quarter,
            ].filter(Boolean);
            const n3Name = possibleNivel3Names[0] || '';
            if (n3Name) {
              const opt3 = this.findOptionMatchingText(this.dirNivel3Select, n3Name);
              if (opt3) this.dirNivel3Select.value = opt3.value;
            }
          }
        }
      }
      return;
    }

    await this.cargarDropdownNivel1(paisId);

    const possibleNivel1Names = [address.state, address.region, address.province].filter(Boolean);
    const n1Name = possibleNivel1Names[0] || '';

    if (n1Name) {
      const opt1 = this.findOptionMatchingText(this.dirNivel1Select, n1Name);
      if (opt1) {
        this.dirNivel1Select.value = opt1.value;

        await this.cargarDropdownNivel2(paisId, opt1.value);

        const possibleNivel2Names = [
          address.county,
          address.city,
          address.town,
          address.municipality,
        ].filter(Boolean);
        const n2Name = possibleNivel2Names[0] || '';
        if (n2Name) {
          const opt2 = this.findOptionMatchingText(this.dirNivel2Select, n2Name);
          if (opt2) {
            this.dirNivel2Select.value = opt2.value;

            await this.cargarDropdownNivel3(paisId, opt2.value);

            const possibleNivel3Names = [
              address.parish,
              address.suburb,
              address.neighbourhood,
              address.quarter,
            ].filter(Boolean);
            const n3Name = possibleNivel3Names[0] || '';

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

  actualizarIndicadorMinimalista() {
    const detalle = this.dirDetalleInput?.value;
    const n3Select = this.dirNivel3Select;
    let parroquiaNombre = '';

    if (n3Select && n3Select.options.length > 0 && n3Select.selectedIndex > 0) {
      parroquiaNombre = n3Select.options[n3Select.selectedIndex].text;
    }

    if (this.txtInfoUbicacion) {
      if (detalle) {
        let txtInfo = `<strong>Dirección:</strong> ${detalle}`;
        if (parroquiaNombre) {
          txtInfo += ` | <strong>Parroquia:</strong> ${parroquiaNombre}`;
        }
        this.txtInfoUbicacion.innerHTML = txtInfo;
      } else {
        this.txtInfoUbicacion.textContent = 'Ninguna ubicación seleccionada.';
      }
    }
  }

  findOptionMatchingText(selectEl, text) {
    if (!selectEl) return null;
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

  getDatos() {
    const n3 = this.dirNivel3Select?.value;
    const n2 = this.dirNivel2Select?.value;
    const n1 = this.dirNivel1Select?.value;
    return {
      selectedDireccionId: this.selectedDireccionId,
      finalTerritorioId: n3 || n2 || n1,
      detalle: this.dirDetalleInput?.value || '',
      codigoPostal: this.currentPostalCode
    };
  }
}
