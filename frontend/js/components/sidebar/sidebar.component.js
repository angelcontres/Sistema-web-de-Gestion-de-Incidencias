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
      
      const backdrop = document.getElementById('sidebarBackdrop');
      if (backdrop) {
        if (willHide) {
          backdrop.classList.add('d-none');
        } else {
          backdrop.classList.remove('d-none');
        }
      }
    };
    window.addEventListener('toggle-sidebar', this._onToggleSidebar);

    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop && !backdrop.dataset.hasListener) {
      backdrop.dataset.hasListener = 'true';
      backdrop.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      });
    }
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
      this.classList.remove('d-none', 'collapsed');
      if (!this.menuLoaded) {
        this.loadMenuData();
      }
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
      const menuList = Array.isArray(response) ? response : response.data || [];
      localStorage.setItem('user_menu', JSON.stringify(menuList));

      const menuTree = this.buildMenuTree(menuList);

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
      // Filtrar elementos a los que el usuario no tiene acceso de lectura
      const itemRuta = safeHref(item.ruta);
      if (itemRuta && itemRuta !== '#/' && !AuthService.canAccessRoute(itemRuta)) {
        return; // Omitir esta opción del menú
      }

      lookup[item.id] = {
        ...item,
        nombre: esc(item.nombre),
        ruta: itemRuta,
        icono: safeClass(item.icono),
        children: [],
      };
    });

    menuList.forEach((item) => {
      if (!lookup[item.id]) return; // fue filtrado

      if (item.padre_id && lookup[item.padre_id]) {
        lookup[item.padre_id].children.push(lookup[item.id]);
      } else if (!item.padre_id) {
        tree.push(lookup[item.id]);
      }
    });

    // Filtrar ramas vacías (padres que se quedaron sin hijos permitidos)
    const filterTree = (nodes) => {
      return nodes.filter((node) => {
        // Si el nodo originalmente tenía hijos en la BD, se renderizará como dropdown.
        // Pero como no tenemos ese flag, solo podemos ver si ahora tiene hijos.
        // Un menú es hoja válida si AuthService lo permitió.
        if (node.children.length > 0) {
          node.children = filterTree(node.children);
          return node.children.length > 0;
        }
        // Si no tiene hijos, lo conservamos. El padre vacío se mostrará como link simple,
        // pero la mayoría de los padres vacíos (ej. Mantenimiento) no tienen AuthService allowed si sus hijos no.
        // Sin embargo, AuthService.canAccessRoute deja pasar a todos por defecto si no están en su diccionario.
        // Para no romper la UI original, dejaremos que las hojas pasen.
        // El Dashboard SIEMPRE debe pasar.
        return true;
      });
    };

    return filterTree(tree);
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
              <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-dark" href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" style="cursor: pointer;" title="${menu.nombre}">
                <i class="${menu.icono || 'bi bi-circle'} text-secondary"></i>
                <span class="text-truncate">${menu.nombre}</span>
                <span class="ms-auto p-1" style="z-index: 2; position: relative;">
                  <i class="bi bi-chevron-down small text-muted"></i>
                </span>
              </a>
            <div class="collapse ms-3" id="${collapseId}">
              <div class="nav flex-column gap-1 mt-1">
                ${menu.children
                  .map(
                    (child) => `
                  <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-dark" href="${child.ruta}" title="${child.nombre}">
                    <i class="${child.icono || 'bi bi-dot'} text-secondary"></i>
                    <span class="text-truncate">${child.nombre}</span>
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
          <a class="sidebar-link nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-dark" href="${menu.ruta}" title="${menu.nombre}">
            <i class="${menu.icono || 'bi bi-circle'} text-secondary"></i>
            <span class="text-truncate">${menu.nombre}</span>
          </a>
        `;
      }
    });

    container.innerHTML = html;

    // Handle clicks on sidebar links
    const sidebarLinks = container.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (this.classList.contains('collapsed')) {
          // Si estaba colapsado (modo mini-rail en desktop), expandirlo
          this.dataset.userHidden = 'false';
          this.classList.remove('collapsed');
        } else if (window.innerWidth < 992 && !link.dataset.bsToggle) {
          // Si estamos en móvil (ancho < 992) y tocamos un enlace final, autolimpiamos el sidebar
          window.dispatchEvent(new CustomEvent('toggle-sidebar'));
        }
      });
    });
  }

  updateActiveLink() {
    const currentHash = window.location.hash || '#/';
    const links = this.querySelectorAll('.sidebar-link');

    links.forEach((link) => {
      if (!(link instanceof HTMLElement)) return;

      const href = link.getAttribute('href');
      const isActive = href === currentHash && !link.dataset.bsToggle;

      // Si no es el enlace activo, lo limpiamos y pasamos al siguiente (Guard Clause)
      if (!isActive) {
        this._deactivateLink(link);
        return;
      }

      // Si es el enlace activo, lo encendemos
      this._activateLink(link);
      this._activateParentCollapse(link);
    });
  }

  // Métodos auxiliares para separar responsabilidades:

  _activateLink(link) {
    link.classList.remove('text-dark', 'text-secondary', 'text-primary');
    link.classList.add('active', 'bg-primary', 'text-white');

    const icon = link.querySelector('i:first-child');
    if (icon) {
      icon.classList.remove('text-secondary');
      icon.classList.add('text-white');
    }
  }

  _deactivateLink(link) {
    link.classList.remove('active', 'bg-primary', 'text-white', 'text-primary');
    link.classList.add('text-dark');

    const icon = link.querySelector('i:first-child');
    if (icon) {
      icon.classList.remove('text-white');
      icon.classList.add('text-secondary');
    }

    // nos aseguramos de que recupere el color oscuro si ya no está activo.
    if (link.dataset.bsToggle) {
      link.classList.remove('text-primary');
      link.classList.add('text-dark');
    }
  }

  _activateParentCollapse(link) {
    const parentCollapse = link.closest('.collapse');
    if (!parentCollapse) return; // Si no está dentro de un colapsable, terminamos

    parentCollapse.classList.add('show');

    // Buscamos el botón de Bootstrap que controla este colapsable
    const parentBtn = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
    const parentLink = parentBtn?.closest('.sidebar-link');

    if (parentLink) {
      parentLink.classList.remove('text-dark');
      parentLink.classList.add('text-primary');
    }
  }
}

customElements.define('app-sidebar', SideBarComponent);
