import {createMemoizedDateTimeFormat} from './memoize.js'
import type {Calendar} from './calendars.generated.js'
import {calendars} from './calendars.generated.js'

/**
 * Implementation: Tests if a calendar is supported by attempting to create
 * a DateTimeFormat with that calendar and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from CLDR calendar types
 */
function isSupportedCalendar(item: Calendar): boolean {
  try {
    // Always use 'en' for testing
    const dateTimeFormat = createMemoizedDateTimeFormat(`en-u-ca-${item}`)
    const options = dateTimeFormat.resolvedOptions().calendar

    // Verify the calendar was actually accepted (resolved calendar matches requested)
    return options === item
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported calendar identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedCalendars(): Calendar[] {
  return calendars.filter(isSupportedCalendar).sort()
}
