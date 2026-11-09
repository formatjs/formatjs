#include <unicode/numberformatter.h>
#include <unicode/unistr.h>
#include <unicode/uvernum.h>

#include <iostream>
#include <string>

int main() {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79 && U_ICU_VERSION_MINOR_NUM == 1);
  const char* cases[][2] = {
      {"unit/fluid-ounce", "5 fl oz"},
      {"unit/kilometer-per-hour", "5 km/h"},
      {"unit/meter-per-second", "5 m/s"},
      {"measure-unit/volume-fluid-ounce", "5 fl oz"},
      {"measure-unit/speed-kilometer-per-hour", "5 km/h"},
  };
  for (const auto& test : cases) {
    UErrorCode status = U_ZERO_ERROR;
    auto formatter = icu::number::NumberFormatter::forSkeleton(
        icu::UnicodeString::fromUTF8(test[0]), status).locale(icu::Locale::getEnglish());
    std::string actual;
    formatter.formatInt(5, status).toString(status).toUTF8String(actual);
    if (U_FAILURE(status) || actual != test[1]) {
      std::cerr << test[0] << ": expected " << test[1] << ", got " << actual
                << "; " << u_errorName(status) << '\n';
      return 1;
    }
  }
}
