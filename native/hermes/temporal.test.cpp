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
      const originalFloor = Math.floor;
      let floorResults;
      try {
        Math.floor = function () { throw new Error('Mutable Math.floor reached'); };
        floorResults = [
          new Temporal.Instant(-1n).toString(),
          new Temporal.Instant(0n).toString({timeZone: '+01:30'}),
          new Temporal.PlainDate(2021, 1, 1).weekOfYear,
          new Temporal.PlainTime(12, 34, 56, 123).toString({fractionalSecondDigits: 2}),
          new Temporal.ZonedDateTime(0n, '+01:30').toString(),
        ];
      } finally { Math.floor = originalFloor; }
      check(floorResults.join('|') === [
        '1969-12-31T23:59:59.999999999Z', '1970-01-01T01:30:00+01:30', 53,
        '12:34:56.12', '1970-01-01T01:30:00+01:30[+01:30]',
      ].join('|'));
      const numericBindings = [
        [Math, 'abs'], [Math, 'min'], [Math, 'max'], [Math, 'trunc'], [Math, 'sign'],
        [Number, 'isInteger'], [Number, 'isSafeInteger'], [Number, 'isFinite'],
        [globalThis, 'Number'], [globalThis, 'BigInt'],
      ];
      const numericDescriptors = numericBindings.map(([owner, key]) => Object.getOwnPropertyDescriptor(owner, key));
      let numericResults;
      try {
        for (let i = 0; i < numericBindings.length; i++) {
          const [owner, key] = numericBindings[i];
          Object.defineProperty(owner, key, {...numericDescriptors[i], value: function () {
            throw new Error('Mutable numeric intrinsic reached');
          }});
        }
        numericResults = [
          Temporal.Duration.from('-PT1H').abs().hours,
          new Temporal.Instant(0n).until(new Temporal.Instant(1000000000n), {smallestUnit: 'second'}).seconds,
          Temporal.PlainTime.from({hour: 25}).hour,
          new Temporal.PlainDate(2024.9, 2.9, 29.9).toString(),
          Temporal.PlainDate.from('2024-02-29').until('2024-01-29', {largestUnit: 'month'}).months,
          Temporal.PlainDate.from({calendar: 'hebrew', year: 5784, monthCode: 'M05L', day: 1}).monthCode,
          new Temporal.Instant(1n).round({smallestUnit: 'second', roundingIncrement: 1}).epochNanoseconds,
          new Temporal.Instant(-1n).toString(),
          new Temporal.Instant(1n).add({nanoseconds: 1}).epochNanoseconds,
        ];
      } finally {
        for (let i = numericBindings.length - 1; i >= 0; i--) {
          const [owner, key] = numericBindings[i];
          Object.defineProperty(owner, key, numericDescriptors[i]);
        }
      }
      check(numericResults.join('|') === '1|1|23|2024-02-29|-1|M05L|0|1969-12-31T23:59:59.999999999Z|2');
      for (const text of ['+999999-01-01T00:00[UTC]', '+999999-01-01[UTC]',
                          '-271821-04-19T00:00[UTC]', '+275760-09-14T00:00[UTC]']) {
        const reads = [];
        let rejected = false;
        try {
          Temporal.ZonedDateTime.from(text, {
            get disambiguation() { reads.push('disambiguation'); return 'compatible'; },
            get offset() { reads.push('offset'); return 'reject'; },
            get overflow() { reads.push('overflow'); return 'constrain'; },
          });
        } catch (error) { rejected = error instanceof RangeError; }
        check(rejected && reads.join('|') === 'disambiguation|offset|overflow');
      }
      const zonedOptionFailure = {};
      let zonedOptionCaught;
      try {
        Temporal.ZonedDateTime.from('+999999-01-01T00:00[UTC]', {
          get overflow() { throw zonedOptionFailure; },
        });
      } catch (error) { zonedOptionCaught = error; }
      check(zonedOptionCaught === zonedOptionFailure);
      for (const [later, earlier] of [
        ['01:00:00', '00:59:59.999999999'],
        ['00:01:00', '00:00:59.999999999'],
        ['00:00:01', '00:00:00.999999999'],
        ['00:00:00.001', '00:00:00.000999999'],
        ['00:00:00.000001', '00:00:00.000000999'],
        ['00:00:00.000000001', '00:00:00'],
      ]) {
        check(Temporal.PlainTime.compare(later, earlier) === 1);
        check(Temporal.PlainTime.compare(earlier, later) === -1);
        check(Object.is(Temporal.PlainTime.compare(later, later), 0));
      }
      check(Temporal.PlainDate.compare('0000-01-01', '-000001-12-31') === 1);
      check(Temporal.PlainDateTime.compare('2000-03-01T00:00', '2000-02-29T23:59:59.999999999') === 1);
      check(Temporal.Instant.compare(new Temporal.Instant(-1n), new Temporal.Instant(0n)) === -1);
      check(Temporal.ZonedDateTime.compare(new Temporal.ZonedDateTime(0n, '+23:00', 'hebrew'), new Temporal.ZonedDateTime(1n, '-23:00')) === -1);
      const clockInitial = new Temporal.PlainTime(12, 34, 56, 123, 456, 789);
      for (const [owner, key] of [
        [Array.prototype, 'map'], [Array.prototype, Symbol.iterator],
        [Object.getPrototypeOf([][Symbol.iterator]()), 'next'],
        [Array.prototype, 'constructor'],
      ]) {
        const original = Object.getOwnPropertyDescriptor(owner, key);
        let actual;
        try {
          Object.defineProperty(owner, key, {configurable: true, get() {
            throw new Error('Private clock array hook reached');
          }});
          actual = [new Temporal.PlainTime(12, 34, 56, 123, 456, 789).nanosecond,
            Temporal.PlainTime.from({hour: 12, minute: 34}).minute,
            clockInitial.with({minute: 59}).second, clockInitial.microsecond];
        } finally { Object.defineProperty(owner, key, original); }
        check(actual[0] === 789 && actual[1] === 34 && actual[2] === 56 && actual[3] === 456);
      }
      for (const [name, maximum] of [['hour', 23], ['minute', 59], ['second', 59],
        ['millisecond', 999], ['microsecond', 999], ['nanosecond', 999]]) {
        for (const input of [-Number.MAX_VALUE, -1e100, 1e100, Number.MAX_VALUE]) {
          check(Temporal.PlainTime.from({[name]: input})[name] === (input < 0 ? 0 : maximum));
          let caught;
          try { Temporal.PlainTime.from({[name]: input}, {overflow: 'reject'}); }
          catch (error) { caught = error; }
          check(caught instanceof RangeError);
        }
      }
      const privateConstructors = [
        ['Instant', [0n]], ['ZonedDateTime', [0n, 'UTC']],
        ['PlainDate', [2024, 2, 29]], ['PlainDateTime', [2024, 2, 29]],
        ['PlainYearMonth', [2024, 2]], ['PlainMonthDay', [2, 29]],
        ['PlainTime', []], ['Duration', []],
      ];
      for (const trap of ['get', 'apply']) {
        for (const [name, args] of privateConstructors) {
          const Constructor = Temporal[name], prototype = Constructor.prototype;
          const original = Object.getOwnPropertyDescriptor(Object.prototype, trap);
          const restore = original && Object.assign(Object.create(null), original);
          let value, caught;
          try {
            Object.defineProperty(Object.prototype, trap, {configurable: true, get() {
              throw new Error('Inherited private Proxy trap reached');
            }});
            if (trap === 'get') value = Reflect.construct(Constructor, args);
            else Reflect.apply(Constructor, undefined, args);
          } catch (error) { caught = error; }
          finally {
            if (restore) Object.defineProperty(Object.prototype, trap, restore);
            else Reflect.deleteProperty(Object.prototype, trap);
          }
          check(trap === 'get' ? caught === undefined && Object.getPrototypeOf(value) === prototype : caught instanceof TypeError);
        }
      }
      for (const [name] of privateConstructors) {
        const original = Object.getOwnPropertyDescriptor(Array.prototype, '0');
        const length = Object.getOwnPropertyDescriptor(Array.prototype, 'length');
        let value, caught;
        try {
          Object.defineProperty(Array.prototype, '0', {configurable: true, get() {
            throw new Error('Inherited private argument reached');
          }});
          value = Reflect.construct(Temporal[name], []);
        } catch (error) { caught = error; }
        finally {
          if (original) Object.defineProperty(Array.prototype, '0', original);
          else Reflect.deleteProperty(Array.prototype, '0');
          Object.defineProperty(Array.prototype, 'length', length);
        }
        if (name === 'PlainTime') check(caught === undefined && value.hour === 0);
        else if (name === 'Duration') check(caught === undefined && value.years === 0);
        else check(caught instanceof (name === 'Instant' || name === 'ZonedDateTime' ? TypeError : RangeError));
      }
      const inheritedMinute = Object.getOwnPropertyDescriptor(Object.prototype, 'minute');
      let privateDate;
      try {
        Object.defineProperty(Object.prototype, 'minute', {configurable: true, get() {
          throw new Error('Inherited private clock field reached');
        }});
        privateDate = new Temporal.PlainDate(2024, 2, 29).toString();
      } finally {
        if (inheritedMinute) Object.defineProperty(Object.prototype, 'minute', inheritedMinute);
        else Reflect.deleteProperty(Object.prototype, 'minute');
      }
      check(privateDate === '2024-02-29');
      const listEvery = Array.prototype.every, listSome = Array.prototype.some, listApply = Reflect.apply;
      const listIncludes = Array.prototype.includes, listIndexOf = Array.prototype.indexOf;
      const listPoison = function () { throw new Error('Mutable array predicate reached'); };
      let listResults;
      try {
        Array.prototype.every = listPoison;
        Array.prototype.some = listPoison;
        Array.prototype.includes = listPoison;
        Array.prototype.indexOf = listPoison;
        Reflect.apply = listPoison;
        listResults = [
          new Temporal.PlainDateTime(2000, 2, 29, 12, 34, 56).toString(),
          Temporal.Duration.from('P1DT2H').toString(),
          Temporal.Duration.compare({hours: 2}, {hours: 2}),
          new Temporal.PlainDate(2000, 1, 31).add({months: 1}).day,
        ];
      } finally {
        Array.prototype.every = listEvery;
        Array.prototype.some = listSome;
        Array.prototype.includes = listIncludes;
        Array.prototype.indexOf = listIndexOf;
        Reflect.apply = listApply;
      }
      check(listResults.join('|') === '2000-02-29T12:34:56|P1DT2H|0|29');
      for (const partial of [false, true]) {
        const clockEvents = [];
        const input = new Proxy({}, {
          has() { throw new Error('Unexpected time HasProperty'); },
          ownKeys() { throw new Error('Unexpected time enumeration'); },
          get(target, key) {
            if (key === 'calendar' || key === 'timeZone') return undefined;
            clockEvents.push('get ' + key);
            return {[Symbol.toPrimitive](hint) {
              clockEvents.push('coerce ' + key + ' ' + hint);
              return 1.9;
            }};
          }
        });
        const options = {get overflow() { clockEvents.push('overflow'); return 'reject'; }};
        const clockResult = partial ? new Temporal.PlainTime(12).with(input, options)
          : Temporal.PlainTime.from(input, options);
        check(clockResult.toJSON() === '01:01:01.001001001');
        check(clockEvents.join('|') ===
          'get hour|coerce hour number|get microsecond|coerce microsecond number|' +
          'get millisecond|coerce millisecond number|get minute|coerce minute number|' +
          'get nanosecond|coerce nanosecond number|get second|coerce second number|overflow');
        const clockOrder = ['hour', 'microsecond', 'millisecond', 'minute', 'nanosecond', 'second'];
        for (let stop = 0; stop < clockOrder.length; stop++) {
          for (const stage of ['get', 'coerce']) {
            const events = [], failure = {};
            const abruptInput = new Proxy({}, {get(target, key) {
              if (key === 'calendar' || key === 'timeZone') return undefined;
              events.push('get ' + key);
              if (key === clockOrder[stop] && stage === 'get') throw failure;
              return {[Symbol.toPrimitive](hint) {
                events.push('coerce ' + key + ' ' + hint);
                if (key === clockOrder[stop]) throw failure;
                return 1;
              }};
            }});
            let caught;
            try {
              const abruptOptions = {get overflow() { throw new Error('Unexpected time options'); }};
              if (partial) new Temporal.PlainTime(12).with(abruptInput, abruptOptions);
              else Temporal.PlainTime.from(abruptInput, abruptOptions);
            } catch (error) { caught = error; }
            check(caught === failure);
            const expected = [];
            for (let index = 0; index <= stop; index++) {
              expected.push('get ' + clockOrder[index]);
              if (index < stop || stage === 'coerce') expected.push('coerce ' + clockOrder[index] + ' number');
            }
            check(events.join('|') === expected.join('|'));
          }
        }
        const missing = [], empty = new Proxy({}, {get(target, key) {
          if (key !== 'calendar' && key !== 'timeZone') missing.push(key);
          return undefined;
        }});
        let emptyFailure;
        try {
          const emptyOptions = {get overflow() { throw new Error('Unexpected empty time options'); }};
          if (partial) new Temporal.PlainTime(12).with(empty, emptyOptions);
          else Temporal.PlainTime.from(empty, emptyOptions);
        } catch (error) { emptyFailure = error; }
        check(emptyFailure instanceof TypeError && missing.join('|') === clockOrder.join('|'));
        const zeroTime = partial ? new Temporal.PlainTime(12, 34).with({hour: -0.9})
          : Temporal.PlainTime.from({hour: -0.9});
        check(zeroTime.toJSON() === (partial ? '00:34:00' : '00:00:00'));
      }
      for (const [name, complete, partial] of [
        ['hour', '01:00:00', '01:34:56.123456789'],
        ['minute', '00:01:00', '12:01:56.123456789'],
        ['second', '00:00:01', '12:34:01.123456789'],
        ['millisecond', '00:00:00.001', '12:34:56.001456789'],
        ['microsecond', '00:00:00.000001', '12:34:56.123001789'],
        ['nanosecond', '00:00:00.000000001', '12:34:56.123456001'],
      ]) {
        const inherited = Object.create({[name]: 1.9});
        check(Temporal.PlainTime.from(inherited).toJSON() === complete);
        check(new Temporal.PlainTime(12, 34, 56, 123, 456, 789).with(inherited).toJSON() === partial);
      }
      const unitInstant = new Temporal.Instant(90000000000n);
      const unitTime = new Temporal.PlainTime(12, 34, 45);
      const unitDateTime = new Temporal.PlainDateTime(2000, 1, 2, 12, 34, 45);
      const unitZoned = Temporal.ZonedDateTime.from('2000-01-02T12:34:45Z[UTC]');
      const unitDuration = new Temporal.Duration(0, 0, 0, 0, 1, 30);
      const unitAssign = Object.getOwnPropertyDescriptor(Object, 'assign');
      const unitNames = ['smallestUnit', 'unit', 'largestUnit', 'relativeTo', 'roundingMode', 'roundingIncrement'];
      const unitDescriptors = unitNames.map(name => Object.getOwnPropertyDescriptor(Object.prototype, name));
      let unitResults;
      try {
        Object.defineProperty(Object, 'assign', {configurable: true, get() {
          throw new Error('Mutable string-unit Object.assign reached');
        }});
        for (const name of unitNames) Object.defineProperty(Object.prototype, name, {
          configurable: true,
          get() { throw new Error('Inherited string-unit option Get ' + name); },
          set() { throw new Error('Inherited string-unit option Set ' + name); },
        });
        unitResults = [
          unitInstant.round('minute').epochNanoseconds,
          unitTime.round('minute').toJSON(),
          unitDateTime.round('minute').toJSON(),
          unitZoned.round('minute').epochNanoseconds,
          unitDuration.round('hour').toJSON(),
          unitDuration.total('minute'),
        ];
      } finally {
        Object.defineProperty(Object, 'assign', unitAssign);
        for (let index = 0; index < unitNames.length; index++) {
          if (unitDescriptors[index]) Object.defineProperty(Object.prototype, unitNames[index], unitDescriptors[index]);
          else Reflect.deleteProperty(Object.prototype, unitNames[index]);
        }
      }
      check(unitResults.join('|') === '120000000000|12:35:00|2000-01-02T12:35:00|946816500000000000|PT2H|90');
      const coercionKey = Symbol.toPrimitive;
      const coercionInput = {[coercionKey](hint) {
        if (hint !== 'number') throw new Error('Wrong Instant hint');
        return 0n;
      }};
      const coercionOverflow = {[coercionKey](hint) {
        if (hint !== 'string') throw new Error('Wrong option hint');
        return 'reject';
      }};
      const coercionApply = Reflect.apply, coercionSymbol = Symbol, coercionString = String;
      let coercedInstant, coercedDate;
      const coercionPoison = function () { throw new Error('Mutable coercion global reached'); };
      try {
        Reflect.apply = coercionPoison;
        Reflect.set(globalThis, 'Symbol', coercionPoison);
        Reflect.set(globalThis, 'String', coercionPoison);
        coercedInstant = new Temporal.Instant(coercionInput);
        coercedDate = Temporal.PlainDate.from('2020-02-29', {overflow: coercionOverflow});
      } finally {
        Reflect.apply = coercionApply;
        Reflect.set(globalThis, 'Symbol', coercionSymbol);
        Reflect.set(globalThis, 'String', coercionString);
      }
      check(coercedInstant.epochNanoseconds === 0n && coercedDate.day === 29);
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
