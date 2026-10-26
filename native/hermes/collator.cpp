#include <formatjs/hermes/intl_collator.h>
#include <formatjs/intl/collator.h>
#include <cstring>
#include <memory>
#include <string>
#include <utility>
namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "collator.inc"
    ;
using Handle = std::unique_ptr<FormatjsCollatorHandle, decltype(&formatjs_collator_destroy)>;
struct CollatorRecord final : jsi::HostObject {
  explicit CollatorRecord(Handle value) : handle(std::move(value)) {}
  Handle handle;
};
struct Bytes {
  FormatjsCollatorBytes value{nullptr,0};
  ~Bytes() { formatjs_collator_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) { return reinterpret_cast<const uint8_t *>(value.data()); }
jsi::Value result(jsi::Runtime &rt, int32_t status, const Bytes &bytes) {
  if (status == 1) return jsi::Value(status);
  if (status != 0) throw jsi::JSError(rt, "Rust Collator bridge failed");
  return jsi::String::createFromUtf8(rt,bytes.value.data,bytes.value.len);
}
using JsonCall = int32_t (*)(const uint8_t *, size_t, FormatjsCollatorBytes *);
jsi::Function jsonFunction(jsi::Runtime &runtime, const char *name, JsonCall call) {
  return jsi::Function::createFromHostFunction(runtime,jsi::PropNameID::forAscii(runtime,name,std::strlen(name)),1,
      [call](jsi::Runtime &rt,const jsi::Value &,const jsi::Value *args,size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt,"Expected Collator JSON request");
        auto data = args[0].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt,call(bytesOf(data),data.size(),&bytes.value),bytes);
      });
}
} // namespace
void installCollator(jsi::Runtime &runtime,jsi::Object &extensions) {
  jsi::Object bridge(runtime);
  bridge.setProperty(runtime,"nativeResolve",jsonFunction(runtime,"collatorResolve",formatjs_collator_resolve));
  bridge.setProperty(runtime,"nativeSupported",jsonFunction(runtime,"collatorSupported",formatjs_collator_supported));
  bridge.setProperty(runtime,"nativeCreate",jsi::Function::createFromHostFunction(
      runtime,jsi::PropNameID::forAscii(runtime,"collatorCreate"),1,
      [](jsi::Runtime &rt,const jsi::Value &,const jsi::Value *args,size_t count) -> jsi::Value {
        if (count != 1 || !args[0].isString()) throw jsi::JSError(rt,"Expected Collator options JSON");
        auto data = args[0].asString(rt).utf8(rt);
        FormatjsCollatorHandle *raw = nullptr;
        auto status = formatjs_collator_create(bytesOf(data),data.size(),&raw);
        Handle handle(raw,formatjs_collator_destroy);
        if (status == 1) return jsi::Value(status);
        if (status != 0) throw jsi::JSError(rt,"Rust Collator construction failed");
        return jsi::Object::createFromHostObject(rt,std::make_shared<CollatorRecord>(std::move(handle)));
      }));
  bridge.setProperty(runtime,"nativeQuery",jsi::Function::createFromHostFunction(
      runtime,jsi::PropNameID::forAscii(runtime,"collatorQuery"),2,
      [](jsi::Runtime &rt,const jsi::Value &,const jsi::Value *args,size_t count) -> jsi::Value {
        if (count != 2 || !args[0].isObject() || !args[1].isString()) throw jsi::JSError(rt,"Expected Collator record/query");
        auto object = args[0].asObject(rt);
        if (!object.isHostObject<CollatorRecord>(rt)) throw jsi::JSError(rt,"Invalid Collator record");
        auto record = object.getHostObject<CollatorRecord>(rt);
        auto data = args[1].asString(rt).utf8(rt);
        Bytes bytes;
        return result(rt,formatjs_collator_query(record->handle.get(),bytesOf(data),data.size(),&bytes.value),bytes);
      }));
  extensions.getPropertyAsFunction(runtime,"IntlCollator").call(runtime,bridge);
}
void installCollator(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource),"formatjs:Collator").asObject(runtime).asFunction(runtime);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime,"IntlCollator",std::move(factory));
  installCollator(runtime,extensions);
}
} // namespace formatjs
