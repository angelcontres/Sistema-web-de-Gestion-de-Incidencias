import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidentMobileUIHelper } from './incident-mobile-ui.helper.js';

describe('IncidentMobileUIHelper', () => {
  let mockComponent;
  let helper;

  beforeEach(() => {
    // Setup mock DOM for component
    document.body.innerHTML = `
      <div id="step1"><span class="step-title">Step 1</span><div class="card-step"></div><div id="check1" class="d-none"></div></div>
      <div id="step2"><span class="step-title">Step 2</span><div class="card-step"></div><div id="check2" class="d-none"></div></div>
      <div class="step-header"></div>
      <div class="step-header"></div>
      <div id="mobile-categories-container"></div>
      <div id="mobile-subcategories-container"></div>
      <div id="subCategoryBlock" class="d-none"></div>
      <input id="descripcion" value="" />
      <input id="dirDetalle" value="" />
      <input id="fileInput" type="file" />
      <div id="mobilePhotoPreview" class="d-none"></div>
      <button id="btnSubmit" disabled></button>
    `;

    mockComponent = {
      querySelector: (sel) => document.querySelector(sel),
      querySelectorAll: (sel) => document.querySelectorAll(sel),
      categoryManager: {
        categorias: [
          { id: 1, nombre: 'Root1', parent_id: null, activo: true },
          { id: 2, nombre: 'Sub1', parent_id: 1, activo: true },
        ],
        tipoSelect: { value: '' },
        subTipoSelect: { value: '' },
        onCategoryChange: jest.fn(),
        onSubCategoryChange: jest.fn(),
      },
      mapController: {
        habilitarMapaInteractivo: jest.fn(),
        map: {
          on: jest.fn(),
        },
        marker: {
          on: jest.fn(),
        },
      },
      mediaUploader: {
        files: [],
      }
    };

    helper = new IncidentMobileUIHelper(mockComponent);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initMobileUI', () => {
    it('should initialize all UI components', () => {
      jest.spyOn(helper, '_injectFeedbackElements');
      jest.spyOn(helper, '_initAccordionHeaders');
      jest.spyOn(helper, '_renderRootCategories');
      jest.spyOn(helper, '_initLocationLogic');
      jest.spyOn(helper, '_initComposeBar');
      jest.spyOn(helper, '_initFileInput');

      helper.initMobileUI();

      expect(helper._injectFeedbackElements).toHaveBeenCalled();
      expect(helper._initAccordionHeaders).toHaveBeenCalled();
      expect(helper._renderRootCategories).toHaveBeenCalled();
      expect(helper._initLocationLogic).toHaveBeenCalled();
      expect(helper._initComposeBar).toHaveBeenCalled();
      expect(helper._initFileInput).toHaveBeenCalled();
    });
  });

  describe('_injectFeedbackElements', () => {
    it('should inject feedback elements for steps', () => {
      helper._injectFeedbackElements();
      
      const fb1 = document.querySelector('#feedback-step1');
      const fb2 = document.querySelector('#feedback-step2');
      
      expect(fb1).not.toBeNull();
      expect(fb2).not.toBeNull();
      expect(fb1.classList.contains('text-muted')).toBe(true);
    });
  });

  describe('_initAccordionHeaders', () => {
    it('should attach click events to accordion headers', () => {
      helper._initAccordionHeaders();
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});

      const headers = document.querySelectorAll('.step-header');
      headers[0].dispatchEvent(new Event('click'));

      const steps = document.querySelectorAll('.card-step');
      expect(steps[0].classList.contains('active')).toBe(true);
      expect(steps[1].classList.contains('active')).toBe(false);
      expect(helper.checkMobileReadyState).toHaveBeenCalled();
    });
  });

  describe('_renderRootCategories', () => {
    it('should render root categories as chips and handle click', () => {
      jest.spyOn(helper, 'renderMobileSubCategories').mockImplementation(() => {});
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});

      helper._renderRootCategories();

      const chips = document.querySelectorAll('.wa-chip');
      expect(chips.length).toBe(1);
      expect(chips[0].textContent).toBe('Root1');

      chips[0].dispatchEvent(new Event('click'));

      expect(chips[0].classList.contains('active')).toBe(true);
      expect(mockComponent.categoryManager.tipoSelect.value).toBe('1');
      expect(mockComponent.categoryManager.onCategoryChange).toHaveBeenCalled();
      expect(helper.renderMobileSubCategories).toHaveBeenCalled();
      expect(helper.checkMobileReadyState).toHaveBeenCalled();
    });
  });

  describe('renderMobileSubCategories', () => {
    it('should render subcategories when parent is selected', () => {
      mockComponent.categoryManager.tipoSelect.value = 1;
      jest.spyOn(helper, 'markStepCompleted').mockImplementation(() => {});
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});

      helper.renderMobileSubCategories();

      const subBlock = document.querySelector('#subCategoryBlock');
      expect(subBlock.classList.contains('d-none')).toBe(false);

      const radios = document.querySelectorAll('.wa-subcat-radio');
      expect(radios.length).toBe(1);

      radios[0].dispatchEvent(new Event('change'));

      expect(mockComponent.categoryManager.subTipoSelect.value).toBe('2');
      expect(mockComponent.categoryManager.onSubCategoryChange).toHaveBeenCalled();
      expect(helper.markStepCompleted).toHaveBeenCalledWith(1);
      expect(helper.checkMobileReadyState).toHaveBeenCalled();
    });

    it('should hide subcategories block if none exist', () => {
      mockComponent.categoryManager.tipoSelect.value = 999;
      jest.spyOn(helper, 'markStepCompleted').mockImplementation(() => {});
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});

      helper.renderMobileSubCategories();

      const subBlock = document.querySelector('#subCategoryBlock');
      expect(subBlock.classList.contains('d-none')).toBe(true);
      expect(helper.markStepCompleted).toHaveBeenCalledWith(1);
      expect(helper.checkMobileReadyState).toHaveBeenCalled();
    });
  });

  describe('_initComposeBar', () => {
    it('should attach input listeners', () => {
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});
      helper._initComposeBar();

      const descInput = document.querySelector('#descripcion');
      const dirDetalle = document.querySelector('#dirDetalle');

      descInput.dispatchEvent(new Event('input'));
      dirDetalle.dispatchEvent(new Event('input'));

      expect(helper.checkMobileReadyState).toHaveBeenCalledTimes(2);
    });
  });

  describe('_initFileInput', () => {
    it('should toggle preview visibility on file input change', () => {
      jest.spyOn(helper, 'checkMobileReadyState').mockImplementation(() => {});
      helper._initFileInput();

      const fileInput = document.querySelector('#fileInput');
      const preview = document.querySelector('#mobilePhotoPreview');

      // Mock files
      Object.defineProperty(fileInput, 'files', { value: [new File([], 'test.jpg')], configurable: true });
      fileInput.dispatchEvent(new Event('change'));

      expect(preview.classList.contains('d-none')).toBe(false);
      expect(helper.checkMobileReadyState).toHaveBeenCalled();

      // Mock empty files
      Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
      fileInput.dispatchEvent(new Event('change'));

      expect(preview.classList.contains('d-none')).toBe(true);
    });
  });

  describe('markStepCompleted', () => {
    it('should add completed classes to step and show check', () => {
      helper.markStepCompleted(1);

      const step1 = document.querySelector('#step1');
      const check1 = document.querySelector('#check1');
      const step2Card = document.querySelectorAll('.card-step')[1];

      expect(step1.classList.contains('completed')).toBe(true);
      expect(check1.classList.contains('d-none')).toBe(false);
      expect(step2Card.classList.contains('active')).toBe(true);
    });
  });

  describe('checkMobileReadyState', () => {
    it('should evaluate form state and update UI', () => {
      // Mock inner methods
      jest.spyOn(helper, '_getMobileFormState').mockReturnValue({
        step1Done: true, step2Done: true, hasDesc: true, hasPhoto: false
      });
      jest.spyOn(helper, '_updateStep1Feedback').mockImplementation(() => {});
      jest.spyOn(helper, '_updateStep2Feedback').mockImplementation(() => {});
      jest.spyOn(helper, '_updateSubmitButtonState').mockImplementation(() => {});

      helper.checkMobileReadyState();

      expect(helper._getMobileFormState).toHaveBeenCalled();
      expect(helper._updateStep1Feedback).toHaveBeenCalled();
      expect(helper._updateStep2Feedback).toHaveBeenCalled();
      expect(helper._updateSubmitButtonState).toHaveBeenCalledWith({
        step1Done: true, step2Done: true, hasDesc: true, hasPhoto: false
      });
    });
  });

  describe('_updateSubmitButtonState', () => {
    it('should enable submit button if conditions met', () => {
      const btn = document.querySelector('#btnSubmit');
      
      helper._updateSubmitButtonState({ step1Done: true, step2Done: true, hasDesc: true, hasPhoto: false });
      
      expect(btn.classList.contains('ready')).toBe(true);
      expect(btn.disabled).toBe(false);
    });

    it('should disable submit button if conditions not met', () => {
      const btn = document.querySelector('#btnSubmit');
      btn.classList.add('ready');
      btn.disabled = false;
      
      helper._updateSubmitButtonState({ step1Done: true, step2Done: false, hasDesc: true, hasPhoto: false });
      
      expect(btn.classList.contains('ready')).toBe(false);
      expect(btn.disabled).toBe(true);
    });
  });

  describe('_updateStep1Feedback', () => {
    it('should update feedback string', () => {
      // Setup mock chips and radio
      const rootChip = document.createElement('div');
      rootChip.className = 'wa-chip active';
      rootChip.textContent = 'RootName';
      document.body.appendChild(rootChip);

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.className = 'wa-subcat-radio';
      radio.checked = true;
      const label = document.createElement('span');
      label.textContent = 'SubCatName';
      
      const container = document.createElement('div');
      container.appendChild(radio);
      container.appendChild(label);
      document.body.appendChild(container);

      helper._updateStep1Feedback();

      const title1 = document.querySelector('#step1 .step-title');
      const fb = title1.querySelector('.fb-inline');
      
      expect(fb).not.toBeNull();
      expect(fb.innerHTML).toContain('Categoría: RootName » SubCatName');
    });
  });

  describe('_updateStep2Feedback', () => {
    it('should update location feedback string', () => {
      const title2 = document.querySelector('#step2 .step-title');
      const dirDetalle = document.querySelector('#dirDetalle');
      dirDetalle.value = 'My location';
      
      helper._updateStep2Feedback();

      const fb = title2.querySelector('.fb-inline');
      expect(fb).not.toBeNull();
      expect(fb.innerHTML).toContain('Ubicación: My location');
    });
  });

});
