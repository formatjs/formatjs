import {createMemoizedDateTimeFormat} from './memoize.js'
import type {Timezone} from './timezones.generated.js'
import {timezones} from './timezones.generated.js'

/**
 * Implementation: Tests if a timezone is supported by attempting to create
 * a DateTimeFormat with that timezone and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from IANA Time Zone Database
 */
function isSupportedTimeZone(timeZone: Timezone): boolean {
  try {
    // Always use 'en' for testing
    const formatter = createMemoizedDateTimeFormat('en', {timeZone})
    return formatter.resolvedOptions().timeZone === timeZone
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported timezone identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedTimeZones(): Timezone[] {
  return timezones.filter(isSupportedTimeZone).sort()
}
