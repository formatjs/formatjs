# @formatjs/icu-messageformat-parser

## Purpose

Hand-written recursive descent parser for ICU MessageFormat syntax. Core parsing engine used by `intl-messageformat`, all framework integrations, and all build tools.

## Design Decisions

### Hand-Written Parser (Not PEG/Yacc)

Chosen for performance — 6-10x faster than the previous PEG-based `intl-messageformat-parser`. The parser is a single-pass recursive descent parser with lookahead.

### AST Node Types

- `LiteralElement` — Plain text
- `ArgumentElement` — `{var}`
- `NumberElement` — `{var, number, ::skeleton}`
- `DateElement` / `TimeElement` — `{var, date/time, ::skeleton}`
- `PluralElement` / `SelectElement` — `{var, plural/select, ...}`
- `SelectOrdinalElement` — `{var, selectordinal, ...}`
- `PoundElement` — `#` placeholder in plural clauses
- `TagElement` — XML-like tags `<b>text</b>`

### Multiple Entry Points

- `index.ts` — Full parser with all features
- `no-parser.ts` — Utilities (printer, manipulator) without the parser (for tree-shaking when parsing happens at build time)
- `printer.ts` — AST back to ICU MessageFormat string
- `manipulator.ts` — AST transforms: `hoistSelectors` (flatten nested selects), `isStructurallySame`

### Skeleton Integration

Delegates number/datetime skeleton parsing to `@formatjs/icu-skeleton-parser`. Skeletons are the `::` syntax in ICU MessageFormat (e.g., `{amount, number, ::currency/USD}`).

### Rust Mirror + WASM

A parallel Rust implementation exists in `crates/icu_messageformat_parser/` that is 2.6-3.7x faster.

## Generated Data

- `regex.generated.ts` — Unicode space separator patterns
- `time-data.generated.ts` — CLDR time data for skeleton parsing

## Dependencies

`@formatjs/ecma402-abstract`, `@formatjs/icu-skeleton-parser`

## Test Strategy

- Vitest unit tests with real-world message samples
- Integration tests comparing TypeScript and Rust parser output
