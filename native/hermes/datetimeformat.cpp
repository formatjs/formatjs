#include <formatjs/hermes/bridge.h>
#include <formatjs/hermes/intl_datetimeformat.h>
#include <formatjs/intl/datetimeformat.h>
#include <formatjs/intl/datetimeformat_calendars.h>

#include <cstring>
#include <exception>
#include <stdexcept>
#include <string>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>

namespace formatjs {
namespace jsi = facebook::jsi;
namespace {
constexpr char wrapperSource[] =
#include "datetimeformat.inc"
    ;
using Construction = std::unique_ptr<FormatjsDateTimeConstruction, decltype(&formatjs_datetime_construction_destroy)>;
using Formatter = std::unique_ptr<FormatjsDateTimeHandle, decltype(&formatjs_datetime_destroy)>;
using Registry = std::unique_ptr<FormatjsDateTimeRegistry, decltype(&formatjs_datetime_registry_destroy)>;
using Records = std::unique_ptr<FormatjsDateTimeRecords, decltype(&formatjs_datetime_records_destroy)>;
using Ticket = std::unique_ptr<FormatjsDateTimeTicket, decltype(&formatjs_datetime_ticket_destroy)>;
struct Record final : jsi::HostObject {
  explicit Record(Ticket value) : ticket(std::move(value)) {}
  Ticket ticket;
};
using Bytes = hermes_bridge::Buffer<FormatjsDateTimeBytes, formatjs_datetime_bytes_free>;
using hermes_bridge::bytesOf;
std::string stringArgument(jsi::Runtime &rt, const jsi::Value *args, size_t count, size_t index) {
  if (index >= count || !args[index].isString()) throw jsi::JSError(rt, "Expected DateTimeFormat string argument");
  return args[index].asString(rt).utf8(rt);
}
} // namespace

struct DateTimeFormatInstallation::State {
  explicit State(jsi::Runtime &rt) : runtime(rt), owner(std::this_thread::get_id()), registry(nullptr, formatjs_datetime_registry_destroy), records(nullptr, formatjs_datetime_records_destroy) {
    FormatjsDateTimeRegistry *raw = nullptr;
    if (formatjs_datetime_registry_create(&raw) != 0) throw std::runtime_error("Cannot create DateTimeFormat registry");
    registry.reset(raw);
    FormatjsDateTimeRecords *handles = nullptr;
    if (formatjs_datetime_records_create(&handles) != 0) throw std::runtime_error("Cannot create DateTimeFormat records");
    records.reset(handles);
  }
  ~State() {
    requireOwner();
    records.reset();
    registry.reset();
  }
  void requireOwner() const {
    if (std::this_thread::get_id() != owner) std::terminate();
  }
  void drain() {
    requireOwner();
    if (formatjs_datetime_records_drain(records.get())) throw jsi::JSError(runtime, "Cannot drain DateTimeFormat records");
  }
  template <typename T> jsi::Object retain(T value) {
    FormatjsDateTimeTicket *raw = nullptr;
    int32_t code;
    if constexpr (std::is_same_v<T, Construction>)
      code = formatjs_datetime_records_construction(records.get(), value.release(), &raw);
    else
      code = formatjs_datetime_records_formatter(records.get(), value.release(), &raw);
    Ticket ticket(raw, formatjs_datetime_ticket_destroy);
    if (code) throw jsi::JSError(runtime, "Cannot retain DateTimeFormat record");
    return jsi::Object::createFromHostObject(runtime, std::make_shared<Record>(std::move(ticket)));
  }
  std::shared_ptr<Record> record(const jsi::Value &value) {
    return hermes_bridge::record<Record>(runtime, value, "Expected DateTimeFormat record", "Invalid DateTimeFormat record");
  }
  template <typename T> typename T::element_type *get(const jsi::Value &value) {
    auto model = record(value);
    typename T::element_type *raw = nullptr;
    int32_t code;
    if constexpr (std::is_same_v<T, Construction>)
      code = formatjs_datetime_records_get_construction(records.get(), model->ticket.get(), &raw);
    else
      code = formatjs_datetime_records_get_formatter(records.get(), model->ticket.get(), &raw);
    if (code) throw jsi::JSError(runtime, "Invalid DateTimeFormat record");
    return raw;
  }
  void releaseConstruction(const jsi::Value &value) {
    auto model = record(value);
    if (formatjs_datetime_records_release_construction(records.get(), model->ticket.get()))
      throw jsi::JSError(runtime, "Invalid DateTimeFormat record");
  }
  jsi::Value status(int32_t code) {
    if (code == 0 || code == 1 || code == 4) return jsi::Value(code);
    if (code == 5 && !errors.empty() && errors.back()) {
      auto exception = std::exchange(errors.back(), nullptr);
      std::rethrow_exception(exception);
    }
    throw jsi::JSError(runtime, "Rust DateTimeFormat bridge failed: " + std::to_string(code));
  }
  jsi::Value result(int32_t code, const Bytes &bytes) {
    if (code != 0) return status(code);
    return jsi::String::createFromUtf8(runtime, bytes.value.data, bytes.value.len);
  }
  struct Callback {
    Callback(State &state, const jsi::Object &function) : state(state), function(state.runtime, function) {}
    State &state;
    jsi::WeakObject function;
    std::string response;
  };
  static int32_t calendar(void *context, int64_t milliseconds, FormatjsDateTimeBorrowed *out) noexcept {
    auto &callback = *static_cast<Callback *>(context);
    auto &state = callback.state;
    state.requireOwner();
    try {
      auto function = callback.function.lock(state.runtime);
      if (!function.isObject() || !function.asObject(state.runtime).isFunction(state.runtime))
        throw jsi::JSError(state.runtime, "DateTimeFormat calendar callback expired");
      auto response = function.asObject(state.runtime).asFunction(state.runtime).call(state.runtime, double(milliseconds));
      if (!response.isString()) throw jsi::JSError(state.runtime, "Expected calendar fields JSON");
      auto text = response.asString(state.runtime).utf8(state.runtime);
      callback.response = std::move(text);
      *out = {bytesOf(callback.response), callback.response.size()};
      return 0;
    } catch (...) {
      if (!state.errors.empty()) state.errors.back() = std::current_exception();
      return 1;
    }
  }
  static void releaseCalendar(void *context) noexcept { delete static_cast<Callback *>(context); }
  struct Frame {
    explicit Frame(State &state) : state(state), index(state.errors.size()) { state.errors.emplace_back(); }
    ~Frame() { state.errors.resize(index); }
    State &state;
    size_t index;
  };
  using Operation = jsi::Value (*)(State &, jsi::Runtime &, const jsi::Value *, size_t);
  static jsi::Function bind(jsi::Runtime &runtime, const char *name, size_t arity, const std::shared_ptr<State> &state, Operation operation) {
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forAscii(runtime, name, std::strlen(name)), arity,
        [weak = std::weak_ptr<State>(state), operation](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
          auto state = weak.lock();
          if (!state) throw jsi::JSError(rt, "DateTimeFormat installation released");
          state->drain();
          Frame frame(*state);
          return operation(*state, rt, args, count);
        });
  }
  jsi::Runtime &runtime;
  std::thread::id owner;
  Registry registry;
  Records records;
  std::vector<std::exception_ptr> errors;
};

