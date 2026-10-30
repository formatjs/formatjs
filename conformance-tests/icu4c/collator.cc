#include <unicode/coll.h>

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

int main() {
  const auto *path = std::getenv("COLLATOR_CONFORMANCE_FIXTURES");
  if (!path) return 1;
  std::ifstream input(path);
  if (!input) return 1;
  std::string row;
  std::getline(input, row);
  size_t checked = 0;
  bool matches = true;
  while (std::getline(input, row)) {
    std::vector<std::string> fields;
    std::istringstream stream(row);
    for (std::string field; std::getline(stream, field, '\t');) fields.push_back(field);
    if (fields.size() != 9) return 1;
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(fields[1], status);
    std::unique_ptr<icu::Collator> collator(icu::Collator::createInstance(locale, status));
    if (U_FAILURE(status) || !collator) return 1;
    if (fields[2] == "base" || fields[2] == "case") {
      collator->setStrength(icu::Collator::PRIMARY);
    } else if (fields[2] == "accent") {
      collator->setStrength(icu::Collator::SECONDARY);
    } else if (fields[2] == "variant") {
      collator->setStrength(icu::Collator::TERTIARY);
    } else if (fields[2] != "-") {
      return 1;
    }
    if (fields[2] == "case") collator->setAttribute(UCOL_CASE_LEVEL, UCOL_ON, status);
    if (fields[3] != "-") {
      if (fields[3] != "true" && fields[3] != "false") return 1;
      collator->setAttribute(UCOL_NUMERIC_COLLATION, fields[3] == "true" ? UCOL_ON : UCOL_OFF, status);
    }
    if (fields[4] != "-") {
      if (fields[4] != "upper" && fields[4] != "lower" && fields[4] != "false") return 1;
      collator->setAttribute(UCOL_CASE_FIRST, fields[4] == "upper" ? UCOL_UPPER_FIRST : fields[4] == "lower" ? UCOL_LOWER_FIRST : UCOL_OFF, status);
    }
    if (fields[5] != "-") {
      if (fields[5] != "true" && fields[5] != "false") return 1;
      collator->setAttribute(UCOL_ALTERNATE_HANDLING, fields[5] == "true" ? UCOL_SHIFTED : UCOL_NON_IGNORABLE, status);
    }
    auto result = collator->compare(icu::UnicodeString::fromUTF8(fields[6]), icu::UnicodeString::fromUTF8(fields[7]), status);
    if (U_FAILURE(status)) return 1;
    int actual = result < 0 ? -1 : result > 0 ? 1 : 0;
    if (actual != std::stoi(fields[8])) {
      std::cerr << "ICU4C mismatch: " << row << " actual=" << actual << '\n';
      matches = false;
    }
    ++checked;
  }
  std::cout << checked << " ICU4C collator comparisons checked\n";
  return checked == 69 && matches ? 0 : 1;
}
