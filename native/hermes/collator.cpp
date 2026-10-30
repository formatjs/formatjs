#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_collator.h>
#include <formatjs/intl/collator.h>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "collator.inc"
    ;
using Model = hermes_bridge::Record<FormatjsCollatorHandle, formatjs_collator_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsCollatorBytes, formatjs_collator_bytes_free>;
constexpr hermes_bridge::Policy results{2, "Rust Collator bridge failed"};
}
void installCollator(jsi::Runtime &runtime, jsi::Object &extensions) {
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "nativeResolve", hermes_bridge::json<1, Bytes>(runtime, "collatorResolve",
      "Expected Collator JSON request", results, formatjs_collator_resolve));
  bridge.setProperty(runtime, "nativeSupported", hermes_bridge::json<1, Bytes>(runtime, "collatorSupported",
      "Expected Collator JSON request", results, formatjs_collator_supported));
  bridge.setProperty(runtime, "nativeCreate", hermes_bridge::create<1, Model>(runtime, "collatorCreate",
      "Expected Collator options JSON", {2, "Rust Collator construction failed"}, formatjs_collator_create));
  hermes_bridge::bind(runtime, bridge, "nativeQuery", "collatorQuery", 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt, "Expected Collator record/query");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected Collator record/query", "Invalid Collator record");
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        auto code = formatjs_collator_query(model->handle.get(), hermes_bridge::bytesOf(data), data.size(), &bytes.value);
        return hermes_bridge::result(rt, code, bytes, results.accepted, results.failure);
      });
  hermes_bridge::bind(runtime, bridge, "nativeCompare", "collatorCompare", 3,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3 || !args[0].isObject() || !args[1].isString() || !args[2].isString())
          throw jsi::JSError(rt, "Expected Collator record and strings");
        auto model = hermes_bridge::record<Model>(rt, args[0], "Expected Collator record", "Invalid Collator record");
        auto left = args[1].asString(rt).utf16(rt);
        auto right = args[2].asString(rt).utf16(rt);
        int8_t order = 0;
        auto code = formatjs_collator_compare(model->handle.get(),
            reinterpret_cast<const uint16_t *>(left.data()), left.size(),
            reinterpret_cast<const uint16_t *>(right.data()), right.size(), &order);
        if (code != 0) return hermes_bridge::status(rt, code, 0, results.failure);
        return jsi::Value(static_cast<double>(order));
      });
  extensions.getPropertyAsFunction(runtime, "IntlCollator").call(runtime, bridge);
}
void installCollator(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:Collator", "IntlCollator");
  installCollator(runtime, extensions);
}
} // namespace formatjs
