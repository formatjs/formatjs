#pragma once

#include <jsi/jsi.h>

namespace formatjs {

// Install before application code, while built-in intrinsics are intact.
void installCanonicalLocales(facebook::jsi::Runtime &runtime);

// Use the setup object returned by the matching Hermes extension bytecode.
void installCanonicalLocales(facebook::jsi::Runtime &runtime,
                            facebook::jsi::Object &extensions);

} // namespace formatjs
