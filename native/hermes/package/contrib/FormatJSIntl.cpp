#include "FormatJSIntl.h"
#include <formatjs/hermes/intl.h>

namespace facebook::hermes {

void installFormatJSIntl(jsi::Runtime &runtime, jsi::Object &extensions) {
  formatjs::installIntl(runtime, extensions);
}

} // namespace facebook::hermes
