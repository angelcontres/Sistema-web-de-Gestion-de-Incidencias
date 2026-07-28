export class IncidentClassificationHelper {
  constructor(component) {
    this.component = component;
    this.categorias = [];
    this.prioridades = [];

    // Elements
    this.tipoSelect = component.querySelector('#tipoSelect');
    this.subTipoSelect = component.querySelector('#subTipoSelect');
    this.cantidadAfectadosInput = component.querySelector('#cantidadAfectados');
    this.prioridadDisplay = component.querySelector('#prioridadDisplay');
    this.institucionSelect = component.querySelector('#institucionSelect');
    
    this.initEvents();
  }

  initEvents() {
    if (this.tipoSelect) {
      this.tipoSelect.addEventListener('change', () => this.onCategoryChange());
    }
    if (this.subTipoSelect) {
      this.subTipoSelect.addEventListener('change', () => this.onSubCategoryChange());
    }
    if (this.cantidadAfectadosInput) {
      this.cantidadAfectadosInput.addEventListener('input', () => this.calcularPrioridadDinamica());
    }
  }

  setCategorias(categorias) {
    this.categorias = categorias;
    this.renderTipoSelect();
  }

  setPrioridades(prioridades) {
    this.prioridades = prioridades;
  }

  renderTipoSelect() {
    if (!this.tipoSelect) return;
    const rootCategories = this.categorias.filter((c) => c.parent_id === null && c.activo);
    this.tipoSelect.innerHTML =
      '<option value="">-- Seleccione --</option>' +
      rootCategories.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');
  }

  onCategoryChange() {
    if (!this.tipoSelect || !this.subTipoSelect) return;
    const parentId = this.tipoSelect.value;
    
    if (!parentId) {
      this.subTipoSelect.innerHTML = '<option value="">-- Seleccione categoría primero --</option>';
      this.subTipoSelect.disabled = true;
      this.resetPrioridadDisplay();
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
    if (!this.subTipoSelect) return;
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
    if (!this.subTipoSelect || !this.prioridadDisplay) return;
    const subTipoId = this.subTipoSelect.value;
    const afectados = parseInt(this.cantidadAfectadosInput?.value) || 0;

    if (!subTipoId) {
      this.resetPrioridadDisplay();
      return;
    }

    const subcat = this.categorias.find((c) => c.id == subTipoId);
    if (!subcat || !subcat.prioridad_id) {
      this.resetPrioridadDisplay();
      return;
    }

    let pId = subcat.prioridad_id;

    // Shift priority if there are 10 or more affected people
    if (afectados >= 10 && pId > 1) {
      pId -= 1; 
    }

    const prioridad = this.prioridades.find((p) => p.id === pId) || { nombre: 'Desconocida', color_hex: '#6c757d' };
    
    // Fallback badge class logic since color_hex handles text color, but we might want background styles
    let badgeClass = 'secondary';
    if (pId === 1) badgeClass = 'danger';
    else if (pId === 2) badgeClass = 'warning';
    else if (pId === 3) badgeClass = 'info';
    else if (pId === 4) badgeClass = 'success';

    this.prioridadDisplay.textContent = prioridad.nombre;
    this.prioridadDisplay.style.color = prioridad.color_hex;
    this.prioridadDisplay.className = `fw-bold fs-6 badge bg-${badgeClass}-soft text-${badgeClass} px-3 py-1`;
  }

  resetPrioridadDisplay() {
    if (this.prioridadDisplay) {
      this.prioridadDisplay.textContent = '-';
      this.prioridadDisplay.style.color = '';
      this.prioridadDisplay.className = 'fw-bold fs-6 text-secondary';
    }
  }

  getDatos() {
    return {
      tipo_incidencia_id: parseInt(this.tipoSelect?.value) || null,
      sub_tipo_incidencia_id: parseInt(this.subTipoSelect?.value) || null,
      cantidad_afectados_incidencia: parseInt(this.cantidadAfectadosInput?.value) || 0,
    };
  }
}
