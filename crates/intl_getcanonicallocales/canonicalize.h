#ifndef FORMATJS_CANONICALIZE_H
#define FORMATJS_CANONICALIZE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsLocaleResult {
  uint8_t *data;
  size_t len;
} FormatjsLocaleResult;

// Returns 0 on success, 1 for an invalid locale, 2 for invalid input, 3 on panic.
// Input is borrowed. Successful output must be freed exactly once below.
int32_t formatjs_canonicalize_locale(
    const uint8_t *input, size_t len, FormatjsLocaleResult *out);
void formatjs_locale_result_free(FormatjsLocaleResult result);

#ifdef __cplusplus
}
#endif

#endif
