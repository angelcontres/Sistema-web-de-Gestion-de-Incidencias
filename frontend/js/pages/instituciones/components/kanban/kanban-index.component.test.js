import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { KanbanIndexComponent } from './kanban-index.component.js';
import { IncidenciaService } from '../../../incidencias/services/incidencia.service.js';
import { AuthService } from '../../../../core/auth.service.js';
import { ToastService } from '../../../../shared/services/toast.service.js';

jest.mock('../../../incidencias/services/incidencia.service.js');
jest.mock('../../../../core/auth.service.js');
jest.mock('../../../../shared/services/toast.service.js');

describe('KanbanIndexComponent', () => {
  let component;

  beforeEach(() => {
    window.fetch = jest.fn((url) => {
      if (url.includes('.html')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`
            <button id="btn-refresh"></button>
            <textarea id="resolver-comentario"></textarea>
            <div id="char-count"></div>
            <button id="btn-confirmar-resolver"></button>
            <div id="dropzoneContainerKanban"></div>
            <input id="fileInputKanban" type="file" />
            
            <div id="col-en-proceso"></div>
            <div id="col-resuelto"></div>
            <div id="count-proceso"></div>
            <div id="count-resuelto"></div>
            
            <input id="resolver-incidencia-id" />
            <input id="resolver-incidencia-version" />
            
            <div id="modalResolver"></div>
            <div id="thumbnailsContainerKanban"></div>
            
            <div class="spinner-col"></div>
          `)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });

    window.bootstrap = {
      Modal: Object.assign(
        jest.fn().mockImplementation(() => ({
          show: jest.fn(),
          hide: jest.fn()
        })),
        { getInstance: jest.fn().mockReturnValue({ hide: jest.fn() }) }
      )
    };

    jest.clearAllMocks();
    IncidenciaService.getAll = jest.fn().mockResolvedValue({ data: [] });
    IncidenciaService.update = jest.fn().mockResolvedValue({});
    AuthService.hasPermission = jest.fn().mockReturnValue(true);
    ToastService.error = jest.fn();
    ToastService.success = jest.fn();
    ToastService.warning = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const setupComponent = async (data = []) => {
    IncidenciaService.getAll.mockResolvedValue(data);
    document.body.innerHTML = '<app-kanban-institucion></app-kanban-institucion>';
    component = document.querySelector('app-kanban-institucion');
    if (component.onInit) await component.onInit();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  it('should handle error when loading incidencias', async () => {
    IncidenciaService.getAll.mockRejectedValue(new Error('Network error'));
    document.body.innerHTML = '<app-kanban-institucion></app-kanban-institucion>';
    component = document.querySelector('app-kanban-institucion');
    if (component.onInit) await component.onInit();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    expect(ToastService.error).toHaveBeenCalledWith('No se pudieron cargar las incidencias: Network error');
  });

  it('should load incidencias and render kanban with data', async () => {
    const mockData = {
      data: [
        {
          id: 1,
          estado_id: 3,
          prioridad: { color_hex: '#ff0000', nombre: 'Alta' },
          direccion: { detalle: 'Calle 1' },
          incidencia_descripcion: 'Test desc 1',
          created_at: '2023-01-01',
          version: 1
        },
        {
          id: 2,
          estado_id: 4,
          created_at: '2023-01-02',
          version: 1
        }
      ]
    };
    await setupComponent(mockData);

    const colProceso = component.querySelector('#col-en-proceso');
    const colResuelto = component.querySelector('#col-resuelto');

    expect(colProceso.children.length).toBe(1);
    expect(colResuelto.children.length).toBe(1);

    const countProceso = component.querySelector('#count-proceso');
    expect(countProceso.textContent).toBe('1');
    
    // Simulate refresh button click
    const btnRefresh = component.querySelector('#btn-refresh');
    btnRefresh.click();
    expect(IncidenciaService.getAll).toHaveBeenCalled();
  });

  it('should render correct message if arrays are empty', async () => {
    await setupComponent({ data: [] });
    
    const colProceso = component.querySelector('#col-en-proceso');
    const colResuelto = component.querySelector('#col-resuelto');
    expect(colProceso.innerHTML).toContain('No hay incidencias en proceso');
    expect(colResuelto.innerHTML).toContain('No hay incidencias resueltas');
  });

  it('should update char count on textarea input', async () => {
    await setupComponent();
    const textarea = component.querySelector('#resolver-comentario');
    const charCount = component.querySelector('#char-count');
    
    const inputEvent = new Event('input');
    textarea.value = '12345';
    textarea.dispatchEvent(inputEvent);
    
    expect(charCount.textContent).toBe('5');
  });

  it('should handle resolver modal opening and validation', async () => {
    const mockData = {
      data: [
        { id: 1, estado_id: 3, version: 1 }
      ]
    };
    await setupComponent(mockData);
    
    const btnResolver = component.querySelector('.btn-resolver');
    btnResolver.click();
    
    expect(component.querySelector('#resolver-incidencia-id').value).toBe('1');
    
    // Submit without comment
    const btnConfirmar = component.querySelector('#btn-confirmar-resolver');
    btnConfirmar.click();
    expect(ToastService.warning).toHaveBeenCalledWith('Debes ingresar un comentario de resolución.');
    
    // Submit with comment but no files
    component.querySelector('#resolver-comentario').value = 'Test resuelto';
    btnConfirmar.click();
    expect(ToastService.warning).toHaveBeenCalledWith('Debes adjuntar al menos una imagen de evidencia.');
  });

  it('should resolve incidencia successfully with valid data', async () => {
    await setupComponent();
    
    component.querySelector('#resolver-incidencia-id').value = '1';
    component.querySelector('#resolver-incidencia-version').value = '1';
    component.querySelector('#resolver-comentario').value = 'Test resuelto';
    component.recursosFiles = [{ base64: 'data:image/webp;base64,123' }];
    
    const btnConfirmar = component.querySelector('#btn-confirmar-resolver');
    await component.resolverIncidencia();
    
    expect(IncidenciaService.update).toHaveBeenCalledWith('1', {
      estado_id: 4,
      version: '1',
      comentario_estado: '[RESOLUCIÓN] Test resuelto',
      recursos: ['data:image/webp;base64,123']
    });
    expect(ToastService.success).toHaveBeenCalledWith('Incidencia marcada como resuelta.');
  });

  it('should handle error when resolving incidencia', async () => {
    await setupComponent();
    
    component.querySelector('#resolver-incidencia-id').value = '1';
    component.querySelector('#resolver-incidencia-version').value = '1';
    component.querySelector('#resolver-comentario').value = 'Test resuelto';
    component.recursosFiles = [{ base64: 'data:image/webp;base64,123' }];
    
    IncidenciaService.update.mockRejectedValue(new Error('Update failed'));
    
    await component.resolverIncidencia();
    expect(ToastService.error).toHaveBeenCalledWith('Error al resolver: Update failed');
  });

  it('should handle drag and drop interactions', async () => {
    await setupComponent();
    const dropzone = component.querySelector('#dropzoneContainerKanban');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      const event = new Event(eventName);
      event.preventDefault = jest.fn();
      if (eventName === 'drop') {
        event.dataTransfer = { files: [] };
      }
      dropzone.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  it('should process files via click input', async () => {
    await setupComponent();
    const fileInput = component.querySelector('#fileInputKanban');
    const dropzone = component.querySelector('#dropzoneContainerKanban');
    
    const clickSpy = jest.spyOn(fileInput, 'click');
    dropzone.click();
    expect(clickSpy).toHaveBeenCalled();
    
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { files: [], value: 'test' } });
    fileInput.dispatchEvent(event);
    expect(event.target.value).toBe('');
  });

  it('should validate and process dropped files', async () => {
    await setupComponent();
    
    // File validation: invalid type
    await component.processFiles([{ type: 'application/pdf' }]);
    expect(ToastService.warning).toHaveBeenCalledWith('Solo se permiten archivos de imagen.');
    
    // File validation: too large
    await component.processFiles([{ type: 'image/jpeg', size: 20 * 1024 * 1024 }]);
    expect(ToastService.warning).toHaveBeenCalledWith('La imagen no debe superar el límite de 10 MB.');
  });

  it('should compress and add image to recursosFiles and render thumbnail, then allow deletion', async () => {
    await setupComponent();
    
    const mockFile = { type: 'image/jpeg', size: 1024, name: 'test.jpg' };
    
    // Mock the compression logic which uses FileReader and Canvas
    component.convertToWebP = jest.fn().mockResolvedValue('data:image/webp;base64,mocked');
    
    await component.processFiles([mockFile]);
    
    expect(component.recursosFiles.length).toBe(1);
    expect(component.recursosFiles[0].name).toBe('test.webp');
    
    const container = component.querySelector('#thumbnailsContainerKanban');
    expect(container.children.length).toBe(1);
    
    // Delete file
    const btnDelete = container.querySelector('.btn-delete-file');
    btnDelete.click();
    expect(component.recursosFiles.length).toBe(0);
    expect(container.children.length).toBe(0);
  });

  it('should fallback to FileReader if compression fails', async () => {
    await setupComponent();
    
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock rejection in convertToWebP
    component.convertToWebP = jest.fn().mockRejectedValue(new Error('Compression error'));
    
    // Mock FileReader for fallback
    class MockFileReader {
      readAsDataURL() {
        this.result = 'data:image/jpeg;base64,fallback';
        setTimeout(() => this.onload(), 0);
      }
    }
    window.FileReader = MockFileReader;
    
    await component.processFiles([mockFile]);
    
    // We need to wait for the fallback promise
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);
    
    expect(component.recursosFiles.length).toBe(1);
    expect(component.recursosFiles[0].compressed).toBe(false);
  });
});
