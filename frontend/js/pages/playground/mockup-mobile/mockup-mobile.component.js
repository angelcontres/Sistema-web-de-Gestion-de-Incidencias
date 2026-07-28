import { BaseComponent } from '../../../core/base-component.js';
import { CatalogoService } from '../../../shared/services/catalogo.service.js';
import { IncidenciaService } from '../../incidencias/services/incidencia.service.js';
import { ToastService } from '../../../shared/services/toast.service.js';
import { IncidentMediaUploaderHelper } from '../../incidencias/components/lobby/form/helpers/incident-media-uploader.helper.js';
import { IncidentMapPickerHelper } from '../../incidencias/components/lobby/form/helpers/incident-map-picker.helper.js';

export class MockupMobileComponent extends BaseComponent {
  constructor() {
    super('js/pages/playground/mockup-mobile/mockup-mobile.component.html');
    this.selectedParentId = null;
    this.selectedSubcategoryId = null;
    this.categories = [];
  }

  async onInit() {
    this.initMap();
    await this.loadCategories();
    this.initSubmitEvent();
  }

  initSubmitEvent() {
    const btn = this.querySelector('#btnSubmitIncidencia');
    if (btn) {
      btn.addEventListener('click', () => this.submitIncidencia());
    }
  }

  async submitIncidencia() {
    if (!this.selectedSubcategoryId) {
      ToastService.warning('Por favor selecciona una subcategoría del problema.');
      return;
    }

    const textArea = this.querySelector('textarea');
    const descripcion = textArea ? textArea.value.trim() : '';
    if (!descripcion) {
      ToastService.warning('Por favor ingresa una descripción del problema.');
      return;
    }

    const coords = this.mapHelper.getCoords();
    if (!coords) {
      ToastService.warning('Por favor selecciona la ubicación en el mapa.');
      return;
    }

    const newFilesBase64 = this.mediaHelper.getNewFilesBase64();
    if (newFilesBase64.length === 0) {
      ToastService.warning('Por favor adjunta al menos una foto de evidencia.');
      return;
    }

    const payload = {
      tipo_incidencia_id: this.selectedParentId,
      sub_tipo_incidencia_id: this.selectedSubcategoryId,
      incidencia_descripcion: descripcion,
      direccion_lat: coords.lat.toString(),
      direccion_lng: coords.lng.toString(),
      recursos: newFilesBase64
    };

    const btn = this.querySelector('#btnSubmitIncidencia');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
    btn.disabled = true;

    try {
      await IncidenciaService.create(payload);
      ToastService.success('¡Incidencia reportada con éxito!');
      window.location.hash = '#/incidencias';
    } catch (e) {
      console.error('Error enviando incidencia:', e);
      ToastService.error(e.message || 'Error al guardar la incidencia.');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  async loadCategories() {
    try {
      const res = await CatalogoService.getCategoriasIncidencia('null');
      this.categories = Array.isArray(res) ? res : res?.data || [];
      this.renderCategories();
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }

  renderCategories() {
    const container = this.querySelector('#categoriesContainer');
    if (!container) return;
    
    if (this.categories.length === 0) {
      container.innerHTML = '<span class="text-muted small">No hay categorías disponibles.</span>';
      return;
    }

    container.innerHTML = this.categories.map(cat => {
      const isSelected = this.selectedParentId === cat.id;
      const btnClass = isSelected ? 'btn-primary shadow-sm' : 'btn-outline-secondary bg-white text-dark';
      return `
        <button class="btn ${btnClass} rounded-pill px-3 py-1 d-flex align-items-center gap-1 cat-btn" data-id="${cat.id}">
          ${cat.nombre} ${isSelected ? '<i class="bi bi-chevron-down ms-1" style="font-size: 0.8rem;"></i>' : ''}
        </button>
      `;
    }).join('');

    // Attach events
    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        if (this.selectedParentId === id) {
          // Ya está seleccionada, solo abrir subcategorías
          const offcanvasEl = this.querySelector('#offcanvasSubcategory');
          if (offcanvasEl) {
             let bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl) || new window.bootstrap.Offcanvas(offcanvasEl);
             bsOffcanvas.show();
          }
          return;
        }

        this.selectedParentId = id;
        this.selectedSubcategoryId = null; // reset subcat
        this.renderCategories(); // update UI (primary color)
        
        // Load subcategories
        await this.loadSubcategories(id);

        // Open offcanvas
        const offcanvasEl = this.querySelector('#offcanvasSubcategory');
        if (offcanvasEl) {
           let bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl) || new window.bootstrap.Offcanvas(offcanvasEl);
           bsOffcanvas.show();
        }
      });
    });
  }

  async loadSubcategories(parentId) {
    const subContainer = this.querySelector('#subcategoriesContainer');
    if (!subContainer) return;

    subContainer.innerHTML = '<div class="p-3 text-center"><div class="spinner-border spinner-border-sm text-primary"></div></div>';

    try {
      const res = await CatalogoService.getCategoriasIncidencia(parentId);
      const subcats = Array.isArray(res) ? res : res?.data || [];
      
      if (subcats.length === 0) {
        subContainer.innerHTML = '<div class="p-3 text-center text-muted">No hay subcategorías.</div>';
        return;
      }

      subContainer.innerHTML = subcats.map(sub => {
        const isSelected = this.selectedSubcategoryId === sub.id;
        return `
          <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 subcat-btn" data-id="${sub.id}">
            ${sub.nombre} ${isSelected ? '<i class="bi bi-check-lg text-primary fs-5"></i>' : ''}
          </button>
        `;
      }).join('');

      // Events for subcategories
      subContainer.querySelectorAll('.subcat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.selectedSubcategoryId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
          
          // Re-render subcats to show checkmark
          this.loadSubcategories(parentId); // Inefficient but works for mockup, or just re-render from cached array
          
          // Hide offcanvas
          const offcanvasEl = this.querySelector('#offcanvasSubcategory');
          if (offcanvasEl) {
            let bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (bsOffcanvas) bsOffcanvas.hide();
          }
        });
      });

    } catch (e) {
      console.error('Error fetching subcategories:', e);
      subContainer.innerHTML = '<div class="p-3 text-center text-danger">Error cargando.</div>';
    }
  }


  initMap() {
    this.mediaHelper = new IncidentMediaUploaderHelper(this);
    this.mapHelper = new IncidentMapPickerHelper(this);
    
    // Configurar mapa estático inicialmente
    this.mapHelper.initEvents((lat, lng) => {
      console.log('Mockup: Ubicación seleccionada', lat, lng);
    });
    this.mapHelper.initMap();
    
    // Fix leafet render
    setTimeout(() => {
      if (this.mapHelper.map) {
        this.mapHelper.map.invalidateSize();
      }
    }, 100);
  }
}

customElements.define('app-mockup-mobile', MockupMobileComponent);
