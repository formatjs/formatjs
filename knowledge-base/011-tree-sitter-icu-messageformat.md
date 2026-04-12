# tree-sitter-icu-messageformat

## Purpose

Tree-sitter grammar for ICU MessageFormat v1 syntax with formatjs tag extensions. Enables structural pattern matching (ast-grep) and syntax highlighting for ICU messages.

## Design Decisions

### Tree-sitter (Not a Custom Linter)

Tree-sitter grammars produce concrete syntax trees that tools like ast-grep can query with structural patterns. This is more maintainable than writing custom lint rules in JavaScript/Rust — grammar rules are declarative, and ast-grep patterns match the CST directly.

### `#` Always Parsed as `pound`

In ICU MessageFormat, `#` is only semantically meaningful inside `plural`/`selectordinal` option bodies (where it substitutes the count). Outside those contexts it's literal text. However, making this context-sensitive in tree-sitter would require an external scanner. Instead, `#` is always emitted as a `pound` node — simpler grammar, and ast-grep patterns can still match it structurally by checking the parent node kind.

### Stray `<`, `>`, `}` Fallback

Characters like `<` not followed by a valid tag name (e.g., `I <3 cats`) are parsed as `literal` via low-precedence fallback rules. This avoids ERROR nodes in valid ICU messages that happen to contain these characters.

### ICU Apostrophe Quoting

Follows the ICU spec: `'` before a special character (`{`, `}`, `<`, `>`, `#`) quotes that character. Closed quotes (`'{count}'`) and unclosed quotes (`'{count` running to end of string) both work. Implemented via `/'[{}#<>]/` (quoted special char) and `/'[^']*'/` (closed quoted string) alternatives in the literal token.

### Unicode Whitespace

Whitespace patterns match the same characters as the formatjs parser's `_isWhiteSpace`: `\t`-`\r`, space, NEL (U+0085), LRM/RLM (U+200E-200F), Line Separator (U+2028), Paragraph Separator (U+2029).

### Generated Parser via Bazel Genrule

The C parser (`src/parser.c`) is generated from `grammar.js` by running `tree-sitter generate` as a Bazel genrule. Generated files are not checked into the repo — `grammar.js` is the single source of truth.

## Node Types

- `literal` — Plain text, escaped apostrophes (`''`), quoted strings (`'...'`)
- `argument` — `{identifier}`
- `number_element` / `date_element` / `time_element` — `{id, type[, style]}`
- `select_element` — `{id, select, key {msg}...}`
- `plural_element` / `selectordinal_element` — `{id, plural/selectordinal, [offset:N] key {msg}...}`
- `tag` / `self_closing_tag` — `<name>children</name>` / `<name/>`
- `pound` — `#`
- `number_skeleton` / `date_time_skeleton` — `::tokens`
- `style_text` — Named style (e.g., `short`, `percent`)
- `plural_key` — `zero`, `one`, `two`, `few`, `many`, `other`, `=N`
- `select_key` — Any identifier
- `offset` — `offset: N`

## Dependencies

`tree-sitter-cli` (build-time only, for `tree-sitter generate` and `tree-sitter test`)

## Test Strategy

- **Corpus tests** (`test/corpus/*.txt`) — 28 tests covering all node types, run via `tree-sitter test`
- **Conformance tests** (`test/conformance_test.sh`) — Feeds 83 valid test cases from `@formatjs/icu-messageformat-parser` integration tests through `tree-sitter parse`, verifying no ERROR nodes. 2 skipped (`ignoreTag` option has no tree-sitter equivalent), 31 skipped (error cases where formatjs rejects the input).
