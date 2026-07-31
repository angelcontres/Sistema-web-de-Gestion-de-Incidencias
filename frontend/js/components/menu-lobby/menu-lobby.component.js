import { BaseComponent } from '../../core/base-component.js';
import { apiRequest } from '../../core/api.js';

export class MenuLobbyComponent extends BaseComponent {
  constructor() {
    super('js/components/menu-lobby/menu-lobby.component.html');
  }

  async onInit() {
    this.renderLobby();

    // Re-render if hash changes while already on a lobby component
    this._onHashChange = () => {
      this.renderLobby();
    };
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    if (this._onHashChange) window.removeEventListener('hashchange', this._onHashChange);
  }

  async renderLobby() {
    const currentHash = window.location.hash || '#/';
    
    const menuList = await this.getMenuList();
    const titleEl = this.querySelector('#lobby-title');
    const container = this.querySelector('#lobby-cards-container');

    if (!menuList || !titleEl || !container) return;

    const parentMenu = this.getParentMenu(menuList, currentHash);
    if (!parentMenu) {
      titleEl.textContent = 'Menú no encontrado';
      container.innerHTML =
        '<div class="col-12"><p class="text-muted">No se encontraron opciones para esta sección.</p></div>';
      return;
    }

    titleEl.innerHTML = `<i class="${parentMenu.icono || ''} me-2 text-primary"></i> ${parentMenu.nombre}`;

    const children = menuList.filter((m) => m.padre_id === parentMenu.id);
    if (children.length === 0) {
      container.innerHTML =
        '<div class="col-12"><p class="text-muted">No hay submenús disponibles.</p></div>';
      return;
    }

    this.renderChildrenCards(container, children);
    this.addHoverEffects(container);
  }

  async getMenuList() {
    let menuList = null;
    try {
      const menuStr = localStorage.getItem('user_menu');
      if (menuStr) {
        const parsed = JSON.parse(menuStr);
        menuList = Array.isArray(parsed) ? parsed : parsed.data || null;
      }
    } catch (e) {
      console.error('Error parsing user menu from localStorage:', e);
    }

    if (!menuList || !Array.isArray(menuList) || menuList.length === 0) {
      try {
        const response = await apiRequest('/me/menu', { method: 'GET' });
        menuList = response.data || response;
        localStorage.setItem('user_menu', JSON.stringify(menuList));
      } catch (err) {
        console.error('Error fetching menu for lobby:', err);
      }
    }
    return menuList;
  }

  getParentMenu(menuList, currentHash) {
    const basePath = currentHash.split('?')[0];
    return menuList.find((m) => {
      const safeHref = m.ruta?.startsWith('#') ? m.ruta : '#/';
      return safeHref === basePath;
    });
  }

  renderChildrenCards(container, children) {
    let cardsHtml = '';
    children.forEach((child) => {
      const safeHref = child.ruta?.startsWith('#') ? child.ruta : '#/';
      cardsHtml += `
        <div class="col-12 col-md-6 col-lg-4">
          <a href="${safeHref}" class="text-decoration-none">
            <div class="card h-100 border-0 shadow-sm rounded-4 menu-lobby-card transition-all" style="cursor: pointer;">
              <div class="card-body p-4 d-flex align-items-center">
                <div class="icon-box bg-primary-soft text-primary rounded-3 d-flex align-items-center justify-content-center p-3 me-3" style="width: 60px; height: 60px; font-size: 24px;">
                  <i class="${child.icono || 'bi bi-dot'}"></i>
                </div>
                <div>
                  <h5 class="card-title fw-bold text-dark mb-1">${child.nombre}</h5>
                  <p class="card-text text-muted small mb-0">Acceder a ${child.nombre.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
        `;
    });
    container.innerHTML = cardsHtml;
  }

  addHoverEffects(container) {
    const cards = container.querySelectorAll('.menu-lobby-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('shadow');
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('shadow');
        card.style.transform = 'translateY(0)';
      });
    });
  }
}

customElements.define('app-menu-lobby', MenuLobbyComponent);
