import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appUsd',
  standalone: true,
})
export class UsdPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    minDecimals: number = 2,
    maxDecimals: number = 2
  ): string {
    if (value === null || value === undefined || value === '') {
      return '$ 0.00';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) {
      return '$ 0.00';
    }
    return `$ ${num.toLocaleString('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })}`;
  }
}
