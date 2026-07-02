import { BaseComponent } from '../../../../core/base-component.js';
import { AuthService } from '../../../../core/auth.service.js';

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
      }

      // Hide Paises pane
      const paisesPane = this.querySelector('#paises-pane');
      if (paisesPane) {
        paisesPane.classList.add('d-none');
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

    // If Direcciones is the active tab on load, initialize the map
    const direccionesPane = this.querySelector('#direcciones-pane');
    if (direccionesPane && direccionesPane.classList.contains('active')) {
      setTimeout(() => {
        const dirComponent = this.querySelector('#direccionesComponent');
        if (dirComponent && typeof dirComponent.initMainMap === 'function') {
          dirComponent.initMainMap();
        }
      }, 100);
    }
  }
}

// Register Web Component
customElements.define('app-ubicaciones-index', UbicacionesIndexComponent);
