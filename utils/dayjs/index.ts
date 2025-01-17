import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/en"; // Import default locale
// Import additional locales as needed:
// import 'dayjs/locale/fr';
// import 'dayjs/locale/es';
import "dayjs/locale/nl";

// Configure plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// Set default locale
dayjs.locale("en");

// Export a utility class for better organization
export class DateUtils {
  /**
   * Format date to relative time (e.g., "2 hours ago", "in 3 days")
   */
  static fromNow(date: string | Date | number): string {
    return dayjs(date).fromNow();
  }

  /**
   * Format date using localized format
   * @param date - The date to format
   * @param format - Optional format string (e.g., 'L' for localized date, 'LLL' for localized date and time)
   */
  static format(date: string | Date | number, format?: string): string {
    return format ? dayjs(date).format(format) : dayjs(date).format("L");
  }

  /**
   * Change the current locale
   */
  static setLocale(locale: string): void {
    dayjs.locale(locale);
  }

  /**
   * Check if a date is before another date
   */
  static isBefore(
    date: string | Date | number,
    compareDate: string | Date | number
  ): boolean {
    return dayjs(date).isBefore(compareDate);
  }

  /**
   * Check if a date is after another date
   */
  static isAfter(
    date: string | Date | number,
    compareDate: string | Date | number
  ): boolean {
    return dayjs(date).isAfter(compareDate);
  }

  /**
   * Get the difference between two dates in the specified unit
   */
  static diff(
    date: string | Date | number,
    compareDate: string | Date | number,
    unit: "second" | "minute" | "hour" | "day" | "month" | "year" = "day"
  ): number {
    return dayjs(date).diff(compareDate, unit);
  }

  /**
   * Create a dayjs instance for the current date/time
   */
  static now() {
    return dayjs();
  }
}

export default DateUtils;
