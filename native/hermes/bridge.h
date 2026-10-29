#pragma once

#include <jsi/jsi.h>
#include <array>
#include <tuple>
#include <cstdint>
#include <cstring>
#include <memory>
#include <string>
#include <utility>

namespace formatjs::hermes_bridge {
namespace jsi = facebook::jsi;

template <typename T, void (*Release)(T)>
struct Buffer {
  T value{nullptr, 0};
  Buffer() = default;
  Buffer(const Buffer &) = delete;
  Buffer &operator=(const Buffer &) = delete;
  ~Buffer() { Release(value); }
};

template <typename T, void (*Destroy)(T *)>
struct Record final : jsi::HostObject {
  using Pointer = std::unique_ptr<T, decltype(Destroy)>;
  static constexpr auto destroy = Destroy;
  explicit Record(Pointer value) : handle(std::move(value)) {}
  Pointer handle;
};

template <typename T>
std::shared_ptr<T> record(jsi::Runtime &runtime, const jsi::Value &value,
                          const char *expected, const char *invalid) {
  if (!value.isObject()) throw jsi::JSError(runtime, expected);
  auto object = value.asObject(runtime);
  if (!object.isHostObject<T>(runtime)) throw jsi::JSError(runtime, invalid);
  return object.getHostObject<T>(runtime);
}

inline const uint8_t *bytesOf(const std::string &value) {
  return reinterpret_cast<const uint8_t *>(value.data());
}

inline jsi::Value status(jsi::Runtime &runtime, int32_t code,
                          uint32_t accepted, const char *failure) {
  if (code >= 0 && code < 32 && (accepted & (uint32_t{1} << code)))
    return jsi::Value(code);
  throw jsi::JSError(runtime, failure);
}

template <typename Bytes>
jsi::Value result(jsi::Runtime &runtime, int32_t code, const Bytes &bytes,
                   uint32_t accepted, const char *failure) {
  if (code != 0) return status(runtime, code, accepted, failure);
  return jsi::String::createFromUtf8(runtime, bytes.value.data, bytes.value.len);
}

template <typename Callback>
void bind(jsi::Runtime &runtime, jsi::Object &object, const char *property,
          const char *name, unsigned int arity, Callback callback) {
  object.setProperty(runtime, property, jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, name, std::strlen(name)),
      arity, std::move(callback)));
}

struct Policy {
  uint32_t accepted;
  const char *failure;
  bool nullRange = false;
};

template <size_t Arity>
std::array<std::string, Arity> strings(jsi::Runtime &runtime,
    const jsi::Value *args, size_t count, const char *failure) {
  if constexpr (Arity != 0)
    if (count != Arity) throw jsi::JSError(runtime, failure);
  for (size_t i = 0; i < Arity; ++i)
    if (!args[i].isString()) throw jsi::JSError(runtime, failure);
  std::array<std::string, Arity> input;
  for (size_t i = 0; i < Arity; ++i) input[i] = args[i].asString(runtime).utf8(runtime);
  return input;
}

template <typename Function, typename Prefix, typename Suffix,
          size_t Arity, size_t... Index>
auto invoke(Function call, Prefix prefix, Suffix suffix,
            const std::array<std::string, Arity> &input,
            std::index_sequence<Index...>) {
  return std::apply(call, std::tuple_cat(prefix,
      std::make_tuple(bytesOf(input[Index]), input[Index].size())..., suffix));
}

template <typename... Owners>
auto pointers(const std::tuple<Owners...> &owners) {
  return std::apply([](const auto &...owner) {
    return std::make_tuple(owner->get()...);
  }, owners);
}

template <size_t Arity, typename Bytes, typename Function, typename... Owners>
jsi::Function json(jsi::Runtime &runtime, const char *name, const char *expected,
                   Policy policy, Function call, Owners... owners) {
  return jsi::Function::createFromHostFunction(runtime,
      jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), Arity,
      [expected, policy, call, owners = std::make_tuple(std::move(owners)...)]
      (jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        auto input = strings<Arity>(rt, args, count, expected);
        Bytes bytes;
        auto code = invoke(call, pointers(owners), std::make_tuple(&bytes.value),
                           input, std::make_index_sequence<Arity>{});
        if (code == 1 && policy.nullRange) return jsi::Value::null();
        return result(rt, code, bytes, policy.accepted, policy.failure);
      });
}

template <typename Function, typename Owner>
jsi::Function load(jsi::Runtime &runtime, const char *name, const char *expected,
                   const char *failure, Function call, Owner owner) {
  return jsi::Function::createFromHostFunction(runtime,
      jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), 1,
      [expected, failure, call, owner = std::move(owner)]
      (jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        auto input = strings<1>(rt, args, count, expected);
        auto code = call(owner->get(), bytesOf(input[0]), input[0].size());
        if (code > 1) throw jsi::JSError(rt, failure);
        return jsi::Value(code);
      });
}

template <size_t Arity, typename Model, typename Function, typename... Owners>
jsi::Function create(jsi::Runtime &runtime, const char *name, const char *expected,
                     Policy policy, Function call, Owners... owners) {
  return jsi::Function::createFromHostFunction(runtime,
      jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), Arity,
      [expected, policy, call, owners = std::make_tuple(std::move(owners)...)]
      (jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
        auto input = strings<Arity>(rt, args, count, expected);
        typename Model::Pointer::element_type *raw = nullptr;
        auto code = invoke(call, pointers(owners), std::make_tuple(&raw),
                           input, std::make_index_sequence<Arity>{});
        typename Model::Pointer guard(raw, Model::destroy);
        if (code == 1 && policy.nullRange) return jsi::Value::null();
        if (code) return status(rt, code, policy.accepted, policy.failure);
        return jsi::Object::createFromHostObject(rt, std::make_shared<Model>(std::move(guard)));
      });
}

inline jsi::Object factory(jsi::Runtime &runtime, const char *source,
                           const char *url, const char *name) {
  auto function = runtime.evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(source), url);
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, name, std::move(function));
  return extensions;
}
} // namespace formatjs::hermes_bridge
