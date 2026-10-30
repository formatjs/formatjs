#include <unicode/locid.h>
#include <unicode/localebuilder.h>
#include <sstream>
#include <vector>
#include <cstdlib>
#include <fstream>
#include <stdexcept>
#include <string>

int main() {
  const char *path = std::getenv("CANONICAL_PRIVATE_FIXTURES");
  if (!path) throw std::runtime_error("Missing canonical fixtures");
  std::ifstream input(path);
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  while (std::getline(input, row)) {
    auto tab = row.find('\t');
    if (tab == std::string::npos) throw std::runtime_error(row);
    auto tag = row.substr(0, tab), expected = row.substr(tab + 1);
    UErrorCode status = U_ZERO_ERROR;
    auto parsed = icu::Locale::forLanguageTag(tag, status);
    auto canonical = icu::Locale::createCanonical(parsed.getName());
    auto actual = canonical.toLanguageTag<std::string>(status);
    if (U_FAILURE(status) || actual != expected)
      throw std::runtime_error(row + " actual=" + actual);
    ++checked;
  }
  if (checked != 21) throw std::runtime_error("Unexpected fixture count");
  const char *optionsPath = std::getenv("LOCALE_EXTENSION_OPTIONS_FIXTURES");
  if (!optionsPath) throw std::runtime_error("Missing option fixtures");
  std::ifstream optionsInput(optionsPath);
  std::getline(optionsInput, row);
  checked = 0;
  while (std::getline(optionsInput, row)) {
    std::istringstream fieldsInput(row);
    std::vector<std::string> fields;
    std::string field;
    while (std::getline(fieldsInput, field, '\t')) fields.push_back(field);
    if (fields.size() != 4) throw std::runtime_error(row);
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::LocaleBuilder().setLanguageTag(fields[0])
        .setUnicodeLocaleKeyword(fields[1], fields[2]).build(status);
    auto canonical = icu::Locale::createCanonical(locale.getName());
    auto actual = canonical.toLanguageTag<std::string>(status);
    if (U_FAILURE(status) || actual != fields[3])
      throw std::runtime_error(row + " actual=" + actual);
    ++checked;
  }
  if (checked != 12) throw std::runtime_error("Unexpected option fixture count");
}
