#include <formatjs/hermes/canonical_locales.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

int main(int argc, char **argv) {
  if (argc != 2) {
    std::cerr << "usage: smoke extensions.hbc\n";
    return 2;
  }
  // JSError retains runtime values until the catch handler finishes.
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime;
  try {
    std::ifstream input(argv[1], std::ios::binary);
    if (!input) {
      throw std::runtime_error("Cannot open extension bytecode");
    }
    std::string bytecode{std::istreambuf_iterator<char>(input),
                         std::istreambuf_iterator<char>()};
    if (bytecode.empty()) {
      throw std::runtime_error("Empty extension bytecode");
    }
    runtime = facebook::hermes::makeHermesRuntime();
    auto extensions = runtime
                          ->evaluateJavaScript(
                              std::make_shared<facebook::jsi::StringBuffer>(
                                  std::move(bytecode)),
                              "formatjs:extensions.hbc")
                          .asObject(*runtime);
    formatjs::installCanonicalLocales(*runtime, extensions);
    auto result = runtime->evaluateJavaScript(
        std::make_shared<facebook::jsi::StringBuffer>(R"JS(
          (function () {
            var canonical = Intl.getCanonicalLocales;
            function equal(actual, expected) {
              if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(JSON.stringify(actual));
              }
            }
            equal(canonical(['iw', 'EN-us', 'en-US', 'sh']),
                  ['he', 'en-US', 'sr-Latn']);
            equal(canonical('en-u-ca-islamicc'), ['en-u-ca-islamic-civil']);
            equal(canonical(), []);
            equal(canonical({0: 'in', 2: 'ji', length: 3}), ['id', 'yi']);
            var rangeError = false;
            try { canonical('en_US'); } catch (error) {
              rangeError = error instanceof RangeError;
            }
            if (!rangeError) throw new Error('Expected RangeError');
            var typeError = false;
            try { canonical(null); } catch (error) {
              typeError = error instanceof TypeError;
            }
            if (!typeError) throw new Error('Expected TypeError');
            return true;
          })()
        )JS"),
        "formatjs:standalone-smoke");
    if (!result.isBool() || !result.getBool()) {
      throw std::runtime_error("Canonicalization smoke failed");
    }
    std::cout << "Hermes SDK canonicalization passed\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
