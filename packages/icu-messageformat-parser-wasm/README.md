# @formatjs/icu-messageformat-parser-wasm

> **⚠️ Note: This package is not published to npm.** Benchmarks show the WASM parser is currently 14-19x slower than the JavaScript parser due to async initialization overhead, JSON serialization costs, and the small size of typical parsing operations. See [BENCHMARK.md](BENCHMARK.md) for detailed performance analysis.

WebAssembly-powered ICU MessageFormat parser for JavaScript/TypeScript applications.

This package provides a Rust-compiled WebAssembly parser as an experimental alternative to the pure JavaScript parser. While it achieves 100% functional compatibility with all 117 integration tests passing, the current implementation is not performance-competitive for typical use cases.

## Status

**Experimental / Not Published**

This package demonstrates the feasibility of using Rust + WASM for ICU MessageFormat parsing but is not recommended for production use. The JavaScript parser (`@formatjs/icu-messageformat-parser`) is significantly faster for typical use cases.

## Installation

This package is not published to npm. To use it, build from source:

```bash
bazel build //packages/icu-messageformat-parser-wasm:pkg
```

## Usage

```typescript
import {parse} from '@formatjs/icu-messageformat-parser-wasm'

// Parse an ICU MessageFormat string
const ast = await parse('Hello {name}!')
console.log(ast)
// [
//   { type: 0, value: 'Hello ' },
//   { type: 1, value: 'name' },
//   { type: 0, value: '!' }
// ]

// Parse with options
const ast2 = await parse('You have {count, plural, one {# item} other {# items}}', {
  captureLocation: false,
  shouldParseSkeletons: true
})
```

## API

### `parse(input: string, options?: ParserOptions): Promise<MessageFormatElement[]>`

Parses an ICU MessageFormat string and returns an AST (Abstract Syntax Tree) representing the message structure.

**Parameters:**

- `input`: The ICU MessageFormat string to parse
- `options`: Optional parser configuration
  - `ignoreTag?: boolean` - Treat HTML/XML tags as literal text (default: false)
  - `requiresOtherClause?: boolean` - Require 'other' clause in plural/select (default: true)
  - `shouldParseSkeletons?: boolean` - Parse number/date skeletons (default: true)
  - `captureLocation?: boolean` - Capture source location info (default: true)
  - `locale?: string` - Locale for parsing (e.g., 'en-US')

**Returns:**

- `Promise<MessageFormatElement[]>`: An array of message format elements

**Example:**

```typescript
const ast = await parse('You have {count, plural, one {# item} other {# items}}', {
  captureLocation: false
})
```

## Types

This package exports TypeScript type definitions that match the `@formatjs/icu-messageformat-parser` package:

- `MessageFormatElement`: Union of all element types
- `LiteralElement`, `ArgumentElement`, `NumberElement`, `DateElement`, `TimeElement`, `SelectElement`, `PluralElement`, `PoundElement`, `TagElement`: Specific element types
- `TYPE`: Enum of element types
- `SKELETON_TYPE`: Enum of skeleton types
- And more...

See the type definitions for complete details.

## Performance

⚠️ **The WASM parser is currently 14-19x slower than the JavaScript parser** for typical use cases.

See [BENCHMARK.md](BENCHMARK.md) for detailed performance analysis. Key findings:

- **Simple messages**: ~1.8M ops/s (JS) vs ~105K ops/s (WASM) = 17x slower
- **Complex messages**: ~44K ops/s (JS) vs ~3K ops/s (WASM) = 14x slower

**Why is it slower?**

1. Async initialization overhead on every call
2. JSON serialization between Rust and JavaScript
3. Modern JS engines heavily optimize frequently-called functions
4. Small operation size means overhead dominates execution time

**When might WASM be useful?**

- Batch processing thousands of messages at once
- Long-running server processes where initialization is amortized
- Future optimizations (removing async, binary protocols, etc.)

## Why This Package Exists

This package serves as:

1. A proof-of-concept for Rust + WASM in the FormatJS ecosystem
2. A demonstration of Bazel's cross-compilation capabilities
3. A foundation for future performance optimizations
4. An alternative parser for specialized use cases

For production use, we recommend `@formatjs/icu-messageformat-parser` (the JavaScript version).

## Runtime Requirements

- **Node.js**: This package currently only runs in Node.js (uses `fs` for loading WASM)
- **WebAssembly support**: Node.js 8+

## License

MIT
