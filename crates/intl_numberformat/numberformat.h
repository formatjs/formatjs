#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsNumberRegistry FormatjsNumberRegistry;
typedef struct FormatjsNumberHandle FormatjsNumberHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsNumberBytes;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic,
// 4 TypeError. Inputs borrowed for call only. Handles/output belong to caller.
int32_t formatjs_number_registry_create(FormatjsNumberRegistry **out);
int32_t formatjs_number_registry_load(FormatjsNumberRegistry *, const uint8_t *, size_t);
int32_t formatjs_number_registry_units(const FormatjsNumberRegistry *, const uint8_t *, size_t);
int32_t formatjs_number_registry_info(const FormatjsNumberRegistry *, FormatjsNumberBytes *out);
int32_t formatjs_number_resolve(const FormatjsNumberRegistry *, const uint8_t *request,
    size_t request_len, FormatjsNumberHandle **out);
int32_t formatjs_number_create(const FormatjsNumberHandle *resolved, const uint8_t *options,
    size_t options_len, FormatjsNumberHandle **out);
int32_t formatjs_number_supported(const FormatjsNumberRegistry *, const uint8_t *request,
    size_t request_len, FormatjsNumberBytes *out);
int32_t formatjs_number_query(const FormatjsNumberHandle *, const uint8_t *query,
    size_t query_len, FormatjsNumberBytes *out);
void formatjs_number_registry_destroy(FormatjsNumberRegistry *);
void formatjs_number_destroy(FormatjsNumberHandle *);
void formatjs_number_bytes_free(FormatjsNumberBytes);

#ifdef __cplusplus
}
#endif
