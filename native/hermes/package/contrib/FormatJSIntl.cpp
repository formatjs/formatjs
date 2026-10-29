#include "FormatJSIntl.h"

#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_collator.h>
#include <formatjs/hermes/intl_datetimeformat.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/hermes/intl_durationformat.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_numberformat.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/hermes/intl_relativetimeformat.h>
#include <formatjs/hermes/intl_segmenter.h>
#include <formatjs/hermes/supported_values.h>

#include <memory>

namespace facebook::hermes {

void installFormatJSIntl(jsi::Runtime &runtime, jsi::Object &extensions) {
  static constexpr jsi::UUID installationId{
      0x6be21b08, 0x4fd5, 0x42a5, 0xa048, 0xa9ed7ce3a598};
  if (runtime.getRuntimeData(installationId)) return;

  formatjs::installCanonicalLocales(runtime, extensions);
  auto watchFormatters = formatjs::prepareSupportedValuesOf(runtime, extensions);
  formatjs::installLocale(runtime, extensions);
  // Canonicalization captures the Locale brand installed above.
  formatjs::installCanonicalLocales(runtime, extensions);
  formatjs::installPluralRules(runtime, extensions);
  formatjs::installListFormat(runtime, extensions);
  formatjs::installDisplayNames(runtime, extensions);
  formatjs::installSegmenter(runtime, extensions);
  formatjs::installCollator(runtime, extensions);
  formatjs::installNumberFormat(runtime, extensions);
  formatjs::installRelativeTimeFormat(runtime, extensions);
  auto dateTime = formatjs::installDateTimeFormat(runtime, extensions);
  formatjs::installDurationFormat(runtime, extensions);
  watchFormatters.call(runtime);
  runtime.setRuntimeData(installationId, std::shared_ptr<void>(std::move(dateTime)));
}

} // namespace facebook::hermes
