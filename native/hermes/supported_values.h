#ifndef FORMATJS_HERMES_SUPPORTED_VALUES_H
#define FORMATJS_HERMES_SUPPORTED_VALUES_H

#include <jsi/jsi.h>

namespace formatjs {

// Install after the embedding's formatters. Both paths use the same JS factory.
void installSupportedValuesOf(facebook::jsi::Runtime &runtime);
void installSupportedValuesOf(facebook::jsi::Runtime &runtime,
                              facebook::jsi::Object &extensions);

} // namespace formatjs

#endif
