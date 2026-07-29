import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('StatsCard', () => {
  let StatsCard;

  beforeAll(async () => {
    const mod = await import('./stats-card.js');
    StatsCard = mod.StatsCard;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('se define como custom element stats-card', () => {
    expect(customElements.get('stats-card')).toBe(StatsCard);
  });

  it('renderiza con valores por defecto cuando no hay atributos', () => {
    const el = document.createElement('stats-card');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('Métrica');
    expect(el.innerHTML).toContain('0');
    expect(el.innerHTML).toContain('primary');
  });

  it('renderiza card-title, card-value y type desde atributos', () => {
    const el = document.createElement('stats-card');
    el.setAttribute('card-title', 'Usuarios');
    el.setAttribute('card-value', '150');
    el.setAttribute('type', 'success');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('Usuarios');
    expect(el.innerHTML).toContain('150');
    expect(el.innerHTML).toContain('success');
    expect(el.innerHTML).toContain('bg-success-soft');
    expect(el.innerHTML).toContain('text-success');
  });

  it('usa clase danger cuando type=danger', () => {
    const el = document.createElement('stats-card');
    el.setAttribute('type', 'danger');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('bg-danger-soft');
    expect(el.innerHTML).toContain('text-danger');
  });

  it('usa clase warning cuando type=warning', () => {
    const el = document.createElement('stats-card');
    el.setAttribute('type', 'warning');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('bg-warning-soft');
    expect(el.innerHTML).toContain('text-warning');
  });

  it('usa clase primary por defecto cuando type es desconocido', () => {
    const el = document.createElement('stats-card');
    el.setAttribute('type', 'unknown');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('bg-primary-soft');
    expect(el.innerHTML).toContain('text-primary');
  });

  it('re-renderiza cuando cambian los atributos', () => {
    const el = document.createElement('stats-card');
    el.setAttribute('card-title', 'Original');
    document.body.appendChild(el);
    expect(el.innerHTML).toContain('Original');
    el.setAttribute('card-title', 'Actualizado');
    expect(el.innerHTML).toContain('Actualizado');
  });
});
