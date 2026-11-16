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
    evaluate(*first, R"JS(
      check(Temporal.Now.plainDateTimeISO('UTC').toString() === '2020-03-08T06:30:00');
      let rejected = false;
      try { Temporal.Now.timeZoneId(); } catch (error) { rejected = error instanceof RangeError; }
      check(rejected);
    )JS");
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
