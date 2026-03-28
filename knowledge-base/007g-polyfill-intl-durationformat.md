# @formatjs/intl-durationformat

**ECMA-402 Stage 3 Proposal** — `Intl.DurationFormat`

## Purpose

Polyfill for `Intl.DurationFormat` — formats durations (hours, minutes, seconds) with locale-aware separators.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| CLDR Package        | Data Used                                                    |
| ------------------- | ------------------------------------------------------------ |
| `cldr-numbers-full` | numbers.json — `symbols-numberSystem-{system}.timeSeparator` |

### Extraction Script (`scripts/time-separators.ts`)

Extracts time separator characters per locale and numbering system:

- Default separator is `:` (colon)
- Script only includes locales/systems where the separator differs from default
- Resolves default numbering system per locale

### Build Pipeline

Unlike most polyfills, DurationFormat uses **static compilation** (no per-locale files):

```
Single stage: generate_src_file "time-separators"
  Input: cldr-numbers-full
  Output: src/time-separators.generated.ts (single file, ~3900 lines)

Also: generate_src_file "numbering-systems"
  Output: src/numbering-systems.generated.ts
```

### Generated Data Structure

```typescript
export const TIME_SEPARATORS = {
  default: ':',
  localeData: {
    "ar": {"nu": ["arab", "latn"], "separator": {"arab": "٫"}},
    ...
  }
} as const
```

### Runtime Loading

- **No dynamic locale loading** — data compiled into the main bundle
- Static import: `import {TIME_SEPARATORS} from './time-separators.generated.js'`
- Lookup at runtime: `TIME_SEPARATORS.localeData[locale]?.separator[nu] ?? TIME_SEPARATORS.default`
