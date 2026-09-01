import { describe, it, expect } from 'vitest';
import { extractHttpErrorMessage } from './error.utils';

describe('Error Utils - extractHttpErrorMessage', () => {
  it('should return default message for null or undefined error', () => {
    expect(extractHttpErrorMessage(null)).toBe('Error desconocido');
    expect(extractHttpErrorMessage(undefined)).toBe('Error desconocido');
  });

  it('should extract string error directly', () => {
    const error = { error: 'No tienes permisos para esta acción' };
    expect(extractHttpErrorMessage(error)).toBe('No tienes permisos para esta acción');
  });

  it('should extract DRF detail field', () => {
    const error = { error: { detail: 'Obra no encontrada' } };
    expect(extractHttpErrorMessage(error)).toBe('Obra no encontrada');
  });

  it('should extract DRF field validation errors', () => {
    const error = { error: { name: ['El nombre ya existe en la base de datos'] } };
    expect(extractHttpErrorMessage(error)).toBe('El nombre ya existe en la base de datos');
  });

  it('should extract DRF non_field_errors', () => {
    const error = { error: { non_field_errors: ['La combinación de campos no es válida'] } };
    expect(extractHttpErrorMessage(error)).toBe('La combinación de campos no es válida');
  });

  it('should extract multiple field errors', () => {
    const error = {
      error: {
        unit_measure: ['Este campo es requerido'],
        unit_purchase: ['Este campo es requerido'],
      },
    };
    const result = extractHttpErrorMessage(error);
    expect(result).toContain('unit_measure');
    expect(result).toContain('unit_purchase');
  });
});
