/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_collator.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/hermes/intl_durationformat.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_numberformat.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/hermes/intl_relativetimeformat.h>
#include <formatjs/hermes/intl_segmenter.h>
#include <formatjs/hermes/supported_values.h>

#include <AppSpecsJSI.h>
#include <formatjs/hermes/intl_datetimeformat.h>
#include <memory>
#include <utility>

#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <FBReactNativeSpec.h>
#include <autolinking.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

#ifdef REACT_NATIVE_APP_CODEGEN_HEADER
#include REACT_NATIVE_APP_CODEGEN_HEADER
#endif
#ifdef REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#include REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#endif

namespace facebook::react {

class NativeIntlModule final : public NativeIntlModuleCxxSpec<NativeIntlModule> {
 public:
  explicit NativeIntlModule(std::shared_ptr<CallInvoker> jsInvoker)
      : NativeIntlModuleCxxSpec(std::move(jsInvoker)) {}

  bool install(jsi::Runtime& runtime) {
    if (dateTime_) return true;
    formatjs::installCanonicalLocales(runtime);
    formatjs::installSupportedValuesOf(runtime);
    formatjs::installLocale(runtime);
    // Capture the installed Locale brand for canonicalization.
    formatjs::installCanonicalLocales(runtime);
    formatjs::installPluralRules(runtime);
    formatjs::installListFormat(runtime);
    formatjs::installDisplayNames(runtime);
    formatjs::installSegmenter(runtime);
    formatjs::installCollator(runtime);
    formatjs::installNumberFormat(runtime);
    formatjs::installRelativeTimeFormat(runtime);
    dateTime_ = formatjs::installDateTimeFormat(runtime);
    formatjs::installDurationFormat(runtime);
    return true;
  }

 private:
  std::unique_ptr<formatjs::DateTimeFormatInstallation> dateTime_;
};

void registerComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry) {
#ifdef REACT_NATIVE_APP_COMPONENT_REGISTRATION
  REACT_NATIVE_APP_COMPONENT_REGISTRATION(registry);
#endif

  autolinking_registerProviders(registry);
}

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  if (name == NativeIntlModule::kModuleName) {
    return std::make_shared<NativeIntlModule>(jsInvoker);
  }

  return autolinking_cxxModuleProvider(name, jsInvoker);
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
#ifdef REACT_NATIVE_APP_MODULE_PROVIDER
  auto module = REACT_NATIVE_APP_MODULE_PROVIDER(name, params);
  if (module != nullptr) {
    return module;
  }
#endif

  if (auto module = FBReactNativeSpec_ModuleProvider(name, params)) {
    return module;
  }

  if (auto module = autolinking_ModuleProvider(name, params)) {
    return module;
  }

  return nullptr;
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
