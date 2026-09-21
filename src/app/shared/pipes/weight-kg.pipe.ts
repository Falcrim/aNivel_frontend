import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appWeight',
  standalone: true,
})
export class WeightKgPipe implements PipeTransform {
  transform(value: number | string | null | undefined, maxDecimals: number = 1): string {
    if (value === null || value === undefined || value === '') {
      return '0 kg';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num) || num <= 0) {
      return '0 kg';
    }
    return `${num.toLocaleString('en-US', {
      maximumFractionDigits: maxDecimals,
    })} kg`;
  }
}
