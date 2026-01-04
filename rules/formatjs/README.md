# rules_formatjs

Bazel rules for [FormatJS](https://formatjs.io/) - Internationalize your web apps on the client & server.

## Features

- Extract messages from source files (TypeScript, JavaScript, JSX, TSX)
- Compile messages for optimized runtime performance
- Verify translations for completeness
- Aggregate messages across multiple modules
- Native Rust CLI toolchain for fast builds
- Type-safe message extraction and compilation

## Installation

Add `rules_formatjs` to your `MODULE.bazel`:

```starlark
bazel_dep(name = "rules_formatjs", version = "0.1.0")
```

Or use a specific commit from GitHub:

```starlark
git_override(
    module_name = "rules_formatjs",
    remote = "https://github.com/formatjs/rules_formatjs.git",
    commit = "<commit-sha>",
)
```

## Usage

### Extract Messages

Extract internationalized messages from your source code:

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract")

formatjs_extract(
    name = "messages_extracted",
    srcs = glob(["src/**/*.tsx", "src/**/*.ts"]),
    out = "en.json",
    id_interpolation_pattern = "[sha512:contenthash:base64:6]",
)
```

### Compile Messages

Compile extracted messages for optimized runtime:

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_compile")

formatjs_compile(
    name = "messages_compiled",
    src = ":messages_extracted",
    out = "en-compiled.json",
    ast = True,  # Compile to AST for better performance
)
```

### Verify Translations

Verify that translations are complete and correctly formatted:

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_verify")

formatjs_verify(
    name = "verify_translations",
    reference = ":messages_extracted",  # Base language
    translations = [
        "translations/es.json",
        "translations/fr.json",
    ],
)
```

### Aggregate Messages

Aggregate messages from multiple modules into a single file:

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract", "formatjs_aggregate")

# Extract from multiple modules
formatjs_extract(name = "module1_msgs", srcs = ["module1/**/*.tsx"])
formatjs_extract(name = "module2_msgs", srcs = ["module2/**/*.tsx"])
formatjs_extract(name = "module3_msgs", srcs = ["module3/**/*.tsx"])

# Create aggregation target
formatjs_aggregate(
    name = "all_messages",
    deps = [":module1_msgs", ":module2_msgs", ":module3_msgs"],
)
```

Then build with the aspect:

```bash
bazel build //:all_messages \
  --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \
  --output_groups=aggregated_messages
```

### Complete Example

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract", "formatjs_compile", "formatjs_verify")

# Extract messages from source files
formatjs_extract(
    name = "extract_en",
    srcs = glob([
        "src/**/*.ts",
        "src/**/*.tsx",
    ]),
    out = "lang/en.json",
    id_interpolation_pattern = "[sha512:contenthash:base64:6]",
    extract_from_format_message_call = True,
)

# Compile for production
formatjs_compile(
    name = "compile_en",
    src = ":extract_en",
    out = "lang/en-compiled.json",
    ast = True,
)

# Compile translations
formatjs_compile(
    name = "compile_es",
    src = "translations/es.json",
    out = "lang/es-compiled.json",
    ast = True,
)

# Verify translations are complete
formatjs_verify(
    name = "verify_es",
    reference = ":extract_en",
    translations = ["translations/es.json"],
)
```

## API Reference

### formatjs_extract

Extract messages from source files. This is a **custom Bazel rule** (not a macro), which means you can attach aspects to it for advanced build graph analysis.

**Attributes:**

- `name` (required): Target name
- `srcs` (required): List of source files to extract from
- `out` (optional): Output JSON file (defaults to `name + ".json"`)
- `id_interpolation_pattern` (optional): Pattern for message ID generation
  - Example: `"[sha512:contenthash:base64:6]"` for content-based IDs
- `extract_from_format_message_call` (optional): Extract from `formatMessage()` calls
- `additional_component_names` (optional): Additional component names to extract from
- `additional_function_names` (optional): Additional function names to extract from
- `ignore` (optional): List of glob patterns to ignore

**Providers:**

- `DefaultInfo`: Contains the extracted messages JSON file
- `FormatjsExtractInfo`: Custom provider with:
  - `messages`: File containing extracted messages
  - `srcs`: Depset of source files
  - `id_interpolation_pattern`: Pattern used for ID generation

### formatjs_compile

Compile extracted messages for optimized runtime.

**Attributes:**

- `name` (required): Target name
- `src` (required): Source JSON file with extracted messages
- `out` (optional): Output compiled JSON file (defaults to `name + ".json"`)
- `ast` (optional): Compile to AST format for better runtime performance
- `format` (optional): Input format (`simple`, `crowdin`, `smartling`, `transifex`)

### formatjs_verify

Verify that translations are complete and correctly formatted.

**Attributes:**

- `name` (required): Target name
- `reference` (required): Reference messages file (typically the base language)
- `translations` (required): List of translation files to verify

## Integration with React

Use compiled messages with `react-intl`:

```typescript
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import messages from './lang/en-compiled.json';

const cache = createIntlCache();
const intl = createIntl(
  {
    locale: 'en',
    messages,
  },
  cache
);

function App() {
  return (
    <RawIntlProvider value={intl}>
      {/* Your app */}
    </RawIntlProvider>
  );
}
```

## Advanced: Using Aspects

Since `formatjs_extract` is a custom rule, you can attach Bazel aspects to it for advanced analysis and transformations. This is useful for:

- Collecting statistics about extracted messages
- Validating message format and completeness
- Aggregating messages across multiple targets
- Custom reporting and analysis

### Message Aggregation Aspect

The `formatjs_aggregate_aspect` collects and merges extracted messages from a target and all its dependencies into a single JSON file using `jq`.

#### Example

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract", "formatjs_aggregate")

# Extract from multiple modules
formatjs_extract(name = "module1_msgs", srcs = ["module1/**/*.tsx"])
formatjs_extract(name = "module2_msgs", srcs = ["module2/**/*.tsx"])
formatjs_extract(name = "module3_msgs", srcs = ["module3/**/*.tsx"])

# Create aggregation target
formatjs_aggregate(
    name = "all_messages",
    deps = [":module1_msgs", ":module2_msgs", ":module3_msgs"],
)
```

Then build with the aspect:

```bash
bazel build //:all_messages \
  --aspects=@rules_formatjs//formatjs:aggregate.bzl%formatjs_aggregate_aspect \
  --output_groups=aggregated_messages
```

Output: `bazel-bin/all_messages_aggregated_messages.json` containing all merged messages.

**Merge Strategy**: Uses `jq` to merge JSON objects. Later files overwrite earlier ones for duplicate keys.

### Example Aspects

The library also includes demonstration aspects in `formatjs/aspects.bzl`:

#### Message Statistics

```bash
bazel build //path/to:target \
  --aspects=@rules_formatjs//formatjs:aspects.bzl%message_stats_aspect \
  --output_groups=message_stats
```

#### Message Validation

```bash
bazel build //path/to:target \
  --aspects=@rules_formatjs//formatjs:aspects.bzl%message_validator_aspect \
  --output_groups=message_validation
```

#### Message Collection (across dependencies)

```bash
bazel build //path/to:target \
  --aspects=@rules_formatjs//formatjs:aspects.bzl%message_collector_aspect \
  --output_groups=all_messages
```

### Creating Custom Aspects

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "FormatjsExtractInfo")

