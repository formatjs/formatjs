#pragma once
#include <jsi/jsi.h>
namespace formatjs {
void installCollator(facebook::jsi::Runtime &);
// Invoke the matching precompiled IntlCollator factory with its native bridge.
void installCollator(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
