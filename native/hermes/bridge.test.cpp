#include <formatjs/hermes/bridge.h>
#include <hermes/hermes.h>
#include <stdexcept>

namespace {
void check(bool value) { if (!value) throw std::runtime_error("bridge assertion failed"); }
struct Bytes { uint8_t *data; size_t len; };
int releases = 0;
void release(Bytes bytes) { if (bytes.data) { ++releases; delete[] bytes.data; } }
using Buffer = formatjs::hermes_bridge::Buffer<Bytes, release>;
int32_t echo(const uint8_t *data, size_t len, Bytes *out) {
  auto copy = new uint8_t[len];
  std::copy(data, data + len, copy);
  *out = {copy, len};
  return 0;
}
int32_t rejected(const uint8_t *, size_t, Bytes *out) {
  *out = {new uint8_t[1], 1};
  return 2;
}
struct Model {};
void destroy(Model *value) { delete value; }
void otherDestroy(Model *value) { delete value; }
using Record = formatjs::hermes_bridge::Record<Model, destroy>;
using OtherRecord = formatjs::hermes_bridge::Record<Model, otherDestroy>;
}

int main() {
  namespace bridge = formatjs::hermes_bridge;
  namespace jsi = facebook::jsi;
  auto runtime = facebook::hermes::makeHermesRuntime();
  auto echoFunction = bridge::json<1, Buffer>(*runtime, "echo", "Expected text", {0, "Native failure"}, echo);
  auto input = jsi::String::createFromUtf8(*runtime, "a\xc3\xa9");
  auto result = echoFunction.call(*runtime, input);
  check(result.asString(*runtime).utf8(*runtime) == "a\xc3\xa9");
  check(releases == 1);
  auto failed = bridge::json<1, Buffer>(*runtime, "rejected", "Expected text", {0, "Native failure"}, rejected);
  bool threw = false;
  try { failed.call(*runtime, input); } catch (const jsi::JSError &) { threw = true; }
  check(threw && releases == 2);
  auto foreign = jsi::Object::createFromHostObject(*runtime,
      std::make_shared<OtherRecord>(OtherRecord::Pointer(new Model, otherDestroy)));
  jsi::Value foreignValue(std::move(foreign));
  threw = false;
  try { bridge::record<Record>(*runtime, foreignValue, "Expected record", "Wrong record"); }
  catch (const jsi::JSError &) { threw = true; }
  check(threw);
}
