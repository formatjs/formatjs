#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/supported_values.h>
#include <formatjs/intl/supported_values.h>

#include <algorithm>
#include <memory>
#include <new>
#include <optional>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {

constexpr char wrapperSource[] =
#include "supported_values_of.inc"
    ;

using ValuesResult = hermes_bridge::Buffer<FormatjsValuesResult, formatjs_values_free>;

struct ProbeContext {
  jsi::Runtime &runtime;
  jsi::Value constructor;
  jsi::Value resolvedOptions;
  jsi::Value formatProbe;
  jsi::Function makeOptions;
  std::optional<std::vector<std::string>> availableCalendars;
  std::string resolved;
  std::string formatted;
};

FormatjsBorrowedString borrow(const std::string &value) {
  return {reinterpret_cast<const uint8_t *>(value.data()), value.size()};
}

// Match the TS polyfill's formatter probes. Only genuine accepted values enter
// Rust's result; missing formatters or failed constructions mean unsupported.
// Buffers stay alive until the next callback, and Rust copies them immediately.
int32_t probe(void *opaque, uint32_t key, FormatjsBorrowedString value,
              FormatjsBorrowedString locale, FormatjsValueProbeResult *out) {
  auto &context = *static_cast<ProbeContext *>(opaque);
  auto &rt = context.runtime;
  try {
    context.resolved.clear();
    context.formatted.clear();
    std::string identifier(reinterpret_cast<const char *>(value.data), value.len);
    // ECMA-402 §6.9.1. A FormatJS provider supplies its loaded calendar data.
    // https://tc39.es/ecma402/#sec-availablecalendars
    if (key == FORMATJS_CALENDAR && context.availableCalendars) {
      const auto &calendars = *context.availableCalendars;
      if (std::find(calendars.begin(), calendars.end(), identifier) == calendars.end())
        return 1;
      context.resolved = std::move(identifier);
      out->resolved = borrow(context.resolved);
      return 0;
    }
    // ECMA-402 §6.5.2 checks zone data without constructing a formatter.
    // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
    if (key == FORMATJS_TIME_ZONE && context.formatProbe.isObject()) {
      auto supported = context.formatProbe.asObject(rt).asFunction(rt).call(
          rt, jsi::String::createFromUtf8(rt, identifier));
      return supported.isBool() && supported.getBool() ? 0 : 1;
    }
    std::string language(reinterpret_cast<const char *>(locale.data), locale.len);
    if (key == FORMATJS_NUMBERING_SYSTEM) {
      if (!context.formatProbe.isObject()) return 1;
      language += "-u-nu-" + identifier;
      auto supported = context.formatProbe.asObject(rt).asFunction(rt).call(
          rt, jsi::String::createFromUtf8(rt, language), jsi::String::createFromUtf8(rt, identifier));
      if (!supported.isBool() || !supported.getBool()) return 1;
      context.resolved = std::move(identifier);
      out->resolved = borrow(context.resolved);
      return 0;
    }
    if (!context.constructor.isObject()) return 1;
    const char *property = nullptr;
    bool probeCurrency = false;
    auto options = context.makeOptions.call(rt).asObject(rt);
    switch (key) {
    case FORMATJS_CALENDAR:
      property = "calendar";
      language += "-u-ca-" + identifier;
      break;
    case FORMATJS_COLLATION:
      property = "collation";
      language += "-u-co-" + identifier;
      break;
    case FORMATJS_CURRENCY:
      if (!context.formatProbe.isObject()) return 1;
      probeCurrency = true;
      options.setProperty(rt, "style", jsi::String::createFromAscii(rt, "currency"));
      options.setProperty(rt, "currencyDisplay", jsi::String::createFromAscii(rt, "name"));
      options.setProperty(rt, "currency", jsi::String::createFromUtf8(rt, identifier));
      break;
    case FORMATJS_TIME_ZONE:
      options.setProperty(rt, "timeZone", jsi::String::createFromUtf8(rt, identifier));
      break;
    default:
      return 2;
    }
    auto formatter = context.constructor.asObject(rt).asFunction(rt)
                         .callAsConstructor(rt,
                                            jsi::String::createFromUtf8(rt, language),
                                            options)
                         .asObject(rt);
    if (property) {
      auto resolved = context.resolvedOptions.asObject(rt).asFunction(rt)
                          .callWithThis(rt, formatter)
                          .asObject(rt)
                          .getProperty(rt, property);
      if (resolved.isString()) {
        context.resolved = resolved.asString(rt).utf8(rt);
        out->resolved = borrow(context.resolved);
      }
    }
    if (probeCurrency) {
      auto observed = context.formatProbe.asObject(rt).asFunction(rt)
                          .call(rt, formatter, jsi::String::createFromUtf8(rt, identifier),
                                jsi::String::createFromUtf8(rt, language));
      if (observed.isBool() && observed.getBool()) {
        context.resolved = std::move(identifier);
        out->resolved = borrow(context.resolved);
      } else if (observed.isString()) {
        context.formatted = observed.asString(rt).utf8(rt);
        out->formatted = borrow(context.formatted);
      }
    }
    return 0;
  } catch (const std::bad_alloc &) {
    return 2;
  } catch (...) {
    // Formatter failures are unsupported candidates, just as in TypeScript.
    // Never unwind a C++ or JS exception through a Rust C ABI frame.
    return 1;
  }
}

} // namespace

