/**
 * Base Component for Angular-like architecture in Vanilla JS
 */
export class BaseComponent extends HTMLElement {
  // Objeto estático para cachear plantillas globalmente en memoria
  static templateCache = {};

  /**
   * @param {string} templateUrl - Path to the component's HTML template file
   */
  constructor(templateUrl) {
    super();
    this.templateUrl = templateUrl;
  }

  async connectedCallback() {
    try {
      // 1. Verificar si ya tenemos el HTML descargado en la caché
      if (!BaseComponent.templateCache[this.templateUrl]) {
        const response = await fetch(this.templateUrl);
        if (!response.ok) {
          throw new Error(`No se pudo cargar la plantilla: ${this.templateUrl} (HTTP ${response.status})`);
        }
        // 2. Guardar en memoria caché global
        BaseComponent.templateCache[this.templateUrl] = await response.text();
      }
      
      // Render template inside light DOM to preserve global Bootstrap CSS applicability
      this.innerHTML = BaseComponent.templateCache[this.templateUrl];
      
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
}
