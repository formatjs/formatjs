# Contributing to rules_formatjs

## Development

### Prerequisites

- [Bazel](https://bazel.build/) 7.0+
- [pnpm](https://pnpm.io/) 8.x

### Building

Build all targets:

```bash
cd rules_formatjs
bazel build //...
```

### Testing

Run all tests:

```bash
bazel test //...
```

### Running Examples

Test the simple example:

```bash
cd examples/simple
bazel build //...
```

## Project Structure

```
rules_formatjs/
├── MODULE.bazel              # Bazel module definition
├── BUILD.bazel               # Root build file
├── formatjs.bzl              # Public API entry point
├── metadata.json             # BCR metadata
├── README.md                 # User documentation
├── formatjs/                 # Rule implementations
│   ├── BUILD.bazel
│   ├── defs.bzl             # Main API
│   ├── extract.bzl          # Message extraction rule
│   └── compile.bzl          # Message compilation rule
└── examples/                 # Example projects
    └── simple/              # Simple extraction/compilation example
        ├── MODULE.bazel
        ├── BUILD.bazel
        ├── package.json
        └── src/
            └── App.tsx
```

## Adding New Rules

1. Create a new `.bzl` file in `formatjs/`
2. Implement your rule following Bazel conventions
3. Export it from `formatjs/defs.bzl`
4. Add documentation to README.md
5. Create an example in `examples/`

## Testing Changes

Before submitting changes:

1. Ensure all builds pass: `bazel build //...`
2. Run all tests: `bazel test //...`
3. Test the examples: `cd examples/simple && bazel build //...`
4. Update documentation if needed

## Submitting to BCR

To submit `rules_formatjs` to the Bazel Central Registry:

1. Update version in `MODULE.bazel`
2. Create a release tag
3. Follow [BCR submission process](https://github.com/bazelbuild/bazel-central-registry/blob/main/docs/README.md)

## License

BSD 3-Clause License - Same as FormatJS
