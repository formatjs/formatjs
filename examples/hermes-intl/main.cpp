#include <formatjs/hermes/intl.h>
#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_locale.h>
#include <formatjs/hermes/intl_listformat.h>
#include <formatjs/hermes/intl_displaynames.h>
#include <formatjs/hermes/intl_segmenter.h>
#include <formatjs/hermes/intl_collator.h>
#include <formatjs/hermes/intl_numberformat.h>
#include <formatjs/hermes/intl_relativetimeformat.h>
#include <formatjs/hermes/intl_datetimeformat.h>
#include <formatjs/hermes/intl_durationformat.h>
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
constexpr char durationSmoke[] =
#include "durationformat_smoke.inc"
    ;
constexpr char datetimeformat_smoke[] =
#include "datetimeformat_smoke.inc"
    ;
constexpr char datetimeformat_hebrew[] =
#include "datetimeformat_hebrew.inc"
    ;
constexpr char datetimeformat_tz[] =
#include "datetimeformat_tz.inc"
    ;
constexpr char numberSmoke[] =
#include "numberformat_smoke.inc"
    ;
constexpr char relativeSmoke[] =
#include "relativetimeformat_smoke.inc"
    ;
constexpr char collatorSmoke[] =
#include "collator_smoke.inc"
    ;
constexpr char segmentSmoke[] =
#include "segmenter_smoke.inc"
    ;
constexpr char displaySmoke[] =
#include "displaynames_smoke.inc"
    ;
constexpr char listSmoke[] =
#include "listformat_smoke.inc"
    ;
constexpr char pluralSmoke[] =
#include "pluralrules_smoke.inc"
    ;
}

