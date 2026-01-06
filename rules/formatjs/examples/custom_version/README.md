# Custom FormatJS CLI Version Example

This example demonstrates how to use a custom FormatJS CLI version that is not included in the built-in `FORMATJS_CLI_VERSIONS` dictionary.

## What This Example Shows

- **Custom Version Configuration**: How to use version 0.1.0, which was removed from the built-in versions
- **Simple Ergonomic API**: Just provide version, platform, url, and sha256 - no manual platform constraints needed
- **Message Extraction**: A working example of extracting messages using the custom CLI version

## Use Cases

This approach is useful when you need to:

1. **Test unreleased versions**: Try out pre-release or development builds
2. **Use custom builds**: Use a modified or patched version of the FormatJS CLI
3. **Support new platforms**: Add support for platforms not yet in the official releases
4. **Pin to specific versions**: Use an older version for compatibility reasons

## Configuration

The custom version is configured in [MODULE.bazel](MODULE.bazel) using a single toolchain call
inspired by the `rules_nodejs` pattern:

```starlark
formatjs_cli = use_extension("@rules_formatjs//formatjs_cli:extensions.bzl", "formatjs_cli")

# Single toolchain call with custom binaries
formatjs_cli.toolchain(
    name = "formatjs_v0_1_0",
    formatjs_repositories = {
        "0.1.0.darwin-arm64": [
            "https://github.com/.../formatjs_cli-darwin-arm64",
            "9b2c736b48cc...",
        ],
        "0.1.0.linux-x64": [
            "https://github.com/.../formatjs_cli-linux-x64",
            "884b9a41b9f6...",
        ],
    },
)
```

The `formatjs_repositories` attribute uses keys in `{version}.{platform}` format and values as `[url, sha256]` lists.
This compact dict format is inspired by (though simpler than) the `node_repositories` pattern from `rules_nodejs`.

### Supported Platform Values

- `darwin-arm64` - macOS Apple Silicon (M1/M2/M3)
- `darwin-x86_64` - macOS Intel
- `linux-x64` - Linux x86_64
- `linux-aarch64` - Linux ARM64
- `windows-x86_64` - Windows x86_64

The platform string automatically determines the correct execution constraints.

### Repository Naming

Repositories are automatically named using the pattern:

```
{name}_{platform}
{name}_toolchains
```

For example, with `name = "formatjs_v0_1_0"`:

- `formatjs_v0_1_0_darwin_arm64` - Darwin ARM64 binary repository
- `formatjs_v0_1_0_linux_x64` - Linux x64 binary repository
- `formatjs_v0_1_0_toolchains` - Toolchain definitions repository

This naming pattern matches `rules_nodejs` conventions.

## How Platform Selection Works

Bazel's toolchain resolution automatically selects the correct binary based on:

1. **Execution platform**: Where Bazel is running (your machine)
2. **Platform constraints**: Automatically derived from the platform string

In this example:

- On macOS ARM64: The custom 0.1.0 darwin-arm64 toolchain is available
- On Linux x64: The custom 0.1.0 linux-x64 toolchain is available
- The standard 0.1.2 toolchains (from rules_formatjs root MODULE.bazel) are also available
- Bazel will select the best match based on platform constraints

## Running the Example

Build and extract messages:

```bash
# Navigate to the example directory
cd examples/custom_version

# Build the example
bazel build :messages

# Run the test
bazel test :test_extraction

# View the extracted messages
cat bazel-bin/messages.json
```

### Verifying Which CLI Version Is Used

To verify that Bazel selected the custom 0.1.0 toolchain:

```bash
# Check which toolchain repositories are available
bazel query '@formatjs_v0_1_0_darwin_arm64//...' --output=label 2>/dev/null

# The extraction uses whichever toolchain matches your platform constraints
# Since we registered formatjs_v0_1_0_toolchains first, it takes precedence
```

The key insight: We register `@formatjs_v0_1_0_toolchains//:all` in this example's MODULE.bazel,
which creates platform-specific toolchains. Bazel's toolchain resolution will select the one
matching your execution platform (darwin-arm64 or linux-x64 in this example).

## Files

- **MODULE.bazel**: Configuration for custom FormatJS CLI version using the simple API
- **BUILD.bazel**: Build rules for generating source files and extracting messages
- **test_extraction.sh**: Test script to verify the extraction works correctly
- **App.tsx**: Generated TypeScript/React file with FormatJS messages (created at build time)
- **README.md**: This file

## Expected Output

When you build the `:messages` target, it will create a `messages.json` file containing:

```json
{
  "app.welcome": {
    "id": "app.welcome",
    "defaultMessage": "Welcome to the custom version example!",
    "description": "Welcome message on homepage"
  },
  "app.goodbye": {
    "id": "app.goodbye",
    "defaultMessage": "Goodbye!",
    "description": "Farewell message"
  },
  "app.inline": {
    "id": "app.inline",
    "defaultMessage": "This is an inline message",
    "description": "Inline message example"
  }
}
```

## Key Takeaways

1. **rules_nodejs-style API**: Configure all custom platforms in a single `toolchain()` call
2. **Declarative**: Specify version, URL template, and platform-to-checksum mapping in one place
3. **No code changes needed**: Your FormatJS rules work the same regardless of which CLI version is used
4. **Flexible configuration**: You can have multiple toolchain configurations and let Bazel select based on platform
5. **Security**: SHA256 checksums ensure the downloaded binaries are authentic
6. **Co-existence**: Custom versions can co-exist with standard versions - Bazel picks the best match

## Comparison with Standard Toolchains

This example does NOT call `formatjs_cli.toolchain()` because we're only using custom binaries. However, the root MODULE.bazel of `rules_formatjs` does call it, so standard toolchains (0.1.2) are also available.

If you want to completely override and use only custom versions, you can still do so - Bazel will prefer the custom toolchains if they match the platform constraints.

## See Also

- [formatjs_cli/extensions.bzl](../../formatjs_cli/extensions.bzl): Extension implementation with the simple platform API
- [formatjs_cli/repositories.bzl](../../formatjs_cli/repositories.bzl): Repository rules for downloading binaries
- [FormatJS CLI documentation](https://formatjs.github.io/docs/tooling/cli)
