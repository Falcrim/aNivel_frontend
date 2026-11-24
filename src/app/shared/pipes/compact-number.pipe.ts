import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea números según la directriz universal de la constructora:
 * - Si los decimales son ceros (ej. 30.0000, 1.0000), muestra 1 decimal fijo (30.0, 1.0).
 * - Si tiene 1 o 2 decimales significativos (ej. 12.5, 12.25), los respeta.
 * - Si tiene más de 2 decimales, muestra hasta un máximo de 3 decimales (ej. 1.125, 1.333).
 */
export function formatCompactDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) {
    return '-';
  }

  // Si no tiene decimales o son todos ceros (ej. 30, 30.0000, 1) -> 1 decimal fijo
  if (num % 1 === 0) {
    return num.toFixed(1);
  }

  // Redondear a máximo estricto de 3 decimales
  const roundedTo3 = Number(num.toFixed(3));
  if (roundedTo3 % 1 === 0) {
    return roundedTo3.toFixed(1);
  }

  const str = roundedTo3.toString();
  const decimalPart = str.split('.')[1] || '';

  if (decimalPart.length === 1) {
    return roundedTo3.toFixed(1);
  }
  if (decimalPart.length === 2) {
    return roundedTo3.toFixed(2);
  }
  return roundedTo3.toFixed(3);
}

@Pipe({
  name: 'appDecimal',
  standalone: true,
})
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return formatCompactDecimal(value);
  }
}

export { CompactNumberPipe as AppDecimalPipe };
