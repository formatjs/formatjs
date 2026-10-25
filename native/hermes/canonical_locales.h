#pragma once

#include <jsi/jsi.h>

namespace formatjs {

// Install before application code, while built-in intrinsics are intact.
void installCanonicalLocales(facebook::jsi::Runtime &runtime);

} // namespace formatjs
