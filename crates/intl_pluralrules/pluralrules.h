#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsPluralRegistry FormatjsPluralRegistry;
typedef struct FormatjsPluralHandle FormatjsPluralHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsPluralBytes;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic,
// 4 TypeError. Inputs borrowed for call only. Handles/output belong to caller.
int32_t formatjs_plural_registry_create(FormatjsPluralRegistry **out);
int32_t formatjs_plural_registry_load(FormatjsPluralRegistry *, const uint8_t *, size_t);
int32_t formatjs_plural_registry_info(const FormatjsPluralRegistry *, FormatjsPluralBytes *out);
int32_t formatjs_plural_registry_match(const FormatjsPluralRegistry *, const uint8_t *request,
    size_t request_len, FormatjsPluralBytes *out);
int32_t formatjs_plural_create(const FormatjsPluralRegistry *, const uint8_t *locale,
    size_t locale_len, const uint8_t *options, size_t options_len, FormatjsPluralHandle **out);
int32_t formatjs_plural_query(const FormatjsPluralHandle *, const uint8_t *query,
    size_t query_len, FormatjsPluralBytes *out);
void formatjs_plural_registry_destroy(FormatjsPluralRegistry *);
void formatjs_plural_destroy(FormatjsPluralHandle *);
void formatjs_plural_bytes_free(FormatjsPluralBytes);

#ifdef __cplusplus
}
#endif
