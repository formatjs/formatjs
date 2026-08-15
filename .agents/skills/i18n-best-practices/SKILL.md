---
name: i18n-best-practices
description: Write, refactor, or review localization-ready product UI and message catalogs. Use for i18n or l10n implementation, translation-readiness reviews, React Intl or ICU messages, locale-aware value formatting, brand-name handling, terminology glossaries, or changed UI containing user-facing text.
---

# I18n Best Practices

Produce UI that preserves translator context, delegates locale-sensitive output to native APIs, and keeps product language consistent.

## Workflow

1. Inspect repository conventions and the i18n framework already in use.
2. Find affected user-facing text, formatters, message declarations, and glossary files. Flag values preformatted before `formatMessage`, placeholders joined to words or units, and hand-declared calendar labels.
3. Apply the rules below without replacing established project abstractions unnecessarily.
4. Run extraction, type checks, lint, formatting, tests, or catalog validation used by the repository.
5. Report remaining language, legal, or product decisions that require human owners or translators.

## Preserve message context

- Declare messages inline near their use when the framework permits it.
- Keep complete thoughts in one message. Include surrounding words and punctuation.
- Add a useful description when meaning or placement is not obvious.
- Do not concatenate translated fragments or build sentences from independently translated pieces.
- Do not reuse one message across unrelated contexts only because the source text matches.
- Put grammar choices in ICU `plural` and `select` arguments instead of application branches.
- Use CSS and layout primitives for visual spacing. Do not encode layout with spaces, non-breaking spaces, or newlines.

```tsx
// Avoid: disconnected fragment prevents natural reordering.
const greeting = intl.formatMessage({defaultMessage: 'Welcome'})
return `${greeting}, ${name}!`

// Prefer: translator receives complete thought.
return intl.formatMessage({defaultMessage: 'Welcome, {name}!'}, {name})
```

## Format values with locale-aware APIs

Prefer ICU number and date skeletons when formatted value belongs inside a sentence. Keep format intent visible in message.

```tsx
intl.formatMessage(
  {
    defaultMessage:
      'Your total is {total, number, ::currency/USD}. Delivery is {date, date, ::yyyyMMdd}.',
  },
  {total, date}
)
```

Use framework-native or built-in `Intl` APIs when skeletons do not express operation:

- numbers and currencies: `formatNumber`, `<FormattedNumber>`, or `Intl.NumberFormat`
- dates and times: `formatDate`, `formatTime`, or `Intl.DateTimeFormat`
- ranges: `formatDateTimeRange`, `<FormattedDateTimeRange>`, or `Intl.DateTimeFormat.prototype.formatRange`
- lists: `formatList`, `<FormattedList>`, or `Intl.ListFormat`
- relative time: `formatRelativeTime`, `<FormattedRelativeTime>`, or `Intl.RelativeTimeFormat`

Do not recreate relative time with ICU plural branches such as `=0 {today} one {# day ago}`. Relative-time grammar is locale-specific; native relative-time APIs own it.

Pass raw typed values when they participate in sentence grammar. Do not translate or format a fragment separately and pass the resulting string into another message when ICU needs the value for plural, select, number, date, or time grammar.

```tsx
// Avoid: ICU receives a string and cannot select plural grammar.
intl.formatMessage(
  {defaultMessage: 'Expires in {duration}'},
  {
    duration: intl.formatMessage({defaultMessage: '{days} days'}, {days}),
  }
)

// Prefer: one message owns formatting and grammar.
intl.formatMessage(
  {defaultMessage: 'Expires in {days, plural, one {# day} other {# days}}'},
  {days}
)
```

Treat measurements as formatted values. Never join placeholders to units, such as `{duration}day`, `{size}MB`, or `{hours}h`. Inside a sentence, prefer an ICU number skeleton. For a standalone value, use a unit formatter:

```tsx
intl.formatNumber(size, {
  style: 'unit',
  unit: 'megabyte',
  unitDisplay: 'short',
})
```

Calendar names are locale data. Do not declare or translate weekday, month, era, or day-period tables such as `['Mon', 'Tue', ...]`. Format dates with `formatDate`, `<FormattedDate>`, or `Intl.DateTimeFormat`. For weekday-only controls, use stable reference dates and pin the time zone so labels cannot shift:

```tsx
const monday = new Date(Date.UTC(2024, 0, 1))
intl.formatDate(monday, {weekday: 'short', timeZone: 'UTC'})
```

Apply the same rule to accessibility labels.

Separating text is valid when UI contains a semantic label plus an independently formatted value, not one sentence. Keep label translatable, format value natively, and combine them through layout:

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

For a genuine sentence, keep it as one message unless native formatter output cannot be embedded correctly. Do not split text merely to avoid an ICU message.

## Keep brands translatable

Do not hide a brand behind `{brand}` or another runtime placeholder. Translators may need an established local name, transliteration, different spacing, or different sentence placement.

```tsx
// Avoid: brand cannot be localized; context is weaker.
intl.formatMessage(
  {defaultMessage: '{brand} helps you find a place to stay.'},
  {brand: 'Airbnb'}
)

// Prefer: translator controls complete message, including brand.
intl.formatMessage({
  defaultMessage: 'Airbnb helps you find a place to stay.',
  description: 'Product introduction; Airbnb is a brand name',
})
```

Examples: Japanese may render Google as `グーグル`; Simplified Chinese uses Coca-Cola's established local name `可口可乐`. Follow product and legal policy. Record whether each brand must be translated, transliterated, use an approved local form, or remain unchanged.

Runtime placeholders remain appropriate for genuinely dynamic user or tenant data. A placeholder is not appropriate merely because text is a brand.

## Maintain terminology glossary

Create or update a shared glossary for product-specific, ambiguous, legally sensitive, or intentionally untranslated terms. Each entry should contain:

- source term and precise meaning
- usage context and example sentence
- approved translation per locale, when available
- translations or usages to avoid
- capitalization, pluralization, transliteration, and do-not-translate rules
- owner and last review date

Keep distinct meanings separate. For example, product-container “workspace” may differ from physical-desk “workspace.” Treat glossary as guidance for meaning and consistency, not a command to force one translation into every grammatical context.

Do not invent approved translations. Flag missing decisions for language, brand, legal, or product owners.

## Review in context

Validate translated UI with realistic data. Check:

- long strings and narrow screens
- zero, one, many, and locale-specific plural categories
- gender and `select` variants
- right-to-left layout
- dates, numbers, currencies, lists, ranges, and relative time
- accessibility names, labels, and announcements
- hard-coded strings and extraction coverage

Use pseudolocalization to expose hard-coded text and layout assumptions. Still require native-speaker review for meaning, terminology, and tone when release risk warrants it.

## Review output

When reviewing code, identify each concrete issue with file and line when possible. Explain translator or locale impact, then give smallest repository-consistent fix. Distinguish definite defects from glossary, brand, legal, or linguistic decisions requiring an owner.
