import { apiRequest } from '../../core/api.js';

/**
 * Utilidad privada para cachear respuestas en LocalStorage
 */
async function withCache(key, ttlMinutes, fetcher) {
  const cachedItem = localStorage.getItem(key);

  if (cachedItem) {
    try {
      const { value, expiry } = JSON.parse(cachedItem);
      if (Date.now() < expiry) {
        return value;
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error: ${e}`);
      localStorage.removeItem(key);
    }
  }

  const data = await fetcher();
  if (data) {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    localStorage.setItem(key, JSON.stringify({ value: data, expiry }));
  }
  return data;
}

/**
 * Servicio para interactuar con los catálogos del sistema (Georreferenciación y Clasificación).
 */
export const CatalogoService = {
  /**
   * Obtiene la lista de países activos.
   */
  async getPaises() {
    return withCache('catalogo_paises', 1440, () => apiRequest('/catalogs/countries'));
  },

  /**
   * Obtiene la lista de territorios activos.
   */
  async getTerritorios(paisId = null, parentId = undefined) {
    const params = new URLSearchParams();
    if (paisId !== null && paisId !== undefined) params.append('pais_id', paisId);
    if (parentId !== undefined) params.append('parent_id', parentId === null ? 'null' : parentId);

    const queryString = params.toString();

    const prefix = queryString ? '?' : '';

    const endpoint = `/catalogs/territories${prefix}${queryString}`;

    // Cache key based on query string to keep different combos cached
    const cacheKey = `catalogo_territorios_${queryString || 'all'}`;
    return withCache(cacheKey, 1440, () => apiRequest(endpoint));
  },

  /**
   * Obtiene la lista de direcciones activas.
   */
  async getDirecciones(territorioId = null) {
    const params = new URLSearchParams();
    if (territorioId !== null && territorioId !== undefined)
      params.append('territorio_id', territorioId);

    const queryString = params.toString();

    const prefix = queryString ? '?' : '';

    const endpoint = `/catalogs/addresses${prefix}${queryString}`;

    // Cache key based on query string
    const cacheKey = `catalogo_direcciones_${queryString || 'all'}`;
    return withCache(cacheKey, 1440, () => apiRequest(endpoint));
  },

  /**
   * Limpia la caché de direcciones (útil después de crear una nueva dirección).
   */
  clearDireccionesCache(territorioId = null) {
    const params = new URLSearchParams();
    if (territorioId !== null && territorioId !== undefined)
      params.append('territorio_id', territorioId);
    const queryString = params.toString();
    const cacheKey = `catalogo_direcciones_${queryString || 'all'}`;
    localStorage.removeItem(cacheKey);
  },

  /**
   * Obtiene la lista de categorías de incidencia activas.
   */
  async getCategoriasIncidencia(parentId = undefined, soloHojas = false) {
    const params = new URLSearchParams();
    if (parentId !== undefined) params.append('parent_id', parentId === null ? 'null' : parentId);
    if (soloHojas) params.append('solo_hojas', 'true');

    const queryString = params.toString();

    //usamos condicional simple primero para no complicarnos
    const prefix = queryString ? '?' : '';

    const endpoint = `/catalogs/incident-categories${prefix}${queryString}`;

    const cacheKey = `catalogo_categorias_${queryString || 'all'}`;
    return withCache(cacheKey, 1440, () => apiRequest(endpoint));
  },

  /**
   * Limpia toda la caché de categorías de incidencia en localStorage.
   * Debe llamarse tras crear, editar o eliminar una categoría.
   */
  clearCategoriasCache() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('catalogo_categorias_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },

  /**
   * Obtiene la lista de instituciones activas.
   */
  async getInstituciones() {
    return withCache('catalogo_instituciones', 1440, () => apiRequest('/catalogs/institutions'));
  },

  /**
   * Obtiene la lista de estados de incidencia activos.
   */
  async getEstados() {
    return withCache('catalogo_estados', 1440, () => apiRequest('/catalogs/incident-states'));
  },

  /**
   * Obtiene la lista de prioridades activas.
   */
  async getPrioridades() {
    return withCache('catalogo_prioridades', 1440, () => apiRequest('/catalogs/priorities'));
  },
};