DateTimeFormatInstallation::DateTimeFormatInstallation(std::shared_ptr<State> state) : state_(std::move(state)) {}
DateTimeFormatInstallation::~DateTimeFormatInstallation() { state_->requireOwner(); }
std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(jsi::Runtime &runtime, jsi::Object &extensions) {
  using State = DateTimeFormatInstallation::State;
  auto state = std::make_shared<State>(runtime);
  jsi::Object bridge(runtime);
  auto add = [&](const char *name, size_t arity, State::Operation operation) {
    bridge.setProperty(runtime, name, State::bind(runtime, name, arity, state, operation));
  };
  add("nativeLoad", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 2 || !args[0].isNumber()) throw jsi::JSError(rt, "Expected DateTimeFormat data kind");
    auto kind = args[0].asNumber();
    if (kind != 0 && kind != 1 && kind != 2) throw jsi::JSError(rt, "Invalid DateTimeFormat data kind");
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_registry_load(state.registry.get(), uint32_t(kind), bytesOf(data), data.size()));
  });
  add("nativeInfo", 0, [](State &state, jsi::Runtime &, const jsi::Value *, size_t) -> jsi::Value {
    Bytes bytes;
    auto status = formatjs_datetime_registry_info(state.registry.get(), &bytes.value);
    return state.result(status, bytes);
  });
  add("nativeDefaultZone", 1, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 0);
    return state.status(formatjs_datetime_registry_zone(state.registry.get(), bytesOf(data), data.size()));
  });
  add("nativeLoadCalendar", 1, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 0);
    return state.status(formatjs_datetime_calendar_load(state.registry.get(), bytesOf(data), data.size()));
  });
  add("nativeCalendar", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto name = stringArgument(rt, args, count, 0);
    if (count != 2 || !args[1].isObject() || !args[1].asObject(rt).isFunction(rt)) throw jsi::JSError(rt, "Expected calendar callback");
    auto context = std::make_unique<State::Callback>(state, args[1].asObject(rt));
    auto raw = context.release();
    return state.status(formatjs_datetime_registry_calendar(state.registry.get(), bytesOf(name), name.size(), raw, State::calendar, State::releaseCalendar));
  });
  add("nativeSupported", 1, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 0);
    Bytes bytes;
    auto status = formatjs_datetime_supported(state.registry.get(), bytesOf(data), data.size(), &bytes.value);
    return state.result(status, bytes);
  });
  add("nativeBegin", 0, [](State &state, jsi::Runtime &, const jsi::Value *, size_t) -> jsi::Value {
    FormatjsDateTimeConstruction *raw = nullptr;
    auto status = formatjs_datetime_begin(state.registry.get(), &raw);
    Construction handle(raw, formatjs_datetime_construction_destroy);
    if (status) return state.status(status);
    return state.retain(std::move(handle));
  });
  add("nativeResolve", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_resolve(state.get<Construction>(args[0]), bytesOf(data), data.size()));
  });
  add("nativeZone", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_zone(state.get<Construction>(args[0]), bytesOf(data), data.size()));
  });
  add("nativeCapture", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_capture(state.get<Construction>(args[0]), bytesOf(data), data.size()));
  });
  add("nativeCreate", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    FormatjsDateTimeHandle *raw = nullptr;
    auto status = formatjs_datetime_create(state.get<Construction>(args[0]), bytesOf(data), data.size(), &raw);
    Formatter handle(raw, formatjs_datetime_destroy);
    if (status) return state.status(status);
    return state.retain(std::move(handle));
  });
  add("nativeReleaseConstruction", 1, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    if (count != 1) throw jsi::JSError(rt, "Expected construction record");
    state.releaseConstruction(args[0]);
    return jsi::Value::undefined();
  });
  add("nativeQuery", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    auto *handle = state.get<Formatter>(args[0]);
    Bytes bytes;
    auto status = formatjs_datetime_query(handle, bytesOf(data), data.size(), &bytes.value);
    return state.result(status, bytes);
  });
  extensions.getPropertyAsFunction(runtime, "IntlDateTimeFormat").call(runtime, bridge);
  return std::unique_ptr<DateTimeFormatInstallation>(new DateTimeFormatInstallation(std::move(state)));
}
std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(jsi::Runtime &runtime) {
  auto extensions = hermes_bridge::factory(runtime, wrapperSource, "formatjs:DateTimeFormat", "IntlDateTimeFormat");
  return installDateTimeFormat(runtime, extensions);
}
} // namespace formatjs
