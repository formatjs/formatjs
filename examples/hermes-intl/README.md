# Standalone Hermes SDK consumer

This independent Bazel module consumes the extracted SDK archive. It does not
load FormatJS build targets or compile Rust. The example creates a Hermes
runtime, evaluates the SDK's precompiled extension setup, installs
`Intl.getCanonicalLocales`, and checks aliases, duplicate removal, array-like
inputs, and exceptions.

The SDK is built and tested here but is not published. From the FormatJS root
on Linux:

```sh
bazel build -c opt //native/hermes/package:sdk
sdk_archive="$(bazel cquery -c opt --output=files //native/hermes/package:sdk)"
sdk_dir="$(mktemp -d)"
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
