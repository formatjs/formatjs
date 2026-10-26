#pragma once
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
typedef struct FormatjsCollatorHandle FormatjsCollatorHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsCollatorBytes;
// 0 success, 1 RangeError/data error, 2 malformed ABI input, 3 caught panic.
// Inputs borrowed for call only. Destroy handles/free successful output once.
int32_t formatjs_collator_resolve(const uint8_t *, size_t, FormatjsCollatorBytes *);
int32_t formatjs_collator_create(const uint8_t *, size_t, FormatjsCollatorHandle **);
int32_t formatjs_collator_supported(const uint8_t *, size_t, FormatjsCollatorBytes *);
int32_t formatjs_collator_query(const FormatjsCollatorHandle *, const uint8_t *, size_t, FormatjsCollatorBytes *);
void formatjs_collator_destroy(FormatjsCollatorHandle *);
void formatjs_collator_bytes_free(FormatjsCollatorBytes);
#ifdef __cplusplus
}
#endif
