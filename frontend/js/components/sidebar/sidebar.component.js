import { BaseComponent } from '../../core/base-component.js';

export class SideBarComponent extends BaseComponent {
  constructor() {
    super('js/components/sidebar/sidebar.component.html');
  }

  onInit() {
    this.updateActiveLink();

    this._onHashChange = () => this.updateActiveLink();
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    if (this._onHashChange) {
      window.removeEventListener('hashchange', this._onHashChange);
    }
  }

  updateActiveLink() {
    const currentHash = window.location.hash || '#/';
    const links = this.querySelectorAll('.sidebar-link');

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

customElements.define('app-sidebar', SideBarComponent);