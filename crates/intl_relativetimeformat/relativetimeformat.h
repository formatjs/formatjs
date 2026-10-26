#pragma once
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsRelativeRegistry FormatjsRelativeRegistry;
typedef struct FormatjsRelativeHandle FormatjsRelativeHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsRelativeBytes;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 panic.
// Input borrowed for call only. Destroy successful handles and free bytes once.
int32_t formatjs_relative_registry_create(FormatjsRelativeRegistry **out);
int32_t formatjs_relative_registry_load(FormatjsRelativeRegistry *, const uint8_t *, size_t);
int32_t formatjs_relative_registry_info(const FormatjsRelativeRegistry *, FormatjsRelativeBytes *out);
int32_t formatjs_relative_resolve(const FormatjsRelativeRegistry *, const uint8_t *, size_t, FormatjsRelativeBytes *out);
int32_t formatjs_relative_create(const FormatjsRelativeRegistry *, const uint8_t *, size_t, FormatjsRelativeHandle **out);
int32_t formatjs_relative_supported(const FormatjsRelativeRegistry *, const uint8_t *, size_t, FormatjsRelativeBytes *out);
int32_t formatjs_relative_query(const FormatjsRelativeHandle *, const uint8_t *, size_t, FormatjsRelativeBytes *out);
void formatjs_relative_registry_destroy(FormatjsRelativeRegistry *);
void formatjs_relative_destroy(FormatjsRelativeHandle *);
void formatjs_relative_bytes_free(FormatjsRelativeBytes);

#ifdef __cplusplus
}
#endif
