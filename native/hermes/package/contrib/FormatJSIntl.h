#pragma once

#include <jsi/jsi.h>

namespace facebook::hermes {

void installFormatJSIntl(jsi::Runtime &runtime, jsi::Object &extensions);

} // namespace facebook::hermes
