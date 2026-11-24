import { describe, it, expect } from 'vitest';
import { CurrencyClpPipe, UsdPipe } from './currency-clp.pipe';
import { PercentPipe } from './percent.pipe';
import { WeightKgPipe } from './weight-kg.pipe';
import { CompactNumberPipe } from './compact-number.pipe';

describe('Shared Pipes', () => {
  describe('CurrencyClpPipe (appCurrency)', () => {
    const pipe = new CurrencyClpPipe();

    it('should format numbers with standard Bolivianos currency style', () => {
      const formatted = pipe.transform(1500000);
      expect(formatted).toBe('Bs 1,500,000.00');
      expect(formatted.startsWith('Bs ')).toBe(true);
    });

    it('should return Bs 0.00 for null or undefined or empty', () => {
      expect(pipe.transform(null)).toBe('Bs 0.00');
      expect(pipe.transform(undefined)).toBe('Bs 0.00');
      expect(pipe.transform('')).toBe('Bs 0.00');
    });

    it('should handle decimal numbers with comma for thousands and dot for decimals', () => {
      const formatted = pipe.transform(1234.5);
      expect(formatted).toBe('Bs 1,234.50');
    });
  });

  describe('UsdPipe (appUsd)', () => {
    const pipe = new UsdPipe();

    it('should format numbers with standard US Dollar style', () => {
      const formatted = pipe.transform(29658.01);
      expect(formatted).toBe('$ 29,658.01');
      expect(formatted.startsWith('$ ')).toBe(true);
    });

    it('should return $ 0.00 for null or undefined or empty', () => {
      expect(pipe.transform(null)).toBe('$ 0.00');
      expect(pipe.transform(undefined)).toBe('$ 0.00');
      expect(pipe.transform('')).toBe('$ 0.00');
    });

    it('should handle decimals properly with thousands commas', () => {
      const formatted = pipe.transform(129.23);
      expect(formatted).toBe('$ 129.23');
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

    it('should format kilograms with thousands commas and max decimals', () => {
      expect(pipe.transform(2500)).toBe('2,500 kg');
      expect(pipe.transform(12450.5)).toBe('12,450.5 kg');
    });

    it('should return 0 kg for empty or null or 0', () => {
      expect(pipe.transform(null)).toBe('0 kg');
      expect(pipe.transform(0)).toBe('0 kg');
    });
  });

  describe('CompactNumberPipe (appDecimal)', () => {
    const pipe = new CompactNumberPipe();

    it('should format whole numbers or numbers ending with .0000 with 1 fixed decimal', () => {
      expect(pipe.transform(30)).toBe('30.0');
      expect(pipe.transform('30.0000')).toBe('30.0');
      expect(pipe.transform(1)).toBe('1.0');
      expect(pipe.transform('1.0000')).toBe('1.0');
      expect(pipe.transform(0)).toBe('0.0');
      expect(pipe.transform('0.0000')).toBe('0.0');
    });

    it('should format 1 or 2 significant decimals without trailing zero clutter', () => {
      expect(pipe.transform(12.5)).toBe('12.5');
      expect(pipe.transform('12.5000')).toBe('12.5');
      expect(pipe.transform(12.25)).toBe('12.25');
      expect(pipe.transform('12.2500')).toBe('12.25');
    });

    it('should format up to 3 decimals when non-zero digits exceed 2', () => {
      expect(pipe.transform(1.125)).toBe('1.125');
      expect(pipe.transform('1.1250')).toBe('1.125');
      expect(pipe.transform('1.3333')).toBe('1.333');
    });

    it('should return - for empty, null, or invalid numbers', () => {
      expect(pipe.transform(null)).toBe('-');
      expect(pipe.transform(undefined)).toBe('-');
      expect(pipe.transform('')).toBe('-');
      expect(pipe.transform('invalid')).toBe('-');
    });
  });
});
