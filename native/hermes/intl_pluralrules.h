#pragma once
#include <jsi/jsi.h>

namespace formatjs {
void installPluralRules(facebook::jsi::Runtime &);
// Invoke the matching precompiled IntlPluralRules factory with its native bridge.
void installPluralRules(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
