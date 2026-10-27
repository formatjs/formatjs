#include <formatjs/hermes/bridge.h>
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
using NumberRecord = hermes_bridge::Record<FormatjsNumberHandle, formatjs_number_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsNumberBytes, formatjs_number_bytes_free>;
using hermes_bridge::bytesOf;
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  return hermes_bridge::result(rt, status, bytes, 18, "Rust NumberFormat bridge failed");
}
jsi::Value instance(jsi::Runtime &rt, int32_t status, FormatjsNumberHandle *raw) {
  Handle handle(raw, formatjs_number_destroy);
  if (status == 1 || status == 4) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust NumberFormat construction failed");
  return jsi::Object::createFromHostObject(rt, std::make_shared<NumberRecord>(std::move(handle)));
}
std::shared_ptr<NumberRecord> record(jsi::Runtime &rt, const jsi::Value &value) {
  return hermes_bridge::record<NumberRecord>(rt, value, "Expected NumberFormat record", "Invalid NumberFormat record");
}
} // namespace

void installNumberFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsNumberRegistry *raw = nullptr;
  if (formatjs_number_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create number locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_number_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", hermes_bridge::load(runtime, "numberLoad", "Expected number locale JSON", "Rust number locale load failed", formatjs_number_registry_load, registry));
  bridge.setProperty(runtime, "nativeUnits", hermes_bridge::load(runtime, "numberUnits", "Expected number unit JSON", "Rust number unit load failed", formatjs_number_registry_units, registry));
  bridge.setProperty(runtime, "nativeInfo", hermes_bridge::json<0, Bytes>(runtime, "numberInfo", nullptr, {18, "Rust NumberFormat bridge failed"}, formatjs_number_registry_info, registry));
  bridge.setProperty(runtime, "nativeSupported", hermes_bridge::json<1, Bytes>(runtime, "numberSupported", "Expected NumberFormat JSON request", {18, "Rust NumberFormat bridge failed"}, formatjs_number_supported, registry));
  bridge.setProperty(runtime, "nativeResolve", hermes_bridge::create<1, NumberRecord>(runtime, "numberResolve", "Expected number locale options JSON", {18, "Rust NumberFormat construction failed"}, formatjs_number_resolve, registry));
  hermes_bridge::bind(runtime, bridge, "nativeCreate", "numberCreate", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected number record and options JSON");
    auto seed = record(rt, args[0]);
    auto data = args[1].asString(rt).utf8(rt);
    FormatjsNumberHandle *raw = nullptr;
    auto status = formatjs_number_create(seed->handle.get(), bytesOf(data), data.size(), &raw);
    return instance(rt, status, raw);
  });
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "numberQuery", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected number record and query JSON");
    auto model = record(rt, args[0]);
    auto data = args[1].asString(rt).utf8(rt);
    Bytes bytes;
    return result(rt, formatjs_number_query(model->handle.get(), bytesOf(data), data.size(), &bytes.value), bytes);
  });
  extensions.getPropertyAsFunction(runtime, "IntlNumberFormat").call(runtime, bridge);
}
void installNumberFormat(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:NumberFormat", "IntlNumberFormat");
  installNumberFormat(runtime, extensions);
}
} // namespace formatjs
