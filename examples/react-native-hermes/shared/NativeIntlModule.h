#pragma once

#include <AppSpecsJSI.h>
#include <formatjs/hermes/intl_datetimeformat.h>

#include <memory>

namespace facebook::react {
class NativeIntlModule : public NativeIntlModuleCxxSpec<NativeIntlModule> {
 public:
  explicit NativeIntlModule(std::shared_ptr<CallInvoker> jsInvoker);
  bool install(jsi::Runtime& runtime);

 private:
  std::unique_ptr<formatjs::DateTimeFormatInstallation> dateTime_;
};
} // namespace facebook::react
