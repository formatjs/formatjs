#include <formatjs/hermes/temporal.h>
#include <formatjs/hermes/bridge.h>
#include <formatjs/intl/temporal.h>

#include <chrono>
#include <memory>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr jsi::UUID installationId{
    0x597051cc, 0x3fe4, 0x4913, 0xb852, 0xad71dfefbb8a};
constexpr char source[] = "(function(){"
#include "temporal.inc"
    "\nreturn FormatJSTemporalInstaller;})()";
using Bytes = hermes_bridge::Buffer<FormatjsTemporalBytes, formatjs_temporal_bytes_free>;
std::string wallClock() {
  const auto milliseconds = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
  return std::to_string(milliseconds) + "000000";
}
} // namespace

void installTemporal(jsi::Runtime &runtime, TemporalHost host) {
  if (runtime.getRuntimeData(installationId)) return;
  if (!host.timeZoneId) throw jsi::JSError(runtime, "Temporal requires a system timezone provider");
  if (!host.epochNanoseconds) host.epochNanoseconds = wallClock;
  auto provider = std::make_shared<TemporalHost>(std::move(host));
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime, "query",
      hermes_bridge::json<1, Bytes>(runtime, "temporalQuery",
          "Expected Temporal JSON", {2, "Rust Temporal bridge failed"},
          formatjs_temporal_query));
  hermes_bridge::bind(runtime, bridge, "epochNanoseconds", "temporalClock", 0,
      [provider](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        return jsi::String::createFromUtf8(rt, provider->epochNanoseconds());
      });
  hermes_bridge::bind(runtime, bridge, "timeZoneId", "temporalTimeZone", 0,
      [provider](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
        return jsi::String::createFromUtf8(rt, provider->timeZoneId());
      });
  auto installer = runtime.evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(source), "formatjs:temporal").asObject(runtime);
  installer.getPropertyAsFunction(runtime, "install").call(runtime, bridge);
  runtime.setRuntimeData(installationId, std::move(provider));
}

} // namespace formatjs
