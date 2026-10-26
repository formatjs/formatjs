# Hermes canonicalization SDK

Version `0.1.0` packages the Rust C ABI, C++ JSI adapter, and Hermes extension
JavaScript. This archive is built from the repository; it is not published to
BCR, npm, or crates.io.

The archive contains:

```text
MODULE.bazel
BUILD.bazel
include/formatjs/hermes/canonical_locales.h
include/formatjs/intl/canonicalize.h
src/canonical_locales.cpp
src/get_canonical_locales.inc
js/30-IntlGetCanonicalLocales.js
js/extensions.js
lib/x86_64-unknown-linux-gnu/libformatjs_intl_getcanonicallocales.a
lib/aarch64-apple-darwin/libformatjs_intl_getcanonicallocales.a
```

Rust and its compiled ICU data are prebuilt for Linux x86_64 GNU and macOS
arm64. The consumer compiles the thin C++ adapter against its Hermes JSI
headers. Android, iOS, and other target triples are not included.

## Build and install

From a FormatJS checkout on Linux:

```sh
bazel build -c opt //native/hermes/package:sdk
sdk_archive="$(bazel cquery -c opt --output=files //native/hermes/package:sdk)"
sdk_dir="$(mktemp -d)"
tar -xzf "$sdk_archive" -C "$sdk_dir"
```

Add the SDK module to the consumer's `MODULE.bazel`:

```starlark
bazel_dep(name = "formatjs_intl_getcanonicallocales_hermes", version = "0.1.0")
```

Until publication, pass the extracted directory to every consumer invocation:

```sh
bazel build --override_module=formatjs_intl_getcanonicallocales_hermes="$sdk_dir" //:app
```

Link `@formatjs_intl_getcanonicallocales_hermes//:canonical_locales` and your
Hermes runtime. The root module must supply the Hermes archive override and its
own C++ toolchain; the SDK registers no toolchains and requires no Rust compiler.
See `examples/hermes-intl` in FormatJS for a complete independent root.

## Install before application JavaScript

For embedders that allow source evaluation:

```cpp
#include <formatjs/hermes/canonical_locales.h>

formatjs::installCanonicalLocales(*runtime);
```

For bytecode-only startup, compile `js/extensions.js` with the same `hermesc`
version as the runtime. Evaluate that bytecode to obtain its setup object, then
pass the object to the installer:

```cpp
auto extensions = runtime->evaluateJavaScript(bytecode, "extensions.hbc")
                      .asObject(*runtime);
formatjs::installCanonicalLocales(*runtime, extensions);
```

The standalone example builds this bytecode through Bazel's execution toolchain,
so cross-compilation never runs the target-platform `hermesc`.

Install a trusted `Intl.Locale` implementation before the final installer call.
If the Locale polyfill itself needs `Intl.getCanonicalLocales`, install this
adapter first, load Locale, then reinstall the adapter before application code.
The final installation captures Locale's intrinsic brand method.

## Hermes core/contrib extension integration

Hermes extensions use explicit build-time registration. Copy
`js/30-IntlGetCanonicalLocales.js` into the enabled extension source list before
Hermes embeds its extension bytecode. Compile the SDK adapter, link the static
library for the target triple, then call
`formatjs::installCanonicalLocales(runtime, extensions)` from the C++ extension
dispatcher after any trusted Locale installer. Use the same SDK version for the
JavaScript fragment and C++ adapter.

The standalone `js/extensions.js` already wraps the fragment in a setup-object
factory. Do not add that complete bundle to Hermes' concatenated extension
source list. Linking this SDK alone does not register a Hermes startup hook.

Non-Bazel embedders can use the same headers, adapter source, and archive. Add
`include/` to the include path and keep the private `.inc` beside the adapter.
Compile as C++17 with exceptions enabled and match the embedding runtime's JSI
ABI and toolchain settings.
The SDK's `BUILD.bazel` records the supported platform selection and native
system linker flags.
