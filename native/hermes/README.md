# Rust Intl extensions on Hermes

[SDK guide](package/README.md): downloads, CMake/Bazel integration, custom locales.
[React Native example](https://github.com/formatjs/hermes-intl): all twelve APIs on
one Android screen, rendered-text tests, screenshot comparison.

```cpp
#include <formatjs/hermes/intl.h>

formatjs::installIntl(runtime);
```

Call on the JavaScript thread before application code. The installer handles
load order, native state ownership, and repeated calls. Its setup-object overload
uses Hermes extension bytecode without evaluating source.

## Design

- TypeScript facades preserve observable ECMA-402 coercions, getters, brands,
  descriptors, and iteration. They call private native bridges.
- C++ adapts JSI values, buffers, callbacks, and foreign exceptions.
- Rust owns locale matching, validation, records, and formatting. ICU4X and shared
  CLDR/Unicode inputs supply data and algorithms; Collator retains the FormatJS
  CLDR sort/search profile with ICU4X normalization and casing.

`bridge.h` shares transport and ownership helpers. C ABI headers generate from
Rust exports using `//tools/ffi_headers` and pinned cbindgen. Consumers need
neither Rust nor cbindgen to compile the packaged adapter.

The SDK uses compiled locale providers. Source targets retain explicit registries
for custom providers and conformance fixtures. See
[compiled data](../../knowledge-base/007m-hermes-distribution.md) for package flow.

## Hermes version

The standalone consumer pins engine `393a539e6` and the
[FormatJS overlay](https://github.com/formatjs/hermes/tree/338ff13ff1e996934ae615952d174f8c621844d9).
Its Proxy constructor patch prevents an extra observable `newTarget.prototype`
read. Bazel applies it automatically; raw engine builds must apply it too.
Compile setup bytecode with the exact `hermesc` version used by the runtime.
React Native uses its bundled engine; the Android example tests that integration.

## Individual installers

Each formatter retains its public header and source/setup-object overloads.
Use those when installing a subset. `installIntl` is the default for all APIs;
its implementation records the dependency order in one place.

DateTimeFormat's individual installer returns a guard. Keep it on the JavaScript
thread until formatting stops, then destroy it before the runtime. `installIntl`
retains this guard in runtime data automatically. Rust queues GC releases and
drains them on the runtime thread.

Install Temporal before DurationFormat to accept duration strings and branded
Temporal durations. Duration-like records work without Temporal.

## Tests and benchmarks

Source and optimized-bytecode integration tests run on real Hermes. Fixtures
cross-check Rust/TS with ICU4C/J/X; Segmenter also runs complete Unicode 17
boundary corpora. Test262 baselines record remaining engine limitations.

```sh
bazel test -c opt //native/hermes/tests:segmenter_conformance_test \
  //native/hermes/tests:listformat_conformance_test
bazel test -c opt //tools/test262:hermes-collator
```

The [independent SDK consumer](../../examples/hermes-intl/README.md) validates
extracted archives, all-API installation, source/bytecode startup, and repeat
installation. CI cross-builds on Linux and runs downloaded macOS binaries.

[Hermes benchmarks](../../benchmarks/hermes-intl-extension/README.md) compare
optimized SDKs with TS in the same engine. Keep setup, workload, compiler flags,
and output checks consistent; retain raw timings and profiles with changes.
