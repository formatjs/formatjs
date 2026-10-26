#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_pluralrules.h>
#include <formatjs/hermes/supported_values.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

namespace {
constexpr char pluralSmoke[] =
#include "pluralrules_smoke.inc"
    ;
constexpr char englishPack[] =
#include "pluralrules_en.inc"
    ;
constexpr char frenchPack[] =
#include "pluralrules_fr.inc"
    ;
}

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
    formatjs::installSupportedValuesOf(*runtime, extensions);
    formatjs::installLocale(*runtime, extensions);
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
            var supported = Intl.supportedValuesOf;
            var descriptor = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf');
            if (supported.name !== 'supportedValuesOf' || supported.length !== 1 ||
                descriptor.enumerable || !descriptor.writable || !descriptor.configurable ||
                Object.prototype.hasOwnProperty.call(supported, 'prototype')) {
              throw new Error('Invalid supportedValuesOf descriptors');
            }
            ['calendar', 'collation', 'currency', 'numberingSystem', 'timeZone', 'unit']
              .forEach(function (key) {
                var values = supported(key);
                if (!Array.isArray(values)) throw new Error('Expected array');
                equal(values, values.slice().sort());
                values.push('changed');
                if (supported(key).indexOf('changed') !== -1) throw new Error('Shared result');
              });
            var hints = [];
            equal(supported({[Symbol.toPrimitive]: function (hint) {
              hints.push(hint); return 'unit';
            }}), supported('unit'));
            equal(hints, ['string']);
            rangeError = false;
            try { supported('invalid'); } catch (error) {
              rangeError = error instanceof RangeError;
            }
            if (!rangeError) throw new Error('Expected supportedValuesOf RangeError');
            typeError = false;
            try { supported(Symbol('unit')); } catch (error) {
              typeError = error instanceof TypeError;
            }
            if (!typeError) throw new Error('Expected supportedValuesOf TypeError');
            typeError = false;
            try { Reflect.construct(supported, ['unit']); } catch (error) {
              typeError = error instanceof TypeError;
            }
            if (!typeError) throw new Error('supportedValuesOf must not be constructible');
            var locale = new Intl.Locale('hye-Latn-SU', {calendar: 'islamicc', numeric: true});
            equal(locale.toString(), 'hy-Latn-AM-u-ca-islamic-civil-kn');
            equal(locale.calendar, 'islamic-civil');
            equal(locale.numeric, true);
            equal(locale.minimize().toString(), 'hy-Latn-u-ca-islamic-civil-kn');
            equal(new Intl.Locale('und-Thai').maximize().toString(), 'th-Thai-TH');
            equal(new Intl.Locale('ar').getTextInfo(), {direction: 'rtl'});
            equal(new Intl.Locale('en').getNumberingSystems(), ['latn']);
            equal(new Intl.Locale('en-u-nu-thai').getNumberingSystems(), ['thai']);
            equal(new Intl.Locale('en').getCollations(), ['emoji', 'eor']);
            equal(new Intl.Locale('en-US-u-fw-mon').getWeekInfo(), {firstDay: 1, weekend: [6, 7]});
            equal(canonical(locale), ['hy-Latn-AM-u-ca-islamic-civil-kn']);
            typeError = false;
            try { Intl.Locale.prototype.toString.call(Object.create(Intl.Locale.prototype)); }
            catch (error) { typeError = error instanceof TypeError; }
            if (!typeError) throw new Error('Expected Locale receiver TypeError');
            return true;
          })()
        )JS"),
        "formatjs:standalone-smoke");
    if (!result.isBool() || !result.getBool()) {
      throw std::runtime_error("Canonicalization smoke failed");
    }
    std::cout << "Hermes SDK canonicalization passed\n";
    std::cout << "Hermes SDK supportedValuesOf passed\n";
    std::cout << "Hermes SDK Locale passed\n";
    formatjs::installPluralRules(*runtime, extensions);
    runtime->global().setProperty(*runtime, "__SDK_PLURAL_EN", facebook::jsi::String::createFromUtf8(*runtime, englishPack));
    runtime->global().setProperty(*runtime, "__SDK_PLURAL_FR", facebook::jsi::String::createFromUtf8(*runtime, frenchPack));
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(pluralSmoke), "formatjs:pluralrules-sdk-smoke");
    auto pluralPassed = runtime->global().getProperty(*runtime, "__SDK_PLURAL_PASSED");
    if (!pluralPassed.isBool() || !pluralPassed.getBool()) throw std::runtime_error("PluralRules SDK smoke failed");
    std::cout << "Hermes SDK PluralRules passed\n";
    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
