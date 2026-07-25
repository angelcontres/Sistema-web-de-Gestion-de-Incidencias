import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';
import { MascotAnimation } from '../../core/mascot/mascot-animation.js';
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

    const mascot = new MascotAnimation(this);
    mascot.init();
  }

  initSignupForm() {
    this.form = this.querySelector('#signup-form');
    this.submitBtn = this.querySelector('#submit-btn');
    this.spinner = this.querySelector('#signup-spinner');

    if (this.form) {
      this.form.addEventListener('submit', this.handleSignup.bind(this));
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    this.form.classList.add('was-validated');

    if (!this.form.checkValidity()) {
      ToastService.warning('Por favor completa todos los campos requeridos correctamente.', 'Faltan datos');
      return;
    }

    this.submitBtn.disabled = true;
    this.spinner.classList.remove('d-none');

    const data = {
      username: this.querySelector('#username').value,
      password: this.querySelector('#password').value,
    };
    
    if (data.username.includes('@')) {
      data.email = data.username;
      delete data.username;
    }

    try {
      await AuthService.register(data);
      ToastService.success('Tu cuenta de ciudadano ha sido creada con éxito.', 'Registro Exitoso');
      window.dispatchEvent(new CustomEvent('auth-change'));
      window.location.hash = '#/';
    } catch (error) {
      this.submitBtn.disabled = false;
      this.spinner.classList.add('d-none');
      
      let message = 'Error inesperado.';
      if (error && error.status === 422 && error.data && error.data.errors) {
         const firstKey = Object.keys(error.data.errors)[0];
         message = error.data.errors[firstKey][0];
      } else if (error && error.data && error.data.message) {
         message = error.data.message;
      } else if (error && error.message) {
         message = error.message;
      }
      ToastService.error(message, 'Error de Registro');
    }
  }
}

customElements.define('app-signup', SignupComponent);
