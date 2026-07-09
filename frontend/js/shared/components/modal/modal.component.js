import { BaseComponent } from "../../../core/base-component.js";

export class ModalComponent extends BaseComponent {
  constructor() {
    super('js/shared/components/modal/modal.component.html');
    this.isReady = false;
    this.readyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
  }

  onInit() {
    this.isReady = true;
    this.resolveReady();
  }

  async show(options = {}) {
    await this.readyPromise;
    const modalEl = this.querySelector('.modal');
    
    const titleEl = this.querySelector('#modal-title');
    const bodyEl = this.querySelector('#modal-body');
    const cancelBtn = this.querySelector('#modal-btn-cancel');
    const confirmBtn = this.querySelector('#modal-btn-confirm');
    
    if (options.title) titleEl.innerHTML = options.title;
    if (options.message) bodyEl.innerHTML = options.message;
    if (options.confirmText) confirmBtn.textContent = options.confirmText;
    if (options.cancelText) cancelBtn.textContent = options.cancelText;
    
    if (options.btnClass) {
      confirmBtn.className = 'btn px-4 ' + options.btnClass;
    }

    return new Promise((resolve) => {
      const bsModal = new bootstrap.Modal(modalEl);
      let isConfirmed = false;

      confirmBtn.addEventListener('click', () => {
        isConfirmed = true;
        bsModal.hide();
      }, { once: true });

      modalEl.addEventListener('hidden.bs.modal', () => {
        this.remove();
        resolve(isConfirmed);
      }, { once: true });

      bsModal.show();
    });
  }
}

customElements.define('app-modal', ModalComponent);
