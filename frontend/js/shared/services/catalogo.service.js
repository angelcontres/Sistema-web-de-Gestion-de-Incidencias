import { apiRequest } from '../../core/api.js';

/**
 * Servicio para interactuar con los catálogos del sistema (Georreferenciación y Clasificación).
 */
export const CatalogoService = {
  /**
   * Obtiene la lista de países activos.
   * @returns {Promise<Array>} Lista de países
   */
  async getPaises() {
    return apiRequest('/catalogos/paises');
  },

  /**
   * Obtiene la lista de territorios activos, opcionalmente filtrados por país y/o territorio padre.
   * @param {number|string|null} [paisId] - ID del país
   * @param {number|string|null} [parentId] - ID del territorio padre (puede ser 'null' o null para obtener los departamentos/estados principales)
   * @returns {Promise<Array>} Lista de territorios
   */
  async getTerritorios(paisId = null, parentId = undefined) {
    const params = new URLSearchParams();
    if (paisId !== null && paisId !== undefined) {
      params.append('pais_id', paisId);
    }
    if (parentId !== undefined) {
      params.append('parent_id', parentId === null ? 'null' : parentId);
    }

    const queryString = params.toString();
    const endpoint = `/catalogos/territorios${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Obtiene la lista de direcciones activas, opcionalmente filtradas por territorio (último nodo/hoja).
   * @param {number|string|null} [territorioId] - ID del territorio
   * @returns {Promise<Array>} Lista de direcciones
   */
  async getDirecciones(territorioId = null) {
    const params = new URLSearchParams();
    if (territorioId !== null && territorioId !== undefined) {
      params.append('territorio_id', territorioId);
    }

    const queryString = params.toString();
    const endpoint = `/catalogos/direcciones${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Obtiene la lista de categorías de incidencia activas.
   * @param {number|string|null} [parentId] - ID de la categoría padre (puede ser 'null' o null para obtener las categorías principales)
   * @param {boolean} [soloHojas=false] - Si es true, solo retorna las categorías hoja (las cuales no poseen subcategorías)
   * @returns {Promise<Array>} Lista de categorías de incidencia
   */
  async getCategoriasIncidencia(parentId = undefined, soloHojas = false) {
    const params = new URLSearchParams();
    if (parentId !== undefined) {
      params.append('parent_id', parentId === null ? 'null' : parentId);
    }
    if (soloHojas) {
      params.append('solo_hojas', 'true');
    }

    const queryString = params.toString();
    const endpoint = `/catalogos/categorias-incidencia${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Obtiene la lista de instituciones activas.
   * @returns {Promise<Array>} Lista de instituciones
   */
  async getInstituciones() {
    return apiRequest('/catalogos/instituciones');
  },
};
