---
name: i18n-best-practices
description: Write, refactor, or review localization-ready product UI and message catalogs. Use for i18n or l10n implementation, translation-readiness reviews, React Intl or ICU messages, locale-aware value formatting, brand-name handling, terminology glossaries, or changed UI containing user-facing text.
---

# I18n Best Practices

Give translators full meaning. Give native APIs locale-sensitive output. Keep product terms consistent.

## Workflow

1. Read repository i18n conventions.
2. Find user-facing text, formatters, message declarations, glossary files.
3. Flag fragments, preformatted values, joined units, hardcoded calendar labels.
4. Make smallest repository-consistent fix.
5. Run extraction, type checks, lint, formatting, tests, catalog validation.
6. Flag language, brand, legal, product decisions for owners.

## Keep messages complete

- Declare messages near use.
- Keep each thought, surrounding words, punctuation in one message.
- Add useful `description` when meaning or placement is unclear.
- Never concatenate translated fragments.
- Never reuse same message across unrelated contexts because English matches.
- Put grammatical variants in ICU `plural` or `select`.
- Put layout spacing in CSS, not messages.

```tsx
// Avoid: disconnected fragment blocks natural reordering.
const greeting = intl.formatMessage({defaultMessage: 'Welcome'})
return `${greeting}, ${name}!`

// Prefer: translator owns complete thought.
return intl.formatMessage({defaultMessage: 'Welcome, {name}!'}, {name})
```

Do not extract punctuation-only messages such as `—` or `•`. Render fixed decoration directly. Use locale-aware APIs for meaningful separators or quotes. Keep abbreviations such as `N/A` translatable; they carry language.

## Use `select` only for grammar

Use ICU `select` for grammatical variants inside one thought. Never use it as lookup table for application states, resource types, error codes. Those branches are separate messages.

```tsx
// Avoid: application state hidden inside one translation unit.
intl.formatMessage(
  {
    defaultMessage:
      '{subject, select, session {{recipient} can’t be added because this session is full.} project {{recipient} can’t be added because this project is full.} other {{recipient} can’t be added.}}',
  },
  {subject, recipient}
)

// Prefer: application chooses one complete, static message.
const limitMessages = defineMessages({
  session: {
    defaultMessage: '{recipient} can’t be added because this session is full.',
    description: 'Error shown when a session has no remaining member slots',
  },
  project: {
    defaultMessage: '{recipient} can’t be added because this project is full.',
    description:
      'Error shown when a project has no remaining contributor slots',
  },
})

const messageByErrorCode = {
  SESSION_MEMBER_LIMIT: limitMessages.session,
  PROJECT_CONTRIBUTOR_LIMIT: limitMessages.project,
} as const

intl.formatMessage(messageByErrorCode[errorCode], {recipient})
```

Separate translation units gain precise descriptions. Required `other` branch cannot hide unsupported state. New errors do not complicate old messages.

## Format values natively

Use ICU number or date skeletons when value belongs inside sentence.

```tsx
intl.formatMessage(
  {
    defaultMessage:
      'Your total is {total, number, ::currency/USD}. Delivery is {date, date, ::yyyyMMdd}.',
  },
  {total, date}
)
```

Never hardcode currency symbol, code, placement, spacing, grouping around placeholder.

```tsx
// Avoid: English currency affixes stay frozen.
intl.formatMessage(
  {defaultMessage: 'Minimum ${min} USD, maximum ${max} USD'},
  {min, max}
)

// Prefer: formatter owns currency affixes.
intl.formatMessage(
  {
    defaultMessage:
      'Minimum {min, number, ::currency/USD}, maximum {max, number, ::currency/USD}',
  },
  {min, max}
)
```

Runtime currency: use `formatNumber(value, {style: 'currency', currency})`; pass formatted result as placeholder.

