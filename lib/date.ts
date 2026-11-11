/**
 * Date and time formatting utilities enforcing Indian Standard Time (IST, UTC+5:30).
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a date or ISO string into IST date & time: "27 Oct 2026, 04:30 PM IST"
 */
export function formatDateTimeIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${formatted} IST`;
}

/**
 * Formats a date or ISO string into IST date & time with seconds: "27 Oct 2026, 04:30:15 PM"
 */
export function formatDateTimeISTWithSeconds(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a date or ISO string into IST date only: "27 Oct 2026"
 */
const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Formats a date or ISO string into IST "DD MMM YYYY" format (e.g. "27 Oct 2026", "15 Sep 2026")
 * using strictly 3-character month abbreviations and direct parsing for plain YYYY-MM-DD strings.
 */
export function formatDateIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const parts = dateInput.trim().split('-');
    const year = parts[0] ?? '';
    const monthIndex = parseInt(parts[1] ?? '0', 10) - 1;
    const day = (parts[2] ?? '').padStart(2, '0');
    const month = SHORT_MONTH_NAMES[monthIndex];
    if (year && month && day) {
      return `${day} ${month} ${year}`;
    }
  }

  const istDateStr = toISTDateInputValue(dateInput);
  if (!istDateStr) return '-';
  const parts = istDateStr.split('-');
  const year = parts[0] ?? '';
  const monthIndex = parseInt(parts[1] ?? '0', 10) - 1;
  const day = (parts[2] ?? '').padStart(2, '0');
  const month = SHORT_MONTH_NAMES[monthIndex];
  if (!year || !month || !day) return '-';
  return `${day} ${month} ${year}`;
}

/**
 * Formats a date or ISO string into IST time only: "04:30 PM IST"
 */
export function formatTimeIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${formatted} IST`;
}

/**
 * Checks whether the given date is in the past compared to the current time.
 */
export function isDatePast(dateInput: string | Date | null | undefined): boolean {
  if (!dateInput) return false;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

/**
 * Formats a date or ISO string into an IST "YYYY-MM-DD" string suitable for HTML <input type="date">.
 */
export function toISTDateInputValue(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Formats a date or ISO string into "DD MMM YYYY" format (e.g. "03 Nov 2026").
 */
export const formatDateDMY = formatDateIST;

/**
 * Formats a date or ISO string into "DD/MM/YY" format (e.g. "04/12/26").
 */
export function formatDateDDMMYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const parts = dateInput.trim().split('-');
    const y = parts[0] ?? '00';
    const m = parts[1] ?? '00';
    const d = parts[2] ?? '00';
    const shortYear = y.length === 4 ? y.slice(2) : y;
    return `${d}/${m}/${shortYear}`;
  }
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const day = new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIMEZONE, day: '2-digit' }).format(
    date,
  );
  const month = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    month: '2-digit',
  }).format(date);
  const year = new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIMEZONE, year: '2-digit' }).format(
    date,
  );

  return `${day}/${month}/${year}`;
}
