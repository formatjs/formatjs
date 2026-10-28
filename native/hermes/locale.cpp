#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/intl/canonicalize.h>
#include <formatjs/intl/locale.h>

#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "locale.inc"
    ;


// The private WeakMap retains this HostObject. GC releases the Rust record;
// neither Rust nor the record owns a JSI value or a reference to the runtime.
using LocaleRecord = hermes_bridge::Record<FormatjsLocaleHandle, formatjs_locale_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsLocaleBytes, formatjs_locale_bytes_free>;
using CanonicalBytes = hermes_bridge::Buffer<FormatjsLocaleResult, formatjs_locale_result_free>;
using hermes_bridge::bytesOf;
} // namespace

void installLocale(jsi::Runtime &runtime, jsi::Object &extensions) {
  auto canonicalize = hermes_bridge::json<1, CanonicalBytes>(runtime, "localeCanonicalTag", "Expected locale tag string", {0, "Rust locale canonicalization failed", true}, formatjs_canonicalize_locale);
  auto create = hermes_bridge::create<2, LocaleRecord>(runtime, "localeCreate", "Expected locale tag and options JSON", {0, "Rust locale construction failed", true}, formatjs_locale_create);
  auto validate = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "localeValidateOption"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isString() || !args[1].isString()) throw jsi::JSError(rt, "Expected option name and string value");
        auto name = args[0].asString(rt).utf8(rt), value = args[1].asString(rt).utf8(rt);
        auto status = formatjs_locale_validate(bytesOf(name), name.size(), bytesOf(value), value.size());
        if (status > 1) throw jsi::JSError(rt, "Rust locale validation failed");
        return status == 0;
      });
  auto query = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "localeQuery"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected Locale record and query JSON");
        auto object = args[0].asObject(rt);
        if (!object.isHostObject<LocaleRecord>(rt)) throw jsi::JSError(rt, "Invalid Locale record");
        auto record = object.getHostObject<LocaleRecord>(rt);
        auto request = args[1].asString(rt).utf8(rt);
        Bytes result;
        if (formatjs_locale_query(record->handle.get(), bytesOf(request), request.size(), &result.value) != 0) throw jsi::JSError(rt, "Rust locale query failed");
        return jsi::String::createFromUtf8(rt, result.value.data, result.value.len);
      });
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "canonicalTag", std::move(canonicalize));
  bridge.setProperty(runtime, "nativeCreate", std::move(create));
  bridge.setProperty(runtime, "nativeValidate", std::move(validate));
  bridge.setProperty(runtime, "nativeQuery", std::move(query));
  extensions.getPropertyAsFunction(runtime, "IntlLocale").call(runtime, bridge);
}

void installLocale(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:Locale", "IntlLocale");
  installLocale(runtime, extensions);
}
} // namespace formatjs
