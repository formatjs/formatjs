#pragma once
#include <jsi/jsi.h>
namespace formatjs {
void installSegmenter(facebook::jsi::Runtime &);
// Invoke the matching precompiled IntlSegmenter factory with its native bridge.
void installSegmenter(facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
