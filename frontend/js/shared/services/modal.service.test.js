import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ModalService } from './modal.service.js';

describe('ModalService', () => {
  let appendSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (appendSpy) {
      appendSpy.mockRestore();
      appendSpy = null;
    }
    jest.restoreAllMocks();
  });

  it('confirm - crea app-modal, lo agrega al body, llama show y retorna resultado', async () => {
    const modalEl = document.createElement('div');
    modalEl.show = jest.fn().mockResolvedValue(true);
    jest.spyOn(document, 'createElement').mockReturnValue(modalEl);
    appendSpy = jest.spyOn(document.body, 'appendChild');

    const result = await ModalService.confirm('Titulo', 'Mensaje');

    expect(document.createElement).toHaveBeenCalledWith('app-modal');
    expect(appendSpy).toHaveBeenCalledWith(modalEl);
    expect(modalEl.show).toHaveBeenCalledWith({
      title: 'Titulo',
      message: 'Mensaje',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      btnClass: 'btn-primary'
    });
    expect(result).toBe(true);
  });

  it('confirm - usa valores por defecto para cancelText y btnClass', async () => {
    const modalEl = document.createElement('div');
    modalEl.show = jest.fn().mockResolvedValue(false);
    jest.spyOn(document, 'createElement').mockReturnValue(modalEl);
    appendSpy = jest.spyOn(document.body, 'appendChild');

    const result = await ModalService.confirm('Test', 'Msg');

    expect(modalEl.show).toHaveBeenCalledWith({
      title: 'Test',
      message: 'Msg',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      btnClass: 'btn-primary'
    });
    expect(result).toBe(false);
  });

  it('confirm - usa parametros personalizados', async () => {
    const modalEl = document.createElement('div');
    modalEl.show = jest.fn().mockResolvedValue(true);
    jest.spyOn(document, 'createElement').mockReturnValue(modalEl);
    appendSpy = jest.spyOn(document.body, 'appendChild');

    await ModalService.confirm('T', 'M', 'Si', 'No', 'btn-danger');

    expect(modalEl.show).toHaveBeenCalledWith({
      title: 'T',
      message: 'M',
      confirmText: 'Si',
      cancelText: 'No',
      btnClass: 'btn-danger'
    });
  });
});
