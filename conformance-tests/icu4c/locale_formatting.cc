#include <unicode/listformatter.h>
#include <unicode/measfmt.h>
#include <unicode/measure.h>
#include <unicode/measunit.h>
#include <unicode/plurrule.h>
#include <unicode/numberformatter.h>
#include <unicode/numberrangeformatter.h>
#include <unicode/reldatefmt.h>
#include <unicode/smpdtfmt.h>
#include <unicode/timezone.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

static std::string utf8(const icu::UnicodeString &value) {
  std::string result;
  value.toUTF8String(result);
  return result;
}

static icu::UnicodeString unhex(const std::string &value) {
  icu::UnicodeString result;
  if (value == "_") return result;
  for (size_t i = 0; i < value.size(); i += 4)
    result.append(static_cast<UChar>(std::stoul(value.substr(i, 4), nullptr, 16)));
  return result;
}

static std::string hex(const icu::UnicodeString &text) {
  if (text.isEmpty()) return "_";
  std::ostringstream out;
  for (int32_t i = 0; i < text.length(); ++i)
    out << std::hex << std::setfill('0') << std::setw(4) << static_cast<uint16_t>(text[i]);
  return out.str();
}

static bool checkLists(const char *path) {
  if (!path) return false;
  std::ifstream input(path);
  if (!input) return false;
  std::string row;
  std::getline(input, row);
  size_t checks = 0;
  bool matches = true;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> values;
    for (std::string value; std::getline(fields, value, '\t');) values.push_back(value);
    if (values.size() != 6) return false;
    auto type = values[1] == "conjunction" ? ULISTFMT_TYPE_AND : values[1] == "disjunction" ? ULISTFMT_TYPE_OR : ULISTFMT_TYPE_UNITS;
    auto width = values[2] == "long" ? ULISTFMT_WIDTH_WIDE : values[2] == "short" ? ULISTFMT_WIDTH_SHORT : ULISTFMT_WIDTH_NARROW;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(values[0], status);
    std::unique_ptr<icu::ListFormatter> formatter(icu::ListFormatter::createInstance(locale, type, width, status));
    if (U_FAILURE(status) || !formatter) return false;
    std::vector<icu::UnicodeString> items;
    if (values[3] != "-") {
      std::istringstream encoded(values[3]);
      for (std::string item; std::getline(encoded, item, ',');) items.push_back(unhex(item));
    }
    icu::UnicodeString actual;
    formatter->format(items.data(), static_cast<int32_t>(items.size()), actual, status);
    if (U_FAILURE(status) || actual != unhex(values[5])) {
      std::cerr << "ICU4C list mismatch: " << row << '\t' << hex(actual) << '\n';
      matches = false;
    }
    ++checks;
  }
  std::cout << checks << " ICU4C list checks passed (ICU4J differences pinned)\n";
  return checks == 3168 && matches;
}

static bool checkPlurals(const char *path) {
  if (!path) return false;
  std::ifstream input(path);
  if (!input) return false;
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> values;
    for (std::string value; std::getline(fields, value, '\t');) values.push_back(value);
    if (values.size() != 4) return false;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(values[0], status);
    auto type = values[1] == "cardinal" ? UPLURAL_TYPE_CARDINAL : UPLURAL_TYPE_ORDINAL;
    std::unique_ptr<icu::PluralRules> rules(icu::PluralRules::forLocale(locale, type, status));
    auto formatted = icu::number::NumberFormatter::withLocale(locale)
        .precision(icu::number::Precision::minMaxFraction(0, 3))
        .roundingMode(UNUM_ROUND_HALFUP).formatDouble(std::stod(values[2]), status);
    if (U_FAILURE(status) || !rules || utf8(rules->select(formatted, status)) != values[3]) {
      std::cerr << "ICU4C/ICU4J plural mismatch: " << row << '\n';
      return false;
    }
    ++checked;
  }
  std::cout << checked << " ICU4C/ICU4J plural checks passed\n";
  return checked == 720;
}

