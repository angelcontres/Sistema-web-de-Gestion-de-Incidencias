import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToastService } from './toast.service.js';

describe('ToastService', () => {
  let origCreateElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = origCreateElement(tagName);
      el.show = jest.fn();
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('getContainer', () => {
    it('should create container when it does not exist', () => {
      expect(document.getElementById('toast-container')).toBeNull();
      const container = ToastService.getContainer();
      expect(container).toBeInstanceOf(HTMLElement);
      expect(container.id).toBe('toast-container');
      expect(container.className).toBe('toast-container position-fixed top-0 end-0 p-3 mt-5');
      expect(container.style.zIndex).toBe('1090');
      expect(document.getElementById('toast-container')).toBe(container);
    });

    it('should return existing container if already in DOM', () => {
      const existing = document.createElement('div');
      existing.id = 'toast-container';
      document.body.appendChild(existing);
      const container = ToastService.getContainer();
      expect(container).toBe(existing);
    });
  });

  describe('show', () => {
    it('should create an app-toast element and append it to container', () => {
      ToastService.show('success', 'Operation completed');
      const container = document.getElementById('toast-container');
      expect(container).not.toBeNull();
      const toasts = container.querySelectorAll('app-toast');
      expect(toasts).toHaveLength(1);
    });

    it('should call show on the app-toast element with type, message, title', () => {
      ToastService.show('error', 'Something failed', 'Error Title');
      const container = document.getElementById('toast-container');
      const toasts = container.querySelectorAll('app-toast');
      expect(toasts[0].show).toHaveBeenCalledWith('error', 'Something failed', 'Error Title');
    });

    it('should use empty string as default title', () => {
      ToastService.show('info', 'Just info');
      const container = document.getElementById('toast-container');
      const toasts = container.querySelectorAll('app-toast');
      expect(toasts[0].show).toHaveBeenCalledWith('info', 'Just info', '');
    });

    it('should remove the newest toast when 3 are already visible', () => {
      ToastService.show('success', 'Toast 1');
      ToastService.show('success', 'Toast 2');
      ToastService.show('success', 'Toast 3');
      const container = document.getElementById('toast-container');
      expect(container.querySelectorAll('app-toast')).toHaveLength(3);
      const toastsBefore = container.querySelectorAll('app-toast');
      jest.spyOn(toastsBefore[2], 'remove');
      ToastService.show('warning', 'Toast 4');
      expect(toastsBefore[2].remove).toHaveBeenCalled();
      expect(container.querySelectorAll('app-toast')).toHaveLength(3);
    });

    it('should not remove toasts when fewer than 3', () => {
      ToastService.show('success', 'Toast 1');
      ToastService.show('success', 'Toast 2');
      const container = document.getElementById('toast-container');
      const toastsBefore = container.querySelectorAll('app-toast');
      jest.spyOn(toastsBefore[0], 'remove');
      jest.spyOn(toastsBefore[1], 'remove');
      ToastService.show('info', 'Toast 3');
      expect(toastsBefore[0].remove).not.toHaveBeenCalled();
      expect(toastsBefore[1].remove).not.toHaveBeenCalled();
      expect(container.querySelectorAll('app-toast')).toHaveLength(3);
    });
  });

  describe('convenience methods', () => {
    it('success should call show with success type', () => {
      jest.spyOn(ToastService, 'show');
      ToastService.success('All good');
      expect(ToastService.show).toHaveBeenCalledWith('success', 'All good', '');
    });

    it('error should call show with error type', () => {
      jest.spyOn(ToastService, 'show');
      ToastService.error('Bad error');
      expect(ToastService.show).toHaveBeenCalledWith('error', 'Bad error', '');
    });

    it('warning should call show with warning type', () => {
      jest.spyOn(ToastService, 'show');
      ToastService.warning('Be careful');
      expect(ToastService.show).toHaveBeenCalledWith('warning', 'Be careful', '');
    });

    it('info should call show with info type', () => {
      jest.spyOn(ToastService, 'show');
      ToastService.info('FYI');
      expect(ToastService.show).toHaveBeenCalledWith('info', 'FYI', '');
    });

    it('convenience methods should pass title to show', () => {
      jest.spyOn(ToastService, 'show');
      ToastService.success('Done', 'Success Title');
      expect(ToastService.show).toHaveBeenCalledWith('success', 'Done', 'Success Title');
    });
  });
});