int main(int argc, char **argv) {
  if (argc != 2) {
    std::cerr << "usage: smoke extensions.hbc\n";
    return 2;
  }
  // JSError retains runtime values until the catch handler finishes.
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime;
  std::unique_ptr<facebook::hermes::HermesRuntime> installationRuntime;
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
                                  bytecode),
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
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(pluralSmoke), "formatjs:pluralrules-sdk-smoke");
    auto pluralPassed = runtime->global().getProperty(*runtime, "__SDK_PLURAL_PASSED");
    if (!pluralPassed.isBool() || !pluralPassed.getBool()) throw std::runtime_error("PluralRules SDK smoke failed");
    std::cout << "Hermes SDK PluralRules passed\n";
    formatjs::installListFormat(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(listSmoke), "formatjs:listformat-sdk-smoke");
    auto listPassed = runtime->global().getProperty(*runtime, "__SDK_LIST_PASSED");
    if (!listPassed.isBool() || !listPassed.getBool()) throw std::runtime_error("ListFormat SDK smoke failed");
    std::cout << "Hermes SDK ListFormat passed\n";
    formatjs::installDisplayNames(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(displaySmoke), "formatjs:displaynames-sdk-smoke");
    auto displayPassed = runtime->global().getProperty(*runtime, "__SDK_DISPLAY_PASSED");
    if (!displayPassed.isBool() || !displayPassed.getBool()) throw std::runtime_error("DisplayNames SDK smoke failed");
    std::cout << "Hermes SDK DisplayNames passed\n";
    formatjs::installSegmenter(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(segmentSmoke), "formatjs:segmenter-sdk-smoke");
    auto segmentPassed = runtime->global().getProperty(*runtime, "__SDK_SEGMENTER_PASSED");
    if (!segmentPassed.isBool() || !segmentPassed.getBool()) throw std::runtime_error("Segmenter SDK smoke failed");
    std::cout << "Hermes SDK Segmenter passed\n";
    formatjs::installCollator(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(collatorSmoke), "formatjs:collator-sdk-smoke");
    auto collatorPassed = runtime->global().getProperty(*runtime, "__SDK_COLLATOR_PASSED");
    if (!collatorPassed.isBool() || !collatorPassed.getBool()) throw std::runtime_error("Collator SDK smoke failed");
    std::cout << "Hermes SDK Collator passed\n";
    formatjs::installNumberFormat(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(numberSmoke), "formatjs:numberformat-sdk-smoke");
    auto numberPassed = runtime->global().getProperty(*runtime, "__SDK_NUMBER_PASSED");
    if (!numberPassed.isBool() || !numberPassed.getBool()) throw std::runtime_error("NumberFormat SDK smoke failed");
    std::cout << "Hermes SDK NumberFormat passed\n";
    formatjs::installRelativeTimeFormat(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(relativeSmoke), "formatjs:relativetimeformat-sdk-smoke");
    auto relativePassed = runtime->global().getProperty(*runtime, "__SDK_RELATIVE_PASSED");
    if (!relativePassed.isBool() || !relativePassed.getBool()) throw std::runtime_error("RelativeTimeFormat SDK smoke failed");
    std::cout << "Hermes SDK RelativeTimeFormat passed\n";

    auto dateTimeInstallation = formatjs::installDateTimeFormat(*runtime, extensions);
    runtime->global().setProperty(*runtime, "__SDK_DATETIME_HEBREW", facebook::jsi::String::createFromUtf8(*runtime, datetimeformat_hebrew));
    runtime->global().setProperty(*runtime, "__SDK_DATETIME_TZ", facebook::jsi::String::createFromUtf8(*runtime, datetimeformat_tz));
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(datetimeformat_smoke), "formatjs:datetimeformat-sdk-smoke");
    auto dateTimePassed = runtime->global().getProperty(*runtime, "__SDK_DATETIME_PASSED");
    if (!dateTimePassed.isBool() || !dateTimePassed.getBool()) throw std::runtime_error("DateTimeFormat SDK smoke failed");
    std::cout << "Hermes SDK DateTimeFormat passed\n";
    dateTimeInstallation = formatjs::installDateTimeFormat(*runtime);
    runtime->global().setProperty(*runtime, "__SDK_DATETIME_PASSED", false);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(datetimeformat_smoke), "formatjs:datetimeformat-source-sdk-smoke");
    dateTimePassed = runtime->global().getProperty(*runtime, "__SDK_DATETIME_PASSED");
    if (!dateTimePassed.isBool() || !dateTimePassed.getBool()) throw std::runtime_error("DateTimeFormat source SDK smoke failed");
    std::cout << "Hermes SDK DateTimeFormat source passed\n";

    formatjs::installDurationFormat(*runtime, extensions);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(durationSmoke), "formatjs:durationformat-sdk-smoke");
    auto durationPassed = runtime->global().getProperty(*runtime, "__SDK_DURATION_PASSED");
    if (!durationPassed.isBool() || !durationPassed.getBool()) throw std::runtime_error("DurationFormat SDK smoke failed");
    std::cout << "Hermes SDK DurationFormat passed\n";
    formatjs::installDurationFormat(*runtime);
    runtime->global().setProperty(*runtime, "__SDK_DURATION_PASSED", false);
    runtime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(durationSmoke), "formatjs:durationformat-source-sdk-smoke");
    durationPassed = runtime->global().getProperty(*runtime, "__SDK_DURATION_PASSED");
    if (!durationPassed.isBool() || !durationPassed.getBool()) throw std::runtime_error("DurationFormat source SDK smoke failed");
    std::cout << "Hermes SDK DurationFormat source passed\n";


    for (bool precompiled : {false, true}) {
      installationRuntime = facebook::hermes::makeHermesRuntime();
      if (precompiled) {
        auto setup = installationRuntime->evaluateJavaScript(
            std::make_shared<facebook::jsi::StringBuffer>(bytecode),
            "formatjs:extensions.hbc").asObject(*installationRuntime);
        formatjs::installIntl(*installationRuntime, setup);
        formatjs::installIntl(*installationRuntime, setup);
      } else {
        formatjs::installIntl(*installationRuntime);
      }
      installationRuntime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(R"JS(
        globalThis.__installedIntl = Intl.NumberFormat;
        globalThis.__installedNumber = new Intl.NumberFormat('en');
      )JS"), "formatjs:installation-state");
      formatjs::installIntl(*installationRuntime);
      installationRuntime->evaluateJavaScript(std::make_shared<facebook::jsi::StringBuffer>(R"JS(
        function equal(actual, expected) {
          if (JSON.stringify(actual) !== JSON.stringify(expected))
            throw new Error(JSON.stringify(actual));
        }
        if (__installedIntl !== Intl.NumberFormat) throw new Error('Installer replaced constructors twice');
        equal(__installedNumber.format(1234), '1,234');
        equal(Intl.getCanonicalLocales('en-us'), ['en-US']);
        equal(new Intl.Locale('en-US').language, 'en');
        if (!Intl.supportedValuesOf('calendar').includes('gregory')) throw new Error('Missing Gregorian calendar');
        if (!new Intl.Locale('de').getCollations().includes('phonebk')) throw new Error('Missing installed collations');
        equal(new Intl.PluralRules('en').select(1), 'one');
        equal(new Intl.ListFormat('fr').format(['A', 'B']), 'A et B');
        equal(new Intl.DisplayNames('fr', {type: 'language'}).of('en'), 'anglais');
        equal(Array.from(new Intl.Segmenter('en').segment('A🙂B'), part => part.segment), ['A', '🙂', 'B']);
        if (new Intl.Collator('en', {numeric: true}).compare('2', '10') >= 0) throw new Error('Numeric collation');
        equal(new Intl.RelativeTimeFormat('en').format(-1, 'day'), '1 day ago');
        equal(new Intl.DateTimeFormat('en', {timeZone: 'UTC', year: 'numeric'}).format(0), '1970');
        equal(new Intl.DurationFormat('en', {style: 'digital'}).format({hours: 1, minutes: 2, seconds: 3}), '1:02:03');
      )JS"), "formatjs:all-intl-sdk-smoke");
      std::cout << "Hermes SDK all-Intl " << (precompiled ? "bytecode" : "source") << " passed\n";
    }


    return 0;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
