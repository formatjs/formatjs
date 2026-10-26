//! One Rust static archive for the SDK. Each polyfill keeps its own crate;
//! consumers link one copy of Rust's allocator and standard library.

pub use formatjs_intl_getcanonicallocales::{
    formatjs_canonicalize_locale, formatjs_locale_result_free,
};
pub use formatjs_intl_locale::ffi::{
    formatjs_locale_bytes_free, formatjs_locale_create, formatjs_locale_destroy,
    formatjs_locale_query, formatjs_locale_validate,
};
pub use formatjs_intl_pluralrules::ffi::{
    formatjs_plural_bytes_free, formatjs_plural_create, formatjs_plural_destroy,
    formatjs_plural_query, formatjs_plural_registry_create, formatjs_plural_registry_destroy,
    formatjs_plural_registry_info, formatjs_plural_registry_load,
};
pub use formatjs_intl_supportedvaluesof::ffi::{
    formatjs_supported_values_of, formatjs_values_free,
};
