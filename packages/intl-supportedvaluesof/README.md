# @formatjs/intl-supportedvaluesof

Polyfill for [`Intl.supportedValuesOf()`](https://tc39.es/ecma402/#sec-intl.supportedvaluesof)

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-supportedvaluesof.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-supportedvaluesof)

## ECMA-402 Spec Compliance

This package implements the ECMA-402 `Intl.supportedValuesOf()` specification:

- **Spec Section**: [8.3.2 Intl.supportedValuesOf(key)](https://tc39.es/ecma402/#sec-intl.supportedvaluesof)
- **Returns**: Supported values for internationalization keys
- **Fully spec-compliant**: No optional parameters, matches native browser behavior

## Installation

```bash
npm install @formatjs/intl-supportedvaluesof
```

## Usage

### As Polyfill

Import the polyfill to make `Intl.supportedValuesOf` available globally:

```javascript
import '@formatjs/intl-supportedvaluesof/polyfill'

// Now available on the global Intl object
const calendars = Intl.supportedValuesOf('calendar')
// ['buddhist', 'chinese', 'coptic', 'dangi', 'ethioaa', 'ethiopic', 'gregory', ...]

const currencies = Intl.supportedValuesOf('currency')
// ['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', ...]

const timeZones = Intl.supportedValuesOf('timeZone')
// ['Africa/Abidjan', 'Africa/Accra', ..., 'Pacific/Wallis']
```

### Direct Import

Import the function directly without modifying the global namespace:

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

const numberingSystems = supportedValuesOf('numberingSystem')
// ['adlm', 'ahom', 'arab', 'arabext', 'bali', 'beng', 'bhks', ...]

const units = supportedValuesOf('unit')
// ['acre', 'bit', 'byte', 'celsius', 'centimeter', 'day', 'degree', ...]
```

## Supported Keys

The function accepts one of six string keys and returns an array of supported values:

| Key                 | Returns                           | Example Values                                          |
| ------------------- | --------------------------------- | ------------------------------------------------------- |
| `'calendar'`        | Supported calendar systems        | `'gregory'`, `'islamic'`, `'buddhist'`, `'chinese'`     |
| `'collation'`       | Supported collation algorithms    | `'emoji'`, `'eor'`, `'phonebk'`, `'search'`             |
| `'currency'`        | Supported ISO 4217 currency codes | `'USD'`, `'EUR'`, `'JPY'`, `'GBP'`                      |
| `'numberingSystem'` | Supported numbering systems       | `'arab'`, `'latn'`, `'hanidec'`, `'thai'`               |
| `'timeZone'`        | Supported IANA time zones         | `'America/New_York'`, `'Europe/London'`, `'Asia/Tokyo'` |
| `'unit'`            | Supported measurement units       | `'meter'`, `'celsius'`, `'liter'`, `'acre'`             |

## API

### `supportedValuesOf(key: string): string[]`

Returns an array of supported values for the given key.

**Parameters:**

- `key` - One of: `'calendar'`, `'collation'`, `'currency'`, `'numberingSystem'`, `'timeZone'`, `'unit'`

**Returns:**

- A sorted array of unique string values

**Throws:**

- `RangeError` - If the key is not one of the supported values

**Example:**

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

// Valid usage
const calendars = supportedValuesOf('calendar')
console.log(calendars) // ['buddhist', 'chinese', 'coptic', ...]

// Invalid key throws RangeError
try {
  supportedValuesOf('invalid')
} catch (e) {
  console.error(e) // RangeError: Invalid key: invalid
}
```

## Implementation Details

This polyfill **dynamically validates** candidate values against the actual `Intl` implementation rather than maintaining static lists. This approach ensures:

- **Accuracy**: Results match what your JavaScript runtime actually supports
- **Runtime-specific**: Different engines (V8, JavaScriptCore, SpiderMonkey) may support different values
- **Up-to-date**: No need to manually update lists when new values are added to engines

### How It Works

For each category, the implementation:

1. **Loads candidate values** from CLDR (Unicode Common Locale Data Repository)
2. **Tests each value** by attempting to create an appropriate `Intl` formatter with that value
3. **Validates acceptance** by checking if the formatter actually uses the requested value
4. **Returns filtered list** of only the values that passed validation

### Example: Calendar Validation

```javascript
// Implementation tests if a calendar is supported:
function isSupportedCalendar(calendar) {
  try {
    // Attempt to create DateTimeFormat with this calendar
    const formatter = new Intl.DateTimeFormat(`en-u-ca-${calendar}`)
    // Verify the calendar was actually accepted
    const resolvedOptions = formatter.resolvedOptions()
    return resolvedOptions.calendar === calendar
  } catch {
    return false
  }
}
```

This ensures that only calendars **actually supported** by your runtime are returned, not just a static list.

## TypeScript Support

This package includes TypeScript type definitions. When using as a polyfill, the global `Intl` namespace is automatically augmented:

```typescript
import '@formatjs/intl-supportedvaluesof/polyfill'

// TypeScript knows about Intl.supportedValuesOf
const calendars: string[] = Intl.supportedValuesOf('calendar')

// TypeScript will error on invalid keys
Intl.supportedValuesOf('invalid') // Error: Argument of type '"invalid"' is not assignable...
```

## Browser Support

This polyfill is only needed for older browsers that don't have native support for `Intl.supportedValuesOf()`. Native support is available in:

- Chrome 99+
- Edge 99+
- Firefox 93+
- Safari 15.4+

The polyfill requires the following `Intl` APIs to be available:

- `Intl.DateTimeFormat` (for `calendar`, `timeZone`, `numberingSystem`)
- `Intl.NumberFormat` (for `currency`, `unit`, `numberingSystem`)
- `Intl.Collator` (for `collation`)

## Breaking Changes in v3.0

### Removed: Non-standard `locale` parameter

**v2.x and earlier** had a non-standard optional `locale` parameter that filtered results by locale. This has been **removed** to match the ECMA-402 specification.

```javascript
// ❌ v2.x (non-standard, no longer works)
const calendars = supportedValuesOf('calendar', 'en-US')

// ✅ v3.0 (spec-compliant)
const calendars = supportedValuesOf('calendar')
```

The function now always returns **ALL** supported values, matching native browser behavior.

### Migration Guide

If you need locale-specific filtering in v3.0+, implement it yourself:

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

// Get all supported calendars
const allCalendars = supportedValuesOf('calendar')

// Filter by what a specific locale actually uses/accepts
const enUSCalendars = allCalendars.filter(calendar => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {calendar})
    return formatter.resolvedOptions().calendar === calendar
  } catch {
    return false
  }
})
```

However, note that most use cases don't need locale-specific filtering, as the spec's design returns all values that **any** locale could use.

## Examples

### Check if a calendar is supported

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

const calendars = supportedValuesOf('calendar')

if (calendars.includes('islamic')) {
  console.log('Islamic calendar is supported')
  const formatter = new Intl.DateTimeFormat('en-US', {calendar: 'islamic'})
  console.log(formatter.format(new Date()))
}
```

