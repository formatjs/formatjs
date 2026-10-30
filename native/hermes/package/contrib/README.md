# Hermes contrib integration

Use one FormatJS SDK archive for C++, JS, and Rust. Build with Hermes
engine `393a539e6` plus the [pinned overlay patches](https://github.com/formatjs/hermes/tree/338ff13ff1e996934ae615952d174f8c621844d9),
and a matching target archive.

Copy `30-*.js` through `41-*.js` and `FormatJSIntl.cpp/.h` from this directory
into `API/hermes/extensions/contrib/`. Copy `formatjs-intl.js` into
`test/hermes/contrib/`.

Add `FormatJSIntl.cpp` to `CONTRIB_EXTENSIONS_CPP_SOURCES` in
`API/hermes/extensions/contrib/CMakeLists.txt`. Include `FormatJSIntl.h` and call
`installFormatJSIntl(rt, extensions)` in `ContribExtensions.cpp`.

After `add_hermes_library(hermesapi ...)` in `API/hermes/CMakeLists.txt`, add:

```cmake
include("${FORMATJS_HERMES_SDK}/contrib/FormatJSIntl.cmake")
```

Configure Hermes with `-DFORMATJS_HERMES_SDK=/absolute/path/to/sdk` and
`-DHERMES_ENABLE_CORE_EXTENSIONS=ON -DHERMES_ENABLE_CONTRIB_EXTENSIONS=ON`.
The SDK's CMake file compiles adapter sources against Hermes JSI and links the
prebuilt Rust archive. Hermes embeds the copied JS fragments during its bytecode
build, then calls the installer before user scripts. The DateTimeFormat guard is
held by JSI runtime data until runtime teardown.

The contrib dispatcher delegates to `formatjs::installIntl`; source, bytecode,
and contrib startup share dependency order and runtime ownership.

Run `test/hermes/contrib/formatjs-intl.js` with Hermes Lit tests. Rebuild the SDK
to select different compiled locales. Do not mix JS and native files from
different SDK versions.
