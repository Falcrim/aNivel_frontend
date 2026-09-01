import { describe, it, expect } from 'vitest';
import { CurrencyClpPipe } from './currency-clp.pipe';
import { PercentPipe } from './percent.pipe';
import { WeightKgPipe } from './weight-kg.pipe';

describe('Shared Pipes', () => {
  describe('CurrencyClpPipe', () => {
    const pipe = new CurrencyClpPipe();

    it('should format numbers with chilean currency style', () => {
      const formatted = pipe.transform(1500000);
      expect(formatted).toContain('1.500.000');
      expect(formatted.startsWith('$')).toBe(true);
    });

    it('should return $0,00 for null or undefined or empty', () => {
      expect(pipe.transform(null)).toBe('$0,00');
      expect(pipe.transform(undefined)).toBe('$0,00');
      expect(pipe.transform('')).toBe('$0,00');
    });

    it('should handle decimal numbers with 2 decimals', () => {
      const formatted = pipe.transform(1234.5);
      expect(formatted).toContain('1.234,50');
    });
  });

  describe('PercentPipe', () => {
    const pipe = new PercentPipe();

    it('should convert decimals (0.1) to percentages (10%)', () => {
      expect(pipe.transform(0.1)).toBe('10%');
      expect(pipe.transform(0.05)).toBe('5%');
    });

    it('should keep already whole percentages (15)', () => {
      expect(pipe.transform(15)).toBe('15%');
    });

    it('should return 0% for empty or null', () => {
      expect(pipe.transform(null)).toBe('0%');
      expect(pipe.transform(undefined)).toBe('0%');
      expect(pipe.transform('')).toBe('0%');
    });
  });

  describe('WeightKgPipe', () => {
    const pipe = new WeightKgPipe();

    it('should format kilograms with max decimals', () => {
      expect(pipe.transform(2500)).toContain('2.500');
      expect(pipe.transform(2500)).toContain('kg');
    });

    it('should return 0 kg for empty or null or 0', () => {
      expect(pipe.transform(null)).toBe('0 kg');
      expect(pipe.transform(0)).toBe('0 kg');
    });
  });
});
