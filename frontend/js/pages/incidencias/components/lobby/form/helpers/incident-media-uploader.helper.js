import { ToastService } from '../../../../../../shared/services/toast.service.js';
import { ModalService } from '../../../../../../shared/services/modal.service.js';
import { AuthService } from '../../../../../../core/auth.service.js';

export class IncidentMediaUploaderHelper {
  constructor(component) {
    this.component = component;
    this.recursosFiles = [];
    
    // Elements
    this.dropzoneContainer = component.querySelector('#dropzoneContainer');
    this.fileInput = component.querySelector('#fileInput');
    this.thumbnailsContainer = component.querySelector('#thumbnailsContainer');
    this.btnTestImagen = component.querySelector('#btnTestImagen');

    this.initEvents();
  }

  initEvents() {
    if (!this.dropzoneContainer || !this.fileInput) return;

    this.dropzoneContainer.addEventListener('click', (e) => {
      if (e.target.closest('#btnTestImagen')) return;
      this.fileInput.click();
    });
    
    this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
    this.setupDropzoneDragAndDrop();

    if (this.btnTestImagen) {
      this.btnTestImagen.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cargarImagenDePrueba();
      });
    }
  }

  setupDropzoneDragAndDrop() {
    const dropzone = this.dropzoneContainer;
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.add('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-primary', 'bg-primary-soft');
        },
        false
      );
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.processFiles(files);
    });
  }

  handleFileSelection(e) {
    const files = e.target.files;
    this.processFiles(files);
  }

  async processFiles(files) {
    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        ToastService.warning('Solo se permiten archivos de imagen.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        ToastService.warning('La imagen no debe superar el límite de 10 MB.');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentUser = AuthService.getCurrentUser();
    const maxFiles = currentUser?.max_files || 5;

    if (this.recursosFiles.length + validFiles.length > maxFiles) {
      ToastService.warning(
        `No puede subir más de ${maxFiles} archivos en total. (Límite configurado: ${maxFiles})`
      );
      return;
    }

    const isConfirmed = await ModalService.confirm(
      'Confirmar Subida de Imágenes',
      '¿Está seguro de que desea adjuntar estas imágenes a la incidencia? Por favor, verifique que cumplan con las normas.',
      'Adjuntar',
      'Cancelar',
      'btn-primary'
    );

    if (!isConfirmed) return;

    for (const file of validFiles) {
      try {
        const base64Data = await this.convertToWebP(file);
        let fileName = file.name;
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex !== -1) {
          fileName = fileName.substring(0, dotIndex) + '.webp';
        } else {
          fileName += '.webp';
        }

        this.recursosFiles.push({
          name: fileName,
          size: Math.round(base64Data.length * 0.75),
          type: 'image/webp',
          base64: base64Data,
          compressed: true,
        });
      } catch (e) {
        console.error('Error al comprimir la imagen:', e);
        // Fallback
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            this.recursosFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              base64: reader.result,
              compressed: false,
            });
            resolve();
          };
        });
      }
    }
    this.renderThumbnails();
  }

  convertToWebP(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  renderThumbnails() {
    if (!this.thumbnailsContainer) return;
    this.thumbnailsContainer.innerHTML = '';

    this.recursosFiles.forEach((file, index) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <div class="card h-100 border rounded-3 overflow-hidden position-relative shadow-sm">
          <img src="${file.base64}" loading="lazy" class="card-img-top object-fit-cover" style="height: 120px;" alt="${file.name}" />
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <div class="text-truncate small fw-medium" title="${file.name}">${file.name}</div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="badge bg-success-soft text-success" style="font-size: 0.7rem;">.webp Compressed</span>
              <button type="button" class="btn btn-link text-danger p-0 border-0" data-index="${index}">
                <i class="bi bi-trash small"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      col.querySelector('button').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        this.recursosFiles.splice(idx, 1);
        this.renderThumbnails();
      });

      this.thumbnailsContainer.appendChild(col);
    });
  }

  cargarImagenDePrueba() {
    const mockBase64 = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const currentUser = AuthService.getCurrentUser();
    const maxFiles = currentUser?.max_files || 5;
    
    if (this.recursosFiles.length >= maxFiles) {
      ToastService.warning(`No puede subir más de ${maxFiles} archivos.`);
      return;
    }

    this.recursosFiles.push({
      name: 'imagen-de-prueba.webp',
      size: 40,
      type: 'image/webp',
      base64: mockBase64,
      compressed: true,
    });
    this.renderThumbnails();
    ToastService.success('Imagen de prueba cargada. Listo para guardar.');
  }

  getFiles() {
    return this.recursosFiles;
  }

  setFiles(files) {
    this.recursosFiles = files;
    this.renderThumbnails();
  }

  getNewFilesBase64() {
    return this.recursosFiles.filter((f) => !f.id).map((f) => f.base64);
  }
}
