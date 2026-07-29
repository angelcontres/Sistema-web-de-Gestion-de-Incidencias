import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../../core/api.js', () => ({ apiRequest: jest.fn() }));

const { apiRequest } = await import('../../../core/api.js');
const { InstitucionService } = await import('./institucion.service.js');

describe('InstitucionService', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  describe('getAll', () => {
    it('should call apiRequest with default pagination', () => {
      InstitucionService.getAll();
      expect(apiRequest).toHaveBeenCalledWith('/institutions?per_page=15&page=1');
    });

    it('should include search param when provided', () => {
      InstitucionService.getAll(1, 15, null, { search: 'test' });
      expect(apiRequest).toHaveBeenCalledWith('/institutions?search=test&per_page=15&page=1');
    });

    it('should use cursor and exclude page when cursor provided', () => {
      InstitucionService.getAll(1, 15, 'abc123');
      expect(apiRequest).toHaveBeenCalledWith('/institutions?per_page=15&cursor=abc123');
    });

    it('should include all flag when params.all is true', () => {
      InstitucionService.getAll(1, 15, null, { all: true });
      expect(apiRequest).toHaveBeenCalledWith('/institutions?all=true&per_page=15&page=1');
    });

    it('should use custom page and perPage', () => {
      InstitucionService.getAll(3, 50);
      expect(apiRequest).toHaveBeenCalledWith('/institutions?per_page=50&page=3');
    });
  });

  describe('getById', () => {
    it('should call apiRequest with the institution id', () => {
      InstitucionService.getById(5);
      expect(apiRequest).toHaveBeenCalledWith('/institutions/5');
    });
  });

  describe('create', () => {
    it('should call apiRequest with POST method and JSON body', () => {
      const payload = { name: 'New Institution' };
      InstitucionService.create(payload);
      expect(apiRequest).toHaveBeenCalledWith('/institutions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('update', () => {
    it('should call apiRequest with PUT method and JSON body', () => {
      const payload = { name: 'Updated Institution' };
      InstitucionService.update(5, payload);
      expect(apiRequest).toHaveBeenCalledWith('/institutions/5', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('delete', () => {
    it('should call apiRequest with DELETE method', () => {
      InstitucionService.delete(5);
      expect(apiRequest).toHaveBeenCalledWith('/institutions/5', {
        method: 'DELETE',
      });
    });
  });
});
