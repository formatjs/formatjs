#pragma once
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

typedef struct FormatjsSegmenterHandle FormatjsSegmenterHandle;
typedef struct FormatjsSegmentsHandle FormatjsSegmentsHandle;
typedef struct FormatjsSegmentCursorHandle FormatjsSegmentCursorHandle;
typedef struct { uint8_t *data; size_t len; } FormatjsSegmenterBytes;

// 0 success, 1 RangeError/data error, 2 invalid ABI input, 3 caught panic.
// Inputs borrowed for call only. Destroy handles and free successful output once.
int32_t formatjs_segmenter_match(const uint8_t *, size_t, FormatjsSegmenterBytes *);
int32_t formatjs_segmenter_create(const uint8_t *locale, size_t locale_len,
    const uint8_t *options, size_t options_len, FormatjsSegmenterHandle **);
int32_t formatjs_segmenter_resolved(const FormatjsSegmenterHandle *, FormatjsSegmenterBytes *);
int32_t formatjs_segmenter_segment(const FormatjsSegmenterHandle *, const uint8_t *units_json,
    size_t json_len, FormatjsSegmentsHandle **);
int32_t formatjs_segments_containing(const FormatjsSegmentsHandle *, size_t index, FormatjsSegmenterBytes *);
int32_t formatjs_segments_cursor(const FormatjsSegmentsHandle *, FormatjsSegmentCursorHandle **);
int32_t formatjs_segment_cursor_next(FormatjsSegmentCursorHandle *, FormatjsSegmenterBytes *);
void formatjs_segmenter_destroy(FormatjsSegmenterHandle *);
void formatjs_segments_destroy(FormatjsSegmentsHandle *);
void formatjs_segment_cursor_destroy(FormatjsSegmentCursorHandle *);
void formatjs_segmenter_bytes_free(FormatjsSegmenterBytes);
#ifdef __cplusplus
}
#endif
