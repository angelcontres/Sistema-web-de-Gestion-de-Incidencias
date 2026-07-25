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

    let icon;
    let colorClass;
    
    switch (type) {
      case 'success':
        icon = 'bi-check-circle-fill';
        colorClass = 'text-success';
        title = title || 'Éxito';
        break;
      case 'error':
        icon = 'bi-exclamation-triangle-fill';
        colorClass = 'text-danger';
        title = title || 'Error';
        break;
      case 'warning':
        icon = 'bi-exclamation-circle-fill';
        colorClass = 'text-warning';
        title = title || 'Advertencia';
        break;
      case 'info':
      default:
        icon = 'bi-info-circle-fill';
        colorClass = 'text-primary';
        title = title || 'Información';
        break;
    }

    iconEl.classList.add(icon, colorClass);
    titleEl.classList.add(colorClass);
    titleEl.textContent = title;
    messageEl.innerHTML = message;

    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    
    toastEl.addEventListener('hidden.bs.toast', () => {
      this.remove();
    }, { once: true });

    bsToast.show();
  }
}

customElements.define('app-toast', ToastComponent);
