/**
 * Money utility for safe decimal operations on financial amounts
 * Uses integer arithmetic to avoid floating-point precision issues
 */
export class MoneyUtil {
  private static readonly PRECISION = 2;
  private static readonly MULTIPLIER = Math.pow(10, MoneyUtil.PRECISION);

  /**
   * Convert decimal to integer cents
   */
  static toCents(amount: number): number {
    return Math.round(amount * MoneyUtil.MULTIPLIER);
  }

  /**
   * Convert integer cents to decimal
   */
  static fromCents(cents: number): number {
    return cents / MoneyUtil.MULTIPLIER;
  }

  /**
   * Add two amounts safely
   */
  static add(a: number, b: number): number {
    return MoneyUtil.fromCents(MoneyUtil.toCents(a) + MoneyUtil.toCents(b));
  }

  /**
   * Subtract two amounts safely
   */
  static subtract(a: number, b: number): number {
    return MoneyUtil.fromCents(MoneyUtil.toCents(a) - MoneyUtil.toCents(b));
  }

  /**
   * Multiply amount safely
   */
  static multiply(amount: number, multiplier: number): number {
    return MoneyUtil.fromCents(Math.round(MoneyUtil.toCents(amount) * multiplier));
  }

  /**
   * Divide amount safely
   */
  static divide(amount: number, divisor: number): number {
    if (divisor === 0) throw new Error('Division by zero');
    return MoneyUtil.fromCents(Math.round(MoneyUtil.toCents(amount) / divisor));
  }

  /**
   * Format amount as currency string
   */
  static format(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Round to standard precision
   */
  static round(amount: number): number {
    return MoneyUtil.fromCents(MoneyUtil.toCents(amount));
  }
}
