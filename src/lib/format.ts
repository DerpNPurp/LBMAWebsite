/**
 * Shared formatting utilities used across dashboard and admin components.
 */

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Format a full ISO timestamp as a human-readable date.
 * e.g. "April 7, 2026"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a full ISO timestamp as a short date.
 * e.g. "Apr 7, 2026"
 */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a DATE-only string ("YYYY-MM-DD") as a short date.
 * Parses as local midnight to avoid off-by-one from timezone conversion.
 * e.g. "Apr 7, 2026"
 */
export function formatTestDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a TIME string ("HH:MM:SS" or "HH:MM") as a 12-hour clock string.
 * e.g. "2:30 PM"
 */
export function formatTime(timeString: string): string {
  const [h, m] = timeString.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Calculate age in whole years from a date-of-birth string.
 */
export function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
