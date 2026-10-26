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

using Handle = std::unique_ptr<FormatjsLocaleHandle, decltype(&formatjs_locale_destroy)>;

// The private WeakMap retains this HostObject. GC releases the Rust record;
// neither Rust nor the record owns a JSI value or a reference to the runtime.
struct LocaleRecord final : jsi::HostObject {
  explicit LocaleRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsLocaleBytes value{nullptr, 0};
  ~Bytes() { formatjs_locale_bytes_free(value); }
};
struct CanonicalBytes {
  FormatjsLocaleResult value{nullptr, 0};
  ~CanonicalBytes() { formatjs_locale_result_free(value); }
};
const uint8_t *bytesOf(const std::string &value) {
  return reinterpret_cast<const uint8_t *>(value.data());
}
} // namespace

void installLocale(jsi::Runtime &runtime, jsi::Object &extensions) {
  auto canonicalize = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "localeCanonicalTag"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected locale tag string");
        auto tag = args[0].asString(rt).utf8(rt);
        CanonicalBytes result;
        auto status = formatjs_canonicalize_locale(bytesOf(tag), tag.size(), &result.value);
        if (status == 1) return jsi::Value::null();
        if (status != 0) throw jsi::JSError(rt, "Rust locale canonicalization failed");
        return jsi::String::createFromUtf8(rt, result.value.data, result.value.len);
      });
  auto create = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "localeCreate"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isString() || !args[1].isString()) throw jsi::JSError(rt, "Expected locale tag and options JSON");
        auto tag = args[0].asString(rt).utf8(rt);
        auto options = args[1].asString(rt).utf8(rt);
        FormatjsLocaleHandle *raw = nullptr;
        auto status = formatjs_locale_create(bytesOf(tag), tag.size(), bytesOf(options), options.size(), &raw);
        Handle handle(raw, formatjs_locale_destroy);
        if (status == 1) return jsi::Value::null();
        if (status != 0) throw jsi::JSError(rt, "Rust locale construction failed");
        return jsi::Object::createFromHostObject(rt, std::make_shared<LocaleRecord>(std::move(handle)));
      });
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
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:Locale").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlLocale", std::move(factory));
  installLocale(runtime, extensions);
}
} // namespace formatjs
