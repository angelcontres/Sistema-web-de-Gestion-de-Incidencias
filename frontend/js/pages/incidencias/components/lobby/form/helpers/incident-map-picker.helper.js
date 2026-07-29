import { MAP_CONFIG } from '../../../../../../shared/constants.js';
import { ToastService } from '../../../../../../shared/services/toast.service.js';

export class IncidentMapPickerHelper {
  constructor(component) {
    this.component = component;
    this.map = null;
    this.marker = null;
    this.coords = null;
    this.isMapInteractive = false;

    // Elements
    this.mapDiv = component.querySelector('#incidenciaMapa');
    this.dirLatInput = component.querySelector('#dirLat');
    this.dirLngInput = component.querySelector('#dirLng');
    this.btnSeleccionarMapa = component.querySelector('#btnSeleccionarMapa');
    this.btnObtenerUbicacion = component.querySelector('#btnObtenerUbicacion');
    this.btnObtenerUbicacionIcon = component.querySelector('#btnObtenerUbicacionIcon');
    this.btnObtenerUbicacionSpinner = component.querySelector('#btnObtenerUbicacionSpinner');
    this.btnObtenerUbicacionText = component.querySelector('#btnObtenerUbicacionText');
    this.dirPrecisionGpsInput = component.querySelector('#dirPrecisionGps');
  }

  initEvents(onLocationSelectedCallback) {
    this.onLocationSelectedCallback = onLocationSelectedCallback;

    if (this.btnObtenerUbicacion) {
      this.btnObtenerUbicacion.addEventListener('click', () => this.obtenerUbicacionActual());
    }
    if (this.btnSeleccionarMapa) {
      this.btnSeleccionarMapa.addEventListener('click', () => this.habilitarMapaInteractivo());
    }
  }

  initMap() {
    if (!this.mapDiv) return;

    this.map = L.map(this.mapDiv, {
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
    if (!this.mapDiv) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.mapDiv).setView(
      this.coords ? [this.coords.lat, this.coords.lng] : MAP_CONFIG.DEFAULT_CENTER,
      this.coords ? 16 : MAP_CONFIG.DEFAULT_ZOOM
    );

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    this.isMapInteractive = true;
    this.marker = null;

    if (this.coords) {
      this.actualizarMarcador(this.coords.lat, this.coords.lng, false);
    }

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.actualizarMarcador(lat, lng, true);
    });

    if (!this.component.isMobileLayout) {
      ToastService.info(
        'Mapa habilitado. Haga clic o arrastre el marcador para seleccionar la ubicación.'
      );
    }

    if (this.btnSeleccionarMapa) {
      this.btnSeleccionarMapa.classList.replace('btn-outline-primary', 'btn-primary');
      this.btnSeleccionarMapa.disabled = true;
    }
  }

  actualizarMarcador(lat, lng, triggerCallback = false) {
    const latVal = parseFloat(lat).toFixed(6);
    const lngVal = parseFloat(lng).toFixed(6);

    if (this.dirLatInput) this.dirLatInput.value = latVal;
    if (this.dirLngInput) this.dirLngInput.value = lngVal;
    this.coords = { lat: parseFloat(latVal), lng: parseFloat(lngVal) };

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

    if (triggerCallback && this.onLocationSelectedCallback) {
      this.onLocationSelectedCallback(latVal, lngVal);
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

    // NOSONAR: La geolocalización es necesaria para reportar la incidencia y solo se activa por interacción explícita del usuario.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (this.dirPrecisionGpsInput) {
          this.dirPrecisionGpsInput.value = accuracy.toFixed(2);
        }
        this.actualizarMarcador(latitude, longitude, false);
        if (this.onLocationSelectedCallback) {
          this.onLocationSelectedCallback(latitude, longitude);
        }
        toggleLoading(false);
        if (!this.component.isMobileLayout) {
          ToastService.success(`Ubicación obtenida con éxito.`);
        }
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getCoords() {
    return this.coords;
  }

  setCoordsAndCenter(lat, lng, zoom = 15) {
    this.actualizarMarcador(lat, lng, false);
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  }

  centerMap(centerConfig) {
    if (this.map && centerConfig) {
      this.map.setView(centerConfig.center, centerConfig.zoom);
    }
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
