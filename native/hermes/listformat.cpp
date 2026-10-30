#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/intl/listformat.h>

#include <array>
#include <vector>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "listformat.inc"
    ;
using Model = hermes_bridge::Record<FormatjsListHandle, formatjs_list_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsListBytes, formatjs_list_bytes_free>;
using Units = hermes_bridge::Buffer<FormatjsListUnits, formatjs_list_units_free>;
using Registry = std::unique_ptr<FormatjsListRegistry, decltype(&formatjs_list_registry_destroy)>;
constexpr hermes_bridge::Policy results{2, "Rust ListFormat bridge failed"};
template <typename Call>
jsi::Value callList(jsi::Runtime &rt, const jsi::Value *args, size_t count, Call call) {
  if (count != 2 || !args[0].isObject() || !args[1].isObject() || !args[1].asObject(rt).isArray(rt))
    throw jsi::JSError(rt, "Expected list record and string array");
  auto model = hermes_bridge::record<Model>(rt, args[0], "Expected list record", "Invalid list record");
  auto list = args[1].asObject(rt).getArray(rt);
  const auto length = list.size(rt);
  std::array<std::u16string, 8> inlineValues;
  std::vector<std::u16string> heapValues;
  auto *values = inlineValues.data();
  if (length > inlineValues.size()) {
    heapValues.resize(length);
    values = heapValues.data();
  }
  for (size_t i = 0; i < length; ++i) {
    auto value = list.getValueAtIndex(rt, i);
    if (!value.isString()) throw jsi::JSError(rt, "Expected string list element");
    values[i] = value.asString(rt).utf16(rt);
  }
  std::array<FormatjsListSlice, 8> inlineSlices;
  std::vector<FormatjsListSlice> heapSlices;
  auto *slices = inlineSlices.data();
  if (length > inlineSlices.size()) {
    heapSlices.resize(length);
    slices = heapSlices.data();
  }
  for (size_t i = 0; i < length; ++i)
    slices[i] = {reinterpret_cast<const uint16_t *>(values[i].data()), values[i].size()};
  Units units;
  auto code = call(model->handle.get(), slices, length, &units.value);
  if (code != 0) return hermes_bridge::status(rt, code, results.accepted, results.failure);
  return jsi::String::createFromUtf16(rt, reinterpret_cast<const char16_t *>(units.value.data), units.value.len);
}
} // namespace

void installListFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsListRegistry *raw = nullptr;
  if (formatjs_list_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create list locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_list_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", hermes_bridge::load(runtime, "listLoad",
      "Expected list locale JSON", "Rust list locale load failed", formatjs_list_registry_load, registry));
  bridge.setProperty(runtime, "nativeInfo", hermes_bridge::json<0, Bytes>(runtime, "listInfo",
      nullptr, results, formatjs_list_registry_info, registry));
  bridge.setProperty(runtime, "nativeMatch", hermes_bridge::json<1, Bytes>(runtime, "listMatch",
      "Expected list locale match JSON", results, formatjs_list_registry_match, registry));
  bridge.setProperty(runtime, "nativeCreate", hermes_bridge::create<2, Model>(runtime, "listCreate",
      "Expected list locale and options JSON", {2, "Rust list construction failed"}, formatjs_list_create, registry));
  bridge.setProperty(runtime, "nativeCreateDefault", hermes_bridge::create<1, Model>(runtime, "listCreateDefault",
      "Expected canonical list locales JSON", {2, "Rust default list construction failed"}, formatjs_list_create_default, registry));
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "listQuery", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected list record and query JSON");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected list record and query JSON", "Invalid list record");
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        auto code = formatjs_list_query(model->handle.get(), hermes_bridge::bytesOf(data), data.size(), &bytes.value);
        return hermes_bridge::result(rt, code, bytes, results.accepted, results.failure);
      });
  hermes_bridge::bind(runtime, bridge, "nativeFormat", "listFormat", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        return callList(rt, args, count, formatjs_list_format);
      });
  hermes_bridge::bind(runtime, bridge, "nativeParts", "listParts", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        return callList(rt, args, count, formatjs_list_parts);
      });
  extensions.getPropertyAsFunction(runtime, "IntlListFormat").call(runtime, bridge);
}

void installListFormat(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:ListFormat", "IntlListFormat");
  installListFormat(runtime, extensions);
}
} // namespace formatjs
