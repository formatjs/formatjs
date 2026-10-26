#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsDisplayRegistry FormatjsDisplayRegistry;
typedef struct FormatjsDisplayHandle FormatjsDisplayHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsDisplayBytes;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic,
// 4 TypeError for missing type. Inputs borrowed for call only. Handles/output belong to caller.
int32_t formatjs_display_registry_create(FormatjsDisplayRegistry **out);
int32_t formatjs_display_registry_load(FormatjsDisplayRegistry *, const uint8_t *, size_t);
int32_t formatjs_display_registry_info(const FormatjsDisplayRegistry *, FormatjsDisplayBytes *out);
int32_t formatjs_display_registry_match(const FormatjsDisplayRegistry *, const uint8_t *request,
    size_t request_len, FormatjsDisplayBytes *out);
int32_t formatjs_display_create(const FormatjsDisplayRegistry *, const uint8_t *locale,
    size_t locale_len, const uint8_t *options, size_t options_len, FormatjsDisplayHandle **out);
int32_t formatjs_display_query(const FormatjsDisplayHandle *, const uint8_t *query,
    size_t query_len, FormatjsDisplayBytes *out);
void formatjs_display_registry_destroy(FormatjsDisplayRegistry *);
void formatjs_display_destroy(FormatjsDisplayHandle *);
void formatjs_display_bytes_free(FormatjsDisplayBytes);

#ifdef __cplusplus
}
#endif
