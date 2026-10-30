# FormatJS Intl for Hermes

Twelve Rust-backed Intl APIs, installed before your app runs. Rust libraries and
locale data are prebuilt; your build compiles the C++ adapter against its own JSI
headers. No Rust toolchain needed to consume an SDK.

| Archive                               | Rust libraries                |
| ------------------------------------- | ----------------------------- |
| `formatjs-hermes-intl-desktop.tar.gz` | Linux x86_64 GNU, macOS arm64 |
| `formatjs-hermes-intl-android.tar.gz` | Android arm64-v8a, x86_64     |

iOS and Windows SDKs are not included. The Android SDK supports native React
Native integration; it does not install through npm alone.

## Get the SDK

SDK releases use `formatjs-hermes-intl_v<version>` in
[FormatJS releases](https://github.com/formatjs/formatjs/releases?q=formatjs-hermes-intl).
Each release includes both archives, `version.txt`, and `checksums.txt`.
Until the first SDK release is published, build from source below.

Download your archive and `checksums.txt` from the same release, then:

```sh
sha256sum --ignore-missing -c checksums.txt
mkdir formatjs-intl-sdk
tar -xmzf formatjs-hermes-intl-android.tar.gz -C formatjs-intl-sdk
export FORMATJS_HERMES_SDK="$PWD/formatjs-intl-sdk"
```

On macOS, check the downloaded desktop archive with
`grep 'formatjs-hermes-intl-desktop.tar.gz$' checksums.txt | shasum -a 256 -c -`.
Keep the archive's headers, C++, JS, and Rust library together. `tar -m` refreshes
file timestamps so replacing an SDK triggers native rebuilds.

## Add it to your build

For an existing CMake target with access to your runtime's JSI headers:

```cmake
include("$ENV{FORMATJS_HERMES_SDK}/cmake/FormatJSIntl.cmake")
formatjs_intl(appmodules)
```

The helper selects the target ABI, compiles the adapter, and links Rust. CMake
3.17+ and a C++17 compiler with exceptions are required. Use your runtime's JSI
headers and C++ settings; the SDK does not supply a second Hermes runtime.

On the JavaScript thread, before application scripts:

```cpp
#include <formatjs/hermes/intl.h>

formatjs::installIntl(runtime);
```

This installs all twelve APIs, handles their load order, and retains native
state until runtime teardown. Repeated calls on the same runtime do nothing.
It replaces existing Intl implementations, including methods on String, Number,
and Date prototypes where the individual polyfills provide them.

React Native's synchronous TurboModule calls this installer. See the
[Android example](https://github.com/formatjs/hermes-intl) for the complete app,
rendered-screen assertions, and screenshot comparison.

### Hermes contrib extensions

Follow [contrib/README.md](contrib/README.md) to register the SDK with Hermes'
core/contrib extension system. Hermes embeds the JS setup as bytecode and calls
the same installer before user scripts.

### Bytecode-only startup

Compile `js/extensions.js` with the runtime's exact `hermesc` version. Evaluate
that bytecode to obtain a setup object, then:

```cpp
auto extensions = runtime.evaluateJavaScript(bytecode, "extensions.hbc")
                      .asObject(runtime);
formatjs::installIntl(runtime, extensions);
```

The overload does not evaluate setup source. Linking the library alone does not
install the polyfills. The contrib path already provides the setup object.

### Bazel consumers

Copy the SDK's module name and version from `MODULE.bazel` into a `bazel_dep`
in your root module, override it with the extracted SDK directory, and link
`@formatjs_intl_getcanonicallocales_hermes//:intl`. This module is not in BCR;
its original module name remains for existing consumers. Individual formatter
targets and installers remain available.

The [standalone consumer](https://github.com/formatjs/formatjs/tree/main/examples/hermes-intl)
runs real Hermes without compiling Rust.

## Locale data

The default archive includes locales selected by Chromium desktop's full-data
UI language filter, including available region/script variants. This matches
locale coverage, not Chrome's per-resource data trimming. Applications do not
load locale JSON at startup.

Choose a smaller set when building an SDK:

```sh
bazel build -c opt --//crates/intl_data:locales=en,fr //native/hermes/package:sdk
```

Use the same flag with `:android_sdk`. Use `--//crates/intl_data:locales=\*` for
all CLDR locales. Adding a locale requires a new SDK build, not an application
runtime download. This setting filters locale records for PluralRules,
ListFormat, DisplayNames, NumberFormat, RelativeTimeFormat, and DateTimeFormat;
Segmenter models and Collator/Locale data remain static.

DateTimeFormat defaults to Gregorian/ISO 8601 and UTC. Optional calendar tables
and timezone transitions are packaged under `calendar-data/` and `timezone-data/`;
load those resources explicitly when needed. Locale names/patterns are compiled.

Read the selected files as UTF-8 text, then register them before construction:

```js
Intl.DateTimeFormat.__addCalendarData(hebrewTableJsonText)
Intl.DateTimeFormat.__addTZData(goldenTimeZoneJsonText)
```

These native hooks load calendar arithmetic and timezone transitions, not locale
names. See `examples/datetimeformat-smoke.ts` in the archive for a complete check.

## Build from source

From a FormatJS checkout on Linux, with Bazel:

```sh
bazel build -c opt //native/hermes/package:sdk
archive=$(bazel cquery -c opt --output=files //native/hermes/package:sdk)
sdk_dir="$PWD/examples/hermes-intl/.cache/sdk"
mkdir -p "$sdk_dir"
tar -xmzf "$archive" -C "$sdk_dir"
```

For Android, install NDK `27.1.12297006`, set `ANDROID_NDK_HOME`, then:

```sh
bazel build -c opt --extra_toolchains=@androidndk//:all --spawn_strategy=local \
  //native/hermes/package:android_sdk
archive=$(bazel cquery -c opt --extra_toolchains=@androidndk//:all \
  --output=files //native/hermes/package:android_sdk)
sdk_dir="$PWD/.cache/formatjs-intl-android-sdk"
mkdir -p "$sdk_dir"
tar -xmzf "$archive" -C "$sdk_dir"
```

Both builds use optimized Rust with ThinLTO. Build custom locales with the flag
above. SDK releases are versioned separately from crates.io packages; Release
Please updates `native/hermes/version.txt`, and the SDK release workflow builds
these same Bazel targets and uploads checksums.

For the standalone Hermes engine, use the pinned
[Hermes overlay](https://github.com/formatjs/hermes/tree/338ff13ff1e996934ae615952d174f8c621844d9),
including its Proxy constructor patch. React Native uses its bundled Hermes;
run the example against your React Native version when upgrading.
