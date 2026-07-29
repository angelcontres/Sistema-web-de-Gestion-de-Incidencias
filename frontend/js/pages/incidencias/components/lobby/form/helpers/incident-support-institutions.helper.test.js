import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidentSupportInstitutionsHelper } from './incident-support-institutions.helper.js';

describe('IncidentSupportInstitutionsHelper', () => {
  let mockComponent;
  let helper;
  let mockModalInstance;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btn-edit-apoyo-form"></button>
      <button id="btn-save-apoyo-form"></button>
      <div id="container-modal-apoyo-form"></div>
      <div id="list-instituciones-apoyo-form"></div>
      <select id="institucionesApoyoSelect" multiple>
        <option value="1">Inst 1 (INS1)</option>
        <option value="2">Inst 2 (INS2)</option>
      </select>
      <div id="modalApoyoForm"></div>
    `;

    mockComponent = {
      querySelector: (sel) => document.querySelector(sel)
    };

    mockModalInstance = {
      show: jest.fn(),
      hide: jest.fn()
    };

    window.bootstrap = {
      Modal: {
        getOrCreateInstance: jest.fn().mockReturnValue(mockModalInstance),
        getInstance: jest.fn().mockReturnValue(mockModalInstance)
      }
    };

    helper = new IncidentSupportInstitutionsHelper(mockComponent);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initEvents', () => {
    it('should attach click events to buttons', () => {
      jest.spyOn(helper, '_handleEditClick').mockImplementation(() => {});
      jest.spyOn(helper, '_handleSaveClick').mockImplementation(() => {});

      helper.initEvents();

      const btnEdit = document.querySelector('#btn-edit-apoyo-form');
      const btnSave = document.querySelector('#btn-save-apoyo-form');

      btnEdit.dispatchEvent(new Event('click'));
      btnSave.dispatchEvent(new Event('click'));

      expect(helper._handleEditClick).toHaveBeenCalled();
      expect(helper._handleSaveClick).toHaveBeenCalled();
    });
  });

  describe('_handleEditClick', () => {
    it('should show the modal if elements exist', () => {
      helper._handleEditClick();

      expect(window.bootstrap.Modal.getOrCreateInstance).toHaveBeenCalledWith(document.querySelector('#modalApoyoForm'));
      expect(mockModalInstance.show).toHaveBeenCalled();
    });
  });

  describe('_handleSaveClick', () => {
    it('should sync selections from checkboxes to select and hide modal', () => {
      jest.spyOn(helper, 'actualizarBadgesApoyoForm').mockImplementation(() => {});

      document.querySelector('#container-modal-apoyo-form').innerHTML = `
        <input type="checkbox" class="chk-apoyo" value="1" checked />
        <input type="checkbox" class="chk-apoyo" value="2" />
      `;

      helper._handleSaveClick();

      const select = document.querySelector('#institucionesApoyoSelect');
      expect(select.options[0].selected).toBe(true);
      expect(select.options[1].selected).toBe(false);

      expect(helper.actualizarBadgesApoyoForm).toHaveBeenCalled();
      expect(window.bootstrap.Modal.getInstance).toHaveBeenCalledWith(document.querySelector('#modalApoyoForm'));
      expect(mockModalInstance.hide).toHaveBeenCalled();
    });
  });

  describe('actualizarBadgesApoyoForm', () => {
    it('should render badges for selected options', () => {
      const select = document.querySelector('#institucionesApoyoSelect');
      select.options[0].selected = true; // Inst 1 (INS1)

      helper.actualizarBadgesApoyoForm();

      const list = document.querySelector('#list-instituciones-apoyo-form');
      expect(list.innerHTML).toContain('Inst 1');
      expect(list.innerHTML).not.toContain('Inst 2');
    });

    it('should render empty state if none selected', () => {
      helper.actualizarBadgesApoyoForm();

      const list = document.querySelector('#list-instituciones-apoyo-form');
      expect(list.innerHTML).toContain('Ninguna asignada');
    });
  });

  describe('renderInstitucionesCheckboxes', () => {
    it('should render checkboxes in container', () => {
      const insts = [
        { id: 10, nombre: 'Test1', siglas: 'T1' },
        { id: 20, nombre: 'Test2', siglas: 'T2' }
      ];

      helper.renderInstitucionesCheckboxes(insts);

      const container = document.querySelector('#container-modal-apoyo-form');
      const checkboxes = container.querySelectorAll('.chk-apoyo');
      
      expect(checkboxes.length).toBe(2);
      expect(checkboxes[0].value).toBe('10');
      expect(checkboxes[1].value).toBe('20');
      expect(container.innerHTML).toContain('Test1');
      expect(container.innerHTML).toContain('T1');
    });
  });

  describe('setSelectedInstitutions', () => {
    it('should update select and checkboxes then update badges', () => {
      jest.spyOn(helper, 'actualizarBadgesApoyoForm').mockImplementation(() => {});
      
      document.querySelector('#container-modal-apoyo-form').innerHTML = `
        <input type="checkbox" class="chk-apoyo" value="1" />
        <input type="checkbox" class="chk-apoyo" value="2" />
      `;

      helper.setSelectedInstitutions(['2']);

      const select = document.querySelector('#institucionesApoyoSelect');
      const checkboxes = document.querySelectorAll('.chk-apoyo');

      expect(select.options[0].selected).toBe(false);
      expect(select.options[1].selected).toBe(true);

      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);

      expect(helper.actualizarBadgesApoyoForm).toHaveBeenCalled();
    });
  });

  describe('getSelectedInstitutionsIds', () => {
    it('should return array of parsed ints of selected options', () => {
      const select = document.querySelector('#institucionesApoyoSelect');
      select.options[1].selected = true;

      const result = helper.getSelectedInstitutionsIds();

      expect(result).toEqual([2]);
    });
  });

});
