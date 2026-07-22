import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';
import { MascotAnimation } from '../../core/mascot/mascot-animation.js';

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

    // 2. Setup Mascot Interactive Animations
    const mascot = new MascotAnimation(this);
    mascot.init();
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
    const errorAlert = this.querySelector('#loginErrorAlert');
    const errorMessage = this.querySelector('#loginErrorMessage');

    // Check if there's a pending error from a previous reload
    const pendingError = sessionStorage.getItem('login_error');
    if (pendingError) {
      errorMessage.textContent = pendingError;
      errorAlert.classList.remove('d-none');
      sessionStorage.removeItem('login_error');
    }

    if (!submitBtn) return;

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      form.classList.add('was-validated');

      if (!form.checkValidity()) return;

      errorAlert.classList.add('d-none');
      submitBtn.disabled = true;
      spinner.classList.remove('d-none');

      try {
        await AuthService.login(emailInput.value, passwordInput.value);
        window.dispatchEvent(new CustomEvent('auth-change'));
        window.location.hash = '#/';
      } catch (error) {
        console.error('Login error:', error);
        const msg = error.message || 'Error de conexión con el servidor.';
        sessionStorage.setItem('login_error', msg);
        errorMessage.textContent = msg;
        errorAlert.classList.remove('d-none');
      } finally {
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
      }
    });
    
    if (form) {
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitBtn.click();
        }
      });
    }
  }
}

customElements.define('app-login', LoginComponent);
