import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IncidentFormStateHelper } from './incident-form-state.helper.js';
import { IncidenciaService } from '../../../../services/incidencia.service.js';
import { ToastService } from '../../../../../../shared/services/toast.service.js';
import { AuthService } from '../../../../../../core/auth.service.js';
import { ModalService } from '../../../../../../shared/services/modal.service.js';

describe('IncidentFormStateHelper', () => {
  let mockComponent;
  let helper;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="formTitle"></div>
      <button id="btnConfirmarResolucion" class="d-none"></button>
      <button id="btnSubmit"></button>
      <div id="direccionSearch"></div>
      <button id="btnBuscarDireccion"></button>
      <div id="dropzoneContainer"></div>
      <span class="text-muted small mt-1.5">Drag here</span>
      <input class="test-input" />
      <select class="test-select"></select>
      <textarea class="test-textarea"></textarea>
      <div id="loadingSpinner" class="d-none"></div>
    `;

    mockComponent = {
      querySelector: (sel) => document.querySelector(sel),
      querySelectorAll: (sel) => document.querySelectorAll(sel),
      formTitle: document.createElement('div'),
      btnText: document.createElement('div'),
      incidenciaIdInput: { value: '' },
      versionInput: { value: '' },
      descripcionInput: { value: '' },
      institucionSelect: { value: '' },
      estadoSelect: { value: '' },
      btnConfirmarResolucion: document.querySelector('#btnConfirmarResolucion'),
      btnSubmit: document.querySelector('#btnSubmit'),
      locationManager: {
        dirPaisSelect: { value: '', disabled: false },
        actualizarEtiquetasNiveles: jest.fn(),
        cargarDropdownNivel1: jest.fn(),
        cargarDropdownNivel2: jest.fn(),
        cargarDropdownNivel3: jest.fn(),
        actualizarIndicadorMinimalista: jest.fn(),
        dirDetalleInput: { value: '' },
        currentPostalCode: '',
        selectedDireccionId: '',
      },
      mapController: {
        centerMap: jest.fn(),
        setCoordsAndCenter: jest.fn(),
      },
      categoryManager: {
        tipoSelect: { value: '' },
        subTipoSelect: { value: '' },
        cantidadAfectadosInput: { value: '' },
        onCategoryChange: jest.fn(),
        calcularPrioridadDinamica: jest.fn(),
      },
      supportInstitutionsManager: {
        setSelectedInstitutions: jest.fn(),
      },
      mediaUploader: {
        setFiles: jest.fn(),
      }
    };

    helper = new IncidentFormStateHelper(mockComponent);
    
    jest.spyOn(IncidenciaService, 'getById').mockImplementation(() => Promise.resolve());
    jest.spyOn(IncidenciaService, 'update').mockImplementation(() => Promise.resolve());
    jest.spyOn(AuthService, 'getCurrentUser').mockReturnValue({});
    jest.spyOn(ModalService, 'confirm').mockResolvedValue(true);
    jest.spyOn(ToastService, 'success').mockImplementation(() => {});
    jest.spyOn(ToastService, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('prepararCreacion', () => {
    it('should set titles for creation', () => {
      helper.prepararCreacion();
      expect(mockComponent.formTitle.textContent).toBe('Registrar Incidencia');
      expect(mockComponent.btnText.textContent).toBe('Guardar Incidencia');
    });

    it('should populate user country if available', () => {
      helper.prepararCreacion({ pais_id: 1, codigo_iso_pais: 'EC' });
      
      expect(mockComponent.locationManager.dirPaisSelect.value).toBe(1);
      expect(mockComponent.locationManager.dirPaisSelect.disabled).toBe(true);
      expect(mockComponent.locationManager.actualizarEtiquetasNiveles).toHaveBeenCalledWith(1);
      expect(mockComponent.locationManager.cargarDropdownNivel1).toHaveBeenCalledWith(1);
      expect(mockComponent.mapController.centerMap).toHaveBeenCalled();
    });
  });

  describe('cargarDatosEdicion', () => {
    it('should load data and populate form', async () => {
      const mockIncidencia = {
        id: 1,
        version: 2,
        direccion_id: 10,
        tipo_incidencia_id: 20,
        sub_tipo_incidencia_id: 30,
        cantidad_afectados_incidencia: 5,
        incidencia_descripcion: 'Test',
        institucion_id: 40,
        estado_id: 2,
        instituciones_apoyo: [{ id: 50 }],
        direccion: {
          detalle: 'Dir test',
          codigo_postal: '123',
          latitud: 1.1,
          longitud: -1.1,
          territorio: {
            pais_id: 1,
            id: 3,
            parent: {
              id: 2,
              parent: { id: 1 }
            }
          }
        },
        recursos: [
          { id: 100, url: 'http://test/img.jpg' }
        ]
      };

      IncidenciaService.getById.mockResolvedValue(mockIncidencia);
      AuthService.getCurrentUser.mockReturnValue({});

      await helper.cargarDatosEdicion(1);

      expect(IncidenciaService.getById).toHaveBeenCalledWith(1);
      expect(mockComponent.formTitle.textContent).toBe('Editar Incidencia');
      
      // Basic Data
      expect(mockComponent.incidenciaIdInput.value).toBe(1);
      expect(mockComponent.versionInput.value).toBe(2);
      expect(mockComponent.descripcionInput.value).toBe('Test');
      expect(mockComponent.categoryManager.tipoSelect.value).toBe(20);
      
      // Location Data
      expect(mockComponent.locationManager.dirDetalleInput.value).toBe('Dir test');
      expect(mockComponent.mapController.setCoordsAndCenter).toHaveBeenCalledWith(1.1, -1.1, 15);
      expect(mockComponent.locationManager.cargarDropdownNivel1).toHaveBeenCalled();
      
      // Media
      expect(mockComponent.mediaUploader.setFiles).toHaveBeenCalledWith([{
        id: 100, name: 'img.jpg', base64: 'http://test/img.jpg', existing: true
      }]);
    });

    it('should show error toast if load fails', async () => {
      IncidenciaService.getById.mockRejectedValue(new Error('Failed'));
      
      await helper.cargarDatosEdicion(1);
      
      expect(ToastService.error).toHaveBeenCalledWith('Error al cargar la incidencia para edición.');
    });
  });

  describe('disableFormFields', () => {
    it('should disable form inputs and hide elements', () => {
      helper.disableFormFields();
      
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(el => {
        expect(el.disabled).toBe(true);
      });
      
      expect(document.querySelector('#direccionSearch').classList.contains('d-none')).toBe(true);
    });
  });

  describe('_applyRoleBasedUI', () => {
    it('should apply institution specific UI for state 3', () => {
      AuthService.getCurrentUser.mockReturnValue({
        roles: [{ nombre: 'Institucion' }]
      });

      helper._applyRoleBasedUI({ estado_id: 3, id: 1, version: 1 });
      
      const btnConf = document.querySelector('#btnConfirmarResolucion');
      const btnSub = document.querySelector('#btnSubmit');
      
      expect(btnConf.classList.contains('d-none')).toBe(false);
      expect(btnConf.disabled).toBe(false);
      expect(btnSub.classList.contains('d-none')).toBe(true);
      
      const input = document.querySelector('.test-input');
      expect(input.disabled).toBe(true);
    });

    it('should not apply if not institution', () => {
      AuthService.getCurrentUser.mockReturnValue({
        roles: [{ nombre: 'Ciudadano' }]
      });

      helper._applyRoleBasedUI({ estado_id: 3 });
      
      const btnConf = document.querySelector('#btnConfirmarResolucion');
      expect(btnConf.classList.contains('d-none')).toBe(true);
    });
  });

  describe('confirmarResolucion', () => {
    it('should confirm resolution if user accepts modal', async () => {
      ModalService.confirm.mockResolvedValue(true);
      IncidenciaService.update.mockResolvedValue({});
      
      await helper.confirmarResolucion(1, 2);
      
      expect(ModalService.confirm).toHaveBeenCalled();
      expect(IncidenciaService.update).toHaveBeenCalledWith(1, {
        estado_id: 4,
        version: 2,
        comentario_estado: 'Resolución confirmada por el solicitante/operador.'
      });
      expect(ToastService.success).toHaveBeenCalled();
    });

    it('should do nothing if user rejects modal', async () => {
      ModalService.confirm.mockResolvedValue(false);
      
      await helper.confirmarResolucion(1, 2);
      
      expect(IncidenciaService.update).not.toHaveBeenCalled();
    });

    it('should show error toast if update fails', async () => {
      ModalService.confirm.mockResolvedValue(true);
      IncidenciaService.update.mockRejectedValue(new Error('Update failed'));
      
      await helper.confirmarResolucion(1, 2);
      
      expect(ToastService.error).toHaveBeenCalledWith('Update failed');
    });
  });

});
