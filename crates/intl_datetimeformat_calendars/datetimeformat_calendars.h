#pragma once
#include <formatjs/intl/datetimeformat.h>
#ifdef __cplusplus
extern "C" {
#endif
// Load one validated arithmetic/table pack. Status matches DateTimeFormat ABI.
// Provider and locale patch registration remain independent.
int32_t formatjs_datetime_calendar_load(const FormatjsDateTimeRegistry *, const uint8_t *, size_t);
#ifdef __cplusplus
}
#endif
