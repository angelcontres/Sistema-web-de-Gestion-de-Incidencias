import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';
import '../../core/mascot/mascot.component.js';
import { ToastService } from '../../shared/services/toast.service.js';

export class SignupComponent extends BaseComponent {
  constructor() {
    super('js/pages/signup/signup.component.html');
  }

  onInit() {
    if (AuthService.isAuthenticated()) {
      window.location.hash = '#/';
      return;
    }

    this.initSignupForm();

    this.initPrivacyMode();
  }

  initSignupForm() {
    this.form = this.querySelector('#signup-form');
    this.submitBtn = this.querySelector('#submit-btn');
    this.spinner = this.querySelector('#signup-spinner');

    if (this.form) {
      this.form.addEventListener('submit', this.handleSignup.bind(this));
    }
  }

  initPrivacyMode() {
    const passwordInput = this.querySelector('#password');
    const mascot = this.querySelector('app-mascot');

    if (passwordInput && mascot) {
      passwordInput.addEventListener('focus', () => {
        mascot.setPrivacyMode(true);
      });
      passwordInput.addEventListener('blur', () => {
        mascot.setPrivacyMode(false);
      });
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    if (!this.validarFormulario()) return;

    this.setEstadoCarga(true);
    const data = this.construirPayloadRegistro();

    try {
      await AuthService.register(data);
      ToastService.success('Tu cuenta de ciudadano ha sido creada con éxito.', 'Registro Exitoso');
      window.dispatchEvent(new CustomEvent('auth-change'));
      window.location.hash = '#/';
    } catch (error) {
      this.setEstadoCarga(false);
      this.manejarErrorRegistro(error);
    }
  }

  validarFormulario() {
    this.form.classList.add('was-validated');
    if (!this.form.checkValidity()) {
      ToastService.warning(
        'Por favor completa todos los campos requeridos correctamente.',
        'Faltan datos'
      );
      return false;
    }
    return true;
  }

  construirPayloadRegistro() {
    const data = {
      username: this.querySelector('#username').value,
      password: this.querySelector('#password').value,
    };

    if (data.username.includes('@')) {
      data.email = data.username;
      delete data.username;
    }

    return data;
  }

  manejarErrorRegistro(error) {
    let message = 'Error inesperado.';

    if (error?.status === 422 && error?.data?.errors) {
      const firstKey = Object.keys(error?.data?.errors)[0];
      message = error?.data?.errors[firstKey][0];
    } else if (error?.data?.message) {
      message = error?.data?.message;
    } else if (error?.message) {
      message = error?.message;
    }

    ToastService.warning(message, 'Error de Registro');
  }

  setEstadoCarga(cargando) {
    if (this.submitBtn) this.submitBtn.disabled = cargando;
    if (this.spinner) this.spinner.classList.toggle('d-none', !cargando);
  }
}

customElements.define('app-signup', SignupComponent);
