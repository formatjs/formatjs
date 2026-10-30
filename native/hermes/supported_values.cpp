#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/supported_values.h>
#include <formatjs/intl/supported_values.h>

#include <algorithm>
#include <memory>
#include <new>
#include <string>
#include <string_view>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {

constexpr char wrapperSource[] =
#include "supported_values_of.inc"
    ;

using ValuesResult = hermes_bridge::Buffer<FormatjsValuesResult, formatjs_values_free>;

struct ProbeContext {
  jsi::Runtime &runtime;
  jsi::Object intl;
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
    std::string language(reinterpret_cast<const char *>(locale.data), locale.len);
    const char *constructor = nullptr;
    const char *property = nullptr;
    bool format = false;
    jsi::Object options(rt);
    switch (key) {
    case FORMATJS_CALENDAR:
      constructor = "DateTimeFormat";
      property = "calendar";
      language += "-u-ca-" + identifier;
      break;
    case FORMATJS_COLLATION:
      constructor = "Collator";
      property = "collation";
      language += "-u-co-" + identifier;
      break;
    case FORMATJS_CURRENCY:
      constructor = "NumberFormat";
      format = true;
      options.setProperty(rt, "style", jsi::String::createFromAscii(rt, "currency"));
      options.setProperty(rt, "currencyDisplay", jsi::String::createFromAscii(rt, "name"));
      options.setProperty(rt, "currency", jsi::String::createFromUtf8(rt, identifier));
      break;
    case FORMATJS_NUMBERING_SYSTEM:
      constructor = "NumberFormat";
      property = "numberingSystem";
      format = true;
      language += "-u-nu-" + identifier;
      break;
    case FORMATJS_TIME_ZONE:
      constructor = "DateTimeFormat";
      property = "timeZone";
      options.setProperty(rt, "timeZone", jsi::String::createFromUtf8(rt, identifier));
      break;
    case FORMATJS_UNIT:
      constructor = "NumberFormat";
      property = "unit";
      options.setProperty(rt, "style", jsi::String::createFromAscii(rt, "unit"));
      options.setProperty(rt, "unit", jsi::String::createFromUtf8(rt, identifier));
      break;
    default:
      return 2;
    }
    auto formatter = context.intl.getPropertyAsFunction(rt, constructor)
                         .callAsConstructor(rt,
                                            jsi::String::createFromUtf8(rt, language),
                                            options)
                         .asObject(rt);
    if (property) {
      auto resolved = formatter.getPropertyAsFunction(rt, "resolvedOptions")
                          .callWithThis(rt, formatter)
                          .asObject(rt)
                          .getProperty(rt, property);
      if (resolved.isString()) {
        context.resolved = resolved.asString(rt).utf8(rt);
        out->resolved = borrow(context.resolved);
      }
    }
    // The TS predicate short-circuits accepted latn without formatting.
    if (format && !(key == FORMATJS_NUMBERING_SYSTEM && identifier == "latn" &&
                    context.resolved == "latn")) {
      auto formatted = formatter.getPropertyAsFunction(rt, "format")
                           .callWithThis(rt, formatter, 123);
      if (formatted.isString()) {
        context.formatted = formatted.asString(rt).utf8(rt);
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
      runtime, jsi::PropNameID::forAscii(runtime, "supportedValuesRust"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
         size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) {
          throw jsi::JSError(rt, "Expected a supportedValuesOf key string");
        }
        auto key = args[0].asString(rt).utf8(rt);
        ProbeContext context{rt, rt.global().getPropertyAsObject(rt, "Intl"), {}, {}};
        ValuesResult output;
        auto status = formatjs_supported_values_of(
            reinterpret_cast<const uint8_t *>(key.data()), key.size(), probe,
            &context, &output.value);
        if (status == 1) return jsi::Value::null();
        if (status != 0) throw jsi::JSError(rt, "Rust supported value enumeration failed");
        // Intl.supportedValuesOf step 9, CreateArrayFromList: always create a
        // fresh intrinsic array, copying strings before releasing Rust's buffer.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L123
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
