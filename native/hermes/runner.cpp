#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/hermes/supported_values.h>

#include <hermes/hermes.h>

#include <chrono>
#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
#include <stdexcept>
#include <string>

namespace jsi = facebook::jsi;

int main(int argc, char **argv) {
  // JSError owns runtime values; keep the runtime alive through its catch handler.
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime;
  int status = 0;
  try {
    runtime = facebook::hermes::makeHermesRuntime();
    auto &rt = *runtime;
    auto print = jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "print"), 0,
        [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
           size_t count) -> jsi::Value {
          for (size_t i = 0; i < count; ++i) {
            if (i) std::cout << ' ';
            std::cout << args[i].toString(rt).utf8(rt);
          }
          std::cout << '\n';
          return jsi::Value::undefined();
        });
    rt.global().setProperty(rt, "print", std::move(print));
    auto now = jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "now"), 0,
        [](jsi::Runtime &, const jsi::Value &, const jsi::Value *,
           size_t) -> jsi::Value {
          return std::chrono::duration<double, std::milli>(
                     std::chrono::steady_clock::now().time_since_epoch())
              .count();
        });
    jsi::Object performance(rt);
    performance.setProperty(rt, "now", std::move(now));
    rt.global().setProperty(rt, "performance", std::move(performance));
    if (argc < 2) {
      std::cerr << "Usage: hermes_runner script.js [script.js ...]\n";
      return 2;
    }
    auto evaluateFile = [&](const std::string &path) {
      std::ifstream file(path, std::ios::binary);
      if (!file) throw std::runtime_error("Cannot open " + path);
      std::string source((std::istreambuf_iterator<char>(file)),
                         std::istreambuf_iterator<char>());
      return rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(std::move(source)),
                            path);
    };
    int firstScript = 1;
    formatjs::installCanonicalLocales(rt);
    while (firstScript < argc) {
      const std::string flag(argv[firstScript]);
      if (flag == "--native-displaynames") {
        formatjs::installDisplayNames(rt);
        ++firstScript;
        continue;
      }
      if (std::string(argv[firstScript]) == "--native-listformat") {
        formatjs::installListFormat(rt);
        ++firstScript;
        continue;
      }
      if (std::string(argv[firstScript]) == "--native-pluralrules") {
        formatjs::installPluralRules(rt);
        ++firstScript;
        continue;
      }
      if (flag.rfind("--extensions=", 0) != 0) break;
      auto extensions = evaluateFile(flag.substr(13)).asObject(rt);
      if (extensions.hasProperty(rt, "IntlSupportedValuesOf")) formatjs::installSupportedValuesOf(rt, extensions);
      if (extensions.hasProperty(rt, "IntlLocale")) formatjs::installLocale(rt, extensions);
      if (extensions.hasProperty(rt, "IntlGetCanonicalLocales")) formatjs::installCanonicalLocales(rt, extensions);
      if (extensions.hasProperty(rt, "IntlPluralRules")) formatjs::installPluralRules(rt, extensions);
      if (extensions.hasProperty(rt, "IntlListFormat")) formatjs::installListFormat(rt, extensions);
      if (extensions.hasProperty(rt, "IntlDisplayNames")) formatjs::installDisplayNames(rt, extensions);
      ++firstScript;
    }
    for (int i = firstScript; i < argc; ++i) {
      evaluateFile(argv[i]);
    }
    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    status = 1;
  }
  return status;
}
