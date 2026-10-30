#include <unicode/brkiter.h>
#include <unicode/locid.h>
#include <unicode/unistr.h>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

static_assert(U_ICU_VERSION_MAJOR_NUM == 78 && U_ICU_VERSION_MINOR_NUM == 1);

int main() {
  const char *path = std::getenv("SEGMENTER_FIXTURES");
  if (!path) throw std::runtime_error("Missing Segmenter fixtures");
  std::ifstream input(path);
  std::string row;
  std::getline(input, row);
  size_t checked = 0, differences = 0;
  while (std::getline(input, row)) {
    std::istringstream stream(row);
    std::vector<std::string> fields;
    std::string field;
    while (std::getline(stream, field, '\t')) fields.push_back(field);
    if (fields.size() != 4) throw std::runtime_error(row);
    icu::UnicodeString text;
    if (fields[2] != "_") {
      if (fields[2].size() % 4) throw std::runtime_error("Invalid UTF-16 fixture");
      for (size_t i = 0; i < fields[2].size(); i += 4)
        text.append(static_cast<UChar>(std::stoul(fields[2].substr(i, 4), nullptr, 16)));
    }
    UErrorCode status = U_ZERO_ERROR;
    auto locale = icu::Locale::forLanguageTag(fields[0], status);
    std::unique_ptr<icu::BreakIterator> iterator(
        fields[1] == "grapheme" ? icu::BreakIterator::createCharacterInstance(locale, status)
        : fields[1] == "word" ? icu::BreakIterator::createWordInstance(locale, status)
        : icu::BreakIterator::createSentenceInstance(locale, status));
    if (U_FAILURE(status) || !iterator) throw std::runtime_error("ICU4C setup failed");
    iterator->setText(text);
    std::string actual;
    int32_t start = iterator->first();
    for (int32_t end = iterator->next(); end != icu::BreakIterator::DONE; end = iterator->next()) {
      if (!actual.empty()) actual += ',';
      auto word = fields[1] == "word" ? (iterator->getRuleStatus() >= UBRK_WORD_NUMBER ? "1" : "0") : "-";
      actual += std::to_string(start) + ":" + std::to_string(end) + ":" + word;
      start = end;
    }
    if (start != text.length()) throw std::runtime_error("Incomplete UTF-16 coverage");
    if (actual.empty()) actual = "-";
    if (actual != fields[3]) {
      ++differences;
      std::cout << "DIFF\ticu4c\t" << row << '\t' << actual << '\n';
    }
    ++checked;
  }
  if (checked != 1770 || differences) throw std::runtime_error("Segmenter oracle mismatch");
}
