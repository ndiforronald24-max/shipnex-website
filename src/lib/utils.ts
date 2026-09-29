/**
 * Utility functions for the ShipNex frontend.
 */

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string with time.
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get the CSS class for a shipment status badge.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-green-700';
    case 'InTransit':
    case 'In Transit':
      return 'bg-blue-100 text-blue-700';
    case 'OutForDelivery':
      return 'bg-purple-100 text-purple-700';
    case 'Delayed':
    case 'Exception':
      return 'bg-red-100 text-red-700';
    case 'Cancelled':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

/**
 * Truncate text to a maximum length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a tracking number display (format: USP-2026-458921).
 */
export function formatTrackingNumber(tracking: string): string {
  return tracking.toUpperCase();
}
