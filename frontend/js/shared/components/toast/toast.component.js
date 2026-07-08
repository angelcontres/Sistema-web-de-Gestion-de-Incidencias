import { BaseComponent } from "../../../core/base-component.js";

export class ToastComponent extends BaseComponent {
  constructor() {
    super('js/shared/components/toast/toast.component.html');
    this.isReady = false;
    this.readyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
  }

  onInit() {
    this.isReady = true;
    this.resolveReady();
  }

  async show(type, message, title = '') {
    await this.readyPromise;
    const toastEl = this.querySelector('.toast');
    const iconEl = this.querySelector('#toast-icon');
    const titleEl = this.querySelector('#toast-title');
    const messageEl = this.querySelector('#toast-message');
    const closeBtn = this.querySelector('#toast-btn-close');

    let icon = '';
    let bgClass = '';
    let textClass = 'text-white';
    
    switch (type) {
      case 'success':
        icon = 'bi-check-circle-fill';
        bgClass = 'bg-success';
        title = title || 'Éxito';
        break;
      case 'error':
        icon = 'bi-exclamation-triangle-fill';
        bgClass = 'bg-danger';
        title = title || 'Error';
        break;
      case 'warning':
        icon = 'bi-exclamation-circle-fill';
        bgClass = 'bg-warning';
        textClass = 'text-dark';
        title = title || 'Advertencia';
        break;
      case 'info':
      default:
        icon = 'bi-info-circle-fill';
        bgClass = 'bg-info';
        title = title || 'Información';
        break;
    }

    toastEl.classList.add(bgClass, textClass);
    iconEl.classList.add(icon);
    titleEl.textContent = title;
    messageEl.innerHTML = message;

    if (textClass === 'text-white') {
      closeBtn.classList.add('btn-close-white');
    }

    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    
    toastEl.addEventListener('hidden.bs.toast', () => {
      this.remove();
    }, { once: true });

    bsToast.show();
  }
}

customElements.define('app-toast', ToastComponent);
