#ifndef FORMATJS_SUPPORTED_VALUES_H
#define FORMATJS_SUPPORTED_VALUES_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum FormatjsValueKey {
  FORMATJS_CALENDAR = 0,
  FORMATJS_COLLATION = 1,
  FORMATJS_CURRENCY = 2,
  FORMATJS_NUMBERING_SYSTEM = 3,
  FORMATJS_TIME_ZONE = 4,
  FORMATJS_UNIT = 5
} FormatjsValueKey;

typedef struct FormatjsBorrowedString {
  const uint8_t *data;
  size_t len;
} FormatjsBorrowedString;

typedef struct FormatjsValueProbeResult {
  FormatjsBorrowedString resolved;
  FormatjsBorrowedString formatted;
} FormatjsValueProbeResult;

typedef struct FormatjsValuesResult {
  uint8_t *data;
  size_t len;
} FormatjsValuesResult;

// Observation strings are borrowed until the next callback; null means absent.
// Return 0 on success, 1 for unsupported/formatter errors, 2 for ABI faults.
// Exceptions must be caught inside the callback.
typedef int32_t (*FormatjsValueProbe)(void *context, uint32_t key,
    FormatjsBorrowedString value, FormatjsBorrowedString locale,
    FormatjsValueProbeResult *out);

// Return 0 on success, 1 for an invalid key, 2 for ABI faults, 3 on Rust panic.
// Output is sorted, unique UTF-8 identifiers separated by newlines, without a
// trailing newline. Free successful output exactly once with formatjs_values_free.
int32_t formatjs_supported_values_of(const uint8_t *key, size_t len,
    FormatjsValueProbe probe, void *context, FormatjsValuesResult *out);
void formatjs_values_free(FormatjsValuesResult result);

#ifdef __cplusplus
}
#endif

#endif
