#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/intl/pluralrules.h>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "pluralrules.inc"
    ;
using Model = hermes_bridge::Record<FormatjsPluralHandle, formatjs_plural_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsPluralBytes, formatjs_plural_bytes_free>;
using Registry = std::unique_ptr<FormatjsPluralRegistry, decltype(&formatjs_plural_registry_destroy)>;
constexpr hermes_bridge::Policy results{18, "Rust PluralRules bridge failed"};
} // namespace

void installPluralRules(jsi::Runtime &runtime, jsi::Object &extensions) {
  FormatjsPluralRegistry *raw = nullptr;
  if (formatjs_plural_registry_create(&raw) != 0) throw jsi::JSError(runtime, "Cannot create plural locale registry");
  auto registry = std::make_shared<Registry>(raw, formatjs_plural_registry_destroy);
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeLoad", hermes_bridge::load(runtime, "pluralLoad",
      "Expected plural locale JSON", "Rust plural locale load failed", formatjs_plural_registry_load, registry));
  bridge.setProperty(runtime, "nativeInfo", hermes_bridge::json<0, Bytes>(runtime, "pluralInfo",
      nullptr, results, formatjs_plural_registry_info, registry));
  bridge.setProperty(runtime, "nativeMatch", hermes_bridge::json<1, Bytes>(runtime, "pluralMatch",
      "Expected plural locale match JSON", results, formatjs_plural_registry_match, registry));
  bridge.setProperty(runtime, "nativeCreate", hermes_bridge::create<2, Model>(runtime, "pluralCreate",
      "Expected plural locale and options JSON", {18, "Rust plural construction failed"}, formatjs_plural_create, registry));
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "pluralQuery", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected plural record and query JSON");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected plural record and query JSON", "Invalid plural record");
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        auto code = formatjs_plural_query(model->handle.get(), hermes_bridge::bytesOf(data), data.size(), &bytes.value);
        return hermes_bridge::result(rt, code, bytes, results.accepted, results.failure);
      });
  extensions.getPropertyAsFunction(runtime, "IntlPluralRules").call(runtime, bridge);
}

void installPluralRules(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:PluralRules", "IntlPluralRules");
  installPluralRules(runtime, extensions);
}
} // namespace formatjs
