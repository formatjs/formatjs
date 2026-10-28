#include <formatjs/hermes/bridge.h>
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
using RelativeRecord = hermes_bridge::Record<FormatjsRelativeHandle, formatjs_relative_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsRelativeBytes, formatjs_relative_bytes_free>;
using hermes_bridge::bytesOf;
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  return hermes_bridge::result(rt, status, bytes, 2, "Rust RelativeTimeFormat bridge failed");
}

std::shared_ptr<RelativeRecord> record(jsi::Runtime &rt, const jsi::Value &value) {
  return hermes_bridge::record<RelativeRecord>(rt, value, "Expected RelativeTimeFormat record", "Invalid RelativeTimeFormat record");
}
} // namespace

void installRelativeTimeFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsRelativeRegistry *raw = nullptr;
  if (formatjs_relative_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create relative-time locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_relative_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", hermes_bridge::load(runtime, "relativeLoad", "Expected relative-time locale JSON", "Rust relative-time locale load failed", formatjs_relative_registry_load, registry));
  bridge.setProperty(runtime, "nativeInfo", hermes_bridge::json<0, Bytes>(runtime, "relativeInfo", nullptr, {2, "Rust RelativeTimeFormat bridge failed"}, formatjs_relative_registry_info, registry));
  bridge.setProperty(runtime, "nativeSupported", hermes_bridge::json<1, Bytes>(runtime, "relativeSupported", "Expected RelativeTimeFormat JSON request", {2, "Rust RelativeTimeFormat bridge failed"}, formatjs_relative_supported, registry));
  bridge.setProperty(runtime, "nativeResolve", hermes_bridge::json<1, Bytes>(runtime, "relativeResolve", "Expected RelativeTimeFormat JSON request", {2, "Rust RelativeTimeFormat bridge failed"}, formatjs_relative_resolve, registry));
  bridge.setProperty(runtime, "nativeCreate", hermes_bridge::create<1, RelativeRecord>(runtime, "relativeCreate", "Expected relative-time construction JSON", {2, "Rust RelativeTimeFormat construction failed"}, formatjs_relative_create, registry));
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "relativeQuery", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected relative-time record and query JSON");
    auto model = record(rt, args[0]);
    auto data = args[1].asString(rt).utf8(rt);
    Bytes bytes;
    return result(rt, formatjs_relative_query(model->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
  });
  hermes_bridge::bind(runtime, bridge, "nativeFormat", "relativeFormat", 3,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3 || !args[0].isObject() || !args[1].isString() || !args[2].isString())
          throw jsi::JSError(rt, "Expected RelativeTimeFormat record, value and unit");
        auto model = record(rt, args[0]);
        auto value = args[1].asString(rt).utf8(rt);
        auto unit = args[2].asString(rt).utf16(rt);
        Bytes bytes;
        auto code = formatjs_relative_format(model->handle.get(), bytesOf(value), value.size(),
            reinterpret_cast<const uint16_t *>(unit.data()), unit.size(), &bytes.value);
        if (code != 0) return hermes_bridge::status(rt, code, 2, "Rust RelativeTimeFormat bridge failed");
        return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
      });
  extensions.getPropertyAsFunction(runtime, "IntlRelativeTimeFormat").call(runtime, bridge);
}
void installRelativeTimeFormat(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:RelativeTimeFormat", "IntlRelativeTimeFormat");
  installRelativeTimeFormat(runtime, extensions);
}
} // namespace formatjs
