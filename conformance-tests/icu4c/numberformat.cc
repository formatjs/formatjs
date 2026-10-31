#include <unicode/numberformatter.h>
#include <unicode/numberrangeformatter.h>
#include <unicode/fmtable.h>
#include <unicode/uvernum.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

static icu::Formattable number(const std::string &text, UErrorCode &status) {
  if (text == "-0" || text == "NaN" || text == "Infinity" || text == "-Infinity")
    return icu::Formattable(std::stod(text));
  icu::Formattable result;
  result.setDecimalNumber(icu::StringPiece(text), status);
  return result;
}

int main(int argc, char **argv) {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79);
  if (argc != 3) return 1;
  std::ifstream input(argv[1]);
  std::ofstream output(argv[2]);
  if (!input || !output) return 1;
  output << "locale\toptions\tskeleton\tstart\tend\ttext\n";
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> f;
    for (std::string value; std::getline(fields, value, '\t');) f.push_back(value);
    if (f.size() != 7) return 1;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(f[0], status);
    auto formatter = icu::number::NumberFormatter::forSkeleton(icu::UnicodeString::fromUTF8(f[2]), status);
    icu::UnicodeString text;
    if (f[4].empty()) {
      text = formatter.locale(locale).formatDecimal(icu::StringPiece(f[3]), status).toString(status);
    } else {
      auto start = number(f[3], status);
      auto end = number(f[4], status);
      auto single = formatter.locale(locale);
      auto startText = single.formatDecimal(icu::StringPiece(f[3]), status).toString(status);
      auto endText = single.formatDecimal(icu::StringPiece(f[4]), status).toString(status);
      if (startText == endText) end = start;
      text = icu::number::NumberRangeFormatter::withLocale(locale)
        .numberFormatterBoth(formatter)
        .collapse(UNUM_RANGE_COLLAPSE_AUTO)
        .identityFallback(UNUM_IDENTITY_FALLBACK_APPROXIMATELY)
        .formatFormattableRange(start, end, status)
        .toString(status);
    }
    std::string actual;
    text.toUTF8String(actual);
    if (U_FAILURE(status)) {
      std::cerr << "ICU4C NumberFormat: " << u_errorName(status) << ": " << row
                << "; actual: " << actual << '\n';
      return 1;
    }
    output << f[0] << '\t' << f[1] << '\t' << f[2] << '\t' << f[3] << '\t' << f[4] << '\t' << actual << '\n';
    ++checked;
  }
  std::cout << checked << " ICU4C 79 NumberFormat fixtures\n";
  return checked > 14000 ? 0 : 1;
}
