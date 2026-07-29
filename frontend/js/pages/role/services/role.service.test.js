import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../../core/api.js', () => ({ apiRequest: jest.fn() }));

const { apiRequest } = await import('../../../core/api.js');
const { RoleService } = await import('./role.service.js');

describe('RoleService', () => {
  beforeEach(() => {
    apiRequest.mockReset();
  });

  describe('getAll', () => {
    it('should call apiRequest with default pagination', () => {
      RoleService.getAll();
      expect(apiRequest).toHaveBeenCalledWith('/roles?per_page=15&page=1');
    });

    it('should include all flag when params.all is true', () => {
      RoleService.getAll(1, 15, null, { all: true });
      expect(apiRequest).toHaveBeenCalledWith('/roles?per_page=15&all=true&page=1');
    });

    it('should use cursor and exclude page when cursor provided', () => {
      RoleService.getAll(1, 15, 'cursorVal');
      expect(apiRequest).toHaveBeenCalledWith('/roles?per_page=15&cursor=cursorVal');
    });

    it('should use custom page and perPage', () => {
      RoleService.getAll(2, 25);
      expect(apiRequest).toHaveBeenCalledWith('/roles?per_page=25&page=2');
    });
  });

  describe('getById', () => {
    it('should call apiRequest with the role id', () => {
      RoleService.getById(10);
      expect(apiRequest).toHaveBeenCalledWith('/roles/10');
    });
  });

  describe('create', () => {
    it('should call apiRequest with POST method and JSON body', () => {
      const payload = { name: 'New Role' };
      RoleService.create(payload);
      expect(apiRequest).toHaveBeenCalledWith('/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('update', () => {
    it('should call apiRequest with PUT method and JSON body', () => {
      const payload = { name: 'Updated Role' };
      RoleService.update(10, payload);
      expect(apiRequest).toHaveBeenCalledWith('/roles/10', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('delete', () => {
    it('should call apiRequest with DELETE method', () => {
      RoleService.delete(10);
      expect(apiRequest).toHaveBeenCalledWith('/roles/10', {
        method: 'DELETE',
      });
    });
  });

  describe('assignPermissions', () => {
    it('should call apiRequest with POST method and permissions payload', () => {
      const payload = { permissions: [1, 2, 3] };
      RoleService.assignPermissions(10, payload);
      expect(apiRequest).toHaveBeenCalledWith('/roles/10/permissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });
});
