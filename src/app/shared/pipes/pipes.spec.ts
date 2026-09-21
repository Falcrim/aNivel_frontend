import { describe, it, expect } from 'vitest';
import { CurrencyClpPipe, UsdPipe } from './currency-clp.pipe';
import { PercentPipe } from './percent.pipe';
import { WeightKgPipe } from './weight-kg.pipe';

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
});