jsi::Function prepareSupportedValuesOf(jsi::Runtime &runtime, jsi::Object &extensions) {
  auto enumerate = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "supportedValuesRust"), 6,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
         size_t count) -> jsi::Value {
        if (count != 6 || !args[0].isString()) {
          throw jsi::JSError(rt, "Expected supportedValuesOf key and probe operations");
        }
        auto key = args[0].asString(rt).utf8(rt);
        // ECMA-402 §8.3.2 steps 2–6 probe through the retained provider.
        // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
        ProbeContext context{rt, jsi::Value(rt, args[1]), jsi::Value(rt, args[2]),
                             jsi::Value(rt, args[3]),
                             args[4].asObject(rt).asFunction(rt), {}, {}, {}};
        if (!args[5].isUndefined()) {
          auto source = args[5].asObject(rt).asArray(rt);
          auto &calendars = context.availableCalendars.emplace();
          size_t length = source.size(rt);
          calendars.reserve(length);
          for (size_t index = 0; index < length; ++index)
            calendars.push_back(source.getValueAtIndex(rt, index).asString(rt).utf8(rt));
        }
        ValuesResult output;
        auto status = formatjs_supported_values_of(
            reinterpret_cast<const uint8_t *>(key.data()), key.size(), probe,
            &context, &output.value);
        if (status == 1) return jsi::Value::null();
        if (status != 0) throw jsi::JSError(rt, "Rust supported value enumeration failed");
        // Intl.supportedValuesOf step 9, CreateArrayFromList: always create a
        // fresh intrinsic array, copying strings before releasing Rust's buffer.
        // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
        if (!output.value.len) return jsi::Array(rt, 0);
        std::string_view values(reinterpret_cast<const char *>(output.value.data),
                                output.value.len);
        size_t length = 1 + static_cast<size_t>(std::count(values.begin(), values.end(), '\n'));
        jsi::Array array(rt, length);
        size_t start = 0;
        for (size_t index = 0; index < length; ++index) {
          size_t end = values.find('\n', start);
          if (end == std::string_view::npos) end = values.size();
          array.setValueAtIndex(rt, index, jsi::String::createFromUtf8(
              rt, output.value.data + start, end - start));
          start = end + 1;
        }
        return array;
      });
  return extensions.getPropertyAsFunction(runtime, "IntlSupportedValuesOf")
      .call(runtime, enumerate).asObject(runtime).asFunction(runtime);
}

void installSupportedValuesOf(jsi::Runtime &runtime, jsi::Object &extensions) {
  prepareSupportedValuesOf(runtime, extensions);
}

void installSupportedValuesOf(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:supportedValuesOf", "IntlSupportedValuesOf");
  installSupportedValuesOf(runtime, extensions);
}

} // namespace formatjs
