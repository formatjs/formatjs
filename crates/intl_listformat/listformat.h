#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsListRegistry FormatjsListRegistry;
typedef struct FormatjsListHandle FormatjsListHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsListBytes;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic. Inputs borrowed for call only. Handles/output belong to caller.
int32_t formatjs_list_registry_create(FormatjsListRegistry **out);
int32_t formatjs_list_registry_load(FormatjsListRegistry *, const uint8_t *, size_t);
int32_t formatjs_list_registry_info(const FormatjsListRegistry *, FormatjsListBytes *out);
int32_t formatjs_list_registry_match(const FormatjsListRegistry *, const uint8_t *request,
    size_t request_len, FormatjsListBytes *out);
int32_t formatjs_list_create(const FormatjsListRegistry *, const uint8_t *locale,
    size_t locale_len, const uint8_t *options, size_t options_len, FormatjsListHandle **out);
int32_t formatjs_list_query(const FormatjsListHandle *, const uint8_t *query,
    size_t query_len, FormatjsListBytes *out);
void formatjs_list_registry_destroy(FormatjsListRegistry *);
void formatjs_list_destroy(FormatjsListHandle *);
void formatjs_list_bytes_free(FormatjsListBytes);

#ifdef __cplusplus
}
#endif
