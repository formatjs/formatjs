#include <formatjs/hermes/intl_relativetimeformat.h>
#include <formatjs/intl/relativetimeformat.h>

#include <cstring>
#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "relativetimeformat.inc"
    ;
using Handle = std::unique_ptr<FormatjsRelativeHandle, decltype(&formatjs_relative_destroy)>;
using Registry = std::unique_ptr<FormatjsRelativeRegistry, decltype(&formatjs_relative_registry_destroy)>;
struct RelativeRecord final : jsi::HostObject {
  explicit RelativeRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsRelativeBytes value{nullptr, 0};
  ~Bytes() { formatjs_relative_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) { return reinterpret_cast<const uint8_t *>(value.data()); }
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust RelativeTimeFormat bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
jsi::Value instance(jsi::Runtime &rt, int32_t status, FormatjsRelativeHandle *raw) {
  Handle handle(raw, formatjs_relative_destroy);
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust RelativeTimeFormat construction failed");
  return jsi::Object::createFromHostObject(rt, std::make_shared<RelativeRecord>(std::move(handle)));
}
using RegistryJson = int32_t (*)(const FormatjsRelativeRegistry *, const uint8_t *, size_t, FormatjsRelativeBytes *);
jsi::Function registryJson(jsi::Runtime &runtime, const char *name, std::shared_ptr<Registry> registry, RegistryJson call) {
  return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), 1,
      [registry, call](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected RelativeTimeFormat JSON request");
        auto data = args[0].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, call(registry->get(), bytesOf(data), data.size(), &bytes.value), bytes);
      });
}
std::shared_ptr<RelativeRecord> record(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isObject()) throw jsi::JSError(rt, "Expected RelativeTimeFormat record");
  auto object = value.asObject(rt);
  if (!object.isHostObject<RelativeRecord>(rt)) throw jsi::JSError(rt, "Invalid RelativeTimeFormat record");
  return object.getHostObject<RelativeRecord>(rt);
}
} // namespace

void installRelativeTimeFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsRelativeRegistry *raw = nullptr;
  if (formatjs_relative_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create relative-time locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_relative_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "relativeLoad"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected relative-time locale JSON");
        auto data = args[0].asString(rt).utf8(rt);
        auto status = formatjs_relative_registry_load(registry->get(), bytesOf(data), data.size());
        if (status > 1) throw jsi::JSError(rt, "Rust relative-time locale load failed");
        return jsi::Value(status);
      }));
  bridge.setProperty(runtime, "nativeInfo", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "relativeInfo"), 0,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        Bytes bytes;
        return result(rt, formatjs_relative_registry_info(registry->get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeSupported", registryJson(runtime, "relativeSupported", registry, formatjs_relative_supported));
  bridge.setProperty(runtime, "nativeResolve", registryJson(runtime, "relativeResolve", registry, formatjs_relative_resolve));
  bridge.setProperty(runtime, "nativeCreate", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "relativeCreate"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected relative-time construction JSON");
        auto data = args[0].asString(rt).utf8(rt);
        FormatjsRelativeHandle *raw = nullptr;
        auto status = formatjs_relative_create(registry->get(), bytesOf(data), data.size(), &raw);
        return instance(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeQuery", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "relativeQuery"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected relative-time record and query JSON");
        auto model = record(rt, args[0]);
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_relative_query(model->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlRelativeTimeFormat").call(runtime, bridge);
}
void installRelativeTimeFormat(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:RelativeTimeFormat").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlRelativeTimeFormat", std::move(factory));
  installRelativeTimeFormat(runtime, extensions);
}
} // namespace formatjs
