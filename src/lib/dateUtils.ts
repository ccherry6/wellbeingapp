/**
 * Date utilities for Australian Eastern Standard Time (AEST/AEDT)
 *
 * AEST: UTC+10 (April - October)
 * AEDT: UTC+11 (October - April) - Daylight Saving Time
 */

const AEST_TIMEZONE = 'Australia/Sydney'

/**
 * Format a date to Australian Eastern Time
 */
export function formatDateAEST(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: AEST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }

  return new Intl.DateTimeFormat('en-AU', defaultOptions).format(dateObj)
}

/**
 * Format a date with time to Australian Eastern Time
 */
export function formatDateTimeAEST(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('en-AU', {
    timeZone: AEST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj)
}

/**
 * Format time only to Australian Eastern Time
 */
export function formatTimeAEST(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('en-AU', {
    timeZone: AEST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj)
}

/**
 * Get current date in AEST timezone
 */
export function getCurrentDateAEST(): Date {
  return new Date(new Date().toLocaleString('en-AU', { timeZone: AEST_TIMEZONE }))
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTimeAEST(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentDateAEST()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'just now'
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    return formatDateAEST(dateObj)
  }
}

/**
 * Format date for input fields (YYYY-MM-DD) in AEST
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Convert to AEST and format as YYYY-MM-DD
  const aestDateString = dateObj.toLocaleString('en-AU', {
    timeZone: AEST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  // Parse DD/MM/YYYY and convert to YYYY-MM-DD
  const [day, month, year] = aestDateString.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Get start of today in AEST
 */
export function getStartOfTodayAEST(): Date {
  const now = getCurrentDateAEST()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

/**
 * Get end of today in AEST
 */
export function getEndOfTodayAEST(): Date {
  const now = getCurrentDateAEST()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
}

/**
 * Check if a date is today in AEST
 */
export function isTodayAEST(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = getCurrentDateAEST()

  const dateStr = dateObj.toLocaleDateString('en-AU', { timeZone: AEST_TIMEZONE })
  const todayStr = today.toLocaleDateString('en-AU', { timeZone: AEST_TIMEZONE })

  return dateStr === todayStr
}

/**
 * Format date range
 */
export function formatDateRangeAEST(startDate: string | Date, endDate: string | Date): string {
  const start = formatDateAEST(startDate)
  const end = formatDateAEST(endDate)
  return `${start} - ${end}`
}
