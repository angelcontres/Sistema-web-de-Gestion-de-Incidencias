export class ModalService {
  static async confirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', btnClass = 'btn-primary') {
    const modalComponent = document.createElement('app-modal');
    document.body.appendChild(modalComponent);
    return await modalComponent.show({
      title,
      message,
      confirmText,
      cancelText,
      btnClass
    });
  }
}
