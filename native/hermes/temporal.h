#pragma once

#include <jsi/jsi.h>
#include <functional>
#include <string>

namespace formatjs {

struct TemporalHost {
  // Current system IANA identifier, queried for each default-zone operation.
  std::function<std::string()> timeZoneId;
  // Optional decimal nanoseconds since Unix epoch; defaults to wall clock.
  std::function<std::string()> epochNanoseconds;
};

// Install once per runtime, after Intl, on the JavaScript thread.
void installTemporal(facebook::jsi::Runtime &runtime, TemporalHost host);

} // namespace formatjs
