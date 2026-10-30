#include <formatjs/hermes/intl_datetimeformat.h>
#include <formatjs/hermes/canonical_locales.h>
#include <hermes/hermes.h>
#include <jsi/instrumentation.h>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <iterator>
#include <string>
#include <thread>

namespace jsi = facebook::jsi;
static void check(bool value) { if (!value) std::abort(); }
static jsi::Value evaluate(jsi::Runtime &rt, std::string source) {
  return rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(std::move(source)), "datetimeformat-bridge-test");
}
int main(int argc, char **argv) {
  check(argc == 2);
  auto runtime = facebook::hermes::makeHermesRuntime();
  auto &rt = *runtime;
  try {
    jsi::Object extensions(rt);
    extensions.setProperty(rt, "IntlDateTimeFormat", evaluate(rt, "(function(native) { globalThis.bridge = native; })"));
    auto installation = formatjs::installDateTimeFormat(rt, extensions);
    std::ifstream file(argv[1]);
    check(bool(file));
    std::string pack((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    rt.global().setProperty(rt, "packJson", jsi::String::createFromUtf8(rt, pack));
    evaluate(rt, R"JS(
      function check(value) { if (!value) throw new Error('DateTimeFormat bridge assertion'); }
      function success(status) { check(status === 0); }
      function construct(calendar) {
        var construction = bridge.nativeBegin();
        success(bridge.nativeResolve(construction, JSON.stringify({locales:['en'], options:{calendar:calendar, hourCycle:'h23'}})));
        success(bridge.nativeZone(construction, '"UTC"'));
        success(bridge.nativeCapture(construction, JSON.stringify({year:'numeric', month:'2-digit', day:'2-digit'})));
        var formatter = bridge.nativeCreate(construction, '{}');
        check(typeof formatter === 'object');
        bridge.nativeReleaseConstruction(construction);
        return formatter;
      }
      function query(formatter, operation) {
        return bridge.nativeQuery(formatter, JSON.stringify({op:operation || 'format', value:{type:'number',value:'0'}}));
      }
      success(bridge.nativeLoad(0, packJson));
      check(JSON.parse(bridge.nativeInfo()).default === 'en');
      var gregorian = construct('gregory');
      check(JSON.parse(query(gregorian)) === '01/01/1970');
      var source = JSON.parse(packJson);
      success(bridge.nativeLoad(1, JSON.stringify({locale:'en', calendar:'custom', data:source.data, formats:source.data.formats.gregory})));
      var fields = {era:'AD',year:2000,month:0,day:1};
      var sentinel = {message:'foreign exception'};
      var mode = 'normal', depth = 0, seen = [];
      var callback = function(milliseconds) {
        seen.push(milliseconds);
        if (mode === 'throw') throw sentinel;
        if (mode === 'nested') {
          if (depth) throw sentinel;
          depth++;
          var caught;
          try { query(custom); } catch (error) { caught = error; }
          depth--;
          check(caught === sentinel);
          check(JSON.parse(query(gregorian)) === '01/01/1970');
        }
        return JSON.stringify(fields);
      };
      success(bridge.nativeCalendar('custom', callback));
      var custom = construct('custom');
      check(JSON.parse(query(custom)) === '01/01/2000');
      mode = 'throw';
      var caught;
      try { query(custom); } catch (error) { caught = error; }
      check(caught === sentinel);
      mode = 'nested';
      check(JSON.parse(query(custom)) === '01/01/2000');
      mode = 'normal';
      check(JSON.parse(query(custom)) === '01/01/2000');
      check(seen.length === 5);
      check(bridge.nativeQuery(custom, '{"op":"format","value":{"type":"zoned"}}') === 4);
      check(bridge.nativeQuery(custom, '{"op":"format","value":{"type":"number","value":"NaN"}}') === 1);
      var wrongKind;
      try { bridge.nativeResolve(custom, '{}'); } catch (error) { wrongKind = error; }
      check(wrongKind instanceof Error);
      success(bridge.nativeLoadCalendar('{"calendar":"hebrew"}'));
      check(bridge.nativeLoadCalendar('{"calendar":"hebrew","data":true}') === 1);
    )JS");
    auto bridge = rt.global().getPropertyAsObject(rt, "bridge");
    auto ephemeral = bridge.getPropertyAsFunction(rt, "nativeBegin").call(rt);
    auto finalizer = ephemeral.asObject(rt).getHostObject<jsi::HostObject>(rt);
    std::weak_ptr<jsi::HostObject> weakFinalizer = finalizer;
    ephemeral = jsi::Value::undefined();
    rt.instrumentation().collectGarbage("DateTimeFormat finalizer ownership");
    check(finalizer.use_count() == 1);
    std::thread worker([record = std::move(finalizer)]() mutable { record.reset(); });
    worker.join();
    check(weakFinalizer.expired());
    bridge.getPropertyAsFunction(rt, "nativeInfo").call(rt);
    installation.reset();
    evaluate(rt, R"JS(
      var released;
      try { query(custom); } catch (error) { released = error; }
      check(released instanceof Error && released.message === 'DateTimeFormat installation released');
      callback = null; custom = null; gregorian = null; bridge = null;
    )JS");
    rt.instrumentation().collectGarbage("DateTimeFormat installation released");
    formatjs::installCanonicalLocales(rt);
    auto facade = formatjs::installDateTimeFormat(rt);
    evaluate(rt, R"JS(
      var Constructor = Intl.DateTimeFormat;
      Constructor.__addLocaleData(packJson);
      var source = JSON.parse(packJson);
      for (var name of ['customa', 'customb']) Constructor.__addCalendarLocaleData(JSON.stringify({locale:'en',calendar:name,data:source.data,formats:source.data.formats.gregory}));
      Constructor.__addCalendarData(
        {calendar:'customa',dateFromTime:function(){return {era:'AD',year:2001,month:0,day:1}}},
        {calendar:'customb',dateFromTime:function(){return {era:'AD',year:2002,month:0,day:1}}}
      );
      check(new Constructor('en',{calendar:'customa',timeZone:'UTC'}).format(0) === '1/1/2001');
      check(new Constructor('en',{calendar:'customb',timeZone:'UTC'}).format(0) === '1/1/2002');
    )JS");

    return 0;
  } catch (const jsi::JSError &error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
