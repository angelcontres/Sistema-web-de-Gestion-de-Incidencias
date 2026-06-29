import { BaseComponent } from '../../../../core/base-component.js';

// Import sub-components to register them
import '../paises/ubicaciones-paises.component.js';
import '../territorios/ubicaciones-territorios.component.js';
import '../direcciones/ubicaciones-direcciones.component.js';

export class UbicacionesIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/components/index/ubicaciones-index.component.html');
  }

  onInit() {
    console.log('Contenedor principal de Ubicaciones inicializado.');

    const isAdmin = AuthService.isAdmin();
    if (!isAdmin) {
      // Hide Paises tab header
      const paisesTab = this.querySelector('#paises-tab');
      if (paisesTab) {
        paisesTab.parentElement.classList.add('d-none');
        paisesTab.classList.remove('active');
        paisesTab.setAttribute('aria-selected', 'false');
      }

      // Hide Paises pane
      const paisesPane = this.querySelector('#paises-pane');
      if (paisesPane) {
        paisesPane.classList.remove('show', 'active');
      }

      // Show Territorios tab header as active
      const territoriosTab = this.querySelector('#territorios-tab');
      if (territoriosTab) {
        territoriosTab.classList.add('active');
        territoriosTab.setAttribute('aria-selected', 'true');
      }

      // Show Territorios pane as active
      const territoriosPane = this.querySelector('#territorios-pane');
      if (territoriosPane) {
        territoriosPane.classList.add('show', 'active');
      }
    }

    // Leaflet map needs size validation when its tab is shown
    const direccionesTab = this.querySelector('#direcciones-tab');
    if (direccionesTab) {
      direccionesTab.addEventListener('shown.bs.tab', () => {
        const dirComponent = this.querySelector('#direccionesComponent');
        if (dirComponent && typeof dirComponent.initMainMap === 'function') {
          dirComponent.initMainMap();
        }
      });
    }
  }
}

// Register Web Component
customElements.define('app-ubicaciones-index', UbicacionesIndexComponent);
