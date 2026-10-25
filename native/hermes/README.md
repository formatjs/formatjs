# Rust Intl.getCanonicalLocales on Hermes

`canonical_locales` installs `Intl.getCanonicalLocales` through public JSI.
The JS wrapper preserves locale-list coercion and property access order; Rust
validates and canonicalizes each tag using ICU4X and CLDR aliases. No WASM runtime
or asynchronous bridge is involved.

Install before application code:

```cpp
#include "native/hermes/canonical_locales.h"

formatjs::installCanonicalLocales(*runtime);
```

Link `//native/hermes:canonical_locales` and supply the embedding application's
JSI implementation. Rust owns returned UTF-8 buffers; the adapter releases each
buffer after copying it into a JSI string. No per-runtime Rust cache is retained.

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

The host build is an explicit development target. Mobile application packaging
and Hermes upstream extension registration are separate integration work.
