import { BaseComponent } from '../../../../core/base-component.js';

// Import sub-components to register them
import '../paises/ubicaciones-paises.component.js';
import '../territorios/ubicaciones-territorios.component.js';
import '../direcciones/ubicaciones-direcciones.component.js';

export class UbicacionesIndexComponent extends BaseComponent {
  constructor() {
    super('js/pages/ubicaciones/component/index/ubicaciones-index.component.html');
  }

  onInit() {
    console.log('Contenedor principal de Ubicaciones inicializado.');

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
