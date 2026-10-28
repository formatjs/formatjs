# Standalone Hermes SDK consumer

This independent Bazel module consumes the extracted SDK without compiling Rust
or loading FormatJS build targets. It installs the available Intl extensions and
runs the SDK's compiled TypeScript smoke scripts through real Hermes.

Locale data comes from the Rust archive. The consumer injects no locale JSON;
English/French formatting works immediately after installation. Existing smoke
assertions cover exact numeric inputs, receiver checks and localized results.

Default locales follow Chromium desktop's full-data UI language filter, including regional
and script variants. Use `--//crates/intl_data:locales=\*` for every CLDR locale.
Select a custom archive with
`--//crates/intl_data:locales=en,fr` when building the SDK; rebuild to add locales.
The full DisplayNames smoke also exercises Afar; include `aa` for that smoke.
DateTimeFormat retains its guard; calendar providers and timezone transitions
remain separate resources, with calendar locale names already compiled.

The SDK is built and tested here but is not published. From the FormatJS root
on Linux:

```sh
bazel build -c opt //native/hermes/package:sdk
sdk_archive="$(bazel cquery -c opt --output=files //native/hermes/package:sdk)"
sdk_dir="$PWD/examples/hermes-intl/.cache/sdk"
mkdir -p "$sdk_dir"
tar -xzf "$sdk_archive" -C "$sdk_dir"
cd examples/hermes-intl
bazel test --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  //:smoke_test
```

Cross-build the macOS arm64 executable on Linux. `hermesc` remains a Linux
execution tool; only the application target changes platform:

```sh
bazel build --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  //:smoke_macos_arm64 //:extension_bytecode
bazel cquery --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  --output=files //:smoke_macos_arm64
bazel cquery --config=linux \
  --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" \
  --output=files //:extension_bytecode
```

Copy those two outputs to macOS arm64, then run:

```sh
./smoke ./extensions.hbc
```

CI builds and tests on Linux through BuildBuddy. macOS only executes the
downloaded binary and bytecode. SDK target support currently covers Linux
x86_64 GNU and macOS arm64; this is not a React Native mobile package.
