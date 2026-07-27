import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';
import '../../core/mascot/mascot.component.js';
import { ToastService } from '../../shared/services/toast.service.js';

/**
 * LoginComponent class to manage user authentication view and logic.
 */
export class LoginComponent extends BaseComponent {
  constructor() {
    super('js/pages/login/login.component.html');
  }

  onInit() {
    // If the user already has a token, redirect to dashboard immediately
    if (AuthService.isAuthenticated()) {
      window.location.hash = '#/';
      return;
    }

    // 1. Setup Auth Form
    this.initAuthForm();

    // 2. Setup Privacy Mode
    this.initPrivacyMode();
  }

  /**
   * Initializes all authentication related logic (Form submission, validation, error handling)
   */
  initAuthForm() {
    const form = this.querySelector('#loginForm');
    const emailInput = this.querySelector('#emailInput');
    const passwordInput = this.querySelector('#passwordInput');
    const submitBtn = this.querySelector('#loginSubmitBtn');
    const spinner = this.querySelector('#loginSpinner');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.classList.add('was-validated');

      if (!form.checkValidity()) {
        ToastService.warning('Por favor completa todos los campos requeridos.', 'Faltan datos');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        await AuthService.login(emailInput.value, passwordInput.value);
        ToastService.success('Bienvenido de nuevo al sistema.', 'Inicio Exitoso');
        window.dispatchEvent(new CustomEvent('auth-change'));
        window.location.hash = '#/';
      } catch (error) {
        console.error('Login error:', error);
        const msg = error.message || 'Error de conexión con el servidor.';
        ToastService.error(msg, 'Error de Autenticación');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }

  /**
   * Initializes privacy mode for the mascot when typing password.
   */
  initPrivacyMode() {
    const passwordInput = this.querySelector('#passwordInput');
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
}

customElements.define('app-login', LoginComponent);
