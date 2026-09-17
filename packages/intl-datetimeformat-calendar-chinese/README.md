# @formatjs/intl-datetimeformat-calendar-chinese

Optional chinese calendar arithmetic and locale data for `@formatjs/intl-datetimeformat`.
Requires the DateTimeFormat polyfill's calendar registration APIs (7.7.0 or newer).

```ts
import '@formatjs/intl-datetimeformat/polyfill-force.js'
import '@formatjs/intl-datetimeformat/locale-data/en.js'
import '@formatjs/intl-datetimeformat-calendar-chinese'
import '@formatjs/intl-datetimeformat-calendar-chinese/locale-data/en.js'
```

Install only the calendars you need. Locale modules may load before or after the polyfill.
