#include <unicode/numberformatter.h>
#include <unicode/uvernum.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79);
  const char *path = std::getenv("PRECISION_FIXTURES");
  if (!path) return 1;
  std::ifstream input(path);
  if (!input) return 1;
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> values;
    for (std::string value; std::getline(fields, value, '\t');) values.push_back(value);
    if (values.size() != 6) return 1;
    UErrorCode status = U_ZERO_ERROR;
    auto formatter = icu::number::NumberFormatter::forSkeleton(
        icu::UnicodeString::fromUTF8(values[4]), status).locale(icu::Locale::getEnglish());
    auto formatted = formatter.formatDecimal(icu::StringPiece(values[0]), status).toString(status);
    std::string actual;
    formatted.toUTF8String(actual);
    if (U_FAILURE(status) || actual != values[5]) {
      std::cerr << row << "; actual=" << actual << "; " << u_errorName(status) << '\n';
      return 1;
    }
    ++checked;
  }
  std::cout << checked << " ICU4C 79 precision cases\n";
  return checked == 27 ? 0 : 1;
}
