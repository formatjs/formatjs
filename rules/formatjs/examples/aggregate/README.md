# Message Aggregation Example

This example demonstrates how to use the `formatjs_aggregate_aspect` to collect and merge extracted messages from multiple modules into a single JSON file.

## Project Structure

This is a standalone Bazel workspace with the following structure:

```
aggregate/
├── MODULE.bazel             # Bazel workspace configuration
├── BUILD.bazel              # Root build file
├── module1/
│   ├── BUILD.bazel         # Module 1 build configuration
│   └── Messages.tsx        # Module 1 messages
├── module2/
│   ├── BUILD.bazel         # Module 2 build configuration
│   └── Messages.tsx        # Module 2 messages
├── module3/
│   ├── BUILD.bazel         # Module 3 build configuration (depends on module1)
│   └── Messages.tsx        # Module 3 messages (includes some common messages)
└── app/
    ├── BUILD.bazel         # Application build configuration
    ├── App.tsx             # Application that uses all modules
    └── expected.json       # Expected aggregated messages for testing
```

## Key Features

- **Transitive Dependency Collection**: Module 3 depends on Module 1, and the app only depends on Module 2 and Module 3. The aspect automatically traverses the dependency graph to collect messages from Module 1 transitively, demonstrating proper dependency graph traversal.
- **Application-Level Aggregation**: The `formatjs_aggregate` target is at the app level, collecting messages from direct and transitive dependencies
- **Automated Testing**: Includes a snapshot test that verifies the aggregated output contains all expected messages, including those from Module 1 (which is only a transitive dependency)

## Usage

### Extract Messages from Individual Modules

Extract messages from each module separately:

```bash
cd examples/aggregate
bazel build //module1:messages
bazel build //module2:messages
bazel build //module3:messages
```

### Aggregate Messages from All Modules

The `formatjs_aggregate` rule automatically applies the aspect to collect and merge all messages:

```bash
bazel build //app:all_messages
```

This will create a single JSON file containing all messages from all three modules. The rule automatically:

- Applies the `formatjs_aggregate_aspect` to traverse dependencies
- Collects messages from `module2` and `module3` (direct deps)
- Transitively collects messages from `module1` (via module3's dependency)
- Merges all messages into a single JSON file using jq

### Run the Test

Verify that the aggregation works correctly:

```bash
bazel test //app:aggregation_test
```

This test uses snapshot testing with `write_source_files` to verify the aggregated output matches the expected fixture.

### Update the Snapshot

If you intentionally change the messages, update the snapshot:

```bash
bazel run //app:update_all_messages_fixture
```

## Output

The aggregated file will be located at:

```
bazel-bin/app/all_messages.json
```

It will contain all messages from all three modules merged into a single JSON object:

```json
{
  "module1.title": {
    "defaultMessage": "Module 1 Title",
    "description": "Title for module 1"
  },
  "module1.description": {
    "defaultMessage": "This is the first module",
    "description": "Description for module 1"
  },
  "module2.title": {
    "defaultMessage": "Module 2 Title",
    "description": "Title for module 2"
  },
  "module2.description": {
    "defaultMessage": "This is the second module",
    "description": "Description for module 2"
  },
  "module3.title": {
    "defaultMessage": "Module 3 Title",
    "description": "Title for module 3"
  },
  "module3.description": {
    "defaultMessage": "This is the third module",
    "description": "Description for module 3"
  },
  "common.save": {
    "defaultMessage": "Save",
    "description": "Common save button"
  },
  "common.cancel": {
    "defaultMessage": "Cancel",
    "description": "Common cancel button"
  }
}
```

## How It Works

1. **Extraction**: Each `formatjs_extract` rule extracts messages from its source files
2. **Dependency Graph**: Module3 depends on Module1, and the app depends on Module2 and Module3
3. **Aspect Application**: The `formatjs_aggregate` rule applies `formatjs_aggregate_aspect` to its deps
4. **Transitive Collection**: The aspect traverses the dependency graph, collecting messages from:
   - Module2 (direct dependency)
   - Module3 (direct dependency)
   - Module1 (transitive dependency via Module3)
5. **Aggregation**: All message files are collected using `FormatjsExtractInfo` and `FormatjsAggregateInfo` providers
6. **Merging**: `jq` merges all JSON files into a single file using object multiplication

The merge strategy uses `jq`'s `reduce .[] as $item ({}; . * $item)` which:

- Starts with an empty object `{}`
- Iterates through all message files
- Merges each file into the result using `*` (object multiplication)
- Later files overwrite earlier ones for duplicate keys

## Use Cases

This aggregation is useful for:

- **Monorepo Translation**: Collect all messages from multiple packages/modules
- **Build-time Validation**: Ensure no duplicate message IDs across modules
- **Translation Workflows**: Generate a single file for translators
- **CI/CD**: Check for message changes across the entire codebase
- **Bundle Optimization**: Create optimized message bundles per locale
