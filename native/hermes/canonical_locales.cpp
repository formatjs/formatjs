#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/intl/canonicalize.h>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "get_canonical_locales.inc"
    ;
using Bytes = hermes_bridge::Buffer<FormatjsLocaleResult, formatjs_locale_result_free>;
}

void installCanonicalLocales(jsi::Runtime &runtime, jsi::Object &extensions) {
  auto canonicalize = hermes_bridge::json<1, Bytes>(runtime, "canonicalizeLocale",
      "Expected a locale string", {0, "Rust locale canonicalization failed", true},
      formatjs_canonicalize_locale);
  extensions.getPropertyAsFunction(runtime, "IntlGetCanonicalLocales").call(runtime, canonicalize);
}

void installCanonicalLocales(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource,
      "formatjs:getCanonicalLocales", "IntlGetCanonicalLocales");
  installCanonicalLocales(runtime, extensions);
}
} // namespace formatjs
