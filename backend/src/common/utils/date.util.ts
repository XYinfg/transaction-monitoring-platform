export class DateUtil {
  static startOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static startOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  static endOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  static daysAgo(days: number): Date {
    const result = new Date();
    result.setDate(result.getDate() - days);
    return result;
  }

  static monthsAgo(months: number): Date {
    const result = new Date();
    result.setMonth(result.getMonth() - months);
    return result;
  }
}