def _my_aspect_impl(target, ctx):
    if FormatjsExtractInfo not in target:
        return []

    info = target[FormatjsExtractInfo]

    # Access extracted message file
    messages_file = info.messages

    # Access source files
    src_files = info.srcs.to_list()

    # Perform custom analysis...

    return [OutputGroupInfo(...)]

my_aspect = aspect(
    implementation = _my_aspect_impl,
    doc = "My custom aspect for formatjs_extract",
)
```

## Toolchain

rules_formatjs uses a native Rust CLI toolchain that is automatically downloaded for your platform. The toolchain supports:

- macOS (Apple Silicon and Intel)
- Linux (x86_64)

The toolchain is registered automatically when you add the MODULE.bazel dependency. Binaries are fetched from GitHub releases and cached by Bazel.

## Examples

See the [examples](examples/) directory for complete working examples:

- [examples/simple](examples/simple) - Basic message extraction, compilation, and verification
- [examples/aggregate](examples/aggregate) - Aggregating messages from multiple modules

## Resources

- [FormatJS Documentation](https://formatjs.io/)
- [FormatJS CLI](https://formatjs.io/docs/tooling/cli)
- [React Intl](https://formatjs.io/docs/react-intl)
- [Bazel](https://bazel.build/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development instructions.

## License

Apache License 2.0
