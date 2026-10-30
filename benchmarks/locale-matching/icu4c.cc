#include <unicode/localematcher.h>
#include <unicode/locid.h>
#include <unicode/uversion.h>

#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>
using icu::Locale;
using icu::LocaleMatcher;
static const Locale* volatile sink;
static std::vector<std::string> split(const std::string& text, char separator) {
  std::vector<std::string> result;
  size_t start = 0, end;
  while ((end = text.find(separator, start)) != std::string::npos) {
    result.push_back(text.substr(start, end - start));
    start = end + 1;
  }
  result.push_back(text.substr(start));
  return result;
}
static void check(UErrorCode error) {
  if (U_FAILURE(error)) throw std::runtime_error(u_errorName(error));
}
static std::vector<Locale> parse(const std::string& tags) {
  std::vector<Locale> result;
  for (auto& tag : split(tags, ',')) {
    UErrorCode error = U_ZERO_ERROR;
    auto locale = Locale::forLanguageTag(tag, error);
    check(error);
    result.push_back(Locale::createCanonical(locale.getName()));
  }
  return result;
}
static LocaleMatcher build(const std::string& tags) {
  auto supported = parse(tags);
  UErrorCode error = U_ZERO_ERROR;
  auto result = LocaleMatcher::Builder()
                    .setSupportedLocales(supported.begin(), supported.end())
                    .setDefaultLocale(&Locale::getEnglish())
                    .build(error);
  check(error);
  return result;
}
static const Locale* match(const LocaleMatcher& matcher,
                           std::vector<Locale>& requested) {
  UErrorCode error = U_ZERO_ERROR;
  Locale::RangeIterator<std::vector<Locale>::iterator> iterator(
      requested.begin(), requested.end());
  auto result = matcher.getBestMatch(iterator, error);
  check(error);
  return result;
}
static double elapsed(std::chrono::steady_clock::time_point start) {
  return std::chrono::duration<double, std::nano>(
             std::chrono::steady_clock::now() - start)
      .count();
}
int main(int argc, char** argv) {
  std::ifstream input(argv[1]);
  if (!input) throw std::runtime_error("Cannot open cases");
  std::map<std::string, std::string> sets;
  std::vector<std::vector<std::string>> rows;
  for (std::string line; std::getline(input, line);) {
    auto fields = split(line, '\t');
    if (fields[0] == "support")
      sets[fields[1]] = fields[2];
    else
      rows.push_back(fields);
  }
  if (argc > 2 && std::string(argv[2]) == "--once") {
    auto matcher = build(sets["full"]);
    auto desired = parse("en");
    UErrorCode error = U_ZERO_ERROR;
    std::cout << match(matcher, desired)->toLanguageTag<std::string>(error)
              << '\n';
    check(error);
    return 0;
  }
  const size_t count = argc > 2 ? std::stoull(argv[2]) : 200000;
  UVersionInfo version;
  u_getVersion(version);
  char versionString[U_MAX_VERSION_STRING_LENGTH];
  u_versionToString(version, versionString);
  std::cerr << "ICU4C " << versionString << "; iterations " << count << '\n';
  for (auto& [name, tags] : sets) {
    for (int i = 0; i < 1000; i++) {
      auto matcher = build(tags);
      asm volatile("" : : "g"(&matcher) : "memory");
    }
    auto start = std::chrono::steady_clock::now();
    for (int i = 0; i < 100; i++) {
      auto matcher = build(tags);
      asm volatile("" : : "g"(&matcher) : "memory");
    }
    std::cout << "icu4c\tconstruct\t" << name << '\t' << elapsed(start) / 100.0
              << "\t-\n";
  }
  for (auto& row : rows) {
    auto matcher = build(sets[row[2]]);
    auto desired = parse(row[3]);
    UErrorCode error = U_ZERO_ERROR;
    auto expected = match(matcher, desired)->toLanguageTag<std::string>(error);
    check(error);
    const bool cycle = row[0] == "cycle";
    const size_t iterations =
        cycle ? std::max<size_t>(1000, count / 20) : count;
    auto tags = split(row[3], ',');
    for (bool prepared : {true, false}) {
      auto work = [&](size_t i) {
        if (prepared && cycle) {
          UErrorCode status = U_ZERO_ERROR;
          sink = matcher.getBestMatch(desired[i % desired.size()], status);
          check(status);
        } else if (prepared) {
          asm volatile("" : : "g"(&desired) : "memory");
          sink = match(matcher, desired);
        } else {
          auto parsed = parse(cycle ? tags[i % tags.size()] : row[3]);
          sink = match(matcher, parsed);
        }
      };
      for (size_t i = 0; i < iterations; i++) work(i);
      auto start = std::chrono::steady_clock::now();
      for (size_t i = 0; i < iterations; i++) work(i);
      std::cout << "icu4c\t" << (prepared ? "prepared" : "strings") << '\t'
                << row[1] << '\t' << elapsed(start) / iterations << '\t'
                << expected << '\n';
    }
  }
}
