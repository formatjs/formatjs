# @formatjs/intl & Framework Integrations

## intl-messageformat

**Purpose:** High-level ICU MessageFormat formatter. Takes a message string + locale + values, returns formatted output.

- Parses messages via `@formatjs/icu-messageformat-parser`
- Formats using native `Intl` APIs (NumberFormat, DateTimeFormat, PluralRules)
- Memoizes formatter instances via `@formatjs/fast-memoize`
- Ships an IIFE bundle (`intl-messageformat.iife.js`) for browser `<script>` tag usage
- BSD-3-Clause licensed (not `@formatjs` scoped for historical reasons)

## @formatjs/intl

**Purpose:** Main FormatJS package aggregating all formatting APIs into a single coherent interface.

**Key exports:**

- `createIntl(config)` — Create an intl instance (framework-agnostic)
- `defineMessage(s)` — Message descriptor helpers (for extraction tooling)
- `formatMessage`, `formatDate`, `formatNumber`, `formatDisplayName`, `formatList`, `formatPlural`, `formatRelativeTime`

**Design:** Framework-agnostic core that `react-intl`, `vue-intl`, and `svelte-intl` all build upon. The framework packages add reactive bindings and components but delegate all formatting to `@formatjs/intl`.

## react-intl

**Purpose:** React components and hooks for i18n. The most widely used FormatJS package.

**Components:**

- `<IntlProvider>` — Context provider for locale/messages
- `<FormattedMessage>` — Render ICU MessageFormat strings
- `<FormattedNumber>`, `<FormattedDate>`, `<FormattedTime>`, `<FormattedList>`, `<FormattedDisplayName>`, `<FormattedPlural>`, `<FormattedRelativeTimeFormat>`

**Hooks:**

- `useIntl()` — Access intl object for imperative formatting

**Design decisions:**

- React 19 peer dependency (latest only)
- Server-side rendering support via `/server` export
- Separate `defineMessage(s)` re-exported for extraction compatibility
- Global type override support for strict message typing

**Peer deps:** `react@19`, `@types/react@19`

## vue-intl

**Purpose:** Vue 3 integration for FormatJS.

- Provides Vue composables wrapping `@formatjs/intl`
- Peer dep: `vue@^3.5.0`

## @formatjs/svelte-intl

**Purpose:** Svelte 5 integration for FormatJS.

- Provides Svelte stores/context wrapping `@formatjs/intl`
- Peer dep: `svelte@^5.0.0`

## @formatjs/editor

**Purpose:** ICU MessageFormat editor UI component (React-based).

- Interactive editor for authoring ICU messages
- Depends on `react-intl` and `icu-messageformat-parser`
- Work-in-progress status
