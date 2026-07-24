import { BaseComponent } from '../../../core/base-component.js';
import { apiRequest } from '../../../core/api.js';
import { ToastService } from '../../../shared/services/toast.service.js';

export class ActivateAccountComponent extends BaseComponent {
  constructor() {
    super('js/pages/auth/activate/activate.component.html');
  }

  async onInit() {
    console.log('Componente de Activación inicializado');

    // Extraer token de la URL: #/activate?token=ABC123XYZ
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const token = urlParams.get('token');

    if (!token) {
      ToastService.error('Token de activación no proporcionado o inválido.');
      window.location.hash = '#/login';
      return;
    }

    const form = this.querySelector('#form-activate-account');
    const loadingView = this.querySelector('#activate-loading');
    const successView = this.querySelector('#activate-success');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = form.querySelector('#password').value;
      const passwordConfirmation = form.querySelector('#password_confirmation').value;

      if (!password || password.length < 8) {
        ToastService.error('La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (password !== passwordConfirmation) {
        ToastService.error('Las contraseñas no coinciden.');
        return;
      }

      // Preparar interfaz de carga
      form.classList.add('d-none');
      loadingView.classList.remove('d-none');

      try {
        const payload = {
          token: token,
          password: password,
          password_confirmation: passwordConfirmation
        };

        await apiRequest('/auth/activate', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        // Mostrar éxito
        loadingView.classList.add('d-none');
        successView.classList.remove('d-none');
        ToastService.success('Cuenta activada correctamente.');
      } catch (error) {
        // Restaurar formulario
        loadingView.classList.add('d-none');
        form.classList.remove('d-none');
        ToastService.error(error.message || 'Ocurrió un error al activar la cuenta.');
      }
    });
  }
}

customElements.define('app-activate-account', ActivateAccountComponent);
