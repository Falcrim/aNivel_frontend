import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
  standalone: true,
})
export class CurrencyClpPipe implements PipeTransform {
  transform(value: number | string | null | undefined, minDecimals: number = 2): string {
    if (value === null || value === undefined || value === '') {
      return '$0,00';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) {
      return '$0,00';
    }
    return `$${num.toLocaleString('es-CL', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: 2,
    })}`;
  }
}
