#ifndef FORMATJS_INTL_LOCALE_H
#define FORMATJS_INTL_LOCALE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsLocaleHandle FormatjsLocaleHandle;
typedef struct {
  uint8_t *data;
  size_t len;
} FormatjsLocaleBytes;

// Status: 0 success, 1 RangeError, 2 invalid ABI input, 3 Rust panic.
// All input strings are borrowed UTF-8. Options contain already-coerced values.
// The binding validates each string option before accessing the next property.
int32_t formatjs_locale_create(const uint8_t *tag, size_t tag_len,
                              const uint8_t *options, size_t options_len,
                              FormatjsLocaleHandle **out);
int32_t formatjs_locale_validate(const uint8_t *name, size_t name_len,
                                const uint8_t *value, size_t value_len);

// Query JSON: {"method":"properties"|"maximize"|"minimize"|"calendars"|
// "hourCycles"|"timeZones"|"textInfo"|"weekInfo"} or:
// {"method":"numberingSystems","defaultNumberingSystem": string|null}
// {"method":"collations","globalCollations":string[],"matched":bool,
//  "accepted":string[]}.
// Formatter observations are current at call time. Result is owned JSON UTF-8.
// Optional scalar properties encode null; the JS binding exposes undefined.
int32_t formatjs_locale_query(const FormatjsLocaleHandle *handle,
                             const uint8_t *query, size_t query_len,
                             FormatjsLocaleBytes *out);
// Destroy once after the last query. Null is accepted.
void formatjs_locale_destroy(FormatjsLocaleHandle *handle);
// Free each successful query result once. {null, 0} is accepted.
void formatjs_locale_bytes_free(FormatjsLocaleBytes bytes);

#ifdef __cplusplus
}
#endif
#endif
