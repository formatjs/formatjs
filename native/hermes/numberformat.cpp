#include <formatjs/hermes/intl_numberformat.h>
#include <formatjs/intl/numberformat.h>

#include <cstring>
#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "numberformat.inc"
    ;
using Handle = std::unique_ptr<FormatjsNumberHandle, decltype(&formatjs_number_destroy)>;
using Registry = std::unique_ptr<FormatjsNumberRegistry, decltype(&formatjs_number_registry_destroy)>;
struct NumberRecord final : jsi::HostObject {
  explicit NumberRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsNumberBytes value{nullptr, 0};
  ~Bytes() { formatjs_number_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) { return reinterpret_cast<const uint8_t *>(value.data()); }
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1 || status == 4) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust NumberFormat bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
jsi::Value instance(jsi::Runtime &rt, int32_t status, FormatjsNumberHandle *raw) {
  Handle handle(raw, formatjs_number_destroy);
  if (status == 1 || status == 4) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust NumberFormat construction failed");
  return jsi::Object::createFromHostObject(rt, std::make_shared<NumberRecord>(std::move(handle)));
}
using RegistryJson = int32_t (*)(const FormatjsNumberRegistry *, const uint8_t *, size_t, FormatjsNumberBytes *);
jsi::Function registryJson(jsi::Runtime &runtime, const char *name, std::shared_ptr<Registry> registry, RegistryJson call) {
  return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), 1,
      [registry, call](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected NumberFormat JSON request");
        auto data = args[0].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, call(registry->get(), bytesOf(data), data.size(), &bytes.value), bytes);
      });
}
std::shared_ptr<NumberRecord> record(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isObject()) throw jsi::JSError(rt, "Expected NumberFormat record");
  auto object = value.asObject(rt);
  if (!object.isHostObject<NumberRecord>(rt)) throw jsi::JSError(rt, "Invalid NumberFormat record");
  return object.getHostObject<NumberRecord>(rt);
}
} // namespace

void installNumberFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsNumberRegistry *raw = nullptr;
  if (formatjs_number_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create number locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_number_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberLoad"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected number locale JSON");
        auto data = args[0].asString(rt).utf8(rt);
        auto status = formatjs_number_registry_load(registry->get(), bytesOf(data), data.size());
        if (status > 1) throw jsi::JSError(rt, "Rust number locale load failed");
        return jsi::Value(status);
      }));
  bridge.setProperty(runtime, "nativeUnits", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberUnits"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected number unit JSON");
        auto data = args[0].asString(rt).utf8(rt);
        auto status = formatjs_number_registry_units(registry->get(), bytesOf(data), data.size());
        if (status > 1) throw jsi::JSError(rt, "Rust number unit load failed");
        return jsi::Value(status);
      }));
  bridge.setProperty(runtime, "nativeInfo", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberInfo"), 0,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        Bytes bytes;
        return result(rt, formatjs_number_registry_info(registry->get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeSupported", registryJson(runtime, "numberSupported", registry, formatjs_number_supported));
  bridge.setProperty(runtime, "nativeResolve", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberResolve"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected number locale options JSON");
        auto data = args[0].asString(rt).utf8(rt);
        FormatjsNumberHandle *raw = nullptr;
        auto status = formatjs_number_resolve(registry->get(), bytesOf(data), data.size(), &raw);
        return instance(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeCreate", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberCreate"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected number record and options JSON");
        auto seed = record(rt, args[0]);
        auto data = args[1].asString(rt).utf8(rt);
        FormatjsNumberHandle *raw = nullptr;
        auto status = formatjs_number_create(seed->handle.get(), bytesOf(data), data.size(), &raw);
        return instance(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeQuery", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "numberQuery"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected number record and query JSON");
        auto model = record(rt, args[0]);
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_number_query(model->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlNumberFormat").call(runtime, bridge);
}
void installNumberFormat(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:NumberFormat").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlNumberFormat", std::move(factory));
  installNumberFormat(runtime, extensions);
}
} // namespace formatjs