### Display all supported currencies

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

const currencies = supportedValuesOf('currency')

console.log(`This runtime supports ${currencies.length} currencies:`)
currencies.forEach(currency => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })
  console.log(`${currency}: ${formatter.format(100)}`)
})
```

### Validate user input

```javascript
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

function isValidTimeZone(timeZone) {
  const supportedTimeZones = supportedValuesOf('timeZone')
  return supportedTimeZones.includes(timeZone)
}

console.log(isValidTimeZone('America/New_York')) // true
console.log(isValidTimeZone('Invalid/TimeZone')) // false
```

## License

MIT

## Related Packages

- [@formatjs/intl](https://www.npmjs.com/package/@formatjs/intl) - Complete FormatJS internationalization suite
- [@formatjs/intl-datetimeformat](https://www.npmjs.com/package/@formatjs/intl-datetimeformat) - Intl.DateTimeFormat polyfill
- [@formatjs/intl-numberformat](https://www.npmjs.com/package/@formatjs/intl-numberformat) - Intl.NumberFormat polyfill
- [@formatjs/intl-pluralrules](https://www.npmjs.com/package/@formatjs/intl-pluralrules) - Intl.PluralRules polyfill

## Resources

- [ECMA-402 Specification](https://tc39.es/ecma402/)
- [MDN: Intl.supportedValuesOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf)
- [Unicode CLDR](https://cldr.unicode.org/)
- [FormatJS Documentation](https://formatjs.io/)
