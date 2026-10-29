#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_segmenter.h>
#include <formatjs/intl/segmenter.h>
#include <cmath>
#include <limits>
#include <memory>
#include <string>
#include <utility>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "segmenter.inc"
    ;
using hermes_bridge::Record;
using Model = hermes_bridge::Record<FormatjsSegmenterHandle, formatjs_segmenter_destroy>;
using Segments = hermes_bridge::Record<FormatjsSegmentsHandle, formatjs_segments_destroy>;
using Cursor = hermes_bridge::Record<FormatjsSegmentCursorHandle, formatjs_segment_cursor_destroy>;
using Bytes = hermes_bridge::Buffer<FormatjsSegmenterBytes, formatjs_segmenter_bytes_free>;
using hermes_bridge::bytesOf;
jsi::Value span(jsi::Runtime &rt, int32_t status, const SegmenterSpan &value) {
  if (status == 1) return jsi::Value::undefined();
  if (status != 0) throw jsi::JSError(rt, "Rust Segmenter bridge failed");
  jsi::Array result(rt, 3);
  result.setValueAtIndex(rt, 0, static_cast<double>(value.start));
  result.setValueAtIndex(rt, 1, static_cast<double>(value.end));
  result.setValueAtIndex(rt, 2, value.word_like);
  return result;
}
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust Segmenter bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
template <typename T>
std::shared_ptr<T> record(jsi::Runtime &rt, const jsi::Value &value) {
  return hermes_bridge::record<T>(rt, value, "Expected Segmenter record", "Invalid Segmenter record");
}
std::string text(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isString()) throw jsi::JSError(rt, "Expected Segmenter JSON string");
  return value.asString(rt).utf8(rt);
}
template <typename T, typename P>
jsi::Value owned(jsi::Runtime &rt, int32_t status, P *raw) {
  // Take ownership before constructing a JS object, including allocation failure.
  typename T::Pointer guard(raw, T::destroy);
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust Segmenter allocation failed");
  return jsi::Object::createFromHostObject(rt, std::make_shared<T>(std::move(guard)));
}
} // namespace

void installSegmenter(jsi::Runtime &runtime, jsi::Object &extensions) {
  jsi::Object bridge(runtime);
  hermes_bridge::bind(runtime, bridge, "nativeMatch", "segmenterMatch", 1, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 1) throw jsi::JSError(rt, "Expected Segmenter locale query");
    auto data = text(rt, args[0]);
    Bytes bytes;
    return result(rt, formatjs_segmenter_match(bytesOf(data), data.size(), &bytes.value), bytes);
  });
  hermes_bridge::bind(runtime, bridge, "nativeCreate", "segmenterCreate", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2) throw jsi::JSError(rt, "Expected Segmenter locale/options");
    auto locale = text(rt, args[0]), options = text(rt, args[1]);
    FormatjsSegmenterHandle *raw = nullptr;
    auto status = formatjs_segmenter_create(bytesOf(locale), locale.size(), bytesOf(options), options.size(), &raw);
    return owned<Model>(rt, status, raw);
  });
  hermes_bridge::bind(runtime, bridge, "nativeResolved", "segmenterResolved", 1, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 1) throw jsi::JSError(rt, "Expected Segmenter model");
    auto model = record<Model>(rt, args[0]);
    Bytes bytes;
    return result(rt, formatjs_segmenter_resolved(model->handle.get(), &bytes.value), bytes);
  });
  hermes_bridge::bind(runtime, bridge, "nativeSegment", "segmenterSegment", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[1].isString()) throw jsi::JSError(rt, "Expected Segmenter model/string");
    auto model = record<Model>(rt, args[0]);
    auto data = args[1].asString(rt).utf16(rt);
    FormatjsSegmentsHandle *raw = nullptr;
    auto status = formatjs_segmenter_segment_units(model->handle.get(), reinterpret_cast<const uint16_t *>(data.data()), data.size(), &raw);
    return owned<Segments>(rt, status, raw);
  });
  hermes_bridge::bind(runtime, bridge, "nativeContaining", "segmenterContaining", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[1].isNumber()) throw jsi::JSError(rt, "Expected Segments/index");
    auto segments = record<Segments>(rt, args[0]);
    double index = args[1].asNumber();
    // Check before casting: no NaN, infinity, fractions or size_t overflow.
    if (!std::isfinite(index) || index < 0 || std::trunc(index) != index ||
        index >= static_cast<double>(std::numeric_limits<size_t>::max()))
      throw jsi::JSError(rt, "Invalid UTF-16 index");
    SegmenterSpan value{};
    return span(rt, formatjs_segments_containing_span(segments->handle.get(), static_cast<size_t>(index), &value), value);
  });
  hermes_bridge::bind(runtime, bridge, "nativeCursor", "segmenterCursor", 1, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 1) throw jsi::JSError(rt, "Expected Segments");
    auto segments = record<Segments>(rt, args[0]);
    FormatjsSegmentCursorHandle *raw = nullptr;
    auto status = formatjs_segments_cursor(segments->handle.get(), &raw);
    return owned<Cursor>(rt, status, raw);
  });
  hermes_bridge::bind(runtime, bridge, "nativeNext", "segmenterNext", 1, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 1) throw jsi::JSError(rt, "Expected Segmenter cursor");
    auto cursor = record<Cursor>(rt, args[0]);
    SegmenterSpan value{};
    return span(rt, formatjs_segment_cursor_next_span(cursor->handle.get(), &value), value);
  });
  extensions.getPropertyAsFunction(runtime, "IntlSegmenter").call(runtime, bridge);
}
void installSegmenter(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:Segmenter", "IntlSegmenter");
  installSegmenter(runtime, extensions);
}
} // namespace formatjs
