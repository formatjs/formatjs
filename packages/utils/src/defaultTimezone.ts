let DEFAULT_TIMEZONE: string | undefined

const DEFAULT_DATETIMEFORMAT_CREATOR = () => new Intl.DateTimeFormat()

/**
 * Return the default timezone for the system.
 * @param dateDateTimeFormatCreator creator fn for Intl.DateTimeFormat
 * @returns default timezone for the system
 */
export function defaultTimezone(
  dateDateTimeFormatCreator = DEFAULT_DATETIMEFORMAT_CREATOR
): string {
  if (DEFAULT_TIMEZONE) {
    return DEFAULT_TIMEZONE
  }
  try {
    return (DEFAULT_TIMEZONE =
      dateDateTimeFormatCreator().resolvedOptions().timeZone)
  } catch (e) {
    return 'UTC'
  }
}

/**
 * Reset the default timezone.
 * Only for testing purposes.
 * @private
 */
export function _resetDefaultTimezone() {
  DEFAULT_TIMEZONE = undefined
}
