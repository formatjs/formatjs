# Simple FormatJS Example

This example demonstrates basic message extraction and compilation using `rules_formatjs`.

## Structure

```
.
├── BUILD.bazel          # Bazel build configuration
├── MODULE.bazel         # Bazel module configuration
├── src/
│   └── App.tsx         # Example React component with i18n messages
└── messages/           # Generated message files (created by Bazel)
    ├── en.json         # Extracted messages
    └── en-compiled.json # Compiled messages
```

## Usage

### Extract Messages

Extract messages from the source file:

```bash
bazel build //:extract_messages
```

This will generate `bazel-bin/messages/en.json` with extracted messages.

### Compile Messages

Compile the extracted messages for production:

```bash
bazel build //:compile_messages
```

This will generate `bazel-bin/messages/en-compiled.json` with optimized compiled messages.

### Build Everything

```bash
bazel build //...
```

## What's Happening

1. **Message Extraction**: The `formatjs_extract` rule scans `src/App.tsx` for:
   - `<FormattedMessage>` components
   - `intl.formatMessage()` calls
   - Extracts the message ID, default message, and description

2. **Message Compilation**: The `formatjs_compile` rule:
   - Takes the extracted JSON
   - Compiles it to AST format for better runtime performance
   - Outputs an optimized JSON file

3. **Content-based IDs**: Using `id_interpolation_pattern = "[sha512:contenthash:base64:6]"` generates stable IDs based on message content, which helps with:
   - Automatic ID generation
   - Detecting message changes
   - Version control friendly IDs

## Integration

To use the compiled messages in your React app:

```typescript
import messages from './messages/en-compiled.json';
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';

const cache = createIntlCache();
const intl = createIntl({ locale: 'en', messages }, cache);

<RawIntlProvider value={intl}>
  <App />
</RawIntlProvider>
```
