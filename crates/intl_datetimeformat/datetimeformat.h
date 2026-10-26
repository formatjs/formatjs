#pragma once
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsDateTimeRegistry FormatjsDateTimeRegistry;
typedef struct FormatjsDateTimeConstruction FormatjsDateTimeConstruction;
typedef struct FormatjsDateTimeHandle FormatjsDateTimeHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsDateTimeBytes;
typedef struct { const uint8_t *data; size_t len; } FormatjsDateTimeBorrowed;
typedef int32_t (*FormatjsDateTimeCalendarCall)(void *, int64_t, FormatjsDateTimeBorrowed *);
typedef void (*FormatjsDateTimeCalendarRelease)(void *);

// Status: 0 success, 1 RangeError/data, 2 invalid ABI/state, 3 panic,
// 4 TypeError, 5 foreign calendar exception. Handles stay on their creating thread.
// Input borrowed for call only. Destroy handles and free successful bytes once.
int32_t formatjs_datetime_registry_create(FormatjsDateTimeRegistry **out);
// Kind: 0 base locale, 1 calendar locale patch, 2 timezone transitions.
int32_t formatjs_datetime_registry_load(const FormatjsDateTimeRegistry *, uint32_t kind, const uint8_t *, size_t);
int32_t formatjs_datetime_registry_info(const FormatjsDateTimeRegistry *, FormatjsDateTimeBytes *out);
// Default timezone JSON string; null resets UTC.
int32_t formatjs_datetime_registry_zone(const FormatjsDateTimeRegistry *, const uint8_t *, size_t);
int32_t formatjs_datetime_supported(const FormatjsDateTimeRegistry *, const uint8_t *, size_t, FormatjsDateTimeBytes *out);
// When release is supplied, context transfers on entry, including rejected calls.
// Call/release must not unwind. Callback: 0 JSON fields, nonzero foreign failure.
// Callback bytes remain readable until its next call or release; Rust does not free them.
int32_t formatjs_datetime_registry_calendar(const FormatjsDateTimeRegistry *, const uint8_t *name, size_t,
    void *context, FormatjsDateTimeCalendarCall, FormatjsDateTimeCalendarRelease);

// Begin before JS locale/options coercion; subsequent phases are ordered.
int32_t formatjs_datetime_begin(const FormatjsDateTimeRegistry *, FormatjsDateTimeConstruction **out);
int32_t formatjs_datetime_resolve(FormatjsDateTimeConstruction *, const uint8_t *, size_t);
int32_t formatjs_datetime_zone(FormatjsDateTimeConstruction *, const uint8_t *, size_t);
int32_t formatjs_datetime_capture(FormatjsDateTimeConstruction *, const uint8_t *, size_t);
// Finalization consumes captured state, including a valid attempt with invalid options.
int32_t formatjs_datetime_create(FormatjsDateTimeConstruction *, const uint8_t *, size_t, FormatjsDateTimeHandle **out);
// Query ops: resolved, format, parts, range, rangeParts.
// Values: number {value:string}, epoch {kind,value:string,calendar?}, plain {kind,iso}, zoned.
int32_t formatjs_datetime_query(const FormatjsDateTimeHandle *, const uint8_t *, size_t, FormatjsDateTimeBytes *out);
void formatjs_datetime_construction_destroy(FormatjsDateTimeConstruction *);
void formatjs_datetime_destroy(FormatjsDateTimeHandle *);
void formatjs_datetime_registry_destroy(FormatjsDateTimeRegistry *);
void formatjs_datetime_bytes_free(FormatjsDateTimeBytes);

#ifdef __cplusplus
}
#endif
