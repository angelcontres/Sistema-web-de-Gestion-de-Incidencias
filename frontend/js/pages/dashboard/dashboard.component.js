import { BaseComponent } from '../../core/base-component.js';

/**
 * Dashboard Component extending BaseComponent.
 */
export class DashboardComponent extends BaseComponent {
  constructor() {
    // Defines the path to the HTML template
    super('js/pages/dashboard/dashboard.component.html');
  }

  onInit() {
    console.log('DashboardComponent inicializado (onInit)');
  }
}

customElements.define('app-dashboard', DashboardComponent);
