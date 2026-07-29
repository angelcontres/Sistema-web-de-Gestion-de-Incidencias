import { describe, it, expect } from '@jest/globals';
import { STATE_CLASSES, getBadgeClass, getTextColorClass, getSoftClass } from './badge-states.js';

describe('STATE_CLASSES', () => {
  it('tiene las claves esperadas', () => {
    expect(STATE_CLASSES).toHaveProperty('Pendiente');
    expect(STATE_CLASSES).toHaveProperty('En Revisión');
    expect(STATE_CLASSES).toHaveProperty('En Proceso');
    expect(STATE_CLASSES).toHaveProperty('Resuelto');
    expect(STATE_CLASSES).toHaveProperty('Resuelta');
    expect(STATE_CLASSES).toHaveProperty('Rechazado');
  });

  it('cada estado tiene badge, text y soft', () => {
    for (const key of Object.keys(STATE_CLASSES)) {
      const entry = STATE_CLASSES[key];
      expect(entry).toHaveProperty('badge');
      expect(entry).toHaveProperty('text');
      expect(entry).toHaveProperty('soft');
    }
  });
});

describe('getBadgeClass', () => {
  it('retorna secondary para estado desconocido', () => {
    expect(getBadgeClass('Desconocido')).toBe('secondary');
  });

  it('retorna secondary para null', () => {
    expect(getBadgeClass(null)).toBe('secondary');
  });

  it('retorna secondary para undefined', () => {
    expect(getBadgeClass(undefined)).toBe('secondary');
  });

  it('retorna secondary para objeto sin nombre', () => {
    expect(getBadgeClass({})).toBe('secondary');
  });

  it('retorna badge correcto para Pendiente', () => {
    expect(getBadgeClass('Pendiente')).toBe('secondary');
  });

  it('retorna badge correcto para Resuelto', () => {
    expect(getBadgeClass('Resuelto')).toBe('success');
  });

  it('retorna badge correcto para Rechazado', () => {
    expect(getBadgeClass('Rechazado')).toBe('danger');
  });

  it('acepta objeto con propiedad nombre', () => {
    expect(getBadgeClass({ nombre: 'Resuelto' })).toBe('success');
  });
});

describe('getTextColorClass', () => {
  it('retorna secondary para estado desconocido', () => {
    expect(getTextColorClass('')).toBe('secondary');
  });

  it('retorna text correcto para Pendiente', () => {
    expect(getTextColorClass('Pendiente')).toBe('secondary');
  });

  it('retorna text correcto para En Proceso', () => {
    expect(getTextColorClass('En Proceso')).toBe('info');
  });
});

describe('getSoftClass', () => {
  it('retorna soft class para Resuelto', () => {
    expect(getSoftClass('Resuelto')).toContain('bg-success-soft');
  });

  it('retorna fallback para estado desconocido', () => {
    expect(getSoftClass('Foo')).toContain('bg-secondary-soft');
  });

  it('acepta objeto con propiedad nombre', () => {
    expect(getSoftClass({ nombre: 'Resuelta' })).toContain('bg-success-soft');
  });
});