static bool checkPluralRanges(const char *path) {
  if (!path) return false;
  std::ifstream input(path);
  if (!input) return false;
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> values;
    for (std::string value; std::getline(fields, value, '\t');) values.push_back(value);
    if (values.size() != 5) return false;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(values[0], status);
    std::unique_ptr<icu::PluralRules> rules(icu::PluralRules::forLocale(locale, UPLURAL_TYPE_CARDINAL, status));
    auto formatted = icu::number::NumberRangeFormatter::withLocale(locale)
        .numberFormatterBoth(icu::number::NumberFormatter::with().precision(icu::number::Precision::minMaxFraction(0, 3)).roundingMode(UNUM_ROUND_HALFUP))
        .identityFallback(UNUM_IDENTITY_FALLBACK_SINGLE_VALUE)
        .formatFormattableRange(icu::Formattable(std::stod(values[1])), icu::Formattable(std::stod(values[2])), status);
    if (U_FAILURE(status) || !rules || utf8(rules->select(formatted, status)) != values[3]) {
      std::cerr << "ICU4C/ICU4J plural range mismatch: " << row << '\n';
      return false;
    }
    auto ecma = rules->select(formatted, status);
    if (values[1] == values[2]) {
      auto single = icu::number::NumberFormatter::withLocale(locale)
          .precision(icu::number::Precision::minMaxFraction(0, 3))
          .roundingMode(UNUM_ROUND_HALFUP).formatDouble(std::stod(values[1]), status);
      ecma = rules->select(single, status);
    }
    if (U_FAILURE(status) || utf8(ecma) != values[4]) {
      std::cerr << "ICU4C/ICU4J ECMA plural range mismatch: " << row << '\n';
      return false;
    }
    ++checked;
  }
  std::cout << checked << " ICU4C/ICU4J plural range checks passed\n";
  return checked == 224;
}

int main() {
  if (!checkLists(std::getenv("LIST_FORMAT_FIXTURES"))) return 1;
  if (!checkPlurals(std::getenv("PLURAL_RULES_FIXTURES"))) return 1;
  if (!checkPluralRanges(std::getenv("PLURAL_RANGE_FIXTURES"))) return 1;
  const char *path = std::getenv("LOCALE_FORMAT_FIXTURES");
  if (!path) return 1;
  std::ifstream input(path);
  if (!input) return 1;
  std::string row;
  std::getline(input, row);
  size_t checks = 0;
  while (std::getline(input, row)) {
    if (row.empty()) continue;
    std::istringstream fields(row);
    std::vector<std::string> expected;
    for (std::string field; std::getline(fields, field, '\t');)
      expected.push_back(field);
    if (expected.size() != 7) return 1;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(expected[0], status);
    std::unique_ptr<icu::ListFormatter> list(icu::ListFormatter::createInstance(locale, status));
    if (U_FAILURE(status) || !list) return 1;
    icu::UnicodeString items[] = {"A", "B", "C"};
    icu::UnicodeString list_result, week, quarter, region, day, hour;
    list->format(items, 3, list_result, status);
    icu::RelativeDateTimeFormatter relative(locale, status);
    relative.formatNumeric(-3, UDAT_REL_UNIT_WEEK, week, status);
    relative.formatNumeric(-3, UDAT_REL_UNIT_QUARTER, quarter, status);
    icu::Locale("und", "US").getDisplayCountry(locale, region);
    icu::SimpleDateFormat date("EEE", locale, status);
    date.adoptTimeZone(icu::TimeZone::createTimeZone("UTC"));
    date.format(0, day);
    icu::Measure measure(3, icu::MeasureUnit::createHour(status), status);
    icu::MeasureFormat format(locale, UMEASFMT_WIDTH_WIDE, status);
    icu::FieldPosition position(0);
    format.formatMeasures(&measure, 1, hour, position, status);
    if (U_FAILURE(status)) {
      std::cerr << u_errorName(status) << '\n';
      return 1;
    }
    std::vector<std::string> actual = {expected[0], utf8(list_result), utf8(week), utf8(quarter), utf8(region), utf8(day), utf8(hour)};
    if (actual != expected) {
      std::cerr << "ICU4C mismatch: " << row << '\n';
      for (const auto &value : actual) std::cerr << value << '\t';
      std::cerr << '\n';
      return 1;
    }
    checks += 6;
  }
  if (!checks) return 1;
  std::cout << checks << " ICU4C " << U_ICU_VERSION << " locale formatting checks passed\n";
}
