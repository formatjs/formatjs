#ifndef FORMATJS_HERMES_LOCALE_H
#define FORMATJS_HERMES_LOCALE_H

#include <jsi/jsi.h>

namespace formatjs {
// Install before application scripts. Reinstall canonicalLocales afterwards
// so its Locale brand check captures this constructor's intrinsic toString.
void installLocale(facebook::jsi::Runtime &runtime);
void installLocale(facebook::jsi::Runtime &runtime,
                   facebook::jsi::Object &extensions);
} // namespace formatjs

#endif
