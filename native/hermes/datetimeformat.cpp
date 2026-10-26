#include <formatjs/hermes/intl_datetimeformat.h>
#include <formatjs/intl/datetimeformat.h>
#include <formatjs/intl/datetimeformat_calendars.h>

#include <cstring>
#include <exception>
#include <map>
#include <mutex>
#include <stdexcept>
#include <string>
#include <thread>
#include <utility>
#include <variant>
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
using RecordValue = std::variant<Construction, Formatter>;
struct Finalizers {
  std::mutex mutex;
  std::vector<size_t> ids;
};
struct Record final : jsi::HostObject {
  Record(size_t id, std::shared_ptr<Finalizers> finalizers) : id(id), finalizers(std::move(finalizers)) {}
  ~Record() override {
    std::lock_guard<std::mutex> lock(finalizers->mutex);
    finalizers->ids.push_back(id);
  }
  size_t id;
  std::shared_ptr<Finalizers> finalizers;
};
struct Bytes {
  FormatjsDateTimeBytes value{nullptr, 0};
  ~Bytes() { formatjs_datetime_bytes_free(value); }
};
const uint8_t *bytesOf(const std::string &value) { return reinterpret_cast<const uint8_t *>(value.data()); }
std::string stringArgument(jsi::Runtime &rt, const jsi::Value *args, size_t count, size_t index) {
  if (index >= count || !args[index].isString()) throw jsi::JSError(rt, "Expected DateTimeFormat string argument");
  return args[index].asString(rt).utf8(rt);
}
} // namespace

struct DateTimeFormatInstallation::State {
  explicit State(jsi::Runtime &rt) : runtime(rt), owner(std::this_thread::get_id()), registry(nullptr, formatjs_datetime_registry_destroy) {
    FormatjsDateTimeRegistry *raw = nullptr;
    if (formatjs_datetime_registry_create(&raw) != 0) throw std::runtime_error("Cannot create DateTimeFormat registry");
    registry.reset(raw);
  }
  ~State() {
    requireOwner();
    records.clear();
    registry.reset();
  }
  void requireOwner() const {
    if (std::this_thread::get_id() != owner) std::terminate();
  }
  void drain() {
    requireOwner();
    std::vector<size_t> ids;
    {
      std::lock_guard<std::mutex> lock(finalizers->mutex);
      ids.swap(finalizers->ids);
    }
    for (size_t id : ids) records.erase(id);
  }
  jsi::Object retain(RecordValue value) {
    const auto id = next++;
    records.emplace(id, std::move(value));
    return jsi::Object::createFromHostObject(runtime, std::make_shared<Record>(id, finalizers));
  }
  template <typename T> T &get(const jsi::Value &value) {
    if (!value.isObject()) throw jsi::JSError(runtime, "Expected DateTimeFormat record");
    auto object = value.asObject(runtime);
    if (!object.isHostObject<Record>(runtime)) throw jsi::JSError(runtime, "Invalid DateTimeFormat record");
    auto record = object.getHostObject<Record>(runtime);
    auto found = records.find(record->id);
    if (record->finalizers != finalizers || found == records.end() || !std::holds_alternative<T>(found->second))
      throw jsi::JSError(runtime, "Invalid DateTimeFormat record");
    return std::get<T>(found->second);
  }
  void releaseConstruction(const jsi::Value &value) {
    get<Construction>(value).reset();
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
  std::shared_ptr<Finalizers> finalizers = std::make_shared<Finalizers>();
  std::map<size_t, RecordValue> records;
  size_t next = 0;
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
    return state.status(formatjs_datetime_resolve(state.get<Construction>(args[0]).get(), bytesOf(data), data.size()));
  });
  add("nativeZone", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_zone(state.get<Construction>(args[0]).get(), bytesOf(data), data.size()));
  });
  add("nativeCapture", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    return state.status(formatjs_datetime_capture(state.get<Construction>(args[0]).get(), bytesOf(data), data.size()));
  });
  add("nativeCreate", 2, [](State &state, jsi::Runtime &rt, const jsi::Value *args, size_t count) -> jsi::Value {
    auto data = stringArgument(rt, args, count, 1);
    FormatjsDateTimeHandle *raw = nullptr;
    auto status = formatjs_datetime_create(state.get<Construction>(args[0]).get(), bytesOf(data), data.size(), &raw);
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
    auto *handle = state.get<Formatter>(args[0]).get();
    Bytes bytes;
    auto status = formatjs_datetime_query(handle, bytesOf(data), data.size(), &bytes.value);
    return state.result(status, bytes);
  });
  extensions.getPropertyAsFunction(runtime, "IntlDateTimeFormat").call(runtime, bridge);
  return std::unique_ptr<DateTimeFormatInstallation>(new DateTimeFormatInstallation(std::move(state)));
}
std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(jsi::Runtime &runtime) {
  auto factory = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(wrapperSource), "formatjs:DateTimeFormat");
  jsi::Object extensions(runtime);
  extensions.setProperty(runtime, "IntlDateTimeFormat", std::move(factory));
  return installDateTimeFormat(runtime, extensions);
}
} // namespace formatjs
