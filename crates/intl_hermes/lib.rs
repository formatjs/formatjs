//! One Rust static archive for the SDK. Each polyfill keeps its own crate;
//! consumers link one copy of Rust's allocator and standard library.

pub use formatjs_intl_getcanonicallocales::{
    formatjs_canonicalize_locale, formatjs_locale_result_free,
};
pub use formatjs_intl_locale::ffi::{
    formatjs_locale_bytes_free, formatjs_locale_create, formatjs_locale_destroy,
    formatjs_locale_query, formatjs_locale_transform, formatjs_locale_validate,
};
pub use formatjs_intl_pluralrules::ffi::{
    formatjs_plural_bytes_free, formatjs_plural_create, formatjs_plural_destroy,
    formatjs_plural_query, formatjs_plural_registry_create, formatjs_plural_registry_destroy,
    formatjs_plural_registry_info, formatjs_plural_registry_load, formatjs_plural_registry_match,
};
pub use formatjs_intl_supportedvaluesof::ffi::{
    formatjs_supported_values_of, formatjs_values_free,
};

pub use formatjs_intl_listformat::ffi::{
    formatjs_list_bytes_free, formatjs_list_create, formatjs_list_destroy, formatjs_list_query,
    formatjs_list_registry_create, formatjs_list_registry_destroy, formatjs_list_registry_info,
    formatjs_list_registry_load, formatjs_list_registry_match,
};

pub use formatjs_intl_displaynames::ffi::{
    formatjs_display_bytes_free, formatjs_display_create, formatjs_display_destroy,
    formatjs_display_query, formatjs_display_registry_create, formatjs_display_registry_destroy,
    formatjs_display_registry_info, formatjs_display_registry_load,
    formatjs_display_registry_match,
};

pub use formatjs_intl_segmenter::ffi::{
    formatjs_segment_cursor_destroy, formatjs_segment_cursor_next, formatjs_segmenter_bytes_free,
    formatjs_segmenter_create, formatjs_segmenter_destroy, formatjs_segmenter_match,
    formatjs_segmenter_resolved, formatjs_segmenter_segment, formatjs_segments_containing,
    formatjs_segments_cursor, formatjs_segments_destroy,
};

pub use formatjs_intl_collator::ffi::{
    formatjs_collator_bytes_free, formatjs_collator_create, formatjs_collator_destroy,
    formatjs_collator_query, formatjs_collator_resolve, formatjs_collator_supported,
};

pub use formatjs_intl_numberformat::ffi::{
    formatjs_number_bytes_free, formatjs_number_create, formatjs_number_destroy,
    formatjs_number_query, formatjs_number_registry_create, formatjs_number_registry_destroy,
    formatjs_number_registry_info, formatjs_number_registry_load, formatjs_number_registry_units,
    formatjs_number_resolve, formatjs_number_supported,
};

pub use formatjs_intl_relativetimeformat::ffi::{
    formatjs_relative_bytes_free, formatjs_relative_create, formatjs_relative_destroy,
    formatjs_relative_query, formatjs_relative_registry_create, formatjs_relative_registry_destroy,
    formatjs_relative_registry_info, formatjs_relative_registry_load, formatjs_relative_resolve,
    formatjs_relative_supported,
};

pub use formatjs_intl_datetimeformat::ffi::{
    formatjs_datetime_begin, formatjs_datetime_bytes_free, formatjs_datetime_capture,
    formatjs_datetime_construction_destroy, formatjs_datetime_create, formatjs_datetime_destroy,
    formatjs_datetime_query, formatjs_datetime_registry_calendar,
    formatjs_datetime_registry_create, formatjs_datetime_registry_destroy,
    formatjs_datetime_registry_info, formatjs_datetime_registry_load,
    formatjs_datetime_registry_zone, formatjs_datetime_resolve, formatjs_datetime_supported,
    formatjs_datetime_zone,
};
pub use formatjs_intl_datetimeformat_calendars::ffi::{
    formatjs_datetime_calendar_load, formatjs_datetime_calendar_load_compiled,
};

pub use formatjs_intl_durationformat::ffi::{
    formatjs_duration_begin, formatjs_duration_bytes_free, formatjs_duration_construction_destroy,
    formatjs_duration_destroy, formatjs_duration_finish, formatjs_duration_format,
    formatjs_duration_info, formatjs_duration_registry_create, formatjs_duration_registry_destroy,
    formatjs_duration_registry_load, formatjs_duration_registry_units, formatjs_duration_resolved,
    formatjs_duration_style, formatjs_duration_supported, formatjs_duration_unit_display,
    formatjs_duration_unit_style,
};
