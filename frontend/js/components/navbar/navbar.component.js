import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

/**
 * Navbar Component class to manage layout navigation, active pages, and session state.
 */
export class NavbarComponent extends BaseComponent {
  constructor() {
    super('js/components/navbar/navbar.component.html');
  }

  /**
   * Lifecycle hook triggered after template has been loaded into the DOM.
   */
  onInit() {
    this.renderNavbar();

    // Listen to hash changes to dynamically update active links and visibility
    this._onHashChange = () => this.renderNavbar();
    window.addEventListener('hashchange', this._onHashChange);

    // Listen to auth changes (login/logout events)
    this._onAuthChange = () => this.renderNavbar();
    window.addEventListener('auth-change', this._onAuthChange);
  }

  disconnectedCallback() {
    if (this._onHashChange) {
      window.removeEventListener('hashchange', this._onHashChange);
    }
    if (this._onAuthChange) {
      window.removeEventListener('auth-change', this._onAuthChange);
    }
  }

  /**
   * Handles visibility of the navbar, displays user details, and hooks up the logout button.
   */
  renderNavbar() {
    const navbarContainer = this.querySelector('#navbarContainer');
    if (!navbarContainer) return;

    const token = localStorage.getItem('access_token');
    const hash = window.location.hash || '#/';

    // Hide navbar completely if not logged in or on the login page
    if (!token || hash === '#/login') {
      navbarContainer.classList.add('d-none');
      return;
    }
    const toggleBtn = this.querySelector('#sidebarToggleBtn');
      if (toggleBtn && !toggleBtn.dataset.hasListener) {
        toggleBtn.dataset.hasListener = 'true';
        toggleBtn.addEventListener('click', () => {
        // Disparamos un evento global que el Sidebar va a escuchar
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
        });
      }

    // Show navbar
    navbarContainer.classList.remove('d-none');

    // Display user profile name
    const userNameDisplay = this.querySelector('#navUserName');
    if (userNameDisplay) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        userNameDisplay.textContent = user.name || user.email || 'Usuario';
      } catch (e) {
        userNameDisplay.textContent = 'Usuario';
      }
    }

    // Set up logout button listener
    const logoutBtn = this.querySelector('#logoutBtn');
    if (logoutBtn && !logoutBtn.dataset.hasListener) {
      logoutBtn.dataset.hasListener = 'true';
      logoutBtn.addEventListener('click', async () => {
        try {
          // Disable button during requests
          logoutBtn.disabled = true;

          // Call backend logout API
          await apiRequest('/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error during logout API call:', error);
        } finally {
          // Always clear local session and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');

          // Notify application components
          window.dispatchEvent(new CustomEvent('auth-change'));

          // Redirect to login
          window.location.hash = '#/login';
        }
      });
    }

    // Highlight active link
    this.updateActiveLink();
  }

  /**
   * Updates CSS active state class for navigation links.
   */
  updateActiveLink() {
    const currentHash = window.location.hash || '#/';
    const links = this.querySelectorAll('.nav-link');

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentHash) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }
}

customElements.define('app-navbar', NavbarComponent);
