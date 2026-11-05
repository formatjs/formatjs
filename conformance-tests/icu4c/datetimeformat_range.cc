#include <unicode/dtitvfmt.h>
#include <unicode/dtintrv.h>
#include <unicode/timezone.h>
#include <unicode/uvernum.h>
#include <unicode/udat.h>
#include <unicode/formattedvalue.h>

#include <algorithm>
#include <stdexcept>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

std::string json(const std::string &value) {
  std::string result = "\"";
  const char *hex = "0123456789abcdef";
  for (unsigned char ch : value) {
    if (ch == '\\' || ch == '"') result += std::string("\\") + char(ch);
    else if (ch < 32) { result += "\\u00"; result += hex[ch >> 4]; result += hex[ch & 15]; }
    else result += char(ch);
  }
  return result + "\"";
}

std::string kind(int32_t field, bool cyclic) {
  switch (field) {
    case UDAT_ERA_FIELD: return "era";
    case UDAT_YEAR_FIELD:
    case UDAT_YEAR_WOY_FIELD:
    case UDAT_EXTENDED_YEAR_FIELD: return cyclic ? "yearName" : "year";
    case UDAT_YEAR_NAME_FIELD: return "yearName";
    case UDAT_RELATED_YEAR_FIELD: return "relatedYear";
    case UDAT_MONTH_FIELD:
    case UDAT_STANDALONE_MONTH_FIELD: return "month";
    case UDAT_DATE_FIELD: return "day";
    case UDAT_DAY_OF_WEEK_FIELD:
    case UDAT_DOW_LOCAL_FIELD:
    case UDAT_STANDALONE_DAY_FIELD: return "weekday";
    case UDAT_HOUR_OF_DAY1_FIELD:
    case UDAT_HOUR_OF_DAY0_FIELD:
    case UDAT_HOUR1_FIELD:
    case UDAT_HOUR0_FIELD: return "hour";
    case UDAT_MINUTE_FIELD: return "minute";
    case UDAT_SECOND_FIELD: return "second";
    case UDAT_FRACTIONAL_SECOND_FIELD: return "fractionalSecond";
    case UDAT_AM_PM_FIELD:
    case UDAT_AM_PM_MIDNIGHT_NOON_FIELD:
    case UDAT_FLEXIBLE_DAY_PERIOD_FIELD: return "dayPeriod";
    case UDAT_TIMEZONE_FIELD:
    case UDAT_TIMEZONE_RFC_FIELD:
    case UDAT_TIMEZONE_GENERIC_FIELD:
    case UDAT_TIMEZONE_SPECIAL_FIELD:
    case UDAT_TIMEZONE_LOCALIZED_GMT_OFFSET_FIELD:
    case UDAT_TIMEZONE_ISO_FIELD:
    case UDAT_TIMEZONE_ISO_LOCAL_FIELD: return "timeZoneName";
    case UDAT_TIME_SEPARATOR_FIELD: return "literal";
    default: throw std::runtime_error("Unmapped ICU date field " + std::to_string(field));
  }
}

std::string parts(const icu::FormattedDateInterval &formatted,
                  const icu::UnicodeString &text, bool cyclic,
                  UErrorCode &status) {
  std::vector<std::string> kinds(text.length(), "literal"), sources(text.length(), "shared");
  icu::ConstrainedFieldPosition position;
  while (formatted.nextPosition(position, status)) {
    if (position.getCategory() == UFIELD_CATEGORY_DATE_INTERVAL_SPAN)
      std::fill(sources.begin() + position.getStart(), sources.begin() + position.getLimit(),
                position.getField() == 0 ? "startRange" : "endRange");
    else if (position.getCategory() == UFIELD_CATEGORY_DATE)
      std::fill(kinds.begin() + position.getStart(), kinds.begin() + position.getLimit(), kind(position.getField(), cyclic));
  }
  std::string result = "[";
  for (int32_t i = 0; i < text.length();) {
    int32_t j = i + 1;
    while (j < text.length() && kinds[j] == kinds[i] && sources[j] == sources[i]) ++j;
    std::string value;
    text.tempSubStringBetween(i, j).toUTF8String(value);
    if (i) result += ",";
    result += "{\"type\":" + json(kinds[i]) + ",\"value\":" + json(value) + ",\"source\":" + json(sources[i]) + "}";
    i = j;
  }
  return result + "]";
}

int main(int argc, char **argv) {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79);
  const bool audit = argc == 2;
  const char *path = audit ? argv[1] : std::getenv("DATETIMEFORMAT_FIXTURES");
  if (!path) return 1;
  std::ifstream input(path);
  if (!input) return 1;
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    std::istringstream fields(row);
    std::vector<std::string> values;
    for (std::string value; std::getline(fields, value, '\t');)
      values.push_back(value);
    if (values.size() != 11) return 1;
    if (values[5].empty()) continue;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(values[2], status);
    std::unique_ptr<icu::DateIntervalFormat> formatter(
        icu::DateIntervalFormat::createInstance(
            icu::UnicodeString::fromUTF8(values[3]), locale, status));
    if (U_FAILURE(status) || !formatter) return 1;
    const std::string prefix = "\"timeZone\":\"";
    auto start = values[1].find(prefix);
    if (start == std::string::npos) return 1;
    start += prefix.size();
    auto end = values[1].find('"', start);
    formatter->adoptTimeZone(icu::TimeZone::createTimeZone(
        icu::UnicodeString::fromUTF8(values[1].substr(start, end - start))));
    icu::DateInterval interval(std::stod(values[4]), std::stod(values[5]));
    auto formatted = formatter->formatToValue(interval, status);
    auto text = formatted.toString(status);
    std::string actual;
    text.toUTF8String(actual);
    auto actualParts = parts(formatted, text, values[3].find('U') != std::string::npos, status);
    if (audit && U_SUCCESS(status)) {
      for (size_t i = 0; i < 6; ++i) std::cout << values[i] << '\t';
      std::cout << actual << '\t' << actualParts << '\n';
    } else if (U_FAILURE(status) || actual != values[8]) {
      std::cerr << "ICU4C range differs from ICU4J: " << u_errorName(status)
                << ": " << values[0] << ", " << values[3]
                << "; expected: " << values[8] << "; actual: " << actual << '\n';
      return 1;
    }
    ++checked;
  }
  if (audit) return checked > 0 ? 0 : 1;
  std::cout << checked << " ICU4C 79 ranges match ICU4J\n";
  return checked == 145 ? 0 : 1;
}
