#pragma once

#include <jsi/jsi.h>

namespace formatjs {

// Install once per runtime, before application scripts, on the JavaScript thread.
void installIntl(facebook::jsi::Runtime &runtime);
void installIntl(facebook::jsi::Runtime &runtime, facebook::jsi::Object &extensions);

} // namespace formatjs
