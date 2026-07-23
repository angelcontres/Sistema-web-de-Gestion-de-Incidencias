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
    const container = this.getContainer();
    const activeToasts = container.querySelectorAll('app-toast');
    const maxVisibleToasts = 3;

    if (activeToasts.length >= maxVisibleToasts) {
      // LIFO: El último en entrar es el primero en salir (el más reciente en el DOM)
      const lastIn = activeToasts[activeToasts.length - 1];
      if (lastIn) {
        lastIn.remove();
      }
    }

    const toastComponent = document.createElement('app-toast');
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
