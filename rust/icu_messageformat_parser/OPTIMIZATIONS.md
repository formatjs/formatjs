# Parser Optimizations Explained

This document explains the optimizations made to the Rust ICU MessageFormat parser for better performance.

## Optimization #1: String Interning

### Problem

Every time we parse a plural rule like `{count, plural, one {item} other {items}}`, we create new `String` allocations for "one" and "other". If you have 100 plurals in your app, you allocate these strings 100 times!

### TypeScript Analogy

```typescript
// BAD: Creates new strings every time
function parsePlural() {
  return {one: new String('one'), other: new String('other')}
}

// GOOD: Reuses the same strings
const stringPool = new Set<string>()
function intern(s: string): string {
  if (!stringPool.has(s)) stringPool.add(s)
  return Array.from(stringPool).find(x => x === s)!
}
```

### Rust Concept: `'static` Lifetime

In Rust, `'static` means "lives for the entire program". We use `Box::leak()` to intentionally "forget" to free memory, making it permanent:

```rust
let s: String = "other".to_string();        // Temporary, will be freed
let s: &'static str = Box::leak(s.into_boxed_str());  // Permanent!
```

### Implementation

See `string_pool.rs` for the full implementation using a `HashSet` with `RwLock` for thread-safety.

### Usage in Types

```rust
// BEFORE (allocates every time):
pub enum ValidPluralRule {
    Exact(String),  // ❌ New allocation
}

// AFTER (reuses strings):
pub enum ValidPluralRule {
    Exact(&'static str),  // ✅ Reuses from pool
}
```

## Optimization #2: Replace Regex with Character Iteration

### Problem

The current code uses regex to match identifiers:

```rust
static IDENTIFIER_PREFIX_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"([^\p{White_Space}\p{Pattern_Syntax}]*)").expect(...)
});

fn match_identifier_at_index(s: &str, byte_index: usize) -> String {
    IDENTIFIER_PREFIX_RE.find(substring)
        .map(|m| m.as_str().to_string())  // ❌ Regex + allocation
        .unwrap_or_default()
}
```

### Why is Regex Slow?

Regex engines are powerful but have overhead:

1. State machine setup
2. Unicode property lookups (`\p{White_Space}`)
3. Backtracking logic
4. Result allocation

For simple "scan until special character" tasks, a loop is much faster!

### TypeScript Equivalent

```typescript
function matchIdentifier(str: string, start: number): string {
  let end = start
  // Simple loop - very fast!
  while (end < str.length && isIdentifierChar(str[end])) {
    end++
  }
  return str.slice(start, end) // Zero-copy in V8
}
```

### Rust Solution

```rust
/// Checks if a character is valid in an identifier.
/// An identifier can contain any character EXCEPT:
/// - Whitespace (space, tab, newline, etc.)
/// - Pattern syntax ({ } [ ] < > # etc.)
#[inline]
fn is_identifier_char(c: char) -> bool {
    !is_white_space(c as u32) && !is_pattern_syntax(c)
}

/// Matches an identifier at a specific byte index (OPTIMIZED VERSION).
///
/// Returns a string slice (no allocation!) pointing to the identifier.
fn match_identifier_at_index(s: &str, byte_index: usize) -> &str {
    if byte_index >= s.len() {
        return "";
    }

    let substring = &s[byte_index..];
    let end = substring
        .char_indices()  // Iterator of (byte_offset, char)
        .find(|&(_idx, c)| !is_identifier_char(c))  // Find first non-identifier char
        .map(|(idx, _c)| idx)  // Get its byte offset
        .unwrap_or(substring.len());  // Or go to end of string

    &substring[..end]  // ✅ Zero-copy slice!
}
```

### Key Rust Concepts

#### `&str` vs `String`

```rust
// String = owned, allocated on heap (like `new String()` in JS)
let owned: String = "hello".to_string();  // Allocates

// &str = borrowed, just a pointer + length (like string view in JS)
let borrowed: &str = "hello";  // No allocation!
let slice: &str = &owned[0..3];  // Points into owned string
```

#### `char_indices()` Iterator

```rust
let s = "Hello";
for (byte_idx, ch) in s.char_indices() {
    println!("Byte {} = char '{}'", byte_idx, ch);
}
// Output:
// Byte 0 = char 'H'
// Byte 1 = char 'e'
// etc.
```

This is important because Rust strings are UTF-8, so one character might be multiple bytes (e.g., emoji).

### Performance Impact

- **Before**: Regex match + String allocation on every identifier
- **After**: Simple loop + zero-copy slice
- **Expected speedup**: 2-3x for identifier parsing

## Pattern Syntax Characters

ICU MessageFormat uses these special characters:

- `{` `}` - Argument delimiters
- `#` - Plural count placeholder
- `<` `>` - Tag delimiters
- `'` - Escape character

We optimize checking for these by using a range-based match which compiles to efficient branch-free code.

## Expected Results

After both optimizations:

- **Simple messages**: 3-4M ops/sec (was 2.8M)
- **Normal messages**: 700-800K ops/sec (was 508K)
- **Complex messages**: 70-80K ops/sec (was 53K)
- **String messages**: 4-5M ops/sec (was 2.8M)

This would make Rust 30-50% faster than TypeScript across the board!
