export class IncidentMobileUIHelper {
  constructor(component) {
    this.component = component;
  }

  initMobileUI() {
    // 0. Inyectar dinámicamente el feedback para saltarse problemas de caché HTML del navegador
    ['step1', 'step2'].forEach(stepId => {
      const fbId = `feedback-${stepId}`;
      if (!this.component.querySelector(`#${fbId}`)) {
        const titleSpan = this.component.querySelector(`#${stepId} .step-title`);
        if (titleSpan) {
          const wrapper = document.createElement('div');
          wrapper.className = 'd-flex flex-column';
          titleSpan.parentNode.insertBefore(wrapper, titleSpan);
          wrapper.appendChild(titleSpan);
          const small = document.createElement('small');
          small.id = fbId;
          small.className = 'text-muted fw-normal ms-4 mt-1 d-none';
          wrapper.appendChild(small);
        }
      }
    });

    // Accordion headers click to reopen
    const stepHeaders = this.component.querySelectorAll('.step-header');
    stepHeaders.forEach((header, index) => {
      header.addEventListener('click', () => {
        const stepNum = index + 1;
        this.component.querySelectorAll('.card-step').forEach((el, i) => {
          if (i + 1 === stepNum) el.classList.add('active');
          else el.classList.remove('active');
        });
        this.checkMobileReadyState();
      });
    });

    // 1. Render root categories as chips
    const rootCategories = this.component.categoryManager.categorias.filter((c) => c.parent_id === null && c.activo);
    const catContainer = this.component.querySelector('#mobile-categories-container');
    if (catContainer) {
      catContainer.innerHTML = rootCategories.map((c) => 
        `<button type="button" class="wa-chip" data-id="${c.id}">${c.nombre}</button>`
      ).join('');
      
      catContainer.querySelectorAll('.wa-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          catContainer.querySelectorAll('.wa-chip').forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');
          
          // Sync hidden select
          this.component.categoryManager.tipoSelect.value = e.target.dataset.id;
          this.component.categoryManager.onCategoryChange();
          
          this.renderMobileSubCategories();
          this.checkMobileReadyState();
        });
      });
    }

    // 2. Location Logic (Card 2)
    setTimeout(() => {
      this.component.mapController.habilitarMapaInteractivo();
      
      if (this.component.mapController.map) {
        this.component.mapController.map.on('click', () => {
          this.markStepCompleted(2);
          this.checkMobileReadyState();
        });
      }
      if (this.component.mapController.marker) {
        this.component.mapController.marker.on('dragend', () => {
          this.markStepCompleted(2);
          this.checkMobileReadyState();
        });
      }
    }, 500);

    // 3. Compose Bar Logic & Reference Input
    const descInput = this.component.querySelector('#descripcion');
    if (descInput) {
      descInput.addEventListener('input', () => this.checkMobileReadyState());
    }
    const dirDetalle = this.component.querySelector('#dirDetalle');
    if (dirDetalle) {
      dirDetalle.addEventListener('input', () => this.checkMobileReadyState());
    }

    // 4. File Input Link
    const fileInput = this.component.querySelector('#fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const previewDiv = this.component.querySelector('#mobilePhotoPreview');
        if (previewDiv) {
           if (fileInput.files.length > 0) {
             previewDiv.classList.remove('d-none');
           } else {
             previewDiv.classList.add('d-none');
           }
        }
        this.checkMobileReadyState();
      });
    }
  }

  renderMobileSubCategories() {
    const parentId = this.component.categoryManager.tipoSelect.value;
    const subCats = this.component.categoryManager.categorias.filter((c) => c.parent_id == parentId && c.activo);
    
    const subContainer = this.component.querySelector('#mobile-subcategories-container');
    const subBlock = this.component.querySelector('#subCategoryBlock');
    
    if (subCats.length > 0) {
      subBlock.classList.remove('d-none');
      subContainer.className = 'w-100'; // Remove old flex classes
      subContainer.innerHTML = `<div class="list-group shadow-sm rounded-3 overflow-hidden">` + 
        subCats.map((c) => 
        `<label class="list-group-item d-flex gap-3 align-items-center p-3 border-0 border-bottom" style="cursor:pointer; background-color: white;">
           <input class="form-check-input flex-shrink-0 wa-subcat-radio m-0" type="radio" name="mobileSubcat" value="${c.id}" style="font-size: 1.2rem;">
           <span class="fw-medium text-dark">${c.nombre}</span>
         </label>`
        ).join('') + `</div>`;
      
      subContainer.querySelectorAll('.wa-subcat-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.component.categoryManager.subTipoSelect.value = e.target.value;
          this.component.categoryManager.onSubCategoryChange();
          
          this.markStepCompleted(1);
          this.checkMobileReadyState();
        });
      });
    } else {
      subBlock.classList.add('d-none');
      this.markStepCompleted(1);
      this.checkMobileReadyState();
    }
  }

  markStepCompleted(step) {
    const stepEl = this.component.querySelector(`#step${step}`);
    const checkEl = this.component.querySelector(`#check${step}`);
    if (stepEl && checkEl) {
      stepEl.classList.add('completed');
      checkEl.classList.remove('d-none');
      
      const nextStep = step + 1;
      const allSteps = this.component.querySelectorAll('.card-step');
      allSteps.forEach((el, index) => {
        if (index + 1 === nextStep) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }
  }

  checkMobileReadyState() {
    const step1Done = this.component.querySelector('.wa-subcat-radio:checked') !== null;
    const step2Done = (this.component.querySelector('#dirDetalle')?.value || '').trim().length > 0 || this.component.querySelector('#step2').classList.contains('completed');
    const hasDesc = (this.component.querySelector('#descripcion').value || '').trim().length > 0;
    const hasPhoto = this.component.querySelector('#fileInput')?.files?.length > 0 || (this.component.mediaUploader && this.component.mediaUploader.files && this.component.mediaUploader.files.length > 0);
    
    // Update Feedback UI for Step 1 inline inside the title!
    const title1 = this.component.querySelector('#step1 .step-title');
    if (title1) {
      const rootName = this.component.querySelector('.wa-chip.active')?.textContent;
      const subRadio = this.component.querySelector('.wa-subcat-radio:checked');
      
      let oldFb = title1.querySelector('.fb-inline');
      if (oldFb) oldFb.remove();
      
      if (rootName && subRadio) {
        const fbSpan = document.createElement('span');
        fbSpan.className = 'fb-inline ms-2 text-primary fw-normal fs-6 d-block mt-1';
        fbSpan.innerHTML = `Categoría: ${rootName} &raquo; ${subRadio.nextElementSibling.textContent}`;
        title1.appendChild(fbSpan);
      }
    }

    // Update Feedback UI for Step 2 inline inside the title!
    const title2 = this.component.querySelector('#step2 .step-title');
    if (title2) {
      let locText = this.component.querySelector('#dirDetalle')?.value.trim();
      let oldFb = title2.querySelector('.fb-inline');
      if (oldFb) oldFb.remove();
      
      if (locText || (this.component.mapController && this.component.mapController.marker)) {
        if (!locText) locText = "Fijada en el mapa";
        const fbSpan = document.createElement('span');
        fbSpan.className = 'fb-inline ms-2 text-primary fw-normal fs-6 d-block mt-1';
        fbSpan.innerHTML = `Ubicación: ${locText}`;
        title2.appendChild(fbSpan);
      }
    }

    const btnSubmit = this.component.querySelector('#btnSubmit');
    if (btnSubmit) {
      if (step1Done && step2Done && (hasDesc || hasPhoto)) {
        btnSubmit.classList.add('ready');
        btnSubmit.disabled = false;
      } else {
        btnSubmit.classList.remove('ready');
        btnSubmit.disabled = true;
      }
    }
  }
}
