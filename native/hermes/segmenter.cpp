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
template <typename T, void (*Destroy)(T *)>
struct Owned final : jsi::HostObject {
  using Pointer = std::unique_ptr<T, decltype(Destroy)>;
  static constexpr auto destroy = Destroy;
  explicit Owned(Pointer value) : handle(std::move(value)) {}
  Pointer handle;
};
using Model = Owned<FormatjsSegmenterHandle, formatjs_segmenter_destroy>;
using Segments = Owned<FormatjsSegmentsHandle, formatjs_segments_destroy>;
using Cursor = Owned<FormatjsSegmentCursorHandle, formatjs_segment_cursor_destroy>;
struct Bytes {
  FormatjsSegmenterBytes value{nullptr, 0};
  ~Bytes() { formatjs_segmenter_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) {
  return reinterpret_cast<const uint8_t *>(value.data());
}
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust Segmenter bridge failed");
  return jsi::String::createFromUtf8(rt, bytes.value.data, bytes.value.len);
}
template <typename T>
std::shared_ptr<T> record(jsi::Runtime &rt, const jsi::Value &value) {
  if (!value.isObject()) throw jsi::JSError(rt, "Expected Segmenter record");
  auto object = value.asObject(rt);
  if (!object.isHostObject<T>(rt)) throw jsi::JSError(rt, "Invalid Segmenter record");
  return object.getHostObject<T>(rt);
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
  bridge.setProperty(runtime, "nativeMatch", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterMatch"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected Segmenter locale query");
        auto data = text(rt, args[0]);
        Bytes bytes;
        return result(rt, formatjs_segmenter_match(bytesOf(data), data.size(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeCreate", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterCreate"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) throw jsi::JSError(rt, "Expected Segmenter locale/options");
        auto locale = text(rt, args[0]), options = text(rt, args[1]);
        FormatjsSegmenterHandle *raw = nullptr;
        auto status = formatjs_segmenter_create(bytesOf(locale), locale.size(), bytesOf(options), options.size(), &raw);
        return owned<Model>(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeResolved", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterResolved"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected Segmenter model");
        auto model = record<Model>(rt, args[0]);
        Bytes bytes;
        return result(rt, formatjs_segmenter_resolved(model->handle.get(), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeSegment", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterSegment"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) throw jsi::JSError(rt, "Expected Segmenter model/UTF-16 units");
        auto model = record<Model>(rt, args[0]);
        auto data = text(rt, args[1]);
        FormatjsSegmentsHandle *raw = nullptr;
        auto status = formatjs_segmenter_segment(model->handle.get(), bytesOf(data), data.size(), &raw);
        return owned<Segments>(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeContaining", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterContaining"), 2,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2 || !args[1].isNumber()) throw jsi::JSError(rt, "Expected Segments/index");
        auto segments = record<Segments>(rt, args[0]);
        double index = args[1].asNumber();
        // Check before casting: no NaN, infinity, fractions or size_t overflow.
        if (!std::isfinite(index) || index < 0 || std::trunc(index) != index ||
            index >= static_cast<double>(std::numeric_limits<size_t>::max()))
          throw jsi::JSError(rt, "Invalid UTF-16 index");
        Bytes bytes;
        return result(rt, formatjs_segments_containing(segments->handle.get(), static_cast<size_t>(index), &bytes.value), bytes);
      }));
  bridge.setProperty(runtime, "nativeCursor", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterCursor"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected Segments");
        auto segments = record<Segments>(rt, args[0]);
        FormatjsSegmentCursorHandle *raw = nullptr;
        auto status = formatjs_segments_cursor(segments->handle.get(), &raw);
        return owned<Cursor>(rt, status, raw);
      }));
  bridge.setProperty(runtime, "nativeNext", jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "segmenterNext"), 1,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) throw jsi::JSError(rt, "Expected Segmenter cursor");
        auto cursor = record<Cursor>(rt, args[0]);
        Bytes bytes;
        return result(rt, formatjs_segment_cursor_next(cursor->handle.get(), &bytes.value), bytes);
      }));
  extensions.getPropertyAsFunction(runtime, "IntlSegmenter").call(runtime, bridge);
}
void installSegmenter(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:Segmenter").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlSegmenter", std::move(factory));
  installSegmenter(runtime, extensions);
}
} // namespace formatjs
