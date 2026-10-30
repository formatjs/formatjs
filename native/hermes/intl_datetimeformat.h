#pragma once
#include <jsi/jsi.h>
#include <memory>
namespace formatjs {
// Keep this guard on the JavaScript thread until formatting stops. Destroy it
// before the runtime; GC finalizers only queue work for this owner.
class DateTimeFormatInstallation {
 public:
  ~DateTimeFormatInstallation();
  DateTimeFormatInstallation(const DateTimeFormatInstallation &) = delete;
  DateTimeFormatInstallation &operator=(const DateTimeFormatInstallation &) = delete;
 private:
  struct State;
  explicit DateTimeFormatInstallation(std::shared_ptr<State>);
  std::shared_ptr<State> state_;
  friend std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(
      facebook::jsi::Runtime &, facebook::jsi::Object &);
};
[[nodiscard]] std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(facebook::jsi::Runtime &);
[[nodiscard]] std::unique_ptr<DateTimeFormatInstallation> installDateTimeFormat(
    facebook::jsi::Runtime &, facebook::jsi::Object &extensions);
}
