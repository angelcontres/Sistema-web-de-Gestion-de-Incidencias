export class IncidentSupportInstitutionsHelper {
  constructor(component) {
    this.component = component;
    
    // UI Elements
    this.btnEditApoyoForm = component.querySelector('#btn-edit-apoyo-form');
    this.btnSaveApoyoForm = component.querySelector('#btn-save-apoyo-form');
    this.containerModalApoyoForm = component.querySelector('#container-modal-apoyo-form');
    this.listInstitucionesApoyoForm = component.querySelector('#list-instituciones-apoyo-form');
    this.institucionesApoyoSelect = component.querySelector('#institucionesApoyoSelect');
  }

  initEvents() {
    if (this.btnEditApoyoForm) {
      this.btnEditApoyoForm.addEventListener('click', () => {
        if (!this.containerModalApoyoForm) return;
        const modalEl = this.component.querySelector('#modalApoyoForm');
        if (modalEl) {
          const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      });
    }

    if (this.btnSaveApoyoForm) {
      this.btnSaveApoyoForm.addEventListener('click', () => {
        if (!this.containerModalApoyoForm || !this.institucionesApoyoSelect) return;
        const selectedIds = Array.from(this.containerModalApoyoForm.querySelectorAll('.chk-apoyo:checked')).map(chk => chk.value);
        Array.from(this.institucionesApoyoSelect.options).forEach(opt => {
          opt.selected = selectedIds.includes(opt.value);
        });
        
        this.actualizarBadgesApoyoForm();
        
        const modalEl = this.component.querySelector('#modalApoyoForm');
        if (modalEl) {
          const modal = window.bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
      });
    }
  }

  actualizarBadgesApoyoForm() {
    if (!this.listInstitucionesApoyoForm || !this.institucionesApoyoSelect) return;
    const selectedOptions = Array.from(this.institucionesApoyoSelect.selectedOptions);
    if (selectedOptions.length > 0) {
      this.listInstitucionesApoyoForm.innerHTML = selectedOptions.map(opt => 
        `<span class="badge bg-secondary-soft text-secondary border border-secondary-subtle fw-medium">${opt.text.split('(')[0].trim()}</span>`
      ).join('');
    } else {
      this.listInstitucionesApoyoForm.innerHTML = '<span class="text-muted small fst-italic">Ninguna asignada</span>';
    }
  }

  renderInstitucionesCheckboxes(insts) {
    if (!this.containerModalApoyoForm) return;
    this.containerModalApoyoForm.innerHTML =
      insts.map((i) => `
        <label class="list-group-item d-flex gap-3 align-items-center cursor-pointer p-3" style="cursor: pointer;" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
          <input class="form-check-input flex-shrink-0 chk-apoyo" type="checkbox" value="${i.id}" style="font-size: 1.3em;">
          <span class="pt-1 form-checked-content">
            <strong>${i.nombre}</strong>
            <span class="d-block text-muted small">${i.siglas}</span>
          </span>
        </label>
      `).join('');
  }

  setSelectedInstitutions(supportIds) {
    if (this.institucionesApoyoSelect) {
      Array.from(this.institucionesApoyoSelect.options).forEach((opt) => {
        opt.selected = supportIds.includes(opt.value);
      });
    }
    if (this.containerModalApoyoForm) {
      Array.from(this.containerModalApoyoForm.querySelectorAll('.chk-apoyo')).forEach((chk) => {
        chk.checked = supportIds.includes(chk.value);
      });
    }
    this.actualizarBadgesApoyoForm();
  }

  getSelectedInstitutionsIds() {
    if (!this.institucionesApoyoSelect) return [];
    return Array.from(this.institucionesApoyoSelect.selectedOptions).map(opt => parseInt(opt.value));
  }
}
