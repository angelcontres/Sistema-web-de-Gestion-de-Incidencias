export class ToastService {
  static getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3 mt-5';
      container.style.zIndex = '1090';
      document.body.appendChild(container);
    }
    return container;
  }

  static show(type, message, title = '') {
    const toastComponent = document.createElement('app-toast');
    const container = this.getContainer();
    container.appendChild(toastComponent);
    toastComponent.show(type, message, title);
  }

  static success(message, title = '') {
    this.show('success', message, title);
  }

  static error(message, title = '') {
    this.show('error', message, title);
  }

  static warning(message, title = '') {
    this.show('warning', message, title);
  }

  static info(message, title = '') {
    this.show('info', message, title);
  }
}
