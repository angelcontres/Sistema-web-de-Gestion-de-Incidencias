/**
 * Base Component for Angular-like architecture in Vanilla JS
 */
export class BaseComponent extends HTMLElement {
  /**
   * @param {string} templateUrl - Path to the component's HTML template file
   */
  constructor(templateUrl) {
    super();
    this.templateUrl = templateUrl;
  }

  async connectedCallback() {
    try {
      const response = await fetch(this.templateUrl);
      if (!response.ok) {
        throw new Error(`No se pudo cargar la plantilla: ${this.templateUrl} (HTTP ${response.status})`);
      }
      const downloadedHtmlTemplate = await response.text();
      
      // Render template inside light DOM to preserve global Bootstrap CSS applicability
      this.innerHTML = downloadedHtmlTemplate;
      
      // Trigger lifecycle hook similar to Angular's ngOnInit
      if (typeof this.onInit === 'function') {
        this.onInit();
      }
    } catch (error) {
      console.error('Error cargando componente:', error);
      this.innerHTML = `
        <div class="alert alert-danger my-3">
          <strong>Error en componente:</strong> No se pudo renderizar la plantilla en <code>${this.templateUrl}</code>.
          <br><small>${error.message}</small>
        </div>
      `;
    }
  }

  /**
   * Native Web Component lifecycle hook triggered when the element is removed from the DOM.
   * Prevents memory leaks by cleaning up events, timeouts, and observers.
   */
  disconnectedCallback() {
    if (typeof this.onDestroy === 'function') {
      this.onDestroy();
    }
  }
}
