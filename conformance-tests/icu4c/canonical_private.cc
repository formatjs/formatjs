#include <unicode/locid.h>
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
}
