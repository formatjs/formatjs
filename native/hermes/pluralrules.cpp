#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/intl/pluralrules.h>

#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "pluralrules.inc"
    ;
using Handle = std::unique_ptr<FormatjsPluralHandle, decltype(&formatjs_plural_destroy)>;
using Registry = std::unique_ptr<FormatjsPluralRegistry, decltype(&formatjs_plural_registry_destroy)>;
struct PluralRecord final : jsi::HostObject {
  explicit PluralRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsPluralBytes value{nullptr, 0};
  ~Bytes() { formatjs_plural_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) {
  return reinterpret_cast<const uint8_t *>(value.data());
}
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1 || status == 4) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust PluralRules bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
} // namespace

void installPluralRules(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsPluralRegistry *raw = nullptr;
  if (formatjs_plural_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create plural locale registry");
  // Callbacks retain this registry. Instances retain their own immutable payload;
  // neither Rust handle contains JSI values or a reference to the runtime.
  auto registry = std::make_shared<Registry>(raw, formatjs_plural_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "pluralLoad"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected plural locale JSON");
        auto data = args[0].asString(rt).utf8(rt);
        auto status = formatjs_plural_registry_load(registry->get(), bytesOf(data), data.size());
        if (status > 1) throw jsi::JSError(rt, "Rust plural locale load failed");
        return jsi::Value(status);
      }));
  bridge.setProperty(runtime, "nativeInfo", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "pluralInfo"), 0,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        Bytes bytes;
        return result(rt, formatjs_plural_registry_info(registry->get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeMatch", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "pluralMatch"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected plural locale match JSON");
        auto data = args[0].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_plural_registry_match(registry->get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeCreate", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "pluralCreate"), 2,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isString() || !args[1].isString()) throw jsi::JSError(rt, "Expected plural locale and options JSON");
        auto locale = args[0].asString(rt).utf8(rt), options = args[1].asString(rt).utf8(rt);
        FormatjsPluralHandle *raw = nullptr;
        auto status = formatjs_plural_create(registry->get(), bytesOf(locale), locale.size(), bytesOf(options), options.size(), &raw);
        Handle handle(raw, formatjs_plural_destroy);
        if (status == 1 || status == 4) return jsi::Value(status);
        if (status != 0) throw jsi::JSError(rt, "Rust plural construction failed");
        return jsi::Object::createFromHostObject(rt, std::make_shared<PluralRecord>(std::move(handle)));
      }));
  bridge.setProperty(runtime, "nativeQuery", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "pluralQuery"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected plural record and query JSON");
        auto object = args[0].asObject(rt);
        if (!object.isHostObject<PluralRecord>(rt)) throw jsi::JSError(rt, "Invalid plural record");
        auto record = object.getHostObject<PluralRecord>(rt);
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_plural_query(record->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlPluralRules").call(runtime, bridge);
}

void installPluralRules(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:PluralRules").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlPluralRules", std::move(factory));
  installPluralRules(runtime, extensions);
}
} // namespace formatjs
