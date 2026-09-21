import { Pipe, PipeTransform } from '@angular/core';
export { UsdPipe } from './usd.pipe';

@Pipe({
  name: 'appCurrency',
  standalone: true,
})
export class CurrencyClpPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    minDecimals: number = 2,
    maxDecimals: number = 2
  ): string {
    if (value === null || value === undefined || value === '') {
      return 'Bs 0.00';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) {
      return 'Bs 0.00';
    }
    return `Bs ${num.toLocaleString('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })}`;
  }
}

export { CurrencyClpPipe as CurrencyPipe };

