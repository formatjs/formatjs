#include <formatjs/hermes/canonical_locales.h>

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
      rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(std::move(source)),
                            path);
    };
    int firstScript = 1;
    formatjs::installCanonicalLocales(rt);
    while (firstScript < argc && std::string(argv[firstScript]).rfind("--prelude=", 0) == 0) {
      evaluateFile(std::string(argv[firstScript]).substr(10));
      ++firstScript;
    }
    if (firstScript != 1) formatjs::installCanonicalLocales(rt);
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
