#include <formatjs/hermes/intl_durationformat.h>
#include <formatjs/intl/durationformat.h>
#include <cmath>
#include <cstring>
#include <memory>
#include <string>
#include <utility>
namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "durationformat.inc"
    ;
using Handle = std::unique_ptr<FormatjsDurationHandle, decltype(&formatjs_duration_destroy)>;
using Construction = std::unique_ptr<FormatjsDurationConstruction, decltype(&formatjs_duration_construction_destroy)>;
using Registry = std::unique_ptr<FormatjsDurationRegistry, decltype(&formatjs_duration_registry_destroy)>;
struct DurationRecord final : jsi::HostObject { explicit DurationRecord(Handle value) : handle(std::move(value)) {} Handle handle; };
struct ConstructionRecord final : jsi::HostObject { explicit ConstructionRecord(Construction value) : handle(std::move(value)) {} Construction handle; };
struct Bytes { FormatjsDurationBytes value{nullptr, 0}; ~Bytes() { formatjs_duration_bytes_free(value); } };
const uint8_t *bytesOf(const std::string &value) { return reinterpret_cast<const uint8_t *>(value.data()); }
jsi::Value status(jsi::Runtime &rt, int32_t code) {
  if (code == 0 || code == 1 || code == 4 || code == 5) return jsi::Value(code);
  throw jsi::JSError(rt, "Rust DurationFormat bridge failed");
}
jsi::Value result(jsi::Runtime &rt, int32_t code, const Bytes &bytes) {
  if (code != 0) return status(rt, code);
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
template<class Record> std::shared_ptr<Record> record(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isObject()) throw jsi::JSError(rt, "Expected DurationFormat record");
  auto object = value.asObject(rt);
  if (!object.isHostObject<Record>(rt)) throw jsi::JSError(rt, "Invalid DurationFormat record");
  return object.getHostObject<Record>(rt);
}
std::string text(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isString()) throw jsi::JSError(rt, "Expected DurationFormat JSON string");
  return value.asString(rt).utf8(rt);
}
uint32_t index(jsi::Runtime &rt, const jsi::Value &value, uint32_t max) {
  if (!value.isNumber()) throw jsi::JSError(rt, "Expected DurationFormat index");
  auto number = value.asNumber();
  if (!std::isfinite(number) || number < 0 || number > max || std::floor(number) != number) throw jsi::JSError(rt, "Invalid DurationFormat index");
  return static_cast<uint32_t>(number);
}
} // namespace
void installDurationFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsDurationRegistry *raw = nullptr;
  if (formatjs_duration_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create DurationFormat context");
  auto registry = std::make_shared<Registry>(raw, formatjs_duration_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationLoad"), 2,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) throw jsi::JSError(rt, "Expected DurationFormat pack kind and JSON");
        auto data = text(rt, args[1]);
        return status(rt, formatjs_duration_registry_load(registry->get(), index(rt, args[0], 1), bytesOf(data), data.size()));
      }));
  bridge.setProperty(runtime, "nativeUnits", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationUnits"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected DurationFormat unit JSON");
        auto data = text(rt, args[0]);
        return status(rt, formatjs_duration_registry_units(registry->get(), bytesOf(data), data.size()));
      }));
  bridge.setProperty(runtime, "nativeInfo", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationInfo"), 0,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        Bytes bytes; return result(rt, formatjs_duration_info(&bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeSupported", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationSupported"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected DurationFormat locale JSON");
        auto data = text(rt, args[0]); Bytes bytes;
        return result(rt, formatjs_duration_supported(bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeBegin", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationBegin"), 1,
      [registry](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected DurationFormat construction JSON");
        auto data = text(rt, args[0]); FormatjsDurationConstruction *raw = nullptr;
        auto code = formatjs_duration_begin(registry->get(), bytesOf(data), data.size(), &raw);
        Construction handle(raw, formatjs_duration_construction_destroy);
        if (code != 0) return status(rt, code);
        return jsi::Object::createFromHostObject(rt, std::make_shared<ConstructionRecord>(std::move(handle)));
      }));
  bridge.setProperty(runtime, "nativeStyle", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationStyle"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) throw jsi::JSError(rt, "Expected DurationFormat style");
        auto model = record<ConstructionRecord>(rt, args[0]); auto data = text(rt, args[1]);
        return status(rt, formatjs_duration_style(model->handle.get(), bytesOf(data), data.size()));
      }));
  bridge.setProperty(runtime, "nativeUnit", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationUnit"), 4,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4 || !args[2].isBool()) throw jsi::JSError(rt, "Expected DurationFormat unit option");
        auto model = record<ConstructionRecord>(rt, args[0]); auto unit = index(rt, args[1], 9); auto data = text(rt, args[3]);
        auto call = args[2].getBool() ? formatjs_duration_unit_display : formatjs_duration_unit_style;
        return status(rt, call(model->handle.get(), unit, bytesOf(data), data.size()));
      }));
  bridge.setProperty(runtime, "nativeFinish", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationFinish"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || (!args[1].isUndefined() && !args[1].isNumber())) throw jsi::JSError(rt, "Expected DurationFormat fractional digits");
        auto model = record<ConstructionRecord>(rt, args[0]); FormatjsDurationHandle *raw = nullptr;
        auto code = formatjs_duration_finish(model->handle.get(), args[1].isNumber() ? 1 : 0, args[1].isNumber() ? args[1].asNumber() : 0, &raw);
        Handle handle(raw, formatjs_duration_destroy);
        if (code != 0) return status(rt, code);
        model->handle.reset();
        return jsi::Object::createFromHostObject(rt, std::make_shared<DurationRecord>(std::move(handle)));
      }));
  bridge.setProperty(runtime, "nativeResolved", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationResolved"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected DurationFormat instance");
        auto model = record<DurationRecord>(rt, args[0]); Bytes bytes;
        return result(rt, formatjs_duration_resolved(model->handle.get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeFormat", jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, "durationFormat"), 4,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 4 || !args[1].isObject() || !args[1].asObject(rt).isArray(rt)) throw jsi::JSError(rt, "Expected DurationFormat values");
        auto model = record<DurationRecord>(rt, args[0]); auto values = args[1].asObject(rt).asArray(rt);
        if (values.size(rt) != 10) throw jsi::JSError(rt, "Expected ten DurationFormat values");
        FormatjsDurationValue value{}; value.defined = static_cast<uint16_t>(index(rt, args[2], 1023));
        for (size_t i = 0; i < 10; ++i) { auto number = values.getValueAtIndex(rt, i); if (!number.isNumber()) throw jsi::JSError(rt, "Expected numeric duration fields"); value.values[i] = number.asNumber(); }
        Bytes bytes; return result(rt, formatjs_duration_format(model->handle.get(), &value, index(rt, args[3], 1), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlDurationFormat").call(runtime, bridge);
}
void installDurationFormat(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:DurationFormat").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime); extensions.setProperty(runtime, "IntlDurationFormat", std::move(factory));
  installDurationFormat(runtime, extensions);
}
} // namespace formatjs
