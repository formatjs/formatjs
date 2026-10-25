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

// Rust owns the UTF-8 output until JSI copies it; also release on exceptions.
struct LocaleResult {
  FormatjsLocaleResult value{nullptr, 0};
  ~LocaleResult() { formatjs_locale_result_free(value); }
};

} // namespace

void installCanonicalLocales(jsi::Runtime &runtime) {
  // Install after trusted Intl.Locale setup, before application code. Public JSI
  // cannot read arbitrary internal slots; capture Intl.Locale.prototype.toString
  // for the brand/tag checks in CanonicalizeLocaleList 3 and 7.c.iii–iii.1.
  // https://github.com/tc39/ecma402/blob/3691634ebc1794f2af74cb26e59824b21090c3ad/spec/negotiation.html#L51-L64
  auto canonicalize = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "canonicalizeLocale"), 1,
      [](jsi::Runtime &runtime, const jsi::Value &, const jsi::Value *args,
         size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) {
          throw jsi::JSError(runtime, "Expected a locale string");
        }
        // The wrapper already performed observable JS conversion. Borrow this
        // UTF-8 copy only for the synchronous Rust call; no JS values cross FFI.
        auto input = args[0].asString(runtime).utf8(runtime);
        LocaleResult result;
        int32_t status = formatjs_canonicalize_locale(
            reinterpret_cast<const uint8_t *>(input.data()), input.size(),
            &result.value);
        // Status 1 means an invalid tag; null asks JS to throw its captured
        // RangeError, as required by CanonicalizeLocaleList 7.c.v.
        // https://github.com/tc39/ecma402/blob/3691634ebc1794f2af74cb26e59824b21090c3ad/spec/negotiation.html#L67
        if (status == 1) {
          return jsi::Value::null();
        }
        // Pointer/UTF-8 faults and caught panics are ABI errors, not tag syntax.
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
