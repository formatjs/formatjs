#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/intl/listformat.h>

#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "listformat.inc"
    ;
using Handle = std::unique_ptr<FormatjsListHandle, decltype(&formatjs_list_destroy)>;
using Registry = std::unique_ptr<FormatjsListRegistry, decltype(&formatjs_list_registry_destroy)>;
struct ListRecord final : jsi::HostObject {
  explicit ListRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsListBytes value{nullptr, 0};
  ~Bytes() { formatjs_list_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) {
  return reinterpret_cast<const uint8_t *>(value.data());
}
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1 || status == 4) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust ListFormat bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
} // namespace

void installListFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsListRegistry *raw = nullptr;
  if (formatjs_list_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create list locale registry");
  // Callbacks retain this registry. Instances retain their own immutable payload;
  // neither Rust handle contains JSI values or a reference to the runtime.
  auto registry = std::make_shared<Registry>(raw, formatjs_list_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "listLoad"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected list locale JSON");
        auto data = args[0].asString(rt).utf8(rt);
        auto status = formatjs_list_registry_load(registry->get(), bytesOf(data), data.size());
        if (status > 1) throw jsi::JSError(rt, "Rust list locale load failed");
        return jsi::Value(status);
      }));
  bridge.setProperty(runtime, "nativeInfo", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "listInfo"), 0,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        Bytes bytes;
        return result(rt, formatjs_list_registry_info(registry->get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeMatch", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "listMatch"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt, "Expected list locale match JSON");
        auto data = args[0].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_list_registry_match(registry->get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeCreate", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "listCreate"), 2,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isString() || !args[1].isString()) throw jsi::JSError(rt, "Expected list locale and options JSON");
        auto locale = args[0].asString(rt).utf8(rt), options = args[1].asString(rt).utf8(rt);
        FormatjsListHandle *raw = nullptr;
        auto status = formatjs_list_create(registry->get(), bytesOf(locale), locale.size(), bytesOf(options), options.size(), &raw);
        Handle handle(raw, formatjs_list_destroy);
        if (status == 1 || status == 4) return jsi::Value(status);
        if (status != 0) throw jsi::JSError(rt, "Rust list construction failed");
        return jsi::Object::createFromHostObject(rt, std::make_shared<ListRecord>(std::move(handle)));
      }));
  bridge.setProperty(runtime, "nativeQuery", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "listQuery"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected list record and query JSON");
        auto object = args[0].asObject(rt);
        if (!object.isHostObject<ListRecord>(rt)) throw jsi::JSError(rt, "Invalid list record");
        auto record = object.getHostObject<ListRecord>(rt);
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt, formatjs_list_query(record->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlListFormat").call(runtime, bridge);
}

void installListFormat(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:ListFormat").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlListFormat", std::move(factory));
  installListFormat(runtime, extensions);
}
} // namespace formatjs
