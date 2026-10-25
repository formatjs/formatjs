#include "native/hermes/canonical_locales.h"

#include "crates/intl_getcanonicallocales/canonicalize.h"

#include <memory>
#include <string>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {

constexpr char wrapperSource[] =
#include "native/hermes/get_canonical_locales.inc"
    ;

struct LocaleResult {
  FormatjsLocaleResult value{nullptr, 0};
  ~LocaleResult() { formatjs_locale_result_free(value); }
};

} // namespace

void installCanonicalLocales(jsi::Runtime &runtime) {
  auto canonicalize = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "canonicalizeLocale"), 1,
      [](jsi::Runtime &runtime, const jsi::Value &, const jsi::Value *args,
         size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) {
          throw jsi::JSError(runtime, "Expected a locale string");
        }
        auto input = args[0].asString(runtime).utf8(runtime);
        LocaleResult result;
        int32_t status = formatjs_canonicalize_locale(
            reinterpret_cast<const uint8_t *>(input.data()), input.size(),
            &result.value);
        if (status == 1) {
          return jsi::Value::null();
        }
        if (status != 0) {
          throw jsi::JSError(runtime, "Rust locale canonicalization failed");
        }
        return jsi::String::createFromUtf8(runtime, result.value.data,
                                          result.value.len);
      });
  auto factory = runtime
                     .evaluateJavaScript(
                         std::make_shared<jsi::StringBuffer>(wrapperSource),
                         "formatjs:getCanonicalLocales")
                     .asObject(runtime)
                     .asFunction(runtime);
  factory.call(runtime, canonicalize);
}

} // namespace formatjs
