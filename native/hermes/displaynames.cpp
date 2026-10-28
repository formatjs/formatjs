#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/intl/displaynames.h>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "displaynames.inc"
    ;
using Model = hermes_bridge::Record<FormatjsDisplayHandle, formatjs_display_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsDisplayBytes, formatjs_display_bytes_free>;
using Registry = std::unique_ptr<FormatjsDisplayRegistry, decltype(&formatjs_display_registry_destroy)>;
constexpr hermes_bridge::Policy results{18, "Rust DisplayNames bridge failed"};
} // namespace

void installDisplayNames(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsDisplayRegistry *raw = nullptr;
  if (formatjs_display_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create display locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_display_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", hermes_bridge::load(runtime, "displayLoad",
      "Expected display locale JSON", "Rust display locale load failed", formatjs_display_registry_load, registry));
  bridge.setProperty(runtime, "nativeInfo", hermes_bridge::json<0, Bytes>(runtime, "displayInfo",
      nullptr, results, formatjs_display_registry_info, registry));
  bridge.setProperty(runtime, "nativeMatch", hermes_bridge::json<1, Bytes>(runtime, "displayMatch",
      "Expected display locale match JSON", results, formatjs_display_registry_match, registry));
  bridge.setProperty(runtime, "nativeCreate", hermes_bridge::create<2, Model>(runtime, "displayCreate",
      "Expected display locale and options JSON", {18, "Rust display construction failed"}, formatjs_display_create, registry));
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "displayQuery", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected display record and query JSON");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected display record and query JSON", "Invalid display record");
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        auto code = formatjs_display_query(model->handle.get(), hermes_bridge::bytesOf(data), data.size(), &bytes.value);
        return hermes_bridge::result(rt, code, bytes, results.accepted, results.failure);
      });
  extensions.getPropertyAsFunction(runtime, "IntlDisplayNames").call(runtime, bridge);
}

void installDisplayNames(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:DisplayNames", "IntlDisplayNames");
  installDisplayNames(runtime, extensions);
}
} // namespace formatjs
