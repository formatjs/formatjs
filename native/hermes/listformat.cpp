#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/intl/listformat.h>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "listformat.inc"
    ;
using Model = hermes_bridge::Record<FormatjsListHandle, formatjs_list_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsListBytes, formatjs_list_bytes_free>;
using Registry = std::unique_ptr<FormatjsListRegistry, decltype(&formatjs_list_registry_destroy)>;
constexpr hermes_bridge::Policy results{2, "Rust ListFormat bridge failed"};
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
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "listQuery", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected list record and query JSON");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected list record and query JSON", "Invalid list record");
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        auto code = formatjs_list_query(model->handle.get(), hermes_bridge::bytesOf(data), data.size(), &bytes.value);
        return hermes_bridge::result(rt, code, bytes, results.accepted, results.failure);
      });
  extensions.getPropertyAsFunction(runtime, "IntlListFormat").call(runtime, bridge);
}

void installListFormat(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:ListFormat", "IntlListFormat");
  installListFormat(runtime, extensions);
}
} // namespace formatjs
