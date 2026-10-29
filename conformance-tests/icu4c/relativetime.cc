#include <unicode/reldatefmt.h>
#include <unicode/decimfmt.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

int main() {
  const char *path = std::getenv("RELATIVE_TIME_DIFFERENCES");
  if (!path) return 1;
  std::ifstream input(path);
  if (!input) return 1;
  std::string row;
  std::getline(input, row);
  const std::map<std::string, URelativeDateTimeUnit> units = {
      {"second", UDAT_REL_UNIT_SECOND}, {"minute", UDAT_REL_UNIT_MINUTE},
      {"hour", UDAT_REL_UNIT_HOUR}, {"day", UDAT_REL_UNIT_DAY},
      {"week", UDAT_REL_UNIT_WEEK}, {"month", UDAT_REL_UNIT_MONTH},
      {"quarter", UDAT_REL_UNIT_QUARTER}, {"year", UDAT_REL_UNIT_YEAR}};
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> f;
    for (std::string value; std::getline(fields, value, '\t');) f.push_back(value);
    if (f.size() != 8 || f[6] == f[7]) return 1;
    UErrorCode status = U_ZERO_ERROR;
    auto tag = f[0] + (f[1] == "_" ? "" : "-u-nu-" + f[1]);
    auto locale = icu::Locale::forLanguageTag(tag, status);
    auto style = f[2] == "long" ? UDAT_STYLE_LONG : f[2] == "short" ? UDAT_STYLE_SHORT : UDAT_STYLE_NARROW;
    auto *number = dynamic_cast<icu::DecimalFormat *>(icu::NumberFormat::createInstance(locale, status));
    if (U_FAILURE(status) || !number) return 1;
    // ECMA-402 uses grouping "auto", rather than DecimalFormat's legacy default.
    number->setMinimumGroupingDigits(UNUM_MINIMUM_GROUPING_DIGITS_AUTO);
    number->setMinimumFractionDigits(0);
    number->setMaximumFractionDigits(3);
    icu::RelativeDateTimeFormatter formatter(locale, number, style, UDISPCTX_CAPITALIZATION_NONE, status);
    icu::UnicodeString output;
    if (f[3] == "always") formatter.formatNumeric(std::stod(f[5]), units.at(f[4]), output, status);
    else formatter.format(std::stod(f[5]), units.at(f[4]), output, status);
    std::string actual;
    output.toUTF8String(actual);
    if (U_FAILURE(status) || actual != f[6]) {
      std::cerr << "ICU4C relative-time mismatch: " << row << "; actual: " << actual << '\n';
      return 1;
    }
    ++checked;
  }
  std::cout << checked << " ICU4C relative-time differences verified\n";
  return checked == 1440 ? 0 : 1;
}
