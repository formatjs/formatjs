#ifndef FORMATJS_HERMES_SUPPORTED_VALUES_H
#define FORMATJS_HERMES_SUPPORTED_VALUES_H

#include <jsi/jsi.h>

namespace formatjs {

// Install after the embedding's formatters. Both paths use the same JS factory.
void installSupportedValuesOf(facebook::jsi::Runtime &runtime);
void installSupportedValuesOf(facebook::jsi::Runtime &runtime,
                              facebook::jsi::Object &extensions);

// Install before Locale; invoke the callback after installing the formatters.
facebook::jsi::Function prepareSupportedValuesOf(
    facebook::jsi::Runtime &runtime, facebook::jsi::Object &extensions);

} // namespace formatjs

#endif
