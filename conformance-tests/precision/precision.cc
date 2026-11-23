#include <unicode/numberformatter.h>
#include <unicode/plurrule.h>
#include <memory>
#include <unicode/uvernum.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79);
  size_t checked = 0;
  for (const char *key : {"PRECISION_FIXTURES", "PUBLIC_PRECISION_FIXTURES"}) {
    const char *path = std::getenv(key);
    if (!path) return 1;
    std::ifstream input(path);
    if (!input) return 1;
    std::string row;
    std::getline(input, row);
    while (std::getline(input, row)) {
      std::istringstream fields(row);
      std::vector<std::string> values;
      for (std::string value; std::getline(fields, value, '\t');) values.push_back(value);
      if (values.size() != 7) return 1;
      UErrorCode status = U_ZERO_ERROR;
      auto formatter = icu::number::NumberFormatter::forSkeleton(
          icu::UnicodeString::fromUTF8(values[4]), status).locale(icu::Locale::getEnglish());
      auto formatted = formatter.formatDecimal(icu::StringPiece(values[0]), status);
      std::string actual;
      formatted.toString(status).toUTF8String(actual);
      if (U_FAILURE(status) || actual != values[5]) {
        std::cerr << row << "; actual=" << actual << "; " << u_errorName(status) << '\n';
        return 1;
      }
      if (values[6] != "-") {
        std::unique_ptr<icu::PluralRules> rules(icu::PluralRules::forLocale(icu::Locale::getEnglish(), status));
        if (U_FAILURE(status) || !rules) return 1;
        std::string category;
        rules->select(formatted, status).toUTF8String(category);
        if (U_FAILURE(status) || category != values[6]) {
          std::cerr << "Plural operands: " << row << "; actual=" << category << '\n';
          return 1;
        }
      }
      ++checked;
    }
  }
  std::cout << checked << " ICU4C 79 precision cases\n";
  return checked == 44 ? 0 : 1;
}
