#pragma once
#include <jsi/jsi.h>

namespace formatjs {
void installListFormat(facebook::jsi::Runtime &);
// Invoke the matching precompiled IntlListFormat factory with its native bridge.
void installListFormat(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
