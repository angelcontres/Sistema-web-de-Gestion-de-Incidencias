import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../core/api.js', () => ({
  apiRequest: jest.fn()
}));

const { CatalogoService } = await import('./catalogo.service.js');
const { apiRequest } = await import('../../core/api.js');

describe('CatalogoService', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      key: jest.fn(() => null),
      clear: jest.fn(),
      length: 0
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    apiRequest.mockClear();
  });

  afterEach(() => {
    delete window.localStorage;
  });

  describe('getPaises', () => {
    it('llama apiRequest a /catalogs/countries cuando no hay cache', async () => {
      apiRequest.mockResolvedValue([{ id: 1, nombre: 'Ecuador' }]);
      const result = await CatalogoService.getPaises();
      expect(apiRequest).toHaveBeenCalledWith('/catalogs/countries');
      expect(result).toEqual([{ id: 1, nombre: 'Ecuador' }]);
    });

    it('retorna datos cacheados si no han expirado', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        value: [{ id: 1, nombre: 'Ecuador' }],
        expiry: Date.now() + 999999
      }));
      apiRequest.mockResolvedValue([{ id: 2 }]);
      const result = await CatalogoService.getPaises();
      expect(apiRequest).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, nombre: 'Ecuador' }]);
    });

    it('ignora cache expirado y llama apiRequest', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        value: [{ id: 1 }],
        expiry: Date.now() - 1000
      }));
      apiRequest.mockResolvedValue([{ id: 2, nombre: 'Peru' }]);
      const result = await CatalogoService.getPaises();
      expect(apiRequest).toHaveBeenCalled();
      expect(result).toEqual([{ id: 2, nombre: 'Peru' }]);
    });

    it('maneja JSON invalido en cache, elimina la clave y llama apiRequest', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      apiRequest.mockResolvedValue([{ id: 99 }]);
      const result = await CatalogoService.getPaises();
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('catalogo_paises');
      expect(apiRequest).toHaveBeenCalled();
      expect(result).toEqual([{ id: 99 }]);
      consoleSpy.mockRestore();
    });
  });

  describe('getTerritorios', () => {
    it('llama apiRequest con query params cuando se pasa paisId', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getTerritorios(1);
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('pais_id=1'));
    });

    it('llama apiRequest sin params cuando no se pasan argumentos', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getTerritorios();
      expect(apiRequest).toHaveBeenCalledWith('/catalogs/territories');
    });
  });

  describe('getDirecciones', () => {
    it('llama apiRequest con territorio_id cuando se pasa', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getDirecciones(5);
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('territorio_id=5'));
    });

    it('llama apiRequest sin params cuando no se pasa territorioId', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getDirecciones();
      expect(apiRequest).toHaveBeenCalledWith('/catalogs/addresses');
    });
  });

  describe('clearDireccionesCache', () => {
    it('remueve la clave de cache correcta', () => {
      CatalogoService.clearDireccionesCache();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('catalogo_direcciones_all');
    });

    it('remueve cache con territorio_id cuando se pasa', () => {
      CatalogoService.clearDireccionesCache(3);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('catalogo_direcciones_territorio_id=3');
    });
  });

  describe('getCategoriasIncidencia', () => {
    it('llama apiRequest con parent_id cuando se pasa', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getCategoriasIncidencia(10);
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('parent_id=10'));
    });

    it('llama apiRequest con solo_hojas=true cuando se pasa', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getCategoriasIncidencia(undefined, true);
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('solo_hojas=true'));
    });
  });

  describe('clearCategoriasCache', () => {
    it('remueve todas las claves de categorias del localStorage', () => {
      const keys = ['catalogo_categorias_all', 'catalogo_categorias_parent_id=1', 'other_key'];
      mockLocalStorage.length = keys.length;
      mockLocalStorage.key.mockImplementation((i) => keys[i] || null);

      CatalogoService.clearCategoriasCache();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('catalogo_categorias_all');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('catalogo_categorias_parent_id=1');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });

  describe('getInstituciones', () => {
    it('llama apiRequest a /catalogs/institutions', async () => {
      apiRequest.mockResolvedValue([]);
      await CatalogoService.getInstituciones();
      expect(apiRequest).toHaveBeenCalledWith('/catalogs/institutions');
    });
  });
});
