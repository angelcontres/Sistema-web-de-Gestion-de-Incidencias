import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';
import { AuthService } from '../../core/auth.service.js';

export class SideBarComponent extends BaseComponent {
  constructor() {
    super('js/components/sidebar/sidebar.component.html');
    this.menuLoaded = false;
  }

  onInit() {
    this.renderSidebar();

    this._onHashChange = () => {
      this.renderSidebar();
      this.updateActiveLink();
    };
    window.addEventListener('hashchange', this._onHashChange);

    this._onAuthChange = () => {
      this.menuLoaded = false;
      this.renderSidebar();
    };
    window.addEventListener('auth-change', this._onAuthChange);

    this._onToggleSidebar = () => {
      const willHide = !this.classList.contains('collapsed');
      this.dataset.userHidden = willHide ? 'true' : 'false';
      this.classList.toggle('collapsed');
    };
    window.addEventListener('toggle-sidebar', this._onToggleSidebar);
  }

  disconnectedCallback() {
    if (this._onHashChange) window.removeEventListener('hashchange', this._onHashChange);
    if (this._onAuthChange) window.removeEventListener('auth-change', this._onAuthChange);

    if (this._onToggleSidebar) window.removeEventListener('toggle-sidebar', this._onToggleSidebar);
  }

  renderSidebar() {
    const sidebarContainer = this.firstElementChild;
    if (!sidebarContainer) return;

    const token = localStorage.getItem('access_token');
    const hash = window.location.hash || '#/';
    const userHidden = this.dataset.userHidden === 'true';

    if (!token || hash === '#/login') {
      this.dataset.userHidden = 'false';
      this.classList.add('d-none');
    } else if (userHidden) {
      this.classList.remove('d-none');
      this.classList.add('collapsed');
    } else {
      this.classList.remove('d-none');
      this.classList.remove('collapsed');
      if (!this.menuLoaded) {
        this.loadMenuData();
      }
      this.renderUserCard();
    }
  }

  async loadMenuData() {
    const container = this.querySelector('#dynamicMenuContainer');
    try {
      if (container) {
        container.innerHTML = `
          <div class="d-flex justify-content-center py-3" id="menuLoader">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">
                Cargando...
              </span>
            </div>
          </div>
        `;
      }

      const response = await apiRequest('/me/menu', { method: 'GET' });
      const menuTree = this.buildMenuTree(response.data || response);

      this.renderMenuItems(menuTree);
      this.menuLoaded = true;
      this.updateActiveLink();
    } catch (error) {
      console.error('Error cargando el menú:', error);
      if (container)
        container.innerHTML = '<p class="text-danger small px-3">Error al cargar menú.</p>';
    }
  }

  buildMenuTree(menuList) {
    const tree = [];
    const lookup = {};

    const esc = (v) =>
      String(v ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
      );
    const safeHref = (v) => {
      const s = String(v ?? '');
      return s.startsWith('#') ? s : '#/';
    };
    const safeClass = (v) => {
      const s = String(v ?? '').trim();
      return /^[a-z0-9\s-]+$/i.test(s) ? s : '';
    };
    menuList.forEach((item) => {
      lookup[item.id] = {
        ...item,
        nombre: esc(item.nombre),
        ruta: safeHref(item.ruta),
        icono: safeClass(item.icono),
        children: [],
      };
    });

    menuList.forEach((item) => {
      if (item.padre_id && lookup[item.padre_id]) {
        lookup[item.padre_id].children.push(lookup[item.id]);
      } else if (!item.padre_id) {
        tree.push(lookup[item.id]);
      }
    });

    return tree;
  }

  renderMenuItems(menuTree) {
    const container = this.querySelector('#dynamicMenuContainer');
    if (!container) return;

    let html = '';

    menuTree.forEach((menu) => {
      if (menu.children && menu.children.length > 0) {
        const collapseId = `collapse-menu-${menu.id}`;
        html += `
          <div class="nav-item">
            <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-dark" data-bs-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false">
              <i class="${menu.icono || 'bi bi-circle'} text-secondary"></i>
              <span>${menu.nombre}</span>
              <i class="bi bi-chevron-down ms-auto small text-muted"></i>
            </a>
            <div class="collapse ms-3" id="${collapseId}">
              <div class="nav flex-column gap-1 mt-1">
                ${menu.children
                  .map(
                    (child) => `
                  <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-secondary" href="${child.ruta}">
                    <i class="${child.icono || 'bi bi-dot'} text-secondary"></i>
                    <span>${child.nombre}</span>
                  </a>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-dark" href="${menu.ruta}">
            <i class="${menu.icono || 'bi bi-circle'} text-secondary"></i>
            <span>${menu.nombre}</span>
          </a>
        `;
      }
    });

    container.innerHTML = html;
  }

  updateActiveLink() {
    const currentHash = window.location.hash || '#/';
    const links = this.querySelectorAll('.sidebar-link');

    links.forEach((link) => {
      const href = link.getAttribute('href');

      if (href === currentHash && !link.hasAttribute('data-bs-toggle')) {
        link.classList.remove('text-dark', 'text-secondary');
        link.classList.add('active', 'bg-primary', 'text-white');

        const icon = link.querySelector('i:first-child');
        if (icon) {
          icon.classList.remove('text-secondary');
          icon.classList.add('text-white');
        }

        const parentCollapse = link.closest('.collapse');
        if (parentCollapse) {
          parentCollapse.classList.add('show');

          const parentLink = document.querySelector(`[href="#${parentCollapse.id}"]`);
          if (parentLink) {
            parentLink.classList.remove('text-dark');
            parentLink.classList.add('text-primary');
          }
        }
      } else {
        link.classList.remove('active', 'bg-primary', 'text-white');

        const icon = link.querySelector('i:first-child');
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-secondary');
        }

        if (link.hasAttribute('data-bs-toggle')) {
          link.classList.remove('text-primary');
          link.classList.add('text-dark');
        } else {
          if (link.closest('.collapse')) {
            link.classList.add('text-secondary');
          } else {
            link.classList.add('text-dark');
          }
        }
      }
    });
  }

  renderUserCard() {
    // Deprecated: user profile info is shown in the top navbar dropdown.
  }
}

customElements.define('app-sidebar', SideBarComponent);
