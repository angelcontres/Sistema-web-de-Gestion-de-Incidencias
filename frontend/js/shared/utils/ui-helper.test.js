import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UIHelper } from './ui-helper.js';

describe('UIHelper.mostrarAlerta', () => {
  let component;

  beforeEach(() => {
    component = document.createElement('div');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('crea un alert-container si no existe en el componente', () => {
    UIHelper.mostrarAlerta(component, 'success', 'Todo bien');
    const alertContainer = component.querySelector('.alert-container');
    expect(alertContainer).not.toBeNull();
    expect(alertContainer.className).toContain('alert-container');
  });

  it('reusa el alert-container existente', () => {
    const existing = document.createElement('div');
    existing.className = 'alert-container';
    component.appendChild(existing);
    UIHelper.mostrarAlerta(component, 'success', 'test');
    const containers = component.querySelectorAll('.alert-container');
    expect(containers).toHaveLength(1);
  });

  it('inserta el alert-container al inicio del componente', () => {
    const child = document.createElement('span');
    component.appendChild(child);
    UIHelper.mostrarAlerta(component, 'success', 'test');
    expect(component.firstChild.className).toContain('alert-container');
  });

  it('crea un alert success con el icono correcto', () => {
    UIHelper.mostrarAlerta(component, 'success', 'Operacion exitosa');
    const alertEl = component.querySelector('.alert');
    expect(alertEl).not.toBeNull();
    expect(alertEl.className).toContain('alert-success');
    expect(alertEl.innerHTML).toContain('bi-check-circle-fill');
    expect(alertEl.innerHTML).toContain('Operacion exitosa');
  });

  it('crea un alert danger con el icono correcto', () => {
    UIHelper.mostrarAlerta(component, 'error', 'Algo salio mal');
    const alertEl = component.querySelector('.alert');
    expect(alertEl).not.toBeNull();
    expect(alertEl.className).toContain('alert-danger');
    expect(alertEl.innerHTML).toContain('bi-exclamation-triangle-fill');
    expect(alertEl.innerHTML).toContain('Algo salio mal');
  });

  it('elimina alertas anteriores antes de mostrar una nueva', () => {
    UIHelper.mostrarAlerta(component, 'success', 'Mensaje 1');
    UIHelper.mostrarAlerta(component, 'error', 'Mensaje 2');
    const alerts = component.querySelectorAll('.alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].innerHTML).toContain('Mensaje 2');
  });

  it('auto-descarta la alerta tras 5 segundos llamando a click en btn-close', () => {
    UIHelper.mostrarAlerta(component, 'success', 'Se descartara');
    const closeBtn = component.querySelector('.btn-close');
    jest.spyOn(closeBtn, 'click');

    jest.advanceTimersByTime(5000);

    expect(closeBtn.click).toHaveBeenCalled();
  });

  it('tiene boton de cierre con data-bs-dismiss', () => {
    UIHelper.mostrarAlerta(component, 'error', 'test');
    const closeBtn = component.querySelector('.btn-close');
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.getAttribute('data-bs-dismiss')).toBe('alert');
  });

  it('remueve el alertEl si btn-close no existe al auto-descartar', () => {
    UIHelper.mostrarAlerta(component, 'success', 'Sin close');
    const alertEl = component.querySelector('.alert');
    alertEl.querySelector('.btn-close').remove();
    jest.advanceTimersByTime(5000);
    expect(component.querySelector('.alert')).toBeNull();
  });
});
