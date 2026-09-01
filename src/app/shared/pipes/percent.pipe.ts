import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appPercent',
  standalone: true,
})
export class PercentPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0%';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) {
      return '0%';
    }
    // If value is a decimal like 0.1, convert to 10%
    const percent = num <= 1 && num > 0 ? num * 100 : num;
    return `${percent.toFixed(0)}%`;
  }
}
