import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

export class SidebarComponent extends BaseComponent {
  constructor() {
    super('js/components/sidebar/sidebar.component.html');
  }

  onInit() {
    this.renderSidebar();

    // Listen to hash changes (active link updates & visibility)
    this._onHashChange = () => this.renderSidebar();
    window.addEventListener('hashchange', this._onHashChange);

    // Listen to authentication changes
    this._onAuthChange = () => {
      const sidebarContainer = this.querySelector('#sidebarContainer');
      if (sidebarContainer) {
        // Reset load flag so menu tree refetches for new user session
        sidebarContainer.removeAttribute('data-loaded');
      }
      this.renderSidebar();
    };
    window.addEventListener('auth-change', this._onAuthChange);

    // Listen to options menu CRUD modifications (reactive refetch)
    this._onMenuChange = () => {
      const sidebarContainer = this.querySelector('#sidebarContainer');
      if (sidebarContainer) {
        sidebarContainer.removeAttribute('data-loaded');
      }
      this.renderSidebar();
    };
    window.addEventListener('menu-change', this._onMenuChange);
  }

  disconnectedCallback() {
    if (this._onHashChange) {
      window.removeEventListener('hashchange', this._onHashChange);
    }
    if (this._onAuthChange) {
      window.removeEventListener('auth-change', this._onAuthChange);
    }
    if (this._onMenuChange) {
      window.removeEventListener('menu-change', this._onMenuChange);
    }
  }

  /**
   * Manages sidebar visibility, fetches menu options tree, and updates active classes.
   */
  async renderSidebar() {
    const sidebarContainer = this.querySelector('#sidebarContainer');
    if (!sidebarContainer) return;

    const token = localStorage.getItem('access_token');
    const hash = window.location.hash || '#/';

    // Hide sidebar on login page or if not authenticated
    if (!token || hash === '#/login') {
      sidebarContainer.classList.add('d-none');
      return;
    }

    // Show sidebar
    sidebarContainer.classList.remove('d-none');

    // Skip refetching menu tree if already loaded (just update highlighted link)
    if (sidebarContainer.getAttribute('data-loaded') === 'true') {
      this.updateActiveLink();
      return;
    }

    try {
      // Fetch hierarchical options tree
      const response = await apiRequest('/opciones-menu?tree=true');
      const menuItems = response.data || [];
      
      this.renderMenuTree(menuItems);
      
      sidebarContainer.setAttribute('data-loaded', 'true');
      this.updateActiveLink();
    } catch (error) {
      console.error('Error loading sidebar navigation:', error);
      const menuList = this.querySelector('#sidebarMenuList');
      if (menuList) {
        menuList.innerHTML = `
          <div class="text-white-50 small text-center py-4 px-3">
            <i class="bi bi-exclamation-octagon fs-5 text-warning d-block mb-1"></i>
            Error al cargar navegación.
          </div>
        `;
      }
    }
  }

  /**
   * Renders primary and secondary (collapsible) navigation items in the sidebar.
   */
  renderMenuTree(menuItems) {
    const menuList = this.querySelector('#sidebarMenuList');
    if (!menuList) return;

    menuList.innerHTML = '';

    const currentHash = window.location.hash || '#/';

    menuItems.forEach((item) => {
      const hasChildren = item.hijos && item.hijos.length > 0;

      if (hasChildren) {
        // Collapsible Root Item Container
        const container = document.createElement('div');
        container.className = 'w-100';

        // Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-link d-flex justify-content-between align-items-center';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = `
          <span class="d-flex align-items-center gap-2">
            <i class="${item.icono || 'bi bi-folder-fill'}"></i>
            <span>${item.nombre}</span>
          </span>
          <i class="bi bi-chevron-down submenu-arrow small" style="transition: transform 0.2s;"></i>
        `;

        // Submenu Links List
        const submenuContainer = document.createElement('ul');
        submenuContainer.className = 'sidebar-submenu collapse';
        submenuContainer.id = `submenu-${item.id}`;

        item.hijos.forEach((child) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <a href="${child.ruta}" class="submenu-link" data-hash="${child.ruta}">
              <i class="${child.icono || 'bi bi-circle-fill'}" style="font-size: 0.5rem; opacity: 0.6;"></i>
              <span>${child.nombre}</span>
            </a>
          `;
          submenuContainer.appendChild(li);
        });

        // Manual Click Toggle Logic
        toggleBtn.addEventListener('click', () => {
          const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
          toggleBtn.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
          submenuContainer.classList.toggle('show');
          
          const arrow = toggleBtn.querySelector('.submenu-arrow');
          if (arrow) {
            arrow.style.transform = !isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
          }
        });

        // Expand submenu on load if it contains the currently active route
        const hasActiveChild = item.hijos.some(child => child.ruta === currentHash);
        if (hasActiveChild) {
          toggleBtn.setAttribute('aria-expanded', 'true');
          submenuContainer.classList.add('show');
          const arrow = toggleBtn.querySelector('.submenu-arrow');
          if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
          }
        }

        container.appendChild(toggleBtn);
        container.appendChild(submenuContainer);
        menuList.appendChild(container);
      } else {
        // Flat Root Link
        const link = document.createElement('a');
        link.href = item.ruta;
        link.className = 'sidebar-link';
        link.setAttribute('data-hash', item.ruta);
        link.innerHTML = `
          <i class="${item.icono || 'bi bi-link-45deg'}"></i>
          <span>${item.nombre}</span>
        `;
        menuList.appendChild(link);
      }
    });
  }

  /**
   * Dynamically marks the matching route link as active.
   */
  updateActiveLink() {
    const currentHash = window.location.hash || '#/';
    
    // Clear previous active states
    this.querySelectorAll('.sidebar-link, .submenu-link').forEach(link => {
      link.classList.remove('active');
    });

    // Check exact hash matches
    const activeItem = this.querySelector(`[data-hash="${currentHash}"]`) || this.querySelector(`a[href="${currentHash}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      
      // If it is inside a submenu, expand parent container if not already expanded
      const submenu = activeItem.closest('.sidebar-submenu');
      if (submenu) {
        submenu.classList.add('show');
        const parentToggle = submenu.previousElementSibling;
        if (parentToggle) {
          parentToggle.setAttribute('aria-expanded', 'true');
          const arrow = parentToggle.querySelector('.submenu-arrow');
          if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
          }
        }
      }
    }
  }
}

customElements.define('app-sidebar', SidebarComponent);
