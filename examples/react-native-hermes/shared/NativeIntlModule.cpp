#include "NativeIntlModule.h"

#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_collator.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/hermes/intl_durationformat.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_numberformat.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/hermes/intl_relativetimeformat.h>
#include <formatjs/hermes/intl_segmenter.h>
#include <formatjs/hermes/supported_values.h>

namespace facebook::react {
NativeIntlModule::NativeIntlModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeIntlModuleCxxSpec(std::move(jsInvoker)) {}

bool NativeIntlModule::install(jsi::Runtime& runtime) {
  if (dateTime_) return true;
  formatjs::installCanonicalLocales(runtime);
  formatjs::installSupportedValuesOf(runtime);
  formatjs::installLocale(runtime);
  formatjs::installCanonicalLocales(runtime);
  formatjs::installPluralRules(runtime);
  formatjs::installListFormat(runtime);
  formatjs::installDisplayNames(runtime);
  formatjs::installSegmenter(runtime);
  formatjs::installCollator(runtime);
  formatjs::installNumberFormat(runtime);
  formatjs::installRelativeTimeFormat(runtime);
  dateTime_ = formatjs::installDateTimeFormat(runtime);
  formatjs::installDurationFormat(runtime);
  return true;
}
} // namespace facebook::react