Never glue `+` or `-` to numeric placeholder. Use ICU [sign-display](https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#sign-display) options.

```tsx
// Avoid: hand-built sign.
intl.formatMessage({defaultMessage: 'Subtotal (+{amount} credits)'}, {amount})

// Prefer: number formatter owns sign.
intl.formatMessage(
  {defaultMessage: 'Subtotal ({amount, number, ::sign-always} credits)'},
  {amount}
)
```

Use framework-native or built-in `Intl` APIs when skeletons cannot express operation:

- numbers, currencies: `formatNumber`, `<FormattedNumber>`, `Intl.NumberFormat`
- dates, times: `formatDate`, `formatTime`, `Intl.DateTimeFormat`
- ranges: `formatDateTimeRange`, `<FormattedDateTimeRange>`, `Intl.DateTimeFormat.prototype.formatRange`
- lists: `formatList`, `<FormattedList>`, `Intl.ListFormat`
- relative time: `formatRelativeTime`, `<FormattedRelativeTime>`, `Intl.RelativeTimeFormat`

Do not recreate relative time with plural branches. Native formatter owns locale grammar.

Pass raw typed values when sentence grammar needs them. Never preformat or translate fragment into string before ICU plural, select, number, date, time logic.

```tsx
// Avoid: ICU receives string, loses plural choice.
intl.formatMessage(
  {defaultMessage: 'Expires in {duration}'},
  {duration: intl.formatMessage({defaultMessage: '{days} days'}, {days})}
)

// Prefer: one message owns grammar.
intl.formatMessage(
  {defaultMessage: 'Expires in {days, plural, one {# day} other {# days}}'},
  {days}
)
```

Treat measurements as formatted values. Never join placeholders to units: `{duration}day`, `{size}MB`, `{hours}h`. Use ICU unit skeleton inside sentence. Use unit formatter for standalone value.

```tsx
intl.formatNumber(size, {
  style: 'unit',
  unit: 'megabyte',
  unitDisplay: 'short',
})
```

Calendar names are locale data. Never declare weekday, month, era, day-period tables. Format dates. Pin time zone for stable weekday-only controls.

```tsx
const monday = new Date(Date.UTC(2024, 0, 1))
intl.formatDate(monday, {weekday: 'short', timeZone: 'UTC'})
```

Apply same rule to accessibility labels.

Semantic label plus independent value may remain separate. Translate label, format value natively, combine through layout.

```tsx
<dl className="metadata-row">
  <dt>
    <FormattedMessage
      defaultMessage="Last updated:"
      description="Label before a relative time"
    />
  </dt>
  <dd>
    <FormattedRelativeTime value={-1} unit="day" />
  </dd>
</dl>
```

Genuine sentence stays one message unless native formatter output cannot embed correctly.

## Keep brands translatable

Never hide brand behind `{brand}`. Translators may need local name, transliteration, spacing, sentence placement.

```tsx
// Avoid: brand cannot localize; context weak.
intl.formatMessage(
  {defaultMessage: '{brand} helps you find a place to stay.'},
  {brand: 'Airbnb'}
)

// Prefer: translator owns full message, brand included.
intl.formatMessage({
  defaultMessage: 'Airbnb helps you find a place to stay.',
  description: 'Product introduction; Airbnb is a brand name',
})
```

Japanese may render Google as `グーグル`; Simplified Chinese uses Coca-Cola local name `可口可乐`. Follow product, legal policy. Record translate, transliterate, approved local form, unchanged choice.

Runtime placeholders remain correct for dynamic user or tenant data.

## Maintain glossary

Track product-specific, ambiguous, legally sensitive, intentionally untranslated terms. Each entry needs:

- source term, precise meaning
- context, example sentence
- approved translation per locale, when known
- forbidden translations or usages
- capitalization, pluralization, transliteration, do-not-translate rules
- owner, last review date

Keep meanings separate. Product-container “workspace” differs from physical-desk “workspace.” Glossary guides meaning; grammar still adapts. Never invent approved translations.

## Review in context

Test realistic data:

- long strings, narrow screens
- zero, one, many, locale-specific plurals
- gender, `select` variants
- right-to-left layout
- dates, numbers, currencies, lists, ranges, relative time
- accessibility names, labels, announcements
- hardcoded strings, extraction coverage

Use pseudolocalization for hardcoded text, layout assumptions. Use native-speaker review for risky meaning, terminology, tone.

Review findings need file, line, locale impact, smallest fix. Separate defects from glossary, brand, legal, linguistic owner decisions.
