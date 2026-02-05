# CLI Conformance Test Suite

This directory contains a conformance test suite that ensures the Rust CLI (`crates/formatjs_cli`) and TypeScript CLI (`packages/cli`) produce identical outputs.

## Purpose

The conformance tests verify that:

1. Both CLIs produce identical JSON output for the same inputs
2. Both CLIs handle edge cases consistently
3. Both CLIs support all output formats (simple, transifex, lokalise, crowdin, smartling)
4. Both CLIs handle errors in the same way

## Test Case Format

Test cases are stored in `test_cases/*.txt` files using the same format as the parser integration tests:

```
<input code>
---
<options JSON>
---
<expected output JSON>
```

### Example Test Case

```
import {defineMessages} from 'react-intl';

const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello World!',
    description: 'Greeting message'
  }
});
---
{
  "command": "extract",
  "args": ["--throws"],
  "fileType": "jsx"
}
---
{
  "app.greeting": {
    "defaultMessage": "Hello World!",
    "description": "Greeting message"
  }
}
```

## Test Coverage

The test suite covers:

### Basic Extraction

- `01_basic_extract.txt` - Basic message extraction with IDs
- `02_plural_messages.txt` - Plural format messages
- `15_inline_formatmessage.txt` - Inline FormattedMessage components
- `16_typescript_file.txt` - TypeScript file extraction

### Options and Flags

- `03_flatten_option.txt` - `--flatten` flag (extracts only defaultMessage)
- `04_content_hash_id.txt` - `--id-interpolation-pattern` with content hashing
- `05_additional_function_names.txt` - `--additional-function-names` flag
- `06_extract_source_location.txt` - `--extract-source-location` flag
- `17_pragma.txt` - `--pragma` flag for file filtering

### Output Formats

- `07_format_simple.txt` - Simple format (ID -> string mapping)
- `11_format_transifex.txt` - Transifex format
- `12_format_lokalise.txt` - Lokalise format
- `13_format_crowdin.txt` - Crowdin format
- `14_format_smartling.txt` - Smartling format

### Edge Cases

- `08_whitespace_preservation.txt` - Leading/trailing whitespace handling
- `09_escaped_quotes.txt` - Escaped apostrophes in ICU messages
- `10_nested_select_plural.txt` - Nested select and plural formats
- `18_optional_chaining.txt` - Optional chaining in code
- `19_no_id_with_hash.txt` - Messages without IDs using content hashing
- `20_flatten_with_hash.txt` - Flatten + content hashing combination

## Running the Tests

```bash
# Run all conformance tests
bazel test //packages/cli/integration-tests/conformance-tests:conformance_test

# Run with verbose output
bazel test //packages/cli/integration-tests/conformance-tests:conformance_test --test_output=all
```

## Adding New Test Cases

1. Create a new file in `test_cases/` following the naming convention: `NN_description.txt`
2. Use the three-part format: input code, options JSON, expected output JSON
3. The test runner will automatically pick up the new test case
4. Run the tests to ensure both CLIs produce the expected output

## Special Options

Test case options support these fields:

- `command`: CLI command to run (usually "extract")
- `args`: Array of command-line arguments
- `fileType`: File extension (jsx, tsx, js, ts, etc.)
- `skipLocationCheck`: Boolean, set to true for tests that include file paths (which will differ between runs)

## Known Differences

Some minor differences between the CLIs are acceptable:

1. **Error messages**: The exact wording may differ, but both should fail/succeed in the same cases
2. **File paths**: When using `--extract-source-location`, absolute paths will differ
3. **Stderr output**: Warning/error messages may be formatted differently

The conformance tests focus on the **JSON output structure and content**, which must be identical.

## Related Files

- [`conformance.test.ts`](./conformance.test.ts) - Test runner
- [`../rust-binary-utils.ts`](../rust-binary-utils.ts) - Utility to locate Rust binary
- [`../extract/integration.test.ts`](../extract/integration.test.ts) - Original integration tests

## Contributing

When adding new CLI features:

1. Add corresponding conformance test cases
2. Ensure both Rust and TypeScript implementations pass all tests
3. Update this README if adding new test categories
