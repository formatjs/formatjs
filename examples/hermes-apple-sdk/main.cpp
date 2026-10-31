#include "formatjs/intl/canonicalize.h"

#include <cstring>

int main() {
  const char input[] = "iw-IL";
  const char expected[] = "he-IL";
  FormatjsLocaleResult result{};
  if (formatjs_canonicalize_locale(
          reinterpret_cast<const uint8_t *>(input), sizeof(input) - 1,
          &result) != 0) {
    return 1;
  }
  const bool valid = result.len == sizeof(expected) - 1 &&
      std::memcmp(result.data, expected, result.len) == 0;
  formatjs_locale_result_free(result);
  return valid ? 0 : 1;
}
