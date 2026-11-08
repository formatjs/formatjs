#include <unicode/msgfmt.h>
#include <unicode/unistr.h>
#include <unicode/uvernum.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int main(int argc, char** argv) {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 78 && U_ICU_VERSION_MINOR_NUM == 1);
  const char* path = argc > 1 ? argv[1] : std::getenv("MESSAGEFORMAT_ESCAPE_FIXTURES");
  if (!path) throw std::runtime_error("Missing escape fixtures");
  std::ifstream input(path);
  if (!input) throw std::runtime_error("Cannot read escape fixtures");
  std::string row;
  std::getline(input, row);
  int checked = 0;
  while (std::getline(input, row)) {
    std::vector<std::string> fields;
    size_t start = 0;
    while (true) {
      size_t end = row.find('\t', start);
      fields.push_back(row.substr(start, end == std::string::npos ? end : end - start));
      if (end == std::string::npos) break;
      start = end + 1;
    }
    if (fields.size() != 5) throw std::runtime_error("Invalid escape fixture");
    UErrorCode status = U_ZERO_ERROR;
    icu::MessageFormat formatter("", icu::Locale::getEnglish(), status);
    formatter.applyPattern(icu::UnicodeString::fromUTF8(fields[3]), UMSGPAT_APOS_DOUBLE_OPTIONAL, nullptr, status);
    if (fields[4] == "!PARSE_ERROR") {
      if (U_SUCCESS(status)) throw std::runtime_error("ICU4C accepted invalid pattern: " + row);
      checked++;
      continue;
    }
    const icu::UnicodeString names[] = {"0", "1", "2", "n", "g", "x", "name"};
    const icu::Formattable values[] = {
        int32_t{3}, icu::UnicodeString("x"), icu::UnicodeString("Y"),
        int32_t{std::stoi(fields[1])}, icu::UnicodeString::fromUTF8(fields[2]),
        icu::UnicodeString("X"), icu::UnicodeString("Ada")};
    icu::UnicodeString output;
    formatter.format(names, values, 7, output, status);
    std::string actual;
    output.toUTF8String(actual);
    if (U_FAILURE(status) || actual != fields[4]) {
      std::cerr << "ICU4C escape mismatch: " << u_errorName(status) << ": " << row << "; got " << actual << '\n';
      return 1;
    }
    checked++;
  }
  if (!checked) throw std::runtime_error("Empty escape fixtures");
  std::cout << checked << " ICU4C escape cases verified\n";
}
