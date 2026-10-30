#pragma once
#include <jsi/jsi.h>

namespace formatjs {
void installDisplayNames(facebook::jsi::Runtime &);
// Invoke the matching precompiled IntlDisplayNames factory with its native bridge.
void installDisplayNames(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
