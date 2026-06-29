import { BaseComponent } from '../../../../core/base-component.js';
import { UbicacionesService } from '../../../../shared/services/ubicaciones.service.js';
import { AuthService } from '../../../../core/auth.service.js';

export class UbicacionesTerritoriosComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/territorios/ubicaciones-territorios.component.html');
    
    // State management
    this.selectedPaisId = null;
    this.selectedNivel1Id = null;
    this.selectedNivel2Id = null;
    
    this.paisesList = [];
    this.territoriosNivel1 = [];
    this.territoriosNivel2 = [];
    this.territoriosNivel3 = [];
    
    this.territorioModalObj = null;
  }

  async onInit() {
    // Initialize Modal
    try {
      this.territorioModalObj = new bootstrap.Modal(this.querySelector('#territorioModal'));
    } catch (e) {
      console.warn('Error inicializando el modal de territorios.', e);
    }

    // Load initial countries
    await this.cargarPaises();

    // Listen to global changes in countries
    document.addEventListener('paises-updated', (e) => {
      this.paisesList = e.detail.paises || [];
      this.llenarPaisSelect();
    });

    // Setup Event Listeners
    const explorerPaisSelect = this.querySelector('#explorerPaisSelect');
    if (explorerPaisSelect) {
      explorerPaisSelect.addEventListener('change', (e) => {
        this.selectedPaisId = e.target.value;
        this.selectedNivel1Id = null;
        this.selectedNivel2Id = null;
        this.cargarTerritoriosColumna1();
      });
    }

    // Add buttons
    const btnAddNivel1 = this.querySelector('#btnAddNivel1');
    const btnAddNivel2 = this.querySelector('#btnAddNivel2');
    const btnAddNivel3 = this.querySelector('#btnAddNivel3');
    const isAdmin = AuthService.isAdmin();

    if (!isAdmin) {
      if (btnAddNivel1) btnAddNivel1.remove();
      if (btnAddNivel2) btnAddNivel2.remove();
      if (btnAddNivel3) btnAddNivel3.remove();
    } else {
      if (btnAddNivel1) btnAddNivel1.addEventListener('click', () => this.abrirModalTerritorio(1));
      if (btnAddNivel2) btnAddNivel2.addEventListener('click', () => this.abrirModalTerritorio(2));
      if (btnAddNivel3) btnAddNivel3.addEventListener('click', () => this.abrirModalTerritorio(3));
    }

    const territorioForm = this.querySelector('#territorioForm');
    if (territorioForm) {
      territorioForm.addEventListener('submit', (e) => this.guardarTerritorio(e));
    }
  }

  async cargarPaises() {
    try {
      const paises = await UbicacionesService.getPaises();
      this.paisesList = paises || [];
      this.llenarPaisSelect();
    } catch (error) {
      console.error('Error al precargar países en territorios:', error);
    }
  }

  llenarPaisSelect() {
    const select = this.querySelector('#explorerPaisSelect');
    if (!select) return;
    
    const currentVal = select.value;
    const activePaises = this.paisesList.filter(p => p.activo);

    const optionsHtml = activePaises
      .map(p => `<option value="${p.id}">${p.nombre}</option>`)
      .join('');
      
    select.innerHTML = `<option value="">-- Selecciona un País --</option>${optionsHtml}`;
    
    if (activePaises.length === 1) {
      select.value = activePaises[0].id;
      this.selectedPaisId = activePaises[0].id;
      this.selectedNivel1Id = null;
      this.selectedNivel2Id = null;
      this.cargarTerritoriosColumna1();
    } else {
      select.value = currentVal;
    }
  }

  async cargarTerritoriosColumna1() {
    const list1 = this.querySelector('#listNivel1');
    const list2 = this.querySelector('#listNivel2');
    const list3 = this.querySelector('#listNivel3');
    const btnAdd1 = this.querySelector('#btnAddNivel1');
    const btnAdd2 = this.querySelector('#btnAddNivel2');
    const btnAdd3 = this.querySelector('#btnAddNivel3');
    const isAdmin = AuthService.isAdmin();

    list1.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    list2.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 1</div>';
    list3.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 2</div>';

    if (btnAdd1 && isAdmin) btnAdd1.classList.add('d-none');
    if (btnAdd2 && isAdmin) btnAdd2.classList.add('d-none');
    if (btnAdd3 && isAdmin) btnAdd3.classList.add('d-none');

    if (!this.selectedPaisId) {
      list1.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un país para comenzar</div>';
      return;
    }

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: null,
      });

      this.territoriosNivel1 = territorios || [];
      this.renderColumna1();
      if (btnAdd1 && isAdmin) btnAdd1.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 1:', error);
      list1.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna1() {
    const list = this.querySelector('#listNivel1');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel1.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    const isAdmin = AuthService.isAdmin();

    this.territoriosNivel1.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'pointer';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t ${isAdmin ? '' : 'd-none'}" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t ${isAdmin ? '' : 'd-none'}" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
          <i class="bi bi-chevron-right text-muted ms-1"></i>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        
        list.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-item'));
        item.classList.add('active-item');

        this.selectedNivel1Id = t.id;
        this.selectedNivel2Id = null;
        this.cargarTerritoriosColumna2();
      });

      if (isAdmin) {
        item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(1, t));
        item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 1));
      }

      list.appendChild(item);
    });
  }

  async cargarTerritoriosColumna2() {
    const list2 = this.querySelector('#listNivel2');
    const list3 = this.querySelector('#listNivel3');
    const btnAdd2 = this.querySelector('#btnAddNivel2');
    const btnAdd3 = this.querySelector('#btnAddNivel3');
    const isAdmin = AuthService.isAdmin();

    list2.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    list3.innerHTML = '<div class="text-center py-4 text-muted small">Selecciona un elemento del Nivel 2</div>';

    if (btnAdd2 && isAdmin) btnAdd2.classList.add('d-none');
    if (btnAdd3 && isAdmin) btnAdd3.classList.add('d-none');

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: this.selectedNivel1Id,
      });

      this.territoriosNivel2 = territorios || [];
      this.renderColumna2();
      if (btnAdd2 && isAdmin) btnAdd2.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 2:', error);
      list2.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna2() {
    const list = this.querySelector('#listNivel2');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel2.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    const isAdmin = AuthService.isAdmin();

    this.territoriosNivel2.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'pointer';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t ${isAdmin ? '' : 'd-none'}" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t ${isAdmin ? '' : 'd-none'}" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
          <i class="bi bi-chevron-right text-muted ms-1"></i>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        
        list.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-item'));
        item.classList.add('active-item');

        this.selectedNivel2Id = t.id;
        this.cargarTerritoriosColumna3();
      });

      if (isAdmin) {
        item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(2, t));
        item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 2));
      }

      list.appendChild(item);
    });
  }

  async cargarTerritoriosColumna3() {
    const list3 = this.querySelector('#listNivel3');
    const btnAdd3 = this.querySelector('#btnAddNivel3');
    const isAdmin = AuthService.isAdmin();

    list3.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
    if (btnAdd3 && isAdmin) btnAdd3.classList.add('d-none');

    try {
      const territorios = await UbicacionesService.getTerritorios({
        pais_id: this.selectedPaisId,
        parent_id: this.selectedNivel2Id,
      });

      this.territoriosNivel3 = territorios || [];
      this.renderColumna3();
      if (btnAdd3 && isAdmin) btnAdd3.classList.remove('d-none');
    } catch (error) {
      console.error('Error al cargar Nivel 3:', error);
      list3.innerHTML = `<div class="text-center py-4 text-danger small">Error: ${error.message}</div>`;
    }
  }

  renderColumna3() {
    const list = this.querySelector('#listNivel3');
    if (!list) return;
    list.innerHTML = '';

    if (this.territoriosNivel3.length === 0) {
      list.innerHTML = '<div class="text-center py-4 text-muted small">No hay territorios en este nivel.</div>';
      return;
    }

    const isAdmin = AuthService.isAdmin();

    this.territoriosNivel3.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3';
      item.style.cursor = 'default';
      item.setAttribute('data-id', t.id);

      const labelText = t.tipo ? `<span class="badge bg-secondary-soft text-secondary rounded-pill me-1 small">${t.tipo}</span>` : '';
      const activeText = t.activo ? '' : ' <span class="text-danger small">(Inactivo)</span>';

      item.innerHTML = `
        <div class="text-truncate flex-grow-1">
          ${labelText} <span class="fw-medium text-dark">${t.nombre}</span>${activeText}
        </div>
        <div class="actions-container ms-2 d-flex gap-1">
          <button class="btn btn-xs btn-light btn-edit-t ${isAdmin ? '' : 'd-none'}" title="Editar"><i class="bi bi-pencil-square text-primary"></i></button>
          <button class="btn btn-xs btn-light btn-delete-t ${isAdmin ? '' : 'd-none'}" title="Eliminar"><i class="bi bi-trash text-danger"></i></button>
        </div>
      `;

      if (isAdmin) {
        item.querySelector('.btn-edit-t').addEventListener('click', () => this.abrirModalTerritorio(3, t));
        item.querySelector('.btn-delete-t').addEventListener('click', () => this.eliminarTerritorio(t.id, t.nombre, 3));
      }

      list.appendChild(item);
    });
  }

  abrirModalTerritorio(columnaNivel, territorio = null) {
    const modalTitle = this.querySelector('#territorioModalLabel');
    const form = this.querySelector('#territorioForm');
    const inputId = this.querySelector('#territorioId');
    const inputParentId = this.querySelector('#territorioParentId');
    const inputPaisId = this.querySelector('#territorioPaisId');
    const inputNombre = this.querySelector('#territorioNombre');
    const inputTipo = this.querySelector('#territorioTipo');
    const inputActivo = this.querySelector('#territorioActivo');
    const contextLabel = this.querySelector('#territorioContextLabel');
    const errorAlert = this.querySelector('#territorioModalErrorAlert');

    errorAlert.classList.add('d-none');
    form.classList.remove('was-validated');

    inputPaisId.value = this.selectedPaisId;

    let parentName = '';
    const paisNombre = this.paisesList.find(p => p.id == this.selectedPaisId)?.nombre || 'País';

    if (columnaNivel === 1) {
      inputParentId.value = '';
      parentName = `Raíz de ${paisNombre}`;
      inputTipo.placeholder = 'Ej: Departamento, Estado';
    } else if (columnaNivel === 2) {
      inputParentId.value = this.selectedNivel1Id;
      const parentObj = this.territoriosNivel1.find(t => t.id == this.selectedNivel1Id);
      parentName = `${paisNombre} > ${parentObj?.nombre || 'Nivel 1'}`;
      inputTipo.placeholder = 'Ej: Provincia, Municipio';
    } else if (columnaNivel === 3) {
      inputParentId.value = this.selectedNivel2Id;
      const parentObj1 = this.territoriosNivel1.find(t => t.id == this.selectedNivel1Id);
      const parentObj2 = this.territoriosNivel2.find(t => t.id == this.selectedNivel2Id);
      parentName = `${paisNombre} > ${parentObj1?.nombre || 'Nivel 1'} > ${parentObj2?.nombre || 'Nivel 2'}`;
      inputTipo.placeholder = 'Ej: Distrito, Alcaldía, Localidad';
    }

    contextLabel.textContent = parentName;

    if (territorio) {
      modalTitle.textContent = 'Editar Territorio';
      inputId.value = territorio.id;
      inputNombre.value = territorio.nombre;
      inputTipo.value = territorio.tipo;
      inputActivo.checked = territorio.activo;
    } else {
      modalTitle.textContent = 'Nuevo Territorio';
      inputId.value = '';
      inputNombre.value = '';
      inputTipo.value = '';
      inputActivo.checked = true;
    }

    this.territorioModalObj.show();
  }

  async guardarTerritorio(e) {
    e.preventDefault();
    const form = this.querySelector('#territorioForm');
    const errorAlert = this.querySelector('#territorioModalErrorAlert');
    const errorMessage = this.querySelector('#territorioModalErrorMessage');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = this.querySelector('#territorioId').value;
    const parentId = this.querySelector('#territorioParentId').value;
    
    const payload = {
      pais_id: parseInt(this.querySelector('#territorioPaisId').value),
      parent_id: parentId ? parseInt(parentId) : null,
      nombre: this.querySelector('#territorioNombre').value,
      tipo: this.querySelector('#territorioTipo').value,
      activo: this.querySelector('#territorioActivo').checked,
    };

    try {
      if (id) {
        await UbicacionesService.updateTerritorio(id, payload);
        this.mostrarAlertaLocal('success', 'Territorio actualizado con éxito.');
      } else {
        await UbicacionesService.createTerritorio(payload);
        this.mostrarAlertaLocal('success', 'Territorio creado con éxito.');
      }

      this.territorioModalObj.hide();
      
      if (!parentId) {
        await this.cargarTerritoriosColumna1();
      } else if (parentId == this.selectedNivel1Id) {
        await this.cargarTerritoriosColumna2();
      } else if (parentId == this.selectedNivel2Id) {
        await this.cargarTerritoriosColumna3();
      }
      
      // Dispatch event to notify addresses component that territories might have changed
      this.dispatchEvent(new CustomEvent('territorios-updated', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error al guardar territorio:', error);
      errorAlert.classList.remove('d-none');
      errorMessage.textContent = error.message || 'Error al guardar el registro.';
    }
  }

  async eliminarTerritorio(id, nombre, columnaNivel) {
    if (!confirm(`¿Está seguro de que desea eliminar el territorio "${nombre}"? Se comprobará que no tenga sub-elementos o direcciones asociadas.`)) return;

    try {
      await UbicacionesService.deleteTerritorio(id);
      this.mostrarAlertaLocal('success', `Territorio "${nombre}" eliminado con éxito.`);
      
      if (columnaNivel === 1) {
        this.selectedNivel1Id = null;
        this.selectedNivel2Id = null;
        await this.cargarTerritoriosColumna1();
      } else if (columnaNivel === 2) {
        this.selectedNivel2Id = null;
        await this.cargarTerritoriosColumna2();
      } else if (columnaNivel === 3) {
        await this.cargarTerritoriosColumna3();
      }

      this.dispatchEvent(new CustomEvent('territorios-updated', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error al eliminar territorio:', error);
      this.mostrarAlertaLocal('error', `No se pudo eliminar: ${error.message}`);
    }
  }

  mostrarAlertaLocal(tipo, mensaje) {
    const successAlert = this.querySelector('#territoriosSuccessAlert');
    const successMsg = this.querySelector('#territoriosSuccessMessage');
    const errorAlert = this.querySelector('#territoriosErrorAlert');
    const errorMsg = this.querySelector('#territoriosErrorMessage');

    if (tipo === 'success') {
      errorAlert.classList.add('d-none');
      successMsg.textContent = mensaje;
      successAlert.classList.remove('d-none');
      setTimeout(() => successAlert.classList.add('d-none'), 5000);
    } else {
      successAlert.classList.add('d-none');
      errorMsg.textContent = mensaje;
      errorAlert.classList.remove('d-none');
      setTimeout(() => errorAlert.classList.add('d-none'), 6000);
    }
  }
}

customElements.define('app-ubicaciones-territorios', UbicacionesTerritoriosComponent);
