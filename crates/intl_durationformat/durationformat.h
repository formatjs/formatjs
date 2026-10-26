#pragma once
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsDurationRegistry FormatjsDurationRegistry;
typedef struct FormatjsDurationConstruction FormatjsDurationConstruction;
typedef struct FormatjsDurationHandle FormatjsDurationHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsDurationBytes;
typedef struct { double values[10]; uint16_t defined; } FormatjsDurationValue;

// Status: 0 success, 1 RangeError/data error, 2 invalid ABI input/phase,
// 3 panic, 4 TypeError, 5 Error (missing dependency data or invariant failure).
// JSON/input borrowed for call only. Destroy handles and free byte results once.
// Contexts are synchronized. Never destroy a handle during its calls.
int32_t formatjs_duration_registry_create(FormatjsDurationRegistry **out);
// Kind 0 NumberFormat, 1 ListFormat. Unit sidecars use {locale,data} JSON.
int32_t formatjs_duration_registry_load(const FormatjsDurationRegistry *, uint32_t kind, const uint8_t *, size_t);
int32_t formatjs_duration_registry_units(const FormatjsDurationRegistry *, const uint8_t *, size_t);
int32_t formatjs_duration_info(FormatjsDurationBytes *out);
// Supported/begin requests: {locales: string[], options: {localeMatcher?, numberingSystem?}}.
int32_t formatjs_duration_supported(const uint8_t *, size_t, FormatjsDurationBytes *out);
int32_t formatjs_duration_begin(const FormatjsDurationRegistry *, const uint8_t *, size_t, FormatjsDurationConstruction **out);
// Each style/display input is a JSON string or null (undefined/default).
// Call style once, then unit_style/unit_display pairs for indices 0..9.
// Indices/defined bits: years, months, weeks, days, hours, minutes, seconds,
// milliseconds, microseconds, nanoseconds. Finish reads fractionalDigits last.
int32_t formatjs_duration_style(FormatjsDurationConstruction *, const uint8_t *, size_t);
int32_t formatjs_duration_unit_style(FormatjsDurationConstruction *, uint32_t index, const uint8_t *, size_t);
int32_t formatjs_duration_unit_display(FormatjsDurationConstruction *, uint32_t index, const uint8_t *, size_t);
int32_t formatjs_duration_finish(FormatjsDurationConstruction *, uint8_t has_fractional_digits, double fractional_digits, FormatjsDurationHandle **out);
int32_t formatjs_duration_resolved(const FormatjsDurationHandle *, FormatjsDurationBytes *out);
// Initialize all values, including undefined fields. Mode 0 JSON string, 1 JSON parts.
// Handles retain context after registry destruction.
int32_t formatjs_duration_format(const FormatjsDurationHandle *, const FormatjsDurationValue *, uint32_t mode, FormatjsDurationBytes *out);
void formatjs_duration_registry_destroy(FormatjsDurationRegistry *);
void formatjs_duration_construction_destroy(FormatjsDurationConstruction *);
void formatjs_duration_destroy(FormatjsDurationHandle *);
void formatjs_duration_bytes_free(FormatjsDurationBytes);
#ifdef __cplusplus
}
#endif
