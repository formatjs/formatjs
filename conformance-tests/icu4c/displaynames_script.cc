#include <unicode/uldnames.h>
#include <unicode/unistr.h>
#include <unicode/uvernum.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int main() {
  static_assert(U_ICU_VERSION_MAJOR_NUM == 79 && U_ICU_VERSION_MINOR_NUM == 1);
  const char* path = std::getenv("DISPLAYNAMES_SCRIPT_FIXTURES");
  if (!path) throw std::runtime_error("Missing DisplayNames fixtures");
  std::ifstream input(path);
  if (!input) throw std::runtime_error("Cannot read DisplayNames fixtures");
  std::string row;
  std::getline(input, row);
  int checked = 0;
  int differences = 0;
  while (std::getline(input, row)) {
    std::vector<std::string> fields;
    size_t start = 0;
    while (true) {
      size_t end = row.find('\t', start);
      fields.push_back(row.substr(start, end == std::string::npos ? end : end - start));
      if (end == std::string::npos) break;
      start = end + 1;
    }
    if (fields.size() != 8) throw std::runtime_error("Invalid DisplayNames fixture");
    UDisplayContext contexts[] = {
        fields[1] == "short" ? UDISPCTX_LENGTH_SHORT : UDISPCTX_LENGTH_FULL,
        fields[2] == "dialect" ? UDISPCTX_DIALECT_NAMES : UDISPCTX_STANDARD_NAMES,
        fields[3] == "none" ? UDISPCTX_NO_SUBSTITUTE : UDISPCTX_SUBSTITUTE};
    UErrorCode status = U_ZERO_ERROR;
    ULocaleDisplayNames* names = uldn_openForContext(fields[0].c_str(), contexts, 3, &status);
    if (U_FAILURE(status) || !names) throw std::runtime_error("ICU4C DisplayNames setup failed");
    UChar buffer[1024] = {};
    std::string code = fields[4];
    for (char& ch : code) if (ch == '-') ch = '_';
    int32_t length = uldn_localeDisplayName(names, code.c_str(), buffer, 1024, &status);
    uldn_close(names);
    std::string actual;
    if (length <= 0 && fields[3] == "none") actual = "!NONE";
    else icu::UnicodeString(buffer, length).toUTF8String(actual);
    if ((U_FAILURE(status) && !(fields[7] == "!NONE" && status == U_ILLEGAL_ARGUMENT_ERROR)) || actual != fields[7]) {
      std::cerr << "ICU4C DisplayNames mismatch: " << row << "; got " << actual << "; " << u_errorName(status) << '\n';
      differences++;
    }
    checked++;
  }
  if (!checked) throw std::runtime_error("Empty DisplayNames fixtures");
  std::cout << checked << " ICU4C script display names checked; " << differences << " differences\n";
  return differences ? 1 : 0;
}
