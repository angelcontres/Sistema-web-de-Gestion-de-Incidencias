import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';

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

    if (submitBtn) {
      submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Trigger Bootstrap native validation styles
        form.classList.add('was-validated');

        // Check form validity
        if (!form.checkValidity()) {
          return;
        }

        // Reset error state and start loading animation
        errorAlert.classList.add('d-none');
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');

        try {
          const email = emailInput.value;
          const password = passwordInput.value;

          // Call real Sanctum API login endpoint
          await AuthService.login(email, password);

          // Trigger custom event to notify other UI components (like the Navbar)
          window.dispatchEvent(new CustomEvent('auth-change'));

          // Redirect user to the dashboard
          window.location.hash = '#/';
        } catch (error) {
          console.error('Login error:', error);
          const msg = error.message || 'Error de conexión con el servidor.';
          
          // Save error in sessionStorage in case the page reloads immediately after
          sessionStorage.setItem('login_error', msg);
          
          errorMessage.textContent = msg;
          errorAlert.classList.remove('d-none');
        } finally {
          // Reset button state
          submitBtn.disabled = false;
          spinner.classList.add('d-none');
        }
      });
      
      // Allow pressing Enter to submit
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
}

customElements.define('app-login', LoginComponent);
