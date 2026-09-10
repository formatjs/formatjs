# @formatjs/intl & Framework Integrations

## intl-messageformat

**Purpose:** High-level ICU MessageFormat formatter. Takes a message string + locale + values, returns formatted output.

- Parses messages via `@formatjs/icu-messageformat-parser`
- Formats using native `Intl` APIs (NumberFormat, DateTimeFormat, PluralRules)
- Memoizes formatter instances via `@formatjs/fast-memoize`
- Ships an IIFE bundle (`intl-messageformat.iife.js`) for browser `<script>` tag usage
- BSD-3-Clause licensed (not `@formatjs` scoped for historical reasons)

The low-level Rust runtime lives at `crates/icu_messageformat` as
`formatjs_icu_messageformat`. It reuses the Rust parser AST and ICU4X. Messages
are parsed without a locale, then formatted with a request locale.

## @formatjs/intl

**Purpose:** Main FormatJS package aggregating all formatting APIs into a single coherent interface.

**Key exports:**

- `createIntl(config)` — Create an intl instance (framework-agnostic)
- `defineMessage(s)` — Message descriptor helpers (for extraction tooling)
- `formatMessage`, `formatDate`, `formatNumber`, `formatDisplayName`, `formatList`, `formatPlural`, `formatRelativeTime`, `formatDuration`, `formatDurationToParts`

**Design:** Framework-agnostic core that `react-intl`, `vue-intl`, and `svelte-intl` all build upon. The framework packages add reactive bindings and components but delegate all formatting to `@formatjs/intl`.

`formatDuration` and `formatDurationToParts` use optional native
`Intl.DurationFormat` (or a consumer-loaded polyfill), the shared duration
formatter cache, and `formats.duration` named options. Failures go through
`onError` and return an empty string or parts array. Public duration declarations
reuse structural types shared with the duration polyfill in `ecma402-abstract/types/duration.ts`, so
consumers do not need TypeScript's native `Intl.DurationFormat` declarations.

The Rust mirror lives at `crates/formatjs_intl` as `formatjs_intl`. It keeps
`Intl` request-scoped, while `MessageCatalog` and `IntlCache` can be shared by
the backend. ICU4X negotiates each ordered locale list against available
catalogs. Translation lookup falls back to the default catalog, then the
descriptor default message. `message_descriptor!` generates missing IDs with
`[sha512:contenthash:base64:10]` and is extracted from Rust source by
`formatjs_cli`. `format_message!` provides the same extraction and ID behavior
for inline calls, returns `String`, and uses the descriptor default verbatim if
cache infrastructure fails. Inline `values: { name: expression }` are converted
to runtime values and checked against the default ICU message at compile time;
callers can still pass an existing values map.

`formatted_message!` is the opt-in checked-text interface. It returns the opaque
`formatjs_intl::FormattedMessage` and accepts only formatted/explicitly verbatim
text, numbers, booleans, and dates through sealed `MessageArgument` conversions.
`MessageValues` provides checked reusable maps. `FormattedMessage::verbatim`
marks intentionally untranslated content; ordinary strings cannot convert
implicitly. Static-descriptor callers use `Intl::format_message_typed` or
`format_message_typed_or_default`. All paths reuse the existing formatter and
fallback chain. The CLI extracts both inline macros with identical ID rules.
The type does not promise translation coverage, escaping, or successful
interpolation, and is distinct from the low-level rich-text result of the same
name. Locale selection and domain error presentation remain application-owned.

## react-intl

**Purpose:** React components and hooks for i18n. The most widely used FormatJS package.

**Components:**

- `<IntlProvider>` — Context provider for locale/messages
- `<FormattedMessage>` — Render ICU MessageFormat strings
- `<FormattedNumber>`, `<FormattedDate>`, `<FormattedTime>`, `<FormattedList>`, `<FormattedDisplayName>`, `<FormattedPlural>`, `<FormattedRelativeTimeFormat>`

`<FormattedDuration>` and `<FormattedDurationParts>` delegate to the core duration
APIs and respect provider locale, named formats, and explicit options. The
imperative methods are available through `useIntl()` and both `createIntl`
entry points; `FormatDurationOptions` is exported from the client and server.

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

**Purpose:** Headless ICU MessageFormat editing and translation workflows for React 19.

- `useMessageEditor`, `Editor`, and `Message` expose editing and parsing without DOM or styling.
- `useTranslationEditor` adds validation, navigation, and shared drafts keyed by message and locale. `getTranslation(id, locale)` lets independently mounted views use one workflow's state.
- `save(context?)` returns a typed saved, failed, invalid, or skipped outcome. `onSave(update, snapshot)` receives source/baseline metadata and opaque caller context, and may return a typed persistence receipt.
- The published entry point depends on React and `icu-messageformat-parser`; consumers own persistence, design systems, and localization providers. The StyleX/React Intl demo is repository-only.
- `@formatjs/editor/ui` separately exports controlled `TranslationEditorView`, `MessageList`, `SourceMessage`, and `TranslationField` components. `EditorDesignSystemProvider` configures typed controls/layout once per tree; views and custom consumers retrieve them through `useEditorDesignSystem()`. Nested overrides inherit parent components, with native defaults outside a provider. Explicit per-component props and semantic callbacks share accessibility wiring without adding StyleX or React Intl dependencies. The workflow demo consumes this API with its own StyleX adapter.
- Generic `MessageList`/`TranslationEditorView` row renderers preserve consumer metadata and keep secondary actions outside the selection control. List summaries, explicit selected IDs, content/locale wrappers, empty states, per-locale label overrides, and a layout sidebar let consumers use the composed view without rebuilding its wiring.
- `LocalePicker`, `MessagePreview`, `CopyTextButton`, and `MessageContext` share the public design-system context. Optional typed tool adapters resolve to native defaults, preserving existing registries. Locale selection stays controlled; preview preserves ICU branches/skeletons without executing tags; clipboard feedback ignores obsolete writes; metadata uses the existing message/source-location types. See `demo/tools-demo.tsx` and browser `/?tools=1`.
- Views accept loaded lists, search callbacks, selected detail, and per-locale drafts; fetching, pagination controls, confirmation, and persistence remain caller-owned.
- See `packages/editor/README.md` for state lifetime, submission snapshots, adapter contracts, and examples.
