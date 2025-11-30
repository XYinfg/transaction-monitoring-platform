import { MoneyUtil } from '../money.util';

describe('MoneyUtil', () => {
  describe('toCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(MoneyUtil.toCents(10)).toBe(1000);
      expect(MoneyUtil.toCents(10.50)).toBe(1050);
      expect(MoneyUtil.toCents(0.01)).toBe(1);
      expect(MoneyUtil.toCents(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(MoneyUtil.toCents(-10)).toBe(-1000);
      expect(MoneyUtil.toCents(-10.50)).toBe(-1050);
    });

    it('should round properly to avoid floating point errors', () => {
      expect(MoneyUtil.toCents(10.555)).toBe(1056);
      expect(MoneyUtil.toCents(10.554)).toBe(1055);
    });
  });

  describe('fromCents', () => {
    it('should convert cents to dollars correctly', () => {
      expect(MoneyUtil.fromCents(1000)).toBe(10);
      expect(MoneyUtil.fromCents(1050)).toBe(10.50);
      expect(MoneyUtil.fromCents(1)).toBe(0.01);
      expect(MoneyUtil.fromCents(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(MoneyUtil.fromCents(-1000)).toBe(-10);
      expect(MoneyUtil.fromCents(-1050)).toBe(-10.50);
    });
  });

  describe('add', () => {
    it('should add money amounts correctly', () => {
      expect(MoneyUtil.add(10, 5)).toBe(15);
      expect(MoneyUtil.add(10.50, 5.25)).toBe(15.75);
    });

    it('should handle floating point precision', () => {
      // This would fail with regular JavaScript arithmetic
      expect(MoneyUtil.add(0.1, 0.2)).toBeCloseTo(0.3, 2);
      expect(MoneyUtil.add(10.01, 0.09)).toBeCloseTo(10.10, 2);
    });

    it('should handle negative numbers', () => {
      expect(MoneyUtil.add(-10, 5)).toBe(-5);
      expect(MoneyUtil.add(10, -5)).toBe(5);
      expect(MoneyUtil.add(-10, -5)).toBe(-15);
    });
  });

  describe('subtract', () => {
    it('should subtract money amounts correctly', () => {
      expect(MoneyUtil.subtract(10, 5)).toBe(5);
      expect(MoneyUtil.subtract(10.50, 5.25)).toBe(5.25);
    });

    it('should handle floating point precision', () => {
      expect(MoneyUtil.subtract(0.3, 0.1)).toBeCloseTo(0.2, 2);
      expect(MoneyUtil.subtract(10.10, 0.09)).toBeCloseTo(10.01, 2);
    });

    it('should handle negative results', () => {
      expect(MoneyUtil.subtract(5, 10)).toBe(-5);
    });
  });

  describe('multiply', () => {
    it('should multiply money amounts correctly', () => {
      expect(MoneyUtil.multiply(10, 2)).toBe(20);
      expect(MoneyUtil.multiply(10.50, 3)).toBe(31.50);
    });

    it('should handle floating point precision', () => {
      expect(MoneyUtil.multiply(0.1, 3)).toBeCloseTo(0.3, 2);
      expect(MoneyUtil.multiply(10.01, 2)).toBeCloseTo(20.02, 2);
    });

    it('should handle negative multipliers', () => {
      expect(MoneyUtil.multiply(10, -2)).toBe(-20);
      expect(MoneyUtil.multiply(-10, 2)).toBe(-20);
    });
  });

  describe('divide', () => {
    it('should divide money amounts correctly', () => {
      expect(MoneyUtil.divide(10, 2)).toBe(5);
      expect(MoneyUtil.divide(10.50, 3)).toBeCloseTo(3.5, 2);
    });

    it('should handle floating point precision', () => {
      expect(MoneyUtil.divide(0.3, 3)).toBeCloseTo(0.1, 2);
      expect(MoneyUtil.divide(10.01, 2)).toBeCloseTo(5.005, 2);
    });

    it('should throw on division by zero', () => {
      expect(() => MoneyUtil.divide(10, 0)).toThrow();
    });

    it('should handle negative divisors', () => {
      expect(MoneyUtil.divide(10, -2)).toBe(-5);
      expect(MoneyUtil.divide(-10, 2)).toBe(-5);
    });
  });

  describe('round', () => {
    it('should round money amounts correctly', () => {
      expect(MoneyUtil.round(10.555)).toBeCloseTo(10.56, 2);
      expect(MoneyUtil.round(10.554)).toBeCloseTo(10.55, 2);
      expect(MoneyUtil.round(10.001)).toBeCloseTo(10, 2);
    });

    it('should handle floating point precision', () => {
      expect(MoneyUtil.round(0.1 + 0.2)).toBeCloseTo(0.3, 2);
    });

    it('should handle negative numbers', () => {
      expect(MoneyUtil.round(-10.555)).toBeCloseTo(-10.55, 2);
    });
  });

  describe('format', () => {
    it('should format money with default currency', () => {
      expect(MoneyUtil.format(1000)).toBe('$1,000.00');
      expect(MoneyUtil.format(1000.50)).toBe('$1,000.50');
      expect(MoneyUtil.format(0.99)).toBe('$0.99');
    });

    it('should format money with specified currency', () => {
      expect(MoneyUtil.format(1000, 'EUR')).toBe('€1,000.00');
      expect(MoneyUtil.format(1000, 'GBP')).toBe('£1,000.00');
    });

    it('should handle negative amounts', () => {
      expect(MoneyUtil.format(-1000)).toBe('-$1,000.00');
    });

    it('should handle zero', () => {
      expect(MoneyUtil.format(0)).toBe('$0.00');
    });
  });
});
