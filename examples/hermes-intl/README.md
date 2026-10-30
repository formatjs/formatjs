# Standalone Hermes example

Independent Bazel module consuming an extracted FormatJS Intl SDK. No Rust
compiler required. Tests run all twelve APIs through real Hermes, including
source/bytecode installation, repeat installation, and native state lifetime.

Build or download a desktop archive using the [SDK guide](../../native/hermes/package/README.md),
extract it into this example's `.cache/sdk` directory, then run:

```sh
sdk_dir="$PWD/.cache/sdk"
bazel test --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  //:smoke_test
```

Default locale data is already compiled. To test a custom build, select
`--//crates/intl_data:locales=en,fr,aa` when building the SDK. The existing
DisplayNames smoke needs Afar (`aa`); the app example uses only English/French.

For macOS arm64, cross-build on Linux using the same override:

```sh
bazel build --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  //:smoke_macos_arm64 //:extension_bytecode
bazel cquery --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  --output=files //:smoke_macos_arm64 //:extension_bytecode
```

Copy the executable and bytecode to macOS, then run `./smoke ./extensions.hbc`.
`hermesc` stays on the execution platform. CI runs the Linux tests and downloaded
macOS executable. Optional calendar/timezone resources are read from the SDK.

For React Native Android, use [formatjs/hermes-intl](https://github.com/formatjs/hermes-intl).
