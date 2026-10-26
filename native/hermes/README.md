# Rust Intl extensions on Hermes

The C++ adapter requires C++17 and exceptions enabled. Compile against the
embedding runtime's JSI headers with matching ABI and toolchain settings.

`canonical_locales` installs `Intl.getCanonicalLocales` through public JSI.
The JS wrapper preserves locale-list coercion and property access order; Rust
validates and canonicalizes each tag using ICU4X and CLDR aliases. No WASM runtime
or asynchronous bridge is involved.

Install before application code:

```cpp
#include <formatjs/hermes/canonical_locales.h>

formatjs::installCanonicalLocales(*runtime);
```

Inside FormatJS, link `//native/hermes:canonical_locales`. External consumers
use the [standalone SDK](package/README.md) and link
`@formatjs_intl_getcanonicallocales_hermes//:canonical_locales` with their Hermes
runtime. The SDK ships Rust static libraries for Linux x86_64 GNU and macOS
arm64; consumers compile its C++ adapter against their matching JSI headers.
Version `0.1.0` is built from this repository and is not published to BCR, npm,
or crates.io. Android/iOS artifacts and React Native packaging are separate work.

Canonicalization returns Rust-owned UTF-8 buffers; the adapter releases each
buffer after copying it into a JSI string. Canonicalization retains no runtime
cache. Locale instances use owned Rust handles managed by JSI garbage collection.

## Locale and supported values

The SDK also includes `Intl.Locale` and `Intl.supportedValuesOf`. Install all
three before application code; reinstall canonicalization last so its intrinsic
Locale brand check recognizes the newly installed constructor:

```cpp
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/supported_values.h>

formatjs::installCanonicalLocales(*runtime);
formatjs::installSupportedValuesOf(*runtime);
formatjs::installLocale(*runtime);
formatjs::installCanonicalLocales(*runtime);
```

Each installer also accepts the precompiled `extensions` object shown below.
Link SDK targets `:locale` and `:supported_values` alongside `:canonical_locales`.
Locale's private WeakMap retains its native handle; JS subclasses and prototype
changes cannot forge that brand. Information methods query current formatter
support, so locale data loaded after construction remains visible.

## Standalone installation

Build and extract the SDK on Linux:

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

The [independent example](../../examples/hermes-intl/README.md) consumes only the
extracted SDK's public layout. It compiles `js/extensions.js` using the execution
platform's `hermesc`, evaluates the resulting bytecode into a setup object, then
installs it before application code:

```cpp
auto extensions = runtime->evaluateJavaScript(bytecode, "extensions.hbc")
                      .asObject(*runtime);
formatjs::installCanonicalLocales(*runtime, extensions);
```

## Hermes extension registration

For Hermes core/contrib integration, include the SDK's
`js/30-IntlGetCanonicalLocales.js` in Hermes' concatenated extension sources,
compile/link the adapter and target Rust archive, then call
`formatjs::installCanonicalLocales(runtime, extensions)` from the C++ extension
dispatcher. Keep the JavaScript fragment and adapter at the same SDK version.
The complete `js/extensions.js` bundle is for standalone startup, not the
concatenated source list. Linking the SDK does not register a startup hook.

Install trusted `Intl.Locale` before the final installer call. If Locale itself
needs `Intl.getCanonicalLocales`, install the adapter, load Locale, then reinstall
the adapter before application code so it captures Locale's intrinsic brand method.

## Development runner

The standalone host runner uses the native Bazel module from
[formatjs/hermes](https://github.com/formatjs/hermes), with Intl disabled. It
installs the Rust implementation, then evaluates each script in the same runtime.
`print()` and monotonic `performance.now()` are available. `--prelude=path.js`
evaluates a startup script between initial installation and final installation.
This permits loading a trusted `Intl.Locale` polyfill, whose intrinsic brand
method is captured during final installation. Install any Locale implementation
before the final adapter installation; ordinary arguments run afterward.

```sh
bazel test -c opt //native/hermes:canonical_locales_test
bazel run -c opt //native/hermes:hermes_runner -- /absolute/path/script.js
```

The host runner is an explicit development target. CI cross-builds the SDK and
standalone macOS executable on Linux; macOS only runs the downloaded artifacts.

## Native bridge

Rust owns Intl records, locale data, and formatting. C++ adapts JSI values,
callbacks, and foreign exceptions. Adapters share `bridge.h` for transport,
branded handles, owned buffers, and factory installation.

C ABI headers generate from Rust exports through `//tools/ffi_headers`, using
pinned cbindgen source and its upstream Cargo lock. Type renames preserve public
C names. The SDK ships generated headers and the shared bridge; SDK consumers
need neither Rust nor cbindgen to build the JSI adapters.

## Existing package conformance

Each `//native/hermes/tests:<polyfill>_package_conformance_test` reuses package API
test bodies against Rust JSI, in source and optimized-bytecode installer modes.
Each file gets a fresh Hermes runtime. Supporting formatters remain real TS
implementations; native data envelopes preserve the original test payloads.

Current targets: `supportedvaluesof`.

Explicit exclusion reports identify TS-private state, implementation-defined
diagnostics, and host-specific behavior. Original TS unit suites retain those
checks. Unsupported assertions, stale exclusions, and unmet assertion counts fail.
The host timezone stays UTC.
