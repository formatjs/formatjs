#include <formatjs/hermes/temporal.h>
#include <formatjs/hermes/canonical_locales.h>
#include <formatjs/hermes/intl_datetimeformat.h>
#include <hermes/hermes.h>

#include <chrono>
#include <iostream>
#include <fstream>
#include <iterator>
#include <sstream>
#include <unordered_map>
#include <memory>
#include <stdexcept>

namespace jsi = facebook::jsi;
namespace {
void check(bool value) {
  if (!value) throw std::runtime_error("Temporal installer assertion failed");
}
void evaluate(jsi::Runtime &runtime, const char *source) {
  runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), "temporal:test");
}
struct Host {
  std::string zone = "US/Eastern";
  std::string nanos = "1583649000000000000";
};
}

int main(int argc, char **argv) {
  auto first = facebook::hermes::makeHermesRuntime();
  auto second = facebook::hermes::makeHermesRuntime();
  try {
    check(argc == 3);
    bool rejected = false;
    try { formatjs::installTemporal(*first, {}); }
    catch (const jsi::JSError &) { rejected = true; }
    check(rejected);
    formatjs::installCanonicalLocales(*first);
    auto formatter = formatjs::installDateTimeFormat(*first);
    std::ifstream file(argv[1]);
    check(bool(file));
    std::string pack((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    first->global().setProperty(*first, "temporalLocalePack", jsi::String::createFromUtf8(*first, pack));
    evaluate(*first, R"JS(
      Intl.DateTimeFormat.__addLocaleData(temporalLocalePack);
      globalThis.beforeTemporalFormatter = new Intl.DateTimeFormat('en', {
        year:'numeric', month:'2-digit', day:'2-digit', timeZone:'UTC'
      });
    )JS");
    auto host = std::make_shared<Host>();
    std::weak_ptr<Host> lifetime = host;
    formatjs::installTemporal(*first, {
        [host] { return host->zone; },
        [host] { return host->nanos; },
    });
    evaluate(*first, R"JS(
      let checks = 0;
      function check(value) { if (!value) throw new Error('Temporal host assertion failed: ' + checks); checks++; }
      globalThis.installedTemporal = Temporal;
      check(Temporal.Now.timeZoneId() === 'America/New_York');
      check(Temporal.Now.instant().epochNanoseconds === 1583649000000000000n);
      check(Temporal.Now.plainDateTimeISO().toString() === '2020-03-08T01:30:00');
      check(Temporal.Now.zonedDateTimeISO().toString() === '2020-03-08T01:30:00-05:00[America/New_York]');
      check(Temporal.Now.plainDateISO().toString() === '2020-03-08');
      check(Temporal.Now.plainTimeISO().toString() === '01:30:00');
      check(new Temporal.Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).hours === 5);
      check(Temporal.PlainDate.from('2020-02-29').day === 29);
      check(Temporal.PlainDate.from('-271821-04-19').toLocaleString('en', {year:'numeric'}) === '271822');
      check(beforeTemporalFormatter.format(Temporal.PlainDate.from('2020-02-29')) === '02/29/2020');
      check(Temporal.PlainTime.from('12:34:56.123456789').nanosecond === 789);
      for (const monthCode of ['M00', 'M01\n']) {
        let failure;
        try {
          Temporal.PlainDate.from({day: 1, monthCode, get year() { throw new Error('Unexpected year read'); }});
        } catch (error) { failure = error; }
        check(failure instanceof RangeError);
      }
      const anchor = new Temporal.PlainDateTime(2020, 1, 31, 23, 59);
      Object.defineProperty(anchor, 'hour', {get() { throw new Error('Unexpected hour read'); }});
      check(Temporal.Duration.compare('P1M', 'P29D', {relativeTo: anchor}) === 0);
      check(Temporal.Duration.from('P1M').total({relativeTo: anchor, unit: 'day'}) === 29);
      for (const relativeTo of ['+275760-08-13', '+275760-08-13T00:00[UTC]']) {
        let failure;
        try { Temporal.Duration.from('P1M').total({relativeTo, unit: 'month'}); }
        catch (error) { failure = error; }
        check(failure instanceof RangeError);
      }
      const totalLimit = new Temporal.ZonedDateTime(8640000000000000000000n, 'UTC');
      for (const unit of ['year', 'month', 'week']) {
        let failure;
        try { new Temporal.Duration().total({relativeTo: totalLimit, unit}); }
        catch (error) { failure = error; }
        check(failure instanceof RangeError);
        check(new Temporal.Duration().total({relativeTo: '+275760-09-13', unit}) === 0);
      }
      const shortOptionFailure = new Error('overflow getter reached');
      for (const [from, text] of [
        [Temporal.PlainDate.from, '+275760-09-14'],
        [Temporal.PlainDateTime.from, '-271821-04-19T00:00'],
        [Temporal.PlainYearMonth.from, '+275760-10'],
        [Temporal.PlainMonthDay.from, '+999999-01-01[u-ca=gregory]'],
      ]) {
        let failure;
        try { from(text, {get overflow() { throw shortOptionFailure; }}); }
        catch (error) { failure = error; }
        check(failure === shortOptionFailure);
      }
      for (const calendar of [
        '+999999-01-01[u-ca=gregory]',
        '-999999-12-31T23:59:60Z[Unknown/Zone][u-ca=gregory]',
      ]) {
        const date = new Temporal.PlainDate(2020, 2, 29);
        check(date.withCalendar(calendar).calendarId === 'gregory');
        check(Temporal.PlainDate.from({year: 2020, month: 2, day: 29, calendar}).calendarId === 'gregory');
      }
      for (const [owner, key] of [[Object, 'create'], [Reflect, 'get']]) {
        const original = owner[key];
        let allocated;
        try {
          owner[key] = function () { throw new Error('Mutable helper reached'); };
          allocated = [
            new Temporal.Instant(0n), Temporal.Instant.from('1970-01-01T00:00Z'),
            new Temporal.Duration(0, 0, 0, 1), Temporal.Duration.from('P1D'),
            new Temporal.PlainDate(2020, 2, 29), Temporal.PlainDate.from('2020-02-29'),
            new Temporal.PlainDateTime(2020, 2, 29), Temporal.PlainDateTime.from('2020-02-29'),
            new Temporal.PlainTime(12, 34), Temporal.PlainTime.from('12:34'),
            new Temporal.PlainYearMonth(2020, 2), Temporal.PlainYearMonth.from('2020-02'),
            new Temporal.PlainMonthDay(2, 29), Temporal.PlainMonthDay.from('02-29'),
            new Temporal.ZonedDateTime(0n, 'UTC'), Temporal.ZonedDateTime.from('1970-01-01T00:00[UTC]'),
          ];
        } finally { owner[key] = original; }
        check(allocated.map(value => value.toString()).join('|') === [
          '1970-01-01T00:00:00Z', '1970-01-01T00:00:00Z', 'P1D', 'P1D',
          '2020-02-29', '2020-02-29', '2020-02-29T00:00:00', '2020-02-29T00:00:00',
          '12:34:00', '12:34:00', '2020-02', '2020-02', '02-29', '02-29',
          '1970-01-01T00:00:00+00:00[UTC]', '1970-01-01T00:00:00+00:00[UTC]',
        ].join('|'));
      }
      const originalGet = Reflect.get;
      let localeReads = 0, localeText;
      const localeOptions = {get year() {
        if (this !== localeOptions) throw new Error('Wrong options receiver');
        localeReads++;
        return 'numeric';
      }};
      try {
        Reflect.get = function () { throw new Error('Mutable Reflect.get reached'); };
        localeText = new Temporal.PlainDate(2020, 2, 29).toLocaleString('en', localeOptions);
      } finally { Reflect.get = originalGet; }
      check(localeReads === 1 && localeText === '2020');
      check(new Date(123).toTemporalInstant().epochNanoseconds === 123000000n);
      check(!Object.prototype.hasOwnProperty.call(globalThis, '__formatjsTemporalISOQuery'));
      check(!Object.prototype.hasOwnProperty.call(globalThis, 'FormatJSTemporalInstaller'));
      const originalBigInt = globalThis.BigInt, originalNow = Date.now;
      try {
        globalThis.BigInt = Date.now = function () { throw new Error('Mutable clock intrinsic observed'); };
        check(Temporal.Now.instant().epochNanoseconds === 1583649000000000000n);
      } finally {
        globalThis.BigInt = originalBigInt; Date.now = originalNow;
      }
    )JS");
    formatjs::installTemporal(*first, {});
    evaluate(*first, "check(Temporal === globalThis.installedTemporal)");
    const auto before = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    formatjs::installTemporal(*second, {[] { return "UTC"; }, {}});
    const auto actual = second->evaluateJavaScript(std::make_shared<jsi::StringBuffer>(
        "Temporal.Now.instant().epochMilliseconds"), "temporal:clock").asNumber();
    const auto after = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    check(actual >= before && actual <= after);
    host->zone = "Asia/Kathmandu";
    evaluate(*first, "check(Temporal.Now.plainDateTimeISO().toString() === '2020-03-08T12:15:00')");
    host->nanos = "1583649000123456789";
    evaluate(*first, "check(Temporal.Now.instant().epochNanoseconds === 1583649000123456789n); check(Temporal.Now.plainTimeISO().nanosecond === 789)");
    evaluate(*second, "if (Temporal.Now.timeZoneId() !== 'UTC') throw new Error('Cross-runtime timezone leak')");
    evaluate(*first, R"JS(
      globalThis.temporalSupportsZone = function (id) {
        try { new Temporal.ZonedDateTime(0n, id); return true; }
        catch (error) { if (error instanceof RangeError) return false; throw error; }
      };
      globalThis.temporalCurrentOffset = function () {
        return Temporal.Now.zonedDateTimeISO().offsetNanoseconds;
      };
    )JS");
    {
      auto supports = first->global().getPropertyAsFunction(*first, "temporalSupportsZone");
      auto offset = first->global().getPropertyAsFunction(*first, "temporalCurrentOffset");
      std::ifstream fixture(argv[2]);
      check(bool(fixture));
      std::unordered_map<std::string, bool> supported;
      std::string line;
      size_t count = 0;
      while (std::getline(fixture, line)) {
        if (line.empty() || line[0] == '#') continue;
        std::istringstream row(line);
        std::string id, milliseconds, seconds;
        check(bool(std::getline(row, id, '\t')));
        check(bool(std::getline(row, milliseconds, '\t')));
        check(bool(std::getline(row, seconds, '\t')));
        if (!supported.count(id)) supported[id] = supports.call(*first, jsi::String::createFromUtf8(*first, id)).getBool();
        if (!supported[id]) continue;
        host->zone = id;
        host->nanos = milliseconds + "000000";
        const auto actualOffset = offset.call(*first).asNumber();
        if (actualOffset != std::stoll(seconds) * 1000000000.0)
          throw std::runtime_error("ICU Now offset mismatch: " + line);
        ++count;
      }
      check(count == 17640);
      std::cout << "ICU Now offsets: " << count << '\n';
    }
    host->zone = "Unknown/Zone";
    host->nanos = "1583649000000000000";
    // SystemTimeZoneIdentifier never throws; an unusable host zone reads as UTC.
    evaluate(*first, R"JS(
      check(Temporal.Now.plainDateTimeISO('UTC').toString() === '2020-03-08T06:30:00');
      check(Temporal.Now.timeZoneId() === 'UTC');
      check(Temporal.Now.plainDateTimeISO().toString() === '2020-03-08T06:30:00');
    )JS");
    host->zone = "";
    evaluate(*first, "check(Temporal.Now.zonedDateTimeISO().timeZoneId === 'UTC')");
    host->nanos = "9999999999999999999999999999999999";
    evaluate(*first, "check(Temporal.Now.instant().epochNanoseconds === 8640000000000000000000n)");
    host.reset();
    check(!lifetime.expired());
    formatter.reset();
    first.reset();
    check(lifetime.expired());
    return 0;
  } catch (const jsi::JSError &error) {
    std::cerr << error.getMessage() << '\n';
    return 1;
  }
}
