import { BaseComponent } from '../../core/base-component.js';
import { AuthService } from '../../core/auth.service.js';
import { apiRequest } from '../../core/api.js';

/**
 * Dashboard Component extending BaseComponent.
 */
export class DashboardComponent extends BaseComponent {
  constructor() {
    // Defines the path to the HTML template
    super('js/pages/dashboard/dashboard.component.html');
  }

  async onInit() {
    console.log('DashboardComponent inicializado (onInit)');

    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Set welcome messages
    const welcomeMessage = this.querySelector('#welcomeMessage');
    if (welcomeMessage) {
      welcomeMessage.textContent = `¡Bienvenido de vuelta, ${user.name || user.username}!`;
    }

    const userRoleMessage = this.querySelector('#userRoleMessage');
    if (userRoleMessage) {
      const isOperator = !user.is_admin;
      if (isOperator) {
        const countryName = user.pais ? user.pais.nombre : 'Ecuador';
        userRoleMessage.textContent = `Operador asignado a: ${countryName}`;
      } else {
        userRoleMessage.textContent = 'Administrador del Sistema';
      }
    }

    // Hide admin-only quick actions for operators
    const isOperator = !AuthService.isAdmin();
    if (isOperator) {
      const actionUsuariosCol = this.querySelector('#actionUsuariosCol');
      if (actionUsuariosCol) actionUsuariosCol.classList.add('d-none');
    }

    // Load Live Statistics
    this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    const statCategorias = this.querySelector('#statCategorias');
    const statDirecciones = this.querySelector('#statDirecciones');
    const statTerritorios = this.querySelector('#statTerritorios');
    const statLabel4 = this.querySelector('#statLabel4');
    const statValue4 = this.querySelector('#statValue4');

    try {
      // Parallel fetch to load catalog counts
      const [categorias, direcciones, territorios] = await Promise.all([
        apiRequest('/v1/categorias-incidencia'),
        apiRequest('/v1/direcciones'),
        apiRequest('/v1/territorios'),
      ]);

      if (statCategorias) statCategorias.textContent = (categorias || []).length;
      if (statDirecciones) statDirecciones.textContent = (direcciones || []).length;
      if (statTerritorios) statTerritorios.textContent = (territorios || []).length;

      // Handle fourth stat based on role
      if (AuthService.isAdmin()) {
        const paises = await apiRequest('/v1/paises');
        if (statLabel4) statLabel4.textContent = 'Países';
        if (statValue4) statValue4.textContent = (paises || []).length;
      } else {
        const user = AuthService.getCurrentUser();
        if (statLabel4) statLabel4.textContent = 'Mi País';
        if (statValue4) statValue4.textContent = user.pais ? user.pais.nombre : 'Ecuador';
      }
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
    }
  }
}

customElements.define('app-dashboard', DashboardComponent);
