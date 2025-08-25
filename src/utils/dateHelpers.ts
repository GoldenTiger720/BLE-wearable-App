/**
 * Utility functions for handling dates safely
 */

/**
 * Ensures a value is a Date object, converting from string if necessary
 */
export const ensureDate = (dateValue: Date | string | undefined): Date => {
  if (!dateValue) {
    return new Date();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  // Fallback to current date
  return new Date();
};

/**
 * Safely formats a time string from a date value
 */
export const formatTimeString = (dateValue: Date | string | undefined, options: Intl.DateTimeFormatOptions = {}): string => {
  const date = ensureDate(dateValue);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };
  
  try {
    return date.toLocaleTimeString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Error formatting time string:', error);
    return date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0');
  }
};

/**
 * Safely formats a date string from a date value
 */
export const formatDateString = (dateValue: Date | string | undefined, options: Intl.DateTimeFormatOptions = {}): string => {
  const date = ensureDate(dateValue);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  try {
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Error formatting date string:', error);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
};

/**
 * Calculate duration between two dates safely
 */
export const calculateDuration = (startTime: Date | string | undefined, endTime: Date | string | undefined): number => {
  const start = ensureDate(startTime);
  const end = endTime ? ensureDate(endTime) : new Date();
  
  return Math.max(0, end.getTime() - start.getTime());
};

/**
 * Format duration in a human-readable format
 */
export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  return `${minutes}m ${seconds}s`;
};