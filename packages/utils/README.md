# @formatjs/utils

Collection of useful internationalization (i18n) utilities for working with locales, countries, currencies, and timezones.

## Installation

```bash
npm install @formatjs/utils
```

## Features

- Country code canonicalization (ISO 3166)
- Default currency lookup by country
- Currency minor units and scale calculations (ISO 4217)
- Default locale detection
- Default timezone detection

## API

### Country Codes

#### `canonicalizeCountryCode(alpha3OrAlpha2?: string): string | undefined`

Canonicalize a country code to an ISO 3166 alpha-2 country code (uppercase).

```typescript
import {canonicalizeCountryCode} from '@formatjs/utils'

canonicalizeCountryCode('usa') // 'US'
canonicalizeCountryCode('USA') // 'US'
canonicalizeCountryCode('us') // 'US'
canonicalizeCountryCode('US') // 'US'
```

### Currency

#### `defaultCurrency(countryCode?: string): string`

Look up the default currency for a country code. Returns USD if not found.

```typescript
import {defaultCurrency} from '@formatjs/utils'

defaultCurrency('US') // 'USD'
defaultCurrency('GB') // 'GBP'
defaultCurrency('JP') // 'JPY'
```

#### `countriesUsingDefaultCurrency(currencyCode: string): string[]`

Look up countries that use a specific currency as their default.

```typescript
import {countriesUsingDefaultCurrency} from '@formatjs/utils'

countriesUsingDefaultCurrency('EUR') // ['AT', 'BE', 'CY', 'DE', 'EE', ...]
countriesUsingDefaultCurrency('USD') // ['US', 'EC', 'SV', ...]
```

#### `currencyMinorScale(currencyCode: string): number`

Returns the minor unit scale for a given ISO 4217 currency code. The minor unit scale is the power of 10 representing the number of decimal places used for the currency.

```typescript
import {currencyMinorScale} from '@formatjs/utils'

currencyMinorScale('USD') // 100 (2 decimal places)
currencyMinorScale('JPY') // 1 (0 decimal places)
currencyMinorScale('BHD') // 1000 (3 decimal places)
```

### Locale

#### `defaultLocale(): string`

Returns the default locale for the current environment.

```typescript
import {defaultLocale} from '@formatjs/utils'

defaultLocale() // e.g., 'en-US'
```

### Timezone

#### `defaultTimezone(): string`

Returns the default timezone for the current environment.

```typescript
import {defaultTimezone} from '@formatjs/utils'

defaultTimezone() // e.g., 'America/New_York'
```

## License

MIT
